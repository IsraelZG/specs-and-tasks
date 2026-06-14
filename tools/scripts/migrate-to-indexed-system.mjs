import fs from 'fs';
import path from 'path';
import { rebuildIndexes } from './rebuild-index.mjs';

const tasksDir = path.join(process.cwd(), 'tasks');

const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));

console.log(`Iniciando migração de ${files.length} tarefas...`);

let migratedCount = 0;

for (const file of files) {
  const filePath = path.join(tasksDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Muda de ready para draft
  if (/^status:\s*ready\s*$/m.test(content)) {
    content = content.replace(/^status:\s*ready\s*$/m, 'status: draft');
    changed = true;
  }

  // Adiciona a seção do log se não existir
  if (!content.includes('## 9. Log de Execução (Agent Execution Log)')) {
    content += `\n## 9. Log de Execução (Agent Execution Log)\n> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando \`node tools/scripts/manage-task.mjs\`.\n`;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    migratedCount++;
  }
}

console.log(`✅ Migração concluída. ${migratedCount} tarefas alteradas.`);

console.log("Reconstruindo os índices centrais...");
rebuildIndexes();
