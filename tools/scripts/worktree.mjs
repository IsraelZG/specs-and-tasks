#!/usr/bin/env node
// worktree: ciclo de git worktrees por task, no modelo DOIS-REPOS.
//   - CONTROLE (specs/tasks/ledger/este script): o repo Docs (specs-and-tasks). Rode o comando AQUI.
//   - CÓDIGO (produto): o repo superapp. As worktrees são DELE.
// Comandos (rode de dentro do Docs):
//   node tools/scripts/worktree.mjs new <ID>     cria worktree do superapp em ../.superapp-worktrees/<ID> (branch task/<ID>) + pnpm install
//   node tools/scripts/worktree.mjs ls           lista as worktrees do superapp
//   node tools/scripts/worktree.mjs merge <ID>   merge --no-ff de task/<ID> no branch default do superapp (limpo)
//   node tools/scripts/worktree.mjs rm <ID>      remove a worktree (preserva a branch)
// Aponte o repo de código com SUPERAPP_DIR (default: ../superapp, irmão do Docs).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..', '..'); // controle: specs/tasks/ledger/manage-task
const codeRepo = process.env.SUPERAPP_DIR || path.resolve(docsRoot, '..', 'superapp'); // produto
const baseDir = path.resolve(codeRepo, '..', '.superapp-worktrees');

const die = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };
const git = (args, opts = {}) => spawnSync('git', args, { cwd: codeRepo, encoding: 'utf8', ...opts });
const wtPath = (id) => path.join(baseDir, id);
const branchExists = (b) => git(['rev-parse', '--verify', '--quiet', `refs/heads/${b}`]).status === 0;
const manageTask = path.join(docsRoot, 'tools', 'scripts', 'manage-task.mjs');

function requireCodeRepo() {
  if (!fs.existsSync(path.join(codeRepo, '.git'))) {
    die(`Repo de código não encontrado em ${codeRepo}.\n   Crie-o (cd .. && mkdir superapp && cd superapp && git init && gh repo create) ` +
      `ou aponte com a env SUPERAPP_DIR.`);
  }
}
function defaultBranch() {
  return git(['show-ref', '--verify', '--quiet', 'refs/heads/main']).status === 0 ? 'main' : 'master';
}

/**
 * Sincroniza um repo com origin ANTES de criar worktree/merge (modelo multi-máquina: nunca
 * presuma que o checkout local é o mais recente — a outra máquina pode ter pushado). Falha alto
 * (die) em vez de seguir num repo desatualizado/divergente — silenciar isso é como nascem
 * worktrees criadas a partir de um master velho e merges que conflitam na hora do push.
 */
function ensureUpToDate(dir, label) {
  console.log(`• sincronizando ${label} (fetch + pull --ff-only)...`);
  if (spawnSync('git', ['fetch', 'origin'], { cwd: dir, stdio: 'inherit', encoding: 'utf8' }).status !== 0) {
    die(`git fetch falhou em ${label} — verifique a conexão/remote antes de continuar`);
  }
  const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
  if (dirty) {
    die(`${label} tem mudanças não commitadas — commit/stash antes de continuar (rode aqui: git -C "${dir}" status)`);
  }
  const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
  const hasUpstream = spawnSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: dir, encoding: 'utf8' }).status === 0;
  if (!hasUpstream) {
    console.log(`  (${label}: branch '${branch}' sem upstream — pulando pull, nada pra sincronizar)`);
    return;
  }
  const r = spawnSync('git', ['pull', '--ff-only', 'origin', branch], { cwd: dir, stdio: 'inherit', encoding: 'utf8' });
  if (r.status !== 0) {
    die(`${label} (branch '${branch}') está divergente de origin/${branch} — não é fast-forward.\n` +
      `   Provavelmente a outra máquina pushou algo que conflita com commits locais não pushados.\n` +
      `   Resolva manualmente (git -C "${dir}" pull / rebase / merge) antes de continuar.`);
  }
}

