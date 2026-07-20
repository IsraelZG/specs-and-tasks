#!/usr/bin/env node
// M5 (retrospectiva 2026-07-19) — INVERSO do decompose.
// Funde N tasks pequenas (Sonnet/Haiku, ainda não iniciadas) em UMA task maior
// para um modelo mais capaz (Opus). O decompose quebra 1→N quando a spec é
// grande demais; compose junta N→1 quando o custo de esteira (endurecer +
// worktree + gate + review + integrar + reconciliar entre elas) supera o
// ganho de granularidade. Trabalho integrativo (UI, fluxos que se cruzam) é o
// caso típico: 3 Sonnet + 3 endurecimentos + 3 reviews + reconciliações custam
// mais que 1 Opus executando a fatia inteira coerente.
//
// Uso:
//   node tools/scripts/compose-task.mjs <novoId> "<título>" <src1> <src2> [src3...]
//   node tools/scripts/compose-task.mjs --dry-run <novoId> "<título>" <src1> <src2>
//
// Guarda: só compõe fontes AINDA NÃO INICIADAS (draft:* ou ready). Se qualquer
// fonte está in_progress/review/done, ABORTA — compor trabalho já em voo perde
// histórico e cria ambiguidade de integração. Idempotência: re-rodar com o
// mesmo novoId falha (arquivo existe) — proposital, evita fusão dupla.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const dryRun = argv[0] === '--dry-run';
const [newId, title, ...sources] = dryRun ? argv.slice(1) : argv;

if (!newId || !title || sources.length < 2) {
  console.error('Uso: node tools/scripts/compose-task.mjs [--dry-run] <novoId> "<título>" <src1> <src2> [src3...]');
  console.error('  (mínimo 2 fontes; compor 1 não faz sentido)');
  process.exit(1);
}

const repoRoot = process.cwd();
const tasksDir = path.join(repoRoot, 'tasks');

