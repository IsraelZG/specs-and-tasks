#!/usr/bin/env node
// nexus-start: bootstrap idempotente do dia de trabalho.
// Sobe (1) um proxy Headroom standing ÚNICO no Windows, (2) backend e (3) frontend, todos detached.
// Roda no host Windows. O opencode (WSL) aponta pro proxy via IP do host (ver tasks/T-1027.md).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const runDir = path.join(repoRoot, '.nexus', 'run');
fs.mkdirSync(runDir, { recursive: true });

const HEADROOM_PORT = 8787;
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 5173;
const HEADROOM_URL = `http://127.0.0.1:${HEADROOM_PORT}`;
const DEEPINFRA_OPENAI_URL = 'https://api.deepinfra.com';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET com timeout; true se status 2xx/3xx. */
async function httpOk(url, timeoutMs = 2000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/** True se o PID estiver vivo no Windows (tasklist). */
function pidAlive(pid) {
  if (!pid) return false;
  const r = spawnSync('tasklist', ['/FI', `PID eq ${pid}`, '/NH'], { encoding: 'utf8' });
  return (r.stdout || '').includes(String(pid));
}

function readPid(name) {
  const p = path.join(runDir, name);
  if (!fs.existsSync(p)) return null;
  const v = parseInt(fs.readFileSync(p, 'utf8').trim(), 10);
  return Number.isFinite(v) ? v : null;
}

/** Resolve o headroom.exe: PATH (`where`) → caminho conhecido do pip Scripts. */
function resolveHeadroomExe() {
  const w = spawnSync('where', ['headroom'], { encoding: 'utf8' });
  const fromPath = (w.stdout || '').split(/\r?\n/).map((s) => s.trim()).find((s) => s && fs.existsSync(s));
  if (fromPath) return fromPath;
  const known = path.join(process.env.APPDATA || '', 'Python', 'Python313', 'Scripts', 'headroom.exe');
  return fs.existsSync(known) ? known : null;
}

// ─────────────────────────────────────────────────────────── 1. pré-requisito
const headroomExe = resolveHeadroomExe();
if (!headroomExe) {
  console.error('❌ headroom.exe não encontrado no Windows. Instale com:');
  console.error('       python -m pip install "headroom-ai[all]"');
  process.exit(2);
}

// ──────────────────────────────────────────── 2. Headroom standing no Windows
if (await httpOk(`${HEADROOM_URL}/stats`)) {
  console.log(`• Headroom já rodando (Windows:${HEADROOM_PORT})`);
} else {
  console.log(`• Subindo Headroom no Windows (porta ${HEADROOM_PORT})...`);
  const logFd = fs.openSync(path.join(runDir, 'headroom.log'), 'a');
  const child = spawn(
    headroomExe,
    ['proxy', '--host', '0.0.0.0', '--port', String(HEADROOM_PORT),
      '--openai-api-url', DEEPINFRA_OPENAI_URL, '--no-subscription-tracking'],
    { detached: true, stdio: ['ignore', logFd, logFd], windowsHide: true },
  );
  child.unref();
  fs.writeFileSync(path.join(runDir, 'headroom.pid'), String(child.pid));
  let up = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    if (await httpOk(`${HEADROOM_URL}/stats`)) { up = true; break; }
  }
  if (!up) {
    console.error('❌ Headroom não respondeu em /stats após 25s. Veja .nexus/run/headroom.log.');
    process.exit(1);
  }
  console.log('  ✓ Headroom no ar');
}

// ─────────────────────────────────────────── 3-5. backend + frontend detached
function startDetached(label, args, logName, pidName, port) {
  const pid = readPid(pidName);
  if (pidAlive(pid)) {
    console.log(`• ${label} já rodando (pid ${pid}, porta ${port})`);
    return;
  }
  const logFd = fs.openSync(path.join(runDir, logName), 'a');
  const child = spawn('pnpm', args, {
    cwd: repoRoot,
    detached: true,
    shell: true,
    env: { ...process.env, HEADROOM_URL, PORT: String(BACKEND_PORT) },
    stdio: ['ignore', logFd, logFd],
  });
  child.unref();
  fs.writeFileSync(path.join(runDir, pidName), String(child.pid));
  console.log(`• ${label} iniciando (pid ${child.pid}, porta ${port}) → .nexus/run/${logName}`);
}

startDetached('Backend', ['--filter', 'nexus-backend', 'dev'], 'backend.log', 'backend.pid', BACKEND_PORT);
startDetached('Frontend', ['--filter', 'nexus-frontend', 'dev'], 'frontend.log', 'frontend.pid', FRONTEND_PORT);

// ─────────────────────────────────────────────────────── 6. health-checks
async function waitHttp(label, url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await httpOk(url)) return true;
    await sleep(1000);
  }
  console.warn(`⚠ ${label} não respondeu em ${url} dentro de ${timeoutMs / 1000}s (veja o log).`);
  return false;
}

await waitHttp('Backend', `http://127.0.0.1:${BACKEND_PORT}/health`);
// Vite faz bind em localhost (IPv6 [::1]) — checar por nome, não pelo literal IPv4.
await waitHttp('Frontend', `http://localhost:${FRONTEND_PORT}/`);

// ─────────────────────────────────────────────────────────── 7. resumo
console.log('');
console.log('✅ nexus up');
console.log(`   Headroom : ${HEADROOM_URL}  (Windows)`);
console.log(`   Backend  : http://127.0.0.1:${BACKEND_PORT}  (HEADROOM_URL=${HEADROOM_URL})`);
console.log(`   Frontend : http://127.0.0.1:${FRONTEND_PORT}`);
console.log('   Logs     : .nexus/run/*.log    | Parar: pnpm nexus:stop');
process.exit(0);
