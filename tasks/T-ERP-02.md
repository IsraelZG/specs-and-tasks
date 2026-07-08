---
id: T-ERP-02
title: "estoque multi-deposito + custeio como projecao + reserva por ASSET:LOCK"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-ERP-01", "T-108"]
blocks: ["T-ERP-05", "T-LOG-01"]
capacity_target: sonnet
---

# T-ERP-02 · estoque multi-deposito + custeio como projecao + reserva por ASSET:LOCK

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de estoque multi-depósito no pacote `@plataforma/erp`, modelando inventário como `ASSET:INVENTORY` por SKU por depósito (múltiplos locais = múltiplas linhagens), custeio como projeção/Zen derivada da linhagem de entradas (custo médio/PEPS), e reserva de estoque via `ASSET:LOCK` com TTL. O módulo disponibiliza o cálculo de `available = on_hand - locks_com_ttl_vigente` que resolve ghost reservations sem depender de CRON central.
*(Fonte: `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §3, `docs/conceitos/asset-lock.md`)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/erp/src/inventory.ts 
---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Identificador de SKU (item negociável). */
export type SkuId = string;

/** Identificador de depósito/local. */
export type WarehouseId = string;

/** Saldo de inventário: ASSET:INVENTORY por SKU por depósito. */
export interface InventoryBalance {
  skuId: SkuId;
  warehouseId: WarehouseId;
  /** Quantidade em mãos (on_hand = soma de entradas - saídas confirmadas). */
  onHand: number;
  /** Quantidade reservada (locks ativos com TTL vigente). */
  reserved: number;
  /** Disponível = on_hand - reserved (TTL vencido tratado como disponível na leitura). */
  available: number;
}

/** Método de custeio suportado. */
export type CostingMethod = 'average' | 'fifo';

/** Registro de movimentação de inventário (entrada/saída). */
export interface InventoryMovement {
  id: ULID;
  skuId: SkuId;
  warehouseId: WarehouseId;
  quantity: number; // positivo = entrada, negativo = saída
  unitCost: number;
  timestamp: number; // HLCTimestamp
  /** ID do intent que gerou esta movimentação (venda/compra/transferência). */
  intentId: ULID;
}

/** Resultado do custeio por projeção. */
export interface CostProjection {
  skuId: SkuId;
  warehouseId: WarehouseId;
  method: CostingMethod;
  unitCost: number;
  totalCost: number;
  /** Janela de movimentações consideradas. */
  movementsConsidered: number;
}

/** Calcula saldo atual de inventário considerando locks com TTL vigente. */
export async function getInventoryBalance(
  storage: StoragePort,
  skuId: SkuId,
  warehouseId: WarehouseId,
): Promise<InventoryBalance>;

/** Projeta custo (médio ou PEPS) a partir da linhagem de entradas. */
export async function projectCost(
  storage: StoragePort,
  skuId: SkuId,
  warehouseId: WarehouseId,
  method: CostingMethod,
): Promise<CostProjection>;

/** Lista todos os SKUs em um depósito com seus saldos. */
export async function listInventory(
  storage: StoragePort,
  warehouseId: WarehouseId,
): Promise<InventoryBalance[]>;

/** Registra uma movimentação de inventário (append-only). */
export async function recordMovement(
  storage: StoragePort,
  movement: Omit<InventoryMovement, 'id'>,
): Promise<InventoryMovement>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B3](../docs/mecanica-de-telas.md) — validado no mockup B3: o `ASSET:LOCK` de reserva tem **3 estados visuais** (livre / reservado com TTL "até X" / **expirado** com alerta "estoque deveria ser liberado") — o contrato precisa expor `lockExpiresAt` consultável para a UI distinguir reserva ativa de expirada; recálculo de projeção é estado transitório que não bloqueia a listagem.
- [caderno-3-sdk/16-erp-crm-reference-spec.md](../docs/caderno-3-sdk/16-erp-crm-reference-spec.md) §3 — estoque, movimentação, custeio como projeção, reserva por LOCK
- [[asset-lock]] — primitiva de reserva temporária com TTL, ancora no head via `SPENDS`
- [[projecao-analitica]] — projeções materializadas incrementais (aplica-se ao custeio)
- [[linhagem-de-versoes]] — linhagem de entradas como fonte do custeio

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §3
- **[READ]** `docs/conceitos/asset-lock.md` — semântica de reserva/expiração
- **[READ]** `docs/conceitos/projecao-analitica.md` — padrão de projeção analítica
- **[READ]** `packages/core/src/lineage.ts` (T-108) — `getLineage`, `getHead` para navegar linhagem de inventário
- **[CREATE]** `packages/erp/src/inventory.ts` — funções acima
- **[CREATE]** `packages/erp/tests/inventory.test.ts`
- **[UPDATE]** `packages/erp/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/erp test`.
- [x] **Fora de Escopo:** Integração com grafo real (substituir por stub de StoragePort), locks reais via intent-hub.

Casos de teste (numerados):
1. `getInventoryBalance` com inventário vazio → `{ onHand: 0, reserved: 0, available: 0 }`.
2. `recordMovement` de entrada (+10 un. a $5) → `onHand=10`, `available=10`.
3. `recordMovement` de saída (-3 un.) → `onHand=7`.
4. Com lock ativo de 2 un. (TTL futuro) → `available = onHand - 2`.
5. Com lock expirado (TTL passado) → `available = onHand` (ghost reservation ignorada).
6. `projectCost('average')` após 2 entradas (10 un. $5 + 10 un. $10) → `unitCost = 7.50`.
7. `projectCost('fifo')` após as mesmas entradas → `unitCost = 5.00` (primeiro lote).
8. `listInventory` retorna todos os SKUs de um depósito.
9. Transferência entre depósitos (saída de A, entrada em B) — ambas as pernas registradas como movimentos.
10. `recordMovement` com quantidade zero → erro de validação.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** mantenha campo de custo mutável — custeio é projeção sobre a linhagem, nunca sobrescrito.
> - **NÃO** implemente a saga de transferência entre depósitos completa (duas pernas atômicas) — isso é T-108 + saga engine. Registre as duas pernas como movimentos independentes.
> - **NÃO** assuma que todo lock tem TTL em milissegundos — leia `ttl` como campo do nó `ASSET:LOCK`.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Ghost reservation**: um lock com TTL vencido ainda existe no storage mas NÃO deve reduzir `available`. O cálculo é `available = on_hand - sum(locks WHERE ttl > now)`. Não espere que o lock seja deletado — a expiração é lógica, não física (tombstones são assíncronos, T-109).
- **Custeio médio não é (soma custos / soma quantidades) simples**: cada entrada tem seu custo; o custo médio é a média ponderada móvel. Após entrada: `novoCustoMedio = ((onHandAntes * custoMedioAntes) + (qtdEntrada * custoUnitario)) / (onHandAntes + qtdEntrada)`. Saída NÃO altera o custo médio.
- **PEPS**: a saída consome primeiro as entradas mais antigas. Após múltiplas saídas, o custo do estoque remanescente é dos lotes mais recentes. A projeção navega a linhagem em ordem cronológica.

1. **[TDD]** Crie `packages/erp/tests/inventory.test.ts` com casos 1–10 usando stub de StoragePort.
2. Implemente `recordMovement` (append-only, valida quantidade ≠ 0).
3. Implemente `getInventoryBalance` com a fórmula `available = onHand - locksComTtlVigente`.
4. Implemente `projectCost` (média ponderada móvel e PEPS via navegação de linhagem).
5. Implemente `listInventory`.
6. Re-exporte em `packages/erp/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-108 (linhagem) está `draft`**: `getLineage`/`getHead` são necessários para navegar a linhagem de inventário. As funções acima usam `StoragePort` genérico com queries diretas como fallback enquanto T-108 não está pronto.
> - **Lock por unidade vs. quantidade**: a fonte (asset-lock.md) define lock ancorado no head via `SPENDS`. Não está claro se um lock reserva 1 unidade ou N unidades (payload do lock). Assumindo que o payload contém `quantity`.
> **Status:** `draft` até T-108 ficar `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `getInventoryBalance` ignora locks com TTL vencido (ghost reservation)?
- [ ] `projectCost` implementa média ponderada móvel e PEPS corretamente?
- [ ] `recordMovement` é append-only (não sobrescreve saldo)?
- [ ] Os 10 casos de teste passam?

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
