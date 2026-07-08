---
id: T-MK-03
title: "motor de saga Tier 1 (ASSET:LOCK, ttl_policy, compensacao) + Tier 2 opcional, estado efemero"
status: draft:triaged
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-MK-01", "T-MK-02", "T-505"] # IDs de tarefas que bloqueiam esta
blocks: ["T-MK-04"] # IDs de tarefas que esta bloqueia
capacity_target: sonnet
---

# T-MK-03 · motor de saga Tier 1 (ASSET:LOCK, ttl_policy, compensacao) + Tier 2 opcional, estado efemero

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o motor de saga Tier 1 (default): checkout como composição de operações single-domain coladas
por ASSET:LOCK com TTL. Reservar/confirmar/expirar/compensar pernas. Tier 2 (2PC) opcional. Estado de saga
efêmero, nunca replicado. Fonte: `caderno-3-sdk/15-marketplace-reference-spec.md §4`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/marketplace/src/saga.ts

export type TtlPolicy = "fixed" | "per_leg" | "renewable_lease" | "risk_scaled";

export interface SagaConfig {
  /** Política de TTL para locks desta saga. */
  ttlPolicy: TtlPolicy;
  /** TTL base em ms (para fixed) ou ms por perna (per_leg). */
  ttlMs: number;
  /** Teto duro para renewable_lease (ms). */
  maxLeaseMs?: number;
}

export interface SagaLeg {
  /** Domínio do recurso (ex.: "inventory", "balance", "baas"). */
  domain: string;
  /** Ação de reserva: cria ASSET:LOCK ancorado no head do recurso. */
  reserve: () => Promise<{ lockId: string; headId: string }>;
  /** Ação de confirmação: consome o lock e materializa. */
  commit: (lockId: string) => Promise<void>;
  /** Ação de compensação (idempotente com retry). */
  compensate: (lockId: string) => Promise<void>;
}

export type SagaState =
  | { phase: "reserving"; legs: Map<string, { lockId: string; headId: string }> }
  | { phase: "committing"; completedLegs: Set<string> }
  | { phase: "compensating"; failedLeg: string }
  | { phase: "completed" }
  | { phase: "expired"; expiredLock: string };

export interface SagaOrchestrator {
  /** Executa saga: reserva todas as pernas, depois confirma ou compensa. */
  execute(config: SagaConfig, legs: SagaLeg[]): Promise<SagaResult>;
  /** Estado atual da saga (efêmero, local, NUNCA replicado). */
  getState(): SagaState;
  /** Cancela saga em andamento (dispara compensação). */
  cancel(): Promise<void>;
}

export type SagaResult =
  | { kind: "committed" }
  | { kind: "compensated"; reason: string }
  | { kind: "expired"; lockId: string; atPhase: "reserving" | "committing" };

// --- Tier 2 opcional 
---
export interface TwoPhaseCommitOrchestrator {
  prepare(legs: SagaLeg[]): Promise<boolean>; // true = all prepared
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B2](../docs/mecanica-de-telas.md) — vocabulário de saga validado no mockup (transversal B2/B3/B6): a UI renderiza pendente→pago→enviado + terminal **compensado** com explicação do que foi revertido; o motor precisa expor por etapa um estado consultável (done/current/pending/compensated) e, na compensação, **quais efeitos foram desfeitos** (ex.: "valor devolvido; item voltou ao estoque").
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §4 — Checkout como saga multidomínio (Tier 1, TTL, Tier 2, estado efêmero)
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §10 — Limites honestos (janela observável no Tier 1)
- [[saga]] — Definição canônica: anatomia, limite honesto, regra inviolável do estado
- [[credits]] — CREDITS e SPENDS são as arestas usadas nas pernas da saga
- [[item-negociavel]] — Classes de liquidação (T-MK-01)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/15-marketplace-reference-spec.md` §4, §10
- **[READ]** `docs/conceitos/saga.md` — anatomia, TTL policies, regra inviolável
- **[READ]** `packages/marketplace/src/anti-oversell.ts` — T-MK-02
- **[CREATE]** `packages/marketplace/src/saga.ts` — interfaces + SagaOrchestrator
- **[CREATE]** `packages/marketplace/src/saga-orchestrator.ts` — implementação Tier 1
- **[CREATE]** `packages/marketplace/src/ttl-policy.ts` — políticas de TTL (fixed, per_leg, renewable_lease, risk_scaled)
- **[CREATE]** `packages/marketplace/src/lock-manager.ts` — gerência de ASSET:LOCK
- **[CREATE]** `packages/marketplace/tests/saga.test.ts` — testes
- **[UPDATE]** `packages/marketplace/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro — orquestrador é lógica pura).
- [x] **Ambiente do Teste:** Node puro.
- [x] **Fora de Escopo:** Integração real com conectores BaaS (T-CN-03). 2PC real (Tier 2). UCAN (T-501).

