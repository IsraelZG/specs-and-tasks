---
id: T-ERP-03
title: "contas a pagar/receber + conciliacao por external_ref"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-ERP-01", "T-CN-02"]
blocks: ["T-ERP-05"]
---

# T-ERP-03 · contas a pagar/receber + conciliacao por external_ref

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo financeiro operacional no pacote `@plataforma/erp`: contas a pagar/receber como obrigações futuras sobre `ASSET:BALANCE_STATE` com vencimento e contraparte, baixa por liquidação (intent), e conciliação bancária por `external_ref` determinístico (hash criptográfico sobre `(data_compensação, valor, identificador_da_contraparte)`) que garante idempotência mesmo com reemissão de extrato.
*(Fonte: `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §4)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/erp/src/finance.ts ---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Tipo de obrigação financeira. */
export type ObligationType = 'payable' | 'receivable';

/** Status de uma obrigação. */
export type ObligationStatus = 'pending' | 'partial' | 'settled' | 'overdue' | 'canceled';

/** Obrigação de pagar/receber (âncora em ASSET:BALANCE_STATE). */
export interface FinancialObligation {
  id: ULID;
  type: ObligationType;
  /** Valor original da obrigação. */
  amount: number;
  /** Valor já liquidado. */
  settledAmount: number;
  /** Valor remanescente. */
  remainingAmount: number;
  status: ObligationStatus;
  /** Data de vencimento (epoch ms). */
  dueDate: number;
  /** Contraparte (PROFILE). */
  counterpartyId: ULID;
  /** Referência externa opcional (NF, contrato). */
  externalRef?: string;
  /** ID do intent que originou a obrigação (venda/compra). */
  sourceIntentId: ULID;
  createdAt: number;
}

/** Lançamento de extrato bancário (chega via conector). */
export interface BankStatementEntry {
  /** Hash determinístico: SHA-256(data_compensação, valor, id_contraparte). */
  externalRefHash: string;
  /** Data de compensação (epoch ms). */
  settlementDate: number;
  amount: number;
  counterpartyId: string;
  /** Descrição/identificador no extrato (informativo, não usado no match). */
  description: string;
}

/** Resultado da conciliação. */
export interface ReconciliationResult {
  obligationId: ULID;
  entryHash: string;
  matched: boolean;
  /** Valor conciliado (pode ser parcial). */
  amount: number;
  /** Se já estava conciliada (idempotente). */
  alreadyReconciled: boolean;
}

/** Cria uma obrigação financeira (a pagar ou receber). */
export async function createObligation(
  storage: StoragePort,
  params: {
    type: ObligationType;
    amount: number;
    dueDate: number;
    counterpartyId: ULID;
    sourceIntentId: ULID;
    externalRef?: string;
  },
): Promise<FinancialObligation>;

/** Liquida uma obrigação (total ou parcial) via intent interno. */
export async function settleObligation(
  storage: StoragePort,
  obligationId: ULID,
  amount: number,
): Promise<FinancialObligation>;

/** Concilia extrato bancário com obrigações por external_ref hash. */
export async function reconcileStatement(
  storage: StoragePort,
  entries: BankStatementEntry[],
): Promise<ReconciliationResult[]>;

/** Calcula external_ref hash determinístico para um lançamento de extrato. */
export function computeExternalRefHash(
  settlementDate: number,
  amount: number,
  counterpartyId: string,
): string;

/** Lista obrigações pendentes/vencidas. */
export async function listObligations(
  storage: StoragePort,
  filters?: { type?: ObligationType; status?: ObligationStatus; counterpartyId?: ULID },
): Promise<FinancialObligation[]>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/16-erp-crm-reference-spec.md](../docs/caderno-3-sdk/16-erp-crm-reference-spec.md) §4 — financeiro operacional, contas a pagar/receber, conciliação bancária
- [[asset-balance-state]] — saldo que permanece bloqueado durante o lock
- [[conector-externo]] — conector classe C (oráculo transacional) para ingresso de extrato
- [[fato-negativo-verificavel]] — ausência de conciliação como fato rastreável

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §4
- **[READ]** `docs/conceitos/conector-externo.md` — classes de conector, external_ref como hash
- **[READ]** `tasks/T-CN-02.md` — pipeline de tradução com idempotência por external_ref
- **[CREATE]** `packages/erp/src/finance.ts` — funções acima
- **[CREATE]** `packages/erp/tests/finance.test.ts`
- **[UPDATE]** `packages/erp/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/erp test`.
- [x] **Fora de Escopo:** Conexão real com BaaS, webhooks de extrato, split de pagamento.

Casos de teste (numerados):
1. `createObligation(payable, 1000, futureDate)` → obrigação criada com `status: 'pending'`.
2. `settleObligation(id, 500)` → `settledAmount=500`, `remainingAmount=500`, `status: 'partial'`.
3. `settleObligation(id, 500)` novamente → `settledAmount=1000`, `remainingAmount=0`, `status: 'settled'`.
4. `settleObligation(id, 1)` sobre obrigação já settled → erro (não pode liquidar além).
5. `computeExternalRefHash(date, 1000, 'cp-123')` é determinístico: mesma chamada → mesmo hash.
6. `computeExternalRefHash` com parâmetros diferentes → hash diferente.
7. `reconcileStatement` com 1 entrada que match → `matched: true`, obrigação atualizada.
8. `reconcileStatement` com a MESMA entrada (reentrega) → `alreadyReconciled: true` (idempotente).
9. `reconcileStatement` com entrada sem match → `matched: false`.
10. `listObligations({ status: 'overdue' })` retorna obrigações com `dueDate < now` e `status != 'settled'`.
11. Obrigação com `dueDate` no passado e `status: 'pending'` → ao listar, status deve refletir `overdue` (ou mantido como pending com flag de vencimento).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** duplique a baixa — `reconcileStatement` é idempotente por `externalRefHash`. Mesmo hash = mesma conciliação, ignorar.
> - **NÃO** use o ID volátil do banco como referência de conciliação — use o hash determinístico.
> - **NÃO** implemente fluxo de caixa (projeção temporal) — é projeção/Zen, não desta task.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Reemissão de extrato**: conectores OFX/QIF/BaaS frequentemente reenviam o mesmo lançamento com UUID novo. O hash determinístico `SHA-256(data_compensação, valor, id_contraparte)` é a chave de idempotência — não o ID do extrato.
- **Conciliação parcial**: um extrato de $500 pode ser conciliação parcial de uma obrigação de $1000. O valor do extrato NÃO precisa casar exatamente com `remainingAmount` — pode ser menor (parcial) ou igual.
- **Liquidação vs. conciliação**: `settleObligation` é chamada internamente (pagamento confirmado no caixa). `reconcileStatement` é chamada quando o extrato chega do banco. São caminhos diferentes.

1. **[TDD]** Crie `packages/erp/tests/finance.test.ts` com casos 1–11.
2. Implemente `computeExternalRefHash` (SHA-256 determinístico).
3. Implemente `createObligation` e `settleObligation`.
4. Implemente `reconcileStatement` com idempotência por hash.
5. Implemente `listObligations` com filtros.
6. Re-exporte em `packages/erp/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-CN-02 (pipeline de tradução) está `draft`**: o formato exato do `BankStatementEntry` e o pipeline de tradução (conector → entrada padronizada) dependem de T-CN-02. A interface acima é provisória.
> - **Hash determinístico**: a fonte RAG §4.2 especifica `(data_compensação, valor, identificador_da_contraparte)`. Confirmar se precisa incluir conta bancária ou outros campos.
> **Status:** `draft` até T-CN-02 ficar `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `reconcileStatement` é idempotente (mesmo hash duas vezes = segundo é ignorado)?
- [ ] `computeExternalRefHash` é determinístico e usa SHA-256?
- [ ] Liquidação parcial funciona (3 pagamentos de 300 sobre obrigação de 1000)?
- [ ] Os 11 casos de teste passam?

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
