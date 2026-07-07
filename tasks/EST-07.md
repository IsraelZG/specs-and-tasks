---
id: EST-07
title: "plugin-dispatcher: sucessor do orquestrar.mjs (escolhe modelo, decide o que despachar, lock de task)"
status: in_review
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-03", "EST-06"]
blocks: []
capacity_target: sonnet
---

# EST-07 · plugin-dispatcher (sucessor do orquestrar.mjs)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-dispatcher/`. **Componente NOVO** (RFC-018 §2 D1) — não é
  move de código pronto, é o desenho de um dispatcher próprio, plugin dedicado (nem core, nem
  agent-harness). **CONFIRMA que ORQ-11 (religar orquestrar.mjs no Docs) fica obsoleta** — esta
  task é a sucessora real.
- **Package Manager:** `pnpm` (monorepo do superapp — `pnpm-workspace.yaml` já mapeia `packages/*`).
- **Language:** **TypeScript** (alinhado ao resto do monorepo).
- **Test Runner:** `vitest` (padrão do monorepo — T-001, EST-05).
- **Lint:** `eslint src/` (`typescript-eslint` strict — padrão do monorepo).
- **Pacote depende de (runtime):** `@plataforma/plugin-tasks@workspace:*` (EST-03d) — `TaskServicePort`
  p/ consultar tasks prontas; `@plataforma/plugin-agent-harness@workspace:*` (EST-06) — `run()` p/
  executar o agente.
- **Pacote depende de (dev):** `typescript@^5.8.0`, `vitest@^3.0.0`, `eslint@^9.0.0`,
  `typescript-eslint@^8.0.0`.
- **Capacidade-alvo:** sonnet (dispatcher c/ lock, escolha de modelo, integração 2 plugins).

## 1. Objetivo
Implementar o dispatcher que decide **o que** despachar (consultando `plugin-tasks` por tasks
prontas, EST-03), **para qual modelo** (roster/seleção, herdado de `orquestrador.config.json`), e
**trava lock** de task durante execução — chamando `plugin-agent-harness` (EST-06) para efetivamente
rodar. Vive como plugin próprio (RFC-018 D1) porque sobrevive à migração do Estaleiro, diferente do
core (descartável).

O dispatcher **substitui** o `orquestrar.mjs` (`tools/scripts/orquestrar.mjs` no Docs). Diferenças
principais:
- **Fonte de tasks:** `TaskServicePort.listTasks()` (EST-03d) em vez de ledger JSON.
- **Execução:** `run()` do plugin-agent-harness (EST-06, in-process) em vez de `spawn('crush run')`.
- **Lock:** usa `transition('start')` do plugin-tasks como gate de exclusão (task `ready → in_progress`
  falha se já está em progresso por outro dispatcher) — dispensa lock filesystem separado.
- **Sem kill-switch:** `EMERGENCY_DISABLE_SPAWN` do orquestrar.mjs não existe aqui; o dispatcher
  é desenhado limpo.

### Contratos

```ts
// --- packages/plugin-dispatcher/src/types.ts

import type { TaskServicePort } from '@plataforma/plugin-tasks';   // EST-03d
import type { RunOptions, AgentRunResult } from '@plataforma/plugin-agent-harness'; // EST-06

/** Config do dispatcher — espelho do orquestrador.config.json. */
export interface DispatcherConfig {
  maxConcurrent: number;
  roster: {
    byLevel: Record<string, string[]>;
    byCapability?: Record<string, string[]>;
  };
  routing?: {
    frontendQa?: { requires: string[]; minLevel: string };
  };
  priority: string[];
  circuitBreaker: { maxReviewCycles: number };
  providerAccounts: Record<string, string>;
  providersBalance: { skipBelowUsd: number };
}

/** Item planejado para despacho. */
export interface DispatchItem {
  taskId: string;
  action: string;           // next_action: work | rework | review | harden | promote
  model: string;            // modelo selecionado (ex.: "deepseek/deepseek-v4-pro")
  cwd: string;              // cwd onde o agente roda
  reworkCount: number;
}

/** Resultado do planejamento — o que será e o que não será despachado. */
export interface DispatchPlan {
  planned: DispatchItem[];
  skipped: Array<{ id: string; reason: string }>;
  slots: number;
  running: number;
}

/** Saldo de provedor — usado para pular provedores sem crédito. */
export interface ProviderBalance {
  provider: string;
  ok: boolean;
  availableUsd?: number;
}

/** Contexto completo que o dispatcher recebe para operar. */
export interface DispatchContext {
  taskService: TaskServicePort;
  config: DispatcherConfig;
  runAgent: (opts: RunOptions) => Promise<AgentRunResult>;
  getBalances: () => Promise<ProviderBalance[]>;
}
```