Casos de teste (numerados):
1. Saga de 2 pernas bem-sucedida: reserva ambas → confirma ambas → `committed`.
2. Saga com falha na 2ª perna: reserva perna1, perna2 falha → compensa perna1 → `compensated`.
3. Lock expira (TTL fixed): saga não confirma a tempo → lock expira → `expired`.
4. TTL `per_leg`: cada perna tem TTL próprio; expiração de uma não afeta outras já confirmadas.
5. TTL `renewable_lease`: lock renovável até teto duro; após teto, expira sem renovação.
6. Compensação idempotente: chamar `compensate` 2x na mesma perna não causa double-compensate.
7. Estado de saga NUNCA é replicado: `getState()` retorna estado local efêmero.
8. Tier 2: `prepare()` retorna true/false; `commit()` após prepare bem-sucedido.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** replique estado de saga no grafo — estado é efêmero, local, não-replicado (§4.6: "proibido"). Só pernas finalizadas vão ao grafo.
> - **NÃO** implemente locks como nós mutáveis — ASSET:LOCK é nó append-only com TTL; expiração = lápide, não deleção.
> - **NÃO** assuma atomicidade cross-domínio como invariante de core — o Tier 1 tem janela observável (§4.1, §10.1).

### Pegadinhas conhecidas
- **Ordem das pernas importa:** reserve na ordem de dependência (ex.: primeiro autoriza pagamento, depois baixa estoque). Se a 2ª falhar, a compensação da 1ª reverte na ordem inversa.
- **TTL é adjudicado pelo validador-dono da linhagem:** não é o orquestrador que decide se o lock expirou — é o validador do recurso (dono da linhagem) contra o HLC (T-103). O orquestrador consulta, não decide.
- **Compensação é append-only:** nunca delete o lock ou o efeito — crie um nó de compensação que reverte o efeito. "Reversão = lançamento compensatório idempotente com retry" (§4.2).

1. **[TDD]** Crie `packages/marketplace/tests/saga.test.ts` com os 8 casos.
2. Implemente `packages/marketplace/src/saga.ts` com as interfaces.
3. Implemente `packages/marketplace/src/saga-orchestrator.ts`: loop reservar→confirmar/compensar.
4. Implemente `packages/marketplace/src/ttl-policy.ts` com as 4 políticas.
5. Implemente `packages/marketplace/src/lock-manager.ts` com createLock/consumeLock/expireLock.
6. Re-exporte em `packages/marketplace/src/index.ts`.
7. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] Saga Tier 1: reservar → confirmar (sucesso) ou compensar (falha)?
- [ ] 4 políticas de TTL implementadas (fixed, per_leg, renewable_lease, risk_scaled)?
- [ ] Estado de saga efêmero, nunca replicado?
- [ ] Compensação idempotente (append-only, nunca deleção)?
- [ ] Tier 2 (2PC) opcional com prepare/commit/rollback?
- [ ] `pnpm test` verde com 8 casos?

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

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
