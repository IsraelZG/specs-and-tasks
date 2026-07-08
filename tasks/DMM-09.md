---
id: DMM-09
title: "Árvore de execução do workflow (execution view): nó atual em tempo real"
status: draft:placeholder
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
ui: true
dependencies: ["DMM-06","DMM-07"]
blocks: []
capacity_target: sonnet
---

# DMM-09 · Árvore de execução do workflow

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo · UI: FlexLayout + TinyBase

## 1. Objetivo
Visualização gráfica do fluxo da task (ADR 0013 §1.1): mostra em qual **nó do workflow** (Ingress,
Architect, Explorer, Editor) a execução está, em tempo real. Também cobre os **cards de task dinâmicos
color-coded** por status. Lê o estado do grafo (DMM-06) + eventos de progresso (DMM-07).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §1.1 (Árvore de Execução + Cards).
- [ ] DMM-06 — template/estado do grafo. DMM-07 — eventos de progresso de nó via WS.
- [ ] `apps/estaleiro/ui/src/views/board/**` — board/cards existentes (EST-14) a estender.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `apps/estaleiro/ui/src/views/board/**`, estado de grafo de DMM-06, eventos de DMM-07.
- **[CREATE]** `apps/estaleiro/ui/src/views/execution/**` — árvore do workflow + realce do nó atual.
- **[UPDATE]** board/cards para color-code por status.

## 4. Estratégia de Testes Estrita
- **UI (ui: true):** smoke (render da árvore com um estado de grafo mockado + nó atual destacado) OU
  verificação manual do revisor. Marcar no Parecer.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** recomputar o grafo no cliente — renderizar o estado que o `plugin-workflows` reporta.
> - **NÃO** duplicar o board — estender o existente (EST-14) para os cards color-coded.

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Árvore mostra o nó atual ao vivo; cards color-coded; verificação de UI feita.
### Verificação automática
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro-ui test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
