---
id: T-MK-04b
title: "CREDITS: split multi-destino + comissão/imposto por SPEC + multi-moeda"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-MK-04a"]
blocks: []
parent: "T-MK-04"
---

# T-MK-04b · CREDITS: split multi-destino + comissão/imposto por SPEC + multi-moeda

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Monorepo:** Turborepo
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o verbo CREDITS no pacote `@plataforma/marketplace`: distribui valor entre múltiplos destinos (vendedor, comissão, afiliado, imposto) conforme `SPEC:LIQUIDATION`, com suporte a multi-moeda e conversão explícita
*(extraído de T-MK-04 §1; `caderno-3-sdk/15-marketplace-reference-spec.md` §6)*.

### Contratos exatos
```ts
// --- packages/marketplace/src/credits.ts 
---
import { StoragePort } from '@plataforma/protocol'; // T-004
import { ULID } from '@plataforma/core'; // T-102

export interface CreditSplit {
  destination: ULID;          // entity_id do destinatário
  amount: number;              // valor a creditar
  currency: string;
  role: string;                // 'seller' | 'commission' | 'affiliate' | 'tax'
  rateRuleId?: ULID;           // SPEC que define a alíquota
}

export interface CreditResult {
  spendHeadId: ULID;           // referência ao SPENDS (T-MK-04a)
  splits: CreditSplit[];
  splitsApplied: number;       // quantos creditados
}

/** Distribui valor de um SPENDS para múltiplos destinos.
 *  Split definido pela SPEC:LIQUIDATION referenciada na transação. */
export function createCredits(
  storage: StoragePort,
  spendHeadId: ULID,
  splits: CreditSplit[],
): Promise<CreditResult>;

/** Converte valor entre moedas usando taxa da SPEC:LIQUIDATION. */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rateSpecId: ULID,
): Promise<number>;
```
- `createCredits`: para cada `CreditSplit`, cria aresta `CREDITS → entity_id` do destinatário, atualiza `BALANCE_STATE`.
- Soma dos splits deve ser ≤ valor do SPENDS original.
- Multi-moeda: cada destinatário pode receber em moeda diferente; conversão usa taxa declarada em SPEC.

## 2. Contexto RAG
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) (§6)
- [T-MK-04a · SPENDS](./T-MK-04a.md)

## 3. Escopo de Arquivos
- **[READ]** `packages/marketplace/src/spends.ts` (T-MK-04a)
- **[READ]** `packages/core/src/signature.ts` (T-107)
- **[CREATE]** `packages/marketplace/src/credits.ts`
- **[CREATE]** `packages/marketplace/tests/credits.test.ts`

## 4. Estratégia de Testes
- [x] **Framework:** Vitest + SQLite `:memory:`.

Casos de teste:
1. SPENDS 1000 → CREDITS [seller:800, commission:200] → ambos creditados.
2. Soma dos splits > SPENDS → rejeitado.
3. Split com moeda diferente → `convertCurrency` aplicado, destinatário recebe na moeda alvo.
4. Split com `role: 'tax'` → creditado na entity do fisco (definida em SPEC).
5. SPENDS sem splits → crédito integral ao vendedor (default).
6. SPEC:LIQUIDATION ausente → erro (não pode ratear sem regra).

## 5. Instruções de Execução
1. Escreva testes com SPENDS criado via T-MK-04a.
2. Implemente `createCredits` com validação de soma + conversão.
3. Implemente `convertCurrency`.
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
- [ ] CREDITS distribui para múltiplos destinos?
- [ ] Soma splits ≤ SPENDS?
- [ ] Multi-moeda com conversão?
- [ ] 6 casos de teste passando?
- [ ] `pnpm --filter @plataforma/marketplace build` e `test` verdes?

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
