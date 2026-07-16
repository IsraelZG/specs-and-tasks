import fs from 'fs';
import path from 'path';

/**
 * Utilitário para reconstruir o INDEX.md das pastas de tarefas
 * lendo o frontmatter de cada arquivo Markdown.
 */

function parseFrontmatter(content) {
  // ﻿: tolera BOM (UTF-8 salvo por PowerShell) — sem o strip a task some do INDEX (caso T-1033)
  const match = content.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

function buildIndexForDirectory(dirPath, indexName = 'INDEX.md') {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') && f !== indexName && !f.startsWith('_'));
  
  const tasks = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
    const meta = parseFrontmatter(content);
    if (meta.id && meta.title) {
      tasks.push(meta);
    }
  }
  
  // Sort by ID
  tasks.sort((a, b) => a.id.localeCompare(b.id));
  
  let markdown = `# Dashboard de Tarefas: ${path.basename(dirPath)}\n\n`;
  markdown += `> **Atualizado automaticamente.** Agentes: não editem este arquivo. Usem \`manage-task.mjs\` para atualizar status.\n\n`;
  markdown += `| ID | Título | Status | Agente Alocado | Complexidade |\n`;
  markdown += `|---|---|---|---|---|\n`;
  
  for (const t of tasks) {
    markdown += `| [${t.id}](./${t.id}.md) | ${t.title} | \`${t.status || 'unknown'}\` | ${t.target_agent || '-'} | ${t.complexity || '-'} |\n`;
  }
  
  fs.writeFileSync(path.join(dirPath, indexName), markdown, 'utf8');
  console.log(`✅ Índice reconstruído: ${path.join(dirPath, indexName)} (${tasks.length} tarefas)`);
}

export function rebuildIndexes() {
  const tasksDir = path.join(process.cwd(), 'tasks');
  const metaTasksDir = path.join(process.cwd(), 'meta-tasks');
  
  buildIndexForDirectory(tasksDir);
  buildIndexForDirectory(metaTasksDir);
}

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  rebuildIndexes();
}
