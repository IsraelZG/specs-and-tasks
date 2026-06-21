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
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8' });
    console.log(`• ${label}: ${r.status === 0 ? `parado (pid ${pid})` : `pid ${pid} já não estava ativo`}`);
  }
  fs.rmSync(p, { force: true });
}

stop('Backend', 'backend.pid');
stop('Frontend', 'frontend.pid');

if (alsoHeadroom) {
  stop('Headroom', 'headroom.pid');
  // Adiciona fallback por porta para matar processos órfãos do shim do Windows
  try {
    const res = spawnSync('cmd.exe', ['/c', 'netstat -ano | findstr LISTENING | findstr :8787'], { encoding: 'utf8' });
    const lines = (res.stdout || '').split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const parts = line.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) {
        spawnSync('taskkill', ['/PID', pid, '/F'], { encoding: 'utf8' });
        console.log(`• Headroom (porta 8787): parado (pid ${pid})`);
      }
    }
  } catch (e) {
    // Silencioso
  }
} else {
  console.log('• Headroom: mantido de pé (use --headroom para derrubar)');
}
