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
  if (!fs.existsSync(queueDir)) return console.log('fila vazia — nada a commitar.');
  const files = fs.readdirSync(queueDir).filter((f) => f.endsWith('.txt')).sort(); // ordem cronológica
  if (!files.length) return console.log('fila vazia — nada a commitar.');

  let committed = 0;
  const skipped = [];
  for (const f of files) {
    const full = path.join(queueDir, f);
    const [message, ...paths] = fs.readFileSync(full, 'utf8').trim().split('\n');
    const existing = paths.filter((p) => fs.existsSync(path.join(root, p)));
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
      if (/nothing to commit|no changes added/i.test(out)) {
        // O arquivo não tem mudança (já commitado, ou edição revertida) — descarta a intenção.
        skipped.push(`${f}: nada a commitar (${existing.join(', ')})`);
        fs.rmSync(full);
      } else {
        // Erro real (ex.: index.lock de OUTRO flush) — NÃO descarta; tenta na próxima rodada.
        skipped.push(`${f}: ERRO git, mantido na fila — ${out.trim().split('\n')[0]}`);
      }
    }
  }

  console.log(`commits: ${committed}` + (skipped.length ? `  ·  pulados: ${skipped.length}` : ''));
  for (const s of skipped) console.log(`  ⚠ ${s}`);

  if (committed > 0) {
    try {
      git(['pull', '--rebase']);
      git(['push']);
      console.log('✅ push concluído.');
    } catch (e) {
      console.error('⚠ push falhou (resolva e re-rode flush):', (e.stderr || e.message).trim());
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
