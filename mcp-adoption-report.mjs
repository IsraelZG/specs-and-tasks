#!/usr/bin/env node
// mcp-adoption-report.mjs — relatório da telemetria de uso de MCP/LSP.
// Lê %LOCALAPPDATA%\crush\mcp-adoption.jsonl (gerado pelo hook mcp-telemetry.mjs)
// e imprime um sumário legível. Stdlib only — sem dependências.

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { env, argv, exit, stdout } from 'node:process';

const LOG_DIR = env.LOCALAPPDATA || join(env.USERPROFILE || '', 'AppData', 'Local');
const LOG_PATH = join(LOG_DIR, 'crush', 'mcp-adoption.jsonl');

if (!existsSync(LOG_PATH)) {
  stdout.write(`Nenhuma telemetria encontrada em ${LOG_PATH}.\n`);
  stdout.write('O hook mcp-telemetry.mjs ainda não disparou nesta sessão?\n');
  exit(0);
}

const lines = readFileSync(LOG_PATH, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  })
  .filter(Boolean);

if (lines.length === 0) {
  stdout.write(`Log vazio: ${LOG_PATH}\n`);
  exit(0);
}

const inc = (m, k) => (m[k] = (m[k] || 0) + 1, m);
const pct = (n, total) => total === 0 ? '0.0%' : `${(n / total * 100).toFixed(1)}%`;

const total = lines.length;
const mcp = lines.filter((r) => r.is_mcp).length;
const bash = lines.filter((r) => r.is_bash).length;
const first = lines[0].ts;
const last = lines[lines.length - 1].ts;

const toolCounts = {};
const projectCounts = {};
const sessionCounts = {};

for (const r of lines) {
  inc(toolCounts, r.tool);
  inc(projectCounts, r.project || '(sem projeto)');
  inc(sessionCounts, r.session || '(sem sessão)');
}

const topN = (obj, n) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

const pad = (s, w, right = false) =>
  right ? String(s).padStart(w) : String(s).padEnd(w);

const shorten = (s, w) => s.length <= w ? s : '…' + s.slice(-(w - 1));

const hr = '═'.repeat(60);
const sub = '─'.repeat(60);

stdout.write(`\nMCP Adoption Report\n${hr}\n`);
stdout.write(`Log:        ${LOG_PATH}\n`);
stdout.write(`Período:    ${first}  →  ${last}\n`);
stdout.write(`Total:      ${total} tool calls\n`);
stdout.write(`Sessões:    ${Object.keys(sessionCounts).length}\n`);
stdout.write(`Projetos:   ${Object.keys(projectCounts).length}\n\n`);

stdout.write(`mcp__* vs bash:\n`);
stdout.write(`  MCP:   ${pad(mcp, 5)} (${pct(mcp, total)})\n`);
stdout.write(`  bash:  ${pad(bash, 5)} (${pct(bash, total)})\n`);
stdout.write(`  outro: ${pad(total - mcp - bash, 5)} (${pct(total - mcp - bash, total)})\n\n`);

stdout.write(`Top ferramentas (15):\n${sub}\n`);
for (const [tool, n] of topN(toolCounts, 15)) {
  const tag = tool.startsWith('mcp__') ? 'mcp' : tool === 'bash' ? 'bsh' : '   ';
  stdout.write(`  ${tag}  ${pad(n, 5)}  ${pad(pct(n, total), 7, true)}  ${tool}\n`);
}
stdout.write('\n');

stdout.write(`Por projeto:\n${sub}\n`);
for (const [proj, n] of topN(projectCounts, 10)) {
  const projMcp = lines.filter((r) => r.project === proj && r.is_mcp).length;
  const projBash = lines.filter((r) => r.project === proj && r.is_bash).length;
  stdout.write(`  ${pad(n, 5)}  mcp ${pad(projMcp, 4)} / bash ${pad(projBash, 4)}  ${shorten(proj, 40)}\n`);
}
stdout.write('\n');

stdout.write(`Por sessão (top 5):\n${sub}\n`);
for (const [sess, n] of topN(sessionCounts, 5)) {
  const sessMcp = lines.filter((r) => r.session === sess && r.is_mcp).length;
  const sessBash = lines.filter((r) => r.session === sess && r.is_bash).length;
  stdout.write(`  ${pad(n, 5)}  mcp ${pad(sessMcp, 4)} / bash ${pad(sessBash, 4)}  ${sess}\n`);
}
stdout.write(`\n${hr}\n`);
