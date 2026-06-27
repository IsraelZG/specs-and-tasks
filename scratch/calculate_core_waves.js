import fs from 'fs';
import path from 'path';

const TASKS_DIR = 'c:/Dev2026/Docs/tasks';
const files = fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md') && f !== 'INDEX.md');

const tasks = {};

for (const file of files) {
  const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf8');
  const id = file.replace('.md', '');
  
  // Filtrar apenas tarefas do core protocol (T-0xx, T-1xx, etc.) incluindo reworks e followups
  const isCoreTask = /^T-\d{3}(?:-(?:rework|followup)-\d+)?$/.test(id);
  if (!isCoreTask) continue;

  // Extrair título
  const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Unknown';
  
  // Extrair status
  const statusMatch = content.match(/^status:\s*(.+)$/m);
  const status = statusMatch ? statusMatch[1].trim() : 'draft';
  
  // Extrair dependências
  const depMatch = content.match(/^dependencies:\s*\[(.*?)\]/m);
  let dependencies = [];
  if (depMatch && depMatch[1].trim()) {
    dependencies = depMatch[1].split(',').map(d => d.replace(/["'\s]/g, '').trim());
  }
  
  tasks[id] = { id, title, status, dependencies };
}

// Resolver Ondas para o Core
const doneTasks = new Set(Object.values(tasks).filter(t => t.status === 'done').map(t => t.id));
const remainingTasks = { ...tasks };
doneTasks.forEach(id => delete remainingTasks[id]);

const waves = [];
let currentRemaining = Object.values(remainingTasks);

while (currentRemaining.length > 0) {
  const currentWave = [];
  const nextRemaining = [];
  
  for (const task of currentRemaining) {
    const allDepsResolved = task.dependencies.every(depId => {
      // Se não for uma tarefa mapeada no core, consideramos que está resolvida
      if (!tasks[depId]) return true;
      // Se for concluída
      if (doneTasks.has(depId)) return true;
      // Se está em alguma onda já processada
      return waves.some(wave => wave.some(t => t.id === depId));
    });
    
    if (allDepsResolved) {
      currentWave.push(task);
    } else {
      nextRemaining.push(task);
    }
  }
  
  if (currentWave.length === 0) {
    waves.push(nextRemaining);
    break;
  }
  
  waves.push(currentWave);
  currentRemaining = nextRemaining;
}

// Gerar formato Markdown para a tabela
let md = "# Ondas de Implementação da Plataforma Core\n\n";
md += "Este documento organiza as tarefas de desenvolvimento do protocolo e infraestrutura core em **Ondas sequenciais de execução paralela**.\n\n";
md += "- **Onda Atual (Onda 1)**: Tarefas cujas dependências já foram 100% concluídas. Podem ser iniciadas imediatamente em paralelo.\n";
md += "- **Ondas Seguintes**: Tarefas que dependem da finalização de itens da onda anterior.\n\n";

waves.forEach((wave, idx) => {
  md += `## 🌊 Onda ${idx + 1}\n\n`;
  md += "| ID | Tarefa | Status | Dependências Core |\n";
  md += "| :--- | :--- | :---: | :--- |\n";
  
  wave.forEach(t => {
    const depLinks = t.dependencies
      .filter(depId => tasks[depId]) // apenas dependências core
      .map(depId => `[${depId}](file:///c:/Dev2026/Docs/tasks/${depId}.md)`)
      .join(', ') || "-";
      
    md += `| [${t.id}](file:///c:/Dev2026/Docs/tasks/${t.id}.md) | ${t.title} | \`${t.status}\` | ${depLinks} |\n`;
  });
  md += "\n";
});

fs.writeFileSync('c:/Dev2026/Docs/scratch/core_waves.md', md);
console.log("Arquivo core_waves.md gerado com sucesso.");
