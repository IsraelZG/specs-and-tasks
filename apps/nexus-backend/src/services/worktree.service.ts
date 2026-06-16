import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface WorktreeInfo {
  branch: string;
  path: string;
}

export interface WorktreeOptions {
  rootDir?: string;
  baseDir?: string;
}

export interface MergeOptions {
  trunk?: string;
  commitMessage?: string;
}

function resolveRoot(opts?: WorktreeOptions): string {
  return opts?.rootDir ?? process.env.NEXUS_ROOT_DIR ?? process.cwd();
}

function resolveBase(opts?: WorktreeOptions): string {
  if (opts?.baseDir) return opts.baseDir;
  return process.env.NEXUS_WORKTREE_DIR ?? path.resolve(resolveRoot(opts), '../.nexus-worktrees');
}

function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`git ${args.join(' ')} falhou: ${stderr || err.message}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function getWorktreeList(cwd: string): Promise<string> {
  return git(['worktree', 'list', '--porcelain'], cwd);
}

function branchExists(branch: string, cwd: string): Promise<boolean> {
  return git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], cwd).then(
    () => true,
    () => false,
  );
}



export async function ensureTaskWorktree(
  id: string,
  opts?: WorktreeOptions,
): Promise<WorktreeInfo> {
  const rootDir = resolveRoot(opts);
  const baseDir = resolveBase(opts);
  const branch = `task/${id}`;
  const wtPath = path.join(baseDir, id);

  const list = await getWorktreeList(rootDir);
  const wtLine = `worktree ${path.resolve(wtPath)}`;
  if (list.split('\n').some((line) => line.replace(/\\/g, '/').trim() === wtLine.replace(/\\/g, '/'))) {
    return { branch, path: wtPath };
  }

  const exists = await branchExists(branch, rootDir);
  fs.mkdirSync(baseDir, { recursive: true });
  const addArgs = ['worktree', 'add', wtPath];
  if (!exists) {
    addArgs.push('-b', branch);
  } else {
    addArgs.push(branch);
  }

  await git(addArgs, rootDir);
  return { branch, path: wtPath };
}

export async function removeTaskWorktree(
  id: string,
  opts?: WorktreeOptions,
): Promise<void> {
  const rootDir = resolveRoot(opts);
  const baseDir = resolveBase(opts);
  const branch = `task/${id}`;
  const wtPath = path.join(baseDir, id);

  await git(['worktree', 'remove', wtPath], rootDir);
  await git(['branch', '-D', branch], rootDir);
}

async function resolveTrunk(opts?: WorktreeOptions & MergeOptions): Promise<string> {
  if (opts?.trunk) return opts.trunk;
  if (process.env.NEXUS_TRUNK_BRANCH) return process.env.NEXUS_TRUNK_BRANCH;
  const stdout = await git(['rev-parse', '--abbrev-ref', 'HEAD'], resolveRoot(opts));
  return stdout.trim();
}

export async function pushTaskBranch(
  id: string,
  opts?: WorktreeOptions,
): Promise<void> {
  if (process.env.NEXUS_PUSH_ENABLED !== '1') return;
  const rootDir = resolveRoot(opts);
  const branch = `task/${id}`;
  try {
    await git(['push', '-u', 'origin', branch], rootDir);
  } catch (err) {
    console.warn(`[worktree] push da branch ${branch} falhou:`, err);
  }
}

export async function mergeTaskBranch(
  id: string,
  opts?: WorktreeOptions & MergeOptions,
): Promise<void> {
  const rootDir = resolveRoot(opts);
  const branch = `task/${id}`;
  const trunk = await resolveTrunk(opts);
  const commitMessage = opts?.commitMessage ?? `feat(${id}): merge squash`;
  const baseDir = resolveBase(opts);
  const wtPath = path.join(baseDir, id);
  const pushEnabled = process.env.NEXUS_PUSH_ENABLED === '1';

  await git(['checkout', trunk], rootDir);

  if (pushEnabled) {
    try {
      await git(['pull', '--ff-only'], rootDir);
    } catch {
      // best-effort: if no upstream, continue
    }
  }

  try {
    await git(['merge', '--squash', branch], rootDir);
  } catch (err) {
    await git(['reset', '--hard', 'HEAD'], rootDir);
    await git(['clean', '-fd'], rootDir);
    throw new Error(`Conflito ao fazer squash merge de ${branch} em ${trunk}: resolução manual necessária`);
  }

  await git(['commit', '-m', commitMessage], rootDir);

  if (pushEnabled) {
    try {
      await git(['push'], rootDir);
    } catch {
      console.warn(`[worktree] push da trunk ${trunk} falhou`);
    }
  }

  if (fs.existsSync(wtPath)) {
    try {
      await git(['worktree', 'remove', wtPath], rootDir);
    } catch {
      // worktree may be gone already
    }
  }

  await git(['branch', '-D', branch], rootDir);

  if (pushEnabled) {
    try {
      await git(['push', 'origin', '--delete', branch], rootDir);
    } catch {
      console.warn(`[worktree] delete remoto da branch ${branch} falhou`);
    }
  }
}
