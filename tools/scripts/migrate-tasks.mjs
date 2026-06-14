import fs from 'fs';
import path from 'path';

const tasksDir = path.join(process.cwd(), 'tasks');
const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md') && f !== 'T-001.md');

for (const file of files) {
  const filePath = path.join(tasksDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add execution_mode if missing
  if (!content.includes('execution_mode:')) {
    content = content.replace(/^reviewer_agent: (.*)$/m, 'reviewer_agent: $1\nexecution_mode: sequential');
  }

  // Add blocks if missing
  if (!content.includes('blocks:')) {
    content = content.replace(/^dependencies: (.*)$/m, 'dependencies: $1\nblocks: []');
  }

  // Update target_agent: "any" to something valid
  content = content.replace(/target_agent:\s*"?any"?/, 'target_agent: logic_agent');

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Migração das tarefas existentes para v2 (execution_mode + blocks) concluída!');
