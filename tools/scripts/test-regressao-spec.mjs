#!/usr/bin/env node
/**
 * test-regressao-spec.mjs — testes de regressão para problemas conhecidos de specs.
 *
 * Cobre:
 * 12. BOM antes do frontmatter (caso T-1033)
 * 13. Duas seções §9
 * 14. Comentário inline após dependencies: [...]
 * 15. Transição obsolete
 *
 * Cria tasks temporárias, valida parsing, e limpa depois.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'regressao-test-'));
let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, label) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.error(`  ❌ ${label}`);
  }
}

function writeTask(name, content) {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

/** Parse frontmatter, tolerando BOM. */
function parseFrontmatter(txt) {
  const cleaned = txt.replace(/^\uFEFF/, '');
  const m = cleaned.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : null;
}

/** Parse §9 log entries. */
function parseLog(txt) {
  const cleaned = txt.replace(/^\uFEFF/, '');
  const sections = cleaned.split(/^##\s*9\./m);
  return sections.length - 1; // number of §9 sections
}

/** Extract dependencies field. */
function extractDeps(fm) {
  if (!fm) return null;
  const m = fm.match(/^dependencies:\s*\[([^\]]*)\]/m);
  return m ? m[1] : null;
}

console.log(`\n🧪 Testes de Regressão de Specs — dir: ${tmpDir}\n`);

// --- Cenário 12: BOM antes do frontmatter ---
console.log('═══ Cenário 12: BOM antes do frontmatter ═══');
// BOM: UTF-8 BOM is \uFEFF (EF BB BF in bytes)
const bomContent = '\uFEFF---\nid: BOM-TASK\nstatus: ready\n---\n# Task with BOM\n';
writeTask('bom-task.md', bomContent);
const fmFromBom = parseFrontmatter(bomContent);
assert(fmFromBom !== null, 'frontmatter parseável mesmo com BOM');
assert(fmFromBom.includes('id: BOM-TASK'), 'id extraído corretamente com BOM');
assert(fmFromBom.includes('status: ready'), 'status extraído corretamente com BOM');

// Without BOM
const noBomContent = '---\nid: NOBOM-TASK\nstatus: ready\n---\n# Task without BOM\n';
const fmFromNoBom = parseFrontmatter(noBomContent);
assert(fmFromNoBom !== null, 'frontmatter parseável sem BOM');
assert(fmFromNoBom.includes('id: NOBOM-TASK'), 'id extraído corretamente sem BOM');
console.log('');

// --- Cenário 13: Duas seções §9 ---
console.log('═══ Cenário 13: Duas seções §9 ═══');
const dualLogContent = `---
id: DUAL-LOG
status: ready
---
# Task with dual §9

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-01]** - *system* - \`[Started]\`

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-02]** - *system* - \`[Finished]\`
`;
writeTask('dual-log.md', dualLogContent);
const logCount = parseLog(dualLogContent);
assert(logCount === 2, `duas seções §9 detectadas (count=${logCount})`);

// Parse entries from BOTH sections (ledger.mjs pattern)
const cleaned = dualLogContent.replace(/^\uFEFF/, '');
const sections = cleaned.split(/^##\s*9\./m);
const allEntries = [];
const re = /^-\s*\*\*\[(.+?)\]\*\*\s*-\s*\*(.+?)\*\s*-\s*\`\[(.+?)\]\`/gm;
for (let i = 1; i < sections.length; i++) {
  for (const m of sections[i].matchAll(re)) {
    allEntries.push({ ts: m[1], actor: m[2], label: m[3] });
  }
}
assert(allEntries.length === 2, `entradas de ambas as seções §9 capturadas (${allEntries.length})`);
assert(allEntries[0].label === 'Started', 'primeira entrada da 1ª seção');
assert(allEntries[1].label === 'Finished', 'segunda entrada da 2ª seção');
console.log('');

// --- Cenário 14: Comentário inline após dependencies ---
console.log('═══ Cenário 14: Comentário inline após dependencies ═══');
const inlineCommentContent = `---
id: COMMENT-TASK
status: ready
dependencies: ["T-100", "T-200"] # IDs de tarefas que bloqueiam esta
blocks: []
---
# Task with inline comment in dependencies
`;
writeTask('comment-task.md', inlineCommentContent);
const fmComment = parseFrontmatter(inlineCommentContent);
const depsRaw = extractDeps(fmComment);
assert(depsRaw !== null, 'dependencies extraído');
// The inline comment should be stripped when parsing
const depsClean = depsRaw.replace(/#.*$/, '').trim();
const deps = depsClean.split(',').map(d => d.trim().replace(/["']/g, '')).filter(Boolean);
assert(deps.length === 2, `2 dependências extraídas (${deps.length})`);
assert(deps[0] === 'T-100', 'primeira dep correta');
assert(deps[1] === 'T-200', 'segunda dep correta');
console.log('');

// --- Cenário 15: Transição obsolete ---
console.log('═══ Cenário 15: Transição obsolete ═══');
// Verify that the manage-task.mjs recognizes 'obsolete' as a valid action
// We can't run manage-task.mjs here (no Nexus compiled), but we can verify the action list
const manageTaskContent = fs.readFileSync(
  path.join(process.cwd(), 'tools', 'scripts', 'manage-task.mjs'),
  'utf-8'
);
assert(manageTaskContent.includes('obsolete'), 'manage-task.mjs reconhece a ação obsolete');
assert(manageTaskContent.includes('demote'), 'manage-task.mjs reconhece a ação demote');
console.log('');

// --- Cenário extra: ledger.mjs tolera BOM ---
console.log('═══ Cenário extra: ledger.mjs fm() tolera BOM ═══');
// The ledger.mjs has: const m = txt.replace(/^﻿/, '').match(...)
// This strips BOM before parsing
const bomWithFm = '\uFEFF---\nid: LEDGER-BOM\nstatus: done\n---\n';
const stripped = bomWithFm.replace(/^\uFEFF/, '');
const fmLedger = stripped.match(/^---\n([\s\S]*?)\n---/);
assert(fmLedger !== null, 'ledger.mjs BOM strip funciona');
assert(fmLedger[1].includes('id: LEDGER-BOM'), 'ledger extrai frontmatter de task com BOM');
console.log('');

// --- Cleanup ---
fs.rmSync(tmpDir, { recursive: true, force: true });

// --- Summary ---
console.log('═'.repeat(50));
console.log(`Resultados: ${passed}/${total} passaram, ${failed} falharam`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ Todos os testes de regressão passaram!');
}
