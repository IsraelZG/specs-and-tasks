import fs from 'fs';
import path from 'path';

const tasksDir = path.join(process.cwd(), 'tasks');
const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md') && f !== 'T-001.md');

for (const file of files) {
  const filePath = path.join(tasksDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already v3
  if (content.includes('## 0. Ambiente de Execução')) continue;

  const v3Headers = `## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** \`pnpm\` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo
- **Test Runner:** \`vitest\` (pacotes core) / \`playwright\` (E2E/Frontend)

`;

  content = content.replace(/## 1. Objetivo/, v3Headers + '## 1. Objetivo');

  const scopeTemplate = `## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** \`docs/plano-de-implementacao.md\`
- **[CREATE]** \`packages/target-module/src/index.ts\` (Substitua na execução pelo caminho real)
- **[UPDATE]** \`packages/target-module/tests/index.test.ts\`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Vitest (Node puro)
- [ ] **Métricas/Cobertura:** Testar cenários de sucesso e limites descritos na spec.
- [ ] **Fora de Escopo:** Interações de UI e integrações de rede reais.

`;

  content = content.replace(/## 3. Estratégia de Testes \(Test-Driven Development\)[\s\S]*?## 4. Referências de Código[\s\S]*?## 5. Instruções de Execução \(Step-by-Step\)/, scopeTemplate + '## 5. Instruções de Execução (Step-by-Step)');

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Todas as tarefas existentes migradas para estrutura V3!');
