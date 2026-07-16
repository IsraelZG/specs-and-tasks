#!/usr/bin/env node
/**
 * fila — fila de COMMITS do repo de controle (Docs). Tira o git do caminho quente dos agentes.
 *
 * PROBLEMA: o Docs é um working tree único na master com vários agentes ao mesmo tempo. Quando cada
 * agente roda `git commit`/`push`, eles colidem no `index.lock`, disputam o push, e gastam tempo
 * filtrando "o que é meu" — sobretudo o QA. O commit atômico por path resolvia a CORRETUDE mas não
 * a contenção nem a carga cognitiva.
 *
 * SOLUÇÃO: o agente NUNCA roda git no Docs. Ele só edita o markdown da task e ENFILEIRA uma intenção
 * de commit (`add`). Um único consumidor serial (`flush`), rodado periodicamente pela skill
 * `/drenar-fila`, faz todos os commits (atômicos por path) + um push. Um só committer ⇒ zero corrida.
 *
 * A fila é um DIRETÓRIO de arquivos-intenção (um por enfileiramento), não um arquivo compartilhado:
 * vários agentes escrevendo arquivos DIFERENTES nunca colidem (o append num arquivo único reintroduz
 * a corrida que estamos matando). Cada intenção: 1ª linha = mensagem de commit; linhas seguintes =
 * paths a commitar (default `tasks/<id>.md`). Gitignored.
 *
 * Uso:
 *   node tools/scripts/fila.mjs add <taskId> "<mensagem>" [path extra...]   # agente enfileira
 *   node tools/scripts/fila.mjs flush [SeuNome]                             # consumidor: commita+push
 *   node tools/scripts/fila.mjs ls                                          # espia a fila
 *
 * ponytail: um committer serial, sem lock. Se algum dia houver >1 flush concorrente, serializar com
 * um lockfile no .commit-queue/ — mas a skill roda um de cada vez, então YAGNI por ora.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const queueDir = path.join(root, 'tasks', '.commit-queue');

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', ...opts });
}

function ensureQueue() {
  fs.mkdirSync(queueDir, { recursive: true });
}

/**
 * Detecta rebase/merge já em andamento (ex.: uma rodada anterior do flush morreu no meio de um
 * `pull --rebase` conflitante). Rodar `git commit`/`add` por cima disso corrompe o estado — melhor
 * abortar cedo e mandar resolver na mão do que tentar adivinhar.
 */
function gitOpInProgress() {
  const gitDir = path.join(root, '.git');
  if (fs.existsSync(path.join(gitDir, 'rebase-merge'))) return 'rebase';
  if (fs.existsSync(path.join(gitDir, 'rebase-apply'))) return 'rebase';
  if (fs.existsSync(path.join(gitDir, 'MERGE_HEAD'))) return 'merge';
  return null;
}

/**
 * Existência CASE-SENSITIVE — o Windows FS é case-insensitive (`existsSync('tasks/ledger.md')` casa
 * com `LEDGER.md`), mas o pathspec do git é case-sensitive: o descasamento vira erro permanente.
 * Confere o basename exato no listing do diretório. Pega `T-004A.md` vs `T-004a.md` (typo de agente).
 */
function existsExact(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return false;
  try { return fs.readdirSync(path.dirname(abs)).includes(path.basename(abs)); } catch { return false; }
}

// ---- add -------------------------------------------------------------------
function add(taskId, message, extraPaths) {
  if (!taskId || !message) {
    console.error('uso: fila.mjs add <taskId> "<mensagem>" [path extra...]');
    process.exit(1);
  }
  ensureQueue();
  const paths = [`tasks/${taskId}.md`, ...extraPaths];
  // Nome único por enfileiramento — sem colisão entre agentes concorrentes.
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const file = path.join(queueDir, `${taskId}__${stamp}.txt`);
  fs.writeFileSync(file, [message, ...paths].join('\n') + '\n', 'utf8');
  console.log(`✅ enfileirado: ${taskId} — "${message}"`);
  console.log(`   paths: ${paths.join(', ')}`);
  console.log('   (NÃO rode git no Docs; /drenar-fila commita periodicamente)');
}

// ---- ls --------------------------------------------------------------------
function ls() {
  if (!fs.existsSync(queueDir)) return console.log('fila vazia.');
  const files = fs.readdirSync(queueDir).filter((f) => f.endsWith('.txt')).sort();
  if (!files.length) return console.log('fila vazia.');
  console.log(`fila: ${files.length} commit(s) pendente(s)\n`);
  for (const f of files) {
    const [msg, ...paths] = fs.readFileSync(path.join(queueDir, f), 'utf8').trim().split('\n');
    console.log(`  • ${msg}`);
    console.log(`      ${paths.join(', ')}`);
  }
}

