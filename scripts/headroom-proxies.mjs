#!/usr/bin/env node
// headroom-proxies.mjs — start/stop headroom proxies for DeepSeek + opencode-go + opencode-zen.
//
// Manages THREE headroom proxy instances, each on its own port, each pointing at a
// different upstream. By default:
//   • DeepSeek      → port 8787 → https://api.deepseek.com/v1
//   • opencode-go   → port 8788 → https://opencode.ai/zen/go/v1
//   • opencode-zen  → port 8789 → https://opencode.ai/zen/v1
//
// Subcommands:
//   start                       start ALL THREE detached (default)
//   stop                        stop ALL
//   status                      show which are alive
//   start-deepseek              only deepseek detached
//   stop-deepseek               only deepseek
//   start-opencode-go           only opencode-go detached
//   stop-opencode-go            only opencode-go
//   start-opencode-zen          only opencode-zen detached
//   stop-opencode-zen           only opencode-zen
//   deepseek [port]             foreground deepseek (legacy single-proxy mode)
//   opencode-go [port]          foreground opencode-go (debug)
//   opencode-zen [port]         foreground opencode-zen (debug)
//
// Env (all optional with defaults; DEEPSEEK_API_KEY required for start-deepseek):
//   DEEPSEEK_PORT               8787
//   DEEPSEEK_API_URL            https://api.deepseek.com/v1
//   DEEPSEEK_API_KEY            (from .env DEEPSEEK_API_KEY; required)
//   OPENCODE_GO_PORT            8788
//   OPENCODE_GO_API_URL         https://opencode.ai/zen/go/v1
//   OPENCODE_GO_API_KEY         (falls back to OPENCODE_API_KEY)
//   OPENCODE_ZEN_PORT           8789
//   OPENCODE_ZEN_API_URL        https://opencode.ai/zen/v1
//   OPENCODE_ZEN_API_KEY        (falls back to OPENCODE_API_KEY)
//   OPENCODE_API_KEY            (shared fallback for both opencode proxies)
//
// PID file: $TEMP/headroom-proxies.pid.json (array of {name, pid, port, logPath})
// Per-instance log: $TEMP/headroom-{name}-{port}.log
//
// Stdlib only — no deps. Cross-platform (Win/Mac/Linux).

import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = resolve(__dirname, '..', '.env');
const LOG_DIR = process.env.TEMP || process.env.TMPDIR || tmpdir();
const PID_FILE = join(LOG_DIR, 'headroom-proxies.pid.json');

// ── headroom binary discovery ────────────────────────────────────────────────
const HEADROOM_CANDIDATES = [
  'C:\\Users\\israe\\AppData\\Roaming\\Python\\Python313\\Scripts\\headroom.exe',
  'C:/Users/israe/AppData/Roaming/Python/Python313/Scripts/headroom.exe',
  'headroom',
];
function findHeadroom() {
  for (const c of HEADROOM_CANDIDATES) {
    if (c.includes('\\') || c.includes('/')) {
      if (existsSync(c)) return c;
    } else {
      try {
        const cmd = process.platform === 'win32' ? 'where' : 'which';
        const out = execFileSync(cmd, [c], { encoding: 'utf8' }).trim().split('\n')[0].trim();
        if (out) return out;
      } catch { /* not in PATH */ }
    }
  }
  return null;
}

// ── .env loading ─────────────────────────────────────────────────────────────
function loadEnv() {
  if (!existsSync(ENV_FILE)) {
    console.error(`.env not found: ${ENV_FILE}`);
    process.exit(1);
  }
  const env = { ...process.env };
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !m[1].startsWith('#')) env[m[1]] = m[2];
  }
  return env;
}

// ── arg parsing ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const sub = argv[0] || 'start';
const rest = argv.slice(1);
const portArg = rest.find((a) => /^\d{2,5}$/.test(a));
const detach = rest.includes('--detach');

// ── proxy config builders ────────────────────────────────────────────────────
const PROXIES = {
  deepseek: (env) => ({
    name: 'deepseek',
    port: parseInt(env.DEEPSEEK_PORT || '8787', 10),
    apiUrl: env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    apiKey: env.DEEPSEEK_API_KEY || '',
    // any-llm's 'openai' provider reads OPENAI_API_KEY
    envVar: 'OPENAI_API_KEY',
    requireKey: true,
  }),
  'opencode-go': (env) => ({
    name: 'opencode-go',
    port: parseInt(env.OPENCODE_GO_PORT || env.OPENCODE_PORT || '8788', 10),
    apiUrl: env.OPENCODE_GO_API_URL || env.OPENCODE_API_URL || 'https://opencode.ai/zen/go/v1',
    apiKey: env.OPENCODE_GO_API_KEY || env.OPENCODE_API_KEY || '',
    envVar: 'OPENAI_API_KEY',
    requireKey: false,
  }),
  'opencode-zen': (env) => ({
    name: 'opencode-zen',
    port: parseInt(env.OPENCODE_ZEN_PORT || '8789', 10),
    apiUrl: env.OPENCODE_ZEN_API_URL || env.OPENCODE_API_URL || 'https://opencode.ai/zen/v1',
    apiKey: env.OPENCODE_ZEN_API_KEY || env.OPENCODE_API_KEY || '',
    envVar: 'OPENAI_API_KEY',
    requireKey: false,
  }),
};

