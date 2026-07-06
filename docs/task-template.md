---
id: T-XXX
title: "[Nome da Tarefa]"
status: draft # Status inicial. Altere para 'ready' quando a tarefa estiver com RAG e escopo definidos.
complexity: 2 # 1 a 5 (5 exige quebra)
target_agent: logic_agent # devops_agent | logic_agent | crypto_agent | frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # sequential | parallel | broadcast
dependencies: [] # Ex: ["T-001", "T-002"]
blocks: [] # Ex: ["T-004"]
---

# T-XXX · [Nome da Tarefa]

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** \`pnpm\` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo
- **Test Runner:** \`vitest\` (pacotes core) / \`playwright\` (E2E/Frontend)

## 1. Objetivo
*(Descreva a meta final desta tarefa baseada no plano-de-implementacao.md. Seja direto.)*

## 2. Contexto RAG (Spec-Driven Development)
*(Links absolutos ou relativos para os Cadernos ou RFCs que regem o comportamento. O agente DEVE ler estes arquivos antes de iniciar.)*
- [ ] [Nome do Documento](../docs/caminho/do/doc.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
*(Defina estritamente quais arquivos a tarefa toca. Proibido criar/editar fora deste escopo)*
- **[READ]** \`packages/path/reference.ts\`
- **[CREATE]** \`packages/path/new-file.ts\`
- **[UPDATE]** \`packages/path/existing.ts\`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** (Ex: Vitest, Playwright, React Testing Library)
- [ ] **Métricas/Cobertura:** (Ex: Testar todos os branches de erro da função X)
- [ ] **Ambiente do Teste:** (Ex: Node puro, JSDOM, Headless Browser)
- [ ] **Fora de Escopo:** (Ex: Não testar componentes visuais de CSS, apenas lógicos)

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** importe X ou Y.
> - **NÃO** use configurações fora do padrão especificado.
> *(Forneça os arquivos de configuração brutos aqui se necessário, como tsconfig.json exatos, para evitar variância entre agentes).*

1. **[TDD]** Crie o teste primeiro.
2. Implemente a funcionalidade.
3. Garanta que o linter passe.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ATENÇÃO:** Se a spec (RAG) for ambígua, contraditória ou impossível, **PARE**. Mude o status para \`blocked\` e escreva o motivo abaixo.
- *[Nenhum problema identificado]*

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente \`agile_reviewer\` usará esta checklist para aprovar ou rejeitar:
- [ ] Respeita estritamente os arquivos definidos na Seção 3?
- [ ] Os testes passam no ambiente especificado na Seção 4?
- [ ] \`pnpm --filter <pacote> lint\` sem erros NOVOS (regressão de lint bloqueia no review — faz parte do Gate de Evidência junto com build+test)?
- [ ] Nenhuma das regras "NÃO FAZER" da Seção 5 foi violada?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- *(O agente executor documentará aqui suas decisões, pacotes afetados e warnings)*

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Comentários de Revisão:** 
