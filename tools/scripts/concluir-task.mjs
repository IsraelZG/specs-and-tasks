#!/usr/bin/env node
/**
 * concluir-task.mjs — Rito final determinístico do ciclo de vida MGTIA.
 *
 * Subcomandos:
 *   finish  <ID> <Agente> "<msg>" — Finalização pelo Worker (gate, commit, push branch, manage-task finish, fila)
 *   approve <ID> <Agente> "<msg>" — Aprovação pelo Reviewer (merge master, gate, push master, release wt, fila, auto-promoção & get-task das dependentes)
 *   reject  <ID> <Agente> "<msg>" — Rejeição pelo Reviewer (request_changes, registra parecer, fila)
 *   block   <ID> <Agente> "<msg>" — Bloqueio por exceção (commit WIP, push branch, manage-task block, fila)
 *   pause   <ID> <Agente> "<msg>" — Pausa / handoff (commit WIP, push branch, manage-task pause, fila)
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..', '..');
const tasksDir = path.join(docsRoot, 'tasks');
const codeRepo = process.env.SUPERAPP_DIR || path.resolve(docsRoot, '..', 'superapp');
const worktreesBase = path.resolve(codeRepo, '..', '.superapp-worktrees');
const currentMachine = os.hostname();

const [, , action, rawId, agentName, ...messageParts] = process.argv;
const message = messageParts.join(' ').trim();

if (!action || !rawId || !agentName) {
  console.error('Uso: node concluir-task.mjs <finish|approve|reject|block|pause> <TaskID> <NomeDoAgente> [Mensagem...]');
  process.exit(1);
}

const validActions = ['finish', 'approve', 'reject', 'block', 'pause'];
if (!validActions.includes(action)) {
  console.error(`Ação inválida '${action}'. Ações válidas: ${validActions.join(', ')}`);
  process.exit(1);
}

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function resolveTaskFile(input) {
  const norm = input.trim().toLowerCase().replace(/-/g, '');
  const files = fs.readdirSync(tasksDir).filter(
    f => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'index.md' && f.toLowerCase() !== 'ledger.md'
  );
  const exact = files.filter(f => path.basename(f, '.md').toLowerCase().replace(/-/g, '') === norm);
  if (exact.length === 1) return path.join(tasksDir, exact[0]);
  const prefix = files.filter(f => path.basename(f, '.md').toLowerCase().replace(/-/g, '').startsWith(norm));
  if (prefix.length === 1) return path.join(tasksDir, prefix[0]);
  die(`Task '${input}' não encontrada.`);
}

const taskFile = resolveTaskFile(rawId);
const taskId = path.basename(taskFile, '.md');
const taskText = fs.readFileSync(taskFile, 'utf-8');

function parseFrontmatter(txt) {
  const m = txt.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
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

const fm = parseFrontmatter(taskText);
const currentStatus = (fm.status || '').toLowerCase();
const taskMachine = fm.machine || null;
const worktreePath = fm.worktree_path || path.join(worktreesBase, taskId);

// Veto multi-máquina para ações de worker
if (['finish', 'block', 'pause'].includes(action)) {
  if (taskMachine && taskMachine.toLowerCase() !== currentMachine.toLowerCase()) {
    die(`VETO MULTI-MÁQUINA: A task ${taskId} está alocada na máquina '${taskMachine}', mas você está executando em '${currentMachine}'. Ação '${action}' bloqueada nesta máquina.`);
  }
}

function runCmd(cmd, cwd, stdio = 'inherit') {
  try {
    return execSync(cmd, { cwd, stdio, encoding: 'utf-8' });
  } catch (err) {
    die(`Comando falhou: ${cmd}\nErro: ${err.message}`);
  }
}

function parseDeps(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return raw.replace(/#.*$/, '').replace(/[\[\]"'\s]/g, '').split(',').filter(Boolean);
  }
}

function depsAllDone(depIds) {
  if (!depIds || depIds.length === 0) return true;
  for (const depId of depIds) {
    try {
      const depFile = resolveTaskFile(depId);
      const depFm = parseFrontmatter(fs.readFileSync(depFile, 'utf-8'));
      if ((depFm.status || '').toLowerCase() !== 'done') return false;
    } catch {
      return false; // se a dep não existe, conservador
    }
  }
  return true;
}

switch (action) {
  case 'finish': {
    if (currentStatus !== 'in_progress' && currentStatus !== 'rework') {
      die(`Para finalizar ('finish'), a task deve estar em 'in_progress' ou 'rework' (status atual: '${currentStatus}').`);
    }

    // 1. Commit de mudanças pendentes na worktree (se existir)
    if (fs.existsSync(worktreePath)) {
      const statusOut = execSync('git status --porcelain', { cwd: worktreePath, encoding: 'utf-8' }).trim();
      if (statusOut.length > 0) {
        console.log('• Comitando edições pendentes na worktree...');
        runCmd('git add -A', worktreePath);
        runCmd(`git commit -m "wip(${taskId}): ${message || 'finalizando tarefa'}"`, worktreePath);
      }
      // 2. Push da branch
      console.log(`• Fazendo push da branch task/${taskId} para origin...`);
      runCmd(`git push -u origin task/${taskId}`, worktreePath);
    }

    // 3. manage-task finish
    console.log(`• Executando manage-task.mjs finish ${taskId}...`);
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'manage-task.mjs')}" finish ${taskId} ${agentName} "${message || 'trabalho finalizado'}"`, docsRoot);

    // 4. Enfileirar commit de controle
    console.log('• Enfileirando alteração no controle (fila.mjs)...');
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'fila.mjs')}" add ${taskId} "chore(${taskId}): finish & evidencia"`, docsRoot);

    console.log(`\n✅ Task ${taskId} finalizada com sucesso e enviada para review!`);
    break;
  }

  case 'approve': {
    // 'review' (sem claim) ou 'in_review' (claimada — inclusive por um claim travado/abandonado;
    // a maquina de estados ja permite approve/request_changes a partir de in_review sem reclaimar).
    if (currentStatus !== 'review' && currentStatus !== 'in_review') {
      die(`Para aprovar ('approve'), a task deve estar em 'review' ou 'in_review' (status atual: '${currentStatus}').`);
    }

    // 1. Merge transacional via worktree.mjs merge (inclui gate, push master e fetch origin)
    const testProfile = fm.test_profile || 'full';
    const pkgTarget = fm.target_pkg || fm.target_package || '';
    const gateArgs = pkgTarget ? `pnpm gate ${pkgTarget} --profile ${testProfile}` : `pnpm gate --profile ${testProfile}`;

    console.log(`• Executando merge transacional da task/${taskId} no master...`);
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'worktree.mjs')}" merge ${taskId} -- ${gateArgs}`, docsRoot);

    // 2. manage-task approve
    console.log(`• Executando manage-task.mjs approve ${taskId}...`);
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'manage-task.mjs')}" approve ${taskId} ${agentName} "${message || 'aprovado'}"`, docsRoot);

    // 3. Liberar worktree se for slot de pool
    try {
      runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'worktree.mjs')}" release ${taskId}`, docsRoot, 'pipe');
    } catch {
      // noop se for efêmera
    }

    // 4. Enfileirar commit de controle
    console.log('• Enfileirando alteração no controle (fila.mjs)...');
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'fila.mjs')}" add ${taskId} "chore(${taskId}): approve & merge"`, docsRoot);

    console.log(`\n✅ Task ${taskId} aprovada e integrada na master!`);

    // 5. Analisar tarefas dependentes e promover/invocar get-task.mjs para as desimpedidas
    console.log('\n🔍 Analisando tarefas dependentes unblocked...');
    const allTaskFiles = fs.readdirSync(tasksDir).filter(
      f => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'index.md' && f.toLowerCase() !== 'ledger.md'
    );

    const unblocked = [];
    for (const file of allTaskFiles) {
      const p = path.join(tasksDir, file);
      const txt = fs.readFileSync(p, 'utf-8');
      const taskFm = parseFrontmatter(txt);
      const depIds = parseDeps(taskFm.dependencies);
      if (!depIds.includes(taskId)) continue;

      const depId = taskFm.id || path.basename(file, '.md');
      const depStatus = (taskFm.status || '').toLowerCase();

      if (depsAllDone(depIds)) {
        unblocked.push({ id: depId, status: depStatus });
      }
    }

    if (unblocked.length === 0) {
      console.log('• Nenhuma tarefa dependente desimpedida no momento.');
    } else {
      console.log(`\n🎉 Tarefas desimpedidas ativas (${unblocked.length}):`);
      for (const item of unblocked) {
        console.log(`\n════════════════ TAREFA DESIMPEDIDA: ${item.id} (status: ${item.status}) ════════════════`);
        if (item.status === 'draft:hardened') {
          console.log(`• Auto-promovendo ${item.id} para 'ready'...`);
          try {
            runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'manage-task.mjs')}" promote ${item.id} system "dep ${taskId} done"`, docsRoot);
          } catch (e) {
            console.warn(`  (aviso: não foi possível auto-promover ${item.id}: ${e.message})`);
          }
        }
        // Invocando get-task.mjs para fornecer contexto imediato ao revisor
        try {
          const getTaskOut = execSync(`node "${path.join(docsRoot, 'tools', 'scripts', 'get-task.mjs')}" ${item.id}`, { cwd: docsRoot, encoding: 'utf-8' });
          console.log(getTaskOut);
        } catch (e) {
          console.warn(`  (falha ao rodar get-task para ${item.id}: ${e.message})`);
        }
      }
    }
    break;
  }

  case 'reject': {
    if (currentStatus !== 'review' && currentStatus !== 'in_review') {
      die(`Para rejeitar ('reject'), a task deve estar em 'review' ou 'in_review' (status atual: '${currentStatus}').`);
    }

    console.log(`• Executando manage-task.mjs request_changes ${taskId}...`);
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'manage-task.mjs')}" request_changes ${taskId} ${agentName} "${message || 'requer mudancas'}"`, docsRoot);

    console.log('• Enfileirando alteração no controle (fila.mjs)...');
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'fila.mjs')}" add ${taskId} "chore(${taskId}): request_changes"`, docsRoot);

    console.log(`\n✅ Task ${taskId} devolvida para retrabalho ('rework'). Worktree preservada.`);
    break;
  }

  case 'block': {
    if (fs.existsSync(worktreePath)) {
      const statusOut = execSync('git status --porcelain', { cwd: worktreePath, encoding: 'utf-8' }).trim();
      if (statusOut.length > 0) {
        console.log('• Comitando edições pendentes na worktree (WIP)...');
        runCmd('git add -A', worktreePath);
        runCmd(`git commit -m "wip(${taskId}): [block] ${message || 'bloqueado'}"`, worktreePath);
      }
      console.log(`• Fazendo push da branch task/${taskId} para origin...`);
      runCmd(`git push -u origin task/${taskId}`, worktreePath);
    }

    console.log(`• Executando manage-task.mjs block ${taskId}...`);
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'manage-task.mjs')}" block ${taskId} ${agentName} "${message || 'bloqueado'}"`, docsRoot);

    console.log('• Enfileirando alteração no controle (fila.mjs)...');
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'fila.mjs')}" add ${taskId} "chore(${taskId}): block"`, docsRoot);

    console.log(`\n✅ Task ${taskId} marcada como 'blocked'. Código comitado e pushado.`);
    break;
  }

  case 'pause': {
    if (fs.existsSync(worktreePath)) {
      const statusOut = execSync('git status --porcelain', { cwd: worktreePath, encoding: 'utf-8' }).trim();
      if (statusOut.length > 0) {
        console.log('• Comitando edições pendentes na worktree (WIP)...');
        runCmd('git add -A', worktreePath);
        runCmd(`git commit -m "wip(${taskId}): [pause] ${message || 'pausa/handoff'}"`, worktreePath);
      }
      console.log(`• Fazendo push da branch task/${taskId} para origin...`);
      runCmd(`git push -u origin task/${taskId}`, worktreePath);
    }

    console.log(`• Executando manage-task.mjs pause ${taskId}...`);
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'manage-task.mjs')}" pause ${taskId} ${agentName} "${message || 'pausado'}"`, docsRoot);

    console.log('• Enfileirando alteração no controle (fila.mjs)...');
    runCmd(`node "${path.join(docsRoot, 'tools', 'scripts', 'fila.mjs')}" add ${taskId} "chore(${taskId}): pause"`, docsRoot);

    console.log(`\n✅ Task ${taskId} pausada. Código comitado e pushado.`);
    break;
  }
}
