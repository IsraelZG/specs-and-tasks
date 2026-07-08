---
id: DMM-03
title: "Nó Architect (Estágio 2): avaliador macro via plugin-providers (branching/subtasks)"
status: draft:placeholder
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"]
blocks: ["DMM-06"]
capacity_target: sonnet
---

# DMM-03 · Nó Architect (Estágio 2): orquestrador macro

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Implementar o **nó avaliador** (ADR 0013, Estágio 2 — The Architect): planeja a execução, quebra
problemas e avalia progresso **sem abrir arquivos**. A engine submete o contexto traduzido/comprimido
(saída do Estágio 1) ao **modelo de fronteira** via `plugin-providers`; a resposta define quais
ramificações do workflow seguir ou quais sub-tarefas criar.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Estágio 2.
- [ ] `docs/adr/0014-contrato-no-workflow-declarativo.md` (DMM-01) — como um nó dirige branching.
- [ ] `packages/plugin-providers/src/**` — invocação de modelo de fronteira.
- [ ] `packages/plugin-workflows/src/**` — como um nó decide a próxima aresta do grafo.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-providers/src/**`, `packages/plugin-workflows/src/**`.
- **[CREATE]** definição do nó Architect (formato DMM-01) + mapeamento resposta→ramificação/subtask.
- **[CREATE]** teste: contexto de exemplo → decisão de branching determinística (com provider mockado).

## 4. Estratégia de Testes Estrita
- Vitest com `plugin-providers` mockado (resposta fixa → aresta esperada). **Fora de Escopo:** custo real de API.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** deixar o Architect abrir/ler arquivos (é papel do Explorer, DMM-04) — só planeja.
> - **NÃO** hardcodar o modelo: provider é configurável por nó.

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Nó Architect decide branching a partir da resposta do modelo, via contrato DMM-01.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
