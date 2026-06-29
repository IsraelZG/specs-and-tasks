#!/usr/bin/env node
/**
 * hardening — painel do EIXO DE QUALIDADE DA SPEC (ortogonal ao lifecycle `status`, que é
 * service-only). Lê o frontmatter de tasks/*.md e responde três perguntas que o arquiteto faria
 * relendo o backlog à mão:
 *
 *   (1) Estado de endurecimento do backlog  — quantas draft/triaged/hardened/blocked-decision/decomposed.
 *   (2) Fila de DECISÕES  — tasks `spec_status: blocked-decision` + as decisões abertas (campo
 *       `decisions:`). É o que destrava o arquiteto: a lista do que só ele pode resolver.
 *   (3) Candidatas a REENDURECER  — task ainda-não-iniciada, já `hardened`, cujas dependências
 *       agora estão `done`. A fundação que ela só podia citar vagamente JÁ EXISTE; reendurecer
 *       troca placeholder por assinatura real. Mostra `hardened_at` p/ o humano julgar "quão velho".
 *
 * Só LÊ (o eixo spec_status é metadado de autoria, editado pelo endurecer-task; nunca mexe em
 * status/INDEX/Log). Uso:  node tools/scripts/hardening.mjs [prefixo]
 *
 * ponytail: flag de reendurecer dispara p/ QUALQUER dep done, não só deps que viraram done DEPOIS
 * do hardened_at — o humano confere a data. Apertar com ancestralidade de commit git se ruidoso.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tasksDir = path.join(path.resolve(__dirname, '..', '..'), 'tasks');
const prefix = process.argv[2] || '';

/** Frontmatter flat parser (stdlib — sem dep de yaml). */
function parse(file) {
  const txt = fs.readFileSync(path.join(tasksDir, file), 'utf8').replace(/\r\n/g, '\n');
  const fm = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const body = txt.slice(fm[0].length);
  const get = (k) => {
    const m = fm[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return m ? m[1].replace(/#.*$/, '').trim().replace(/^["']|["']$/g, '') : null;
  };
  const arr = (k) => {
    const m = fm[1].match(new RegExp(`^${k}:\\s*\\[(.*?)\\]`, 'm'));
    return m ? [...m[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map((x) => x[1] || x[2]) : [];
  };
  // capacity_target: frontmatter primeiro, senão a linha "Capacidade-alvo:" do corpo.
  let cap = get('capacity_target');
  if (!cap) {
    const m = body.match(/Capacidade-alvo:\*{0,2}\s*`?([a-z-]+)/i);
    cap = m ? m[1].toLowerCase() : null;
  }
  return {
    id: get('id') || file.replace(/^_?|\.md$/g, ''),
    status: get('status'),
    spec_status: get('spec_status') || 'draft',
    capacity: cap,
    hardened_at: get('hardened_at'),
    deps: arr('dependencies'),
    decisions: arr('decisions'),
  };
}

const files = fs.readdirSync(tasksDir).filter((f) => /^_?[A-Z]+-[\w.]+\.md$/.test(f) && f !== 'INDEX.md');
const tasks = files.map(parse).filter(Boolean);
const byId = new Map(tasks.map((t) => [t.id, t]));
const pick = (t) => t.id.startsWith(prefix);
const NOT_STARTED = new Set(['draft', 'ready']);

// (1) estado
const states = {};
for (const t of tasks.filter(pick)) states[t.spec_status] = (states[t.spec_status] || 0) + 1;

// (2) decisões abertas
const blocked = tasks.filter(pick).filter((t) => t.spec_status === 'blocked-decision');

// (3) reendurecer
const reharden = tasks.filter(pick).filter((t) =>
  t.spec_status === 'hardened' &&
  NOT_STARTED.has(t.status) &&
  t.deps.some((d) => byId.get(d)?.status === 'done'),
);

console.log(`hardening — backlog${prefix ? ` (prefixo ${prefix})` : ''}\n`);

console.log('▸ Estado de endurecimento (spec_status):');
for (const k of ['draft', 'triaged', 'hardened', 'blocked-decision', 'decomposed']) {
  if (states[k]) console.log(`   ${k.padEnd(17)} ${states[k]}`);
}

console.log('\n▸ Fila de DECISÕES (só o arquiteto resolve):');
if (!blocked.length) console.log('   ✅ nenhuma decisão aberta bloqueando endurecimento.');
for (const t of blocked) {
  console.log(`   ${t.id}${t.capacity ? ` [${t.capacity}]` : ''}`);
  if (t.decisions.length) t.decisions.forEach((d) => console.log(`      • ${d}`));
  else console.log('      • (decisões na Seção 6 — campo decisions: vazio)');
}

console.log('\n▸ Candidatas a REENDURECER (deps já done, spec hardened cedo):');
if (!reharden.length) console.log('   ✅ nenhuma — nenhum endurecimento ficou stale.');
for (const t of reharden) {
  const done = t.deps.filter((d) => byId.get(d)?.status === 'done');
  console.log(`   ${t.id}  (hardened_at: ${t.hardened_at || '?'})  deps done: ${done.join(', ')}`);
}
console.log('');
