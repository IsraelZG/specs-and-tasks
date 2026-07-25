import path from 'path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { performance } from 'node:perf_hooks';
import { emit } from './lib/telemetry.mjs';

const [, , action, taskId, agentName, ...messageParts] = process.argv;
const tStart = performance.now();
const currentMachine = os.hostname();

if (!action || !taskId || !agentName) {
  console.error('Uso: node manage-task.mjs <triage|harden|decide|block_decision|decompose|claim|demote|obsolete|start|promote|pause|finish|approve|request_changes|block|unblock|reconcile> <TaskID> <NomeDoAgente> [Mensagem...]');
  process.exit(1);
}

const message = messageParts.join(' ');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const distPath = path.resolve(repoRoot, 'apps/nexus-backend/dist/services/task.service.js');

// --- helpers de leitura de frontmatter (sem depender do TaskService) ---------
function readTaskField(id, field) {
  for (const dir of ['tasks', 'meta-tasks']) {
    const p = path.resolve(repoRoot, dir, `${id}.md`);
    if (!existsSync(p)) continue;
    const content = readFileSync(p, 'utf-8');
    const m = content.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  }
  return null;
}
function parseIdArray(raw) {
  if (!raw) return [];
  return raw.replace(/#.*$/, '').replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
}

// --- Veto Multi-Máquina ------------------------------------------------------
if (['finish', 'pause', 'block', 'start'].includes(action)) {
  const recordedMachine = readTaskField(taskId, 'machine');
  if (recordedMachine && recordedMachine.toLowerCase() !== currentMachine.toLowerCase()) {
    console.error(`❌ Ação '${action}' bloqueada: A task ${taskId} está alocada na máquina '${recordedMachine}', mas você está executando na máquina '${currentMachine}'.`);
    process.exit(1);
  }
}

// --- M4a: promote exige TODAS as dependências `done` (não `in_progress`) ------
if (action === 'promote') {
  const deps = parseIdArray(readTaskField(taskId, 'dependencies'));
  const notDone = deps.filter(d => (readTaskField(d, 'status') || 'unknown') !== 'done');
  if (notDone.length > 0) {
    console.error(`❌ promote bloqueado: dependências não-\`done\` (não mergeadas): ${notDone.join(', ')}.`);
    console.error('   `in_progress`/`review` NÃO é `done`. A task nasceria de um master sem a dep — conflito garantido (ver retrospectiva M4).');
    process.exit(1);
  }
}

// --- Gate validation on finish -----------------------------------------------
if (action === 'finish') {
  const recordedWtPath = readTaskField(taskId, 'worktree_path');
  const worktreeDir = recordedWtPath || path.resolve(repoRoot, '..', '.superapp-worktrees', taskId);

  if (existsSync(worktreeDir)) {
    let treeSha;
    try {
      const fullTree = execSync('git rev-parse "HEAD^{tree}"', { cwd: worktreeDir, encoding: 'utf-8' }).trim();
      treeSha = execSync(`git ls-tree ${fullTree} | grep -v ".gate" | git mktree`, { cwd: worktreeDir, encoding: 'utf-8' }).trim();
    } catch {
      console.error('❌ gate: worktree nao e um repo git?');
      process.exit(1);
    }
    const artifactPath = path.join(worktreeDir, '.gate', `${treeSha}.json`);
    if (!existsSync(artifactPath)) {
      console.error(`❌ gate ausente: ${artifactPath} nao encontrado. Rode \`pnpm gate <pkg>\` e commite.`);
      process.exit(1);
    }
    let artifact;
    try {
      artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));
    } catch {
      console.error(`❌ gate invalido: ${artifactPath} nao e JSON valido.`);
      process.exit(1);
    }
    if (!artifact.allGreen) {
      console.error(`❌ gate stale: .gate/${treeSha}.json tem allGreen=false. Corrija as falhas e rode o gate novamente.`);
      process.exit(1);
    }
    const expectedProfile = readTaskField(taskId, 'test_profile');
    if (expectedProfile && artifact.profile !== expectedProfile) {
      console.error(`❌ gate com perfil incorreto: esperado ${expectedProfile}, artefato registra ${artifact.profile ?? 'perfil legado ausente'}.`);
      console.error(`   Rode \`pnpm gate <pkg> --profile ${expectedProfile}\` na worktree e commite o artefato.`);
      process.exit(1);
    }

    try {
      execSync('git merge-base --is-ancestor master HEAD', { cwd: worktreeDir, stdio: 'ignore' });
    } catch {
      console.error('⚠️  aviso (M4b): `master` não é ancestral desta branch — ela pode preceder deps já mergeadas.');
      console.error('   Se a task tem dependências fechadas recentemente, considere `git merge master` antes do review.');
    }
  }
}

