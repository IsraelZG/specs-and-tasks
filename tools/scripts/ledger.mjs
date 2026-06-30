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
// ---- CLI args ----------------------------------------------------------------
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
function getFlag(arr, flag) { const i = arr.indexOf(flag); return i !== -1 && i + 1 < arr.length ? arr[i + 1] : null; }
const filterStatus = getFlag(args, '--status');
const filterAction = getFlag(args, '--action');
const filterId = getFlag(args, '--id');
const filterCapacity = getFlag(args, '--capacity');
const filterIdle = args.includes('--idle');
// prefix = positional arg that is NOT a flag value (skip values after --status/--action/--id/--capacity)
const prefix = (() => {
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) {
      if (i > 0 && ['--status','--action','--id','--capacity'].includes(args[i-1])) continue;
      return args[i];
    }
  }
  return '';
})();

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

// ---- JSON mode helpers --------------------------------------------------------
function parseTransitions() {
  const p = path.join(root, '.nexus', 'transitions.jsonl');
  if (!fs.existsSync(p)) return [];
  let raw = fs.readFileSync(p, 'utf8').trim();
  raw = raw.replace(/}\{/g, '}\n{');
  return raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
}

function rolesFromTransitions(events) {
  let workerModel = null;
  const reviewerModels = [];
  let reworkCount = 0;
  for (const ev of events) {
    if (ev.action === 'start') {
      if (!workerModel && (ev.from === 'ready' || ev.from === 'draft')) {
        workerModel = displayActor(ev.agent);
      }
      if (ev.from === 'rework') reworkCount++;
    }
    if (ev.action === 'approve' || ev.action === 'request_changes') {
      const m = displayActor(ev.agent);
      if (!reviewerModels.includes(m)) reviewerModels.push(m);
    }
  }
  const lastEvent = events.length
    ? { ts: events[events.length - 1].ts, action: events[events.length - 1].action, agent: displayActor(events[events.length - 1].agent) }
    : null;
  return { workerModel, reviewerModels, reworkCount, lastEvent };
}

function parseDeps(raw) {
  if (!raw || raw === '[]') return [];
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return []; }
}

function nextAction(task) {
  const { status, specStatus, depsOk } = task;
  if (status === 'in_progress') return 'busy';
  if (status === 'review') return 'review';
  if (status === 'rework') return 'rework';
  if (status === 'ready') return 'work';
  if (status === 'draft' && specStatus === 'hardened') return 'promote';
  if (status === 'draft' && (specStatus === 'draft' || specStatus === 'triaged') && depsOk) return 'harden';
  if (specStatus === 'blocked-decision') return 'decide';
  return null;
}

function depsOk(depIds, allById) {
  return depIds.every(depId => {
    const dep = allById.get(depId);
    return dep && dep.status === 'done';
  });
}

if (jsonMode) {
  // ---- JSON mode --------------------------------------------------------------
  const allTransitions = parseTransitions();
  const byId = new Map();
  for (const ev of allTransitions) {
    if (!byId.has(ev.id)) byId.set(ev.id, []);
    byId.get(ev.id).push(ev);
  }

  // collect all tasks FIRST (before filters) — needed for correct deps_ok
  const all = [];
  for (const file of fs.readdirSync(tasksDir)) {
    if (!file.endsWith('.md') || file.startsWith('_') || file === 'INDEX.md' || file === 'LEDGER.md') continue;
    if (prefix && !file.startsWith(prefix)) continue;
    const txt = fs.readFileSync(path.join(tasksDir, file), 'utf8').replace(/\r\n/g, '\n');
    const id = fm(txt, 'id');
    if (!id) continue;
    const status = fm(txt, 'status') || 'unknown';
    const specStatus = fm(txt, 'spec_status') || 'draft';
    const cap = fm(txt, 'capacity_target') || null;
    const ui = fm(txt, 'ui') === 'true';
    const hb = fm(txt, 'hardened_by') || null;
    const depIds = parseDeps(fm(txt, 'dependencies'));
    const events = byId.get(id) || [];
    const roles = rolesFromTransitions(events);
    all.push({ id, status, specStatus, cap, ui, hb, depIds, events, roles });
  }

  // build lookup from ALL tasks (before filters) — ensures deps_ok is correct even when dep is filtered out
  const allById = new Map(all.map(t => [t.id, { status: t.status }]));

  // apply CLI filters
  const tasks = all.filter(t =>
    (!filterId || t.id === filterId) &&
    (!filterStatus || t.status === filterStatus) &&
    (!filterCapacity || t.cap === filterCapacity)
  );

  const result = tasks.map(t => {
    const dOk = depsOk(t.depIds, allById);
    const na = nextAction({ status: t.status, specStatus: t.specStatus, depsOk: dOk });
    return {
      id: t.id,
      status: t.status,
      spec_status: t.specStatus,
      capacity_target: t.cap,
      ui: t.ui,
      dependencies: t.depIds,
      deps_ok: dOk,
      worker_model: t.roles.workerModel,
      reviewer_models: t.roles.reviewerModels,
      rework_count: t.roles.reworkCount,
      hardened_by: t.hb,
      last_event: t.roles.lastEvent,
      next_action: na,
      busy: t.status === 'in_progress',
    };
  });

  let filtered = result;
  if (filterAction) filtered = filtered.filter(t => t.last_event && t.last_event.action === filterAction);
  if (filterIdle) filtered = filtered.filter(t => {
    const idleActions = ['work', 'review', 'rework', 'harden', 'promote'];
    return idleActions.includes(t.next_action) && !t.busy;
  });

  process.stdout.write(JSON.stringify(filtered) + '\n');
} else {
  // ---- coleta (markdown mode) ------------------------------------------------
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
}
