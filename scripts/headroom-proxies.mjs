/**
 * headroom-proxies.mjs — Gerenciador de múltiplos proxies headroom.
 *
 * Uso:
 *   node scripts/headroom-proxies.mjs <subcomando> [args]
 *
 * Subcomandos:
 *   start                      — inicia todos os proxies
 *   stop                       — para todos os proxies
 *   status                     — mostra estado de todos
 *   start-<name>               — inicia um proxy específico
 *   stop-<name>                — para um proxy específico
 *   restart-<name>             — reinicia um proxy específico
 *   <name> [port_override]     — atalho: inicia proxy específico com porta opcional
 *
 * Arquivos:
 *   PIDs: %TEMP%/headroom-proxies.pid.json
 *   Logs: %TEMP%/headroom-<name>-<port>.log
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, openSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

// ── Config ──────────────────────────────────────────────────────────────
const PROXIES = {
  deepseek: {
    port: 8787,
    backend: 'anyllm',
    anyllmProvider: 'openai',
    apiBaseEnv: 'DEEPSEEK_API_KEY',
    apiBase: 'https://api.deepseek.com/v1',
  },
  'opencode-go': {
    port: 8788,
    backend: 'anyllm',
    anyllmProvider: 'openai',
    apiBaseEnv: 'OPENCODE_API_KEY',
    apiBase: 'https://opencode.ai/zen/go/v1',
  },
  'opencode-zen': {
    port: 8789,
    backend: 'anyllm',
    anyllmProvider: 'openai',
    apiBaseEnv: 'OPENCODE_API_KEY',
    apiBase: 'https://opencode.ai/zen/v1',
  },
  'opencode-go-ent': {
    port: 8791,
    backend: 'anyllm',
    anyllmProvider: 'openai',
    apiBaseEnv: 'OPENCODE_ENT_API_KEY',
    apiBase: 'https://opencode.ai/zen/go/v1',
  },
  'opencode-zen-ent': {
    port: 8792,
    backend: 'anyllm',
    anyllmProvider: 'openai',
    apiBaseEnv: 'OPENCODE_ENT_API_KEY',
    apiBase: 'https://opencode.ai/zen/v1',
  },
  openrouter: {
    port: 8793,
    backend: 'anyllm',
    anyllmProvider: 'openai',
    apiBaseEnv: 'OPENROUTER_API_KEY',
    apiBase: 'https://openrouter.ai/api/v1',
  },
};

const PID_FILE = join(tmpdir(), 'headroom-proxies.pid.json');

// ── Helpers ─────────────────────────────────────────────────────────────

function loadPids() {
  try {
    return JSON.parse(readFileSync(PID_FILE, 'utf8'));
  } catch { return {}; }
}

function savePids(pids) {
  writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
}

function logFile(name, port) {
  return join(tmpdir(), `headroom-${name}-${port}.log`);
}

function isPortFree(port) {
  return new Promise(resolve => {
    const s = createServer();
    s.on('error', () => resolve(false));
    s.listen(port, () => { s.close(); resolve(true); });
  });
}

async function waitForHealth(url, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

function resolveHeadroom() {
  const candidates = [
    join(process.env.APPDATA || '', 'Roaming', 'Python', 'Python313', 'Scripts', 'headroom.exe'),
    join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python313', 'Scripts', 'headroom.exe'),
    'headroom',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return 'headroom';
}

// ── Commands ────────────────────────────────────────────────────────────

async function cmdStart(name, portOverride) {
  const proxy = PROXIES[name];
  if (!proxy) { console.error(`Unknown proxy: ${name}`); process.exit(1); }

  const port = portOverride || proxy.port;
  const free = await isPortFree(port);
  if (!free) {
    console.log(`[${name}] Port ${port} already in use — skipping`);
    return;
  }

  const apiKey = process.env[proxy.apiBaseEnv];
  if (!apiKey) {
    console.error(`[${name}] ${proxy.apiBaseEnv} not set in environment`);
    process.exit(1);
  }

  const log = logFile(name, port);
  const fd = openSync(log, 'a');

  const headroom = resolveHeadroom();
  const args = [
    'serve',
    '--port', String(port),
    '--backend', proxy.backend,
    '--anyllm-provider', proxy.anyllmProvider,
    '--api-base', proxy.apiBase,
  ];

  const child = spawn(headroom, args, {
    env: { ...process.env, [proxy.apiBaseEnv]: apiKey },
    stdio: ['ignore', fd, fd],
    windowsHide: true,
  });

  const pids = loadPids();
  pids[name] = { pid: child.pid, port, log };
  savePids(pids);

  console.log(`[${name}] Started (PID ${child.pid}, port ${port})`);

  const healthy = await waitForHealth(`http://127.0.0.1:${port}/livez`);
  console.log(`[${name}] Health check: ${healthy ? 'OK' : 'timeout (continuing)'}`);

  child.on('exit', (code) => {
    console.log(`[${name}] Exited (code ${code})`);
    const p = loadPids();
    if (p[name]?.pid === child.pid) {
      delete p[name];
      savePids(p);
    }
  });
}

async function cmdStop(name) {
  const pids = loadPids();
  const entry = pids[name];
  if (!entry) { console.log(`[${name}] Not running`); return; }

  try {
    process.kill(entry.pid);
  } catch {}
  delete pids[name];
  savePids(pids);
  console.log(`[${name}] Stopped (was PID ${entry.pid})`);
}

function cmdStatus() {
  const pids = loadPids();
  const names = Object.keys(PROXIES);
  console.log('Proxy Status');
  console.log('═══════════════════════════════');
  for (const name of names) {
    const p = PROXIES[name];
    const running = pids[name];
    const status = running ? `🟢 running (PID ${running.pid}, port ${running.port})` : '⚫ stopped';
    console.log(`  ${name.padEnd(20)} ${status}`);
    console.log(`  ${''.padEnd(20)} apiBase: ${p.apiBase}`);
    console.log(`  ${''.padEnd(20)} env: ${p.apiBaseEnv}`);
  }
}

async function cmdStartAll() {
  for (const name of Object.keys(PROXIES)) {
    await cmdStart(name);
  }
}

async function cmdStopAll() {
  const pids = loadPids();
  for (const name of Object.keys(pids)) {
    await cmdStop(name);
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === 'status') { cmdStatus(); return; }
  if (cmd === 'start') { await cmdStartAll(); return; }
  if (cmd === 'stop') { await cmdStopAll(); return; }

  // start-<name> / stop-<name> / restart-<name>
  const match = cmd.match(/^(start|stop|restart)-(.+)$/);
  if (match) {
    const [_, action, name] = match;
    if (!PROXIES[name]) { console.error(`Unknown proxy: ${name}`); process.exit(1); }
    if (action === 'restart') {
      await cmdStop(name);
      await cmdStart(name);
    } else if (action === 'start') {
      await cmdStart(name);
    } else {
      await cmdStop(name);
    }
    return;
  }

  // Atalho: <name> [port]
  if (PROXIES[cmd]) {
    await cmdStart(cmd, args[0] ? Number(args[0]) : undefined);
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  console.error('Usage: node scripts/headroom-proxies.mjs start|stop|status|start-<name>|stop-<name>|restart-<name>|<name> [port]');
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
