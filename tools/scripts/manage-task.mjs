import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const [, , action, taskId, agentName, ...messageParts] = process.argv;

if (!action || !taskId || !agentName) {
  console.error('Uso: node manage-task.mjs <triage|harden|decide|block_decision|decompose|claim|demote|start|promote|pause|finish|approve|request_changes|block|unblock|reconcile> <TaskID> <NomeDoAgente> [Mensagem...]');
  process.exit(1);
}

const message = messageParts.join(' ');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const distPath = path.resolve(repoRoot, 'apps/nexus-backend/dist/services/task.service.js');

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
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
