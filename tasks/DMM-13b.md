---
id: DMM-13b
title: "Persona Meta-Arquiteto: mutação de JSON/JDM (swap nós, prompts, modelo)"
status: draft:triaged
complexity: 3
parent_task: "DMM-13"
subtasks: []
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01", "DMM-06"]
blocks: []
capacity_target: sonnet
---

# DMM-13b · Persona Meta-Arquiteto

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Sub-piece de **geração** do Laboratório Genético (DMM-13). Define a persona
*Meta-Arquiteto* — um harness run com prompt estruturado para **mutar arquivos JSON/JDM**
de workflows. Operações de mutação: swap de nós, alteração de prompts de sistema, troca de
modelo. Produz uma lista de N variantes consumida pelo DMM-13a (Lab).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] ADR 0013 / ADR 0014 — schema de nó (DMM-01, ainda `pending_decision`).
- [ ] `packages/plugin-workflows/src/types.ts:5-11` — `WorkflowDefinition.content: string`
  (JSON cru de grafo JDM a mutar).
- [ ] DMM-06 (template de workflow default — formato de "pai" das variantes).
- [ ] `packages/plugin-agent-harness/src/runner.ts` — `run` que executa a persona.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** definição da persona Meta-Arquiteto (path a fixar em pass-2, p.ex.
  `packages/plugin-agent-harness/src/personas/meta-architect.ts`).
- **[CREATE]** conjunto de operações de mutação: `swapNodes`, `editPrompt`, `swapModel`
  (path a fixar).
- **[CREATE]** teste: dado um grafo JDM pequeno, aplicar `swapNodes` e assertar invariantes
  (ainda válido, ainda conectado).

## 4. Estratégia de Testes Estrita
- **Vitest:** com `run` mockado (não chama modelo real); asserta o shape da lista de
  variantes (N itens, cada um com `WorkflowDefinition.content` válido).

## 5. Instruções de Execução (Step-by-Step)
- **NÃO-FAZER:** **NÃO** chamar modelo real em teste (cfr. DMM-13 §5 pai). **NÃO** gerar
  variantes que violem invariantes do grafo (ex.: nó órfão).

### Pegadinhas conhecidas
- "Persona" NÃO está hoje na assinatura de `run` (cfr. `runner.ts:19-30`: aceita `taskId,
  model, cwd, prompt, timeoutMs, onEvent, signal, maxSteps, cancelWatcher, tools` — sem
  `persona`). Adicionar `persona?: string` em pass-2 ou usar `system` prompt com nome
  embutido? Decisão a fechar.

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-01` (spike, ainda `pending_decision` — schema de nó) E
  `DMM-06` (ainda `draft:triaged`). §1 diz "mutando JSON/JDM" — o **formato JDM** é o do
  `plugin-workflows` (cfr. `types.ts:5-11`: `content: string`), e a **mutação depende das
  operações suportadas pelo schema de nó** (DMM-01). Sem DMM-01 fechado, não dá p/ fixar
  o prompt do Meta-Arquiteto nem as operações de mutação.
- **Capacidade:** `sonnet` — composição de harness + mutação de string JSON, não algorítmico.
- **Pegadinhas a abrir em pass-2:**
  - "Persona" — adicionar `persona?: string` em `RunOptions`? ou só `system` prompt
    especializado? Decisão de pass-2.
  - "Invariantes do grafo" — o que conta como válido? (conectado, sem ciclos, sem nós
    órfãos). Provavelmente o `plugin-workflows` já valida na desserialização
    (`ZenEngine.createDecision`); mas a checagem PRE-mutação precisa ser local p/ não
    desperdiçar runs.
- **Pendente p/ pass-2 (JIT após DMM-01 e DMM-06 → done):** assinatura TS da persona,
  operações de mutação (path + retorno), invariantes enumerados.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Persona Meta-Arquiteto gera N variantes válidas a partir de um workflow base.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-agent-harness test
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T19:12]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-01, DMM-06 ainda draft; reendurecer JIT — adicionar persona?: string em RunOptions
