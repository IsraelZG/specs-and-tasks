#!/usr/bin/env node
/**
 * painel-agente — agente local do PAINEL REMOTO (modelo B, ADR 0007). Disca PARA FORA num broker de
 * realtime (Ably/Supabase) via WebSocket, recebe comandos da UI na nuvem, e os RELAIA para o painel
 * local (ORQ-06, 127.0.0.1:8780). A máquina fica inbound-fechada — o agente é cliente WS outbound.
 *
 * Este é o PoC da spike ORQ-07. A lógica load-bearing é `handleCommand()` — valida token, allowlist
 * de rotas e rate-limit, relaia p/ a rota local e devolve `{id,status,body}`. O transporte WS é
 * ortogonal (broker-agnóstico via envelope JSON próprio) e trivial; o valor/risco está nos GUARDS,
 * que o `--selftest` exercita contra o dashboard local real, sem precisar de broker nem conta.
 *
 * Dependency-free: usa o `WebSocket` GLOBAL nativo do Node 22 (cliente) e `fetch` global. Sem npm.
 *
 * Uso:
 *   node tools/scripts/painel-agente.mjs            # daemon: conecta no broker e relaia
 *   node tools/scripts/painel-agente.mjs --selftest # prova os guards + relay local (sem broker)
 *
 * .env: PAINEL_TOKEN (obrigatório), PAINEL_BROKER_URL (wss://…), PAINEL_LOCAL_URL (default 127.0.0.1:8780)
 *
 * ponytail: rate-limit é um token-bucket em memória por processo. Se um dia rodar >1 agente, mover o
 * contador p/ um arquivo compartilhado — YAGNI por ora (1 agente por máquina).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

// ---- .env (mesmo padrão do headroom-proxies/saldo) ----------------------------
function loadEnv() {
  const p = path.join(root, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const TOKEN = process.env.PAINEL_TOKEN || '';
const LOCAL = process.env.PAINEL_LOCAL_URL || 'http://127.0.0.1:8780';
const BROKER = process.env.PAINEL_BROKER_URL || '';
const AUDIT = path.join(root, 'tasks', '.orchestrator', 'painel-agente.log');

// ---- Allowlist de rotas (a máquina só relaia o que é conhecido) ---------------
// method + path exato (ou prefixo p/ querystring). NUNCA um path local arbitrário.
const ALLOW = [
  { method: 'GET', path: '/api/status' },
  { method: 'GET', path: '/api/ledger', prefix: true },
  { method: 'GET', path: '/api/instances' },
  { method: 'GET', path: '/api/saldo' },
  { method: 'POST', path: '/api/dispatch' },
];
function routeAllowed(method, urlPath) {
  const base = urlPath.split('?')[0];
  return ALLOW.some((r) => r.method === method && (r.prefix ? base === r.path : urlPath === r.path));
}

// ---- Rate-limit do dispatch (defesa-em-profundidade do ADR §D) ----------------
const DISPATCH_MAX = Number(process.env.PAINEL_DISPATCH_PER_MIN || 3);
let dispatchHits = []; // timestamps (ms) na janela de 60s
function dispatchAllowed() {
  const now = Date.now();
  dispatchHits = dispatchHits.filter((t) => now - t < 60_000);
  if (dispatchHits.length >= DISPATCH_MAX) return false;
  dispatchHits.push(now);
  return true;
}

function audit(line) {
  try {
    fs.mkdirSync(path.dirname(AUDIT), { recursive: true });
    fs.appendFileSync(AUDIT, `${new Date().toISOString()} ${line}\n`);
  } catch { /* audit é best-effort */ }
}

/**
 * Núcleo load-bearing: valida e relaia UM envelope de comando.
 * envelope = { id, token, method, path, body? }
 * retorna  = { id, status, body }  (status 401/403/429 são recusas do próprio agente)
 */
