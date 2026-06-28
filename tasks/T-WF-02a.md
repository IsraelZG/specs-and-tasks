---
id: T-WF-02a
title: "Interpretador Nível 1: estado único + transição evento+guarda"
status: draft
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-WF-01", "T-103"]
blocks: ["T-WF-02b"]
parent: "T-WF-02"
---

# T-WF-02a · Interpretador Nível 1: estado único + transição evento+guarda

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Monorepo:** Turborepo
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o núcleo do interpretador Nível 1 no pacote `@plataforma/workflow`: máquina de estados event-sourced — recebe configuração atual + evento, avalia guardas Zen, determina próximo estado + ações. Fold de event sourcing: reconstituir estado = re-fold de eventos finalizados
*(extraído de T-WF-02 §1; `caderno-3-sdk/24-workflow-reference-spec.md` §3, §4)*.

### Contratos exatos
```ts
// --- packages/workflow/src/interpreter.ts ---
import { WorkflowDocument, WorkflowTransition, WorkflowAction } from './schema.js'; // T-WF-01
import { HLCTimestamp } from '@plataforma/core'; // T-103

export interface WorkflowInstanceState {
  instanceId: string;
  workflowId: string;
  currentState: string;
  context: Record<string, unknown>;   // variáveis de contexto
  hlc: HLCTimestamp;                   // HLC do último evento processado
  eventCount: number;
}

export interface EventInput {
  eventType: string;
  payload: Record<string, unknown>;
  hlc: HLCTimestamp;
}

export interface TransitionResult {
  nextState: string;
  actions: WorkflowAction[];          // ações a emitir
  context: Record<string, unknown>;   // contexto atualizado
  applied: boolean;                    // false se nenhuma transição disparou
}

/** Avalia evento contra workflow: encontra transição cuja guarda satisfaz, aplica ações. */
export function evaluateEvent(
  workflow: WorkflowDocument,
  instance: WorkflowInstanceState,
  event: EventInput,
): TransitionResult;

/** Reconstrói estado via fold de eventos (event sourcing). */
export function foldEvents(
  workflow: WorkflowDocument,
  events: EventInput[],
  initialState?: string,
): WorkflowInstanceState;
```
- `evaluateEvent`: itera `workflow.transitions`, avalia guarda Zen (`T-604`) contra `instance.context + event.payload`. Se `applied: true`, retorna `nextState` + `actions`.
- `foldEvents`: reduz lista de eventos aplicando `evaluateEvent` sequencialmente.
- Estado único: apenas um estado ativo por instância.

## 2. Contexto RAG
- [caderno-3-sdk/24-workflow-reference-spec.md](../docs/caderno-3-sdk/24-workflow-reference-spec.md) (§3, §4)
- [T-WF-01 · Schema](./T-WF-01.md)

## 3. Escopo de Arquivos
- **[READ]** `packages/workflow/src/schema.ts` (T-WF-01)
- **[CREATE]** `packages/workflow/src/interpreter.ts`
- **[CREATE]** `packages/workflow/tests/interpreter.test.ts`

## 4. Estratégia de Testes
- [x] **Framework:** Vitest (Node puro).

Casos de teste:
1. Workflow 2 estados: evento válido → transição de A→B, ações emitidas.
2. Guarda Zen: `context.count > 0` → transição dispara; `count = 0` → não dispara.
3. Evento não mapeado → `applied: false`, estado inalterado.
4. `foldEvents` com 3 eventos → estado reconstituído corretamente.
5. Workflow sem transição para o evento → `applied: false` (não crasha).
6. Contexto atualizado pelas ações de entrada (entry actions).

## 5. Instruções de Execução
1. Escreva testes com workflow mockado (3 estados, 5 transições).
2. Implemente `evaluateEvent` (loop de transições + guarda).
3. Implemente `foldEvents` (reduce sequencial).
4. Re-exporte. Rode build + test.

## 6. Feedback de Especificação
- *(Nenhuma pendência)*

## 7. DoD & Reviewer Checklist

### Gate de Evidência
```bash
pnpm --filter @plataforma/workflow build
pnpm --filter @plataforma/workflow test
```

### Checklist
- [ ] `evaluateEvent` com guarda Zen?
- [ ] `foldEvents` event-sourcing correto?
- [ ] Evento não mapeado → no-op?
- [ ] 6 casos de teste passando?
- [ ] `pnpm --filter @plataforma/workflow build` e `test` verdes?
