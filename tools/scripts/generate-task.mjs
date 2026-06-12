import fs from 'fs';
import path from 'path';

/**
 * Script utilitário para converter uma string de descrição de tarefa em um
 * arquivo Markdown estruturado (MGTIA), suportando fluxo Agile completo (TDD, SDD, Code Review).
 * 
 * Uso via terminal/agente:
 * node tools/scripts/generate-task.mjs T-005 "SimNetwork v1" 2
 */

const [, , taskId, taskTitle, taskComplexity] = process.argv;

if (!taskId || !taskTitle) {
  console.error("Uso: node generate-task.mjs <T-XXX> <Título> <Complexidade>");
  process.exit(1);
}

const template = `---
id: ${taskId}
title: "${taskTitle}"
status: draft
complexity: ${taskComplexity || 2}
parent_task: null
subtasks: []
dependencies: []
target_agent: any
reviewer_agent: any
---

# ${taskId} · ${taskTitle}

## 1. Objetivo
*(Descreva a meta final desta tarefa baseada no plano-de-implementacao.md)*

## 2. Contexto RAG (Spec-Driven Development)
*(A spec é a fonte da verdade. Adicione links absolutos ou relativos para as RFCs e Cadernos que regem esta funcionalidade)*
- [ ] Especificação Principal: \`docs/...\`

## 3. Estratégia de Testes (Test-Driven Development)
*(Como esta funcionalidade será testada?)*
- [ ] **Abordagem**: *(Unitário via Vitest? E2E via Playwright?)*
- [ ] **Sem Visão (Para LLMs)**: Para agentes sem capacidade visual, como testar? (Ex: \`testing-library/react\` ou output JSON).

## 4. Referências de Código
- Arquivos Alvo: \`src/.../...\`

## 5. Instruções de Execução (Step-by-Step)
1. **[TDD]** Escreva o teste na pasta \`tests/\` primeiro, afirmando o comportamento esperado na spec.
2. Rode o teste para garantir que ele falhe.
3. Escreva a implementação mínima para o teste passar.
4. Refatore se necessário.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ATENÇÃO AGENTE EXECUTOR:** Se durante a execução você identificar que a especificação (RFC/Caderno) está ambígua, contraditória ou impossível de implementar de forma elegante, **PARE**. Não "invente" um comportamento. Descreva o problema técnico abaixo e altere o status desta tarefa para \`blocked\`.

- *[Nenhum problema identificado]*

## 7. Definition of Done (DoD)
- [ ] Testes escritos e passando (\`npm run test\`).
- [ ] Linter sem avisos.
- [ ] O comportamento segue estritamente a especificação.

## 8. Log de Handover e Revisão Agile (Code Review)
*(Espaço para o agente documentar o progresso ou para o Agente Revisor adicionar comentários)*

### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado** (Status vai para \`done\`)
- [ ] **Requer Refatoração** (Status volta para \`rework\`. Explicar motivos abaixo)
- **Comentários de Revisão:** 
`;

const tasksDir = path.join(process.cwd(), 'tasks');
if (!fs.existsSync(tasksDir)) {
  fs.mkdirSync(tasksDir, { recursive: true });
}

const filePath = path.join(tasksDir, `${taskId}.md`);
fs.writeFileSync(filePath, template, 'utf8');

console.log(`✅ Tarefa ${taskId} (Agile/MGTIA) criada com sucesso em: ${filePath}`);
