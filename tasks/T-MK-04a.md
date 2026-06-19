---
id: T-MK-04a
title: "SPENDS: dedução atômica de saldo com referência causal"
status: draft
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-MK-01", "T-MK-03", "T-605"]
blocks: ["T-MK-04b"]
parent: "T-MK-04"
---

# T-MK-04a · SPENDS: dedução atômica de saldo com referência causal

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Monorepo:** Turborepo
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o verbo SPENDS no pacote `@plataforma/marketplace`: cria aresta SPENDS do pagador para o head do `ASSET:BALANCE_STATE`, valida saldo suficiente (via invariante T1 do Zen Engine), deduz atomicamente em transação SQL
*(extraído de T-MK-04 §1; `caderno-3-sdk/15-marketplace-reference-spec.md` §5)*.

### Contratos exatos
```ts
// --- packages/marketplace/src/spends.ts ---
import { StoragePort } from '@plataforma/protocol'; // T-004
import { ULID } from '@plataforma/core'; // T-102

export interface SpendInput {
  payerEntityId: ULID;       // entity_id do ASSET:BALANCE_STATE
  amount: number;             // em centavos
  currency: string;
  causalRef: ULID;           // head anterior (serialização por linhagem)
}

export interface SpendResult {
  newHeadId: ULID;
  previousBalance: number;
  newBalance: number;
}

/** Cria aresta SPENDS → head do BALANCE_STATE. Valida saldo ≥ amount.
 *  Zen Engine T-604 verifica invariante: saldo nunca fica negativo. */
export function createSpend(storage: StoragePort, input: SpendInput): Promise<SpendResult>;

/** Verifica saldo disponível para entity_id. */
export function getBalance(storage: StoragePort, entityId: ULID): Promise<number>;
```
- `createSpend`: carga `ASSET:BALANCE_STATE` pelo head, valida `balance >= amount`, cria aresta `SPENDS` com `newHeadId`, atualiza `entity_heads`.
- Anti-oversell: serialização por linhagem (`causalRef`) + transação SQL previne double-spend.

## 2. Contexto RAG
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) (§5)
- [T-MK-01 · SPECs base](./T-MK-01.md)
- [T-MK-03 · Saga engine](./T-MK-03.md)
- [T-605 · Fluxo intent](./T-605.md)

## 3. Escopo de Arquivos
- **[READ]** `packages/marketplace/src/specs.ts` (T-MK-01)
- **[READ]** `packages/core/src/signature.ts` (T-107)
- **[CREATE]** `packages/marketplace/src/spends.ts`
- **[CREATE]** `packages/marketplace/tests/spends.test.ts`

## 4. Estratégia de Testes
- [x] **Framework:** Vitest + `better-sqlite3` `:memory:`.

Casos de teste:
1. Saldo 1000, SPENDS 300 → `newBalance = 700`, head atualizado.
2. Saldo 100, SPENDS 200 → rejeitado (saldo insuficiente).
3. Double-spend: 2 SPENDS concorrentes com mesmo `causalRef` → segunda rejeitada.
4. `getBalance` retorna saldo correto após multiple SPENDS.
5. Saldo exato (100, SPENDS 100) → `newBalance = 0`, válido.
6. `currency` divergente → rejeitado (moeda não confere).

## 5. Instruções de Execução
1. Escreva testes com SQLite populado com BALANCE_STATE.
2. Implemente `createSpend` com validação de saldo + transação.
3. Implemente `getBalance`.
4. Re-exporte. Rode build + test.

## 6. Feedback de Especificação
- *(Nenhuma pendência)*

## 7. DoD & Reviewer Checklist

### Gate de Evidência
```bash
pnpm --filter @plataforma/marketplace build
pnpm --filter @plataforma/marketplace test
```

### Checklist
- [ ] SPENDS com saldo suficiente → head atualizado?
- [ ] Saldo insuficiente → rejeitado?
- [ ] Anti-oversell (causalRef) previne double-spend?
- [ ] 6 casos de teste passando?
- [ ] `pnpm --filter @plataforma/marketplace build` e `test` verdes?
