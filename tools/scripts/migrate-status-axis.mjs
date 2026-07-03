#!/usr/bin/env node
/**
 * migrate-status-axis — migra o eixo `spec_status` para `status: draft:<sub>`.
 *
 * Mapa: spec_status → novo status (só p/ tasks com status atual === 'draft'):
 *   (ausente) / draft → draft:placeholder
 *   triaged            → draft:triaged
 *   hardened           → draft:hardened (reavaliar promoção se deps done)
 *   blocked-decision   → draft:pending_decision
 *   decomposed         → draft:decomposed
 *
 * Tasks com status ≠ 'draft': só remove spec_status/hardened_at (mantém status).
 * Idempotente: se já estiver em draft:* → skip.
 *
 * Uso:
 *   node tools/scripts/migrate-status-axis.mjs --dry-run    (plano, sem escrever)
 *   node tools/scripts/migrate-status-axis.mjs --apply      (executa)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

const SPEC_TO_SUB = {
  draft: 'placeholder',
  triaged: 'triaged',
  hardened: 'hardened',
  'blocked-decision': 'pending_decision',
  decomposed: 'decomposed',
};

/** Frontmatter parser inline. */
function parseFM(txt) {
  const fm = txt.match(/^---\r?\n([\s\S]*?)\n---/);
  if (!fm) return { body: txt, fmText: '', fields: {} };
  const body = txt.slice(fm[0].length);
  const get = (k) => {
    const m = fm[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return m ? m[1].replace(/#.*$/, '').trim().replace(/^["']|["']$/g, '') : null;
  };
  return { body, fmText: fm[1], fullFm: fm[0], fields: { id: get('id'), status: get('status'), spec_status: get('spec_status'), hardened_at: get('hardened_at'), hardened_by: get('hardened_by') } };
}

/** Lê o Log §9 de uma task e retorna array de linhas. */
function readLogSection(txt) {
  const m = txt.match(/^## 9\. Log de Execução[\s\S]*$/m);
  return m ? m[0] : null;
}

function collectTasks(dir) {
  const tasks = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md') || file.startsWith('_') || file === 'INDEX.md' || file === 'LEDGER.md') continue;
    const p = path.join(dir, file);
    const txt = fs.readFileSync(p, 'utf8');
    const { fields, body } = parseFM(txt);
    if (!fields.id) continue;
    tasks.push({ file, dir, path: p, txt, fields, body });
  }
  return tasks;
}

function parseDeps(raw) {
  if (!raw || raw === '[]') return [];
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return []; }
}

// ── Coleta ────────────────────────────────────────────────────────────────────
const allTasks = [...collectTasks(path.join(root, 'tasks')), ...collectTasks(path.join(root, 'meta-tasks'))];
console.log(`Encontradas ${allTasks.length} tasks.`);

// ── Plano ─────────────────────────────────────────────────────────────────────
const plan = [];
const buckets = { placeholder: 0, triaged: 0, hardened: 0, pending_decision: 0, decomposed: 0, 'non-draft': 0, skip: 0 };
const hardenedToCheck = []; // { file, dir, ... } — tasks que vão para draft:hardened e podem promover

for (const t of allTasks) {
  const { fields } = t;
  const status = fields.status || 'draft';
  const specStatus = fields.spec_status;
  const hasHardenedAt = fields.hardened_at != null;
  const hasHardenedBy = fields.hardened_by != null;

  if (status !== 'draft' && !status.startsWith('draft:')) {
    // Non-draft: remove spec_status/hardened_at/hardened_by from frontmatter if present
    if (specStatus || hasHardenedAt || hasHardenedBy) {
      plan.push({ ...t, action: 'cleanup-non-draft', newStatus: status });
      buckets['non-draft']++;
    } else {
      buckets.skip++;
    }
    continue;
  }

  // draft → draft:<sub>  OR  draft:something that's just 'draft' prefix (fallback)
  const rawSpec = specStatus || 'draft';
  let sub = SPEC_TO_SUB[rawSpec];
  if (!sub) {
    // Could be already in draft:* format extracted as spec_status
    if (rawSpec.startsWith('draft:')) sub = rawSpec.slice(6);
    else { sub = 'placeholder'; }
  }

  if (status === `draft:${sub}`) {
    // Already migrated — but still check for leftover frontmatter fields to clean
    if (specStatus || hasHardenedAt || hasHardenedBy) {
      plan.push({ ...t, action: 'cleanup-non-draft', newStatus: status });
      buckets['non-draft']++;
      continue;
    }
    buckets.skip++;
    continue;
  }
  // Also skip if status is draft (not draft:*) and sub is placeholder and we already migrated
  if (status === 'draft' && sub === 'placeholder' && status === `draft:${sub}`) { buckets.skip++; continue; }

  plan.push({ ...t, action: 'migrate', newStatus: `draft:${sub}`, oldSpec: rawSpec });
  buckets[sub]++;

  if (sub === 'hardened') {
    hardenedToCheck.push({ ...t, newStatus: 'draft:hardened' });
  }
}

console.log('\n▸ Plano de migração:');
for (const [k, v] of Object.entries(buckets)) {
  if (v > 0) console.log(`   ${k.padEnd(17)} ${v}`);
}
if (plan.length === 0) {
  console.log('\n✅ Nenhuma task para migrar.');
  process.exit(0);
}

if (dryRun) {
  console.log('\n⚠️  --dry-run: plano acima, nada foi escrito. Rode --apply para executar.');
  process.exit(0);
}

// ── Apply ─────────────────────────────────────────────────────────────────────
console.log('\n▸ Aplicando migração...');

let migrated = 0;
let promoted = 0;
const transitionLogPath = path.join(root, '.nexus', 'transitions.jsonl');

// Try to load TaskService for promote step
let TaskService = null;
try {
  const distPath = path.resolve(root, 'apps/nexus-backend/dist/services/task.service.js');
  ({ TaskService } = await import(pathToFileURL(distPath).href));
} catch {
  console.log('   ⚠️  Nexus backend não compilado — promoção de hardened será saltada.');
}

function ensureLedgerDir() {
  const dir = path.dirname(transitionLogPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function appendLedger(id, from, to) {
  ensureLedgerDir();
  const entry = JSON.stringify({ ts: new Date().toISOString(), id, from, to, action: 'migrate', agent: 'system' }) + '\n';
  fs.appendFileSync(transitionLogPath, entry, 'utf8');
}

function appendLogLine(txt, id, oldSpec, newStatus) {
  const logSection = readLogSection(txt);
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `- **[${ts}]** - *system* - \`[Migrado]\`: spec_status:${oldSpec} → status:${newStatus}\n`;
  if (logSection) {
    // Append after the Log header (after the first blank line after the header)
    const headerEnd = logSection.indexOf('\n\n');
    if (headerEnd !== -1) {
      const newLog = logSection.slice(0, headerEnd + 2) + line + logSection.slice(headerEnd + 2);
      return txt.replace(logSection, newLog);
    }
    return txt + '\n' + line;
  }
  // No Log section — append at end
  return txt + '\n## 9. Log de Execução (Agent Execution Log)\n> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.\n' + line;
}

for (const t of plan) {
  let txt = t.txt;
  const fmMatch = txt.match(/^---\r?\n([\s\S]*?)\n---/);
  if (!fmMatch) { console.log(`   ⚠️  ${t.fields.id}: sem frontmatter, pulando`); continue; }
  const fmBlock = fmMatch[1];
  const body = txt.slice(fmMatch[0].length);

  // Remove spec_status, hardened_at, hardened_by lines (only from frontmatter)
  let newFm = fmBlock.replace(/^spec_status:.*\r?\n/gm, '')
                     .replace(/^hardened_at:.*\r?\n/gm, '')
                     .replace(/^hardened_by:.*\r?\n/gm, '');

  if (t.action === 'migrate') {
    // Replace status line in frontmatter
    newFm = newFm.replace(/^status:.*(\r?\n)/m, `status: ${t.newStatus}$1`);
    // Append ledger entry
    appendLedger(t.fields.id, 'draft', t.newStatus);
    // Append Log line (in the body)
    const newBody = appendLogLine(body, t.fields.id, t.oldSpec, t.newStatus);
    txt = `---\n${newFm}---${newBody}`;
  } else {
    // Non-draft cleanup: just remove lines, status stays
    appendLedger(t.fields.id, t.fields.status || 'draft', t.newStatus);
    txt = `---\n${newFm}---${body}`;
  }

  fs.writeFileSync(t.path, txt, 'utf8');
  migrated++;
}
console.log(`   ${migrated} tasks migradas.`);

// ── Promote hardened com deps done ────────────────────────────────────────────
if (TaskService && hardenedToCheck.length > 0) {
  // Build lookup of all task statuses for dep checking
  const allById = new Map();
  for (const t of allTasks) {
    allById.set(t.fields.id, t.fields.status || 'draft');
  }

  const svc = new TaskService({ rootDir: root });
  for (const t of hardenedToCheck) {
    // Re-read the file to get current state (deps)
    const txt = fs.readFileSync(t.path, 'utf8');
    const depsRaw = txt.match(/^dependencies:\s*\[(.*?)\]/m);
    const deps = depsRaw ? parseDeps(depsRaw[0]) : [];
    const depsDone = deps.every(depId => {
      const depStatus = allById.get(depId);
      return depStatus === 'done';
    });

    if (depsDone) {
      try {
        await svc.transition(t.fields.id, 'promote', 'system', 'migração: deps done');
        promoted++;
        console.log(`   ✅ ${t.fields.id} promovido draft:hardened → ready (deps done)`);
      } catch (err) {
        console.log(`   ⚠️  ${t.fields.id}: promoção falhou — ${err.message}`);
      }
    }
  }
  if (promoted > 0) console.log(`   ${promoted} tasks promovidas.`);
}

// ── Rebuild indexes ───────────────────────────────────────────────────────────
try {
  const { rebuildIndexes } = await import(pathToFileURL(path.join(root, 'tools/scripts/rebuild-index.mjs')).href);
  rebuildIndexes();
  console.log('   INDEX regenerado.');
} catch (err) {
  console.log(`   ⚠️  rebuildIndexes falhou: ${err.message}`);
}

console.log('\n✅ Migração concluída.');
