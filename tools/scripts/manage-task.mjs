import fs from 'fs';
import path from 'path';
import { rebuildIndexes } from './rebuild-index.mjs';

/**
 * Script CLI para os agentes gerenciarem o status das tarefas e o log de execução.
 * Uso: node manage-task.mjs <action> <taskId> <agentName> [message...]
 * Actions:
 *  - start: Muda para in_progress e inicia o log
 *  - pause: Mantém in_progress e adiciona log de checkpoint/handoff
 *  - finish: Muda para review e finaliza o log
 */

const [, , action, taskId, agentName, ...messageParts] = process.argv;

if (!action || !taskId || !agentName) {
  console.error("Uso: node manage-task.mjs <start|pause|finish|approve|request_changes> <TaskID> <NomeDoAgente> [Mensagem...]");
  process.exit(1);
}

const message = messageParts.join(' ');
const tasksDir = path.join(process.cwd(), 'tasks');
const metaTasksDir = path.join(process.cwd(), 'meta-tasks');

let taskPath = path.join(tasksDir, `${taskId}.md`);
if (!fs.existsSync(taskPath)) {
  taskPath = path.join(metaTasksDir, `${taskId}.md`);
}

if (!fs.existsSync(taskPath)) {
  console.error(`❌ Tarefa ${taskId} não encontrada em /tasks ou /meta-tasks.`);
  process.exit(1);
}

let content = fs.readFileSync(taskPath, 'utf8');

// Determinar o novo status
let newStatus = '';
let logAction = '';
if (action === 'start') {
  newStatus = 'in_progress';
  logAction = '[Iniciado]';
} else if (action === 'pause') {
  newStatus = 'in_progress';
  logAction = '[Pausado/Handoff]';
} else if (action === 'finish') {
  newStatus = 'review';
  logAction = '[Finalizado]';
} else if (action === 'approve') {
  newStatus = 'done';
  logAction = '[Aprovado]';
} else if (action === 'request_changes') {
  newStatus = 'rework';
  logAction = '[Refatoração Solicitada]';
} else {
  console.error(`❌ Ação inválida: ${action}`);
  process.exit(1);
}

// Atualiza o frontmatter status
content = content.replace(/^status:\s*.*$/m, `status: ${newStatus}`);

// Gera a entrada do log
const timestamp = new Date().toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:mm
const logEntry = `- **[${timestamp}]** - *${agentName}* - \`${logAction}\`${message ? `: ${message}` : ''}\n`;

// Injeta o log no final do arquivo, ou após a seção "9. Log de Execução" se ela existir e já tiver conteúdo
if (!content.includes('## 9. Log de Execução')) {
  // Se por algum motivo não tiver a seção 9, a gente cria
  content += `\n## 9. Log de Execução (Agent Execution Log)\n${logEntry}`;
} else {
  content += logEntry;
}

fs.writeFileSync(taskPath, content, 'utf8');
console.log(`✅ Tarefa ${taskId} atualizada. Status: ${newStatus}. Log adicionado.`);

// Reconstruir o INDEX
rebuildIndexes();
