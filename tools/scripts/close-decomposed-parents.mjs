// M-016 · Script one-shot de backfill: fecha pais decompostos cujas filhas estão todas done.
// Uso: node tools/scripts/close-decomposed-parents.mjs [--dry-run]
// Idempotente: re-rodar é seguro (pais já done são skip).

import fs from 'node:fs';
import path from 'node:path';
import { TaskService } from '../../apps/nexus-backend/dist/services/task.service.js';

const dryRun = process.argv.includes('--dry-run');
const svc = new TaskService({ rootDir: process.cwd() });

function parseArray(raw) {
  if (!raw || typeof raw !== 'string') return [];
  // strip inline YAML comments (anything after # not inside quotes)
  const cleaned = raw.replace(/#.*$/gm, '');
  return cleaned.replace(/[\[\]"\s]/g, '').split(',').filter(Boolean);
}

const parents = svc.listTasks().filter(r => r.frontmatter.status === 'draft:decomposed');
let closed = 0;

for (const p of parents) {
  const content = fs.readFileSync(p.path, 'utf8');
  const fm = svc.parseFrontmatterNaive(content);
  const childIds = parseArray(fm.subtasks || fm.children);

  if (childIds.length === 0) {
    console.log(`${p.id}: sem filhos — pulando`);
    continue;
  }

  const allDone = childIds.every(id => {
    try {
      const c = svc.getTask(id);
      return c && c.frontmatter.status === 'done';
    } catch {
      return false;
    }
  });

  if (allDone) {
    if (dryRun) {
      console.log(`[dry-run] fecharia ${p.id} (${childIds.length} filhas: ${childIds.join(', ')})`);
    } else {
      svc.autoTransition(p.id, 'done', '[Auto-encerrado retroativo]',
        `M-016: todas as ${childIds.length} filhas done — backfill one-shot`);
      console.log(`${p.id}: fechado (${childIds.length} filhas done)`);
      closed++;
    }
  } else {
    const notDone = childIds.filter(id => {
      try { const c = svc.getTask(id); return !c || c.frontmatter.status !== 'done'; } catch { return true; }
    });
    console.log(`${p.id}: pendente — filhas não-done: ${notDone.join(', ')}`);
  }
}

console.log(dryRun ? `\n[dry-run] ${closed} pais seriam fechados` : `\nclosed: ${closed}`);
if (!dryRun && closed === 0) console.log('(idempotente — todos já fechados)');
