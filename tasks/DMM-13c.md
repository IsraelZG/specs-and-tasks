---
id: DMM-13c
title: "Consolidado de métricas (Fitness Function): integra traces+juiz do DMM-11"
status: draft:triaged
complexity: 3
parent_task: "DMM-13"
subtasks: []
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-11", "DMM-12"]
blocks: []
capacity_target: sonnet
---

# DMM-13c · Consolidado de métricas (Fitness Function)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Sub-piece de **pontuação** do Laboratório Genético (DMM-13). Define a **Fitness Function**
que pontua cada variante do Lab segundo pesos configuráveis. Integra as estatísticas de
traces do DMM-11 (Capture & Critique): Custo, Tempo, Sucesso, Punições (loops, falhas
de evidência). Consome o relatório do DMM-13a e produz um ranking para o humano escolher
o template vencedor.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] DMM-11 — traces de agente + tagueação do Juiz (a "matéria-prima" da Fitness).
- [ ] DMM-12 — Optimize (a Optimize flag alimenta novos traces; circularidade com DMM-13
  deve ser gerida).
- [ ] ADR 0013 §Verificação "Engine de Workflow Flexível".

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-dispatcher/src/lab/fitness.ts` (path a fixar em pass-2) —
  função `fitness(variant, traces): Score` com pesos configuráveis.
- **[CREATE]** schema do `Score` (campos: `cost`, `time`, `successRate`, `punishments`).
- **[CREATE]** teste: dado 2 variantes (A=rápido mas falha, B=lento mas passa), validar
  que B pontua acima de A segundo os pesos default.

## 4. Estratégia de Testes Estrita
- **Vitest:** com traces forjados; sem modelo real. Cobertura: casos limites (0 runs,
  100% falha, 100% sucesso, todos loops).

## 5. Instruções de Execução (Step-by-Step)
- **NÃO-FAZER:** **NÃO** misturar treino/avaliação: a Fitness só pontua, não muta
  (mutação é DMM-13b).

### Pegadinhas conhecidas
- Pesos default — derivar de uso real ou chumbar? Sugestão: começar com pesos
  (successRate=0.5, cost=0.2, time=0.2, punishments=0.1) e ajustar por telemetria.
- "Circularidade" DMM-13 ↔ DMM-12: cada Optimize aprovada (DMM-12) vira trace novo
  (DMM-11), que alimenta a Fitness (DMM-13c). É o loop de RL. Garantir que mudanças
  otimizadas NÃO entram no treino antes de estabilizar (guard de M 个s?).

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-11` (acabei de triar — depende de DMM-06) E `DMM-12` (ainda
  `draft:triaged`). §1 diz "integra as estatísticas de traces do DMM-11" — o **schema dos
  traces** é o output do Juiz (DMM-11), que está draft. Sem DMM-11 fechado, a função
  `fitness()` não pode fixar a interface.
- **Capacidade:** `sonnet` — função de pontuação ponderada, não algorítmica.
- **Pegadinhas a abrir em pass-2:**
  - Pesos default (ver §5 acima).
  - Guard de circularidade (DMM-13 ↔ DMM-12).
  - Como o humano **vê** o ranking? É um output JSON p/ a UI (futura view de
    "Resultados do Lab") ou já pluga em DMM-10 (editor visual)? Decisão de pass-2.
- **Pendente p/ pass-2 (JIT após DMM-11 e DMM-12 → done):** assinatura TS de `fitness()`,
  schema do `Score`, casos enumerados (teste A/B do spec §4 cobre 1; enumerar mais).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Fitness pontua N variantes segundo pesos; ranking é determinístico.
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
- **[2026-07-08T19:12]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-11, DMM-12 ainda draft; reendurecer JIT — pesos default + guard de circularidade
