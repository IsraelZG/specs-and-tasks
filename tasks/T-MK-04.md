---
id: T-MK-04
title: "SPENDS/CREDITS com split multi-destino + comissao/imposto por SPEC + multi-moeda"
status: draft
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-MK-01", "T-MK-03", "T-605"] # IDs de tarefas que bloqueiam esta
subtasks: ["T-MK-04a","T-MK-04b"]
blocks: ["T-MK-04a","T-MK-04b"] # IDs de tarefas que esta bloqueia
---

# T-MK-04 · SPENDS/CREDITS com split multi-destino + comissao/imposto por SPEC + multi-moeda

> **DECOMPOSTA** — não executar diretamente. O trabalho está nas subtarefas: T-MK-04a, T-MK-04b

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar a máquina de caixa: verbos econômicos SPENDS/CREDITS com partida dobrada interna em uma única
operação, split multi-destino (vendedor + comissão + afiliado + imposto), liquidação por SPEC, e multi-moeda
com conversão explícita. Fonte: `caderno-3-sdk/15-marketplace-reference-spec.md §5, §6`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/marketplace/src/cash-engine.ts

export interface BalanceState {
  /** entity_id da linhagem do ASSET:BALANCE_STATE. */
  entityId: string;
  /** Moeda única deste saldo. */
  currency: string;
  /** Saldo atual (em centavos/unidade mínima). */
  balance: number;
  /** Head atual. */
  headId: string;
}

export interface SplitDestination {
  /** entity_id do saldo de destino (CREDITS → entity_id). */
  targetEntityId: string;
  /** Valor a creditar (sempre ≥ 0). */
  amount: number;
  /** Motivo (ex.: "comissao_marketplace", "imposto_rede", "vendedor"). */
  reason: string;
}

export interface CashOperation {
  /** entity_id do saldo de origem (SPENDS → head). */
  sourceEntityId: string;
  /** Head atual do saldo de origem. */
  sourceHeadId: string;
  /** Valor total a debitar. */
  totalDebit: number;
  /** Destinos do split (soma deve igualar totalDebit). */
  splits: SplitDestination[];
  /** ID da intent que autoriza a operação. */
  intentId: string;
}

export type CashResult =
  | { kind: "executed"; newSourceHeadId: string; creditHeadIds: string[] }
  | { kind: "insufficient_funds"; available: number; requested: number }
  | { kind: "split_mismatch"; sum: number; expected: number }
  | { kind: "head_collision"; conflictingIntentId: string };

export interface CashEngine {
  /** Executa operação: 1 SPENDS na origem, N CREDITS nos destinos, atômico. */
  execute(op: CashOperation): CashResult;
  /** Converte moeda A→B com taxa afirmada por oráculo. */
  convert(
    source: BalanceState,
    targetCurrency: string,
    rate: number,     // taxa do oráculo
    spread: number    // spread declarado
  ): CashOperation;
  /** Calcula split automático conforme SPEC do marketplace. */
  calculateSplit(
    total: number,
    commissionPercent: number,
    affiliatePercent: number,
    taxPercent: number
  ): SplitDestination[];
}

export interface MoneyFormatter {
  /** Formata valor para exibição conforme jurisdição/locale. */
  format(amount: number, currency: string, locale: string): string;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §5 — Caixa, verbos econômicos e split (SPENDS/CREDITS, partida dobrada, split, multi-moeda)
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §6 — Liquidação externa e meios de pagamento (conversão, oráculo)
- [[credits]] — Aresta CREDITS (comutativa, entity_id) vs SPENDS (não-comutativa, head)
- [[saga]] — Cash operations são pernas da saga (T-MK-03)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/15-marketplace-reference-spec.md` §5, §6, §10
- **[READ]** `docs/conceitos/credits.md` — CREDITS vs SPENDS, comutatividade
- **[READ]** `packages/marketplace/src/saga.ts` — SagaLeg (T-MK-03)
- **[CREATE]** `packages/marketplace/src/cash-engine.ts` — interfaces + CashEngine + MoneyFormatter
- **[CREATE]** `packages/marketplace/src/cash-engine-impl.ts` — implementação
- **[CREATE]** `packages/marketplace/tests/cash-engine.test.ts` — testes
- **[UPDATE]** `packages/marketplace/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro — lógica determinística).
- [x] **Ambiente do Teste:** Node puro.
- [x] **Fora de Escopo:** Integração com BaaS/conector externo (T-CN-03). UCAN (T-501). Persistência real (T-106).

Casos de teste (numerados):
1. Débito de 100 com 2 splits (80 + 20) → origem -100, destino1 +80, destino2 +20.
2. Split com 3 destinos (comissão 10 + afiliado 5 + vendedor 85) → soma = 100.
3. `split_mismatch`: totalDebit=100, splits sum=95 → erro.
4. `insufficient_funds`: saldo=50, débito=100 → erro com available/requested.
5. `head_collision`: duas operações concorrentes no mesmo head → segunda detecta colisão.
6. `calculateSplit(1000, 10, 5, 3)` → vendedor=820, comissão=100, afiliado=50, imposto=30.
7. Conversão BRL→USD com rate=0.19, spread=0.01: usa oráculo, registra taxa no fato.
8. MoneyFormatter: `format(1990, "BRL", "pt-BR")` → "R$ 19,90".
9. Multi-moeda: operação cross-currency gera SPENDS em BRL + CREDITS em USD como pernas da saga.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use float para dinheiro — todos os valores são inteiros (centavos/unidade mínima).
> - **NÃO** crie saldo "polimoeda" — cada `ASSET:BALANCE_STATE` é denominado numa ÚNICA moeda (§5.5). Conversão é operação explícita.
> - **NÃO** absorva spread de câmbio sem rastro — a diferença entre taxa de consulta e taxa de liquidação é declarada (§6.4).

### Pegadinhas conhecidas
- **Partida dobrada em uma op só:** o SPENDS na origem e os N CREDITS nos destinos são uma ÚNICA finalização de linhagem (§5.1). Não faça duas transações separadas.
- **CREDITS → entity_id, SPENDS → head:** crédito é comutativo (aponta para linhagem estável); débito é não-comutativo (aponta para head específico). Essa assimetria é deliberada e normativa — ver [[credits]].
- **Conversão cross-moeda é perna de saga:** quando comprador (BRL) e vendedor (USD) usam moedas diferentes, a conversão é uma perna da saga junto com o lock no saldo de origem e o CREDITS no destino (§6.4). Não faça conversão solta.

1. **[TDD]** Crie `packages/marketplace/tests/cash-engine.test.ts` com os 9 casos.
2. Implemente `packages/marketplace/src/cash-engine.ts` com interfaces.
3. Implemente `packages/marketplace/src/cash-engine-impl.ts` com execute, convert, calculateSplit, MoneyFormatter.
4. Re-exporte em `packages/marketplace/src/index.ts`.
5. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] CashEngine.execute: 1 SPENDS + N CREDITS atômico em uma única operação?
- [ ] Split multi-destino validado (soma = total)?
- [ ] Insufficient funds e head collision detectados?
- [ ] Conversão cross-moeda via oráculo com taxa e spread declarados?
- [ ] MoneyFormatter formata por jurisdição/locale?
- [ ] Todos os valores em inteiros (nunca float)?
- [ ] `pnpm test` verde com 9 casos?

### Verificação automática
```bash
pnpm --filter @plataforma/marketplace build
pnpm --filter @plataforma/marketplace test
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
