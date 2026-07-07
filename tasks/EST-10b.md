---
id: EST-10b
title: "plugin-providers: fallback tiers + circuit-breaker/cooldown"
status: done
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
- CircuitBreaker + selectProvider implementados (adaptados do OmniRoute, in-memory)
- 8 testes de fallback + 5 testes de registry (EST-10a) = 13 passando
- Adaptive backoff: dobra resetTimeout apenas em re-abertura (HALF_OPEN → OPEN)
- Gate: build ✅ · test ✅ (13/13) · lint ✅

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
=== BUILD ===
$ tsc
(Exit code 0)

=== TEST ===
$ vitest run
✓ tests/registry.test.ts (5 tests) 5ms
✓ tests/fallback.test.ts (8 tests) 360ms
Test Files  2 passed (2)
     Tests  13 passed (13)
(Exit code 0)

=== LINT ===
$ eslint src/
(Exit code 0)
```

- **Comentários de Revisão:**

---

### Parecer do Reviewer 2 (minimax, independente):

- [ ] **Aprovado**
- [x] **Requer Refatoração**

- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/plugin-providers build  → (tsc, sem erros — re-executado por minimax na worktree task/EST-10b)
$ pnpm --filter @plataforma/plugin-providers test   → Test Files 2 passed · Tests 13 passed (13)
$ pnpm --filter @plataforma/plugin-providers lint   → (sem warnings/errors)
```

- **Comentários de Revisão:**

  **MAJOR [M1] — `halfOpenRequests` declarado mas nunca usado.**
  `src/fallback.ts:18` declara `private halfOpenRequests: number;` e a
  L28 o armazena no construtor. Nenhuma outra leitura ocorre no arquivo.
  `canRequest()` (L35-38) ignora o limite de HALF_OPEN — apenas checa
  `state !== 'OPEN'`. O campo `halfOpenCount` (L12) é zerado em 4
  lugares (L46, L88, L115, L122) e nunca incrementado. Isso viola:
    - Spec §1 L62-63: o parâmetro é documentado como **real**, com
      default 1, citando OmniRoute L139.
    - Spec §1 L91: a ref. `canExecute (OmniRoute L277-283)` —
      OmniRoute L281 retorna `this.halfOpenAllowed > 0` em HALF_OPEN.
    - DoD §7 L199: "`canRequest()` respeita cooldown + **HALF_OPEN
      probe limit**?" — explicitamente enumerado, não implementado.
  Com `halfOpenRequests: 1` (default) a impl. parece correta por
  acidente; com `halfOpenRequests: 2+` o limite é silenciosamente
  violado. EST-10c (scoring/telemetria) pode precisar de probe
  >1 e vai descobrir o bug.
  **Ação:** (1) em `_transition` (branch HALF_OPEN) inicializar
  `this.halfOpenCount = this.halfOpenRequests`; (2) em `canRequest()`
  tratar `HALF_OPEN` retornando `this.halfOpenCount > 0`; (3) somar
  teste no `fallback.test.ts` que prova o limite (sonda (b) abaixo).

  **MINOR [m1] — `src/index.ts` modificado fora do escopo declarado em §3.**
  Funcionalmente necessário (consumidores precisam dos exports), mas
  não listado. Sugestão: adicionar `[EDIT] src/index.ts` em §3 no rework
  ou aceitar como acoplamento implícito.

  **MINOR [m2] — DEGRADED→CLOSED recovery em recordSuccess() ausente.**
  Divergência do OmniRoute L339-341, não exigida pela spec §5.
  Sugestão: implementar para fidelidade, ou documentar como desvio
  intencional.

  **INFO [i1]** — 3 sondas adversariais concebidas. Sonda (a) passa
  (`return null` no fim do loop), sonda (c) passa (DEGRADED→OPEN via
  failureCount≥failureThreshold), sonda (d) passa (recordSuccess
  tolerante em CLOSED). Sonda (b) **falha pré-fix** e prova o [M1] —
  é o teste de aceitação natural do rework:
  ```ts
  it('(b) halfOpenRequests: 2 — segundo probe em HALF_OPEN é bloqueado', async () => {
    const cb = new CircuitBreaker('p', {
      failureThreshold: 1, resetTimeout: 50, halfOpenRequests: 2,
    });
    cb.recordFailure();
    await new Promise((r) => setTimeout(r, 60));   // → HALF_OPEN
    expect(cb.getState()).toBe('HALF_OPEN');
    expect(cb.canRequest()).toBe(true);            // 1º probe OK
    // PRÉ-FIX: ainda retorna true (BUG). PÓS-FIX: deve retornar false.
    expect(cb.canRequest()).toBe(false);
  });
  ```

  **INFO [i2]** — Gates de execução (pnpm build/test/lint) re-executados
  pelo orquestrador minimax: build OK · test 13/13 · lint OK.

  **INFO [i3]** — Adaptação do OmniRoute em geral é FIEL: 4 estados,
  `_refreshOpenState` por timestamp, kindThresholds independente de
  failureCount, adaptive backoff dobrando apenas HALF_OPEN→OPEN, sem
  DB persistence (escopo in-memory respeitado), sem `execute(fn)`
  (escopo respeitado), sem deps externas (package.json tem só
  devDeps), `selectProvider` com `ReadonlySet` + sem mutar `breakerMap`.
  Tudo bate com §3, §5, §7 do checklist do reviewer.

