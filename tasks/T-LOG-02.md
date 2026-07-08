---
id: T-LOG-02
title: "fulfillment: alocacao multi-deposito por Zen + reserva por LOCK + ciclo com compensacao"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-LOG-01", "T-604"]
blocks: ["T-LOG-04", "T-LOG-05"]
capacity_target: sonnet
---

# T-LOG-02 · fulfillment: alocacao multi-deposito por Zen + reserva por LOCK + ciclo com compensacao

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de fulfillment no pacote `@plataforma/logistica`: alocação multi-depósito por decisão Zen (qual local atende qual pedido considerando distância, estoque, custo e SLA), reserva de estoque por `ASSET:LOCK` no local eleito, e ciclo de fulfillment (`SPEC:WORKFLOW`: aceito → separado → embalado → despachado → em trânsito → entregue). Falha em qualquer perna compensa via saga — re-alocar ou cancelar com estorno.
*(Fonte: `docs/caderno-3-sdk/25-logistica-reference-spec.md` §2)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/logistica/src/fulfillment.ts 
---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Parâmetros para decisão de alocação. */
export interface AllocationParams {
  /** SKUs a alocar. */
  items: Array<{ skuId: string; quantity: number }>;
  /** Endereço de entrega (para cálculo de distância). */
  deliveryLocation: { lat: number; lng: number };
  /** Peso dos fatores na decisão. */
  weights?: {
    distance: number;   // 0-1, default 0.3
    stockLevel: number; // 0-1, default 0.3
    cost: number;       // 0-1, default 0.2
    sla: number;        // 0-1, default 0.2
  };
}

/** Resultado da decisão de alocação. */
export interface AllocationDecision {
  /** Depósito eleito para cada SKU. */
  allocations: Array<{
    skuId: string;
    warehouseId: ULID;
    quantity: number;
    /** Score da decisão (0-1). */
    score: number;
    /** Razão da escolha (componentes do score). */
    breakdown: {
      distanceScore: number;
      stockScore: number;
      costScore: number;
      slaScore: number;
    };
  }>;
  /** Se algum SKU não pôde ser alocado (sem estoque em nenhum depósito). */
  unallocated: Array<{ skuId: string; quantity: number; reason: string }>;
}

/** Status do ciclo de fulfillment. */
export type FulfillmentStatus =
  | 'accepted'
  | 'picking'
  | 'packed'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'exception';

/** Ordem de fulfillment (ciclo completo). */
export interface FulfillmentOrder {
  id: ULID;
  /** Ordem de venda origem. */
  salesOrderId: ULID;
  status: FulfillmentStatus;
  /** SKUs e depósitos alocados. */
  items: Array<{
    skuId: string;
    quantity: number;
    warehouseId: ULID;
    lockId?: ULID;
  }>;
  /** Endereço de entrega. */
  deliveryLocation: { lat: number; lng: number };
  /** Transporte associado (externo ou interno). */
  shipmentId?: ULID;
  createdAt: number;
  updatedAt: number;
}

/** Decide alocação multi-depósito por Zen. */
export async function decideAllocation(
  storage: StoragePort,
  params: AllocationParams,
): Promise<AllocationDecision>;

/** Cria ordem de fulfillment com reservas (ASSET:LOCK). */
export async function createFulfillmentOrder(
  storage: StoragePort,
  params: {
    salesOrderId: ULID;
    allocation: AllocationDecision;
    deliveryLocation: { lat: number; lng: number };
  },
): Promise<FulfillmentOrder>;

/** Avança status do fulfillment. */
export async function advanceFulfillment(
  storage: StoragePort,
  orderId: ULID,
  newStatus: FulfillmentStatus,
): Promise<FulfillmentOrder>;

