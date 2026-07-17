/**
 * telemetry — embeds JSONL telemetry into scripts the agents already call.
 * Zero extra calls: every emit is a side-effect of an existing command.
 * Fail-silent: telemetry never breaks the host command.
 *
 * Uses:
 *   import { emit, tee } from '../lib/telemetry.mjs';
 *   const t0 = performance.now();
 *   // ... run command ...
 *   emit({ task: 'P-02', phase: 'manage-task.start', cmd: 'node manage-task start P-02 ...',
 *         wallMs: Math.round(performance.now() - t0), exitCode: 0, actor: 'deepseek' });
 *
 *   // Or wrap an async operation:
 *   await tee({ phase: 'fila.add', cmd: 'fila add P-02 ...', actor: 'deepseek' }, async () => {
 *     // ...
 *   });
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// lib/telemetry.mjs lives in tools/scripts/lib/ → need 3 levels up to reach repo root
const root = path.resolve(__dirname, '..', '..', '..');

const HOSTNAME = os.hostname();
const OS_ARCH = `${os.arch()}/${os.platform()}`;
const NODE_VERSION = process.version;

/**
 * Resolve task ID: explicit arg, MGTIA_TASK env, or from process.argv pattern.
 */
function resolveTaskId(taskArg) {
  if (taskArg) return taskArg;
  if (process.env.MGTIA_TASK) return process.env.MGTIA_TASK;
  // Auto-detect from process.argv: <script> <...> <taskId-like>
  for (const arg of process.argv) {
    if (/^[A-Z]+-\d+[a-z]?$/i.test(arg)) return arg;
  }
  return null;
}

/**
 * Append a single JSON line to tasks/.telemetry/<ID>.jsonl.
 * Fails silently: never throws, never breaks the host command.
 * Events without a task ID go to tasks/.telemetry/_system.jsonl.
 * @param {Object} opts
 * @param {string} [opts.task]     — task ID (auto-detected if omitted; falls back to _system)
 * @param {string} opts.phase      — e.g. "manage-task.start", "fila.add"
 * @param {string} [opts.cmd]      — full command line
 * @param {number} opts.wallMs     — wall clock ms
 * @param {number} [opts.exitCode] — exit code (0 = success)
 * @param {string} [opts.actor]    — agent identity (model name)
 * @param {Object} [opts.extra]    — arbitrary extra fields merged into event
 * @returns {boolean} true if emitted, false if suppressed
 */
export function emit(opts = {}) {
  try {
    const { task, phase, cmd, wallMs, exitCode, actor, extra } = opts || {};
    const taskId = resolveTaskId(task) || '_system';

    const evt = {
      task: taskId,
      phase: phase || 'unknown',
      ts: new Date().toISOString(),
      wallMs: wallMs ?? 0,
      host: HOSTNAME,
      os: OS_ARCH,
      node: NODE_VERSION,
      ...(cmd ? { cmd } : {}),
      ...(exitCode !== undefined ? { exitCode } : {}),
      ...(actor ? { actor } : {}),
      ...(extra || {}),
    };

    const dir = path.join(root, 'tasks', '.telemetry');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${taskId}.jsonl`);
    fs.appendFileSync(file, JSON.stringify(evt) + '\n', 'utf8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Wrap an async function, measuring wallMs and emitting success/failure.
 * The wrapped function's return value passes through unchanged.
 * If the function throws, the error is re-thrown after emitting.
 * @param {Object} opts — same as emit() minus wallMs/exitCode (computed automatically)
 * @param {Function} fn — async function to wrap
 * @returns {Promise<*>} fn's return value
 */
export async function tee(opts, fn) {
  const t0 = performance.now();
  try {
    const result = await fn();
    emit({ ...opts, wallMs: Math.round(performance.now() - t0), exitCode: 0 });
    return result;
  } catch (err) {
    emit({ ...opts, wallMs: Math.round(performance.now() - t0), exitCode: 1, extra: { error: err.message } });
    throw err;
  }
}

/**
 * Synchronous version of tee().
 */
export function teeSync(opts, fn) {
  const t0 = performance.now();
  try {
    const result = fn();
    emit({ ...opts, wallMs: Math.round(performance.now() - t0), exitCode: 0 });
    return result;
  } catch (err) {
    emit({ ...opts, wallMs: Math.round(performance.now() - t0), exitCode: 1, extra: { error: err.message } });
    throw err;
  }
}