- **Divergência do parecer anterior:** o Handover (worker deepseek) lista
  "build ✅ test ✅ 13/13 lint ✅" como gates verdes e marca a entrega
  como pronta. O Handover não cita `halfOpenRequests` como problema nem
  como nota — a omissão é o sintoma. Este reviewer independente encontrou
  [M1] por grep cruzado com a spec §1 + OmniRoute L139/L281. Mantenho
  REFATORAÇÃO NECESSÁRIA.

### Parecer do Reviewer 3 (minimax-m3, independente — pós-rework):

- [x] **Aprovado**
- [ ] **Requer Refatoração**

- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/plugin-providers build
$ tsc
(Exit code 0)

$ pnpm --filter @plataforma/plugin-providers test
$ vitest run
 ✓ tests/registry.test.ts (5 tests) 5ms
 ✓ tests/fallback.test.ts (9 tests) 423ms
 Test Files  2 passed (2)
      Tests  14 passed (14)
(Exit code 0)

$ pnpm --filter @plataforma/plugin-providers lint
$ eslint src/
(Exit code 0)
```

- **Comentários de Revisão:**

  **Reverificação do [M1] (Reviewer 2) — RESOLVIDO.** O commit
  `9f89ec6 fix(EST-10b): [M1] halfOpenRequests probe limit` corrige
  o defeito identificado:
    - `src/fallback.ts:35-41` — `canRequest()` agora trata `HALF_OPEN`
      com `return this.halfOpenCount-- > 0;`, decrementando o contador
      a cada probe.
    - `src/fallback.ts:124-126` — `_transition('HALF_OPEN')` inicializa
      `this.halfOpenCount = this.halfOpenRequests` (era `0`).
  Test 9 (`fallback.test.ts:97-108`) prova o limite com
  `halfOpenRequests: 2`: 1º e 2º probes OK, 3º bloqueado. Gate do
  re-run: build OK · test 14/14 (era 13) · lint OK.

  **Sondas adversariais (3/3 passaram; arquivos removidos):**
    - (A) `onStateChange` callback dispara em todas as transições
      (CLOSED→OPEN, OPEN→HALF_OPEN, HALF_OPEN→OPEN, HALF_OPEN→CLOSED)
      — PASS.
    - (B) `halfOpenCount` é resetado em cada novo ciclo HALF_OPEN
      (não fica preso em 0/-1 do ciclo anterior) — PASS.
    - (C) `selectProvider` é puro: `failedSet` e `breakerMap` inalterados
      após a chamada (tamanho + estados dos breakers idênticos antes/
      depois) — PASS.

  **MINORs pré-existentes do Reviewer 2 — não-bloqueantes, vão para o
  ledger de pendências no `integrar-task`:**
    - [m1] `src/index.ts` continua fora do escopo declarado em §3. O
      arquivo é funcionalmente necessário (re-exporta tipos e funções
      para o `@plataforma/plugin-providers` consumido via
      `package.json#exports`); worker não adicionou `[EDIT] src/index.ts`
      à §3 nem documentou o acoplamento implícito. Não bloqueia
      integração.
    - [m2] DEGRADED→CLOSED recovery em `recordSuccess()` segue ausente.
      Spec §5 não exige (OmniRoute L339-341 só — desvio intencional
      ou melhoria de fidelidade). Não bloqueia integração.

  **Checklist DoD §7 — todos verdes:**
    - [x] CircuitBreaker com 4 estados (CLOSED/DEGRADED/OPEN/HALF_OPEN) ✓
    - [x] `canRequest()` respeita cooldown + HALF_OPEN probe limit ✓
    - [x] `recordFailure` com `FailureKind` opcional e kind thresholds ✓
    - [x] `selectProvider` pula providers em cooldown e retorna o
      primeiro disponível ✓
    - [x] Testes 1–8 verdes + bônus 9 (probe limit) ✓

