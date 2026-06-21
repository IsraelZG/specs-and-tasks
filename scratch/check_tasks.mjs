import fs from 'fs';
import path from 'path';

const planPath = 'c:/Dev2026/Docs/docs/plano-de-implementacao.md';
const tasksDir = 'c:/Dev2026/Docs/tasks';

// 1. Read and parse plano-de-implementacao.md
const planContent = fs.readFileSync(planPath, 'utf-8');
const planTasks = new Map();

const planRegex = /^- \*\*T-([\w-]+)\s*·\s*(.*?)\.\*\*/gm;
let match;
while ((match = planRegex.exec(planContent)) !== null) {
    const id = `T-${match[1]}`;
    const desc = match[2].trim();
    planTasks.set(id, desc);
}

// 2. Read tasks directory
const taskFiles = fs.readdirSync(tasksDir).filter(f => f.startsWith('T-') && f.endsWith('.md'));
const fileTasks = new Map();

for (const file of taskFiles) {
    const filePath = path.join(tasksDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    let title = '';
    const titleMatch = content.match(/title:\s*"(.*?)"/);
    if (titleMatch) {
        title = titleMatch[1];
    } else {
        const h1Match = content.match(/^# T-[\w-]+\s*·\s*(.*)$/m);
        if (h1Match) {
            title = h1Match[1].trim();
        }
    }
    
    const id = file.replace('.md', '');
    fileTasks.set(id, title);
}

// 3. Generate report
const allIds = new Set([...planTasks.keys(), ...fileTasks.keys()]);
const sortedIds = Array.from(allIds).sort();

let output = '| ID | Plano de Implementação | Arquivo (tasks/) | Conferem? |\n';
output += '| :--- | :--- | :--- | :--- |\n';

for (const id of sortedIds) {
    const planDesc = planTasks.get(id) || '*NÃO ENCONTRADA*';
    const fileDesc = fileTasks.get(id) || '*ARQUIVO INEXISTENTE*';
    
    let matchStatus = '❌ Diferente';
    if (planDesc === '*NÃO ENCONTRADA*') {
        matchStatus = '⚠️ Extra no dir';
    } else if (fileDesc === '*ARQUIVO INEXISTENTE*') {
        matchStatus = '🚨 Faltando';
    } else if (planDesc.toLowerCase() === fileDesc.toLowerCase()) {
        matchStatus = '✅ Sim';
    } else if (fileDesc.toLowerCase().includes(planDesc.toLowerCase().split(' ')[0])) {
        matchStatus = '🟡 Parcial';
    }
    
    output += `| **${id}** | ${planDesc} | ${fileDesc} | ${matchStatus} |\n`;
}

fs.writeFileSync('c:/Dev2026/Docs/scratch/report.md', output, 'utf-8');
