#!/usr/bin/env node
// get-task.mjs — dispatcher por estado (skill + task + RAG + guarda de identidade)
// READ-ONLY: resolve e imprime; nunca transiciona estado.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..', '..');
const tasksDir = path.join(docsRoot, 'tasks');
const skillsDir = path.join(docsRoot, '.claude', 'skills');
const codeRepo = process.env.SUPERAPP_DIR || path.resolve(docsRoot, '..', 'superapp');
const worktreesBase = path.resolve(codeRepo, '..', '.superapp-worktrees');

const [, , rawId, ...flags] = process.argv;
const jsonMode = flags.includes('--json');

if (!rawId) {
  console.error('Uso: node get-task.mjs <ID> [--json]');
  process.exit(1);
}

const taskFile = resolveTaskFile(rawId);
const taskId = path.basename(taskFile, '.md');
const taskText = fs.readFileSync(taskFile, 'utf-8');
const fm = parseFrontmatter(taskText);
const sections = parseSections(taskText);
const status = (fm.status || '').toLowerCase();

const STATE_MAP = {
  'draft:placeholder': { role: 'endurecedor', skill: 'endurecer-task', verb: 'triage/harden' },
  'draft:triaged': { role: 'endurecedor', skill: 'endurecer-task', verb: 'triage/harden' },
  'draft:pending_decision': { role: 'HUMANO', skill: null, verb: 'PARE' },
  'draft:hardened': { role: 'arquiteto', skill: 'arquiteto-promover', verb: 'promote' },
  'ready': { role: 'worker', skill: 'executar-task', verb: 'start' },
  'in_progress': { role: 'worker-retomada', skill: 'executar-task', verb: '—' },
  'review': { role: 'reviewer', skill: 'qa-review', args: '--integrar', verb: 'claim' },
  'in_review': { role: 'ninguém', skill: null, verb: 'PARE' },
  'rework': { role: 'worker', skill: 'rework-task', verb: 'start' },
  'blocked': { role: 'ninguém', skill: null, verb: 'nada a fazer' },
  'done': { role: 'ninguém', skill: null, verb: 'nada a fazer' },
};

const state = STATE_MAP[status] || { role: '???', skill: null, verb: '?' };
const executor = lastExecutor(sections);
const identityGuard = executor
  ? `guarda de identidade: revisor DEVE ser modelo ≠ ${executor}`
  : 'guarda de identidade: executor não identificado no §9';

function normalizeId(input) {
  return input.trim().toLowerCase().replace(/-/g, '');
}

function resolveTaskFile(input) {
  const normalized = normalizeId(input);
  const files = fs.readdirSync(tasksDir).filter(
    f => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'index.md'
  );
  const exact = files.filter(f => normalizeId(path.basename(f, '.md')) === normalized);
  if (exact.length === 1) return path.join(tasksDir, exact[0]);
  if (exact.length > 1) {
    console.error(`❌ ID ambíguo: ${input} → ${exact.join(', ')}`);
    process.exit(1);
  }
  const prefix = files.filter(f => normalizeId(path.basename(f, '.md')).startsWith(normalized));
  if (prefix.length === 1) return path.join(tasksDir, prefix[0]);
  if (prefix.length > 1) {
    console.error(`❌ prefixo ambíguo: ${input} → ${prefix.join(', ')}`);
    process.exit(1);
  }
  console.error(`❌ task não encontrada: ${input}`);
  process.exit(1);
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = value;
  }
  return out;
}

function parseSections(text) {
  const sections = {};
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(\d+)\.\s+(.*)/);
    if (heading) {
      current = { n: parseInt(heading[1], 10), title: heading[2].trim(), body: [] };
      sections[current.n] = current;
    } else if (current) {
      current.body.push(line);
    }
  }
  for (const s of Object.values(sections)) {
    s.content = s.body.join('\n').trim();
  }
  return sections;
}

function lastExecutor(sections) {
  const sec9 = sections[9]?.content || '';
  const lines = sec9.split('\n').filter(l => l.includes('- **['));
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/\*\*\[.*?\]\*\*\s*-\s*\*([^*]+?)\*/);
    if (m) return m[1].trim();
  }
  return null;
}

function resolveLink(link, baseFile) {
  const [url, anchor] = link.split('#');
  if (path.isAbsolute(url)) return { path: url, anchor };
  return { path: path.resolve(path.dirname(baseFile), url), anchor };
}

function extractSection(content, anchor) {
  const lines = content.split(/\r?\n/);
  const out = [];
  let inSection = false;
  const anchorSlug = anchor.toLowerCase().replace(/-/g, ' ').trim();
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim().toLowerCase().replace(/[.#]/g, '').replace(/-/g, ' ');
      if (text === anchorSlug || text.includes(anchorSlug)) {
        inSection = true;
        out.push(line);
      } else if (inSection) {
        if (level === 2) break;
        out.push(line);
      }
    } else if (inSection) {
      out.push(line);
    }
  }
  return out.length ? out.join('\n') : content;
}

function resolveRAG() {
  const sec2 = sections[2]?.content || '';
  const links = [...sec2.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1]);
  return links.map(link => {
    const { path: resolved, anchor } = resolveLink(link, taskFile);
    if (!fs.existsSync(resolved)) {
      return { link, status: 'fonte-nao-resolve', resolved, content: null };
    }
    const content = fs.readFileSync(resolved, 'utf-8');
    const snippet = anchor ? extractSection(content, anchor) : content;
    return { link, status: 'ok', resolved, content: snippet };
  });
}

