#!/usr/bin/env node
/**
 * ledger — tabela de CICLO DE VIDA das tasks, agrupada por status, com quem fez cada papel
 * (worker / reviewer / rework / endurecedor). NÃO é uma fonte nova: é uma PROJEÇÃO do Log (§9) que
 * o `manage-task.mjs` já escreve em toda transição. Cada linha do Log é `[ts] *ator* [Label]: msg`,
 * e o `*ator*` é o `<SeuNome>` que o agente passa (deepseek, minimax, gemini, claude, agile_reviewer…).
 *
 * Por que projeção e não ledger editado à mão: os agentes JÁ registram tudo ao rodar `manage-task`
 * (start/finish/approve/request_changes/promote). Um segundo ledger que eles atualizassem em paralelo
 * só poderia DRIFTAR do real. Aqui o Log é a verdade; esta tabela só o reorganiza.
 *
 * O problema "nº de reworks é variável" some: rework não vira N colunas fixas — vira UMA célula
 * `N× (ator1 → ator2 → …)`. Histórico completo fica no Log; a tabela é o resumo.
 *
 * Endurecimento NÃO passa pelo serviço (edita `spec_status` no frontmatter), então não cai no Log.
 * Para atribuir o endurecedor, o `/endurecer-task` carimba `hardened_by:` no frontmatter (como já faz
 * com `hardened_at:`). Sem esse campo, a coluna fica "—".
 *
 * Saída: escreve `tasks/LEDGER.md` (gitignored, como o INDEX — artefato derivado, regenerável) e
 * imprime os totais por status. Uso:  node tools/scripts/ledger.mjs [prefixo]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const tasksDir = path.join(root, 'tasks');
const prefix = process.argv[2] || '';

// Ordem de lifecycle pro agrupamento (status desconhecido cai por último).
const STATUS_ORDER = ['in_progress', 'review', 'rework', 'ready', 'blocked', 'draft', 'done'];

function fm(txt, key) {
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const f = m[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return f ? f[1].replace(/#.*$/, '').trim().replace(/^["']|["']$/g, '') : null;
}

/** Extrai (ts, ator, label) de cada linha do Log §9. */
function parseLog(txt) {
  const sec = txt.split(/^##\s*9\./m)[1];
  if (!sec) return [];
  const re = /^-\s*\*\*\[(.+?)\]\*\*\s*-\s*\*(.+?)\*\s*-\s*`\[(.+?)\]`/gm;
  const out = [];
  for (const m of sec.matchAll(re)) out.push({ ts: m[1], actor: m[2].trim(), label: m[3].trim() });
  return out;
}

/**
 * Atores de `approve`/`request_changes` vêm como `<papel>:<modelo>` (ex.: "agile_reviewer:gemini")
 * — o papel autoriza a ação (gate do serviço), o modelo é o que o LEDGER quer mostrar. Para dados
 * legados sem ":" (ex.: "agile_reviewer" sozinho, ou harness "Crush"/"Antigravity"), mostra como está.
 */
function displayActor(actor) {
  const i = actor.indexOf(':');
  return i === -1 ? actor : actor.slice(i + 1).trim() || actor;
}

/** Atribui papéis a partir da sequência de labels. */
function roles(log) {
  let worker = null, finisher = null, promotedBy = null;
  const reviewers = [], reworks = [];
  let pendingReqChanges = false;
  for (const { actor: rawActor, label } of log) {
    const actor = displayActor(rawActor);
    if (/Iniciado/i.test(label)) {
      if (!worker) worker = actor;            // 1ª execução
      else if (pendingReqChanges) reworks.push(actor); // start logo após request_changes = rework
      pendingReqChanges = false;
    } else if (/Finalizado|Submetido/i.test(label)) {
      finisher = actor;
    } else if (/Aprovado/i.test(label)) {
      reviewers.push(actor); pendingReqChanges = false;
    } else if (/Refatora|Requer|Mudanças/i.test(label)) {
      reviewers.push(actor); pendingReqChanges = true;
    } else if (/Promovida/i.test(label)) {
      promotedBy = actor;
    }
  }
  return { worker, finisher, reviewers, reworks, promotedBy, last: log[log.length - 1] || null };
}

const uniq = (a) => [...new Set(a)];

function cellWorker(r) {
  if (!r.worker) return '—';
  return r.finisher && r.finisher !== r.worker ? `${r.worker} → ${r.finisher}` : r.worker;
}
function cellReviewer(r) {
  if (!r.reviewers.length) return '—';
  const d = uniq(r.reviewers);
  return d.join(', ') + (r.reviewers.length > d.length ? ` (${r.reviewers.length}×)` : '');
}
function cellRework(r) {
  if (!r.reworks.length) return '—';
  return `${r.reworks.length}× (${r.reworks.join(' → ')})`;
}
function cellLast(r) {
  if (!r.last) return '—';
  return `${r.last.ts.slice(0, 10)} ${displayActor(r.last.actor)} \`${r.last.label}\``;
}

// ---- coleta ----------------------------------------------------------------
const rows = [];
for (const file of fs.readdirSync(tasksDir)) {
  if (!file.endsWith('.md') || file.startsWith('_') || file === 'INDEX.md' || file === 'LEDGER.md') continue;
  if (prefix && !file.startsWith(prefix)) continue;
  const txt = fs.readFileSync(path.join(tasksDir, file), 'utf8').replace(/\r\n/g, '\n');
  const id = fm(txt, 'id');
  if (!id) continue;
  rows.push({
    id,
    status: fm(txt, 'status') || 'unknown',
    cap: fm(txt, 'capacity_target') || '—',
    hardenedBy: fm(txt, 'hardened_by') || '—',
    roles: roles(parseLog(txt)),
  });
}

// ---- render ----------------------------------------------------------------
const byStatus = {};
for (const r of rows) (byStatus[r.status] ||= []).push(r);
const order = [...STATUS_ORDER, ...Object.keys(byStatus).filter((s) => !STATUS_ORDER.includes(s))];

let md = `# Ledger de Ciclo de Vida das Tasks\n\n`;
md += `> **Derivado** dos Logs (§9) de cada task — regenere com \`node tools/scripts/ledger.mjs\`.\n`;
md += `> **NÃO edite à mão** (gitignored, como o INDEX). Os atores vêm do \`<SeuNome>\` que cada agente\n`;
md += `> passa ao \`manage-task.mjs\`; a qualidade da coluna depende de cada agente usar sua identidade.\n\n`;

let total = 0;
const counts = [];
for (const status of order) {
  const list = (byStatus[status] || []).sort((a, b) => a.id.localeCompare(b.id));
  if (!list.length) continue;
  total += list.length;
  counts.push(`${status}: ${list.length}`);
  md += `## ${status} (${list.length})\n\n`;
  md += `| Task | Cap | Endurecido por | Worker | Reviewer | Reworks | Última atividade |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  for (const r of list) {
    md += `| [${r.id}](./${r.id}.md) | ${r.cap} | ${r.hardenedBy} | ${cellWorker(r.roles)} | ${cellReviewer(r.roles)} | ${cellRework(r.roles)} | ${cellLast(r.roles)} |\n`;
  }
  md += `\n`;
}
md += `---\n_Total: ${total} tasks · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}_\n`;

fs.writeFileSync(path.join(tasksDir, 'LEDGER.md'), md, 'utf8');
console.log(`✅ tasks/LEDGER.md regenerado — ${total} tasks`);
console.log(`   ${counts.join(' · ')}`);
