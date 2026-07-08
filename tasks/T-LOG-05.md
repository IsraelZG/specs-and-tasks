---
id: T-LOG-05
title: "logistica reversa + prova de entrega/disputa (escrow) + reentrada de estoque + vetores"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-LOG-01", "T-LOG-02", "T-LOG-03", "T-LOG-04", "T-109"]
blocks: []
capacity_target: sonnet
---

# T-LOG-05 · logistica reversa + prova de entrega/disputa (escrow) + reentrada de estoque + vetores

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de logística reversa e disputas no pacote `@plataforma/logistica`: devolução, troca e recall como `SPEC:WORKFLOW` próprios (solicitado → autorizado → coletado → recebido → inspecionado → estornado/reenviado). Reentrada de estoque como `CREDITS` em `ASSET:INVENTORY`. Disputa ("não chegou"/"chegou danificado") como workflow que suspende liberação do valor em escrow até resolução. Prova de entrega como `CONTENT` (foto, assinatura, geolocalização, código). Inclui testes de vetor (edge cases de disputa e reversa).
*(Fonte: `docs/caderno-3-sdk/25-logistica-reference-spec.md` §5-6)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/logistica/src/reverse-logistics.ts 
---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Tipo de logística reversa. */
export type ReverseType = 'return' | 'exchange' | 'recall';

/** Status da logística reversa. */
export type ReverseStatus =
  | 'requested'
  | 'authorized'
  | 'collected'
  | 'received'
  | 'inspected'
  | 'refunded'
  | 'resent'       // troca reenviada
  | 'rejected'     // devolução recusada
  | 'cancelled';

/** Status da disputa. */
export type DisputeStatus =
  | 'opened'
  | 'evidence_submitted'
  | 'under_review'
  | 'resolved_refund'
  | 'resolved_resent'
  | 'resolved_rejected';

/** Ordem de logística reversa. */
export interface ReverseOrder {
  id: ULID;
  /** Ordem de fulfillment original. */
  originalFulfillmentId: ULID;
  type: ReverseType;
  status: ReverseStatus;
  /** Itens a devolver/trocar. */
  items: Array<{ skuId: string; quantity: number }>;
  /** Motivo da devolução. */
  reason: string;
  /** Método de coleta (transportadora ou entrega pelo cliente). */
  collectionMethod: 'carrier_pickup' | 'customer_dropoff';
  /** Se houve reentrada de estoque. */
  stockReentered: boolean;
  /** ID do movimento de reentrada (CREDITS). */
  reentryMovementId?: ULID;
  /** ID do estorno financeiro. */
  refundId?: ULID;
  createdAt: number;
  updatedAt: number;
}

/** Prova de entrega (CONTENT). */
export interface DeliveryProof {
  id: ULID;
  dispatchOrderId: ULID;
  /** URL da foto. */
  photoUrl?: string;
  /** Assinatura (base64 ou URL). */
  signature?: string;
  /** Geolocalização no momento da entrega. */
  location: { lat: number; lng: number };
  /** Código de confirmação (OTP). */
  confirmationCode?: string;
  /** Se a prova está dentro do polígono de entrega esperado. */
  geofenceValid: boolean;
  timestamp: number;
}

/** Disputa de entrega. */
export interface DeliveryDispute {
  id: ULID;
  dispatchOrderId: ULID;
  /** Quem abriu (comprador ou vendedor). */
  openedBy: ULID;
  status: DisputeStatus;
  /** Tipo de disputa. */
  reason: 'not_received' | 'damaged' | 'wrong_item' | 'partial_delivery' | 'other';
  description: string;
  /** Evidências do comprador. */
  buyerEvidence: Array<{ type: 'photo' | 'video' | 'text'; url: string; description: string }>;
  /** Evidências do entregador/vendedor. */
  sellerEvidence: Array<{ type: 'photo' | 'video' | 'text'; url: string; description: string }>;
  /** Resolução. */
  resolution?: {
    decision: 'refund' | 'resend' | 'reject';
    reason: string;
    decidedBy: ULID;
    decidedAt: number;
  };
  createdAt: number;
  updatedAt: number;
}

