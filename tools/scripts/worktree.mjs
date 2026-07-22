#!/usr/bin/env node
/**
 * worktree — ciclo de git worktrees por task, modelo DOIS-REPOS.
 *
 * CONTROLE (specs/tasks/ledger/este script): o repo Docs (specs-and-tasks). Rode daqui.
 * CÓDIGO (produto): o repo superapp. As worktrees são DELE.
 *
 * Pool de slots quentes (P-06): _slot-1.._slot-N em .superapp-worktrees/, com node_modules
 * pré-instalados. claim/release/refresh sem install.
 *
 * Comandos (rode de dentro do Docs):
 *   node tools/scripts/worktree.mjs new <ID>         cria worktree (via pool se disponível)
 *   node tools/scripts/worktree.mjs new <ID> --base <ref>  branch stack (campanha)
 *   node tools/scripts/worktree.mjs claim <ID>       aloca slot quente, cria branch task/<ID>
 *   node tools/scripts/worktree.mjs release <ID>     devolve slot ao pool
 *   node tools/scripts/worktree.mjs refresh          síncrono: atualiza todos os slots
 *   node tools/scripts/worktree.mjs ls               lista worktrees do superapp
 *   node tools/scripts/worktree.mjs merge <ID>       merge --no-ff de task/<ID> no default branch
 *   node tools/scripts/worktree.mjs rm <ID>          remove worktree (preserva branch)
 *   node tools/scripts/worktree.mjs init <N>         cria N slots (default 3) + pnpm install
 *
 * PATCH B (segurança — nunca mutar o Docs):
 *   ensureUpToDate para o CONTROLE: fetch-only, warn sobre sujeira, NUNCA stash/clean/reset.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { emit } from './lib/telemetry.mjs';
import { runQueuedCommand } from './lib/validation-queue.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..', '..');          // controle
const codeRepo = process.env.SUPERAPP_DIR || path.resolve(docsRoot, '..', 'superapp');
const baseDir = path.resolve(codeRepo, '..', '.superapp-worktrees');
const poolPath = path.join(baseDir, '.pool.json');
const manageTask = path.join(docsRoot, 'tools', 'scripts', 'manage-task.mjs');

const POOL_SIZE_DEFAULT = 3;

const die = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };
const git = (args, opts = {}) => spawnSync('git', args, { cwd: codeRepo, encoding: 'utf8', ...opts });
const gitDir = (dir, args, opts = {}) => spawnSync('git', args, { cwd: dir, encoding: 'utf8', ...opts });
const wtPath = (id) => path.join(baseDir, id);
const branchExists = (b) => git(['rev-parse', '--verify', '--quiet', `refs/heads/${b}`]).status === 0;

// ---- helpers -----------------------------------------------------------------

function requireCodeRepo() {
  if (!fs.existsSync(path.join(codeRepo, '.git'))) {
    die(`Repo de código não encontrado em ${codeRepo}.` +
      ` Crie-o ou aponte com a env SUPERAPP_DIR.`);
  }
}

function defaultBranch() {
  return git(['show-ref', '--verify', '--quiet', 'refs/heads/main']).status === 0 ? 'main' : 'master';
}

function readPool() {
  if (!fs.existsSync(poolPath)) return { slots: {} };
  return JSON.parse(fs.readFileSync(poolPath, 'utf-8'));
}

function writePool(pool) {
  fs.mkdirSync(baseDir, { recursive: true });
  fs.writeFileSync(poolPath, JSON.stringify(pool, null, 2) + '\n', 'utf-8');
}

function slotNames(pool) {
  return Object.keys(pool.slots).sort();
}

/** Find slot claimed by ID, or first free slot */
function findSlot(pool, id) {
  for (const [name, slot] of Object.entries(pool.slots)) {
    if (slot.id === id) return name;
  }
  return null;
}

/** Is a slot directory functional (has .git worktree metadata)? */
function slotExists(name) {
  const p = path.join(baseDir, name);
  return fs.existsSync(p) && fs.existsSync(path.join(p, '.git'));
}

/**
 * Sync a repo with origin. For CONTROLE (Docs): fetch-only, warn about dirtiness,
 * NUNCA stash/clean/reset (PATCH B). For CÓDIGO: full fetch + pull --ff-only.
 */
