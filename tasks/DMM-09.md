---
id: DMM-09
title: "Árvore de execução do workflow (execution view): nó atual em tempo real"
status: draft:triaged
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
Visualização gráfica do fluxo da task (ADR 0013 §1.1): mostra em qual **nó do workflow** a execução está, em tempo real. Também cobre o **Painel de Tasks** com **cards color-coded** e os novos **Filtros Avançados** (organizando tasks por Status, Tipo Dinâmico da Task, Fila e Provedor alocado). Lê o estado do grafo (DMM-06) + eventos de progresso (DMM-07).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §1.1 (Árvore de Execução + Cards).
- [ ] DMM-06 — template/estado do grafo. DMM-07 — eventos de progresso de nó via WS.
- [ ] `apps/estaleiro/ui/src/views/board/**` — board/cards existentes (EST-14) a estender.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `apps/estaleiro/ui/src/views/board/**`, estado de grafo de DMM-06, eventos de DMM-07.
- **[CREATE]** `apps/estaleiro/ui/src/views/execution/**` — árvore do workflow + realce do nó atual.
- **[UPDATE]** board/cards para color-code por status e exibição da tag do "Tipo Dinâmico".
- **[UPDATE]** painel de filtros para suportar as buscas por Status, Tipo Dinâmico e Fila.

## 4. Estratégia de Testes Estrita
- **UI (ui: true):** smoke (render da árvore com um estado de grafo mockado + nó atual destacado) OU
  verificação manual do revisor. Marcar no Parecer.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** recomputar o grafo no cliente — renderizar o estado que o `plugin-workflows` reporta.
> - **NÃO** duplicar o board — estender o existente (EST-14) para os cards color-coded.

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-06` (ainda `draft:triaged` neste lote — depende de DMM-01→done) E
  `DMM-07` (acabei de marcar `draft:pending_decision`). §1 consome "estado do grafo (DMM-06) +
  eventos de progresso (DMM-07)" e §3 marca `[CREATE] apps/estaleiro/ui/src/views/execution/**`
  — sem o **estado de grafo final** (formato JDM decidido por DMM-06) nem o **canal de eventos**
  (decisão 4 do DMM-07), este spec só pode descrever intenções.
- **Pendente p/ pass-2 (JIT após DMM-06 e DMM-07 → done):** assinatura TS do componente
  Árvore, o **subset de eventos** que marca "nó atual" (`agent:start`? ou `agent:step`? ou
  novo evento?), como o grafo serializado pelo `plugin-workflows` é carregado
  (`packages/plugin-workflows/src/store.ts`), casos enumerados.
- **Pegadinha já registrada em §5 a abrir em pass-2:** "**NÃO recomputar o grafo no cliente** —
  renderizar o estado que o plugin-workflows reporta". O subset exato do estado (jdm completo vs
  delta) precisa ser fixado contra `packages/plugin-workflows/src/types.ts` (já lido em
  endurecer-fila, ver o que está exportado).
- **Capacidade:** `sonnet` já no frontmatter — render de árvore + realce é mecânico.
- **Pré-endurecimento já válido:** `ui: true`, `dependencies: [DMM-06, DMM-07]` consistente
  com `blocks:` de ambos.

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
- **[2026-07-08T18:42]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-06 e DMM-07 ainda draft; reendurecer JIT após ambos → done
