---
id: T-MK-02
title: "anti-oversell por linhagem + vetor de corrida (uma unidade para uma finaliza)"
status: draft
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-MK-01", "T-108"] # IDs de tarefas que bloqueiam esta
blocks: ["T-MK-03"] # IDs de tarefas que esta bloqueia
---

# T-MK-02 · anti-oversell por linhagem + vetor de corrida (uma unidade para uma finaliza)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o mecanismo de anti-oversell por linhagem: duas compras competindo pela última unidade emitem
SPENDS sobre o mesmo head; só uma finaliza, a outra colide e é rejeitada — sem lock global, sem contador
mutável. Incluir vetor de corrida (teste de concorrência). Fonte: `caderno-3-sdk/15-marketplace-reference-spec.md §3`.

> **NOTA DO ARQUITETO:** `docs/conceitos/anti-oversell.md` não existe. O conteúdo normativo está em
> `caderno-3-sdk/15-marketplace-reference-spec.md §3` e no conceito [[serialization-por-linhagem]].
> A task referencia o RAG doc diretamente.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/marketplace/src/anti-oversell.ts

export interface InventoryHead {
  /** Head atual da linhagem do ASSET:INVENTORY. */
  headId: string;
  /** entity_id da linhagem. */
  entityId: string;
  /** Quantidade disponível no head. */
  availableQuantity: number;
}

export interface SpendAttempt {
  /** ID do intent de compra (CONTENT:INTENT). */
  intentId: string;
  /** Head do inventário que se pretende consumir. */
  targetHead: string;
  /** Quantidade desejada. */
  quantity: number;
}

export type SpendResult =
  | { kind: "committed"; newHeadId: string }
  | { kind: "collision"; conflictingIntentId: string }
  | { kind: "insufficient"; available: number; requested: number };

export interface AntiOversellGuard {
  /** Tenta consumir unidades do inventário.
   *  Se duas chamadas concorrentes usam o mesmo head, só uma vence;
   *  a outra detecta colisão (head já foi consumido). */
  attemptSpend(attempt: SpendAttempt, currentHead: InventoryHead): SpendResult;
  /** Verifica se head ainda é válido (não foi consumido por intent concorrente). */
  isHeadValid(headId: string): boolean;
}

export interface ConcurrencyTestVector {
  /** Duas compras simultâneas pela última unidade. */
  runRaceConditionTest(
    inventory: InventoryHead,
    intent1: SpendAttempt,
    intent2: SpendAttempt
  ): { winner: string; loser: string };
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §3 — Estoque, escassez e anti-oversell
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §10 — Limite honesto: anti-oversell estrutural vale por linhagem; multi-emissor é saga
- [[item-negociavel]] — Bem escasso vs. digital
- [[credits]] — SPENDS ancora no head; é o mecanismo de serialização

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/15-marketplace-reference-spec.md` §3, §10
- **[READ]** `packages/marketplace/src/specs.ts` — LiquidationClass, scarce (T-MK-01)
- **[CREATE]** `packages/marketplace/src/anti-oversell.ts` — interfaces + AntiOversellGuard + ConcurrencyTestVector
- **[CREATE]** `packages/marketplace/tests/anti-oversell.test.ts` — testes de unidade + corrida
- **[UPDATE]** `packages/marketplace/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro — lógica determinística).
- [x] **Ambiente do Teste:** Node puro.
- [x] **Fora de Escopo:** Integração com linhagem real (T-108) — usamos stubs de head. Saga multi-emissor (T-MK-03). Checkout real.

Casos de teste (numerados):
1. `attemptSpend(intent1, head)` com 1 unidade disponível → `committed`, `availableQuantity` → 0.
2. `attemptSpend(intent2, head)` sobre mesmo head JÁ consumido → `collision`.
3. `attemptSpend(intent, head)` com quantidade > disponível → `insufficient`.
4. Vetor de corrida: duas chamadas simultâneas com mesma quantidade e mesmo head → exatamente uma `committed`, outra `collision`.
5. Head válido (`isHeadValid` true) vs. head consumido (`isHeadValid` false).
6. Bem digital (não-escasso): `attemptSpend` sempre `committed` sem decrementar estoque real.
7. Reserva de capacidade: duas reservas no mesmo slot temporal → uma `committed`, outra `collision`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use lock global ou contador mutável — o anti-oversell é estrutural via linhagem (§3.1: "sem lock global, sem contador mutável").
> - **NÃO** implemente saga — multi-emissor é padrão de composição (T-MK-03), não desta task.
> - **NÃO** assuma que todo item é escasso — `scarce: false` (bem digital) não decrementa estoque.

### Pegadinhas conhecidas
- **A garantia é por linhagem, não global (§3.4):** anti-oversell estrutural funciona DENTRO de uma linhagem (um emissor de estoque). Se múltiplos emissores vendem o mesmo produto, a coordenação é via saga (T-MK-03), não desta task.
- **Colisão é detecção, não prevenção:** o guard não previne a colisão — ele DETECTA quando duas intents competem pelo mesmo head. A segunda intent recebe `collision` e deve ser rejeitada/retentada com novo head.
- **Head é imutável após consumo:** uma vez que `attemptSpend` retorna `committed`, aquele head nunca mais será válido. O novo head (`newHeadId`) é o que deve ser usado na próxima operação.

1. **[TDD]** Crie `packages/marketplace/tests/anti-oversell.test.ts` com os 7 casos.
2. Implemente `packages/marketplace/src/anti-oversell.ts` com as interfaces e implementação.
3. Re-exporte em `packages/marketplace/src/index.ts`.
4. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência. Contrato derivado diretamente do caderno §3.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] Anti-oversell é estrutural (via head de linhagem), sem lock global ou contador mutável?
- [ ] Corrida pela última unidade: uma vence, outra detecta colisão?
- [ ] Bem digital (não-escasso) não decrementa estoque?
- [ ] Reserva de capacidade detecta colisão no mesmo slot?
- [ ] `pnpm test` verde com 7 casos incluindo vetor de corrida?

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
