---
id: T-LOG-01
title: "WMS: operacoes de armazem como SPEC:WORKFLOW + enderecamento + inventario ciclico"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-WF-01", "T-ERP-02"]
blocks: ["T-LOG-02", "T-LOG-03", "T-LOG-04", "T-LOG-05"]
---

# T-LOG-01 · WMS: operacoes de armazem como SPEC:WORKFLOW + enderecamento + inventario ciclico

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de operações de armazém (WMS) no pacote `@plataforma/logistica`. Todas as operações — recebimento/conferência, endereçamento (putaway), separação (picking), embalagem (packing), expedição, inventário cíclico — são `SPEC:WORKFLOW` sobre `ASSET:INVENTORY`. Cada transição é intent, o histórico é a linhagem. Endereçamento: posição/bin é atributo do inventário (sub-linhagem por local). Onda (wave/batch): agrupar pedidos para picking conjunto é workflow que orquestra múltiplas reservas (`ASSET:LOCK`). Acuracidade é derivada da linhagem de contagens.
*(Fonte: `docs/caderno-3-sdk/25-logistica-reference-spec.md` §1)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/logistica/src/wms.ts 
---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Tipo de operação de armazém. */
export type WmsOperationType =
  | 'receiving'       // recebimento/conferência
  | 'putaway'         // endereçamento
  | 'picking'         // separação
  | 'packing'         // embalagem
  | 'shipping'        // expedição
  | 'cycle_count';    // inventário cíclico

/** Status de uma operação WMS. */
export type WmsOperationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'exception'; // divergência detectada

/** Posição/bin no armazém. */
export interface BinLocation {
  /** Código da posição (ex: "RUA-A-PRATELEIRA-3-NIVEL-2"). */
  binCode: string;
  warehouseId: ULID;
  /** Zona do armazém (ex: 'receiving', 'storage', 'shipping'). */
  zone: string;
}