function buildArgs(cfg) {
  return [
    'proxy',
    '--backend', 'anyllm',
    '--anyllm-provider', 'openai',
    '--openai-api-url', cfg.apiUrl,
    '--host', '127.0.0.1',
    '--port', String(cfg.port),
    '--no-telemetry',
    // NOTE: --no-optimize and --no-cache are intentionally NOT passed.
    // Compressão/caching do headroom ficam ativos por padrão.
  ];
}

function logPathFor(name, port) {
  return join(LOG_DIR, `headroom-${name}-${port}.log`);
}

// ── pid file management ──────────────────────────────────────────────────────
function readPids() {
  if (!existsSync(PID_FILE)) return [];
  try {
    return JSON.parse(readFileSync(PID_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function writePids(pids) {
  writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
}
function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function killPid(pid) {
  if (!isAlive(pid)) return;
  if (process.platform === 'win32') {
    try { execFileSync('taskkill', ['/F', '/PID', String(pid)], { stdio: 'ignore' }); }
    catch { /* race: process may have just exited */ }
  } else {
    try { process.kill(pid, 'SIGTERM'); }
    catch { /* same */ }
  }
}

// ── spawn / start / stop ─────────────────────────────────────────────────────
function startOne(headroom, cfg, env, detached) {
  if (cfg.requireKey && !cfg.apiKey) {
    console.error(`${cfg.name}: required key is empty (env var not set)`);
    return null;
  }
  const args = buildArgs(cfg);
  const logPath = logPathFor(cfg.name, cfg.port);
  // Inject the API key under the provider's expected env var (anyllm reads OPENAI_API_KEY).
  const childEnv = { ...env, [cfg.envVar]: cfg.apiKey };

  if (detached) {
    const outFd = openSync(logPath, 'w');
    const child = spawn(headroom, args, {
      env: childEnv,
      detached: true,
      stdio: ['ignore', outFd, outFd],
      windowsHide: true,
    });
    closeSync(outFd);
    child.unref();
    return { pid: child.pid, logPath };
  }
  // Foreground
  const child = spawn(headroom, args, {
    env: childEnv,
    stdio: 'inherit',
    windowsHide: true,
  });
  return { pid: child.pid, logPath, child };
}

function checkPort(port) {
  // Light best-effort: warn if port already bound. Doesn't fail the start
  // (headroom will fail loudly with its own error if the port is in use).
  return new Promise((resolve) => {
    const sock = createServer();
    sock.once('error', () => resolve(false));
    sock.once('listening', () => sock.close(() => resolve(true)));
    sock.listen(port, '127.0.0.1');
  });
}

async function cmdStartOne(name) {
  const headroom = findHeadroom();
  if (!headroom) {
    console.error('headroom binary not found. Tried:');
    for (const c of HEADROOM_CANDIDATES) console.error('  - ' + c);
    console.error('Install with: pip install "headroom-ai[proxy]"');
    process.exit(1);
  }
  const env = loadEnv();
  const cfg = PROXIES[name](env);
  const portFree = await checkPort(cfg.port);
  if (!portFree) {
    console.error(`${name}: port ${cfg.port} already in use (kill the existing process or change ${name.toUpperCase()}_PORT).`);
    process.exit(1);
  }
  const result = startOne(headroom, cfg, env, true);
  if (!result) process.exit(1);
  // Persist PID
  const pids = readPids().filter((p) => p.name !== name);
  pids.push({ name, pid: result.pid, port: cfg.port, logPath: result.logPath });
  writePids(pids);
  console.log(`headroom[${name}] started detached: pid=${result.pid} port=${cfg.port} upstream=${cfg.apiUrl}`);
  console.log(`  log: ${result.logPath}`);
  console.log(`  env: ${cfg.envVar}=<set>`);
  console.log(`  stop: node scripts/headroom-proxies.mjs stop-${name}`);
}

async function cmdStartAll() {
  // Check port collision up-front
  const env = loadEnv();
  const ds = PROXIES.deepseek(env);
  const ocg = PROXIES['opencode-go'](env);
  const ocz = PROXIES['opencode-zen'](env);
  const ports = [ds.port, ocg.port, ocz.port];
  if (new Set(ports).size !== ports.length) {
    console.error(`port collision: DEEPSEEK=${ds.port}, OPENCODE_GO=${ocg.port}, OPENCODE_ZEN=${ocz.port} must all differ.`);
    process.exit(1);
  }
  await cmdStartOne('deepseek');
  await cmdStartOne('opencode-go');
  await cmdStartOne('opencode-zen');
  console.log('');
  console.log('All proxies running. Health checks:');
  console.log(`  curl http://127.0.0.1:${ds.port}/livez   # deepseek`);
  console.log(`  curl http://127.0.0.1:${ocg.port}/livez  # opencode-go`);
  console.log(`  curl http://127.0.0.1:${ocz.port}/livez  # opencode-zen`);
  console.log('Stop: node scripts/headroom-proxies.mjs stop');
}

function cmdStopOne(name) {
  const pids = readPids();
  const entry = pids.find((p) => p.name === name);
  if (!entry) {
    console.log(`no headroom[${name}] registered (check $TEMP/headroom-proxies.pid.json)`);
    return;
  }
  if (isAlive(entry.pid)) {
    killPid(entry.pid);
    console.log(`headroom[${name}] (pid=${entry.pid} port=${entry.port}) stopped`);
  } else {
    console.log(`headroom[${name}] (pid=${entry.pid}) was already dead`);
  }
  writePids(pids.filter((p) => p.name !== name));
}

function cmdStopAll() {
  const pids = readPids();
  if (pids.length === 0) {
    console.log('no headroom proxies registered');
    return;
  }
  for (const p of pids) {
    if (isAlive(p.pid)) {
      killPid(p.pid);
      console.log(`headroom[${p.name}] (pid=${p.pid} port=${p.port}) stopped`);
    } else {
      console.log(`headroom[${p.name}] (pid=${p.pid}) was already dead`);
    }
  }
  if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
}

function cmdStatus() {
  const pids = readPids();
  if (pids.length === 0) {
    console.log('no headroom proxies registered');
    return;
  }
  for (const p of pids) {
    const alive = isAlive(p.pid);
    console.log(`headroom[${p.name}] pid=${p.pid} port=${p.port} → ${alive ? 'ALIVE' : 'dead'} · log: ${p.logPath}`);
  }
}

// ── foreground (debug) modes ────────────────────────────────────────────────
function cmdForeground(name, defaultPort) {
  const headroom = findHeadroom();
  if (!headroom) {
    console.error('headroom binary not found.');
    process.exit(1);
  }
  const env = loadEnv();
  // Override port from CLI arg if present
  if (portArg) {
    if (name === 'deepseek') env.DEEPSEEK_PORT = portArg;
    else env.OPENCODE_PORT = portArg;
  }
  const cfg = PROXIES[name](env);
  const result = startOne(headroom, cfg, env, false);
  if (!result || !result.child) process.exit(1);
  const child = result.child;
  const shutdown = (sig) => { if (!child.killed) child.kill(sig); };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
  child.on('exit', (code, sig) => {
    if (sig) console.error(`\n[headroom-proxies] killed by ${sig}`);
    process.exit(code ?? (sig ? 1 : 0));
  });
}

// ── dispatcher ──────────────────────────────────────────────────────────────
async function main() {
  switch (sub) {
    case 'start':                 return cmdStartAll();
    case 'stop':                  return cmdStopAll();
    case 'status':                return cmdStatus();
    case 'start-deepseek':        return cmdStartOne('deepseek');
    case 'stop-deepseek':         return cmdStopOne('deepseek');
    case 'start-opencode-go':     return cmdStartOne('opencode-go');
    case 'stop-opencode-go':      return cmdStopOne('opencode-go');
    case 'start-opencode-zen':    return cmdStartOne('opencode-zen');
    case 'stop-opencode-zen':     return cmdStopOne('opencode-zen');
    case 'deepseek':              return cmdForeground('deepseek');
    case 'opencode-go':           return cmdForeground('opencode-go');
    case 'opencode-zen':          return cmdForeground('opencode-zen');
    case 'opencode':              return cmdStartOne('opencode-go'); // legacy alias
    case 'stop-opencode':         return cmdStopOne('opencode-go');   // legacy alias
    default:
      console.error(`unknown subcommand: ${sub}`);
      console.error('usage: headroom-proxies.mjs [start|stop|status|start-{deepseek,opencode-go,opencode-zen}|stop-{deepseek,opencode-go,opencode-zen}|{deepseek,opencode-go,opencode-zen} [port]]');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
