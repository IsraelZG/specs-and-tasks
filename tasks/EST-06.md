---
id: EST-06
title: "plugin-agent-harness: migrar VercelAgentAdapter + observabilidade/kill do ORQ-09b/10 pro monorepo superapp"
status: draft:hardened
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-05"]
blocks: []
capacity_target: sonnet # move VercelAgentAdapter ORQ-09b/10, adapta ao host mediado
---

# EST-06 · plugin-agent-harness (move do ORQ-09b/10)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-agent-harness/` (criar do zero — pacote não existe ainda no monorepo; ver §3). **Move mecânico** — o código já existe, testado e provado (`tools/orchestrator/src/agentAdapter.mjs` + `monitor.mjs`, ambos `done`). Baixa complexidade: adaptar para consumir `plugin-fs-tools` (EST-05) via host mediado em vez de import direto, não reescrever a lógica do loop.
- **Package Manager:** `pnpm` (monorepo do superapp — `pnpm-workspace.yaml` já mapeia `packages/*` e `apps/*`).
- **Language:** **TypeScript** (não `.mjs` como no PoC) — alinhado ao resto do monorepo.
- **Test Runner:** `vitest` (não `node:test` como nas suites ORQ-09b/10) — já é o padrão do monorepo (T-001, EST-05).
- **Lint:** `eslint src/` (`typescript-eslint` strict — padrão do monorepo).
- **Capacidade-alvo:** sonnet (move+adapt com 3 concerns: loop de agente, monitor, wiring via host)
- **Pacote depende de:** `@plataforma/plugin-fs-tools` (EST-05, `done`) + `@plataforma/estaleiro-core` (EST-02, decomposta — EST-02a/b/c) para tipos do host.

## 1. Objetivo
Mover o `VercelAgentAdapter` (`run()`, provider registry, event stream — ORQ-09b) e a camada de
observabilidade/kill (`startMonitor`, `findStuck`, `writeCancelFlags` — ORQ-10) para
`packages/plugin-agent-harness/`. O código movido deve consumir `plugin-fs-tools` (EST-05) **via
host mediado** (`MakeToolsOptions.fs`/`.bash` em vez de `node:fs`/`node:child_process` direto —
RFC-018 A3). O protocolo de eventos (ADR-0008 §D) é a interface que a UI (EST-14) vai consumir
via WebSocket (F3).

### Contratos exatos (derivados de ADR-0008 + ORQ-09b agentAdapter.mjs + ORQ-10 monitor.mjs)

```ts
// --- packages/plugin-agent-harness/src/types.ts

/** Resultado do loop de agente (ADR-0008 preamble). */
export interface AgentRunResult {
  exit: number | null;
  timedOut: boolean;
  tail: string;
}

/** Payload de eventos emitidos durante run() (ADR-0008 §D). */
export type AgentEvent =
  | { taskId: string; type: 'start'; ts: number; model: string; cwd: string }
  | { taskId: string; type: 'step'; ts: number; tools: number; finishReason: string }
  | { taskId: string; type: 'tool-call'; ts: number; tool: string; args: Record<string, unknown> }
  | { taskId: string; type: 'tool-result'; ts: number; tool: string; ok: boolean; exit?: number | null; denied?: boolean }
  | { taskId: string; type: 'done'; ts: number; text: string; steps: number }
  | { taskId: string; type: 'aborted'; ts: number; reason: 'cancel' | 'timeout' }
  | { taskId: string; type: 'error'; ts: number; message: string };

// --- packages/plugin-agent-harness/src/runner.ts

export interface RunOptions {
  taskId: string;
  model: string;
  cwd: string;
  prompt?: string;
  timeoutMs?: number;        // default 1_800_000 (30 min) — agentAdapter.mjs L100
  onEvent?: (e: AgentEvent) => void;
  signal?: AbortSignal;
  maxSteps?: number;         // default 40 — agentAdapter.mjs L17
  cancelWatcher?: boolean;   // default true
  /** Tools injetadas via host (EST-05), em vez de import direto. */
  tools: import('@plataforma/plugin-fs-tools').PluginTools;
}

export function run(opts: RunOptions): Promise<AgentRunResult>;

// --- packages/plugin-agent-harness/src/monitor.ts

export interface MonitorOptions {
  registry: Record<string, { lastEventTs?: number; started?: number }>;
  dir: string;
  intervalMs?: number;       // default 10_000 — monitor.mjs CHECK_INTERVAL_MS
  now?: () => number;         // injetável para testes determinísticos
  onStuck?: (id: string, filePath: string) => void;
}

export interface MonitorHandle {
  stop(): void;
}

export function startMonitor(opts: MonitorOptions): MonitorHandle;

export function findStuck(
  registry: Record<string, { lastEventTs?: number; started?: number; model?: string }>,
  now?: number
): string[];

export function writeCancelFlags(
  ids: string[],
  dir: string
): string[];
```

