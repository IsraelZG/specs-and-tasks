---
id: T-WF-02
title: "interpretador Nivel 1 (estado unico, transicao evento+guarda, entry/exit, timers HLC) event-sourced"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-WF-01", "T-103"]
subtasks: ["T-WF-02a","T-WF-02b"]
blocks: ["T-WF-03", "T-WF-05"]
---

# T-WF-02 · interpretador Nivel 1 (estado unico, transicao evento+guarda, entry/exit, timers HLC) event-sourced

> **DECOMPOSTA** — não executar diretamente. O trabalho está nas subtarefas: T-WF-02a, T-WF-02b

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro — interpretador não tem UI)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o interpretador do Nível 1: recebe configuração atual + evento e calcula próxima configuração + ações a emitir. Determinístico e total. Cada passo opera sob orçamento de recurso. A configuração ativa é essencialmente um estado (+ contexto). Fold de event sourcing trivial: reconstituir estado = re-fold dos eventos finalizados daquela instância.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/24-workflow-reference-spec.md` §1.2 (estado de execução = projeção event-sourced), §3 (interpretador), §4 (Nível 1), §7 (fundação compartilhada)
- Dep T-103 (HLC): timers usam Hybrid Logical Clock para deadlines

### Contratos TS (derivados do RAG §3, §4)

```ts
// --- packages/workflow/src/interpreter.ts 
---
import type { WorkflowDocument, WorkflowState, WorkflowAction, WorkflowTransition } from './schema';

/** Contexto da instância em execução (event-sourced). */
export interface WorkflowInstance {
  instance_id: string;
  workflow_id: string;
  /** Versão do SPEC:WORKFLOW sob a qual nasceu (pin — §1.4). */
  workflow_version: string;
  /** Estado atual calculado por fold dos eventos. */
  current_state: string;
  /** Dados de contexto da instância (payload). */
  context: Record<string, unknown>;
  /** Linhagem de eventos já processados. */
  event_log: WorkflowEvent[];
}

export interface WorkflowEvent {
  event_id: string;
  type: string;
  timestamp: number;         // HLC
  payload?: Record<string, unknown>;
}

export interface InterpreterStepResult {
  /** Nova configuração de estado. */
  next_state: string;
  /** Ações de entrada do novo estado (entry actions). */
  entry_actions: WorkflowAction[];
  /** Ações de saída do estado anterior (exit actions). */
  exit_actions: WorkflowAction[];
  /** Eventos internos gerados (Nível 1: externos só). */
  emitted_events: WorkflowEvent[];
  /** Se o orçamento foi exaurido neste passo. */
  budget_exhausted: boolean;
  /** Diagnóstico de falha (transição inválida, guarda rejeitada). */
  error?: string;
}

export interface WorkflowInterpreter {
  /**
   * Dado o estado atual + evento, calcula o próximo estado e ações.
   * Não modifica o grafo — apenas calcula.
   */
  step(
    definition: WorkflowDocument,
    instance: WorkflowInstance,
    event: WorkflowEvent,
    guardEvaluator: ZenGuardEvaluator,
    budget: WorkflowLimits
  ): InterpreterStepResult;

  /**
   * Reconstrói o estado atual a partir do event log (fold).
   * Determinístico: mesmo log → mesmo estado.
   */
  fold(
    definition: WorkflowDocument,
    event_log: WorkflowEvent[],
    guardEvaluator: ZenGuardEvaluator,
    budget: WorkflowLimits
  ): WorkflowInstance;
}

/** Avaliador de guardas Zen (stub — o motor real é externo). */
export interface ZenGuardEvaluator {
  evaluate(expression: string, context: Record<string, unknown>): boolean;
}

export interface WorkflowLimits {
  max_states: number;
  max_transitions_per_state: number;
  max_guard_length: number;
  max_depth: number;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/24-workflow-reference-spec.md](../docs/caderno-3-sdk/24-workflow-reference-spec.md) §1.2 (projeção event-sourced), §3 (interpretador, envelope), §4 (Nível 1: estado único, entry/exit, timers HLC), §7 (fundação compartilhada)
