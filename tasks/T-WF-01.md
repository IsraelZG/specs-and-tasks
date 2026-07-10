---
id: T-WF-01
title: "formato SPEC:WORKFLOW Nivel 1 + validador + envelope (guardas Zen, acoes intent, orcamento)"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004"]
blocks: ["T-WF-02", "T-WF-04", "T-WF-05"]
capacity_target: sonnet
---

# T-WF-01 · formato SPEC:WORKFLOW Nivel 1 + validador + envelope (guardas Zen, acoes intent, orcamento)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro — lib isomórfica)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir o schema `SPEC:WORKFLOW` Nível 1 (máquina de estados rasa) e implementar o validador estático que aplica o envelope de segurança: guardas só referenciam decisões Zen registradas, ações só emitem intents pelo pipeline, transições nunca elevam privilégio. Validador roda em 3 pontos: autoria, ingestão e antes de executar.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/24-workflow-reference-spec.md` §1 (workflow como SPECIFICATION), §3 (envelope de segurança), §4 (Nível 1)
- Enriquecimento: [[spec-workflow]] — confirma kind: WORKFLOW, estado é projeção; [[saga]] — primitiva de compensação reusada; [[approves]] — aresta de tarefa humana

### Contratos TS (derivados do RAG §4)

```ts
// --- packages/workflow/src/schema.ts 
---

export interface WorkflowDocument {
  version: string;                     // Nível 1
  workflow_id: string;
  initial_state: string;
  /** Estados nomeados. */
  states: Record<string, WorkflowState>;
  /** Orçamento de recurso como dado de SPEC (igual L3 das páginas). */
  limits?: WorkflowLimits;
}

export interface WorkflowState {
  /** Sub-estados sequenciais (aninhamento raso, 1 nível). */
  substates?: string[];
  /** Ação executada ao entrar no estado. */
  entry?: WorkflowAction[];
  /** Ação executada ao sair do estado. */
  exit?: WorkflowAction[];
  /** Transições disparadas por evento + guarda opcional. */
  transitions: WorkflowTransition[];
  /** Estados compostos rasos: sub-workflow por referência. */
  sub_workflow_ref?: string;
  /** Estado de tarefa humana aguardando APPROVED_BY. */
  human_task?: HumanTaskConfig;
}

export interface HumanTaskConfig {
  /** Deadline HLC para timeout da tarefa. */
  timeout_ms: number;
  /** Política de escalonamento (obrigatória — §4). */
  escalation_policy: 'escalate_to_supervisor' | 'escalate_to_root' | 'emit_exception_alert';
  /** Alvo de fallback explícito (ex.: entity_id do supervisor). */
  escalation_target?: string;
}

export interface WorkflowTransition {
  event: string;
  target: string;
  /** Guarda Zen opcional. Referencia decisão Zen registrada. */
  guard?: string;
}

export interface WorkflowAction {
  /** Tipo de ação — vocabulário fechado do envelope de segurança. */
  type: 'emit_intent' | 'emit_event';
  /** Referência à decisão/intent registrada. */
  ref: string;
  payload?: Record<string, string>;
}

export interface WorkflowLimits {
  max_states: number;
  max_transitions_per_state: number;
  max_guard_length: number;
  max_depth: number;
}

// --- packages/workflow/src/validator.ts ---

export interface WorkflowValidationDiagnostic {
  rule: string;
  path: string;
  message: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  diagnostics: WorkflowValidationDiagnostic[];
}

export interface WorkflowValidator {
  validate(doc: WorkflowDocument): WorkflowValidationResult;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/24-workflow-reference-spec.md](../docs/caderno-3-sdk/24-workflow-reference-spec.md) §1 (workflow como SPECIFICATION), §3 (envelope de segurança), §4 (Nível 1: estados, transições, entry/exit, timers, composto raso, tarefa humana)
- [docs/conceitos/spec-workflow.md](../docs/conceitos/spec-workflow.md) — definição canônica
- [docs/conceitos/saga.md](../docs/conceitos/saga.md) — primitiva ASSET:LOCK + TTL reusada
- [docs/conceitos/approves.md](../docs/conceitos/approves.md) — aresta APPROVED_BY para tarefa humana

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/24-workflow-reference-spec.md` (contrato completo)
- **[READ]** `packages/protocol/src/ports.ts` (tipos base — T-004)
- **[READ]** `docs/conceitos/spec-workflow.md`
- **[READ]** `docs/conceitos/saga.md`
- **[READ]** `docs/conceitos/approves.md`
- **[CREATE]** `packages/workflow/src/schema.ts` — WorkflowDocument, estados, transições, ações
- **[CREATE]** `packages/workflow/src/validator.ts` — WorkflowValidator, envelope de segurança
- **[CREATE]** `packages/workflow/src/index.ts` — re-export
- **[CREATE]** `packages/workflow/tests/schema.test.ts`
- **[CREATE]** `packages/workflow/tests/validator.test.ts`
- **[UPDATE]** `packages/workflow/package.json` — dependência `@plataforma/protocol`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/workflow test`)
- [x] **Fora de Escopo:** Interpretador (T-WF-02), saga/TTL (T-WF-03), Mermaid (T-WF-04)

Casos de teste (numerados):
1. Documento mínimo (1 estado inicial, 1 transição, sem guarda) valida com sucesso.
2. Estado sem transições declaradas → `valid: false`.
3. Transição com `target` que não existe nos `states` → `valid: false`.
4. `initial_state` não declarado em `states` → `valid: false`.
5. Guarda com expressão Zen de tamanho > `max_guard_length` → `valid: false`.
6. Número de estados > `max_states` → `valid: false`.
7. Ação com `type` não listado (ex.: `fetch_api`) → `valid: false` (envelope §3.2).
8. Ação do tipo `emit_intent` com `ref` vazia → `valid: false`.
9. Sub-workflow por referência (`sub_workflow_ref`) — válido se referencia outro SPEC:WORKFLOW (validação estrutural de formato, não de existência real).
10. Tarefa humana sem `timeout_ms` → `valid: false` (obrigatório — §4).
11. Tarefa humana sem `escalation_policy` → `valid: false`.
12. Estado composto raso: `substates` contém estado que não existe → `valid: false`.
13. Documento normal do Nível 2 (com regiões paralelas) é rejeitado pelo validador Nível 1 (versão mismatch).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente o interpretador (T-WF-02).
> - NÃO implemente saga/TTL (T-WF-03).
> - NÃO valide existência real de SPEC referenciadas — só formato estrutural.
> - NÃO aceite ações que não sejam `emit_intent` ou `emit_event`.

### Pegadinhas conhecidas
- O validador Nível 1 rejeita documentos com semântica do Nível 2 (regiões paralelas, history, etc.) — mas não precisa validar profundamente a sintaxe do Nível 2, só rejeitar `version` que não seja "1".
- `timeout_ms` e `escalation_policy` são obrigatórios em `human_task` (§4): workflow com tarefa humana sem timeout tranca a saga indefinidamente.
- `sub_workflow_ref` referencia outro `SPEC:WORKFLOW` por entity_id, mas o validador só verifica que é uma string não-vazia.

1. **[SETUP]** Crie `packages/workflow/package.json` com nome `@plataforma/workflow`, dependendo de `@plataforma/protocol`.
2. **[TDD]** Crie `packages/workflow/tests/validator.test.ts` com os 13 casos (RED).
3. Crie `packages/workflow/src/schema.ts` com as interfaces.
4. Crie `packages/workflow/src/validator.ts` implementando as regras de validação.
5. Crie `packages/workflow/src/index.ts` re-exportando.
6. Refatore até todos os testes passarem (GREEN).
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/24-workflow-reference-spec.md` — OK (124 linhas, §1–§9)
- `docs/conceitos/spec-workflow.md` — OK (17 linhas)
- `docs/conceitos/saga.md` — OK (102 linhas)
- `docs/conceitos/approves.md` — OK (94 linhas)
- `packages/protocol/src/ports.ts` — existe via T-004 (`ready`)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 13 casos de teste passam?
- [ ] Ações não-listadas (fora de `emit_intent`/`emit_event`) são rejeitadas?
- [ ] `human_task` sem timeout ou escalation_policy é rejeitado?
- [ ] Limites de orçamento (estados, transições, guarda) são aplicados?

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
- **[2026-07-03T20:03]** - *system* - `[Endurecido]`: Endurecimento em lote (dependencies done/empty)
- **[2026-07-03T20:03]** - *system* - `[Auto-promovida]`: deps todas done
