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
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, openSync, readdirSync, unlinkSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
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

function rootDir() {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function die(msg) {
  console.error(msg);
  process.exit(1);
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

// Núcleo do start: LANÇA Error em falha — nunca process.exit. O dashboard chama isto
// via HTTP e não pode morrer por uma chave faltando. Retorna {alreadyRunning} se a porta
// já está ocupada, ou {pid,port} ao subir. NÃO espera health (quem chama decide).
async function startProxy(name, portOverride) {
  const proxy = PROXIES[name];
  if (!proxy) throw new Error(`proxy desconhecido: ${name}`);

  const port = portOverride || proxy.port;
  if (!(await isPortFree(port))) return { name, port, alreadyRunning: true };

  const apiKey = process.env[proxy.apiBaseEnv];
  if (!apiKey) throw new Error(`${proxy.apiBaseEnv} ausente (.env/ambiente)`);

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
  child.on('error', () => { /* falha de spawn — reportada via ausência no pidfile/health */ });

  const pids = loadPids();
  pids[name] = { pid: child.pid, port, log };
  savePids(pids);

  child.on('exit', () => {
    const p = loadPids();
    if (p[name]?.pid === child.pid) { delete p[name]; savePids(p); }
  });
  return { name, port, pid: child.pid };
}

function stopProxy(name) {
  const pids = loadPids();
  const entry = pids[name];
  if (!entry) return { name, wasRunning: false };
  try { process.kill(entry.pid); } catch {}
  delete pids[name];
  savePids(pids);
  return { name, wasRunning: true, pid: entry.pid };
}

// Wrappers CLI: imprimem e (no caso do start single) fazem health-check + die em erro.
async function cmdStart(name, portOverride) {
  try {
    const r = await startProxy(name, portOverride);
    if (r.alreadyRunning) { console.log(`[${name}] Port ${r.port} already in use — skipping`); return; }
    console.log(`[${name}] Started (PID ${r.pid}, port ${r.port})`);
    const healthy = await waitForHealth(`http://127.0.0.1:${r.port}/livez`);
    console.log(`[${name}] Health check: ${healthy ? 'OK' : 'timeout (continuing)'}`);
  } catch (e) { die(e.message); }
}

async function cmdStop(name) {
  const r = stopProxy(name);
  console.log(r.wasRunning ? `[${name}] Stopped (was PID ${r.pid})` : `[${name}] Not running`);
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
    try {
      const r = await startProxy(name);
      console.log(r.alreadyRunning
        ? `[${name}] já em uso na porta ${r.port} — pulando`
        : `[${name}] Started (PID ${r.pid}, port ${r.port})`);
    } catch (e) { console.error(`[${name}] falhou: ${e.message}`); }
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
  const json = (res, code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  // ── ORQ-10: Event state (SSE + cancel) ──────────────────────────────────
  const eventBuffer = [];             // ring buffer de eventos (max 500)
  const MAX_EVENTS = 500;
  const sseClients = new Set();       // { res, taskFilter? }

  function broadcastEvent(evt) {
    eventBuffer.push(evt);
    if (eventBuffer.length > MAX_EVENTS) eventBuffer.splice(0, eventBuffer.length - MAX_EVENTS);
    for (const c of sseClients) {
      if (!c.taskFilter || c.taskFilter === evt.taskId) {
        c.res.write(`data: ${JSON.stringify(evt)}\n\n`);
      }
    }
  }
  const server = createHttpServer(async (req, res) => {
    if (req.url === '/api/status') {
      json(res, 200, await Promise.all(Object.keys(PROXIES).map(fetchProxyStatus)));
      return;
    }
    // POST /api/{start|stop|restart}/<name> — controla os proxies a partir da página.
    const m = req.method === 'POST' && req.url.match(/^\/api\/(start|stop|restart)\/(.+)$/);
    if (m) {
      const [, action, name] = m;
      if (!PROXIES[name]) { json(res, 404, { ok: false, error: 'proxy desconhecido' }); return; }
      try {
        if (action === 'stop') stopProxy(name);
        else if (action === 'start') await startProxy(name);
        else { stopProxy(name); await new Promise(r => setTimeout(r, 600)); await startProxy(name); }
        json(res, 200, { ok: true });
      } catch (e) { json(res, 500, { ok: false, error: e.message }); }
      return;
    }
    // GET /api/ledger — estado das tasks via ledger.mjs
    if (req.url === '/api/ledger' || req.url?.startsWith('/api/ledger?')) {
      try {
        const args = ['tools/scripts/ledger.mjs', '--json'];
        if (req.url.includes('?status=')) {
          const status = req.url.split('?status=')[1]?.split('&')[0];
          if (status) args.push('--status', status);
        }
        const out = execFileSync('node', args, { encoding: 'utf8', cwd: rootDir() });
        json(res, 200, JSON.parse(out.trim()));
      } catch (e) { json(res, 500, { ok: false, error: e.message }); }
      return;
    }
    // GET /api/instances — pidfiles do orquestrador com prune de mortos
    if (req.url === '/api/instances') {
      try {
        const orchDir = join(rootDir(), 'tasks', '.orchestrator');
        const instances = [];
        if (existsSync(orchDir)) {
          for (const f of readdirSync(orchDir)) {
            if (!f.endsWith('.json')) continue;
            const fp = join(orchDir, f);
            try {
              const data = JSON.parse(readFileSync(fp, 'utf8'));
              if (typeof data.pid !== 'number') continue;
              try { process.kill(data.pid, 0); } catch { unlinkSync(fp); continue; }
              instances.push(data);
            } catch { try { unlinkSync(fp); } catch {} }
          }
        }
        json(res, 200, instances);
      } catch (e) { json(res, 500, { ok: false, error: e.message }); }
      return;
    }
    // GET /api/saldo — saldos dos provedores
    if (req.url === '/api/saldo') {
      try {
        const out = execFileSync('node', ['tools/scripts/saldo.mjs', '--json'], { encoding: 'utf8', cwd: rootDir() });
        json(res, 200, JSON.parse(out.trim()));
      } catch { json(res, 200, []); }
      return;
    }
    // POST /api/dispatch — dispara o orquestrador
    if (req.method === 'POST' && req.url === '/api/dispatch') {
      try {
        const out = execFileSync('node', ['tools/scripts/orquestrar.mjs', '--once'], { encoding: 'utf8', cwd: rootDir() });
        json(res, 200, { ok: true, output: out.trim() });
      } catch (e) { json(res, 500, { ok: false, error: e.message, output: e.stdout?.toString() || '' }); }
      return;
    }
    // ── ORQ-10: Event stream + cancel ─────────────────────────────────────
    // POST /api/instances/events — ingestão de eventos do agentAdapter
    if (req.method === 'POST' && req.url === '/api/instances/events') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        try {
          const evt = JSON.parse(body);
          if (!evt.taskId) { json(res, 400, { error: 'taskId required' }); return; }
          evt.ts = evt.ts || Date.now();
          broadcastEvent(evt);
          json(res, 200, { ok: true });
        } catch (e) { json(res, 400, { error: e.message }); }
      });
      return;
    }
    // GET /api/instances/events — SSE stream ao vivo (opcional ?taskId=)
    if (req.method === 'GET' && req.url.startsWith('/api/instances/events')) {
      const url = new URL(req.url, 'http://x');
      const taskFilter = url.searchParams.get('taskId') || null;
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      // replay do buffer
      for (const e of eventBuffer) {
        if (!taskFilter || taskFilter === e.taskId) {
          res.write(`data: ${JSON.stringify(e)}\n\n`);
        }
      }
      const client = { res, taskFilter };
      sseClients.add(client);
      req.on('close', () => sseClients.delete(client));
      return;
    }
    // POST /api/instances/cancel — mata instância via .cancel flag
    if (req.method === 'POST' && req.url === '/api/instances/cancel') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        try {
          const { taskId } = JSON.parse(body);
          if (!taskId) { json(res, 400, { error: 'taskId required' }); return; }
          const orchDir = join(rootDir(), 'tasks', '.orchestrator');
          mkdirSync(orchDir, { recursive: true });
          const fp = join(orchDir, `${String(taskId).replace(/[^a-zA-Z0-9._-]/g, '_')}.cancel`);
          writeFileSync(fp, JSON.stringify({ ts: Date.now(), reason: 'manual' }, null, 2));
          json(res, 200, { ok: true });
        } catch (e) { json(res, 500, { error: e.message }); }
      });
      return;
    }
    // GET /api/stuck — instâncias travadas (delega ao monitor.mjs)
    if (req.url === '/api/stuck') {
      try {
        const { findStuck } = await import('../tools/orchestrator/src/monitor.mjs');
        const orchDir = join(rootDir(), 'tasks', '.orchestrator');
        const registry = {};
        if (existsSync(orchDir)) {
          for (const f of readdirSync(orchDir)) {
            if (!f.endsWith('.json')) continue;
            try {
              const data = JSON.parse(readFileSync(join(orchDir, f), 'utf8'));
              if (data.id) registry[data.id] = data;
            } catch { /* skip corrupt */ }
          }
        }
        json(res, 200, findStuck(registry));
      } catch (e) { json(res, 500, { error: e.message }); }
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
<title>Painel MGTIA</title><style>
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
.actions{display:flex;gap:8px;margin-top:13px}
button{flex:1;padding:7px 8px;border:1px solid #2b303b;border-radius:7px;background:#1d212a;color:#e6e8ec;font:inherit;font-size:12px;cursor:pointer}
button:hover{background:#252b36}button:disabled{opacity:.5;cursor:wait}
button.stop{border-color:#5a2d2d}
button.dispatch{background:#1a3a1f;border-color:#2d5a36;font-size:14px;font-weight:600;padding:10px}
button.dispatch:hover{background:#1f4527}
/* sections */
section{margin:0 24px 20px}
section h2{font-size:15px;font-weight:650;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #232730}
/* instances */
.inst-grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.inst-card{background:#171a21;border:1px solid #232730;border-radius:10px;padding:12px;display:flex;justify-content:space-between;align-items:center}
.inst-id{font-weight:650;font-size:14px}.inst-meta{color:#8b93a1;font-size:11px}
/* ledger */
.ledger-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.ledger-group{background:#171a21;border:1px solid #232730;border-radius:10px;padding:12px}
.ledger-status{font-weight:650;font-size:13px;margin-bottom:6px;text-transform:uppercase}
.ledger-item{font-size:12px;color:#8b93a1;padding:2px 0}
.ledger-item span{color:#e6e8ec;font-weight:550}
/* saldo */
.saldo-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
.saldo-card{background:#171a21;border:1px solid #232730;border-radius:10px;padding:12px}
.saldo-name{font-weight:650;font-size:14px}.saldo-val{font-size:18px;font-weight:600;margin-top:4px}
.saldo-val.ok{color:#3fb950}.saldo-val.low{color:#d29922}.saldo-val.bad{color:#f85149}
.saldo-meta{color:#6b7280;font-size:11px;margin-top:2px}
/* toolbar */
.toolbar{display:flex;gap:10px;margin:0 24px 16px;flex-wrap:wrap}
.empty{color:#6b7280;font-style:italic;padding:6px 0}
</style></head><body>
<header><h1>Painel MGTIA</h1><span id="meta">carregando…</span></header>
<div class="toolbar">
  <button class="dispatch" onclick="dispatch()">▶ Despachar</button>
  <span id="dispatch-msg" style="color:#8b93a1;font-size:12px;padding:10px 0"></span>
</div>
<main id="grid"></main>
<section><h2>Instâncias (Orquestrador)</h2><div id="instances"><div class="empty">carregando…</div></div></section>
<section><h2>Eventos ao Vivo</h2><div id="event-stream"><div class="empty">conectando…</div></div></section>
<section><h2>Ledger</h2><div id="ledger"><div class="empty">carregando…</div></div></section>
<section><h2>Saldos</h2><div id="saldo"><div class="empty">carregando…</div></div></section>
<script>
const fmt=n=>n>=1000?(n/1000).toFixed(1)+'k':String(n);
const pct=n=>(n||0).toFixed(1)+'%';
function card(p){
  if(!p.up) return \`<div class="card"><div class="top"><span class="dot down"></span>
    <span class="name">\${p.name}</span><span class="port">:\${p.port}</span></div>
    <div class="base">\${p.apiBase}</div><div class="off">⚫ offline</div>
    <div class="actions"><button onclick="act('\${p.name}','start',this)">▶ Start</button></div></div>\`;
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
    </div>
    <div class="actions">
      <button class="stop" onclick="act('\${p.name}','stop',this)">■ Stop</button>
      <button onclick="act('\${p.name}','restart',this)">⟳ Restart</button>
    </div></div>\`;
}
async function act(name,action,btn){
  btn.disabled=true;const t=btn.textContent;btn.textContent='…';
  try{
    const r=await fetch('/api/'+action+'/'+name,{method:'POST'});
    const j=await r.json();
    if(!j.ok) alert(name+': '+(j.error||'falhou'));
  }catch(e){ alert('erro: '+e.message); }
  finally{ btn.textContent=t; setTimeout(tick,900); }
}
async function tick(){
  try{
    const r=await fetch('/api/status');const d=await r.json();
    document.getElementById('grid').innerHTML=d.map(card).join('');
    const up=d.filter(p=>p.up).length;
    document.getElementById('meta').textContent=\`\${up}/\${d.length} online · atualizado \${new Date().toLocaleTimeString()}\`;
  }catch(e){document.getElementById('meta').textContent='erro ao buscar status';}
}
// Instances
let stuckIds=[];
async function tickInstances(){
  try{
    const r=await fetch('/api/instances');const d=await r.json();
    if(!d.length){document.getElementById('instances').innerHTML='<div class="empty">nenhuma instância rodando</div>';return;}
    document.getElementById('instances').innerHTML='<div class="inst-grid">'+d.map(i=>{
      const stk=stuckIds.includes(i.id);
      return \`<div class="inst-card"><div><div class="inst-id">\${i.id||'?'}\${stk?' ⚠️':''}</div><div class="inst-meta">\${i.model||'?'} · \${i.role||'?'}</div></div><div style="text-align:right"><div class="inst-meta">desde \${i.started?new Date(i.started).toLocaleTimeString():'?'}</div><button class="stop" onclick="matar('\${i.id}')" style="margin-top:6px;padding:4px 12px;font-size:11px">✕ Matar</button></div></div>\`;
    }).join('')+'</div>';
  }catch(e){document.getElementById('instances').innerHTML='<div class="empty">erro ao carregar</div>';}
}
async function matar(taskId){
  if(!confirm('Matar '+taskId+'?'))return;
  try{
    const r=await fetch('/api/instances/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId})});
    const j=await r.json();
    if(!j.ok) alert('falhou: '+(j.error||'?'));
  }catch(e){alert('erro: '+e.message);}
}
async function tickStuck(){
  try{
    const r=await fetch('/api/stuck');stuckIds=await r.json();
  }catch{stuckIds=[];}
}
// Ledger
async function tickLedger(){
  try{
    const r=await fetch('/api/ledger');const d=await r.json();
    if(!d.length){document.getElementById('ledger').innerHTML='<div class="empty">ledger vazio</div>';return;}
    const groups={};
    for(const t of d){const s=t.status||'?';if(!groups[s])groups[s]=[];groups[s].push(t);}
    const statusColors={ready:'#3fb950',in_progress:'#58a6ff',review:'#d29922',rework:'#f85149',done:'#8b93a1',draft:'#6b7280'};
    document.getElementById('ledger').innerHTML='<div class="ledger-grid">'+Object.entries(groups).map(([s,ts])=>\`<div class="ledger-group"><div class="ledger-status" style="color:\${statusColors[s]||'#8b93a1'}">\${s} (\${ts.length})</div>\`+ts.map(t=>\`<div class="ledger-item"><span>\${t.id}</span> \${t.title||''} <small>\${t.capacity_target||''}</small></div>\`).join('')+'</div>').join('')+'</div>';
  }catch(e){document.getElementById('ledger').innerHTML='<div class="empty">erro ao carregar</div>';}
}
// Saldo
async function tickSaldo(){
  try{
    const r=await fetch('/api/saldo');const d=await r.json();
    if(!d.length){document.getElementById('saldo').innerHTML='<div class="empty">sem dados de saldo</div>';return;}
    document.getElementById('saldo').innerHTML='<div class="saldo-grid">'+d.map(s=>\`<div class="saldo-card"><div class="saldo-name">\${s.provider||'?'}</div><div class="saldo-val \${!s.ok?'bad':(s.available_usd<0.50?'low':'ok')}">\${s.available_usd!=null?'$'+Number(s.available_usd).toFixed(2):'?'}</div><div class="saldo-meta">\${s.ok!==false?'ok':'erro'}\${s.pending_usd!=null?' · pendente $'+Number(s.pending_usd).toFixed(2):''}</div></div>\`).join('')+'</div>';
  }catch(e){document.getElementById('saldo').innerHTML='<div class="empty">erro ao carregar</div>';}
}
// Dispatch
async function dispatch(){
  const btn=document.querySelector('button.dispatch');const msg=document.getElementById('dispatch-msg');
  btn.disabled=true;btn.textContent='⏳ Despachando…';msg.textContent='';
  try{
    const r=await fetch('/api/dispatch',{method:'POST'});const j=await r.json();
    msg.textContent=j.ok?'✅ Despacho concluído':('❌ '+ (j.error||'falhou'));
    setTimeout(()=>{tickInstances();tickLedger();},1200);
  }catch(e){msg.textContent='❌ erro: '+e.message;}
  finally{btn.textContent='▶ Despachar';btn.disabled=false;setTimeout(()=>{msg.textContent='';},5000);}
}
// Event Stream (SSE)
let eventLog=[];
const MAX_LOG=200;
function connectEventStream(){
  const es=new EventSource('/api/instances/events');
  es.onmessage=e=>{
    try{
      const evt=JSON.parse(e.data);
      eventLog.unshift(evt);
      if(eventLog.length>MAX_LOG)eventLog.length=MAX_LOG;
      const el=document.getElementById('event-stream');
      if(!el)return;
      const html=eventLog.slice(0,50).map(ev=>\`<div style="font-size:11px;padding:2px 0;border-bottom:1px solid #232730;display:flex;gap:8px"><span style="color:#8b93a1;flex:none">\${new Date(ev.ts).toLocaleTimeString()}</span><span style="color:#58a6ff;flex:none;font-weight:600">\${ev.taskId}</span><span style="color:#e6e8ec">\${ev.type}</span><span style="color:#8b93a1">\${ev.tools||ev.reason||ev.message||''}</span></div>\`).join('');
      el.innerHTML='<div style="max-height:400px;overflow-y:auto;background:#0a0c10;border-radius:8px;padding:8px;font-family:monospace">'+html+'</div>';
    }catch{}
  };
  es.onerror=()=>{
    document.getElementById('event-stream').innerHTML='<div class="empty">desconectado, reconectando…</div>';
  };
}
tick();tickInstances();tickLedger();tickSaldo();tickStuck();connectEventStream();
setInterval(tick,4000);setInterval(tickInstances,5000);setInterval(tickLedger,8000);setInterval(tickSaldo,15000);setInterval(tickStuck,10000);
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
