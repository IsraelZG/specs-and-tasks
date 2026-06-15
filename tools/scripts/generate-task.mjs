import fs from 'fs';
import path from 'path';

/**
 * Script utilitário para converter uma string de descrição de tarefa em um
 * arquivo Markdown estruturado (MGTIA v2), suportando fluxo Agile e 
 * especificações estritas de I/O e Testes.
 */

const [, , taskId, taskTitle, taskComplexity, targetAgent] = process.argv;

if (!taskId || !taskTitle) {
  console.error("Uso: node generate-task.mjs <T-XXX> <Título> <Complexidade> <TargetAgent>");
  process.exit(1);
}

const template = `---
id: ${taskId}
title: "${taskTitle}"
status: draft
complexity: ${taskComplexity || 2}
target_agent: ${targetAgent || 'logic_agent'} # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# ${taskId} · ${taskTitle}

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** \`pnpm\` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (\`pnpm build\`, \`pnpm test\`, \`pnpm lint\` na raiz afetam todos os pacotes)
- **Test Runner:** \`vitest\` (pacotes core/protocol) e \`playwright\` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
*(Descreva a meta final desta tarefa baseada no plano-de-implementacao.md)*

## 2. Contexto RAG (Spec-Driven Development)
*(A spec é a fonte da verdade. Adicione links absolutos ou relativos)*
- [ ] \`docs/...\`

## 3. Escopo de Arquivos (Inputs e Outputs)
*(Defina EXATAMENTE quais arquivos o agente deve ler, criar ou modificar. Não edite arquivos fora deste escopo)*
- **[READ]** \`caminho/do/arquivo/referencia.ts\` (Funções/Classes existentes a serem lidas)
- **[CREATE]** \`caminho/novo/arquivo.ts\` (O formato esperado do output)
- **[UPDATE]** \`caminho/existente.ts\` (Linhas X a Y, ou adicionar função Z)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** (Vitest para Node puro / Playwright para E2E / React Testing Library em JSDOM)
- [ ] **Métricas/Cobertura:** (Ex: Testar todos os ramos de erro, testar a assinatura inválida)
- [ ] **Ambiente do Teste:** (Node puro, sem browser / Headless browser)
- [ ] **Fora de Escopo:** (O que NÃO precisa ser testado)

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - 
> - 

1. **[TDD]** Escreva o teste em \`...\`
2. Implemente \`...\`
3. Refatore.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ATENÇÃO:** Se a spec (RAG) for ambígua, contraditória ou o design pattern imposto for impossível, **PARE**. Mude o status para \`blocked\` e escreva o motivo abaixo. Não alucine uma abstração não documentada.
- *[Nenhum problema identificado]*

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente \`agile_reviewer\` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O \`pnpm test\` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (\`pnpm lint\`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Comentários de Revisão:** 

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando \`node tools/scripts/manage-task.mjs\`.
`;

import { rebuildIndexes } from './rebuild-index.mjs';

const isMeta = taskId.startsWith('M-');
const targetDir = path.join(process.cwd(), isMeta ? 'meta-tasks' : 'tasks');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const filePath = path.join(targetDir, taskId + '.md');
fs.writeFileSync(filePath, template, 'utf8');

console.log('✅ Tarefa ' + taskId + ' v2 criada com sucesso em: ' + filePath);

rebuildIndexes();