export async function handleCommand(envelope, { fetchImpl = fetch } = {}) {
  const { id, token, method = 'GET', path: urlPath = '', body } = envelope || {};
  if (!TOKEN || token !== TOKEN) {
    audit(`REJECT auth id=${id} path=${urlPath}`);
    return { id, status: 401, body: { error: 'token inválido' } };
  }
  if (!routeAllowed(method, urlPath)) {
    audit(`REJECT route id=${id} ${method} ${urlPath}`);
    return { id, status: 403, body: { error: 'rota não permitida' } };
  }
  const isDispatch = method === 'POST' && urlPath === '/api/dispatch';
  if (isDispatch && !dispatchAllowed()) {
    audit(`REJECT ratelimit id=${id}`);
    return { id, status: 429, body: { error: `rate-limit: máx ${DISPATCH_MAX} dispatch/min` } };
  }
  try {
    const res = await fetchImpl(`${LOCAL}${urlPath}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    if (isDispatch) audit(`DISPATCH id=${id} status=${res.status}`);
    return { id, status: res.status, body: parsed };
  } catch (e) {
    audit(`ERROR id=${id} ${urlPath} — ${e.message}`);
    return { id, status: 502, body: { error: `painel local inacessível: ${e.message}` } };
  }
}

// ---- Transporte WS (broker-agnóstico via envelope) ----------------------------
function connect() {
  if (!TOKEN) { console.error('✖ PAINEL_TOKEN ausente no .env'); process.exit(1); }
  if (!BROKER) { console.error('✖ PAINEL_BROKER_URL ausente (ver runbook no ADR 0007)'); process.exit(1); }
  if (typeof WebSocket === 'undefined') { console.error('✖ WebSocket global ausente — precisa Node 22+'); process.exit(1); }

  let backoff = 1000;
  const open = () => {
    const ws = new WebSocket(BROKER);
    ws.addEventListener('open', () => {
      backoff = 1000;
      console.log(`✅ conectado ao broker; relaiando p/ ${LOCAL}`);
      // Handshake de canal/auth é específico do broker (Ably/Supabase) — ver ADR §B. Aqui: envelope puro.
    });
    ws.addEventListener('message', async (ev) => {
      let env;
      try { env = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString()); } catch { return; }
      if (env.type === 'ping') { ws.send(JSON.stringify({ type: 'pong', id: env.id })); return; }
      if (env.type !== 'cmd') return;
      const res = await handleCommand(env);
      ws.send(JSON.stringify({ type: 'res', ...res }));
    });
    ws.addEventListener('close', () => {
      console.error(`… broker caiu; reconectando em ${backoff}ms`);
      setTimeout(open, backoff);
      backoff = Math.min(backoff * 2, 30_000);
    });
    ws.addEventListener('error', () => ws.close());
    const hb = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' })); }, 25_000);
    ws.addEventListener('close', () => clearInterval(hb));
  };
  open();
}

// ---- Selftest: prova os guards + relay contra o dashboard local real ----------
async function selftest() {
  if (!TOKEN) { console.error('✖ defina PAINEL_TOKEN no .env p/ o selftest'); process.exit(1); }
  const P = (label, cond) => console.log(`  ${cond ? '✅' : '✖ FALHA'} ${label}`);
  let ok = true; const chk = (c) => (ok = ok && c, c);

  // 1) token inválido → 401 (sem tocar a rede)
  const bad = await handleCommand({ id: 1, token: 'errado', method: 'GET', path: '/api/ledger' });
  P('token inválido → 401', chk(bad.status === 401));

  // 2) rota fora da allowlist → 403 (mesmo com token certo)
  const forb = await handleCommand({ id: 2, token: TOKEN, method: 'GET', path: '/etc/passwd' });
  P('rota não permitida → 403', chk(forb.status === 403));

  // 3) GET /api/ledger relaiado → 200 + JSON (precisa do dashboard ORQ-06 no ar)
  const led = await handleCommand({ id: 3, token: TOKEN, method: 'GET', path: '/api/ledger' });
  P(`GET /api/ledger relaiado → ${led.status}`, chk(led.status === 200));

  // 4) rate-limit do dispatch: N permitidos, N+1 → 429 (fetch mockado p/ não gastar $)
  const mockFetch = async () => ({ status: 200, text: async () => '{"ok":true}' });
  dispatchHits = [];
  const results = [];
  for (let i = 0; i < DISPATCH_MAX + 1; i++) {
    results.push((await handleCommand({ id: 100 + i, token: TOKEN, method: 'POST', path: '/api/dispatch' }, { fetchImpl: mockFetch })).status);
  }
  const passed = results.slice(0, DISPATCH_MAX).every((s) => s === 200);
  const blocked = results[DISPATCH_MAX] === 429;
  P(`rate-limit: ${DISPATCH_MAX} ok + 1 bloqueado (429)`, chk(passed && blocked));

  console.log(ok ? '\n✅ selftest OK' : '\n✖ selftest FALHOU');
  process.exit(ok ? 0 : 1);
}

// ---- dispatch -----------------------------------------------------------------
if (process.argv.includes('--selftest')) selftest();
else connect();
