import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import {
  pushTaskBranch,
  mergeTaskBranch,
  ensureTaskWorktree,
} from '../services/worktree.service.js';

function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}

describe('merge-branch cycle', () => {
  let rootDir: string;
  let bareDir: string;
  let gitMissing = false;

  beforeAll(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-test-repo-'));
    bareDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-test-bare-'));
    try {
      await git(['init', '-b', 'main', rootDir], '/');
      await git(['config', 'user.email', 'test@test.com'], rootDir);
      await git(['config', 'user.name', 'Test'], rootDir);
      await git(['commit', '--allow-empty', '-m', 'init'], rootDir);
      await git(['init', '--bare', bareDir], '/');
      await git(['remote', 'add', 'origin', bareDir], rootDir);
      await git(['push', '-u', 'origin', 'main'], rootDir);
    } catch {
      gitMissing = true;
    }
  });

  afterAll(() => {
    if (rootDir && fs.existsSync(rootDir)) fs.rmSync(rootDir, { recursive: true, force: true });
    if (bareDir && fs.existsSync(bareDir)) fs.rmSync(bareDir, { recursive: true, force: true });
  });

  const runIfGit = gitMissing ? it.skip : it;

  beforeEach(() => {
    process.env.NEXUS_PUSH_ENABLED = '0';
  });

  afterEach(() => {
    delete process.env.NEXUS_PUSH_ENABLED;
  });

  async function createBranch(id: string): Promise<void> {
    await git(['checkout', '-b', `task/${id}`], rootDir);
    fs.writeFileSync(path.join(rootDir, `${id}.txt`), id, 'utf8');
    await git(['add', '.'], rootDir);
    await git(['commit', '-m', `feat(${id}): add ${id}.txt`], rootDir);
    await git(['checkout', 'main'], rootDir);
  }

  // ----------------------------------------------------------------
  //  merge local (push OFF)
  // ----------------------------------------------------------------
  runIfGit('mergeTaskBranch: squash local sem push, branch deletada', async () => {
    await createBranch('T-M01');
    const before = (await git(['rev-list', '--count', 'main'], rootDir));
    await mergeTaskBranch('T-M01', { rootDir });
    const after = (await git(['rev-list', '--count', 'main'], rootDir));
    expect(Number(after)).toBe(Number(before) + 1);
    await expect(git(['rev-parse', '--verify', '--quiet', 'refs/heads/task/T-M01'], rootDir)).rejects.toThrow();
    expect(fs.existsSync(path.join(rootDir, 'T-M01.txt'))).toBe(true);
  });

  // ----------------------------------------------------------------
  //  push ON
  // ----------------------------------------------------------------
  runIfGit('pushTaskBranch envia branch ao remote; mergeTaskBranch empurra trunk e deleta branch remota', async () => {
    process.env.NEXUS_PUSH_ENABLED = '1';
    await createBranch('T-M02');
    await pushTaskBranch('T-M02', { rootDir });
    const remoteBranches = await git(['branch', '-r'], rootDir);
    expect(remoteBranches).toContain('origin/task/T-M02');

    await mergeTaskBranch('T-M02', { rootDir });
    const afterRemote = await git(['branch', '-r'], rootDir);
    expect(afterRemote).not.toContain('origin/task/T-M02');
    expect(afterRemote).toContain('origin/main');
  });

  // ----------------------------------------------------------------
  //  conflito
  // ----------------------------------------------------------------
  runIfGit('mergeTaskBranch com conflito lança erro e faz --abort (trunk limpa)', async () => {
    await createBranch('T-M03');
    fs.writeFileSync(path.join(rootDir, 'conflict.txt'), 'trunk', 'utf8');
    await git(['add', '.'], rootDir);
    await git(['commit', '-m', 'trunk change'], rootDir);

    await git(['checkout', 'task/T-M03'], rootDir);
    fs.writeFileSync(path.join(rootDir, 'conflict.txt'), 'branch', 'utf8');
    await git(['add', '.'], rootDir);
    await git(['commit', '-m', 'branch change'], rootDir);
    await git(['checkout', 'main'], rootDir);

    await expect(mergeTaskBranch('T-M03', { rootDir })).rejects.toThrow(/Conflito/);
    const status = await git(['status', '--porcelain'], rootDir);
    expect(status).toBe('');
  });

  // ----------------------------------------------------------------
  //  gate de push OFF
  // ----------------------------------------------------------------
  runIfGit('pushTaskBranch com NEXUS_PUSH_ENABLED=0 é no-op', async () => {
    process.env.NEXUS_PUSH_ENABLED = '0';
    await createBranch('T-M04');
    await pushTaskBranch('T-M04', { rootDir });
    const remoteBranches = await git(['branch', '-r'], rootDir);
    expect(remoteBranches).not.toContain('origin/task/T-M04');
  });

  // ----------------------------------------------------------------
  //  idempotência do push
  // ----------------------------------------------------------------
  runIfGit('pushTaskBranch chamado 2x com push ON não dá erro', async () => {
    process.env.NEXUS_PUSH_ENABLED = '1';
    await createBranch('T-M05');
    await pushTaskBranch('T-M05', { rootDir });
    await expect(pushTaskBranch('T-M05', { rootDir })).resolves.toBeUndefined();
  });

  // ----------------------------------------------------------------
  //  worktree removido pelo merge
  // ----------------------------------------------------------------
  runIfGit('mergeTaskBranch remove worktree existente', async () => {
    await createBranch('T-M06');
    const info = await ensureTaskWorktree('T-M06', { rootDir });
    expect(fs.existsSync(info.path)).toBe(true);
    await mergeTaskBranch('T-M06', { rootDir });
    expect(fs.existsSync(info.path)).toBe(false);
  });
});