/** Cria ordem de logística reversa. */
export async function createReverseOrder(
  storage: StoragePort,
  params: {
    originalFulfillmentId: ULID;
    type: ReverseType;
    items: Array<{ skuId: string; quantity: number }>;
    reason: string;
    collectionMethod: ReverseOrder['collectionMethod'];
  },
): Promise<ReverseOrder>;

/** Avança status da reversa. */
export async function advanceReverse(
  storage: StoragePort,
  orderId: ULID,
  newStatus: ReverseStatus,
): Promise<ReverseOrder>;

/** Reentrada de estoque (CREDITS em ASSET:INVENTORY). */
export async function reenterStock(
  storage: StoragePort,
  reverseOrderId: ULID,
): Promise<ReverseOrder>;

/** Registra prova de entrega. */
export function createDeliveryProof(params: {
  dispatchOrderId: ULID;
  photoUrl?: string;
  signature?: string;
  location: { lat: number; lng: number };
  confirmationCode?: string;
  expectedDeliveryPolygon?: { vertices: Array<{ lat: number; lng: number }> };
}): Omit<DeliveryProof, 'id' | 'timestamp'>;

/** Abre disputa de entrega. */
export async function openDispute(
  storage: StoragePort,
  params: {
    dispatchOrderId: ULID;
    openedBy: ULID;
    reason: DeliveryDispute['reason'];
    description: string;
    buyerEvidence?: DeliveryDispute['buyerEvidence'];
  },
): Promise<DeliveryDispute>;

/** Submete evidência na disputa. */
export async function submitDisputeEvidence(
  storage: StoragePort,
  disputeId: ULID,
  submittedBy: ULID,
  evidence: DeliveryDispute['buyerEvidence'][0],
  side: 'buyer' | 'seller',
): Promise<DeliveryDispute>;