```ts
// --- packages/plugin-dispatcher/src/selectModel.ts

import type { DispatcherConfig, ProviderBalance } from './types';

export interface SelectModelInput {
  capacityTarget?: string;   // default 'sonnet'
  needsVision?: boolean;     // true se action === 'review' e task tem frontend/ui
  workerModel?: string;      // modelo que executou (anti-pool p/ review)
}

export function selectModel(
  task: SelectModelInput,
  config: DispatcherConfig,
  brokeProviders?: string[]
): { model: string | null; reason: string };
// Derivado de orquestrar.mjs selectModel() L61-100.
```

```ts
// --- packages/plugin-dispatcher/src/dispatcher.ts

import type { DispatchContext, DispatchPlan, DispatchItem } from './types';

/** Planeja o que despachar: consulta plugin-tasks, aplica prioridade/roster/slots/circuit-breaker. */
export function planDispatch(ctx: DispatchContext): Promise<DispatchPlan>;

/** Executa UM item: transiciona task p/ in_progress (lock), chama runAgent(). */
export function executeDispatch(
  item: DispatchItem,
  ctx: DispatchContext
): Promise<AgentRunResult>;
// Nota: o lock é implícito — transition('start') falha se a task já estiver em execução.
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (D1 — dispatcher é plugin próprio) e §5 (ORQ-11 obsoleta,
  apontar p/ EST-07).
- [x] `tools/scripts/orquestrar.mjs` — `planDispatch()` (L103-163), `selectModel()` (L61-100),
  `withLock()` (L230-253), `pruneRegistry()` (L196-215) — lógica a portar/adaptar.
- [x] `tasks/orquestrador.config.json` — roster por nível (haiku/sonnet/opus/vision),
  `max_concurrent`, `priority`, `circuit_breaker`, `provider_accounts`.
- [x] `tasks/EST-03d.md` (done) — `TaskServicePort` interface: `listTasks()`, `transition()`,
  `getTask()`, `getLog()`, `submitVerdict()`.
- [x] `tasks/EST-06.md` (in_progress) — `RunOptions`, `AgentRunResult`, `run()` — o executor que o
  dispatcher invoca.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-dispatcher/package.json` — nome `@plataforma/plugin-dispatcher`,
  version `0.0.1`, private, type module, scripts `build`/`test`/`lint`. Deps:
  `@plataforma/plugin-tasks@workspace:*`, `@plataforma/plugin-agent-harness@workspace:*`.
  DevDeps: `typescript@^5.8.0`, `vitest@^3.0.0`, `eslint@^9.0.0`, `typescript-eslint@^8.0.0`.
- **[CREATE]** `packages/plugin-dispatcher/tsconfig.json` — estende `tsconfig.base.json`,
  `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]`.
- **[CREATE]** `packages/plugin-dispatcher/src/types.ts` — `DispatcherConfig`, `DispatchItem`,
  `DispatchPlan`, `ProviderBalance`, `DispatchContext` (contratos da §1).