function getScopePaths() {
  const sec3 = sections[3]?.content || '';
  const paths = [];
  for (const line of sec3.split('\n')) {
    const m = line.match(/`?([A-Z]:[\\/][^`]+)`?/);
    if (m && !paths.includes(m[1])) paths.push(m[1]);
  }
  return paths;
}

function defaultBranch() {
  try {
    execSync('git show-ref --verify --quiet refs/heads/main', { cwd: codeRepo, encoding: 'utf-8' });
    return 'main';
  } catch {
    return 'master';
  }
}

function gitState() {
  const wt = path.join(worktreesBase, taskId);
  const out = { exists: fs.existsSync(wt), path: wt };
  if (!out.exists) return out;
  try {
    out.branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: wt, encoding: 'utf-8' }).trim();
    out.clean = execSync('git status --porcelain', { cwd: wt, encoding: 'utf-8' }).trim().length === 0;
    const base = defaultBranch();
    out.log = execSync(`git log ${base}..task/${taskId} --oneline`, { cwd: codeRepo, encoding: 'utf-8' }).trim();
    out.mergeBase = execSync(`git merge-base ${base} task/${taskId}`, { cwd: codeRepo, encoding: 'utf-8' }).trim();
  } catch (e) {
    out.error = e.message;
  }
  return out;
}

function readSkill(name) {
  if (!name) return null;
  const skillPath = path.join(skillsDir, name, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return `fonte-nao-resolve: ${skillPath}`;
  return fs.readFileSync(skillPath, 'utf-8');
}

function lastParecer() {
  const sec8 = sections[8]?.content || '';
  const parts = sec8.split('### Parecer do Agente Revisor');
  return parts.length > 1 ? parts[parts.length - 1].trim() : null;
}

function pendingDecisions() {
  if (!fm.decisions) return null;
  const m = fm.decisions.match(/\[([^\]]*)\]/);
  return m ? m[1] : fm.decisions;
}

function textOutput() {
  const rag = resolveRAG();
  const scopePaths = getScopePaths();
  const git = gitState();
  const skillText = readSkill(state.skill);
  const parecer = lastParecer();
  const lines = [];

  lines.push(`ID · ${taskId} · status · ${fm.status} · papel · ${state.role} · próximo verbo · ${state.verb}`);
  if (state.skill) {
    lines.push(`invocação recomendada: /${state.skill}${state.args ? ` ${state.args}` : ''} ${taskId}`);
  }
  lines.push(identityGuard);
  lines.push('---');
  lines.push('## Task');
  lines.push(taskText);
  lines.push('---');
  lines.push('## RAG resolvido (§2)');
  if (rag.length === 0) lines.push('(nenhum link)');
  for (const r of rag) {
    lines.push(`- ${r.link} → ${r.status}${r.resolved ? ` (${r.resolved})` : ''}`);
    if (r.content) {
      const limited = r.content.split('\n').slice(0, 200).join('\n');
      lines.push('```');
      lines.push(limited);
      lines.push('```');
    }
  }
  lines.push('---');
  lines.push('## Paths da §3');
  for (const p of scopePaths) {
    const exists = fs.existsSync(p);
    lines.push(`- ${p} ${exists ? '(existe)' : '(não existe)'}`);
    if (exists && fs.statSync(p).isFile()) {
      const head = fs.readFileSync(p, 'utf-8').split('\n').slice(0, 20).join('\n');
      lines.push('```');
      lines.push(head);
      lines.push('```');
    }
  }
  lines.push('---');
  lines.push('## Estado git');
  if (!git.exists) {
    lines.push('worktree: não existe (tooling-do-controle ou não iniciada)');
  } else {
    lines.push(`worktree: ${git.path}`);
    lines.push(`branch: ${git.branch || '?'}`);
    lines.push(`clean: ${git.clean}`);
    const base = defaultBranch();
    lines.push(`log ${base}..task/${taskId}:\n${git.log || '(nada)'}`);
    lines.push(`merge-base: ${git.mergeBase || '?'}`);
  }
  if (status === 'rework' && parecer) {
    lines.push('---');
    lines.push('## Parecer (rework)');
    lines.push(parecer);
  }
  if (status === 'draft:pending_decision') {
    lines.push('---');
    lines.push('## Decisões pendentes');
    lines.push(pendingDecisions() || '(não listadas)');
  }
  lines.push('---');
  lines.push(`## Skill inline: ${state.skill || '—'}`);
  if (skillText) lines.push(skillText);
  return lines.join('\n');
}

function jsonOutput() {
  const rag = resolveRAG();
  const scopePaths = getScopePaths();
  const git = gitState();
  const skillText = readSkill(state.skill);
  const parecer = lastParecer();
  return JSON.stringify({
    id: taskId,
    status: fm.status,
    role: state.role,
    verb: state.verb,
    skill: state.skill,
    args: state.args || null,
    identityGuard,
    rag: rag.map(r => ({ link: r.link, status: r.status, resolved: r.resolved, snippet: r.content ? r.content.slice(0, 2000) : null })),
    scopePaths,
    git,
    skillText: skillText ? skillText.slice(0, 4000) : null,
    parecer,
    pendingDecisions: status === 'draft:pending_decision' ? pendingDecisions() : null,
  }, null, 2);
}

if (jsonMode) {
  console.log(jsonOutput());
} else {
  console.log(textOutput());
}