function ensureUpToDate(dir, label, isControl) {
  console.log(`• sincronizando ${label} (fetch)...`);
  if (spawnSync('git', ['fetch', 'origin'], { cwd: dir, stdio: 'inherit', encoding: 'utf8' }).status !== 0) {
    die(`git fetch falhou em ${label}`);
  }
  if (isControl) {
    // PATCH B: NUNCA mutar o Docs. Warn sobre sujeira, informe divergência, pare.
    const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    if (dirty) {
      console.warn(`⚠  ${label} tem mudanças não commitadas — continuando (não é blocker para worktree).`);
    }
    const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    const hasUpstream = spawnSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: dir, encoding: 'utf8' }).status === 0;
    if (!hasUpstream) {
      console.log(`  (${label}: branch '${branch}' sem upstream — nada pra sincronizar)`);
      return;
    }
    const behind = spawnSync('git', ['rev-list', '--count', '--left-only', '@{u}...HEAD'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    if (behind !== '0') {
      console.warn(`⚠  ${label} está atrás de origin — faça pull manual para evitar conflitos futuros.`);
    }
    return;
  }
  // CÓDIGO: full sync (original behavior)
  const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
  if (dirty) {
    die(`${label} tem mudanças não commitadas — commit/stash antes de continuar`);
  }
  const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
  const hasUpstream = spawnSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: dir, encoding: 'utf8' }).status === 0;
  if (!hasUpstream) {
    console.log(`  (${label}: branch '${branch}' sem upstream — pulando pull)`);
    return;
  }
  const r = spawnSync('git', ['pull', '--ff-only', 'origin', branch], { cwd: dir, stdio: 'inherit', encoding: 'utf8' });
  if (r.status !== 0) {
    die(`${label} está divergente de origin/${branch} — não é fast-forward.`);
  }
}

/** Create a single pool slot worktree (detached) + install. Idempotent. */
function initSlot(name) {
  const wt = wtPath(name);
  if (slotExists(name)) {
    console.log(`  • slot ${name} já existe: ${wt}`);
    return;
  }
  console.log(`  • criando slot ${name}...`);
  const main = defaultBranch();
  if (git(['worktree', 'add', '--detach', wt, `origin/${main}`], { stdio: 'inherit' }).status !== 0) {
    die(`git worktree add para slot ${name} falhou`);
  }
  // One-time install
  if (fs.existsSync(path.join(wt, 'package.json'))) {
    console.log(`    pnpm install (store quente)...`);
    if (spawnSync('pnpm', ['install'], { cwd: wt, stdio: 'inherit', shell: true }).status !== 0) {
      die(`pnpm install falhou no slot ${name}`);
    }
  }
}

// ---- Pool commands -----------------------------------------------------------

function cmdInit(n) {
  const count = parseInt(n, 10) || POOL_SIZE_DEFAULT;
  requireCodeRepo();
  console.log(`• inicializando pool de ${count} slots...`);
  ensureUpToDate(codeRepo, 'código (superapp)', false);
  const pool = readPool();
  // Remove stale entries
  for (const name of Object.keys(pool.slots)) {
    if (!slotExists(name)) delete pool.slots[name];
  }
  for (let i = 1; i <= count; i++) {
    const name = `_slot-${i}`;
    initSlot(name);
    if (!pool.slots[name]) {
      pool.slots[name] = { id: null, claimed: null, created: new Date().toISOString() };
    }
  }
  writePool(pool);
  const free = Object.values(pool.slots).filter(s => !s.id).length;
  console.log(`\n✅ pool: ${count} slots (${free} livres, ${count - free} ocupados)`);
}