/** Operação de armazém (instância de SPEC:WORKFLOW). */
export interface WmsOperation {
  id: ULID;
  type: WmsOperationType;
  status: WmsOperationStatus;
  warehouseId: ULID;
  /** SKUs e quantidades envolvidos. */
  items: Array<{
    skuId: string;
    quantity: number;
    fromBin?: string;
    toBin?: string;
  }>;
  /** ID do workflow que governa esta operação. */
  workflowSpecId: ULID;
  assignedTo?: ULID; // operador
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

/** Resultado de contagem cíclica. */
export interface CycleCountResult {
  operationId: ULID;
  skuId: string;
  binCode: string;
  /** Quantidade esperada (sistema). */
  expectedQty: number;
  /** Quantidade contada (física). */
  countedQty: number;
  /** Divergência (pode ser negativa). */
  variance: number;
  /** Se a divergência foi conciliada. */
  reconciled: boolean;
  countedAt: number;
  countedBy: ULID;
}

/** Cria operação de armazém vinculada a um SPEC:WORKFLOW. */
export async function createWmsOperation(
  storage: StoragePort,
  params: {
    type: WmsOperationType;
    warehouseId: ULID;
    items: WmsOperation['items'];
    workflowSpecId: ULID;
    assignedTo?: ULID;
  },
): Promise<WmsOperation>;

/** Avança operação para próximo status do workflow. */
export async function advanceWmsOperation(
  storage: StoragePort,
  operationId: ULID,
  newStatus: WmsOperationStatus,
): Promise<WmsOperation>;

/** Registra resultado de contagem cíclica. */
export async function recordCycleCount(
  storage: StoragePort,
  params: {
    operationId: ULID;
    skuId: string;
    binCode: string;
    expectedQty: number;
    countedQty: number;
    countedBy: ULID;
  },
): Promise<CycleCountResult>;

/** Concilia divergência de inventário (fato append-only, nunca sobrescrita). */
export async function reconcileVariance(
  storage: StoragePort,
  countResultId: ULID,
  reason: string,
): Promise<CycleCountResult>;

/** Cria onda (wave) agrupando múltiplas operações de picking. */
export async function createWave(
  storage: StoragePort,
  params: {
    warehouseId: ULID;
    pickingOperationIds: ULID[];
    /** TTL dos locks de reserva durante a onda. */
    lockTtlMs: number;
  },
): Promise<{ waveId: ULID; operationIds: ULID[] }>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/25-logistica-reference-spec.md](../docs/caderno-3-sdk/25-logistica-reference-spec.md) §1 — operações de armazém, endereçamento, acuracidade, onda
- [[spec-workflow]] — SPEC:WORKFLOW como nó SPECIFICATION para ciclo de operação
- [[asset-lock]] — reserva temporária com TTL para onda/picking
- [[linhagem-de-versoes]] — acuracidade derivada da linhagem de contagens

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/25-logistica-reference-spec.md` §1
- **[READ]** `docs/conceitos/spec-workflow.md` — definição de SPEC:WORKFLOW
- **[READ]** `docs/conceitos/asset-lock.md` — primitiva de reserva para onda
- **[READ]** `tasks/T-WF-01.md` — formato SPEC:WORKFLOW
- **[READ]** `packages/erp/src/inventory.ts` (T-ERP-02) — InventoryBalance, InventoryMovement
- **[CREATE]** `packages/logistica/src/wms.ts` — funções acima
- **[CREATE]** `packages/logistica/tests/wms.test.ts`
- **[UPDATE]** `packages/logistica/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/logistica test`.
- [x] **Fora de Escopo:** Interface de coleta com leitor de código de barras, hardware de armazém.

Casos de teste (numerados):
1. `createWmsOperation('receiving', warehouse, items)` → operação criada com `status: 'pending'`.
2. `advanceWmsOperation(op, 'in_progress')` → status atualizado; `startedAt` registrado.
3. `advanceWmsOperation(op, 'completed')` → `completedAt` registrado.
4. `advanceWmsOperation` com transição inválida (pular de `pending` para `completed`) → erro.
5. `recordCycleCount` → resultado com `expectedQty`, `countedQty`, `variance`.
6. Divergência zero (`expectedQty == countedQty`) → `variance: 0`, `reconciled` automático.
7. `reconcileVariance` com razão → `reconciled: true`, razão registrada.
8. `createWave` com 3 operações de picking → wave criada, locks aplicados com TTL.
9. Onda sem operações → erro.
10. Operação de endereçamento com `fromBin` e `toBin` → transferência interna registrada.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** sobrescreva saldo de inventário em divergência — a divergência é fato append-only, conciliado, nunca "corrigido" silenciosamente.
> - **NÃO** implemente picking físico (carrinho, scanner) — esta task é o motor de workflow, não a UI.
> - **NÃO** crie tipo de nó novo para bin/endereço — é atributo do inventário.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Onda e locks**: `createWave` aplica `ASSET:LOCK` em múltiplos SKUs simultaneamente. Se um lock falhar (estoque insuficiente), a onda inteira deve ser rejeitada, não parcialmente criada.
- **Divergência não é erro**: ciclo contável com divergência é um fato normal (esperado). A divergência é registrada como `CycleCountResult` com `variance`. A conciliação (`reconcileVariance`) ajusta o inventário via movimento append-only.
- **Workflow de armazém é SPEC:WORKFLOW**: a validação de transições de status é delegada ao motor de workflow (T-WF-01). Esta task cria a operação e delega a validação.

1. **[TDD]** Crie `packages/logistica/tests/wms.test.ts` com casos 1–10.
2. Implemente `createWmsOperation` e `advanceWmsOperation`.
3. Implemente `recordCycleCount` e `reconcileVariance`.
4. Implemente `createWave` com aplicação de locks.
5. Re-exporte em `packages/logistica/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-WF-01 e T-ERP-02 estão `draft`**: SPEC:WORKFLOW e InventoryBalance ainda não definidos. Interfaces provisórias usadas.
> - **Workflow de armazém**: quais estágios exatos cada tipo de operação WMS tem? A fonte RAG §1 lista os tipos mas não detalha os workflows individuais. Assumir fluxo linear: pending → in_progress → completed, com exception como estado de erro.
> **Status:** `draft` até T-WF-01 e T-ERP-02 ficarem `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `advanceWmsOperation` valida transições de status?
- [ ] `recordCycleCount` registra divergência sem sobrescrever saldo?
- [ ] `reconcileVariance` é append-only com razão auditável?
- [ ] `createWave` aplica locks atômicos (tudo ou nada)?
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
