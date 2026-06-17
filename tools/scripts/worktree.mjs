#!/usr/bin/env node
// worktree: automatiza o ciclo de git worktrees por task, pra despachar opencode manualmente.
//   node tools/scripts/worktree.mjs new <ID>     cria worktree em ../.nexus-worktrees/<ID> (branch task/<ID>) + pnpm install
//   node tools/scripts/worktree.mjs ls           lista as worktrees
//   node tools/scripts/worktree.mjs merge <ID>   merge --no-ff de task/<ID> em master (repo principal limpo)
//   node tools/scripts/worktree.mjs rm <ID>      remove a worktree (preserva a branch)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const baseDir = path.resolve(repoRoot, '..', '.nexus-worktrees');

const die = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };
const git = (args, opts = {}) => spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8', ...opts });
const wtPath = (id) => path.join(baseDir, id);
const branchExists = (b) => git(['rev-parse', '--verify', '--quiet', `refs/heads/${b}`]).status === 0;

/** C:\X\Y -> /mnt/c/X/Y (pro --dir do opencode no WSL). */
function wslPath(winPath) {
  const m = winPath.match(/^([A-Za-z]):[\\/](.*)$/);
  return m ? `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}` : winPath;
}

function cmdNew(id) {
  if (!id) die('uso: worktree new <ID>');
  const wt = wtPath(id);
  const branch = `task/${id}`;
  if (fs.existsSync(wt)) {
    console.log(`• worktree já existe: ${wt}`);
  } else {
    const addArgs = branchExists(branch)
      ? ['worktree', 'add', wt, branch]
      : ['worktree', 'add', '-b', branch, wt];
    if (git(addArgs, { stdio: 'inherit' }).status !== 0) die('git worktree add falhou');
    console.log(`• worktree criada: ${wt}  (branch ${branch})`);
    console.log('• pnpm install (store quente, ~10s)...');
    if (spawnSync('pnpm', ['install'], { cwd: wt, stdio: 'inherit', shell: true }).status !== 0) {
      die('pnpm install falhou na worktree');
    }
  }
  console.log('\n✅ pronto. Despache o opencode no WSL:');
  console.log(`   opencode run --dir ${wslPath(wt)} "<prompt da task ${id}>"`);
  console.log(`   (ou trabalhe direto no WSL:  cd ${wslPath(wt)} )`);
  console.log(`   Ao terminar:  node tools/scripts/worktree.mjs merge ${id}   &&   ...rm ${id}`);
}

function cmdLs() {
  console.log(git(['worktree', 'list']).stdout.trim());
}

function cmdMerge(id) {
  if (!id) die('uso: worktree merge <ID>');
  const branch = `task/${id}`;
  if (!branchExists(branch)) die(`branch ${branch} não existe`);
  if (git(['status', '--porcelain']).stdout.trim()) {
    die('o repo principal tem mudanças não-commitadas — faça commit/stash antes do merge');
  }
  const cur = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
  if (cur !== 'master') die(`o repo principal está em '${cur}', não 'master' — troque antes do merge`);
  const r = git(['merge', '--no-ff', branch, '-m', `merge ${branch}`], { stdio: 'inherit' });
  if (r.status !== 0) die(`merge de ${branch} falhou (conflito?) — resolva manualmente no repo principal`);
  console.log(`✅ ${branch} mergeado em master`);
}

function cmdRm(id) {
  if (!id) die('uso: worktree rm <ID>');
  const wt = wtPath(id);
  if (git(['worktree', 'remove', wt, '--force'], { stdio: 'inherit' }).status !== 0) {
    die('git worktree remove falhou');
  }
  console.log(`✅ worktree removida: ${wt}  (branch task/${id} preservada — apague com 'git branch -D task/${id}' se quiser)`);
}

const [cmd, id] = process.argv.slice(2);
switch (cmd) {
  case 'new': cmdNew(id); break;
  case 'ls': cmdLs(); break;
  case 'merge': cmdMerge(id); break;
  case 'rm': cmdRm(id); break;
  default:
    console.log('uso: node tools/scripts/worktree.mjs <new|ls|merge|rm> [ID]');
    process.exit(cmd ? 1 : 0);
}
