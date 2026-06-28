/**
 * headroom-proxies.mjs — Gerenciador de múltiplos proxies headroom.
 *
 * Uso:
 *   node scripts/headroom-proxies.mjs <subcomando> [args]
 *
 * Subcomandos:
 *   start                      — inicia todos os proxies
 *   stop                       — para todos os proxies
 *   status                     — mostra estado de todos (terminal)
 *   dashboard [port]           — página web de status+compressão (default :8780)
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
import { createServer as createHttpServer } from 'node:http';

// .env é a fonte canônica das chaves (CLAUDE.md / sync-provider). Carrega e SOBREPÕE o
// env do sistema — que pode ter chaves velhas. ponytail: parser inline, sem dep dotenv.
function loadDotenv() {
  const envUrl = new URL('../.env', import.meta.url);
  if (!existsSync(envUrl)) return;
  for (const line of readFileSync(envUrl, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadDotenv();

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
    const v = JSON.parse(readFileSync(PID_FILE, 'utf8'));
    // Precisa ser objeto-plano: se vier array/null (arquivo corrompido), descarta — senão
    // `pids[name] = {...}` vira prop-string ignorada na serialização e o PID nunca persiste.
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
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
    // APPDATA já termina em \Roaming — não duplicar (bug antigo: Roaming\Roaming).
    join(process.env.APPDATA || '', 'Python', 'Python313', 'Scripts', 'headroom.exe'),
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
    'proxy',
    '--port', String(port),
    '--backend', proxy.backend,
    '--anyllm-provider', proxy.anyllmProvider,
    '--openai-api-url', proxy.apiBase,
  ];

  const child = spawn(headroom, args, {
    env: {
      ...process.env,
      [proxy.apiBaseEnv]: apiKey,
      OPENAI_API_KEY: apiKey,
      OPENAI_BASE_URL: proxy.apiBase,
    },
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

// ── Dashboard ───────────────────────────────────────────────────────────
// Servidor leve (http nativo) que agrega /livez + /stats de cada proxy do lado do
// servidor — assim a página não bate em portas cruzadas (sem CORS) e é só HTML estático.

const DASHBOARD_PORT = 8780;

async function fetchProxyStatus(name) {
  const { port, apiBase, apiBaseEnv } = PROXIES[name];
  const base = `http://127.0.0.1:${port}`;
  try {
    const live = await fetch(`${base}/livez`, { signal: AbortSignal.timeout(1500) });
    if (!live.ok) throw new Error('down');
    const health = await live.json();
    let stats = null;
    try {
      const s = await fetch(`${base}/stats`, { signal: AbortSignal.timeout(2500) });
      if (s.ok) stats = await s.json();
    } catch { /* up mas sem stats ainda */ }
    const c = stats?.summary?.compression ?? {};
    const cost = stats?.summary?.cost ?? {};
    return {
      name, port, apiBase, apiBaseEnv, up: true,
      version: health.version ?? null,
      uptime: Math.round(health.uptime_seconds ?? 0),
      model: stats?.summary?.primary_model ?? null,
      mode: stats?.summary?.mode ?? null,
      requests: stats?.summary?.api_requests ?? 0,
      avgPct: c.avg_compression_pct ?? 0,
      bestPct: c.best_compression_pct ?? 0,
      tokensRemoved: c.total_tokens_removed ?? 0,
      savedUsd: cost.total_saved_usd ?? 0,
    };
  } catch {
    return { name, port, apiBase, apiBaseEnv, up: false };
  }
}

