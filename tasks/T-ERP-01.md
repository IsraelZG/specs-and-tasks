---
id: T-ERP-01
title: "SPECs SALES_ORDER/PURCHASE_ORDER + ciclo como SPEC:WORKFLOW"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004", "T-WF-01"]
blocks: ["T-ERP-02", "T-ERP-03", "T-ERP-04", "T-ERP-05"]
---

# T-ERP-01 · SPECs SALES_ORDER/PURCHASE_ORDER + ciclo como SPEC:WORKFLOW

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir as SPEC node definitions para `SPEC:SALES_ORDER` e `SPEC:PURCHASE_ORDER` como máquinas de estado (`StateMachine`) no pacote `@plataforma/erp`. Cada SPEC declara o ciclo de vida completo (cotação → pedido → faturado → expedido → entregue → pós-venda para venda; requisição → cotação → ordem → recebimento → conferência para compras), onde cada transição é um intent validado. O estado de execução é projeção sobre os eventos da linhagem, nunca nó mutável.
*(Fonte: `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §2)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/erp/src/order-specs.ts 
---
import type { HLCTimestamp } from '@plataforma/core'; // T-103
import type { ULID } from '@plataforma/core'; // T-102

/** Estágios do ciclo de vida de uma venda. */
export const SALES_ORDER_STATES = [
  'draft', 'cotacao', 'pedido', 'faturado', 'expedido', 'entregue', 'pos_venda', 'cancelado'
] as const;
export type SalesOrderState = typeof SALES_ORDER_STATES[number];

/** Estágios do ciclo de vida de uma compra. */
export const PURCHASE_ORDER_STATES = [
  'draft', 'requisicao', 'cotacao', 'ordem', 'recebimento', 'conferencia', 'cancelado'
] as const;
export type PurchaseOrderState = typeof PURCHASE_ORDER_STATES[number];

/** Payload da SPEC:SALES_ORDER — definição da máquina de estados. */
export interface SalesOrderSpec {
  kind: 'SALES_ORDER';
  version: number;
  states: readonly SalesOrderState[];
  transitions: Record<SalesOrderState, SalesOrderState[]>;
  /** Guardas Zen (predicados) por transição — resolvidos em runtime. */
  guards?: Record<string, string>;
}

/** Payload da SPEC:PURCHASE_ORDER — definição da máquina de estados. */
export interface PurchaseOrderSpec {
  kind: 'PURCHASE_ORDER';
  version: number;
  states: readonly PurchaseOrderState[];
  transitions: Record<PurchaseOrderState, PurchaseOrderState[]>;
  guards?: Record<string, string>;
}

/** Cria uma nova instância de SPEC:SALES_ORDER com transições padrão. */
export function createSalesOrderSpec(version?: number): SalesOrderSpec;

/** Cria uma nova instância de SPEC:PURCHASE_ORDER com transições padrão. */
export function createPurchaseOrderSpec(version?: number): PurchaseOrderSpec;

/** Valida se uma transição de estado é permitida pela SPEC. */
export function isValidTransition<S extends string>(
  spec: { transitions: Record<S, S[]> },
  from: S,
  to: S,
): boolean;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/16-erp-crm-reference-spec.md](../docs/caderno-3-sdk/16-erp-crm-reference-spec.md) §1-2 — ERP como lente do subgrafo, ciclo de vida de pedidos
- [[spec-workflow]] — `SPEC:WORKFLOW` como nó `SPECIFICATION` (kind: `WORKFLOW`) com payload de máquina de estados
- [[asset-lock]] — primitiva de reserva/compensação usada nas transições
- [[maquina-rasa]] — Nível 1: ~90% dos processos de negócio

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §1-2
- **[READ]** `docs/conceitos/spec-workflow.md` — definição de SPEC:WORKFLOW
- **[READ]** `tasks/T-WF-01.md` — formato SPEC:WORKFLOW Nível 1 + validador (contratos de workflow)
- **[CREATE]** `packages/erp/src/order-specs.ts` — tipos e factory functions acima
- **[CREATE]** `packages/erp/tests/order-specs.test.ts`
- **[UPDATE]** `packages/erp/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/erp test`. Node puro, sem browser.
- [x] **Fora de Escopo:** Integração com StateMachine real (T-WF-01), persistência em grafo.

Casos de teste (numerados):
1. `createSalesOrderSpec()` retorna objeto com `kind: 'SALES_ORDER'`, `version: 1`, 8 estados, transições válidas.
2. `createPurchaseOrderSpec()` retorna objeto com `kind: 'PURCHASE_ORDER'`, `version: 1`, 7 estados, transições válidas.
3. `isValidTransition(spec, 'draft', 'cotacao')` → `true`.
4. `isValidTransition(spec, 'entregue', 'cotacao')` → `false` (transição inválida).
5. `isValidTransition(spec, 'faturado', 'cancelado')` → `true` (cancelamento é sempre permitido).
6. Transições de `cancelado` para qualquer outro estado são `false` (terminal).
7. `createSalesOrderSpec(3)` retorna `version: 3`.
8. O grafo de transições não contém ciclos (exceto cancelado→cancelado).
9. Tipo `SalesOrderState` aceita apenas os 8 literais; valor arbitrário rejeitado por `tsc --noEmit`.
10. `createPurchaseOrderSpec()` tem transição `conferencia → encerrado` implícita como terminal? — NÃO: `cancelado` é o único terminal; `conferencia` transita para `draft` (reabertura).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente a máquina de estados (StateMachine) — isso é T-WF-01. Esta task só define as SPECs (tipos e transições).
> - **NÃO** crie nós no grafo nem persista nada. SPEC é um payload de definição, não um nó instanciado.
> - **NÃO** invente estágios além dos documentados na fonte RAG §2.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- Confundir SPEC (definição/plano) com instância de workflow (execução). Esta task só define o formato da SPEC — `createSalesOrderSpec()` retorna um POJO, não inicia workflow.
- Cancelamento é sempre permitido a partir de qualquer estado (exceto `cancelado`). NÃO restrinja cancelamento só a `draft`/`cotacao` — a fonte RAG §2.3 diz que devolução/cancelamento = transição reversa que emite compensação.
- A transição `conferencia → ???` para PURCHASE_ORDER: após conferência, o ciclo natural encerra (terminal implícito). A SPEC declara `cancelado` como único estado terminal explícito; os demais permitem transição reversa.

1. **[TDD]** Crie `packages/erp/tests/order-specs.test.ts` com casos 1–10 da Seção 4.
2. Crie `packages/erp/src/order-specs.ts` com as interfaces e funções da Seção 1.
3. As factory functions (`createSalesOrderSpec`, `createPurchaseOrderSpec`) retornam o grafo de transições padrão conforme RAG §2.
4. Re-exporte em `packages/erp/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-WF-01 está `draft`**: os contratos de SPEC:WORKFLOW (formato do payload, validador, envelope) ainda não foram endurecidos. As interfaces acima são provisórias e usam types do core (HLCTimestamp, ULID) que independem de T-WF-01. O acoplamento com SPEC:WORKFLOW será ajustado quando T-WF-01 chegar a `ready`.
> - **Estados terminais**: `cancelado` é o único terminal explícito. A conferência de compra encerra naturalmente mas não é "terminal" (pode reabrir). Confirmar com arquiteto se `pos_venda` (venda) é terminal ou se permite transição reversa.
> **Status:** `draft` até T-WF-01 ficar `ready` e a questão dos estados terminais ser resolvida.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] As interfaces `SalesOrderSpec`/`PurchaseOrderSpec` exportadas com os tipos exatos da Seção 1?
- [ ] `isValidTransition` genérica funciona para ambas as SPECs?
- [ ] Os 10 casos de teste passam?
- [ ] Type-check (`tsc --noEmit`) passa sem `any`/`unknown`?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/erp build
pnpm --filter @plataforma/erp test
```
> **GATE DE EVIDÊNCIA:** Worker cola saída literal na Seção 8.

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
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
