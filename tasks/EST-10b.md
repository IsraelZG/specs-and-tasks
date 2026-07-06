---
id: EST-10b
title: "plugin-providers: fallback tiers + circuit-breaker/cooldown"
status: draft:hardened
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-10a"]
blocks: []
parent: "EST-10"
capacity_target: sonnet
---

# EST-10b · plugin-providers: fallback tiers + circuit-breaker

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-providers/`. **Filha de EST-10** (decomposta).
- **Fonte do CircuitBreaker:** `docs/_vendor/OmniRoute/src/shared/utils/circuitBreaker.ts` (MIT) —
  adaptar para in-memory (SEM persistência DB, SEM `domainState.js`).
- **Pacote compartilhado com EST-10a e EST-10c** — mesmo `package.json` e `tsconfig.json` (já criados em EST-10a).
- **Package name:** `@plataforma/plugin-providers` *(RFC-018 §3, G1)*
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz)
- **Test Runner:** `vitest`
- **Capacidade-alvo:** sonnet (state machine com edge cases de timing, fallback multi-provider, sem novidade algorítmica)

## 1. Objetivo
Implementar fallback em tiers (lista ordenada de providers) + CircuitBreaker por provider (4 estados,
per-kind thresholds, adaptive backoff, cooldown). Provider que falha N vezes entra em cooldown; próximo
do mesmo tier assume (RFC-018 §C1: fallback em tiers + scoring multi-fator). O CircuitBreaker é
adaptado do OmniRoute (MIT), simplificado para in-memory e exposto como `canRequest/recordSuccess/recordFailure`
em vez do `execute(fn)` do original (o chamador gerencia o dispatch, o breaker só responde se pode
tentar).

### Contratos (derivados de OmniRoute circuitBreaker.ts + RFC-018 §C1)

```ts
// --- packages/plugin-providers/src/types.ts

/** Categorias de falha para thresholds diferenciados (derivado de OmniRoute classify429.ts). */
export type FailureKind = 'rate_limit' | 'timeout' | 'server_error' | 'auth_error';

/** 4 estados do CircuitBreaker (OmniRoute STATE const, linhas 50-55). */
export type CircuitState = 'CLOSED' | 'DEGRADED' | 'OPEN' | 'HALF_OPEN';

/**
 * Tier de fallback: lista ordenada de providers.
 * (derivado de RFC-018 §C1: "Fallback em tiers + scoring multi-fator")
 */
export interface FallbackTier {
  /** Nome lógico do tier, ex.: 'haiku' | 'sonnet' | 'opus' (mesmo do roster). */
  name: string;
  /** Providers ordenados por prioridade (key de PROVIDERS — EST-10a). */
  providers: string[];
}

export interface CircuitBreakerOptions {
  /** Máx. falhas antes de OPEN. Default: 5 (OmniRoute L137). */
  failureThreshold?: number;
  /** Tempo de cooldown em ms. Default: 30000 (OmniRoute L138). */
  resetTimeout?: number;
  /** Requests permitidos em HALF_OPEN. Default: 1 (OmniRoute L139). */
  halfOpenRequests?: number;
  /**
   * Threshold por tipo de falha.
   * Se FailureKind não listado, usa failureThreshold geral.
   * (OmniRoute cooldownByKind + kindThresholds, L75-81)
   */
  kindThresholds?: Partial<Record<FailureKind, number>>;
  /**
   * Limiar de degradação — falhas antes de virar DEGRADED.
   * Default: 60% de failureThreshold (OmniRoute L152-153).
   */
  degradationThreshold?: number;
  /** Callback de transição de estado. */
  onStateChange?: (name: string, oldState: CircuitState, newState: CircuitState) => void;
}

// --- packages/plugin-providers/src/fallback.ts

/**
 * CircuitBreaker — state machine com 4 estados.
 * Adaptado de OmniRoute (in-memory, sem DB, sem execute()).
 * Estados: CLOSED → DEGRADED → OPEN → HALF_OPEN → CLOSED/OPEN
 * (OmniRoute STATE L50-55, _transition L350+)
 */
export class CircuitBreaker {
  constructor(name: string, options?: CircuitBreakerOptions);

  /** Provider pode receber request? (OmniRoute canExecute, L277-283) */
  canRequest(): boolean;

  /** Registra sucesso — reset gradual (OmniRoute _onSuccess, L320-343). */
  recordSuccess(): void;