- **[CREATE]** `packages/plugin-dispatcher/src/selectModel.ts` — `selectModel()` (portado de
  `orquestrar.mjs` selectModel, adaptado para `SelectModelInput`).
- **[CREATE]** `packages/plugin-dispatcher/src/dispatcher.ts` — `planDispatch()`, `executeDispatch()`
  (portado/adaptado de `orquestrar.mjs` planDispatch, withLock, spawnAgent → runAgent).
- **[CREATE]** `packages/plugin-dispatcher/src/index.ts` — re-exporta `selectModel`, `planDispatch`,
  `executeDispatch`, tipos.
- **[CREATE]** `packages/plugin-dispatcher/tests/selectModel.test.ts` — vitest, 6+ casos (§4).
- **[CREATE]** `packages/plugin-dispatcher/tests/dispatcher.test.ts` — vitest, 5+ casos (§4).

## 4. Estratégia de Testes
- [x] **Framework:** `vitest` (padrão do monorepo).
- [x] **Ambiente:** Node puro. `TaskServicePort` mockado (`vi.fn()`), `runAgent` mockado (não chama
  LLM real). `DispatcherConfig` fixture derivada de `orquestrador.config.json`.
- [x] **Fora de Escopo:** Provider real / LLM. Integração real com plugin-tasks ou
  plugin-agent-harness (são pacotes separados, testados independentemente).

### Casos de teste: selectModel (6)
1. Nível `haiku` com pool cheio → retorna primeiro modelo do roster `byLevel.haiku`.
2. Nível `sonnet` + `needsVision: true` → filtra por `by_capability.vision`, retorna primeiro
   da interseção.
3. Nível `sonnet` + `workerModel` igual ao primeiro da pool (`anti-pool` p/ review) → pula
   o modelo do worker, retorna o segundo.
4. Nível `haiku` com `brokeProviders` contendo o prefixo do único modelo → retorna
   `{ model: null, reason: "todos provedores sem saldo" }`.
5. Nível inexistente no roster → retorna `{ model: null, reason: "sem modelo para nível" }`.
6. `capacityTarget` ausente → default `sonnet` (testar que fallback funciona).

### Casos de teste: dispatcher (5)
7. `planDispatch` com 3 tasks prontas e `maxConcurrent: 2` → planned=2, skipped=1 (slot limit).
8. `planDispatch` ordena por prioridade: task `review` antes de `work`, `work` antes de `harden`.
9. `planDispatch` com task cujo `reworkCount >= maxReviewCycles` → skipped (circuit breaker).
10. `executeDispatch` com `transition('start')` bem-sucedido → `runAgent` é chamado com
    `RunOptions` contendo `taskId`, `model`, `cwd`.
11. `executeDispatch` com `transition('start')` rejeitando (task já em execução) → não chama
    `runAgent`, propaga erro ou retorna graceful.

## 5. Instruções de Execução
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** reimplementar `spawnAgent` do orquestrar.mjs — execução é via `run()` do
>   plugin-agent-harness (in-process, não spawn de processo).
> - **NÃO** ler arquivos `.json` de ledger do Docs — tasks vêm via `TaskServicePort.listTasks()`.
> - **NÃO** importar `node:fs`/`node:child_process` — lock é via `transition('start')`, não
>   filesystem (`mkdir` lock).
> - **NÃO** modificar `packages/plugin-tasks/` nem `packages/plugin-agent-harness/` — são
>   pacotes separados, fora de escopo.
> - **NÃO** incluir kill-switch `EMERGENCY_DISABLE_SPAWN` — o dispatcher é desenhado limpo desde
>   o início.
> - **NÃO** portar `assemblePrompt()` — quem monta o prompt é quem chama `run()` (o dispatcher
>   só passa `prompt` pelo `RunOptions`), ou o próprio agent-harness.

