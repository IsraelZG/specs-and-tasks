#!/usr/bin/env node
/**
 * sync-superapp — pull --ff-only do master do superapp (CÓDIGO), pra manter ESTA máquina fresca
 * no heartbeat do /drenar-fila.
 *
 * PROBLEMA: o fila.mjs (/drenar-fila) só puxa/pusha o Docs (CONTROLE). NADA puxava o superapp
 * periodicamente — o master do código só era sincronizado no `pnpm wt new`/`merge` (ensureUpToDate
 * do worktree.mjs) ou por pull manual. Entre um e outro, o master do superapp desta máquina ficava
 * velho sem ninguém notar (aconteceu numa troca ARM64→x64: 41 commits atrás, quebrando o Gate).
 *
 * DISCIPLINA (a mesma do ensureUpToDate): --ff-only e nunca forçar. PULA (não mescla, não força) se
 * o checkout estiver sujo ou fora do branch default — não perturba trabalho em andamento nem toca em
 * branch/worktree de task. Idempotente e seguro pra rodar de hora em hora.
 *
 * Códigos de saída: 0 = em dia, atualizado, ou pulado por segurança (sujo / fora do master / sem
 * repo); 1 = divergência real (precisa de resolução manual — surfaça no log do heartbeat).
 *
 * Aponte o repo de código com SUPERAPP_DIR (default: ../superapp, irmão do Docs).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..', '..');
const codeRepo = process.env.SUPERAPP_DIR || path.resolve(docsRoot, '..', 'superapp');

const git = (args) => spawnSync('git', args, { cwd: codeRepo, encoding: 'utf8' });

if (!fs.existsSync(path.join(codeRepo, '.git'))) {
  console.log(`sync-superapp: repo de código não encontrado em ${codeRepo} — nada a sincronizar (defina SUPERAPP_DIR se estiver em outro lugar).`);
  process.exit(0);
}

// Branch default: main se existir, senão master (mesma heurística do worktree.mjs).
const defaultBranch = git(['show-ref', '--verify', '--quiet', 'refs/heads/main']).status === 0 ? 'main' : 'master';

// Só sincroniza no branch default. Numa branch de task (checkout principal trocado), não mexe.
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
if (branch !== defaultBranch) {
  console.log(`sync-superapp: superapp está em '${branch}', não '${defaultBranch}' — pulando (não mexo em branch de trabalho).`);
  process.exit(0);
}

if (git(['fetch', 'origin']).status !== 0) {
  console.log('sync-superapp: git fetch falhou (conexão/credencial?) — pulando esta rodada.');
  process.exit(0);
}

// Working tree sujo → não puxa (não perturba trabalho não-commitado no checkout principal).
const dirty = git(['status', '--porcelain']).stdout.trim();
if (dirty) {
  console.log('sync-superapp: superapp tem mudanças não-commitadas no master — pulando pull (commite/stash antes).');
  process.exit(0);
}

const behind = git(['rev-list', '--count', `HEAD..origin/${defaultBranch}`]).stdout.trim();
if (behind === '0') {
  console.log(`sync-superapp: superapp já em dia com origin/${defaultBranch}.`);
  process.exit(0);
}

const r = git(['pull', '--ff-only', 'origin', defaultBranch]);
process.stdout.write(r.stdout || '');
if (r.status !== 0) {
  console.error(
    `sync-superapp: pull --ff-only falhou — o master do superapp divergiu de origin/${defaultBranch} ` +
    `(commit local não-pushado colide com o que a outra máquina pushou). Resolva manualmente ` +
    `(git -C "${codeRepo}" pull/rebase) antes da próxima worktree.`,
  );
  process.stderr.write(r.stderr || '');
  process.exit(1);
}
console.log(`sync-superapp: superapp atualizado — ${behind} commit(s) puxado(s) de origin/${defaultBranch}.`);