function cmdDashboard(portOverride) {
  const port = portOverride || DASHBOARD_PORT;
  const server = createHttpServer(async (req, res) => {
    if (req.url === '/api/status') {
      const data = await Promise.all(Object.keys(PROXIES).map(fetchProxyStatus));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(DASHBOARD_HTML);
  });
  server.on('error', (e) => die(`dashboard não subiu: ${e.message}`));
  server.listen(port, '127.0.0.1', () => {
    console.log(`📊 Dashboard: http://127.0.0.1:${port}   (Ctrl+C para sair)`);
  });
}

const DASHBOARD_HTML = `<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Headroom Proxies</title><style>
*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,sans-serif;background:#0f1115;color:#e6e8ec}
header{padding:18px 24px;border-bottom:1px solid #232730;display:flex;align-items:baseline;gap:14px}
h1{font-size:18px;margin:0;font-weight:650}#meta{color:#8b93a1;font-size:12px}
main{padding:20px 24px;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.card{background:#171a21;border:1px solid #232730;border-radius:12px;padding:16px}
.top{display:flex;align-items:center;gap:9px;margin-bottom:4px}
.dot{width:9px;height:9px;border-radius:50%;flex:none}
.up{background:#3fb950;box-shadow:0 0 8px #3fb95088}.down{background:#484f5c}
.name{font-weight:650;font-size:15px}.port{color:#8b93a1;font-size:12px;margin-left:auto}
.base{color:#6b7280;font-size:11px;margin-bottom:12px;word-break:break-all}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}
.k{color:#8b93a1;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
.v{font-size:17px;font-weight:600;font-variant-numeric:tabular-nums}
.v small{font-size:12px;color:#8b93a1;font-weight:400}
.bar{height:5px;background:#232730;border-radius:3px;overflow:hidden;margin-top:5px}
.bar>i{display:block;height:100%;background:linear-gradient(90deg,#3fb950,#58d977)}
.off{color:#6b7280;font-style:italic;padding:6px 0}
</style></head><body>
<header><h1>Headroom Proxies</h1><span id="meta">carregando…</span></header>
<main id="grid"></main>
<script>
const fmt=n=>n>=1000?(n/1000).toFixed(1)+'k':String(n);
const pct=n=>(n||0).toFixed(1)+'%';
function card(p){
  if(!p.up) return \`<div class="card"><div class="top"><span class="dot down"></span>
    <span class="name">\${p.name}</span><span class="port">:\${p.port}</span></div>
    <div class="base">\${p.apiBase}</div><div class="off">⚫ offline — inicie com <code>start-\${p.name}</code></div></div>\`;
  return \`<div class="card"><div class="top"><span class="dot up"></span>
    <span class="name">\${p.name}</span><span class="port">:\${p.port} · v\${p.version??'?'}</span></div>
    <div class="base">\${p.model?('▸ '+p.model+'  '):''}\${p.apiBase}</div>
    <div class="grid">
      <div><div class="k">Requests</div><div class="v">\${fmt(p.requests)}</div></div>
      <div><div class="k">Tokens removidos</div><div class="v">\${fmt(p.tokensRemoved)}</div></div>
      <div style="grid-column:1/3"><div class="k">Compressão média</div>
        <div class="v">\${pct(p.avgPct)} <small>· melhor \${pct(p.bestPct)}</small></div>
        <div class="bar"><i style="width:\${Math.min(100,p.avgPct||0)}%"></i></div></div>
      <div><div class="k">Economia</div><div class="v">$\${(p.savedUsd||0).toFixed(3)}</div></div>
      <div><div class="k">Uptime</div><div class="v">\${Math.floor(p.uptime/60)}<small>min</small></div></div>
    </div></div>\`;
}
async function tick(){
  try{
    const r=await fetch('/api/status');const d=await r.json();
    document.getElementById('grid').innerHTML=d.map(card).join('');
    const up=d.filter(p=>p.up).length;
    document.getElementById('meta').textContent=\`\${up}/\${d.length} online · atualizado \${new Date().toLocaleTimeString()}\`;
  }catch(e){document.getElementById('meta').textContent='erro ao buscar status';}
}
tick();setInterval(tick,4000);
</script></body></html>`;

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === 'status') { cmdStatus(); return; }
  if (cmd === 'start') { await cmdStartAll(); return; }
  if (cmd === 'stop') { await cmdStopAll(); return; }
  if (cmd === 'dashboard') { cmdDashboard(args[0] ? Number(args[0]) : undefined); return; }

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
  console.error('Usage: node scripts/headroom-proxies.mjs start|stop|status|dashboard [port]|start-<name>|stop-<name>|restart-<name>|<name> [port]');
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