/** Compensa perna com falha (re-alocar ou cancelar). */
export async function compensateFulfillment(
  storage: StoragePort,
  orderId: ULID,
  reason: string,
  /** Se deve tentar realocar em outro depósito. */
  reallocate?: boolean,
): Promise<FulfillmentOrder>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B6](../docs/mecanica-de-telas.md) — validado no mockup B6: ciclo aguardando→alocado→em rota→entregue com o mesmo vocabulário de saga do §B2; **"sem entregadores disponíveis" é estado de primeira classe** que bloqueia a ação de alocar (disponibilidade honesta) — o contrato de alocação precisa devolver essa condição distinguível, não erro genérico.
- [caderno-3-sdk/25-logistica-reference-spec.md](../docs/caderno-3-sdk/25-logistica-reference-spec.md) §2 — fulfillment, alocação multi-depósito, ciclo, compensação
- [[asset-lock]] — reserva de estoque por LOCK no local eleito
- [[saga]] — compensação via saga (re-alocar ou cancelar com estorno)
- [[spec-workflow]] — ciclo de fulfillment como SPEC:WORKFLOW

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/25-logistica-reference-spec.md` §2
- **[READ]** `docs/conceitos/dispatch-saga.md` — saga de dispatch (padrão de compensação)
- **[READ]** `packages/logistica/src/wms.ts` (T-LOG-01) — WmsOperation
- **[READ]** `packages/erp/src/inventory.ts` (T-ERP-02) — InventoryBalance
- **[READ]** `tasks/T-604.md` — Zen Engine (decisão de alocação)
- **[CREATE]** `packages/logistica/src/fulfillment.ts` — funções acima
- **[CREATE]** `packages/logistica/tests/fulfillment.test.ts`
- **[UPDATE]** `packages/logistica/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/logistica test`.
- [x] **Fora de Escopo:** Integração real com transportadora, cálculo de distância real (T-MAP-02).

Casos de teste (numerados):
1. `decideAllocation` com 1 SKU, 2 depósitos com estoque → elege o de menor distância.
2. `decideAllocation` com weights `{ distance: 0, cost: 1 }` → elege o de menor custo, ignorando distância.
3. `decideAllocation` com SKU sem estoque em nenhum depósito → `unallocated` contém o SKU.
4. `createFulfillmentOrder` → ordem criada, locks aplicados nos depósitos eleitos.
5. `advanceFulfillment(order, 'picking')` → status: 'picking'.
6. `advanceFulfillment` com transição inválida (pular de accepted para delivered) → erro.
7. `advanceFulfillment(order, 'delivered')` → estágio final, registra entrega.
8. `compensateFulfillment` em picking → libera locks, status: 'cancelled'.
9. `compensateFulfillment` com `reallocate: true` → tenta novo depósito; se houver estoque, cria nova alocação.
10. `compensateFulfillment` com `reallocate: true` mas sem estoque alternativo → cancela com razão "no_alternative_stock".

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente o motor Zen completo — a decisão de alocação usa uma função de score ponderado (distância, estoque, custo, SLA). O upgrade para Zen engine (T-604) virá depois.
> - **NÃO** entregue sem compensar — falha em qualquer perna NUNCA resulta em estado "entregue" falso.
> - **NÃO** implemente o transporte em si — o fulfillment orquestra; o transporte é T-LOG-03 ou T-LOG-04.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Alocação parcial**: pedido com 3 SKUs, 2 alocados com sucesso e 1 sem estoque. Comportamento: todo o pedido falha (não faz sentido entregar parcial sem confirmação do cliente). `unallocated` não vazio → `createFulfillmentOrder` rejeita.
- **Compensação não é rollback**: `compensateFulfillment` emite novos fatos (liberação de lock, cancelamento), não desfaz os fatos anteriores. A linhagem mantém o histórico completo.
- **Score multi-fator**: `weights` somam 1.0 por padrão mas podem ser ajustados. Scores são normalizados 0-1 para cada fator, depois ponderados.

1. **[TDD]** Crie `packages/logistica/tests/fulfillment.test.ts` com casos 1–10.
2. Implemente `decideAllocation` com score ponderado (stub de distância via Haversine de T-MAP-01).
3. Implemente `createFulfillmentOrder` com aplicação de locks.
4. Implemente `advanceFulfillment` com validação de workflow.
5. Implemente `compensateFulfillment` (libera locks, opcionalmente re-aloca).
6. Re-exporte em `packages/logistica/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-604 (Zen Engine) está `draft`**: a decisão de alocação usa score ponderado determinístico. Quando T-604 estiver pronto, `decideAllocation` será upgrade para Zen.
> - **T-LOG-01 está `draft`**: WmsOperation e locks dependem de T-LOG-01. Interfaces provisórias usadas.
> **Status:** `draft` até T-LOG-01 e T-604 ficarem `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `decideAllocation` usa score ponderado multi-fator?
- [ ] `createFulfillmentOrder` é atômico (todos os locks ou nenhum)?
- [ ] `compensateFulfillment` libera locks com estorno?
- [ ] `compensateFulfillment` com reallocate tenta novo depósito?
- [ ] Os 10 casos de teste passam?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/logistica build
pnpm --filter @plataforma/logistica test
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
