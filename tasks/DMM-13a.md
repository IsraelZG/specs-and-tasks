---
id: DMM-13a
title: "Módulo Laboratório no plugin-dispatcher (clone worktrees, N variantes em paralelo, relatório)"
status: draft:triaged
complexity: 3
parent_task: "DMM-13"
subtasks: []
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-06", "DMM-12"]
blocks: []
capacity_target: sonnet
---

# DMM-13a · Módulo "Laboratório" no `plugin-dispatcher`

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Sub-piece de **dispatch** do Laboratório Genético (DMM-13). Implementa o módulo "Laboratório"
no `plugin-dispatcher` que, dado um workflow base + parâmetros do Algoritmo Genético, clona
N worktrees isoladas e despacha cada variante em paralelo. Ao final, integra os resultados
das N variantes num único relatório consumido pelo Fitness (DMM-13c).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] ADR 0013 — delegação multi-modelo declarativa.
- [ ] `packages/plugin-dispatcher/src/dispatcher.ts` (EST-07) — `runAgent` port a reaproveitar.
- [ ] `tools/scripts/worktree.mjs` (no Docs) — pattern de worktree isolada para task.
- [ ] DMM-13b (Meta-Arquiteto) — produz a lista de variantes.
- [ ] DMM-13c (Fitness) — consome o relatório.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-dispatcher/src/lab/` — módulo novo (dir ou arquivo a fixar).
- **[CREATE]** teste: dado 3 variantes mockadas, valida que N worktrees são criadas, N runs
  completam, relatório agrega os resultados.

## 4. Estratégia de Testes Estrita
- **Vitest:** Variantes mockadas (sem chamar harness real); worktree mockada via
  `vi.mock('child_process')` ou similar. Asserta: N worktrees, paralelismo, agregação.

## 5. Instruções de Execução (Step-by-Step)
- **NÃO-FAZER:** **NÃO** rodar modelo real; testes com harness stub. **NÃO** sobrepor
  worktrees (cfr. DMM-13 §5 pai).

### Pegadinhas conhecidas
- "Paralelismo" — qual concurrency? Sugestão: `Promise.all` com cap configurável
  (N=4 default; ajustar por memória disponível). Decisão a fechar em pass-2.

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-06` (ainda `draft:triaged` — depende de DMM-01→done) E
  `DMM-12` (ainda `draft:triaged` — depende de DMM-10 e DMM-11). §3 marca
  `[CREATE] packages/plugin-dispatcher/src/lab/` — o **formato do "relatório"** depende do
  schema do Fitness (DMM-13c) e do output do Meta-Arquiteto (DMM-13b). Sem os pais, só
  declaração de intenção.
- **Capacidade:** `sonnet` no frontmatter — composição de `runAgent` + worktrees, não
  algorítmico.
- **Pegadinhas a abrir em pass-2:**
  - Concurrency cap (N paralelo) — derivar de `os.cpus().length` ou fixar em 4?
  - Cleanup de worktrees pós-run (sucesso e erro) — usar `git worktree remove` ou manter?
  - Cancelamento de uma variante (cancel-flag do harness, cfr. `runner.ts:21-37`) precisa
    de handler p/ abortar o batch?
- **Pendente p/ pass-2 (JIT após DMM-06 e DMM-12 → done):** assinatura TS do `Lab` module,
  schema do relatório, casos enumerados.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Módulo `Lab` cria N worktrees, despacha N variantes, integra relatório.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-dispatcher test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T19:12]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-06, DMM-12 ainda draft; reendurecer JIT — concurrency cap, cleanup de worktrees