function cmdClaim(id) {
  if (!id) die('uso: worktree claim <ID>');
  requireCodeRepo();
  console.log('• sincronizando repositórios...');
  ensureUpToDate(docsRoot, 'controle (Docs)', true);   // PATCH B: fetch-only
  ensureUpToDate(codeRepo, 'código (superapp)', false);

  const pool = readPool();
  const already = findSlot(pool, id);
  if (already) {
    console.log(`• ${id} já está alocado no slot ${already}`);
    console.log(`  worktree: ${wtPath(already)}`);
    return;
  }

  // Find free slot
  const freeName = slotNames(pool).find(n => !pool.slots[n].id);
  if (!freeName) {
    console.log('⚠  pool cheio — criando worktree efêmera (install necessário)...');
    cmdNew(id);
    return;
  }

  const wt = wtPath(freeName);
  const branch = `task/${id}`;
  console.log(`• slot ${freeName} livre: alocando para ${id}...`);

  // Fetch, reset to origin/master, create task branch
  if (gitDir(wt, ['fetch', 'origin'], { stdio: 'inherit' }).status !== 0) {
    die(`git fetch falhou no slot ${freeName}`);
  }
  const main = defaultBranch();
  if (gitDir(wt, ['reset', '--hard', `origin/${main}`], { stdio: 'inherit' }).status !== 0) {
    die(`git reset --hard falhou no slot ${freeName}`);
  }
  // Remove any stale branch reference first
  gitDir(wt, ['branch', '-D', branch]).status; // ignore error if doesn't exist
  if (gitDir(wt, ['checkout', '-b', branch], { stdio: 'inherit' }).status !== 0) {
    // Branch might exist in main repo (different worktree) — use --track or force
    if (branchExists(branch)) {
      die(`branch ${branch} já existe no superapp (checkout principal) — não pode no pool.\n` +
        `   Faça checkout manual: git -C "${wt}" checkout ${branch}`);
    }
    die(`criação da branch ${branch} falhou no slot ${freeName}`);
  }

  // Mark slot as claimed
  pool.slots[freeName].id = id;
  pool.slots[freeName].claimed = new Date().toISOString();
  writePool(pool);

  const baseSha = gitDir(wt, ['rev-parse', 'HEAD']).stdout.trim();
  console.log(`✅ ${branch} pronta em ~2s (slot quente, sem install): ${wt}`);
  console.log(`   BASE: origin/${main} @ ${baseSha}`);
}

function cmdRelease(id) {
  if (!id) die('uso: worktree release <ID>');
  requireCodeRepo();

  const pool = readPool();
  const slotName = findSlot(pool, id);
  if (!slotName) {
    // Might be an ephemeral worktree (outside pool)
    const wt = wtPath(id);
    if (fs.existsSync(wt)) {
      console.log(`• ${id} não está no pool — use 'worktree rm ${id}' para worktree efêmera.`);
      return;
    }
    die(`ID ${id} não encontrado no pool nem como worktree.`);
  }

  const wt = wtPath(slotName);
  console.log(`• liberando slot ${slotName} (task ${id})...`);

  // Switch to detached HEAD
  const main = defaultBranch();
  if (gitDir(wt, ['switch', '--detach', `origin/${main}`], { stdio: 'inherit' }).status !== 0) {
    // Fallback: just checkout --detach without specifying ref
    gitDir(wt, ['checkout', '--detach'], { stdio: 'inherit' });
  }

  // Mark free
  pool.slots[slotName].id = null;
  pool.slots[slotName].claimed = null;
  writePool(pool);

  console.log(`✅ slot ${slotName} liberado.`);
}

function cmdRefresh() {
  requireCodeRepo();
  const pool = readPool();
  const names = slotNames(pool);
  if (names.length === 0) {
    console.log('• pool vazio — execute "worktree init" primeiro.');
    return;
  }

  // Get current lockfile hash
  const lockPath = path.join(codeRepo, 'pnpm-lock.yaml');
  const lockBefore = fs.existsSync(lockPath) ? spawnSync('git', ['hash-object', lockPath], { cwd: codeRepo, encoding: 'utf8' }).stdout.trim() : '';

  console.log(`• atualizando ${names.length} slots...`);
  for (const name of names) {
    const wt = wtPath(name);
    if (!slotExists(name)) {
      console.log(`  ⚠  slot ${name} não existe — removendo do pool`);
      delete pool.slots[name];
      continue;
    }
    if (pool.slots[name].id) {
      console.log(`  ⏭  ${name} ocupado (${pool.slots[name].id}) — pulando`);
      continue;
    }
    console.log(`  • ${name}...`);
    const main = defaultBranch();
    gitDir(wt, ['fetch', 'origin'], { stdio: 'inherit' });
    gitDir(wt, ['reset', '--hard', `origin/${main}`], { stdio: 'inherit' });
    gitDir(wt, ['checkout', '--detach'], { stdio: 'inherit' });
  }

  // Check if lockfile changed — if so, re-install all free slots
  const lockAfter = fs.existsSync(lockPath) ? spawnSync('git', ['hash-object', lockPath], { cwd: codeRepo, encoding: 'utf8' }).stdout.trim() : '';
  if (lockBefore !== lockAfter) {
    console.log('• lockfile mudou — reinstalando slots livres...');
    for (const name of names) {
      if (pool.slots[name]?.id) continue;
      const wt = wtPath(name);
      if (fs.existsSync(path.join(wt, 'package.json'))) {
        spawnSync('pnpm', ['install'], { cwd: wt, stdio: 'inherit', shell: true });
      }
    }
  }

  // Turbo build
  console.log('• turbo run build (slots livres)...');
  for (const name of names) {
    if (pool.slots[name]?.id) continue;
    const wt = wtPath(name);
    spawnSync('npx.cmd', ['turbo', 'run', 'build'], { cwd: wt, stdio: 'inherit', shell: true });
  }

  writePool(pool);
  const free = Object.values(pool.slots).filter(s => !s.id).length;
  console.log(`\n✅ refresh concluído: ${free} slots quentes prontos.`);
}

