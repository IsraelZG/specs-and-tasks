import fs from 'fs';
import path from 'path';

const tasksDir = 'C:/Dev2026/.nexus-worktrees/hardening-tasks/tasks';

const mappings = {
  'DS': '10-design-system.md',
  'CN': '06-connectors.md',
  'PL': '12-plugins-e-computacao.md',
  'PG': '11-linguagem-de-paginas.md',
  'JU': '13-jurisdicao.md',
  'IA': '14-ia-rag-e-agentes.md',
  'WF': '24-workflow-reference-spec.md',
  'UI': '26-plugins-frontend.md',
  'MOD': '02b-modulos-profiles-mensageria.md',
  'SHL': '28-shell-e-composicao.md',
  'MK': '15-marketplace-reference-spec.md',
  'ERP': '16-erp-crm-reference-spec.md',
  'CFR': '17-contabil-fiscal-rh-reference-spec.md',
  'MAP': '23-mapa-reference-spec.md',
  'LOG': '25-logistica-reference-spec.md',
  'MSG': '20-mensagens-reference-spec.md',
  'SOC': '18-social-reference-spec.md',
  'STR': '19-streaming-reference-spec.md',
  'AD': '29-anuncios-reference-spec.md',
  'EML': '21-email-reference-spec.md',
  'CAL': '22-calendario-reference-spec.md',
  'OFF': '27-suite-office.md'
};

const taskFiles = fs.readdirSync(tasksDir).filter(f => f.startsWith('T-') && f.endsWith('.md'));

let updatedCount = 0;

for (const file of taskFiles) {
    const match = file.match(/^T-([A-Z]+)-\d+\.md$/);
    if (!match) continue;
    
    const group = match[1];
    const specFile = mappings[group];
    
    if (!specFile) continue;
    
    const filePath = path.join(tasksDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace the RAG context section
    const ragRegex = /(## 2\. Contexto RAG \(Spec-Driven Development\))[\s\S]*?(?=## 3\. Escopo de Arquivos)/;
    
    const replacement = `$1\n- [caderno-3-sdk/${specFile}](../docs/caderno-3-sdk/${specFile})\n\n`;
    
    if (ragRegex.test(content)) {
        content = content.replace(ragRegex, replacement);
        fs.writeFileSync(filePath, content, 'utf-8');
        updatedCount++;
        console.log(`Updated ${file}`);
    } else {
        console.log(`Could not find RAG section in ${file}`);
    }
}

console.log(`\nSuccessfully updated ${updatedCount} task files in hardening-tasks worktree.`);