let TaskService;
try {
  ({ TaskService } = await import(pathToFileURL(distPath).href));
} catch {
  console.error('Backend não compilado. Rode: pnpm --filter nexus-backend build');
  process.exit(1);
}

const svc = new TaskService({ rootDir: repoRoot });
try {
  let rec;
  if (action === 'reconcile') {
    rec = svc.reconcile(taskId, agentName);
  } else {
    rec = await svc.transition(taskId, action, agentName, message);
  }

  // --- Auto-provisioning & metadata recording on start ---
  if (action === 'start') {
    try {
      execSync(`node "${path.join(repoRoot, 'tools', 'scripts', 'worktree.mjs')}" claim ${taskId}`, { cwd: repoRoot, stdio: 'inherit' });
    } catch (e) {
      console.warn(`[worktree] aviso ao alocar slot para ${taskId}: ${e.message}`);
    }
    const wtBase = path.resolve(repoRoot, '..', '.superapp-worktrees');
    let finalWtPath = path.join(wtBase, taskId);
    const poolPath = path.join(wtBase, '.pool.json');
    if (existsSync(poolPath)) {
      try {
        const pool = JSON.parse(readFileSync(poolPath, 'utf-8'));
        for (const [slotName, slot] of Object.entries(pool.slots || {})) {
          if (slot.id === taskId) {
            finalWtPath = path.join(wtBase, slotName);
            break;
          }
        }
      } catch {}
    }
    svc.setMeta(taskId, { worktree_path: finalWtPath, machine: currentMachine });
  }

  console.log(`✅ Tarefa ${taskId} atualizada. Status: ${rec.frontmatter.status}. Log adicionado.`);
  emit({
    task: taskId, phase: `manage-task.${action}`,
    cmd: `node tools/scripts/manage-task.mjs ${action} ${taskId} ${agentName} "${message}"`,
    wallMs: Math.round(performance.now() - tStart), exitCode: 0, actor: agentName,
  });

  // --- Auto-resume: re-dispatch tasks blocked on this one ---
  if (action === 'approve') {
    const tasksDir = path.resolve(repoRoot, 'tasks');
    let resumed = 0;
    try {
      const files = readdirSync(tasksDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
      for (const file of files) {
        const content = readFileSync(path.join(tasksDir, file), 'utf-8');
        if (!content.includes(`[blocked-on:task:${taskId}]`)) continue;
        const m = content.match(/^status:\s*(\S+)/m);
        if (!m) continue;
        const status = m[1];
        if (status !== 'in_progress' && status !== 'blocked') continue;
        const id = file.replace(/\.md$/, '');
        const child = spawn('node', ['tools/scripts/orquestrar.mjs', '--resume', id], {
          detached: true, stdio: 'ignore', cwd: repoRoot,
        });
        child.unref();
        resumed++;
        console.log(`  re-despachado: ${id} (status=${status})`);
      }
    } catch {
      // degradation: if tasksDir unreadable, skip auto-resume silently
    }
    if (resumed > 0) {
      console.log(`auto-resume: ${resumed} tarefa(s) re-despachada(s) apos approve de ${taskId}`);
    }
    emit({
      task: taskId, phase: 'manage-task.auto-resume',
      extra: { resumed },
      cmd: `auto-resume after approve ${taskId}`,
      wallMs: Math.round(performance.now() - tStart), exitCode: 0, actor: agentName,
    });
  }

} catch (err) {
  emit({
    task: taskId, phase: `manage-task.${action}`,
    cmd: `node tools/scripts/manage-task.mjs ${action} ${taskId} ${agentName} "${message}"`,
    wallMs: Math.round(performance.now() - tStart), exitCode: 1, actor: agentName,
    extra: { error: err.message },
  });
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
