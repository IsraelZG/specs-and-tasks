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

// --- M4a: promote exige TODAS as dependências `done` (não `in_progress`) ------
// Retrospectiva 2026-07-19: EST-49b foi promovida a ready com dep "in_progress",
// nasceu de um master sem a dep, e o conflito estrutural era garantido. `done`
// significa MERGEADO na master — só então a dep existe para o worker herdar.
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

    // --- M4b: advisory (não bloqueia) se master não é ancestral do HEAD -------
    // Retrospectiva 2026-07-19: uma branch cortada antes de uma dep entrar na
    // master revisa/mergeia uma composição fóssil. Não bloqueia (master avança
    // o tempo todo), mas avisa: se a task depende de algo mergeado recentemente,
    // rebase antes do review para o parecer ver a composição real.
    try {
      execSync('git merge-base --is-ancestor master HEAD', { cwd: worktreeDir, stdio: 'ignore' });
    } catch {
      console.error('⚠️  aviso (M4b): `master` não é ancestral desta branch — ela pode preceder deps já mergeadas.');
      console.error('   Se a task tem dependências fechadas recentemente, considere `git merge master` antes do review.');
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
