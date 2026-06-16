import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { ensureTaskWorktree, removeTaskWorktree } from '../services/worktree.service.js';

describe('WorktreeService', () => {
  let rootDir: string;
  let baseDir: string;
  let gitMissing = false;

  beforeAll(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worktree-test-repo-'));
    baseDir = path.join(rootDir, '../.nexus-worktrees');
    try {
      await new Promise<void>((resolve, reject) => {
        execFile(
          'git',
          ['init', rootDir],
          { cwd: '/' },
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });
      await new Promise<void>((resolve, reject) => {
        execFile(
          'git',
          ['config', 'user.email', 'test@test.com'],
          { cwd: rootDir },
          (err) => (err ? reject(err) : resolve()),
        );
      });
      await new Promise<void>((resolve, reject) => {
        execFile(
          'git',
          ['config', 'user.name', 'Test'],
          { cwd: rootDir },
          (err) => (err ? reject(err) : resolve()),
        );
      });
      await new Promise<void>((resolve, reject) => {
        execFile(
          'git',
          ['commit', '--allow-empty', '-m', 'init'],
          { cwd: rootDir },
          (err) => (err ? reject(err) : resolve()),
        );
      });
    } catch {
      gitMissing = true;
    }
  });

  afterAll(() => {
    if (baseDir && fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
    if (rootDir) {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  const runIfGit = gitMissing ? it.skip : it;

  runIfGit('ensureTaskWorktree cria branch e worktree', async () => {
    const info = await ensureTaskWorktree('T-1012', { rootDir, baseDir });
    expect(info.branch).toBe('task/T-1012');
    expect(info.path).toBe(path.join(baseDir, 'T-1012'));
    expect(fs.existsSync(info.path)).toBe(true);
  });

  runIfGit('ensureTaskWorktree é idempotente (chamar 2x retorna mesmo path)', async () => {
    const first = await ensureTaskWorktree('T-1013', { rootDir, baseDir });
    const second = await ensureTaskWorktree('T-1013', { rootDir, baseDir });
    expect(second.branch).toBe(first.branch);
    expect(second.path).toBe(first.path);
    expect(second.path).toBe(path.join(baseDir, 'T-1013'));
  });

  runIfGit('removeTaskWorktree limpa worktree e branch', async () => {
    await ensureTaskWorktree('T-1014', { rootDir, baseDir });
    expect(fs.existsSync(path.join(baseDir, 'T-1014'))).toBe(true);
    await removeTaskWorktree('T-1014', { rootDir, baseDir });
    expect(fs.existsSync(path.join(baseDir, 'T-1014'))).toBe(false);
  });

  runIfGit('removeTaskWorktree em worktree inexistente lança erro', async () => {
    await expect(
      removeTaskWorktree('T-9999', { rootDir, baseDir }),
    ).rejects.toThrow();
  });
});
