#!/usr/bin/env node
/** Teste de integração real do protocolo de campanhas (ADR 0017). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const campanhaScript = path.join(__dirname, 'campanha.mjs');
const worktreeScript = path.join(__dirname, 'worktree.mjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'campanha-integration-'));
const docs = path.join(root, 'Docs');
const superapp = path.join(root, 'superapp');
const worktrees = path.join(root, '.superapp-worktrees');
const tasksDir = path.join(docs, 'tasks');
const manifestRelative = 'tasks/_campanha-test.md';
const manifestAbsolute = path.join(docs, manifestRelative);
const env = { ...process.env, DOCS_ROOT: docs, SUPERAPP_DIR: superapp };
let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function run(command, args, cwd = superapp) {
  return spawnSync(command, args, { cwd, env, encoding: 'utf8' });
}

function git(args, cwd = superapp) {
  const result = run('git', args, cwd);
  if (result.status !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
}

function campaign(...args) {
  return run(process.execPath, [campanhaScript, ...args], docs);
}

function worktree(...args) {
  return run(process.execPath, [worktreeScript, ...args], docs);
}

function writeTask(id, status, dependencies = []) {
  fs.writeFileSync(path.join(tasksDir, `${id}.md`), `---\nid: ${id}\nstatus: ${status}\ndependencies: ${JSON.stringify(dependencies)}\n---\n# ${id}\n`, 'utf8');
}

function setStatus(id, status) {
  const file = path.join(tasksDir, `${id}.md`);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^status:.*$/m, `status: ${status}`), 'utf8');
}

function commitFile(cwd, name, content, message) {
  fs.writeFileSync(path.join(cwd, name), content, 'utf8');
  git(['add', name], cwd);
  git(['commit', '-m', message], cwd);
}

try {
  fs.mkdirSync(tasksDir, { recursive: true });
  fs.mkdirSync(superapp, { recursive: true });
  git(['init']);
  git(['config', 'user.email', 'campaign@test.local']);
  git(['config', 'user.name', 'Campaign Test']);
  commitFile(superapp, 'base.txt', 'base', 'init');
  const initialMaster = git(['rev-parse', 'HEAD']);

  writeTask('A', 'ready');
  writeTask('EXT', 'ready');
  writeTask('B', 'draft:hardened', ['A', 'EXT']);
  writeTask('C', 'ready');

  const manifest = `---\r
campaign_id: TEST-STACK\r
status: PRONTA\r
tasks:\r
  - id: A\r
    predecessor: null\r
    base_ref: master\r
    stack_base_sha: null\r
    review_base_sha: ${initialMaster}\r
    position: 1\r
    gates:\r
      - test-a\r
  - id: B\r
    predecessor: A\r
    base_ref: task/A\r
    stack_base_sha: pending\r
    review_base_sha: pending\r
    position: 2\r
    gates:\r
      - test-b\r
  - id: C\r
    predecessor: null\r
    base_ref: master\r
    stack_base_sha: null\r
    review_base_sha: ${initialMaster}\r
    position: 3\r
    gates:\r
      - test-c\r
---\r
# Test\r
`;
  fs.writeFileSync(manifestAbsolute, manifest, 'utf8');

  console.log('\n══ Manifesto e worktree reais ══');
  let result = campaign('validate', manifestRelative);
  assert(result.status === 0, 'validate aceita manifesto CRLF e bases pending do descendente', result.stderr);

  result = worktree('new', 'A');
  assert(result.status === 0 && result.stdout.includes('BASE:'), 'worktree.mjs cria elo trunk e imprime BASE', result.stderr);
  const wtA = path.join(worktrees, 'A');
  commitFile(wtA, 'a.txt', 'A-v1', 'feat(A): first');
  setStatus('A', 'in_progress');
  result = campaign('can-start', manifestRelative, 'A');
  assert(result.status === 0, 'can-start aceita elo trunk sobre review_base registrada', result.stderr);

  setStatus('A', 'review');
  result = worktree('new', 'B', '--base', 'task/A');
  assert(result.status === 0 && result.stdout.includes('task/A'), 'worktree.mjs cria B sobre task/A', result.stderr);
  const wtB = path.join(worktrees, 'B');
  result = campaign('register-stack-base', manifestRelative, 'B', 'task/A');
  assert(result.status === 0, 'register-stack-base persiste o head real do predecessor', result.stderr);

  console.log('\n══ Admissão staged e dependências externas ══');
  result = campaign('can-start', manifestRelative, 'B');
  assert(result.status !== 0 && result.stderr.includes('EXT'), 'can-start bloqueia dependência externa não done');
  setStatus('EXT', 'done');
  result = campaign('can-start', manifestRelative, 'B');
  assert(result.status === 0 && result.stdout.includes('staged'), 'can-start admite descendente após predecessor em review', result.stderr);
  setStatus('B', 'in_progress');
  commitFile(wtB, 'b.txt', 'B-work', 'feat(B): work');
  result = campaign('can-finish', manifestRelative, 'B');
  assert(result.status !== 0 && result.stderr.includes('A'), 'can-finish bloqueia B enquanto A não está done');

  console.log('\n══ Staleness, rebase e novo stack base ══');
  const oldStackBase = git(['rev-parse', 'task/A']);
  commitFile(wtA, 'a.txt', 'A-v2', 'fix(A): rework');
  result = campaign('check-base', manifestRelative, 'B');
  assert(result.status !== 0 && result.stderr.includes('stale'), 'check-base retorna não zero quando upstream muda');
  git(['rebase', '--onto', 'task/A', oldStackBase, 'task/B'], wtB);
  result = campaign('register-stack-base', manifestRelative, 'B', 'task/A');
  assert(result.status === 0, 'novo stack base é registrado após rebase');
  result = campaign('check-base', manifestRelative, 'B');
  assert(result.status === 0, 'check-base passa após rebase e registro', result.stderr);

  console.log('\n══ Squash, transplante e base de review ══');
  setStatus('A', 'done');
  git(['merge', '--squash', 'task/A']);
  git(['commit', '-m', 'merge A']);
  const masterAfterA = git(['rev-parse', 'master']);
  const currentStackBase = git(['rev-parse', 'task/A']);
  git(['rebase', '--onto', 'master', currentStackBase, 'task/B'], wtB);
  result = campaign('register-review-base', manifestRelative, 'B', 'master');
  assert(result.status === 0, 'review_base_sha é registrada após transplante', result.stderr);
  result = campaign('check-review-base', manifestRelative, 'B');
  assert(result.status === 0, 'check-review-base valida ancestralidade pós-transplante', result.stderr);
  result = campaign('can-finish', manifestRelative, 'B');
  assert(result.status === 0, 'can-finish libera B após deps done e review base válida', result.stderr);
  const finalDiff = git(['diff', '--name-only', `${masterAfterA}..task/B`]);
  assert(finalDiff === 'b.txt', 'QA final vê somente o delta de B', finalDiff);

  console.log('\n══ Estado e falhas estruturais ══');
  result = campaign('state', manifestRelative);
  assert(result.status === 0 && result.stdout.includes('1. A') && result.stdout.includes('2. B'), 'state preserva posições e exibe bases', result.stderr);
  const broken = manifest.replace('position: 3', 'position: 2');
  fs.writeFileSync(path.join(tasksDir, '_campanha-broken.md'), broken, 'utf8');
  result = campaign('validate', 'tasks/_campanha-broken.md');
  assert(result.status !== 0 && result.stderr.includes('position duplicada'), 'validate rejeita posição duplicada');
} catch (error) {
  failed++;
  console.error(`  ❌ exceção de teste — ${error instanceof Error ? error.stack : error}`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\nResultados: ${passed} passaram, ${failed} falharam`);
if (failed) process.exit(1);
console.log('✅ Tooling de campanha validado de ponta a ponta');
