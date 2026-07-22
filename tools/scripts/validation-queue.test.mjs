import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { acquireValidationLease } from './lib/validation-queue.mjs';

const cli = path.resolve('tools/scripts/validation-queue.mjs');

function waitFor(predicate, timeoutMs = 5_000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error('timeout aguardando condição'));
      }
    }, 10);
  });
}

function run(cliArgs) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, ...cliArgs], { stdio: 'ignore' });
    child.on('exit', (code) => resolve(code));
  });
}

test('serializa comandos concorrentes em ordem FIFO', async () => {
  const root = path.join(tmpdir(), `mgtia-validation-${process.pid}-${Date.now()}`);
  const queue = path.join(root, 'queue');
  const log = path.join(root, 'events.log');
  const worker = path.join(root, 'worker.mjs');
  mkdirSync(root, { recursive: true });
  writeFileSync(worker, `
    import { appendFileSync } from 'node:fs';
    const [log, label, delay] = process.argv.slice(2);
    appendFileSync(log, 'start ' + label + '\\n');
    await new Promise((resolve) => setTimeout(resolve, Number(delay)));
    appendFileSync(log, 'end ' + label + '\\n');
  `, 'utf8');

  const base = ['run', '--queue-root', queue, '--repo', root, '--cwd', root];
  const first = run([...base, '--label', 'A', '--', process.execPath, worker, log, 'A', '250']);
  await waitFor(() => existsSync(path.join(queue, 'active', 'owner.json')));
  const second = run([...base, '--label', 'B', '--', process.execPath, worker, log, 'B', '10']);

  assert.deepEqual(await Promise.all([first, second]), [0, 0]);
  assert.deepEqual(readFileSync(log, 'utf8').trim().split('\n'), ['start A', 'end A', 'start B', 'end B']);
});

test('recupera owner abandonado', async () => {
  const root = path.join(tmpdir(), `mgtia-validation-stale-${process.pid}-${Date.now()}`);
  const queue = path.join(root, 'queue');
  const active = path.join(queue, 'active');
  mkdirSync(active, { recursive: true });
  writeFileSync(
    path.join(active, 'owner.json'),
    JSON.stringify({ token: 'morto', pid: 2_147_483_000, hostname: process.env.COMPUTERNAME, createdAt: new Date().toISOString() }),
    'utf8',
  );

  const code = await run([
    'run', '--queue-root', queue, '--repo', root, '--cwd', root, '--label', 'recovery', '--',
    process.execPath, '-e', 'process.exit(0)',
  ]);
  assert.equal(code, 0);
  assert.equal(existsSync(active), false);
});

test('token sem raiz não é tratado como reentrância', () => {
  const root = path.join(tmpdir(), `mgtia-validation-env-${process.pid}-${Date.now()}`);
  const queue = path.join(root, 'queue');
  const previousLease = process.env.MGTIA_VALIDATION_LEASE;
  const previousRoot = process.env.MGTIA_VALIDATION_QUEUE_ROOT;
  process.env.MGTIA_VALIDATION_LEASE = 'token-sem-raiz';
  delete process.env.MGTIA_VALIDATION_QUEUE_ROOT;

  try {
    const lease = acquireValidationLease({ repoDir: root, queueRoot: queue, label: 'env-test' });
    assert.equal(lease.reentrant, false);
    lease.release();
  } finally {
    if (previousLease === undefined) delete process.env.MGTIA_VALIDATION_LEASE;
    else process.env.MGTIA_VALIDATION_LEASE = previousLease;
    if (previousRoot === undefined) delete process.env.MGTIA_VALIDATION_QUEUE_ROOT;
    else process.env.MGTIA_VALIDATION_QUEUE_ROOT = previousRoot;
  }
});
