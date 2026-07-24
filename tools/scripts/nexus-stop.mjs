#!/usr/bin/env node
// nexus-stop: derruba backend+frontend (por árvore de PID). O Headroom só cai com --headroom.
// Ver tasks/T-1027.md.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const runDir = path.join(repoRoot, '.nexus', 'run');
const alsoHeadroom = process.argv.includes('--headroom');

function stop(label, pidName) {
  const p = path.join(runDir, pidName);
  if (!fs.existsSync(p)) {
    console.log(`• ${label}: nada registrado`);
    return;
  }
  const pid = parseInt(fs.readFileSync(p, 'utf8').trim(), 10);
  if (Number.isFinite(pid)) {
    const ok = killTree(pid);
    console.log(`• ${label}: ${ok ? `parado (pid ${pid})` : `pid ${pid} já não estava ativo`}`);
  }
  fs.rmSync(p, { force: true });
}

/** Mata o processo e sua árvore, multiplataforma. */
function killTree(pid) {
  if (process.platform === 'win32') {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8' });
    return r.status === 0;
  }
  // POSIX: tenta o process group (spawn detached cria um), senão o pid direto
  try { process.kill(-pid, 'SIGTERM'); return true; } catch { /* sem group */ }
  try { process.kill(pid, 'SIGTERM'); return true; } catch { return false; }
}

/** PIDs escutando na porta, multiplataforma. */
function pidsOnPort(port) {
  if (process.platform === 'win32') {
    const res = spawnSync('cmd.exe', ['/c', `netstat -ano | findstr LISTENING | findstr :${port}`], { encoding: 'utf8' });
    return (res.stdout || '').split('\n').map(l => l.trim()).filter(Boolean)
      .map(l => l.split(/\s+/).pop()).filter(pid => pid && /^\d+$/.test(pid));
  }
  const res = spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
  return (res.stdout || '').split('\n').map(l => l.trim()).filter(l => /^\d+$/.test(l));
}

stop('Backend', 'backend.pid');
stop('Frontend', 'frontend.pid');

if (alsoHeadroom) {
  stop('Headroom', 'headroom.pid');
  // Fallback por porta para matar processos órfãos (shim do Windows / detached no POSIX)
  try {
    for (const pid of pidsOnPort(8787)) {
      killTree(parseInt(pid, 10));
      console.log(`• Headroom (porta 8787): parado (pid ${pid})`);
    }
  } catch (e) {
    // Silencioso
  }
} else {
  console.log('• Headroom: mantido de pé (use --headroom para derrubar)');
}
