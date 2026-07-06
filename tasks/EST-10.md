---
id: EST-10
title: "plugin-providers: registry direto + fallback/circuit-breaker + scoring 9-fatores + telemetria interna (absorve EST-11)"
status: draft:decomposed
complexity: 5
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: sonnet
---

# EST-10 · plugin-providers (registry + fallback/scoring, extração OmniRoute)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-providers/`. **DECOMPOSTA** em 3 filhas (complexidade 5):
  - **EST-10a** — registry+move do ORQ-09b (capacity=haiku)
  - **EST-10b** — fallback tiers + circuit-breaker/cooldown (capacity=sonnet)
  - **EST-10c** — scoring 9-fatores + telemetry interno, ex-EST-11 (capacity=sonnet)
- Protocolo HTTP OpenAI-compatible. NÃO roda o OmniRoute como serviço. Medir na bancada (RFC-018 C3).

## 1. Objetivo
Extrair mecanismo de fallback/scoring do OmniRoute (MIT, clone local em `docs/_vendor/OmniRoute/`) para `packages/plugin-providers/`, movendo o registry direto de ORQ-09b como base. Crush/opencode migram para consumir este plugin (C4). Telemetria de custo/uso/latência é módulo interno (absorveu EST-11, RFC-018 §6.4).

## 2. Contexto RAG (derivado)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (C1-C4) + §6.4 (merge telemetry) — fonte de decisão arquitetural
- [x] `tasks/ORQ-09b.md` §1 (Contratos exatos) — `PROVIDERS` map, `resolveModel()`, `VercelAgentRunOptions` — base do registry
- [x] `tasks/ORQ-09a.md` §1 — `makeTools()`, `BASH_ALLOWLIST`, `AbortSignal` pattern
- [x] `docs/_vendor/OmniRoute/src/shared/utils/circuitBreaker.ts` — `CircuitBreaker` class (4 estados, per-kind thresholds, adaptive backoff) — fonte do fallback
- [x] `docs/_vendor/OmniRoute/src/shared/utils/costEstimator.ts` — `estimateTokens()`, `formatCost()`, `DEFAULT_PRICING` — referência p/ scoring
- [x] `docs/_vendor/OmniRoute/src/types/provider.ts` — `ModelCooldownErrorPayload` — contrato de erro p/ cooldown
- [x] `docs/_vendor/OmniRoute/src/shared/types/utilization.ts` — `ProviderUtilizationPoint`, `ComboHealthMetrics` — shape dos 9 sinais
- [x] `tasks/orquestrador.config.json` — roster atual `by_level.{haiku,sonnet,opus}` — input dos tiers
- [x] `tools/scripts/ledger.mjs` — precedente de agregação custo/ator (forma do módulo telemetry)

## 3. Escopo de Arquivos

### EST-10a (registry+move)
- **[CREATE]** `packages/plugin-providers/src/registry.ts` — `PROVIDERS` map (derivado de ORQ-09b agentAdapter.mjs:75-79), `resolveModel(rosterName, providerFactory?)`, `ProviderConfig { baseURL: string; apiKeyEnv: string }`
- **[CREATE]** `packages/plugin-providers/src/index.ts` — re-exporta `registry`, `fallback`, `scoring`, `telemetry`
- **[CREATE]** `packages/plugin-providers/package.json` — `@plataforma/plugin-providers`, deps `ai@^7.0.14`, `@ai-sdk/openai-compatible@^3.0.5`
- **[CREATE]** `packages/plugin-providers/tsconfig.json` — estende `tsconfig.base.json`

### EST-10b (fallback)
- **[CREATE]** `packages/plugin-providers/src/fallback.ts` — `FallbackTier { name: string; providers: string[]; }`, `CircuitBreaker` (adaptado de OmniRoute `circuitBreaker.ts`: estados CLOSED/DEGRADED/OPEN/HALF_OPEN, per-kind thresholds, cooldown/retry), `selectProvider(tier, failedProviders)`
- **[CREATE]** `packages/plugin-providers/src/types.ts` — `FailureKind` (rate_limit, timeout, server_error, auth_error), `CircuitState`, `FallbackConfig`

