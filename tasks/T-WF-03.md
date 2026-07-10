---
id: T-WF-03
title: "integracao com saga/TTL (compensacao) e tarefa humana (APPROVED_BY)"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-WF-02", "T-505", "T-501"]
blocks: ["T-WF-05"]
capacity_target: sonnet
---

# T-WF-03 · integracao com saga/TTL (compensacao) e tarefa humana (APPROVED_BY)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Integrar o interpretador de workflow (T-WF-02) com as primitivas de saga: compensação via `ASSET:LOCK` + TTL e tarefa humana com `APPROVED_BY`. Workflow que declara ações de compensação (rollback) e estados de aprovação humana integra com o pipeline de saga existente. Timeout de tarefa humana dispara escalonamento automático (supervisor/root/exceção).

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/24-workflow-reference-spec.md` §1.2 (estado é projeção, não nó mutável), §2 (primitivas reusadas: saga ASSET:LOCK + TTL, intent aguardando APPROVED_BY), §4 (escalonamento de tarefa humana)
- Enriquecimento: [[saga]] — anatomia da saga (reservar/confirmar/expirar/compensar); [[approves]] — aresta APPROVED_BY; T-505 (rotação de épocas) e T-501 (UCAN) garantem autorização

### Contratos TS (derivados do RAG §2, §4)

```ts
// --- packages/workflow/src/saga-integration.ts 
---
import type { WorkflowInstance, WorkflowEvent, WorkflowAction } from './interpreter';
import type { WorkflowDocument } from './schema';

/** Ação de compensação registrada para rollback. */
export interface CompensationAction {
  /** ID da perna de saga que precisa ser compensada. */
  leg_id: string;
  /** Tipo de primitiva usada. */
  primitive: 'ASSET:LOCK';
  /** Ação compensatória a executar (idempotente). */
  rollback_action: WorkflowAction;
  /** Status atual da compensação. */
  status: 'pending' | 'compensated' | 'failed';
}

export interface SagaContext {
  /** Pernas de saga ativas (reservadas, não confirmadas). */
  active_legs: CompensationAction[];
  /** TTL policy da saga. */
  ttl_policy: 'fixed' | 'per_leg' | 'renewable_lease' | 'risk_scaled';
  /** TTL em ms conforme política. */
  ttl_ms: number;
}

export interface HumanTaskState {
  /** Quem deve aprovar (entity_id do PROFILE:SYSTEM). */
  approver: string;
  /** Deadline HLC para timeout. */
  deadline: number;
  /** Política de escalonamento. */
  escalation_policy: 'escalate_to_supervisor' | 'escalate_to_root' | 'emit_exception_alert';
  /** Alvo de fallback. */
  escalation_target?: string;
  /** Status da tarefa. */
  status: 'awaiting_approval' | 'approved' | 'escalated' | 'timed_out';
}

export interface WorkflowSagaIntegration {
  /**
   * Ao executar um step que emite ações de saga, registra pernas
   * de compensação. Se o workflow abortar, executa rollback em ordem reversa.
   */
  registerCompensation(
    instance: WorkflowInstance,
    action: WorkflowAction
  ): CompensationAction;

  /**
   * Executa rollback de todas as pernas ativas em ordem reversa (LIFO).
   * Cada rollback é idempotente — reexecutar é seguro.
   */
  compensate(
    instance: WorkflowInstance,
    saga: SagaContext
  ): Promise<CompensationAction[]>;

  /**
   * Expira pernas cujo TTL foi ultrapassado (contra HLC).
   * Chamado pelo timer do workflow.
   */
  expireTTL(
    saga: SagaContext,
    currentHlc: number
  ): CompensationAction[];