  /** Registra falha — opcional FailureKind (OmniRoute _onFailure, L346+). */
  recordFailure(errorKind?: FailureKind): void;

  /** Estado atual. */
  getState(): CircuitState;

  /** Reset manual (OmniRoute reset, L307-316). */
  reset(): void;

  /** ms restantes até tentativa HALF_OPEN (OmniRoute getRetryAfterMs, L301-305). */
  getRetryAfterMs(): number;
}

/**
 * Seleciona o primeiro provider do tier que pode receber request.
 * Pula providers em cooldown (canRequest()=false) e os do failedSet.
 * Se todos falham, retorna null.
 * (derivado de RFC-018 §C1: fallback ordenado)
 */
export function selectProvider(
  tier: FallbackTier,
  breakerMap: Map<string, CircuitBreaker>,
  failedSet: Set<string>
): string | null;
```

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (C1 — fallback em tiers + scoring multi-fator) — decisão arquitetural.
- [x] `docs/_vendor/OmniRoute/src/shared/utils/circuitBreaker.ts` — fonte do CircuitBreaker (STATE, canExecute, _onSuccess, _onFailure, reset, getStatus).
- [x] `docs/_vendor/OmniRoute/src/shared/utils/classify429.ts` — FailureKind original (rate_limit, quota_exhausted, transient) — adaptado para domínio de providers HTTP.
- [x] `docs/_vendor/OmniRoute/src/types/provider.ts` — `ModelCooldownErrorPayload` — contrato de erro para cooldown.
- [x] `EST-10a` (`draft:hardened`) — `PROVIDERS` map e `resolveModel()` — as strings em `FallbackTier.providers` são chaves de `PROVIDERS`.
- [x] `docs/adr/0008-agent-adapter-in-process.md` Decisão E — gating de erros de API para classificar FailureKind.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-providers/src/types.ts` — EST-10a já criou? Se existir, adicione `FailureKind`, `CircuitState`, `FallbackTier`, `CircuitBreakerOptions` (se não existir, os tipos de EST-10a estão em `registry.ts`).
- **[CREATE]** `packages/plugin-providers/src/fallback.ts` — `CircuitBreaker` class + `selectProvider()`
- **[CREATE]** `packages/plugin-providers/tests/fallback.test.ts` — 8 casos (vitest)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** vitest (Node puro).
- [x] **Ambiente do Teste:** Node 22, sem mock de módulo externo (CircuitBreaker é autossuficiente).
- [x] **Fora de Escopo:** Integração com EST-10c (scoring/telemetry), resiliência a arquivos de configuração externos, persistência DB.

**Casos de teste (enumerados):**
1. CircuitBreaker CLOSED → N falhas (failureThreshold) → OPEN; `canRequest()` devolve `false`.
2. CircuitBreaker OPEN → espera resetTimeout → HALF_OPEN; `canRequest()` devolve `true`.
3. CircuitBreaker HALF_OPEN → sucesso → CLOSED; `canRequest()` devolve `true`.
4. CircuitBreaker HALF_OPEN → falha → OPEN novamente; backoff adaptativo (resetTimeout escalado).
5. CircuitBreaker DEGRADED: falhas > degradationThreshold mas < failureThreshold → state = 'DEGRADED' e `canRequest()` devolve `true`.
6. `selectProvider` com 2 providers no tier: primeiro em cooldown (OPEN) → segundo assume; retorna segundo.
7. `recordFailure` com `FailureKind` específico → `kindThresholds` diferente do geral é respeitado.
8. `selectProvider` com todos providers em cooldown OU em `failedSet` → retorna `null`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** copie DB persistence do OmniRoute (`domainState.js`, `_persistToDb`, `_restoreFromDb`) — in-memory only.
> - **NÃO** implemente `execute(fn)` do OmniRoute — o chamador gerencia o dispatch; o breaker só responde `canRequest`.
> - **NÃO** adicione dependências externas — CircuitBreaker é puro TS sem lib.
> - **NÃO** modifique `types.ts` se EST-10a já criou — adicione os tipos novos ao mesmo arquivo.
> - **NÃO** acople ao EST-10c (scoring/telemetry) — é filha separada.

### Pegadinhas conhecidas
- **OmniRoute `_refreshOpenState()`** (linha não mostrada no trecho lido, mas usada em `canExecute`) —
  em HALF_OPEN, o estado só refresca após `resetTimeout` desde a última transição para OPEN.
  Implemente refresh baseado em timestamp, igual ao original.
