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
spec_status: draft # EIXO DE QUALIDADE DA SPEC (≠ lifecycle status): draft | triaged | hardened | blocked-decision | decomposed
capacity_target: # haiku | sonnet | opus-spike — preenchido no endurecimento (pass 2)
# hardened_at: <data/commit>  ← carimbado pelo endurecer-task no pass 2 (baseline p/ reendurecer)
# decisions: ["..."]          ← só quando spec_status: blocked-decision (espelha a Seção 6)
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
> **Se a task afeta UI** (frontend_agent ou escopo em \`apps/*-frontend/**\`): unit/JSDOM NÃO
> basta. Especifique aqui um **smoke Playwright** (browser real) OU exija a verificação manual
> do revisor (subir o app e exercitar o fluxo) — o \`agile-reviewer\` trata isso como BLOCKER de
> processo. Marque \`ui: true\` no frontmatter para deixar explícito.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> -
> -

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
*(Liste aqui os erros prováveis e como evitá-los. Ex.: "mudar uma assinatura síncrona para \`async\`*
*exige \`await\` em TODOS os callers (controller, rota REST, MCP tools)"; "mapear \`A.foo → bar\`*
*ao passar para o método X"; "não duplicar a lógica de Y — chamar o método existente Z".)*
- *[Nenhuma identificada]*

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

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
\`\`\`bash
pnpm --filter <pacote> build      # tsc — precisa terminar sem erro
pnpm --filter <pacote> test       # precisa ficar verde, sem regressão
\`\`\`
> **GATE DE EVIDÊNCIA:** nem o \`finish\` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar \`[x]\` sem evidência é violação.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
\`\`\`
(cole aqui a saída real de pnpm build e pnpm test)
\`\`\`
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