// ---- flush -----------------------------------------------------------------
function flush(author = 'fila') {
  // Guarda de entrada: se uma rodada anterior morreu no meio de um pull --rebase conflitante, o
  // repo está com rebase/merge pendente. Commitar/enfileirar por cima disso corrompe o estado —
  // aborta alto e manda resolver na mão (mesma disciplina do resto do fluxo: nunca contornar
  // silenciosamente uma falha de ambiente).
  const op = gitOpInProgress();
  if (op) {
    console.error(
      `⚠ ${op === 'rebase' ? 'rebase' : 'merge'} em andamento no Docs — flush abortado sem tocar a fila.\n` +
      `   Resolva manualmente: "git status" pra ver os conflitos, resolva-os, "git add" os arquivos,\n` +
      `   e "git ${op === 'rebase' ? 'rebase --continue' : 'commit'}" (ou "git ${op === 'rebase' ? 'rebase' : 'merge'} --abort"\n` +
      `   se quiser desistir e tentar de novo depois). Só então re-rode "fila.mjs flush".`
    );
    process.exit(1);
  }

  // Fila vazia NÃO retorna cedo: ainda pode haver commit local não-pushado de uma rodada anterior
  // cujo push falhou (self-heal mais abaixo). Só não há nada a fazer se a fila vazia E o push em dia.
  const files = fs.existsSync(queueDir)
    ? fs.readdirSync(queueDir).filter((f) => f.endsWith('.txt')).sort() // ordem cronológica
    : [];
  if (!files.length) console.log('fila vazia — verificando commits pendentes de push…');

  let committed = 0;
  const skipped = [];
  for (const f of files) {
    const full = path.join(queueDir, f);
    const [message, ...paths] = fs.readFileSync(full, 'utf8').trim().split('\n');
    const existing = paths.filter(existsExact);
    if (!existing.length) {
      skipped.push(`${f}: nenhum path existe (${paths.join(', ')})`);
      fs.rmSync(full);
      continue;
    }
    try {
      // Stage EXPLÍCITO por path (necessário p/ arquivos NOVOS — `git commit -- path` ignora
      // untracked). Seguro aqui porque o flush é o ÚNICO committer: sem a corrida do `git add -A`
      // que varreria arquivos de outro agente. O `commit -- <paths>` ainda limita ao que é nosso.
      git(['add', '--', ...existing]);
      git(['commit', '-m', message, '--', ...existing]);
      committed++;
      fs.rmSync(full); // consumido só se o commit deu certo
    } catch (e) {
      const out = (e.stdout || '') + (e.stderr || '');
      if (/nothing to commit|no changes added|did not match|pathspec/i.test(out)) {
        // Permanente (nada a commitar, ou path inexistente/typo) — descarta; reter só repetiria o erro.
        skipped.push(`${f}: descartado (${out.trim().split('\n')[0]})`);
        fs.rmSync(full);
      } else {
        // Transiente (ex.: index.lock de OUTRO flush) — NÃO descarta; tenta na próxima rodada.
        skipped.push(`${f}: ERRO git, mantido na fila — ${out.trim().split('\n')[0]}`);
      }
    }
  }

  console.log(`commits: ${committed}` + (skipped.length ? `  ·  pulados: ${skipped.length}` : ''));
  for (const s of skipped) console.log(`  ⚠ ${s}`);

  // Empurra se há QUALQUER commit local não-pushado — não só os desta rodada. Torna o flush
  // self-healing: se uma rodada anterior commitou mas o push falhou, a próxima ainda empurra.
  let ahead = '0';
  try { ahead = git(['rev-list', '--count', '@{u}..HEAD']).trim(); } catch { ahead = committed > 0 ? '?' : '0'; }
  if (committed > 0 || ahead !== '0') {
    try {
      // --autostash: o working tree quase sempre tem edição não-commitada de OUTRO agente; sem
      // isso o rebase recusa ("unstaged changes"). O autostash guarda e repõe só o que é tracked-mod.
      git(['pull', '--rebase', '--autostash']);
    } catch (e) {
      // Falha aqui é quase sempre CONFLITO de rebase (a outra máquina pushou algo incompatível),
      // não falha de push — mensagem tem que apontar pro problema certo, senão quem lê tenta
      // "re-rodar" um push que nunca foi o que quebrou, e o repo fica preso em rebase-em-progresso
      // pra próxima rodada (que agora o gitOpInProgress() acima pega, mas só depois de confundir).
      console.error(
        '⚠ git pull --rebase falhou — provável CONFLITO com o que a outra máquina pushou.\n' +
        '   O repo está com rebase em andamento. Resolva na mão: "git status", corrija os\n' +
        '   conflitos, "git add" + "git rebase --continue" (ou "git rebase --abort" pra desistir),\n' +
        '   e só então re-rode "fila.mjs flush".\n' +
        '   ' + (e.stderr || e.message).trim()
      );
      process.exit(1);
    }
    try {
      git(['push']);
      console.log('✅ push concluído.');
    } catch (e) {
      console.error(
        '⚠ push falhou depois de um pull limpo (provável corrida com push externo entre o pull e ' +
        'o push) — re-rode "fila.mjs flush", ele reempurra os commits pendentes:',
        (e.stderr || e.message).trim()
      );
      process.exit(1);
    }
  }
}

// ---- dispatch --------------------------------------------------------------
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'add') add(rest[0], rest[1], rest.slice(2));
else if (cmd === 'flush') flush(rest[0]);
else if (cmd === 'ls') ls();
else {
  console.error('uso: fila.mjs add <taskId> "<msg>" [paths...] | flush [autor] | ls');
  process.exit(1);
}
