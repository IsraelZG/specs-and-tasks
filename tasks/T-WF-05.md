---
id: T-WF-05
title: "vetores: guarda fora do registro, acao acima do privilegio, estado nunca mutavel-replicado, orcamento estourado aborta"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-WF-01", "T-WF-02", "T-WF-03"]
blocks: []

capacity_target: haiku
---

# T-WF-05 · vetores: guarda fora do registro, acao acima do privilegio, estado nunca mutavel-replicado, orcamento estourado aborta

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Testes de vetores adversariais para workflows: garantir que o envelope de segurança contém workflows maliciosos. Cobre: guarda referenciando decisão fora do registro, ação tentando elevar privilégio, tentativa de persistir estado mutável replicado (violação da regra §1.2), orçamento estourado aborta o step.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/24-workflow-reference-spec.md` §1.2 (estado = projeção, nunca nó mutável), §3.2 (envelope de segurança), §4 (orçamento, timers)
- Enriquecimento: [[spec-workflow]] — estado de execução é projeção event-sourced; [[saga]] — regra inviolável do estado de saga; [[approves]] — K aprovadores para intent

### Contratos TS (casos de vetor)

```ts
// --- packages/workflow/tests/vectors.test.ts 
---

export interface WorkflowVectorCase {
  name: string;
  description: string;
  /** Workflow malicioso ou ação ofensora. */
  document: WorkflowDocument;
  /** Evento injetado para disparar o vetor. */
  event?: WorkflowEvent;
  /** Resultado esperado. */
  expect: 'validation_fails' | 'transition_blocked' | 'action_rejected' | 'aborted_by_budget';
  /** Regra violada. */
  invariant: string;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/24-workflow-reference-spec.md](../docs/caderno-3-sdk/24-workflow-reference-spec.md) §1.2 (estado projeção, nunca nó mutável), §3.2 (envelope de segurança), §4 (orçamento)
- [docs/conceitos/spec-workflow.md](../docs/conceitos/spec-workflow.md)
- [docs/conceitos/saga.md](../docs/conceitos/saga.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/workflow/src/schema.ts` (T-WF-01)
- **[READ]** `packages/workflow/src/validator.ts` (T-WF-01)
- **[READ]** `packages/workflow/src/interpreter.ts` (T-WF-02)
- **[READ]** `packages/workflow/src/saga-integration.ts` (T-WF-03)
- **[CREATE]** `packages/workflow/tests/vectors.test.ts`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro
- [x] **Fora de Escopo:** Vetores de rede

Casos de vetor (numerados):
1. **Guarda fora do registro Zen:** `guard: "deleteAllRecords()"` (não é decisão Zen registrada) → `transition_blocked`, interpretador rejeita.
2. **Guarda com I/O:** `guard: "fetch('https://evil.com')"` → `validation_fails` (ZEN é total, sem I/O).
3. **Ação acima do privilégio:** ação `emit_intent` com payload `{ "role": "admin", "transfer": "ALL" }` → `action_rejected` (intent é assinado pela persona do usuário, pipeline valida).
4. **Ação JS inline:** ação `type: "eval"` com `code: "..."` → `validation_fails` (vocabulário fechado).
5. **Tentativa de estado mutável replicado:** workflow tenta criar aresta com `state` mutável → `validation_fails` (§1.2: estado é projeção, nunca nó mutável).
6. **Orçamento estourado no step:** guarda com complexidade que exaure orçamento → `aborted_by_budget`.
7. **Transição para estado inexistente após bypass de validador:** workflow válido mas evento dispara transição para estado não declarado → `transition_blocked`.
8. **Tarefa humana sem timeout:** workflow com `human_task` sem `timeout_ms` (burlando validador) → `validation_fails` ou runtime rejeita.
9. **Timer sem HLC:** workflow com deadline mas sem acesso a HLC → `transition_blocked`.
10. **Escalonamento para alvo inexistente:** `escalation_target: ""` → `action_rejected`.
11. **Workflow que referencia a si mesmo como sub-workflow:** `sub_workflow_ref` apontando para o próprio `workflow_id` → `validation_fails` (recursão não permitida no Nível 1).
12. **Event sourcing corrompido:** event log com evento forjado (timestamp futuro, assinatura inválida) → fold rejeita ou produz estado inconsistente detectável.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO modifique o interpretador ou validador para fazer os vetores passarem.
> - NÃO crie novos arquivos de implementação — esta task é só testes.

### Pegadinhas conhecidas
- Vetor 5 (estado mutável replicado) é conceitual — o teste verifica que o schema NÃO permite campo `state: { mutable: true }` ou que o validador rejeita.
- Vetor 11 (auto-referência) é específico do Nível 1 — sub-workflows no Nível 1 não podem ser recursivos.
- Vetor 12 (event sourcing corrompido) depende de o fold detectar eventos com timestamps inconsistentes (HLC).

1. Crie `packages/workflow/tests/vectors.test.ts` com os 12 vetores.
2. Cada caso monta o `WorkflowDocument` ou `WorkflowEvent` ofensor e assere o resultado esperado.
3. Rode `pnpm --filter @plataforma/workflow test` — vetores devem passar.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/24-workflow-reference-spec.md` §1.2, §3.2, §4 — OK
- `docs/conceitos/spec-workflow.md` — OK
- `docs/conceitos/saga.md` — OK
- `packages/workflow/src/validator.ts` — T-WF-01 (dep)
- `packages/workflow/src/interpreter.ts` — T-WF-02 (dep)
- `packages/workflow/src/saga-integration.ts` — T-WF-03 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 12 vetores passam (sistema contém/rejeita)?
- [ ] Nenhum vetor causa crash ou comportamento indefinido?
- [ ] Guarda fora do registro Zen é rejeitada?
- [ ] Ação JS inline é rejeitada?
- [ ] Orçamento estourado aborta sem crash?
- [ ] Auto-referência de sub-workflow é rejeitada?

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