// ---- Original commands (modified) -------------------------------------------

function cmdNew(id, baseRef) {
  if (!id) die('uso: worktree new <ID> [--base <ref>]');
  // Try pool first
  const pool = readPool();
  const freeName = slotNames(pool).find(n => !pool.slots[n].id);
  if (freeName) {
    console.log(`• pool tem slot livre — usando claim em vez de new`);
    cmdClaim(id);
    return;
  }
  if (Object.keys(pool.slots).length > 0) {
    console.log('⚠  pool cheio — criando worktree efêmera (sem pool, install necessário)');
  }

  requireCodeRepo();
  console.log('• checando se CONTROLE e CÓDIGO estão atualizados com origin (multi-máquina)...');
  ensureUpToDate(docsRoot, 'controle (Docs)', true);  // PATCH B
  ensureUpToDate(codeRepo, 'código (superapp)', false);

  const wt = wtPath(id);
  const branch = `task/${id}`;
  if (fs.existsSync(wt)) {
    console.log(`• worktree já existe: ${wt}`);
  } else {
    let addArgs;
    if (branchExists(branch)) {
      if (baseRef) die(`branch ${branch} já existe — --base só vale na criação`);
      addArgs = ['worktree', 'add', wt, branch];
    } else {
      addArgs = baseRef
        ? ['worktree', 'add', '-b', branch, wt, baseRef]
        : ['worktree', 'add', '-b', branch, wt];
    }
    if (git(addArgs, { stdio: 'inherit' }).status !== 0) die('git worktree add (superapp) falhou');
    const baseSha = git(['rev-parse', 'HEAD'], { cwd: wt }).stdout.trim();
    console.log(`• worktree do superapp criada: ${wt}  (branch ${branch})`);
    console.log(`• BASE: ${baseRef ?? 'HEAD do checkout principal'} @ ${baseSha}`);
    if (fs.existsSync(path.join(wt, 'package.json'))) {
      console.log('• pnpm install (store quente)...');
      if (spawnSync('pnpm', ['install'], { cwd: wt, stdio: 'inherit', shell: true }).status !== 0) {
        die('pnpm install falhou na worktree');
      }
    }
  }

  console.log('\n✅ pronto. Despache o worker:');
  console.log(`   opencode run --dir "${wt}" "Execute /executar-task ${id}"`);
  console.log(`   • spec: ${path.join(docsRoot, 'tasks', id + '.md')}`);
  console.log(`   • status: node "${manageTask}" <start|finish> ${id} <worker> "<msg>"`);
}

function cmdLs() {
  requireCodeRepo();
  const wtList = git(['worktree', 'list']).stdout.trim();
  console.log(wtList);
  const pool = readPool();
  const slotEntries = slotNames(pool);
  if (slotEntries.length > 0) {
    console.log('\n--- pool ---');
    for (const name of slotEntries) {
      const s = pool.slots[name];
      const status = s.id ? `🔴 ${s.id}` : '🟢 livre';
      console.log(`  ${name}: ${status}`);
    }
  }
}

