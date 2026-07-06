---
id: EST-10c
title: "plugin-providers: scoring 9-fatores + telemetria interna (ex-EST-11)"
status: draft:hardened
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-10b"]
blocks: []
parent: "EST-10"
capacity_target: sonnet
---

# EST-10c · plugin-providers: scoring + telemetry

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-providers/`.
- **Pacote compartilhado com EST-10a e EST-10b** — mesmo `package.json` e `tsconfig.json` (já criados em EST-10a).
- **Package name:** `@plataforma/plugin-providers` *(RFC-018 §3, G1)*
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz)
- **Test Runner:** `vitest`
- **Capacidade-alvo:** sonnet (scoring 9-fatores com agregação temporal, sem dependência externa)
- Módulo interno (ex-EST-11, RFC-018 C2). Coleta por chamada, agrega por provider/janela.

## 1. Objetivo
Telemetria de custo/uso/latência + scoring multi-fator (9 sinais). Consumido internamente pelo fallback (EST-10b) e exposto como API de consulta para EST-14 (UI de custo).

## 2. Contratos (derivados de OmniRoute utilization.ts + costEstimator.ts + autoCombo/scoring.ts)
```ts
// --- packages/plugin-providers/src/telemetry.ts ---
export interface CallRecord {
  provider: string;
  model: string;
  timestamp: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  success: boolean;
  errorKind?: string;
}

export interface UsageSnapshot {
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  totalCost: number;
  totalTokens: number;
}

export class TelemetryStore {
  record(call: CallRecord): void;
  queryUsage(provider: string, windowMs?: number): UsageSnapshot;
  queryAll(): Map<string, UsageSnapshot>;
}

// --- packages/plugin-providers/src/scoring.ts ---
export type ScoreFactor =
  | 'health' | 'quota' | 'cost' | 'latency' | 'freshness'
  | 'throughput' | 'errorRate' | 'cooldownStatus' | 'capacity';

export interface ProviderScore {
  provider: string;
  score: number;         // 0..1
  factors: Record<ScoreFactor, number>;
  computedAt: number;
}

export function computeScore(
  provider: string,
  telemetry: TelemetryStore,
  quota?: { remainingPct: number; isExhausted: boolean }
): ProviderScore;
```

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-providers/src/telemetry.ts` — `CallRecord`, `UsageSnapshot`, `TelemetryStore`
- **[CREATE]** `packages/plugin-providers/src/scoring.ts` — `computeScore`, `ScoreFactor`, `ProviderScore`
- **[CREATE]** `packages/plugin-providers/tests/telemetry.test.ts` — 3 casos
- **[CREATE]** `packages/plugin-providers/tests/scoring.test.ts` — 3 casos

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** vitest (Node puro).
- [x] **Ambiente do Teste:** Node 22, sem mock de módulo externo (`TelemetryStore` é in-memory; `computeScore` é função pura).
- [x] **Fora de Escopo:** Integração com API externa de quota real, persistência DB, UI de custo (EST-14).

**Casos de teste (enumerados):**
1. `CallRecord` é registrado e recuperado por `queryUsage`
2. Agregação por janela: 3 chamadas em 5min vs 1 em 60min
3. `computeScore` com dados saudáveis → score alto (>0.8)
4. `computeScore` com erros recentes → score baixo (<0.3)
5. `computeScore` com cota exausta → score mínimo
6. `queryUsage` com provider sem dados → snapshot vazio (não throw)

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** adicione dependências externas — `TelemetryStore` é in-memory puro sem lib.
> - **NÃO** implemente persistência DB (in-memory only, mesmo padrão do EST-10b).
> - **NÃO** acople ao EST-10b diretamente — `computeScore` recebe `TelemetryStore` por parâmetro, sem import de `fallback.ts`.
> - **NÃO** implemente UI de custo (é EST-14) — expõe `queryUsage`/`queryAll` como API pública.
> - **NÃO** hardcode `DEFAULT_PRICING` do OmniRoute — o custo vem no `CallRecord.cost`, não é estimado aqui.
> - **NÃO** modifique `types.ts` ou `index.ts` sem verificar se EST-10a/EST-10b já os criou.

### Pegadinhas conhecidas
- **Janela temporal:** `queryUsage(provider, windowMs)` filtra `CallRecord.timestamp >= Date.now() - windowMs`. Use `performance.now()` ou `Date.now()` — sem dependência de timer externo. Para testes, use `vi.useFakeTimers()`.
- **`computeScore` função pura:** não tem estado interno. Cada fator (0..1) é calculado da `UsageSnapshot` + `quota?`. O score final é a média aritmética simples dos fatores (diferente do OmniRoute que usa pesos — aqui o consumidor define pesos externamente).
- **`UsageSnapshot` vazio:** `queryUsage` sem registros na janela retorna `{ totalCalls: 0, successRate: 0, avgLatencyMs: 0, totalCost: 0, totalTokens: 0 }` — nunca `null`/`throw`.
- **`errorKind` opcional:** pode ser `undefined` (sucesso) ou string livre. O scoring trata qualquer `errorKind` presente como falha.
- **Média aritmética vs ponderada:** a spec OmniRoute (`autoCombo/scoring.ts`) usa pesos (DEFAULT_WEIGHTS). EST-10c simplifica para média aritmética — o chamador (fallback em EST-10b+ ou EST-14) aplica pesos externamente se precisar. Marcação `ponytail: mean over weighted — caller weights if needed`.