- [docs/conceitos/spec-workflow.md](../docs/conceitos/spec-workflow.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/workflow/src/schema.ts` (T-WF-01)
- **[READ]** `packages/workflow/src/validator.ts` (T-WF-01)
- **[READ]** `docs/caderno-3-sdk/24-workflow-reference-spec.md`
- **[CREATE]** `packages/workflow/src/interpreter.ts` — WorkflowInterpreter, step, fold
- **[CREATE]** `packages/workflow/src/zen-guard-evaluator.ts` — ZenGuardEvaluator stub
- **[CREATE]** `packages/workflow/tests/interpreter.test.ts`
- **[UPDATE]** `packages/workflow/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro
- [x] **Fora de Escopo:** Saga/TTL (T-WF-03), timers reais (T-103 provê HLC), Mermaid (T-WF-04)

Casos de teste (numerados):
1. Transição simples: estado "A", evento "next" → próximo estado "B", executa exit de A e entry de B.
2. Transição com guarda Zen verdadeira → transição dispara.
3. Transição com guarda Zen falsa → transição NÃO dispara, permanece no estado atual, `error` contém diagnóstico.
4. Evento sem transição correspondente no estado atual → `error`, permanece no estado.
5. Estado com `entry` actions: ao entrar no estado, `entry_actions` é populado.
6. Estado com `exit` actions: ao sair do estado, `exit_actions` é populado na ordem.
7. Estado composto raso: pai com `substates` [A, B]; transição de A para B dentro do composto.
8. Sub-workflow por referência: `sub_workflow_ref` presente → interpretador emite evento de delegação (não executa o sub-workflow inline).
9. Fold: reconstrói estado a partir de event log de 3 eventos → `current_state` correto.
10. Fold determinístico: mesmo log de eventos → mesmo estado (executar 2x, comparar).
11. Pin de versão: instância nascida sob `version: "1"` não aceita definição com `version: "2"` (erro).
12. Orçamento exaurido no meio do step → `budget_exhausted: true`.
13. Tarefa humana: estado com `human_task` emite `entry_actions` mas não transita automaticamente (aguarda evento externo APPROVED_BY).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente o motor Zen real — use um stub `ZenGuardEvaluator` que avalia expressões triviais.
> - NÃO implemente timers HLC reais — depende de T-103. Use timestamp mock.
> - NÃO implemente saga/compensação (T-WF-03).
> - NÃO persista no grafo — o interpretador é puro, sem I/O.

### Pegadinhas conhecidas
- O fold é determinístico: dados os mesmos eventos na mesma ordem, produz o mesmo estado. Testar com log embaralhado deve falhar (ordem importa).
- Pin de versão (§1.4): se `instance.workflow_version !== definition.version`, o interpretador rejeita.
- `sub_workflow_ref` é apenas referência — o interpretador emite um evento `delegate_sub_workflow` e espera que o orquestrador cuide do resto.
- `entry` e `exit` são arrays de ações, executadas em ordem.

1. **[TDD]** Crie `packages/workflow/tests/interpreter.test.ts` com os 13 casos (RED).
2. Implemente `packages/workflow/src/interpreter.ts` com `step()` e `fold()`.
3. Implemente `packages/workflow/src/zen-guard-evaluator.ts` com stub.
4. Atualize `packages/workflow/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/24-workflow-reference-spec.md` — OK
- `docs/conceitos/spec-workflow.md` — OK
- `packages/workflow/src/schema.ts` — T-WF-01 (dep)
- T-103 (HLC) — `ready` no INDEX

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 13 casos de teste passam?
- [ ] `fold()` é determinístico (mesmo log → mesmo estado)?
- [ ] Guarda falsa não dispara transição?
- [ ] Pin de versão é respeitado?
- [ ] Entry/exit actions são emitidas em ordem?

### Verificação automática
```bash
pnpm --filter @plataforma/workflow build
pnpm --filter @plataforma/workflow test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:03]** - *system* - `[Triado]`: Triagem em lote do backlog