### Comportamento esperado (derivado do código ORQ-09b/10)
- `run()`: cria `AbortController` combinando `timeoutMs` + `signal` externo (Decisão E, ADR-0008). Executa loop com `maxSteps` usando Vercel AI SDK `generateText` + `tools` injetadas (não importa `tool()` diretamente — quem cria as tools é EST-05, o harness só recebe). Emite eventos via `opts.onEvent()`. Se `opts.cancelWatcher !== false`, inicia `startCancelWatcher` interno (polla `<taskId>.cancel` via `opts.tools.readFile` — adaptado para usar as tools injetadas em vez de `fs.readFileSync` direto). Retorna `AgentRunResult`.
- `startMonitor()`: inicia `setInterval` que chama `findStuck` + `writeCancelFlags`. O `stop()` do `MonitorHandle` faz `clearInterval`.
- `findStuck()`: retorna `taskId[]` cujo `lastEventTs` (ou `started`) é anterior a `Date.now() - 300_000`. Ordenado do mais velho ao mais novo.
- `writeCancelFlags()`: escreve arquivos `<id>.cancel` em `dir` com conteúdo `{ ts: Date.now(), reason: 'stuck-monitor' }`. Idempotente (sobrescreve). Usa `fs.writeFileSync` via porta injetável (ou `node:fs` direto pois é utilitário de sistema — fora do loop de agente, sem mediação).

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (A3 — plugins via host mediado, F3 — eventos para UI via WS, G2 — migração via task MGTIA normal) e §3 (diagrama: plugin-agent-harness no ecossistema).
- [x] `tools/orchestrator/src/agentAdapter.mjs` (ORQ-09b, done) — `run()`, `resolveModel()`, `startCancelWatcher()`, PROVIDERS map, event emission loop.
- [x] `tools/orchestrator/src/monitor.mjs` (ORQ-10, done) — `startMonitor`, `findStuck`, `writeCancelFlags`.
- [x] `docs/adr/0008-agent-adapter-in-process.md` — contrato de eventos (§D), AgentRunResult (preamble), tool harness (§A), gating (§B), cancelamento/timeout (§E).
- [x] `tasks/EST-05.md` (done) — `PluginTools` (readFile/writeFile/bash) consumido por `run()` via `opts.tools`.
- [x] `apps/estaleiro/core/src/manifest.ts` (EST-02a) — `PluginManifest` Zod schema (EST-06 declara `capabilities: ["agent", "fs"]`).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-agent-harness/package.json` — nome `@plataforma/plugin-agent-harness`, version `0.0.1`, private, type module, scripts `build`/`test`/`lint`. Deps: `ai@^7.0.14`, `zod@^4.4.3`, `@plataforma/plugin-fs-tools@workspace:*`, `@plataforma/estaleiro-core@workspace:*`. DevDeps: `typescript@^5.8.0`, `vitest@^3.0.0`, `eslint@^9.0.0`, `typescript-eslint@^8.0.0`.
- **[CREATE]** `packages/plugin-agent-harness/tsconfig.json` — estende `tsconfig.base.json`, `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]`.
- **[CREATE]** `packages/plugin-agent-harness/src/types.ts` — `AgentRunResult`, `AgentEvent` (union discriminada).
- **[CREATE]** `packages/plugin-agent-harness/src/runner.ts` — `run()` função principal (loop adaptado de agentAdapter.mjs, tools injetadas via parâmetro).
- **[CREATE]** `packages/plugin-agent-harness/src/monitor.ts` — `startMonitor`, `findStuck`, `writeCancelFlags` (adaptados de monitor.mjs).
- **[CREATE]** `packages/plugin-agent-harness/src/index.ts` — re-exporta `run`, `startMonitor`, `findStuck`, `writeCancelFlags`, tipos.
- **[CREATE]** `packages/plugin-agent-harness/tests/runner.test.ts` — vitest, 6+ casos.
- **[CREATE]** `packages/plugin-agent-harness/tests/monitor.test.ts` — vitest, 5+ casos.
- **[CREATE]** `packages/plugin-agent-harness/tests/fixtures/registry.ts` — fixture de registry para testes de monitor.

## 4. Estratégia de Testes Estrita (TDD)
- [x] **Framework:** `vitest` (não `node:test` como nas suites ORQ originais).
- [x] **Ambiente:** Node puro. `cwd` de teste = `fs.mkdtempSync` + `afterEach` cleanup. Tools mockadas via `vi.fn()` (`PluginTools` fake que usa `node:fs`/`node:child_process` reais apontando para tmpdir — o foco é testar o loop, não as tools em si, que já têm testes próprios em EST-05).
- [x] **Fora de Escopo:** Provider real / LLM (tools mockadas, não chamam modelo). Integração com UI/WebSocket (EST-14). `resolveModel()` não é portado (está no registry EST-10a agora).

### Casos de teste: runner (6)
1. `run()` com `maxSteps: 1`, ferramenta que retorna resultado, modelo que para → retorna `{exit:0, timedOut:false, tail}`. Emite eventos `start → tool-call → tool-result → step → done` (verificar ordem e campos).
2. `run()` com `signal.aborted` antes da chamada → rejeita com `Error('cancelado')`; `onEvent` NÃO é chamado (verificar com spy).
3. `run()` sem `cancelWatcher: false` → watcher interno NÃO é iniciado (o runner não polla `.cancel` files).
4. `run()` com `timeoutMs: 100` e ferramenta que demora 10s → rejeita com timedOut; evento `aborted` emitido.
5. `run()` com `tools` que contém `readFile` mockada → verificar que `run` usa `opts.tools.readFile` (não `node:fs` direto) — spy `vi.fn()`.
6. `run()` com `onEvent` spy → eventos emitidos têm `taskId` correto, `ts: number`, tipos da union.

### Casos de teste: monitor (5)
7. `findStuck()` com registry onde 2 de 3 tasks passaram de `STUCK_TIMEOUT_MS` (300s) → retorna os 2 ids, ordenados do mais velho ao mais novo.
8. `findStuck()` com registry vazio → `[]`.
9. `writeCancelFlags()` com 2 ids → cria 2 arquivos `<id>.cancel` em tmpdir com JSON `{ ts, reason: "stuck-monitor" }`.
10. `writeCancelFlags()` idempotente: chamar duas vezes com mesmos ids → 2 arquivos existem (sobrescritos, sem erro).
11. `startMonitor()` → `stop()`: monitor começa a pollar, `stop()` interrompe o intervalo (verificar com `vi.advanceTimersByTime()`).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** reimplementar `resolveModel()` — providers agora vivem em `@plataforma/plugin-providers` (EST-10a). O runner recebe model string já resolvida.
> - **NÃO** importar `node:fs`/`node:child_process` direto no runner — `readFile`/`writeFile`/`bash` vêm via `opts.tools` (injetado pelo caller, que os obtém de EST-05).
> - **NÃO** criar `createOpenAICompatible` dentro do plugin — o caller passa o modelo já construído (`model: LanguageModel` em vez de `model: string` para o `generateText`).
> - **NÃO** modificar `packages/plugin-fs-tools/` nem `apps/estaleiro/core/` — são pacotes separados, fora de escopo.
> - **NÃO** portar `postEventToPanel()` (ORQ-09b endpoint de painel legado) — eventos vão via `onEvent`; UI (EST-14) consome depois.

### Pegadinhas conhecidas
- **Tools injetadas vs import:** `agentAdapter.mjs` original importa `makeTools` e cria as tools internamente. No plugin, `run()` **recebe** `PluginTools` prontas (injetadas pelo host). A adaptação principal é separar "criar tools" (fica em EST-05) de "usar tools" (fica aqui). O `startCancelWatcher` original `fs.readFileSync` direto → adaptar para `opts.tools.readFile()`.
- **`resolveModel` removido:** ORQ-09b fazia `provider = resolveModel(rosterName)` + `createOpenAICompatible`. Agora o caller resolve o modelo antes de chamar `run()` (usa `resolveModel` de EST-10a). O runner recebe o modelo pronto — isso simplifica o contrato.
- **Cancel watcher via tools:** o watcher original polla disco via `fs.readFileSync`. No plugin, ele deve usar `opts.tools.readFile` (que por sua vez vai via host → `FsPort`). Como `readFile` é `async`, o watcher vira `setInterval` com `readFile` assíncrono, não `fs.watchFile`/`readFileSync`.
- **Event timestamp:** `ts` deve ser `Date.now()` no momento da emissão — consistente com ADR-0008 §D e com EST-05 `onEvent`.
- **Tipo union `AgentEvent`:** usar discriminated union do TS (type field como literal) — o consumidor (EST-14) faz switch por type.

1. **[TDD]** Criar `tests/monitor.test.ts` com casos 7–11.
2. **[TDD]** Criar `tests/runner.test.ts` com casos 1–6.
3. Criar `src/types.ts` — `AgentRunResult`, `AgentEvent`.
4. Criar `src/monitor.ts` — `findStuck`, `writeCancelFlags`, `startMonitor`.
5. Criar `src/runner.ts` — `run()` adaptado de agentAdapter.mjs, com tools injetadas.
6. Criar `src/index.ts` — re-exports.
7. Rodar `pnpm --filter @plataforma/plugin-agent-harness test` até 11/11 verde.
8. Rodar `build` + `lint`. Gate (§7) → §8.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Todas as decisões de desenho DERIVADAS de fonte (CITE OU ESCALE):**
> - `AgentRunResult { exit, timedOut, tail }` ← ADR-0008 preamble (linha 27) + agentAdapter.mjs JSDoc return
> - `AgentEvent` union (7 tipos) ← ADR-0008 §D (tabela linhas 62-69): start, step, tool-call, tool-result, done, aborted, error; payloads verbatim do ADR
> - `RunOptions { taskId, model, cwd, prompt, timeoutMs, maxSteps, onEvent, signal, cancelWatcher }` ← agentAdapter.mjs `run()` JSDoc params (L95-120)
> - `timeoutMs` default 1_800_000 ← agentAdapter.mjs L100
> - `maxSteps` default 40 ← agentAdapter.mjs L17
> - `tools` como parâmetro injetado (não criado internamente) ← RFC-018 A3 (host media tudo) + EST-05 (`makeTools` é do plugin-fs-tools, não do agent-harness)
> - `startMonitor`, `findStuck`, `writeCancelFlags` ← ORQ-10 monitor.mjs exports
> - `STUCK_TIMEOUT_MS` = 300_000 (5 min) ← monitor.mjs L12
> - `CHECK_INTERVAL_MS` = 10_000 ← monitor.mjs L13
> - `writeCancelFlags` idempotente (sobrescreve) ← monitor.mjs: `writeFileSync` sem flag `wx`
> - Cancel watcher adaptado para `async readFile` ← original usa `fs.readFileSync`; com tools injetadas via host (que são async), precisa de `await`
> - `resolveModel` NÃO PORTADO ← providers agora em EST-10a; runner recebe modelo pronto
> - `postEventToPanel` NÃO PORTADO ← painel legado; eventos vão por `onEvent` para EST-14
>
> **Decisões em aberto:** nenhuma. Todos os contratos derivam de ADR-0008 + agentAdapter.mjs + monitor.mjs + RFC-018 A3. A separação "criar tools" (EST-05) vs "usar tools" (EST-06) é explícita.
>
> **Dependências:** EST-05 (`done`) — `PluginTools` consumido pelo runner. EST-02 (decomposta, filhas `done`) — tipos do host mediado usados indiretamente via EST-05.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `run()` aceita `PluginTools` injetado (não cria tools internamente)?
- [ ] `run()` emite eventos ADR-0008 §D na ordem correta (start → tool-call → tool-result → step → done/aborted/error)?
- [ ] `startMonitor` + `findStuck` + `writeCancelFlags` implementados conforme ORQ-10?
- [ ] `resolveModel` NÃO portado (não existe no plugin)?
- [ ] Nenhum `import` de `node:fs`/`node:child_process` no runner (tools vão via parâmetro)?
- [ ] Testes 1–11 verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/plugin-agent-harness build
pnpm --filter @plataforma/plugin-agent-harness test
pnpm --filter @plataforma/plugin-agent-harness lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + test + lint (todos Exit Code 0) na Seção 8. Lint incluído desde 2026-07-06 após 3 reworks consecutivos por regressão (T-807, EST-02b, EST-02c).

### Checklist do Reviewer
- [ ] Apenas arquivos da §3 foram criados/editados?
- [ ] `run()` usa `opts.tools` (não importa `makeTools` nem `tool()` do `ai` SDK)?
- [ ] 11 casos da §4 verdes? (`Tests 11 passed (11)`)
- [ ] `tsc` sem erros? `eslint` sem erros NOVOS?
- [ ] Protocolo de eventos preservado (ADR-0008 §D) para consumo da UI (EST-14)?
- [ ] Nenhum `resolveModel`/`postEventToPanel` legado portado?

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
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-agent-harness move ORQ-09b/10, capacity=sonnet, depende de EST-02/05 (draft)
- **[2026-07-06T18:33]** - *big-pickle* - `[Endurecido]`: endureceu spec — run() + monitor, 11 testes, gate build+test+lint, capacity=sonnet
