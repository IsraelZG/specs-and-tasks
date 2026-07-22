import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const worktreeScript = path.resolve('tools/scripts/worktree.mjs');

function run(command, args, cwd, env = {}) {
  const executable = process.platform === 'win32' && command === 'git' ? 'git.exe' : command;
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'mgtia-merge-'));
  const origin = path.join(root, 'origin.git');
  const repo = path.join(root, 'superapp');
  mkdirSync(origin);
  run('git', ['init', '--bare', '--initial-branch=master'], origin);
  run('git', ['clone', origin, repo], root);
  run('git', ['config', 'user.name', 'MGTIA Test'], repo);
  run('git', ['config', 'user.email', 'mgtia@example.invalid'], repo);
  writeFileSync(path.join(repo, 'base.txt'), 'base\n');
  run('git', ['add', 'base.txt'], repo);
  run('git', ['commit', '-m', 'base'], repo);
  run('git', ['push', '-u', 'origin', 'master'], repo);
  return { root, origin, repo };
}

function makeTaskBranch(repo, id, file) {
  run('git', ['checkout', '-b', `task/${id}`], repo);
  writeFileSync(path.join(repo, file), `${id}\n`);
  run('git', ['add', file], repo);
  run('git', ['commit', '-m', id], repo);
  run('git', ['checkout', 'master'], repo);
}

function integrate(repo, id, gateScript) {
  return spawnSync(
    process.execPath,
    [worktreeScript, 'merge', id, '--', process.execPath, gateScript],
    {
      cwd: path.resolve('.'),
      encoding: 'utf8',
      env: { ...process.env, SUPERAPP_DIR: repo },
    },
  );
}

test('gate vermelho aborta candidato e preserva exatamente a master base', () => {
  const { root, repo } = fixture();
  const gate = path.join(root, 'gate-fail.mjs');
  writeFileSync(gate, 'process.exit(7);\n');
  makeTaskBranch(repo, 'T-FAIL', 'fail.txt');
  const baseHead = run('git', ['rev-parse', 'HEAD'], repo);

  const result = integrate(repo, 'T-FAIL', gate);
  assert.notEqual(result.status, 0);
  assert.equal(run('git', ['rev-parse', 'HEAD'], repo), baseHead);
  assert.equal(existsSync(path.join(repo, 'fail.txt')), false);
  assert.notEqual(spawnSync('git.exe', ['rev-parse', '--verify', '--quiet', 'MERGE_HEAD'], { cwd: repo }).status, 0);
});

test('gate verde cria e publica um único merge commit', () => {
  const { root, origin, repo } = fixture();
  const gate = path.join(root, 'gate-ok.mjs');
  writeFileSync(gate, 'process.exit(0);\n');
  makeTaskBranch(repo, 'T-OK', 'ok.txt');

  const result = integrate(repo, 'T-OK', gate);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(existsSync(path.join(repo, 'ok.txt')), true);
  assert.equal(run('git', ['rev-list', '--parents', '-n', '1', 'HEAD'], repo).split(' ').length, 3);
  assert.equal(run('git', ['rev-parse', 'HEAD'], repo), run('git', ['--git-dir', origin, 'rev-parse', 'master'], root));
});
