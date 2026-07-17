#!/usr/bin/env node
/**
 * relatorio — projetor de relatório de execução por task a partir do JSONL de telemetria.
 * Padrão copiado do ledger.mjs: lê dados brutos, projeta markdown regenerável.
 * O agente só anexa julgamento se quiser; o esqueleto é subproduto automático.
 *
 * Uso:
 *   node tools/scripts/relatorio.mjs <ID>          # esqueleto de relatório completo
 *   node tools/scripts/relatorio.mjs <ID> --tabela # só tabela de fases
 *   node tools/scripts/relatorio.mjs <ID> --json   # JSON p/ consumo por scripts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const telemetryDir = path.join(root, 'tasks', '.telemetry');

const args = process.argv.slice(2);
const taskId = args.find(a => !a.startsWith('--'));
const jsonMode = args.includes('--json');
const tabelaOnly = args.includes('--tabela');

if (!taskId) {
  console.error('Uso: node tools/scripts/relatorio.mjs <ID> [--tabela] [--json]');
  process.exit(1);
}

// ---- Load events ------------------------------------------------------------
function loadEvents(id) {
  const file = path.join(telemetryDir, `${id}.jsonl`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

// ---- Phase classification ---------------------------------------------------
const PHASE_LAYER = {
  'manage-task.start': 'transição',
  'manage-task.finish': 'transição',
  'manage-task.pause': 'transição',
  'manage-task.claim': 'transição',
  'manage-task.approve': 'transição',
  'manage-task.request_changes': 'transição',
  'manage-task.promote': 'transição',
  'manage-task.triage': 'setup',
  'manage-task.harden': 'setup',
  'manage-task.decide': 'setup',
  'worktree.new': 'setup',
  'worktree.claim': 'setup',
  'worktree.release': 'setup',
  'worktree.refresh': 'setup',
  'worktree.init': 'setup',
  'worktree.merge': 'transição',
  'fila.add': 'transição',
  'fila.flush': 'transição',
  'orquestrar.dispatch': 'orquestração',
  'orquestrar.resume': 'orquestração',
  'gate.build': 'gate',
  'gate.test': 'gate',
  'gate.lint': 'gate',
};

function layerOf(phase) {
  for (const [prefix, layer] of Object.entries(PHASE_LAYER)) {
    if (phase === prefix || phase.startsWith(prefix + '.')) return layer;
  }
  return 'outro';
}

function shortPhase(phase) {
  const parts = phase.split('.');
  return parts.length > 1 ? parts.slice(1).join('.') : phase;
}

// ---- Gap computation --------------------------------------------------------
function computeGaps(events) {
  const sorted = [...events].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].ts);
    const curr = new Date(sorted[i].ts);
    const gapMs = curr - prev;
    if (gapMs > 0) {
      gaps.push({
        from: shortPhase(sorted[i - 1].phase),
        to: shortPhase(sorted[i].phase),
        gapMs,
        gapS: (gapMs / 1000).toFixed(1),
      });
    }
  }
  return gaps;
}

// ---- Totals per layer -------------------------------------------------------
function layerTotals(events) {
  const totals = {};
  for (const evt of events) {
    const layer = layerOf(evt.phase);
    if (!totals[layer]) totals[layer] = { count: 0, wallMs: 0, errors: 0 };
    totals[layer].count++;
    totals[layer].wallMs += (evt.wallMs || 0);
    if (evt.exitCode && evt.exitCode !== 0) totals[layer].errors++;
  }
  return totals;
}

// ---- Render -----------------------------------------------------------------
function msToS(ms) { return (ms / 1000).toFixed(1) + 's'; }

function renderMarkdown(id, events) {
  if (!events.length) {
    return `# Relatório de Execução — ${id}\n\n**⚠  Sem dados de telemetria** para esta task.\n\n> Execute ` + '`' + `node tools/scripts/relatorio.mjs ${id}` + '`' + ` para regenerar.`;
  }

  const sorted = [...events].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  const first = sorted[0].ts;
  const last = sorted[sorted.length - 1].ts;
  const gaps = computeGaps(sorted);
  const totals = layerTotals(sorted);

  // Events that are errors
  const errors = sorted.filter(e => e.exitCode && e.exitCode !== 0);

  const lines = [];
  lines.push(`# Relatório de Execução — ${id}`);
  lines.push('');
  lines.push(`**Gerado:** ${new Date().toISOString().slice(0, 19).replace('T', ' ')} · **Eventos:** ${events.length} · **Período:** ${first.slice(0, 19).replace('T', ' ')} → ${last.slice(0, 19).replace('T', ' ')}`);
  lines.push('');

  // Tabela de fases
  lines.push('## Fases');
  lines.push('');
  lines.push('| # | Fase | Camada | Duração | Exit | Ator | Timestamp |');
  lines.push('|---|------|--------|---------|------|------|-----------|');
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    const icon = e.exitCode === 0 ? '✅' : e.exitCode ? '❌' : '·';
    const dur = msToS(e.wallMs || 0);
    const ts = e.ts ? e.ts.slice(11, 19) : '';
    lines.push(`| ${i + 1} | ${shortPhase(e.phase)} | ${layerOf(e.phase)} | ${dur} | ${icon} | ${e.actor || '—'} | ${ts} |`);
  }
  lines.push('');

  // Totals per layer
  lines.push('## Totais por Camada');
  lines.push('');
  lines.push('| Camada | Eventos | Tempo Total | Erros |');
  lines.push('|--------|---------|-------------|-------|');
  for (const [layer, t] of Object.entries(totals)) {
    lines.push(`| ${layer} | ${t.count} | ${msToS(t.wallMs)} | ${t.errors} |`);
  }
  const totalWall = sorted.reduce((s, e) => s + (e.wallMs || 0), 0);
  const totalErrors = errors.length;
  lines.push(`| **Total** | **${events.length}** | **${msToS(totalWall)}** | **${totalErrors}** |`);
  lines.push('');

  // Gaps (tempo de agente+harness não medido diretamente)
  if (gaps.length > 0) {
    lines.push('## Gaps (tempo agente+harness — derivado por subtração)');
    lines.push('');
    lines.push('| De | Para | Intervalo |');
    lines.push('|----|------|-----------|');
    for (const g of gaps) {
      lines.push(`| ${g.from} | ${g.to} | ${g.gapS}s |`);
    }
    const totalGapMs = gaps.reduce((s, g) => s + g.gapMs, 0);
    const totalGapS = (totalGapMs / 1000).toFixed(1);
    lines.push(`| **Total gaps** | | **${totalGapS}s** |`);
    lines.push('');
    lines.push('> ⚠ Esses tempos NÃO são medidos diretamente — são gaps entre eventos consecutivos. Incluem overhead de harness, leitura de arquivos, raciocínio do agente. O tempo de raciocínio propriamente dito não é possível medir; o resto é `not_measured` honesto.');
    lines.push('');
  }

  // Errors
  if (errors.length > 0) {
    lines.push('## Incidentes (exitCode ≠ 0)');
    lines.push('');
    for (const e of errors) {
      lines.push(`- **${shortPhase(e.phase)}** (${e.ts?.slice(11, 19) || '?'}): ${e.extra?.error || 'erro desconhecido'}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Relatório gerado automaticamente a partir de \`tasks/.telemetry/${id}.jsonl\`. Regenerável: \`node tools/scripts/relatorio.mjs ${id}\`.*`);

  return lines.join('\n');
}

function renderTabela(id, events) {
  if (!events.length) return `⚠  Sem dados de telemetria para ${id}.`;
  const sorted = [...events].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  const lines = [];
  lines.push(`# ${id} — Fases`);
  lines.push('');
  lines.push('| # | Fase | Camada | Duração | Exit |');
  lines.push('|---|------|--------|---------|------|');
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    const icon = e.exitCode === 0 ? '✅' : e.exitCode ? '❌' : '·';
    lines.push(`| ${i + 1} | ${shortPhase(e.phase)} | ${layerOf(e.phase)} | ${msToS(e.wallMs || 0)} | ${icon} |`);
  }
  return lines.join('\n');
}

// ---- Main -------------------------------------------------------------------
const events = loadEvents(taskId);

if (!events.length) {
  if (jsonMode) {
    console.log(JSON.stringify({ id: taskId, events: [], empty: true, message: 'Sem dados de telemetria para esta task.' }));
  } else {
    console.log(`⚠  Sem dados de telemetria para ${taskId}.`);
    console.log(`   Arquivo esperado: ${path.join(telemetryDir, `${taskId}.jsonl`)}`);
  }
  process.exit(0);
}

if (jsonMode) {
  const sorted = [...events].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  console.log(JSON.stringify({
    id: taskId,
    events: sorted,
    gaps: computeGaps(sorted),
    totals: layerTotals(sorted),
    errors: sorted.filter(e => e.exitCode && e.exitCode !== 0),
  }, null, 2));
} else if (tabelaOnly) {
  console.log(renderTabela(taskId, events));
} else {
  console.log(renderMarkdown(taskId, events));
}