1. **[TDD]** Crie `tests/telemetry.test.ts` com casos 1–2 + 6.
2. **[TDD]** Crie `tests/scoring.test.ts` com casos 3–5.
3. Crie `src/telemetry.ts` — `CallRecord`, `UsageSnapshot`, `TelemetryStore` (in-memory `Map<provider, CallRecord[]>`).
4. Crie `src/scoring.ts` — `computeScore()` calcula cada fator da `UsageSnapshot` + `quota?`.
5. Rode build + test + lint (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Todas as decisões de desenho DERIVADAS de fonte (CITE OU ESCALE):**
> - `CallRecord.provider`/`.model`/`.timestamp`/`.latencyMs`/`.inputTokens`/`.outputTokens`/`.cost`/`.success` ← `ComboHealthMetrics.targetHealth[]` fields (utilization.ts:34-48)
> - `UsageSnapshot` (`totalCalls`, `successRate`, `avgLatencyMs`, `totalCost`, `totalTokens`) ← agregado derivado de `CallRecord[]`, shape análogo a `ComboHealthMetrics.performance` (utilization.ts:68-72)
> - `TelemetryStore` ← padrão in-memory do EST-10b (CircuitBreaker in-memory), sem DB (mesma regra)
> - `ScoreFactor` (9 sinais): `health`, `quota`, `cost`, `latency`, `freshness`, `throughput`, `errorRate`, `cooldownStatus`, `capacity` ← derivado de `OmniRoute ScoringFactors` (autoCombo/scoring.ts:11-24) + `ComboHealthMetrics` campos (utilization.ts:29-72), simplificado de 12 para 9 fatores
> - `computeScore` como função pura ← `calculateScore()` em autoCombo/scoring.ts:98 — mas sem pesos internos (média aritmética em vez de ponderada)
> - `ProviderScore.score` (0..1) + `factors` record + `computedAt` ← `ScoredProvider` (autoCombo/scoring.ts:86-92)
> - Média aritmética simplificada (em vez de DEFAULT_WEIGHTS) ← decisão de desenho: o consumidor (fallback/UI) aplica pesos externamente se precisar; `ponytail: caller weights`
> - `CallRecord.cost` vem do caller, não estimado aqui ← `costEstimator.ts` estima custo pré-chamada; o custo real pós-chamada é passado como dado
>
> **Decisões em aberto:** nenhuma. Todo contrato deriva do OmniRoute (utilization.ts, costEstimator.ts, autoCombo/scoring.ts) + padrão in-memory do EST-10b. A simplificação de 12→9 fatores e média aritmética vs ponderada é explícita e reversível.
>
> **Dependências:** EST-10b (`draft:hardened`) — `CircuitBreaker` state (`CLOSED/OPEN/HALF_OPEN/cooldown`) consumido pelo fator `cooldownStatus`. EST-10c não importa EST-10b diretamente; o `cooldownStatus` é injetado pelo caller no momento da chamada a `computeScore`.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `TelemetryStore` com `record`/`queryUsage`/`queryAll` implementado (in-memory, sem DB)?
- [ ] `computeScore` função pura com 9 fatores, retorna `ProviderScore`?
- [ ] Nenhuma dependência externa adicionada?
- [ ] Testes 1–6 verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + test + lint (todos Exit Code 0) na Seção 8. Lint incluído desde 2026-07-06 após 3 reworks consecutivos por regressão (T-807, EST-02b, EST-02c).

### Checklist do Reviewer
- [ ] Contratos seguem OmniRoute (utilization.ts + autoCombo/scoring.ts) sem inventar abstração nova?
- [ ] Sem persistência DB (in-memory only, mesmo padrão do EST-10b)?
- [ ] Sem dependências externas?
- [ ] `computeScore` não modifica `TelemetryStore` (função pura, sem side-effect)?
- [ ] `queryUsage` com dados vazios → snapshot zero (não throw)?
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
- **[2026-07-06T18:01]** - *big-pickle* - `[Triado]`: triado — scoring 9-fatores + telemetry, capacity=sonnet, decisoes fechadas no OmniRoute, depende EST-10b
- **[2026-07-06T18:01]** - *big-pickle* - `[Endurecido]`: endureceu spec — scoring 9-fatores + telemetry, 6 testes, gate build+test+lint, capacity=sonnet
