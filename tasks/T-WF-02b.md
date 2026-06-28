---
id: T-WF-02b
title: "Interpretador Nível 1: timers HLC + entry/exit actions"
status: draft
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-WF-02a"]
blocks: []
parent: "T-WF-02"
---

# T-WF-02b · Interpretador Nível 1: timers HLC + entry/exit actions

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Monorepo:** Turborepo
- **Test Runner:** `vitest` (Node puro, VirtualClock)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Estender o interpretador Nível 1 (T-WF-02a) com timers HLC para deadlines, ações de entrada/saída (entry/exit actions), e orçamento de recurso por passo. Cada passo do interpretador opera sob orçamento configurável
*(extraído de T-WF-02 §1; `caderno-3-sdk/24-workflow-reference-spec.md` §4)*.

### Contratos exatos
```ts
// --- packages/workflow/src/interpreter.ts (extensão) ---
import { WorkflowAction } from './schema.js'; // T-WF-01
import { HLCTimestamp } from '@plataforma/core'; // T-103

export interface TimerAction extends WorkflowAction {
  type: 'set_timer' | 'cancel_timer';
  timerId: string;
  deadline: HLCTimestamp;   // HLC do timer (T-103)
  onExpire: string;          // evento a disparar
}

export interface EntryExitActions {
  onEnter: WorkflowAction[];  // executadas ao entrar no estado
  onExit: WorkflowAction[];   // executadas ao sair do estado
}

export interface StepBudget {
  maxTransitions: number;     // default: 1 (Nível 1)
  maxActions: number;         // default: 10
}

/** Avalia evento com timers e entry/exit, respeitando orçamento. */
export function evaluateWithTimers(
  workflow: WorkflowDocument,
  instance: WorkflowInstanceState,
  event: EventInput,
  stateActions: Map<string, EntryExitActions>,
  budget?: StepBudget,
): TransitionResult;

/** Verifica timers expirados e dispara eventos correspondentes. */
export function checkExpiredTimers(
  instance: WorkflowInstanceState,
  currentHlc: HLCTimestamp,
): EventInput[];
```
- `evaluateWithTimers`: executa `onExit` do estado atual → avalia transição → executa `onEnter` do próximo estado. Respeita `budget.maxTransitions` e `budget.maxActions`.
- `checkExpiredTimers`: compara `instance.context.timers[].deadline ≤ currentHlc` e retorna eventos de expiração.

## 2. Contexto RAG
- [caderno-3-sdk/24-workflow-reference-spec.md](../docs/caderno-3-sdk/24-workflow-reference-spec.md) (§4)
- [T-WF-02a · Interpreter core](./T-WF-02a.md)
- [T-103 · HLC](./T-103.md)

## 3. Escopo de Arquivos
- **[READ]** `packages/workflow/src/interpreter.ts` (T-WF-02a)
- **[CREATE]** `packages/workflow/tests/interpreter.timers.test.ts`
- **[UPDATE]** `packages/workflow/src/interpreter.ts`

## 4. Estratégia de Testes
- [x] **Framework:** Vitest + VirtualClock (T-003).

Casos de teste:
1. Transição A→B → `onExit(A)` + `onEnter(B)` executadas em ordem.
2. Timer: dispara `set_timer` como ação de entrada; `checkExpiredTimers` após deadline → evento gerado.
3. Timer cancelado → `checkExpiredTimers` não gera evento.
4. Orçamento `maxActions: 2` com 5 ações de entrada → apenas 2 executadas, resto enfileirado.
5. `onExit` falha → transição abortada, estado mantido.
6. Timer com HLC futuro (não expirado) → `checkExpiredTimers` retorna vazio.

## 5. Instruções de Execução
1. Escreva testes com VirtualClock + workflow mockado.
2. Implemente `evaluateWithTimers` (entry/exit + orçamento).
3. Implemente `checkExpiredTimers`.
4. Rode build + test.

## 6. Feedback de Especificação
- *(Nenhuma pendência)*

## 7. DoD & Reviewer Checklist

### Gate de Evidência
```bash
pnpm --filter @plataforma/workflow build
pnpm --filter @plataforma/workflow test
```

### Checklist
- [ ] Entry/exit actions executadas na ordem correta?
- [ ] Timers HLC expiram e geram eventos?
- [ ] Orçamento limita ações por passo?
- [ ] 6 casos de teste passando?
- [ ] `pnpm --filter @plataforma/workflow build` e `test` verdes?