function cmdNew(id, baseRef) {
  if (!id) die('uso: worktree new <ID> [--base <ref>]');
  requireCodeRepo();
  console.log('• checando se CONTROLE e CÓDIGO estão atualizados com origin (multi-máquina)...');
  ensureUpToDate(docsRoot, 'controle (Docs)');
  ensureUpToDate(codeRepo, 'código (superapp)');
  const wt = wtPath(id);
  const branch = `task/${id}`;
  if (fs.existsSync(wt)) {
    console.log(`• worktree já existe: ${wt}`);
  } else {
    // --base <ref>: campanhas encadeadas (ADR 0017) — a branch da task N nasce do HEAD da task
    // N-1 (branch stack), não do trunk. Sem --base, comportamento original (HEAD do checkout).
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
    console.log(`• BASE: ${baseRef ?? 'HEAD do checkout principal'} @ ${baseSha} — registre no manifesto da campanha; o QA diffa contra esta base (dois-pontos), não necessariamente master`);
    if (fs.existsSync(path.join(wt, 'package.json'))) {
      console.log('• pnpm install (store quente)...');
      if (spawnSync('pnpm', ['install'], { cwd: wt, stdio: 'inherit', shell: true }).status !== 0) {
        die('pnpm install falhou na worktree');
      }
    }
  }
  console.log('\n✅ pronto. Despache o worker (opencode, nativo Windows) apontando pro CÓDIGO:');
  console.log(`   opencode run --dir "${wt}" "Execute /executar-task ${id}"`);
  console.log('\n   No fluxo dois-repos, o worker:');
  console.log(`   • lê a spec em      ${path.join(docsRoot, 'tasks', id + '.md')}`);
  console.log(`   • coda/commita/pusha NA worktree (${wt})`);
  console.log(`   • rastreia status:  node "${manageTask}" <start|finish> ${id} <worker> "<msg>"`);
  console.log(`   Ao terminar:  node tools/scripts/worktree.mjs merge ${id}   &&   ...rm ${id}`);
}

function cmdLs() {
  requireCodeRepo();
  console.log(git(['worktree', 'list']).stdout.trim());
}

function cmdMerge(id) {
  if (!id) die('uso: worktree merge <ID>');
  requireCodeRepo();
  const branch = `task/${id}`;
  const main = defaultBranch();
  if (!branchExists(branch)) die(`branch ${branch} não existe no superapp`);
  if (git(['status', '--porcelain']).stdout.trim()) {
    die('o superapp (checkout principal) tem mudanças não-commitadas — commit/stash antes do merge');
  }
  const cur = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
  if (cur !== main) die(`o superapp está em '${cur}', não '${main}' — troque antes do merge`);
  ensureUpToDate(codeRepo, 'código (superapp)'); // pode estar atrás se a outra máquina já mergeou/pushou
  const r = git(['merge', '--no-ff', branch, '-m', `merge ${branch}`], { stdio: 'inherit' });
  if (r.status !== 0) die(`merge de ${branch} falhou (conflito?) — resolva manualmente no superapp`);
  console.log(`✅ ${branch} mergeado em ${main} (superapp). Não esqueça: git push origin ${main}`);
}

function cmdRm(id) {
  if (!id) die('uso: worktree rm <ID>');
  requireCodeRepo();
  const wt = wtPath(id);
  if (git(['worktree', 'remove', wt, '--force'], { stdio: 'inherit' }).status !== 0) {
    die('git worktree remove falhou');
  }
  console.log(`✅ worktree removida: ${wt}  (branch task/${id} preservada — apague com 'git -C "${codeRepo}" branch -D task/${id}' se quiser)`);
}

const argvRest = process.argv.slice(2);
const [cmd, id] = argvRest;
const baseFlag = argvRest.indexOf('--base');
const baseRef = baseFlag !== -1 ? argvRest[baseFlag + 1] : undefined;
switch (cmd) {
  case 'new': cmdNew(id, baseRef); break;
  case 'ls': cmdLs(); break;
  case 'merge': cmdMerge(id); break;
  case 'rm': cmdRm(id); break;
  default:
    console.log('uso: node tools/scripts/worktree.mjs <new|ls|merge|rm> [ID]   (rode de dentro do Docs; opera no superapp)');
    process.exit(cmd ? 1 : 0);
}