### Pegadinhas conhecidas
- **LEDGER → TASK SERVICE:** `planDispatch` no orquestrar.mjs recebe um `ledger` (array de objetos
  com `busy`, `next_action`, `deps_ok`, `rework_count`, `capacity_target`, `ui`, `worker_model`,
  `id`). No dispatcher, esses campos vêm do `Task` retornado por `listTasks()` do plugin-tasks.
  Mapear corretamente: `task.status` (não `busy`), `task.status === 'ready'` (não `deps_ok`), etc.
- **LOCK VIA TRANSITION:** `executeDispatch` deve chamar `taskService.transition(taskId, 'start',
  'plugin-dispatcher', msg)` como lock. Se a transição lançar `GuardError` ou `TransitionError`,
  significa que outra instância já pegou a task — `executeDispatch` deve capturar e retornar sem
  chamar `runAgent` (não propagar como exceção). Isso substitui o `withLock` do orquestrar.mjs.
- **CWD:** `DispatchItem.cwd` deve ser `'C:\\Dev2026\\superapp'` para actions `work`/`rework`
  (worktree do superapp), e o cwd do Docs para `review`/`harden`/`promote`. Replicar a lógica de
  `planDispatch` L147-149.

1. **[TDD]** Criar `tests/selectModel.test.ts` com casos 1–6.
2. **[TDD]** Criar `tests/dispatcher.test.ts` com casos 7–11.
3. Criar `src/types.ts` — todas as interfaces da §1.
4. Criar `src/selectModel.ts` — portar de `orquestrar.mjs:61-100`, adaptar para `SelectModelInput`.
5. Criar `src/dispatcher.ts` — `planDispatch()` (portar de `orquestrar.mjs:103-163`) +
   `executeDispatch()`.
6. Criar `src/index.ts` — re-exports.
7. Rodar `pnpm --filter @plataforma/plugin-dispatcher test` até 11/11 verde.
8. Rodar `build` + `lint`. Gate (§7) → §8.

## 6. Feedback de Especificação
> **Todas as decisões de desenho DERIVADAS de fonte (CITE OU ESCALE):**

### Derivado (com fonte)
- `DispatcherConfig` ← `tasks/orquestrador.config.json` — campos 1:1 com keys camelCase.
- `selectModel(task, config, brokeProviders)` assinatura/comportamento ← `orquestrar.mjs L61-100`
  (filtro por nível, capability, anti-pool worker, brokeProviders).
- `planDispatch(ledger, config, balances, runningCount)` assinatura ← `orquestrar.mjs L103-163`
  (slots, prioridade, circuit breaker, selectModel por task).
- Lock via `transition('start')` ← EST-03d §1 (`transition()` com GuardError se inválido) +
  EST-03b (máquina de estados: `ready → in_progress` só permite se status atual = `ready`).
- `executeDispatch` (lock + run) substitui `spawnAgent` + `withLock` `orquestrar.mjs L230-316`.
- `runAgent` assinatura `(opts: RunOptions) => Promise<AgentRunResult>` ← EST-06 §1
  (`RunOptions` + `AgentRunResult` definidos em EST-06, derivados de ADR-0008 +
  agentAdapter.mjs).
- Task state fields mapeados de `Task.status` (EST-03a `TaskStatus` union) ← EST-03a §1.
- Sem kill-switch (`EMERGENCY_DISABLE_SPAWN`) ← decisão de design: o orquestrar.mjs tinha o
  kill-switch por comportamento incorreto histórico; o dispatcher novo é desenhado limpo.
- CWD por action ← `orquestrar.mjs L147-149`.

### Decisões em aberto (NENHUMA)
**Zero decisões em aberto.** Todos os contratos derivam de:
- `orquestrar.mjs` (lógica existente, testada)
- `orquestrador.config.json` (config existente)
- EST-03d (TaskServicePort, done)
- EST-06 (run/AgentRunResult, in_progress mas contratos derivados de ADR-0008 + agentAdapter.mjs,
  fontes estáveis)