- **kindThresholds vs failureThreshold:** o OmniRoute usa `kindFailureCounts` separado do
  `failureCount` geral (L127). O threshold por-kind é adicional — se o count do kind específico
  estoura o threshold dele, o breaker abre mesmo se o `failureCount` geral está abaixo.
- **`failedSet` em `selectProvider`:** é o conjunto de providers que JÁ falharam nesta chamada
  (evita tentar o mesmo provider duas vezes no mesmo dispatch se ele aparece em tiers múltiplos).
  Não confundir com o estado do CircuitBreaker — são fontes ortogonais.
- **DEGRADED:** é um warning state, não bloqueia requests (OmniRoute L279: `canExecute` retorna
  `true` também para DEGRADED). A diferença é apenas informacional.

1. **[TDD]** Crie `tests/fallback.test.ts` com casos 1–8.
2. Crie `src/fallback.ts` — `CircuitBreaker` class seguindo o OmniRoute, simplificado.
3. Crie `selectProvider()` — itera `tier.providers`, checa `breakerMap` e `failedSet`.
4. Adicione tipos a `src/types.ts` (ou crie se não existir).
5. Rode build + test + lint (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Todas as decisões de desenho DERIVADAS de fonte (CITE OU ESCALE):**
> - `CircuitState`, `CircuitBreaker`, transições ← OmniRoute `circuitBreaker.ts` STATE (L50-55),
>   `canExecute` (L277-283), `_onSuccess` (L320-343), `_onFailure` (L346+), `reset` (L307-316)
> - `FailureKind` ← adaptado de OmniRoute `classify429.ts`: `rate_limit`, `quota_exhausted → timeout`,
>   `transient → server_error`, + `auth_error` (do domínio HTTP)
> - `FallbackTier` + `selectProvider` ← RFC-018 §C1 (fallback em tiers)
> - `CircuitBreakerOptions` ← OmniRoute `CircuitBreakerOptions` interface (L69-96), defaults (L137-155)
> - In-memory only (sem DB) ← §0 da task (explícito)
> - `kindThresholds` ← OmniRoute `kindThresholds` (L81) + `kindFailureCounts` (L127)
> - `degradationThreshold` ← OmniRoute L86-87, default 60%
> - `onStateChange` ← OmniRoute `onStateChange` (L73)
> - `reset()` + `getRetryAfterMs()` ← OmniRoute `reset` (L307) + `getRetryAfterMs`/`timeUntilReset` (L301-305)
>
> **Decisões em aberto:** nenhuma. Todo contrato deriva do OmniRoute + RFC-018. A adaptação
> (in-memory, sem `execute()`) é explícita no escopo.
>
> **Dependências:** EST-10a (`draft:hardened`) — `PROVIDERS` map + tipagem definidos. EST-10b
> só consome as chaves do map (strings), não a implementação de `resolveModel`.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] CircuitBreaker com 4 estados (CLOSED/DEGRADED/OPEN/HALF_OPEN)?
- [ ] `canRequest()` respeita cooldown + HALF_OPEN probe limit?
- [ ] `recordFailure` com `FailureKind` opcional e kind thresholds?
- [ ] `selectProvider` pula providers em cooldown e retorna primeiro disponível?
- [ ] Testes 1–8 verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + test + lint
> (todos Exit Code 0) na Seção 8. Lint incluído desde 2026-07-06 após 3 reworks consecutivos por
> regressão (T-807, EST-02b, EST-02c).

### Checklist do Reviewer
- [ ] Contratos seguem o OmniRoute (não inventa abstração nova)?
- [ ] Sem persistência DB (in-memory only)?
- [ ] Sem dependências externas?
- [ ] `selectProvider` não modifica `breakerMap` ou `failedSet` (efeito colateral zero)?
- [ ] `pnpm build + test + lint` verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T17:53]** - *deepseek* - `[Triado]`: triado — fallback tiers + circuit-breaker, capacity=sonnet, depende de EST-10a, decisoes fechadas no OmniRoute + RFC-018
- **[2026-07-06T17:53]** - *deepseek* - `[Endurecido]`: endureceu spec — CircuitBreaker derivado de OmniRoute + selectProvider, 8 casos de teste, gate build+test+lint, capacity=sonnet