function abortMerge() {
  if (git(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD']).status === 0) {
    git(['merge', '--abort'], { stdio: 'inherit' });
  }
}

function commandForWindows(command, args) {
  if (process.platform === 'win32' && command === 'pnpm') {
    const candidates = [
      process.env.npm_execpath,
      process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules', 'pnpm', 'bin', 'pnpm.mjs'),
    ];
    const script = candidates.find((candidate) => candidate && candidate.toLowerCase().includes('pnpm') && fs.existsSync(candidate));
    if (script) return { command: process.execPath, args: [script, ...args] };
  }
  return {
    command: process.platform === 'win32' && ['npm', 'npx'].includes(command) ? `${command}.cmd` : command,
    args,
  };
}

function candidateTreeWithoutGate() {
  const indexTree = git(['write-tree']).stdout.trim();
  const entries = git(['ls-tree', indexTree]).stdout
    .split(/\r?\n/)
    .filter((line) => line && !line.endsWith('\t.gate'))
    .join('\n');
  const result = git(['mktree'], { input: entries ? `${entries}\n` : '' });
  if (result.status !== 0) die('não foi possível calcular a árvore candidata sem .gate');
  return result.stdout.trim();
}

function cmdMergeLocked(id, gateCommand) {
  if (!id || gateCommand.length === 0) {
    die('uso: worktree merge <ID> -- pnpm gate <pacote> [--profile backend|ui|full]');
  }
  requireCodeRepo();
  const branch = `task/${id}`;
  const main = defaultBranch();
  if (!branchExists(branch)) die(`branch ${branch} não existe no superapp`);
  if (git(['status', '--porcelain']).stdout.trim()) {
    die('o superapp (checkout principal) tem mudanças não-commitadas');
  }
  const cur = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
  if (cur !== main) die(`o superapp está em '${cur}', não '${main}'`);
  ensureUpToDate(codeRepo, 'código (superapp)', false);

  const baseHead = git(['rev-parse', 'HEAD']).stdout.trim();
  const merge = git(['merge', '--no-ff', '--no-commit', branch], { stdio: 'inherit' });
  if (merge.status !== 0) {
    abortMerge();
    die(`merge transacional de ${branch} falhou; master restaurada em ${baseHead}`);
  }
  if (git(['rev-parse', 'HEAD']).stdout.trim() !== baseHead) {
    abortMerge();
    die('HEAD da master mudou durante o merge transacional');
  }
  if (git(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD']).status !== 0) {
    die(`${branch} não produziu candidato de merge (já integrado?)`);
  }

  const candidateTree = candidateTreeWithoutGate();
  const integrationArtifact = path.join(codeRepo, '.gate', `${candidateTree}.json`);
  // A branch pode conter seu próprio artefato para a mesma árvore. A integração
  // precisa gerar o artefato da composição atual; removê-lo do índice evita que
  // uma tentativa (inclusive vermelha) suje o arquivo staged e impeça abortar.
  if (fs.existsSync(integrationArtifact)) {
    if (git(['rm', '--cached', '--ignore-unmatch', '--', integrationArtifact], { stdio: 'inherit' }).status !== 0) {
      abortMerge();
      die('não foi possível preparar o artefato do gate para a integração');
    }
    fs.rmSync(integrationArtifact, { force: true });
  }
  console.log(`• candidato montado sobre ${baseHead}; executando gate exclusivo...`);
  const gateTarget = commandForWindows(gateCommand[0], gateCommand.slice(1));
  const gate = spawnSync(gateTarget.command, gateTarget.args, {
    cwd: codeRepo,
    stdio: 'inherit',
    env: process.env,
  });
  if (gate.status !== 0) {
    abortMerge();
    die(`gate pós-merge falhou; master restaurada em ${baseHead}`);
  }

  if (git(['rev-parse', 'HEAD']).stdout.trim() !== baseHead) {
    abortMerge();
    die('HEAD da master mudou enquanto o gate pós-merge rodava');
  }
  if (fs.existsSync(integrationArtifact)) {
    if (git(['add', '-f', '--', integrationArtifact], { stdio: 'inherit' }).status !== 0) {
      abortMerge();
      die('não foi possível incluir o artefato do gate no merge');
    }
  }
  if (git(['commit', '-m', `merge ${branch}`], { stdio: 'inherit' }).status !== 0) {
    abortMerge();
    die(`commit do merge ${branch} falhou; master restaurada em ${baseHead}`);
  }

  const mergeCommit = git(['rev-parse', 'HEAD']).stdout.trim();
  const push = git(['push', 'origin', main], { stdio: 'inherit' });
  if (push.status !== 0) {
    const current = git(['rev-parse', 'HEAD']).stdout.trim();
    if (current === mergeCommit) {
      git(['reset', '--hard', baseHead], { stdio: 'inherit' });
    }
    die(`push de ${mergeCommit} falhou; master local restaurada em ${baseHead}`);
  }
  console.log(`✅ ${branch} integrado em ${main} (${mergeCommit}) com Gate verde e push concluído.`);
}

function cmdMerge(id, gateCommand) {
  if (!id || gateCommand.length === 0) {
    die('uso: worktree merge <ID> -- pnpm gate <pacote> [--profile backend|ui|full]');
  }
  const status = runQueuedCommand({
    repoDir: codeRepo,
    cwd: docsRoot,
    label: `integração:${id}`,
    command: process.execPath,
    args: [fileURLToPath(import.meta.url), 'merge-locked', id, '--', ...gateCommand],
  });
  if (status !== 0) process.exit(status);
}

function cmdRm(id) {
  if (!id) die('uso: worktree rm <ID>');
  // Check if it's a pool slot
  const pool = readPool();
  const slotName = findSlot(pool, id);
  if (slotName) {
    console.log(`• ${id} está no pool (slot ${slotName}) — use 'release ${id}' em vez de rm.`);
    return;
  }
  requireCodeRepo();
  const wt = wtPath(id);
  if (git(['worktree', 'remove', wt, '--force'], { stdio: 'inherit' }).status !== 0) {
    die('git worktree remove falhou');
  }
  console.log(`✅ worktree removida: ${wt}  (branch task/${id} preservada)`);
}

// ---- CLI dispatcher ---------------------------------------------------------

const argvRest = process.argv.slice(2);
const cmd = argvRest[0];
const id = argvRest[1] || '';
const baseFlag = argvRest.indexOf('--base');
const baseRef = baseFlag !== -1 ? argvRest[baseFlag + 1] : undefined;
const nFlag = argvRest.indexOf('-n');
const poolN = nFlag !== -1 ? argvRest[nFlag + 1] : undefined;
const separator = argvRest.indexOf('--');
const gateCommand = separator === -1 ? [] : argvRest.slice(separator + 1);

const wtStart = performance.now();

switch (cmd) {
  case 'new': cmdNew(id, baseRef); break;
  case 'claim': cmdClaim(id); break;
  case 'release': cmdRelease(id); break;
  case 'refresh': cmdRefresh(); break;
  case 'init': cmdInit(poolN || argvRest[1]); break;
  case 'ls': cmdLs(); break;
  case 'merge': cmdMerge(id, gateCommand); break;
  case 'merge-locked': cmdMergeLocked(id, gateCommand); break;
  case 'rm': cmdRm(id); break;
  case 'pool': {
    const sub = argvRest[1];
    if (sub === 'init') cmdInit(argvRest[2] || '');
    else if (sub === 'ls' || sub === 'status') cmdLs();
    else console.log('uso: worktree pool <init|ls>');
    break;
  }
  default:
    console.log(`uso: node tools/scripts/worktree.mjs <new|claim|release|refresh|init|ls|merge|rm> [ID]`);
    console.log(`  new <ID>     — cria worktree (via pool se disponível, efêmera se pool cheio)`);
    console.log(`  claim <ID>   — aloca slot quente (branch task/<ID>)`);
    console.log(`  release <ID> — devolve slot ao pool`);
    console.log(`  refresh      — síncrono: atualiza todos os slots (fetch+reset+install+turbo)`);
    console.log(`  init [-n N]  — cria N slots (default ${POOL_SIZE_DEFAULT}) + pnpm install`);
    console.log(`  ls           — lista worktrees + pool`);
    console.log(`  merge <ID> -- pnpm gate <pkg> [--profile P] — fila + merge transacional + gate + push`);
    console.log(`  rm <ID>      — remove worktree efêmera (release para pool)`);
    process.exit(cmd ? 1 : 0);
}

if (cmd !== 'ls') {
  emit({
    task: id || undefined, phase: `worktree.${cmd}`,
    cmd: `node tools/scripts/worktree.mjs ${argvRest.join(' ')}`,
    wallMs: Math.round(performance.now() - wtStart), exitCode: 0, actor: 'system',
  });
}