> **Nota sobre EST-06 (in_progress):** os contratos `RunOptions`, `AgentRunResult`, `run()` estão
> definidos na spec de EST-06 §1 com fontes rastreáveis (ADR-0008 + agentAdapter.mjs). Se EST-06
> alterar essas assinaturas durante implementação, EST-07 precisará de reendurecimento (JIT, com
> dep `done`).

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
O Worker deve colar a saída literal destes comandos na Seção 8 (Handover):
```bash
pnpm --filter @plataforma/plugin-dispatcher build
pnpm --filter @plataforma/plugin-dispatcher test
pnpm --filter @plataforma/plugin-dispatcher lint
```
Todos devem retornar Exit Code 0. **Lint faz parte do gate** (Regra 3 do CLAUDE.md).

### Checklist do Reviewer
- [ ] `selectModel()` implementa filtro por nível, capability, anti-pool (worker), brokeProviders?
- [ ] `planDispatch()` respeita `maxConcurrent`, priority, circuit breaker?
- [ ] Lock usa `transition('start')` (não filesystem `mkdir`)?
- [ ] `executeDispatch()` captura `GuardError`/`TransitionError` graceful (não trava o dispatcher todo)?
- [ ] Nenhum `import` de `node:fs`/`node:child_process` no dispatcher?
- [ ] Sem kill-switch `EMERGENCY_DISABLE_SPAWN`?
- [ ] 11 testes (6 selectModel + 5 dispatcher) verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- `src/types.ts` — DispatcherConfig, DispatchItem, DispatchPlan, TaskServicePort, TaskView, DispatchContext, DispatcherRunOptions
- `src/selectModel.ts` — portado de orquestrar.mjs L61-100 (nível, capability, anti-pool, brokeProviders)
- `src/dispatcher.ts` — planDispatch (slots, prioridade, circuit breaker, selectModel) + executeDispatch (lock via transition('start'), runAgent)
- `tests/selectModel.test.ts` — 7 casos (nível, vision, anti-pool, brokeProviders, nível inexistente, default)
- `tests/dispatcher.test.ts` — 5 casos (slots, prioridade, circuit breaker, execução com sucesso, lock rejeitado)
- Lock via `taskService.transition('start')` — captura erro gracefully, não usa node:fs/node:child_process
- Sem kill-switch EMERGENCY_DISABLE_SPAWN
- Adicionado `@types/node` como devDep para resolver build de dependências transitivas

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/plugin-dispatcher build
$ tsc
(Exit Code 0)

$ pnpm --filter @plataforma/plugin-dispatcher test
$ vitest run
 ✓ tests/selectModel.test.ts (7 tests) 3ms
 ✓ tests/dispatcher.test.ts (5 tests) 18ms

 Test Files  2 passed (2)
      Tests  12 passed (12)
(Exit Code 0)

$ pnpm --filter @plataforma/plugin-dispatcher lint
$ eslint src/
(Exit Code 0)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-dispatcher sucessor orquestrar.mjs, capacity=sonnet, depende de EST-02/03/06 (draft)
- **[2026-07-07T13:18]** - *big-pickle* - `[Endurecido]`: endureceu spec: contratos derivados de orquestrar.mjs, orquestrador.config.json, EST-03d, EST-06
- **[2026-07-07T13:46]** - *system* - `[Auto-promovida]`: dep EST-06 concluída
- **[2026-07-07T14:04]** - *deepseek* - `[Iniciado]`: iniciando implementacao do plugin-dispatcher
- **[2026-07-07T14:13]** - *deepseek* - `[Finalizado]`: plugin-dispatcher: selectModel (7 tests) + planDispatch/executeDispatch (5 tests); 12/12 pass, build+lint verdes
- **[2026-07-07T14:15]** - *agile_reviewer:minimax* - `[Em revisão]`: revisando
