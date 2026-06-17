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
} else {
  console.log('• Headroom: mantido de pé (use --headroom para derrubar)');
}