function taskPath(id) {
  const p = path.join(tasksDir, `${id}.md`);
  return fs.existsSync(p) ? p : null;
}
function readTask(id) {
  const p = taskPath(id);
  if (!p) return null;
  return fs.readFileSync(p, 'utf8');
}
function field(content, name) {
  const m = content.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : '';
}
function idArray(raw) {
  return raw.replace(/#.*$/, '').replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
}
function section(content, heading) {
  // extrai da linha "## N. Heading" até a próxima "## "
  const re = new RegExp(`(^##\\s+${heading}[^\\n]*\\n[\\s\\S]*?)(?=^##\\s|\\Z)`, 'm');
  const m = content.match(re);
  return m ? m[1].trim() : '';
}

// --- valida fontes -----------------------------------------------------------
const COMPOSABLE = new Set(['draft:placeholder', 'draft:triaged', 'draft:pending_decision', 'draft:hardened', 'ready']);
const loaded = [];
for (const id of sources) {
  const content = readTask(id);
  if (!content) { console.error(`❌ fonte não encontrada: ${id}`); process.exit(1); }
  const status = field(content, 'status');
  if (!COMPOSABLE.has(status)) {
    console.error(`❌ ${id} está \`${status}\` — só compõe fontes não-iniciadas (${[...COMPOSABLE].join(', ')}).`);
    console.error('   Compor trabalho em voo (in_progress/review/done) perde histórico e ambiguiza integração.');
    process.exit(1);
  }
  loaded.push({ id, content, status });
}
if (taskPath(newId)) { console.error(`❌ ${newId} já existe.`); process.exit(1); }

// --- agrega metadados --------------------------------------------------------
const srcSet = new Set(sources);
const deps = [...new Set(loaded.flatMap(t => idArray(field(t.content, 'dependencies'))))].filter(d => !srcSet.has(d));
const blocks = [...new Set(loaded.flatMap(t => idArray(field(t.content, 'blocks'))))].filter(b => !srcSet.has(b));
const reviewer = field(loaded[0].content, 'reviewer_agent') || 'agile_reviewer';
const target = field(loaded[0].content, 'target_agent') || 'logic_agent';
const anyUi = loaded.some(t => field(t.content, 'ui') === 'true');

// --- corpo: proveniência + objetivos e escopos concatenados ------------------
const provenance = loaded.map(t => `- **${t.id}** (${t.status}): ${field(t.content, 'title').replace(/^"|"$/g, '')}`).join('\n');
const objetivos = loaded.map(t => {
  const o = section(t.content, '1\\. Objetivo').replace(/^##\s+1\.\s+Objetivo\s*/m, '').trim();
  return `### De ${t.id}\n${o}`;
}).join('\n\n');
const escopos = loaded.map(t => {
  const e = section(t.content, '3\\. Escopo');
  return e ? `### De ${t.id}\n${e.replace(/^##\s+3\.[^\n]*\n/, '')}` : `### De ${t.id}\n(sem seção de escopo)`;
}).join('\n\n');

const template = `---
id: ${newId}
title: "${title}"
status: draft:triaged
complexity: 6
target_agent: ${target}
reviewer_agent: ${reviewer}
execution_mode: sequential
dependencies: [${deps.join(', ')}]
blocks: [${blocks.join(', ')}]
capacity_target: opus
composed_from: [${sources.join(', ')}]${anyUi ? '\nui: true' : ''}
---

# ${newId} · ${title}

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** \`C:\\Dev2026\\superapp\` em worktree \`task/${newId}\`.
- **Capacidade-alvo: opus** — task COMPOSTA (fusão de ${sources.length} tasks menores). O corpo abaixo
  agrega os objetivos e escopos das fontes; um endurecimento (\`/endurecer-task\`) deve unificá-los
  numa spec coerente única antes da execução — NÃO é para executar como ${sources.length} pedaços soltos.

## Proveniência (M5 compose)
Esta task foi composta de:
${provenance}

As fontes foram marcadas \`obsolete\` apontando para ${newId}. O ganho: uma execução Opus coerente
em vez de ${sources.length} execuções pequenas + endurecimentos + reviews + reconciliações entre elas.

## 1. Objetivo
${objetivos}

## 3. Escopo de Arquivos — contratos exatos
> **A unificar no endurecimento:** deduplicar arquivos tocados por mais de uma fonte, resolver
> contratos que se cruzam, e produzir UMA lista de escopo coerente.

${escopos}

## 7. Definition of Done
- [ ] Todos os objetivos das fontes entregues numa implementação coerente única.
- [ ] Gate de Evidência (build+test+lint+e2e) colado na Seção 8.

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por \`manage-task.mjs\`/serviço MGTIA.
`;

if (dryRun) {
  console.log(`— DRY RUN —\nCriaria: tasks/${newId}.md (capacity_target: opus, deps=[${deps.join(', ')}])`);
  console.log(`Obsoletaria: ${sources.join(', ')}`);
  process.exit(0);
}

// --- escreve a nova task -----------------------------------------------------
fs.writeFileSync(path.join(tasksDir, `${newId}.md`), template, 'utf8');
console.log(`✅ criada tasks/${newId}.md (opus, composta de ${sources.length})`);

// --- obsoleta as fontes via TaskService (mesmo padrão do close-decomposed) ---
const distPath = path.resolve(repoRoot, 'apps/nexus-backend/dist/services/task.service.js');
let TaskService;
try {
  ({ TaskService } = await import(pathToFileURL(distPath).href));
} catch {
  console.error('⚠️  Backend não compilado — fontes NÃO obsoletadas. Rode `obsolete` manualmente:');
  for (const id of sources) console.error(`   node tools/scripts/manage-task.mjs obsolete ${id} <SeuModelo> "composta em ${newId}"`);
  console.error(`Depois enfileire: node tools/scripts/fila.mjs add ${newId} "compose ${sources.join('+')} -> ${newId}" ${sources.map(s => `tasks/${s}.md`).join(' ')}`);
  process.exit(0);
}
const svc = new TaskService({ rootDir: repoRoot });
for (const id of sources) {
  try {
    await svc.transition(id, 'obsolete', 'compose-task', `composta em ${newId} (M5)`);
    console.log(`  obsolete: ${id} → ${newId}`);
  } catch (e) {
    console.error(`  ⚠️ falha ao obsoletar ${id}: ${e.message} — obsolete manualmente.`);
  }
}

console.log(`\nPróximo: /endurecer-task ${newId} (unificar a spec composta) → executar como Opus.`);
console.log(`Enfileire o controle: node tools/scripts/fila.mjs add ${newId} "compose ${sources.join('+')} -> ${newId}" ${sources.map(s => `tasks/${s}.md`).join(' ')}`);