/** Resolve disputa (reembolso, reenvio ou rejeição). */
export async function resolveDispute(
  storage: StoragePort,
  disputeId: ULID,
  decision: 'refund' | 'resend' | 'reject',
  reason: string,
  decidedBy: ULID,
): Promise<DeliveryDispute>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B6](../docs/mecanica-de-telas.md) — validado no mockup B6: disputa é **terminal alternativo** da saga de entrega (não substitui o histórico de etapas) e o valor em escrow aparece como "retido até resolução — repasse e crédito pausados"; o contrato de escrow precisa expor esse estado de retenção consultável.
- [caderno-3-sdk/25-logistica-reference-spec.md](../docs/caderno-3-sdk/25-logistica-reference-spec.md) §5-6 — prova de entrega, disputa, logística reversa
- [[asset-lock]] — escrow suspenso durante disputa
- [[dispatch-saga]] — compensação via saga para reembolso/estorno
- [[tombstone-lapide]] — T-109, lápides para expurgo de locks expirados

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/25-logistica-reference-spec.md` §5-6
- **[READ]** `docs/conceitos/dispatch-saga.md` — saga de dispatch, compensação
- **[READ]** `docs/conceitos/asset-lock.md` — escrow e locks
- **[READ]** `packages/logistica/src/dispatch.ts` (T-LOG-04) — DispatchOrder, CourierLocationSignal
- **[READ]** `packages/logistica/src/fulfillment.ts` (T-LOG-02) — FulfillmentOrder
- **[READ]** `packages/erp/src/inventory.ts` (T-ERP-02) — InventoryBalance, recordMovement
- **[READ]** `tasks/T-109.md` — tombstones (lápides)
- **[CREATE]** `packages/logistica/src/reverse-logistics.ts` — funções acima
- **[CREATE]** `packages/logistica/tests/reverse-logistics.test.ts` — incluindo vetores
- **[UPDATE]** `packages/logistica/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/logistica test`.
- [x] **Fora de Escopo:** Integração real com gateway de pagamento (estorno financeiro), coleta física.

Casos de teste (numerados):

### Reversa
1. `createReverseOrder(fulfillment, 'return', items, 'defect', 'carrier_pickup')` → ordem criada.
2. `advanceReverse(order, 'authorized')` → status: 'authorized'.
3. `advanceReverse(order, 'collected')` → status: 'collected'.
4. `advanceReverse(order, 'received')` → status: 'received'.
5. `advanceReverse(order, 'inspected')` → status: 'inspected'.
6. `reenterStock(order)` → `stockReentered: true`, movimento de entrada criado.
7. `advanceReverse(order, 'refunded')` → `refundId` registrado.

### Prova de entrega
8. `createDeliveryProof` com `geofenceValid: true` (dentro do polígono).
9. `createDeliveryProof` com ponto fora do polígono → `geofenceValid: false`.

### Disputa
10. `openDispute(dispatch, buyer, 'not_received', 'não recebi')` → disputa aberta, `status: 'opened'`.
11. `submitDisputeEvidence(dispute, buyer, photo, 'buyer')` → evidência adicionada.
12. `submitDisputeEvidence(dispute, courier, delivery_proof, 'seller')` → evidência do vendedor.
13. `resolveDispute(dispute, 'refund', 'evidência insuficiente do vendedor', mediator)` → status: 'resolved_refund'.

### Vetores (edge cases)
14. **Reversa sem inspeção**: tentar reentrada de estoque antes de `inspected` → erro.
15. **Disputa sem evidência**: `resolveDispute` com disputa sem evidências de ambas as partes → permitido mas sinalizado.
16. **Dupla reversa**: mesma ordem de fulfillment não pode ter duas reversas abertas simultaneamente.
17. **Reversa de recall**: `type: 'recall'` → não exige `originalFulfillmentId` específico (lote inteiro).
18. **Disputa resolve para reenvio**: `resolveDispute(dispute, 'resend')` → novo fulfillment gerado.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** faça estorno financeiro real — o `refundId` é referência; o estorno é operação separada (T-ERP-03).
> - **NÃO** reentre estoque de item não inspecionado — `reenterStock` verifica `status == 'inspected'`.
> - **NÃO** permita duas reversas ativas para o mesmo fulfillment.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Prova de entrega eleva ônus, não prova absoluta**: a fonte RAG §5 diz "prova de entrega depende de cliente/entregador honesto na captura; eleva o ônus, não prova absoluta — fraude é mitigada por reputação e escrow". A disputa sempre pode ser aberta, mesmo com prova.
- **Geofencing na prova**: `geofenceValid` verifica se a coordenada da entrega cai dentro do polígono esperado (usando `isInsidePolygon` de T-MAP-01). Se `false`, isso fortalece a disputa mas não a decide automaticamente.
- **Escrow suspenso**: durante disputa, o valor em escrow (RFC-012 A.4.5) não é liberado. Esta task não implementa o escrow — apenas sinaliza que a disputa está ativa para o módulo financeiro.

1. **[TDD]** Crie `packages/logistica/tests/reverse-logistics.test.ts` com casos 1–18.
2. Implemente `createReverseOrder`, `advanceReverse`, `reenterStock`.
3. Implemente `createDeliveryProof` com validação de geofencing.
4. Implemente `openDispute`, `submitDisputeEvidence`, `resolveDispute`.
5. Re-exporte em `packages/logistica/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-LOG-04 (dispatch) e T-109 (tombstones) estão `draft`**: DispatchOrder e lápides ainda não definidos.
> - **Escrow e pagamento**: a disputa suspende escrow, mas o mecanismo de escrow está na RFC-012 A.4.5, fora do escopo deste pacote. Integração futura.
> **Status:** `draft` até T-LOG-04 e T-109 ficarem `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `createReverseOrder` valida que fulfillment original existe?
- [ ] `reenterStock` verifica `status == 'inspected'`?
- [ ] `createDeliveryProof` valida geofencing?
- [ ] `openDispute` suspende liberação de escrow (sinalização)?
- [ ] `resolveDispute` suporta refund, resend e reject?
- [ ] Os 18 casos de teste passam?

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
