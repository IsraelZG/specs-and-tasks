---
id: DMM-11
title: "Pipeline de RL (Capture & Critique): Gravação de traces e Nó 'Juiz'"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-06"]
blocks: ["DMM-12"]
capacity_target: sonnet
---

# DMM-11 · Pipeline de RL (Capture & Critique)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Especificar e implementar a primeira metade do loop de Reinforcement Learning (Capture e Critique). O sistema deve capturar a "Cadeia de Pensamento" (traces de `runner.ts`, chamadas de ferramentas e logs de shell) de cada run, persistindo-os de forma estruturada (JSONB). Um Nó "Juiz" periódico (fluxo de background no `plugin-workflows`) avaliará o histórico em busca de anomalias, como loops de repetição de comandos e falhas nas evidências (linter/testes).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md`
- [ ] `packages/plugin-agent-harness/src/runner.ts` — eventos do ciclo de vida a serem interceptados.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `plugin-providers` (ou o módulo central de telemetria) para receber e persistir logs estruturados JSONB do `plugin-agent-harness`.
- **[CREATE]** fluxo "Juiz" declarativo que lê o histórico recente do BD e assinala métricas de Recompensa Positiva ou Punição para a execução da tarefa.

## 4. Estratégia de Testes Estrita
- **Vitest:** Injetar um trace forjado contendo 5 chamadas sucessivas do mesmo comando `grep` com falha e validar se o "Juiz" tagueia o run corretamente como "Loop Detectado / Punição".

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** acionar curas automáticas ou escritas em repositório RAG neste momento. O escopo desta task termina na tagueação (Critique). A ação corretiva (Optimize) será feita no DMM-12.

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-06` (ainda `draft:triaged` neste lote — depende de DMM-01→done).
  §3 marca `[UPDATE] plugin-providers (ou módulo central de telemetria) para receber e
  persistir logs estruturados JSONB do plugin-agent-harness` e `[CREATE] fluxo "Juiz"
  declarativo que lê o histórico recente do BD` — o **fluxo "Juiz"** é literalmente um nó
  do `plugin-workflows` (DMM-01) que ainda não tem schema de nó decidido. Inventar a
  interface do "Juiz" agora seria reescrever DMM-01.
- **Por que NÃO `harden`:** dependência estrutural em DMM-06 + contrato de nó aberto em
  DMM-01. Tagueação (Critique) e persistência (Capture) só podem ser fixadas em código
  após o schema de nó fechar.
- **Pré-endurecimento já válido (pass-1):** `capacity_target: sonnet` (extensão do
  plugin-providers + nó Juiz, é mecânica quando os contratos existirem), `dependencies:
  [DMM-06]` consistente com `blocks: [DMM-12]`, complexidade 5 coerente (cobertura
  moderada — capture de traces + tagueação periódica; não exige decompose).
- **Pegadinhas a abrir em pass-2:**
  - O §3 já alerta: "ação corretiva (Optimize) será feita no DMM-12" — manter o limite
    claro. **NÃO** acionar curas automáticas (NÃO-FAZER §5).
  - "JSONB" mencionado em §1 — termo SQL/Postgres, mas o superapp usa SQLite
    (visto em `packages/core/src/sqliteStorage.ts`); precisa decidir: TEXT com JSON
    encoded, ou mudança de storage. Sem fonte atual.
- **Pendente p/ pass-2 (JIT após DMM-01 e DMM-06 → done):** assinatura TS do
  `routeToolOutput`-like hook (cfr. `DecisionHook.routeToolOutput` em
  `packages/plugin-workflows/src/types.ts:34-39` — JÁ EXISTE e retorna
  `{ route: "compress" | "nano" | "direct" }`; o Juiz pode ser um nó que consome esse
  padrão); path do schema de persistência; casos enumerados (loop de 5 `grep` com falha
  → "Punição", etc.).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Traces de agente são persistidos estruturalmente; Nó Juiz detecta loops.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-agent-harness test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T19:10]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-06 ainda draft:triaged; DecisionHook.routeToolOutput já existe em plugin-workflows (cfr. types.ts:34) — pass-2 derivar
