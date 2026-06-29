#!/usr/bin/env node
/**
 * drift-check — cruza o status MGTIA (repo de controle) com o código na master do superapp.
 * Detecta os dois males que custaram dias de investigação manual:
 *
 *   (A) INTEGRATION DRIFT — task `done` mas arquivos de código da sua branch AUSENTES da master
 *       (o `wt merge` foi pulado; ex.: T-204/T-501/T-301/T-308). É o perigoso: trabalho "pronto"
 *       que nunca entrou no produto.
 *   (B) STATUS DRIFT (candidatos) — task NÃO-done mas todo o código da branch já está na master
 *       (provável merge feito sem fechar o status; ex.: T-108). Mais ruidoso — sinaliza p/ revisão.
 *
 * Sinal confiável = ARQUIVO presente na árvore da master (NÃO ancestralidade de branch, que dá
 * falso-positivo com squash-merge). Uso:  node tools/scripts/drift-check.mjs
 * Aponte o repo de código com SUPERAPP_DIR (default: ../superapp). Exit 1 se houver integration drift.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..', '..');
const codeRepo = process.env.SUPERAPP_DIR || path.resolve(docsRoot, '..', 'superapp');
const tasksDir = path.join(docsRoot, 'tasks');

const SRC = (f) => /^packages\/.*\/src\/.*\.ts$/.test(f) && !/\.test\.|\.d\.ts$/.test(f);
const git = (args) => execSync(`git -C "${codeRepo}" ${args}`, { encoding: 'utf8' }).trim();

/** Lê o status de uma task, considerando o prefixo `_` (superseded). */
function taskStatus(id) {
  for (const f of [`${id}.md`, `_${id}.md`]) {
    const p = path.join(tasksDir, f);
    if (fs.existsSync(p)) {
      const m = fs.readFileSync(p, 'utf8').match(/^status:\s*(\S+)/m);
      return m ? m[1].trim() : null;
    }
  }
  return null;
}

try { git('fetch --quiet origin'); } catch { /* offline — usa o que tem */ }

const masterFiles = new Set(git('ls-tree -r --name-only master').split('\n').filter(SRC));
const refs = git('for-each-ref --format=%(refname) refs/remotes/origin/task/').split('\n').filter(Boolean);

const integration = [];
const status = [];
for (const ref of refs) {
  const id = ref.replace(/.*\/task\//, '');
  if (/rework|followup/.test(id)) continue;
  const st = taskStatus(id);
  if (!st) continue;
  const branchFiles = git(`ls-tree -r --name-only ${ref}`).split('\n').filter(SRC);
  if (branchFiles.length === 0) continue;
  const missing = branchFiles.filter((f) => !masterFiles.has(f));
  if (st === 'done' && missing.length) integration.push({ id, missing });
  else if (st !== 'done' && missing.length === 0 &&
           ['ready', 'review', 'rework', 'blocked', 'in_progress'].includes(st)) {
    status.push({ id, st });
  }
}

console.log('drift-check — superapp:', codeRepo, '\n');
if (integration.length) {
  console.log(`❌ INTEGRATION DRIFT (${integration.length}) — task done, código FORA da master (rode \`wt merge\`):`);
  for (const { id, missing } of integration) {
    console.log(`   ${id}:`);
    missing.forEach((f) => console.log(`      • ${f}`));
  }
} else console.log('✅ Sem integration drift (todo código de task done está na master).');

console.log('');
if (status.length) {
  console.log(`⚠️  STATUS DRIFT — candidatos (código na master, status ainda aberto — investigar/reconciliar):`);
  status.forEach(({ id, st }) => console.log(`   ${id}  (status: ${st})`));
} else console.log('✅ Sem candidatos a status drift.');

process.exit(integration.length ? 1 : 0);