### EST-10c (scoring + telemetry)
- **[CREATE]** `packages/plugin-providers/src/telemetry.ts` — `CallRecord { provider: string; model: string; timestamp: number; latencyMs: number; inputTokens: number; outputTokens: number; cost: number; success: boolean; errorKind?: string }`, `TelemetryStore` (agrega por provider/janela), `queryUsage(provider, windowMs): UsageSnapshot`
- **[CREATE]** `packages/plugin-providers/src/scoring.ts` — `ScoreFactor` (9 sinais: health, quota, cost, latency, freshness, throughput, errorRate, cooldownStatus, capacity), `computeScore(provider, telemetry): number`

## 4. Estratégia de Testes (por filha)

### EST-10a (registry) — 5 casos, vitest
1. `resolveModel` com prefixo registrado → retorna `LanguageModel`
2. `resolveModel` com prefixo não registrado → `throw`
3. `resolveModel` com `providerFactory` injetado (fake) → chama factory
4. `PROVIDERS` map contém deepseek, opencode-go-ent, opencode-zen-ent
5. `apiKeyEnv` ausente do ambiente → `throw` com mensagem descritiva

### EST-10b (fallback) — 8 casos, vitest
1. CircuitBreaker inicia CLOSED → `canRequest()` = true
2. N falhas consecutivas → OPEN → `canRequest()` = false
3. Após resetTimeout → HALF_OPEN → request permitido
4. Sucesso em HALF_OPEN → volta CLOSED
5. Falha em HALF_OPEN → volta OPEN com backoff
6. `selectProvider` com tier de 2 providers, primeiro falha → segundo assume
7. Per-kind threshold: rate_limit != server_error têm limites diferentes
8. Cooldown: provider em cooldown é pulado no select

### EST-10c (scoring + telemetry) — 6 casos, vitest
1. `CallRecord` é registrado e recuperado por `queryUsage`
2. Agregação por janela: 3 chamadas em 5min vs 1 em 60min
3. `computeScore` com dados saudáveis → score alto (>0.8)
4. `computeScore` com erros recentes → score baixo (<0.3)
5. `computeScore` com cota exausta → score mínimo
6. `queryUsage` com provider sem dados → snapshot vazio (não throw)

## 5. Instruções de Execução
1. Criar scaffold `packages/plugin-providers/` (package.json, tsconfig, src/index.ts)
2. EST-10a: Copiar PROVIDERS map + resolveModel de ORQ-09b, adaptar para TS
3. EST-10b: Adaptar CircuitBreaker de OmniRoute (remover persistência DB, simplificar), implementar FallbackTier + selectProvider
4. EST-10c: Implementar TelemetryStore (in-memory com agregação por janela), ScoringEngine com 9 fatores
5. Testes em paralelo por módulo
6. Gate → §8

## 6. Feedback de Especificação
- **Decisão arquitetural (fechada):** RFC-018 §6.4 fundiu EST-11 (telemetry) em EST-10 como módulo interno. Não reabrir.
- **Decisão arquitetural (fechada):** Protocolo HTTP OpenAI-compatible — troca de baseURL, sem mecanismo novo (RFC-018 §2 C4).
- **Decisão arquitetural (fechada):** CircuitBreaker adaptado do OmniRoute SEM persistência DB (in-memory only, per-process). OmniRoute persiste via `domainState.js`; para o plugin, reset em cada restart é aceitável.
- **Aberto:** Quota real (rate limits por provider) depende de API externa não-fixada — usar mock/config local para testes. Escalar para arquiteto se precisar de integração com API de quota real.
- **Aberto:** Pricing real (DEFAULT_PRICING) — valores do OmniRoute são exemplos para GPT/Claude/Gemini. Manter como configuração editável, não hardcoded.

## 7. Definition of Done (DoD)
- [ ] EST-10a: registry movido, `pnpm --filter @plataforma/plugin-providers test` passa 5/5?
- [ ] EST-10b: fallback tiers + circuit-breaker implementados, 8/8 testes verdes?
- [ ] EST-10c: scoring + telemetry implementados, 6/6 testes verdes?
- [ ] Crush/opencode apontam para este plugin, não para proxy standing (C4)?
- [ ] 19 testes somados, zero regressão nos pacotes existentes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```

```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-providers + telemetria, capacity=sonnet, complexidade 5 requer decomposicao, depende de EST-02 (draft)
- **[2026-07-06T17:35]** - *big-pickle* - `[Decomposto]`: decomposto em EST-10a (registry/haiku), EST-10b (fallback/sonnet), EST-10c (scoring+telemetry/sonnet)