- **Divergência do parecer anterior:** Reviewer 2 marcou REFATORAÇÃO
  NECESSÁRIA com [M1] halfOpenRequests probe limit não implementado.
  Worker (deepseek) entregou rework `9f89ec6` que (a) conserta `canRequest`
  com `halfOpenCount-- > 0` em HALF_OPEN, (b) inicializa `halfOpenCount =
  halfOpenRequests` em `_transition('HALF_OPEN')`, e (c) adiciona teste
  9 provando o limite. Re-executei build/test/lint e sondas (A/B/C) — o
  defeito está resolvido na raiz. Veredito rebaixado para **APROVADO**.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T17:53]** - *deepseek* - `[Triado]`: triado — fallback tiers + circuit-breaker, capacity=sonnet, depende de EST-10a, decisoes fechadas no OmniRoute + RFC-018
- **[2026-07-06T17:53]** - *deepseek* - `[Endurecido]`: endureceu spec — CircuitBreaker derivado de OmniRoute + selectProvider, 8 casos de teste, gate build+test+lint, capacity=sonnet
- **[2026-07-07T00:11]** - *system* - `[Auto-promovida]`: dep EST-10a concluída
- **[2026-07-07T00:32]** - *deepseek* - `[Iniciado]`: iniciando
- **[2026-07-07T12:52]** - *deepseek* - `[Finalizado]`: CircuitBreaker + selectProvider — adaptados do OmniRoute, in-memory. 13/13 testes verdes. build+lint limpos.
- **[2026-07-07T13:07]** - *agile_reviewer:minimax* - `[Em revisão]`: revisando EST-10b (qa-review --integrar)
- **[2026-07-07T13:15]** - *agile_reviewer:minimax* - `[Requer Refatoração]`: Rework: [M1] halfOpenRequests declarado mas nunca usado — canRequest() (fallback.ts:35-38) ignora o probe limit em HALF_OPEN. _transition não inicializa halfOpenCount = halfOpenRequests (L121-123). Spec §1 L62-63 + §1 L91 (OmniRoute L281 canExecute) + DoD §7 L199 violados. Ação: (1) em _transition branch HALF_OPEN setar this.halfOpenCount = this.halfOpenRequests; (2) em canRequest() tratar HALF_OPEN retornando this.halfOpenCount > 0; (3) adicionar teste no fallback.test.ts que prova o limite (sonda (b) do parecer). Não-bloqueantes [m1][m2] → ledger _pendencias.md.
- **[2026-07-07T13:17]** - *deepseek* - `[Iniciado]`: rework: corrigindo [M1] halfOpenRequests probe limit
- **[2026-07-07T13:21]** - *deepseek* - `[Finalizado]`: rework pronto: [M1] halfOpenRequests probe limit corrigido — canRequest() agora inicializa halfOpenCount=halfOpenRequests na transicao HALF_OPEN e decrementa a cada probe; sonda (b) adicionada (9o teste). Gate: build ✅ · test 14/14 ✅ · lint ✅
- **[2026-07-07T13:23]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: qa-review --integrar: revisando EST-10b
- **[2026-07-07T13:31]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit f1ce0a2), worktree removida, Gate verde (build OK, test 14/14, lint OK). 2 nao-bloqueantes (m1 m2) ja no ledger de pendencias (Reviewer 2 pre-existente; Reviewer 3 concorda). Push master OK (5dcb7a5..f1ce0a2).
