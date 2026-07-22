import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { hostname } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const sleeper = new Int32Array(new SharedArrayBuffer(4));
const DEFAULT_TIMEOUT_MS = 6 * 60 * 60 * 1000;
const DEFAULT_STALE_MS = 12 * 60 * 60 * 1000;

function sleep(ms) {
  Atomics.wait(sleeper, 0, 0, ms);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function pidIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

function resolveGitCommonDir(repoDir) {
  const result = spawnSync(
    'git',
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    { cwd: repoDir, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(`fila de validação: ${repoDir} não é um checkout Git`);
  }
  const value = result.stdout.trim();
  return path.isAbsolute(value) ? value : path.resolve(repoDir, value);
}

export function validationQueueRoot(repoDir) {
  return path.join(resolveGitCommonDir(repoDir), 'mgtia-validation-queue');
}

function safeRemove(target, queueRoot) {
  const resolvedRoot = path.resolve(queueRoot);
  const resolvedTarget = path.resolve(target);
  if (resolvedTarget === resolvedRoot || !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`fila de validação: recusa remover path fora da fila: ${resolvedTarget}`);
  }
  rmSync(resolvedTarget, { recursive: true, force: true });
}

function ownerIsStale(owner, ownerFile, staleMs) {
  if (!owner) {
    try {
      return Date.now() - statSync(ownerFile).mtimeMs > 10_000;
    } catch {
      return true;
    }
  }
  if (String(owner.hostname).toLowerCase() === hostname().toLowerCase()) return !pidIsAlive(owner.pid);
  return Date.now() - Date.parse(owner.createdAt ?? 0) > staleMs;
}

function cleanStaleState(queueRoot, staleMs) {
  const ticketsDir = path.join(queueRoot, 'tickets');
  const lockDir = path.join(queueRoot, 'active');
  const ownerFile = path.join(lockDir, 'owner.json');

  if (existsSync(ticketsDir)) {
    for (const name of readdirSync(ticketsDir)) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(ticketsDir, name);
      const ticket = readJson(file);
      const old = ticket && Date.now() - Date.parse(ticket.createdAt ?? 0) > staleMs;
      if (!ticket || (String(ticket.hostname).toLowerCase() === hostname().toLowerCase() && !pidIsAlive(ticket.pid)) || old) {
        safeRemove(file, queueRoot);
      }
    }
  }

  if (existsSync(lockDir) && ownerIsStale(readJson(ownerFile), ownerFile, staleMs)) {
    safeRemove(lockDir, queueRoot);
  }
}

export function acquireValidationLease({
  repoDir,
  queueRoot = validationQueueRoot(repoDir),
  label = 'validação',
  command = '',
  timeoutMs = DEFAULT_TIMEOUT_MS,
  staleMs = DEFAULT_STALE_MS,
} = {}) {
  const resolvedRoot = path.resolve(queueRoot);
  if (
    process.env.MGTIA_VALIDATION_LEASE &&
    process.env.MGTIA_VALIDATION_QUEUE_ROOT &&
    path.resolve(process.env.MGTIA_VALIDATION_QUEUE_ROOT) === resolvedRoot
  ) {
    return {
      reentrant: true,
      queueRoot: resolvedRoot,
      token: process.env.MGTIA_VALIDATION_LEASE,
      release() {},
    };
  }

  const ticketsDir = path.join(resolvedRoot, 'tickets');
  const lockDir = path.join(resolvedRoot, 'active');
  const ownerFile = path.join(lockDir, 'owner.json');
  mkdirSync(ticketsDir, { recursive: true });

  const createdAt = new Date().toISOString();
  const token = randomUUID();
  const ticketName = `${String(Date.now()).padStart(13, '0')}-${process.pid}-${token}.json`;
  const ticketFile = path.join(ticketsDir, ticketName);
  writeFileSync(
    ticketFile,
    JSON.stringify({ token, pid: process.pid, hostname: hostname(), label, command, createdAt }, null, 2),
    { encoding: 'utf8', flag: 'wx' },
  );

  const started = Date.now();
  let lastPosition = -1;
  try {
    for (;;) {
      cleanStaleState(resolvedRoot, staleMs);
      const tickets = readdirSync(ticketsDir).filter((name) => name.endsWith('.json')).sort();
      const position = tickets.indexOf(ticketName);
      if (position < 0) throw new Error('fila de validação: ticket desapareceu enquanto aguardava');

      if (position !== lastPosition) {
        console.log(`[validação] ${label}: aguardando na posição ${position + 1}`);
        lastPosition = position;
      }

      if (position === 0) {
        try {
          mkdirSync(lockDir);
          writeFileSync(
            ownerFile,
            JSON.stringify({ token, pid: process.pid, hostname: hostname(), label, command, createdAt }, null, 2),
            'utf8',
          );
          console.log(`[validação] ${label}: slot adquirido`);
          let released = false;
          return {
            reentrant: false,
            queueRoot: resolvedRoot,
            token,
            release() {
              if (released) return;
              released = true;
              const owner = readJson(ownerFile);
              if (owner?.token === token) safeRemove(lockDir, resolvedRoot);
              safeRemove(ticketFile, resolvedRoot);
              console.log(`[validação] ${label}: slot liberado`);
            },
          };
        } catch (error) {
          if (error?.code !== 'EEXIST') throw error;
        }
      }

      if (Date.now() - started > timeoutMs) {
        throw new Error(`fila de validação: timeout aguardando slot para ${label}`);
      }
      sleep(250);
    }
  } catch (error) {
    safeRemove(ticketFile, resolvedRoot);
    throw error;
  }
}

function invocation(command, args) {
  if (process.platform === 'win32' && command === 'pnpm') {
    const candidates = [
      process.env.npm_execpath,
      process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules', 'pnpm', 'bin', 'pnpm.mjs'),
    ];
    const script = candidates.find((candidate) => candidate && candidate.toLowerCase().includes('pnpm') && existsSync(candidate));
    if (script) return { command: process.execPath, args: [script, ...args] };
  }
  if (process.platform === 'win32' && ['npm', 'npx'].includes(command)) {
    return { command: `${command}.cmd`, args };
  }
  return { command, args };
}

export function runQueuedCommand({ repoDir, queueRoot, cwd = repoDir, label, command, args = [] }) {
  const lease = acquireValidationLease({
    repoDir,
    queueRoot,
    label,
    command: [command, ...args].join(' '),
  });
  try {
    const child = invocation(command, args);
    const result = spawnSync(child.command, child.args, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        MGTIA_VALIDATION_LEASE: lease.token,
        MGTIA_VALIDATION_QUEUE_ROOT: lease.queueRoot,
      },
    });
    return result.status ?? 1;
  } finally {
    lease.release();
  }
}

export function validationQueueStatus({ repoDir, queueRoot = validationQueueRoot(repoDir) }) {
  const ticketsDir = path.join(queueRoot, 'tickets');
  const owner = readJson(path.join(queueRoot, 'active', 'owner.json'));
  const tickets = existsSync(ticketsDir)
    ? readdirSync(ticketsDir).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(ticketsDir, name)))
    : [];
  return { queueRoot, owner, tickets };
}