  /**
   * Verifica se tarefa humana expirou e aplica política de escalonamento.
   * Retorna o evento de escalonamento a emitir.
   */
  checkHumanTaskTimeout(
    task: HumanTaskState,
    currentHlc: number
  ): { escalated: boolean; escalation_event: WorkflowEvent | null };
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/24-workflow-reference-spec.md](../docs/caderno-3-sdk/24-workflow-reference-spec.md) §2 (primitivas reusadas), §4 (escalonamento de tarefa humana)
- [docs/conceitos/saga.md](../docs/conceitos/saga.md) — anatomia da saga (reservar/confirmar/expirar/compensar)
- [docs/conceitos/approves.md](../docs/conceitos/approves.md) — aresta APPROVES (PROFILE:SYSTEM → CONTENT:INTENT)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/workflow/src/schema.ts` (T-WF-01)
- **[READ]** `packages/workflow/src/interpreter.ts` (T-WF-02)
- **[READ]** `docs/caderno-3-sdk/24-workflow-reference-spec.md` §2, §4
- **[READ]** `docs/conceitos/saga.md`
- **[READ]** `docs/conceitos/approves.md`
- **[CREATE]** `packages/workflow/src/saga-integration.ts` — WorkflowSagaIntegration, CompensationAction, HumanTaskState
- **[CREATE]** `packages/workflow/tests/saga-integration.test.ts`
- **[UPDATE]** `packages/workflow/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro
- [x] **Fora de Escopo:** Integração real com grafo (persistir pernas), UCAN real (T-501)

Casos de teste (numerados):
1. Registro de compensação: ação de saga emitida → `CompensationAction` criada com status `pending`.
2. Compensação LIFO: 3 pernas ativas → rollback executa na ordem 3, 2, 1.
3. Compensação idempotente: reexecutar rollback sobre perna já `compensated` → no-op.
4. TTL expirado: `expireTTL` com `currentHlc > ttl_ms + criação` → perna marcada como expirada.
5. TTL não expirado: `currentHlc` dentro da janela → perna permanece `pending`.
6. Tarefa humana: deadline expirado + política `escalate_to_supervisor` → `escalated: true`, evento de escalonamento gerado.
7. Tarefa humana: deadline expirado + política `emit_exception_alert` → `escalated: true`, evento de alerta gerado.
8. Tarefa humana: dentro do prazo → `escalated: false`, sem evento.
9. Compensação de saga com TTL `per_leg`: cada perna tem seu próprio TTL; teste expira perna 2 de 3 e verifica compensação parcial.
10. Workflow abortado: ao abortar, `compensate()` é chamado e todas as pernas `pending` vão para `compensated` ou `failed`.
11. Tarefa humana sem `escalation_policy` definida → erro (obrigatório).
12. Duas tarefas humanas no mesmo workflow (sequenciais) → cada uma com seu deadline independente.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente persistência no grafo (pernas, locks) — use estruturas em memória.
> - NÃO implemente o motor HLC real — use timestamp mock.
> - NÃO implemente UCAN real (T-501) — use stub de autorização.

### Pegadinhas conhecidas
- Rollback é LIFO (ordem reversa de criação). Inverter a ordem causaria inconsistência (dependência entre pernas).
- Idempotência de rollback: se uma perna já foi compensada, reexecutar é no-op. Essencial para retry.
- `escalation_policy` é obrigatório no `human_task` (§4). O validador (T-WF-01) já garante, mas o runtime também verifica.
- TTL `per_leg` significa que cada perna tem seu deadline independente — não um deadline global único.

1. **[TDD]** Crie `packages/workflow/tests/saga-integration.test.ts` com os 12 casos (RED).
2. Implemente `packages/workflow/src/saga-integration.ts`.
3. Atualize `packages/workflow/src/index.ts`.
4. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/24-workflow-reference-spec.md` §2, §4 — OK
- `docs/conceitos/saga.md` — OK (anatomia da saga, TTL policies)
- `docs/conceitos/approves.md` — OK (aresta APPROVES)
- `packages/workflow/src/schema.ts` — T-WF-01 (dep)
- `packages/workflow/src/interpreter.ts` — T-WF-02 (dep)
- T-505 (Rotação de Épocas) — `draft` no INDEX
- T-501 (UCAN Core) — `draft` no INDEX

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 12 casos de teste passam?
- [ ] Rollback é LIFO e idempotente?
- [ ] TTL expirado dispara expiração corretamente?
- [ ] Escalonamento de tarefa humana funciona para as 3 políticas?
- [ ] Tarefa humana sem `escalation_policy` é rejeitada em runtime?

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
