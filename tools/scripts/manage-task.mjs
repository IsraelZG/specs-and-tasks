import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { performance } from 'node:perf_hooks';
import { emit } from './lib/telemetry.mjs';

const [, , action, taskId, agentName, ...messageParts] = process.argv;
const tStart = performance.now();

if (!action || !taskId || !agentName) {
  console.error('Uso: node manage-task.mjs <triage|harden|decide|block_decision|decompose|claim|demote|obsolete|start|promote|pause|finish|approve|request_changes|block|unblock|reconcile> <TaskID> <NomeDoAgente> [Mensagem...]');
  process.exit(1);
}

const message = messageParts.join(' ');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const distPath = path.resolve(repoRoot, 'apps/nexus-backend/dist/services/task.service.js');

// --- Gate validation on finish -----------------------------------------------
if (action === 'finish') {
  const worktreeDir = path.resolve(repoRoot, '..', '.superapp-worktrees', taskId);

  // Only validate if task has a code worktree (tooling-do-controle is exempt)
  if (existsSync(worktreeDir)) {
    // O trabalho da task vive na worktree, não no checkout principal (que está na master).
    // treeSha e artefato têm de ser lidos da worktree — o gate.mjs os grava lá (cwd onde roda).
    let treeSha;
    try {
      // treeSha excluindo .gate/ (bootstrap fix B1)
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
  }
}
// ----------------------------------------------------------------------------

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
  console.log(`✅ Tarefa ${taskId} atualizada. Status: ${rec.frontmatter.status}. Log adicionado.`);
  emit({
    task: taskId, phase: `manage-task.${action}`,
    cmd: `node tools/scripts/manage-task.mjs ${action} ${taskId} ${agentName} "${message}"`,
    wallMs: Math.round(performance.now() - tStart), exitCode: 0, actor: agentName,
  });

  // --- Auto-resume: re-dispatch tasks blocked on this one (P-04 B0) ---
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
