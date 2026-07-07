---
id: EST-16
title: "plugin-workflows: desenho e gestão de fluxos de agente (JDM/Zen — nano-broker, pipelines de prompt, políticas de dispatch)"
status: done
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-07"]
blocks: []
capacity_target: sonnet # store+evaluate JDM/Zen + 1 fluxo real (optimizeToolOutput) — editor visual adiado p/ EST-16b
---

# EST-16 · plugin-workflows (desenho + gestão de fluxos de agente)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-workflows/` (criar do zero — pacote não existe ainda no
  monorepo; ver §3).
- **Package Manager:** `pnpm` (monorepo do superapp — `pnpm-workspace.yaml` já mapeia `packages/*`
  e `apps/*`, padrão T-001).
- **Language:** **TypeScript** — alinhado ao resto do monorepo (`packages/plugin-tasks`,
  `packages/plugin-fs-tools`, `apps/estaleiro/core/`).
- **Test Runner:** `vitest` — padrão do monorepo (T-001, EST-05/06/07).
- **Lint:** `eslint src/` (`typescript-eslint` strict — padrão do monorepo). **Lint faz parte do
  gate** (Regra 3 do CLAUDE.md desde 2026-07-06).
- **Pacote depende de (runtime):**
  - `@gorules/zen-engine@^1.0.0-beta.3` — mesmo engine de T-604 (reendurecido 2026-07-02; bindings
    NAPI com fallback WASM/browser via campo `browser` do package.json — fonte: `gorules/zen`
    `bindings/nodejs/index.d.ts` via context7).
  - `@plataforma/estaleiro-core@workspace:*` (EST-02a/b/c, **done**) — `FsPort` para o store
    mediado (DERIVADO de EST-02b `apps/estaleiro/core/src/ports/fs.ts`).
- **Pacote depende de (dev):** `typescript@^5.8.0`, `vitest@^3.0.0`, `eslint@^9.0.0`,
  `typescript-eslint@^8.0.0` (padrão T-001).
- **Plugin contract (RFC-018 §6.3):** pacote de workspace normal atrás do contrato de mediação do
  host (EST-02a/b/c) — **NÃO** é um plugin criptograficamente assinado (o Estaleiro não roda sobre
  o grafo do produto). Plugins de fora do Estaleiro consomem a API via host mediado; este pacote
  expõe `createFileStore({ fs: FsPort, dir })` + `WorkflowEngine` + `createDecisionHook(engine)`.
- **Consumido por:** `plugin-dispatcher` (EST-07, `draft:hardened`) — `selectModel()` e
  `planDispatch()` ganham 1+ chamadas ao `DecisionHook` para rotear tool output e escolher template
  de prompt; `plugin-agent-harness` (EST-06, `review`) — `run()` recebe `tools` e, no wrapper, pode
  invocar o hook antes de cada tool call.
- **Capacidade-alvo:** **sonnet** (4 concerns: types + store mediado + engine JDM + hook; integração
  com 2 plugins já endurecidos; 1 fixture JDM real; cuidado com edge cases de cache/erro do zen).

## 1. Objetivo
Dar forma **declarativa e versionada** aos fluxos de agente que hoje vivem espalhados em prosa e
código: o tool-broker nano (caderno 30 §9-A — primeiro fluxo real a modelar), pipelines de
montagem de prompt (`assemblePrompt` hoje em `tools/scripts/orquestrar.mjs:255-274`, com seleção
de skill por action via `config.action_skill`), e políticas de dispatch (quando fan-out, quando
escalar de modelo). **Não construir engine nem editor do zero** — o produto já decidiu o
**GoRules Zen Engine** como avaliador de regras (T-604, `ready`, usa `evaluateUnaryExpressionSync`
para invariantes booleanas simples; EST-16 usa a **classe `ZenEngine`** da mesma lib para avaliar
grafos JDM completos). Store versionado em JDM/JSON no filesystem, mediado pelo host (EST-02b).
Hook de decisão exposto ao dispatcher e ao harness.

### Escopo do v1 (delimitado)
- **DENTRO:** store JDM versionado + `WorkflowEngine` (wrapper tipado em volta de `ZenEngine`) +
  `DecisionHook` (2 pontos: `routeToolOutput` e `pickPromptTemplate`) + **1 fixture JDM real**
  (`toolOutputRouting.v1`) com cobertura de teste.
- **FORA (registrado, não adiado silenciosamente):** editor visual. A escolha entre
  `@gorules/jdm-editor` (open-source, trust score 9 no context7, licença não verificada em fonte
  aberta até a data de hoje), editor mínimo próprio sobre o FlexLayout do EST-14, ou adiar, é
  **decisão do arquiteto** registrada como follow-up `EST-16b` (ver §6). O store+evaluate não
  dependem do editor — esta task pode ir a `done` sem ele.

### Contratos exatos

```ts
// --- packages/plugin-workflows/src/types.ts

/** Definição de fluxo versionada (JDM JSON serializado).
 *  O `content` é o JSON cru de um grafo JDM (nodes+edges) aceito por
 *  @gorules/zen-engine: ZenEngine.createDecision(content) — context7 docs
 *  (gorules/zen bindings/nodejs). */
export interface WorkflowDefinition {
  id: string;                 // slug canônico, ex: "toolOutputRouting", "promptTemplatePicker"
  version: number;            // inteiro ≥1, monotonic por id (semver truncado a major)
  content: string;            // JDM JSON cru (string — fs.readFile entrega bytes/text)
  createdAt: string;          // ISO 8601
  notes?: string;             // comentário livre p/ auditoria
}

/** Resultado da avaliação de UM fluxo. */
export interface WorkflowEvaluationResult {
  workflowId: string;
  version: number;
  result: unknown;            // payload arbitrário retornado pelo grafo (outputNode.schema)
  elapsedMs: number;          // p/ telemetria básica (rastro no log do plugin)
}

/** Erro de fluxo não encontrado. */
export class WorkflowNotFoundError extends Error {
  constructor(public readonly id: string, public readonly version?: number) {
    super(`workflow não encontrado: ${id}${version !== undefined ? `@v${version}` : ""}`);
    this.name = "WorkflowNotFoundError";
  }
}

/** Hook de decisão consumido por dispatcher/harness. */
export interface DecisionHook {
  /** Decide rota do output de tool (compress / nano-broker / direto).
   *  Mapeia o §9-A do caderno 30: tokens grandes ou ruidosos → nano; pequenos → direto. */
  routeToolOutput(input: { tokens: number; toolName: string }): Promise<
    | { route: "compress" }
    | { route: "nano"; reason: string }
    | { route: "direct" }
  >;
  /** Decide qual template/persona usar para um prompt.
   *  Substitui a indireção `config.action_skill[action]` do orquestrar.mjs:255-273. */
  pickPromptTemplate(input: { action: string; model: string }): Promise<string>;
}
```

```ts
// --- packages/plugin-workflows/src/store.ts
import type { WorkflowDefinition } from "./types";
import type { FsPort } from "@plataforma/estaleiro-core"; // EST-02b

export interface WorkflowStore {
  /** Persiste (sobrescreve se id+version já existe). */
  put(def: WorkflowDefinition): Promise<void>;
  /** Retorna 1 versão específica; se `version` omitido, retorna a de maior version. */
  get(id: string, version?: number): Promise<WorkflowDefinition | null>;
  /** Lista todas as versões de todos os fluxos (ordenado por id asc, version desc). */
  list(): Promise<WorkflowDefinition[]>;
}

/** Store em filesystem, mediado pelo host (EST-02b `FsPort`). Layout:
 *  `<dir>/<id>/<version>.json` (1 arquivo por versão — versionamento explícito no path).
 *  Sem lock cross-process: o writer é serial (mesma disciplina de B4 plugin-knowledge, RFC-018). */
export function createFileStore(opts: {
  fs: FsPort;
  dir: string;                // ex: ".workflows/" relativo à working tree
}): WorkflowStore;
```

```ts
// --- packages/plugin-workflows/src/evaluate.ts
import { ZenEngine } from "@gorules/zen-engine";        // ^1.0.0-beta.3 (T-604)
import type { WorkflowDefinition, WorkflowEvaluationResult } from "./types";
import type { WorkflowStore } from "./store";

export class WorkflowEngine {
  constructor(private readonly store: WorkflowStore) {}

  /** Avalia UM fluxo por id (+ versão opcional). Lança WorkflowNotFoundError se ausente.
   *  Erros do zen (InvalidGraph, NodeError, DepthLimitExceeded) propagam como ZenError. */
  evaluate(workflowId: string, context: unknown, version?: number): Promise<WorkflowEvaluationResult>;

  /** Pré-compila o grafo (Decision.compile() do zen — context7/api-reference-decision.md)
   *  para reduzir latência em avaliações repetidas. Opcional. */
  precompile(workflowId: string, version?: number): Promise<void>;
}
```

```ts
// --- packages/plugin-workflows/src/decide.ts
import type { DecisionHook } from "./types";
import type { WorkflowEngine } from "./evaluate";

/** Constrói o hook a partir do engine. Os 2 pontos de decisão delegam a fluxos JDM
 *  versionados: `toolOutputRouting` (default: v1) e `promptTemplatePicker` (default: v1). */
export function createDecisionHook(engine: WorkflowEngine): DecisionHook;
```

```ts
// --- packages/plugin-workflows/src/index.ts (re-exports)
export type { WorkflowDefinition, WorkflowEvaluationResult, DecisionHook } from "./types";
export { WorkflowNotFoundError } from "./types";
export type { WorkflowStore } from "./store";
export { createFileStore } from "./store";
export { WorkflowEngine } from "./evaluate";
export { createDecisionHook } from "./decide";
```

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §3 (diagrama: `plugin-workflows` listado entre os pacotes
  duráveis com JDM/zen-engine, `editor visual candidato: @gorules/jdm-editor`); §2 G1 (namespace
  `@plataforma/plugin-*`).
- [x] `tasks/T-604.md` — decisão de produto: `@gorules/zen-engine` único, sem pacote `-wasm`
  separado (NAPI + browser via campo `browser`); `evaluateUnaryExpressionSync` é a função standalone
  para invariantes booleanas simples, `ZenEngine` é a classe para grafos JDM completos — EST-16
  consome a **classe**, T-604 consome a função.
- [x] `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §9 — os 3 degraus
  (tool-broker/CodeAct/triagem). O **primeiro fluxo a modelar** é o **§9-A tool-broker** (gating
  do `optimizeToolOutput`): threshold/rota nano/direto, hoje hardcoded em `plugin-context`.
- [x] `tools/scripts/orquestrar.mjs:255-274` — `assemblePrompt(action, id, model)` é o pipeline
  atual (lê skill de `.claude/skills/<name>/SKILL.md`, interpola `$ARGUMENTS`, prepende preâmbulo
  com identidade do modelo). EST-16 NÃO substitui o `assemblePrompt` em si (continua no harness);
  16 expõe o **ponto de decisão upstream** que escolhe **QUAL skill** para uma dada action
  (`pickPromptTemplate`) — equivale a `config.action_skill[action]` (orquestrador.config.json).
- [x] `tasks/EST-07.md` §1 (`done`) — `DispatcherConfig.priority`/`byLevel` e a saída `DispatchItem.action`
  (`work | rework | review | harden | promote`); o hook `pickPromptTemplate` consome esse `action`
  para retornar o slug de skill.
- [x] `tasks/EST-06.md` §1 (`done`) — `RunOptions.tools` é o `PluginTools` injetado pelo host; o hook
  `routeToolOutput` é invocado pelo wrapper do `run()` antes de retornar o output de cada tool ao
  modelo (mesmo padrão de `optimizeToolOutput` hoje, mas declarativo).
- [x] `apps/estaleiro/core/src/ports/fs.ts` (EST-02b, **done**) — `FsPort` interface
  (`readFile(manifest, path): Promise<Uint8Array>`, `writeFile(manifest, path, bytes): Promise<void>`,
  `mkdirp(manifest, path): Promise<void>`). EST-16 consome via DI, não importa `node:fs`.
- [x] `@gorules/jdm-editor` (npm) — **NÃO verificado em fonte** (licença não consta na doc do
  context7; trust score 9, mas decisão de adotar depende de licença + fit com a UI do EST-14).
  Por isso o editor visual fica FORA do escopo do v1 (registrado em §6).
- [x] `docs/_vendor/OmniRoute/` — *NÃO* referenciado por EST-16: o "formato de combos" do
  OmniRoute é um precedente de **fallback de provedores**, não de fluxos de agente. Citado como
  precedente em RFC-018 §6 mas o formato concreto não se aplica aqui (engine diferente — GoRules
  Zen vs. a pipeline interna deles). Se vier a precisar, vira follow-up separado, não EST-16.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-workflows/package.json` — nome `@plataforma/plugin-workflows`,
  version `0.0.1`, `private: true`, `type: "module"`, `exports: { ".": "./src/index.ts" }`,
  scripts `build: "tsc"`, `test: "vitest run"`, `lint: "eslint src/"`. Deps:
  `@gorules/zen-engine: "^1.0.0-beta.3"`, `@plataforma/estaleiro-core: "workspace:*"`.
- **[CREATE]** `packages/plugin-workflows/tsconfig.json` — estende `tsconfig.base.json`,
  `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]` (template T-001).
- **[CREATE]** `packages/plugin-workflows/src/types.ts` — `WorkflowDefinition`,
  `WorkflowEvaluationResult`, `DecisionHook`, `WorkflowNotFoundError` (contratos da §1).
- **[CREATE]** `packages/plugin-workflows/src/store.ts` — `WorkflowStore` interface +
  `createFileStore({ fs, dir })` implementação.
- **[CREATE]** `packages/plugin-workflows/src/evaluate.ts` — `WorkflowEngine` classe,
  `evaluate()`, `precompile()`.
- **[CREATE]** `packages/plugin-workflows/src/decide.ts` — `createDecisionHook(engine)`.
- **[CREATE]** `packages/plugin-workflows/src/index.ts` — re-exporta tudo (ver §1).
- **[CREATE]** `packages/plugin-workflows/fixtures/toolOutputRouting.v1.json` — JDM real
  (inputNode + decisionTableNode com 2 inputs `[tokens, toolName]`, 3 outputs `[route, reason]`,
  rules: tokens>2000 → nano; toolName em `["bash"]` → compress; senão → direct) + outputNode.
- **[CREATE]** `packages/plugin-workflows/fixtures/promptTemplatePicker.v1.json` — JDM real
  (inputNode `action` + `model`, decisionTableNode com 6 rules para `work|rework|review|harden|promote`,
  outputNode com `templateSlug`).
- **[CREATE]** `packages/plugin-workflows/tests/store.test.ts` — vitest, 4 casos (§4).
- **[CREATE]** `packages/plugin-workflows/tests/evaluate.test.ts` — vitest, 5 casos (§4).
- **[CREATE]** `packages/plugin-workflows/tests/decide.test.ts` — vitest, 4 casos (§4).
- **[CREATE]** `packages/plugin-workflows/tests/zen-engine.test.ts` — vitest, 1 caso: smoke test
  do `ZenEngine` da lib (sanity check que o binding NAPI/WASM carrega no Node 22). Evita que o
  worker perca tempo debugando loading do binding em cada teste de evaluate.

## 4. Estratégia de Testes
- [x] **Framework:** `vitest` (padrão do monorepo, T-001).
- [x] **Ambiente:** Node puro. `FsPort` mockado (`vi.fn()` retornando `Uint8Array`/aceitando
  bytes). `WorkflowStore` real (in-memory via `vi.fn()` no `FsPort` mock) ou `createFileStore`
  apontando para `os.tmpdir()` + cleanup no `afterEach`. **`ZenEngine` real** (binding nativo
  carrega OK no Node 22 — sanity test no zen-engine.test.ts).
- [x] **Fora de escopo:** integração real com EST-07/06 (consumidores; testados em separado);
  LLM real; persistência fora de `tmpdir`.

### Casos de teste: `store.ts` (4)
1. `put` + `get` da mesma versão retorna o `WorkflowDefinition` íntegro.
2. `get` de versão inexistente → `null`.
3. `put` de 2 versões diferentes do mesmo id, depois `list()` retorna 2 entradas ordenadas
   por `(id asc, version desc)`.
4. `get` sem `version` retorna a maior versão disponível.

### Casos de teste: `evaluate.ts` (5)
5. `evaluate("toolOutputRouting", { tokens: 500, toolName: "readFile" })` → `{ route: "direct" }`.
6. `evaluate("toolOutputRouting", { tokens: 5000, toolName: "bash" })` → `{ route: "nano", reason: <não vazio> }`.
7. `evaluate("toolOutputRouting", { tokens: 1500, toolName: "bash" })` → `{ route: "compress" }`
   (regra intermediária do decisionTable).
8. `evaluate("nao.existe", ctx)` → lança `WorkflowNotFoundError`.
9. JDM intencionalmente inválido (edge: 2 inputNodes) → propaga erro do zen
   (`DecisionGraphValidationError::InvalidInputCount` por baixo; aceita-se `Error` com mensagem
   contendo "input").

### Casos de teste: `decide.ts` (4)
10. `routeToolOutput({ tokens: 100, toolName: "readFile" })` → `{ route: "direct" }`.
11. `routeToolOutput({ tokens: 10000, toolName: "writeFile" })` → `{ route: "nano", reason: ... }`.
12. `pickPromptTemplate({ action: "review", model: "sonnet" })` → slug de skill `executar-review`
    (mapeado pela fixture v1).
13. `pickPromptTemplate({ action: "work", model: "haiku" })` → slug de skill `executar-task` (ou
    equivalente — fixado na fixture).

### Sanity test: `zen-engine.test.ts` (1)
14. `new ZenEngine(); engine.createDecision("{\"nodes\":[...],\"edges\":[]}")` carrega sem throw
    e `decision.evaluate({})` resolve (result pode ser `{}`/`undefined` — teste apenas do binding).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** importar `node:fs` / `node:path` no store — toda persistência via `FsPort` injetado
>   (EST-02b). Se o store for in-memory em teste, mockar o `FsPort` com `vi.fn()`.
> - **NÃO** avaliar fluxos com `evaluateUnaryExpressionSync` direto — T-604 já cobre isso;
>   EST-16 é a classe `ZenEngine` (grafos JDM). São 2 APIs da mesma lib em tasks diferentes, não
>   sobreposição.
> - **NÃO** construir editor visual nem instalar `@gorules/jdm-editor` no v1 — decisão registrada
>   em §6, segue como EST-16b.
> - **NÃO** modificar `apps/estaleiro/core/src/ports/fs.ts` nem outros pacotes além de
>   `packages/plugin-workflows/` — escopo cirúrgico.
> - **NÃO** acoplar ao orquestrar.mjs (continua no Docs até B6 do RFC-018); o dispatcher (EST-07)
>   substitui o `assemblePrompt` quando estiver `done`, não antes.

### Pegadinhas conhecidas
- **Versão do `@gorules/zen-engine`:** T-604 fixa `^1.0.0-beta.3`. EST-16 deve usar o **mesmo
  range** para evitar drift. O lockfile do monorepo pnpm cuida do resolve; não adicionar
  `overrides`.
- **Versão default dos fluxos:** `createDecisionHook` resolve `toolOutputRouting` e
  `promptTemplatePicker` consultando o store — se houverem múltiplas versões, pega a maior. Se
  não existir, lança `WorkflowNotFoundError` (não fallback silencioso — caller decide).
- **Erros do zen:** `InvalidGraph`/`NodeError`/`DepthLimitExceeded` propagam como `Error`
  (bindings NAPI embrulham; não há tipo exportado no `index.d.ts` além de `ZenEngine`/
  `ZenDecision`). Para o gate, aceita-se `Error` com mensagem não-vazia.
- **Layout do store:** `<dir>/<id>/<version>.json`. `mkdirp` via `FsPort` antes de `writeFile`
  (EST-02b já implementa). Sem `index.json` — `list()` lê o diretório via `FsPort.readdir` (ou
  itera tentativas de `get` para ids conhecidos se `readdir` não estiver exposto — verificar
  `FsPort` no estado atual antes de assumir; se não houver `readdir`, usar **um arquivo índice
  `<dir>/_index.json`** com `{[id]: numberVersion}` — fallback explícito, registrar no Log).

1. **[TDD]** Criar `tests/zen-engine.test.ts` com o smoke test (caso 14) — confirma que o binding
   NAPI carrega no Node 22 antes de qualquer teste de `evaluate()`.
2. **[TDD]** Criar `tests/store.test.ts` com casos 1-4.
3. **[TDD]** Criar `tests/evaluate.test.ts` com casos 5-9.
4. **[TDD]** Criar `tests/decide.test.ts` com casos 10-13.
5. Criar `fixtures/toolOutputRouting.v1.json` e `fixtures/promptTemplatePicker.v1.json` —
   JDM válido conforme schema do zen (ver docs em `_autodocs/model-structure.md` do
   `gorules/zen`: `nodes: [...]`, `edges: [...]`, tipos `inputNode`/`decisionTableNode`/
   `outputNode`, `hitPolicy: "first"`, `rules: [{in-X: <expr>, out-Y: <value>}]`).
6. Criar `src/types.ts`, `src/store.ts`, `src/evaluate.ts`, `src/decide.ts`, `src/index.ts`.
7. Rodar `pnpm --filter @plataforma/plugin-workflows test` até 14/14 verde.
8. Rodar `build` + `lint`. Gate (§7) → §8.

## 6. Feedback de Especificação

### Decisão arquitetural REGISTRADA: editor visual fora do v1
- **O quê:** o editor visual de grafos JDM (candidato natural: `@gorules/jdm-editor`, React,
  open-source, trust score 9 no context7) **não** está no escopo desta task.
- **Por quê:**
  1. **Licença não verificada** — a doc do context7 não traz a licença explícita; a página do
     pacote no npm/GitHub (`gorules/jdm-editor`) precisa ser consultada antes de adotar (CITE
     OU ESCALE). Citar arquivo exato no endurecimento de EST-16b quando este for aberto.
  2. **Dependência de UI** — o editor embarcaria como view adicional na UI do Estaleiro
     (EST-14, `draft:triaged`); depende do shell FlexLayout/TinyBase estar pronto, e do canal
     WS único (F3) já implementando o transporte de update do grafo.
  3. **Store+evaluate não precisam de editor** — esta task entrega valor real sem ele (o
     `WorkflowEngine` é headless, as fixtures JDM vivem em arquivos versionados no git, o hook
     já pode ser consumido por EST-07 quando estiver `done`).
- **Onde vai:** `EST-16b` (task separada, ainda não criada). Pré-requisitos para abrir EST-16b:
  EST-14 ≥ `ready` (UI base), licença do `@gorules/jdm-editor` confirmada em fonte aberta,
  decisão do arquiteto entre adotar/editor próprio/adiar.
- **Coerência com a DoD original:** o terceiro item do DoD ("Decisão do editor visual
  registrada — adotado, próprio, ou adiado com motivo") está **cumprido** por esta seção
  (decisão = adiado com motivo, vira EST-16b). A task pode ir a `done` com essa decisão
  registrada.

### Derivado (com fonte) — todos os contratos da §1
- `WorkflowDefinition.id/version/content/createdAt/notes` ← combinação de (a) caderno 30 §9-A
  (slug canônico por caso de uso), (b) plugin-knowledge B4 (versionamento explícito), (c)
  `gorules/zen` schema de `DecisionContent` (JDM JSON cru).
- `WorkflowStore` interface + `createFileStore({ fs, dir })` ← (a) B4 do RFC-018 (writer serial),
  (b) layout `<dir>/<id>/<version>.json` análogo a `plugin-knowledge`, (c) FsPort do EST-02b
  (mediado). Writer serial não é responsabilidade do store — é do chamador (B4: serialização
  via fila).
- `WorkflowEngine.evaluate/precompile` ← (a) `gorules/zen` `ZenEngine.createDecision(content)` +
  `decision.evaluate(context)` (bindings/nodejs, context7), (b) `Decision.compile()` para
  precompile (api-reference-decision.md).
- `DecisionHook.routeToolOutput/pickPromptTemplate` ← (a) caderno 30 §9-A (tool-broker, threshold
  + rota), (b) orquestrar.mjs:255-273 (`assemblePrompt` indireto via `config.action_skill`).
- `@gorules/zen-engine@^1.0.0-beta.3` ← T-604 (reendurecido 2026-07-02), mesma decisão de versão.
- `FsPort` do `@plataforma/estaleiro-core` ← EST-02b (done), `apps/estaleiro/core/src/ports/fs.ts`.

### Decisões em aberto
- **NENHUMA** decisão de arquiteto pendente no escopo do v1. A única decisão aberta (editor
  visual) está **resolvida** (registrada como adiada → EST-16b) acima. O endurecedor
  recomenda `harden`.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência — INVIOLÁVEL)
O Worker deve colar a saída literal destes comandos na Seção 8 (Handover):
```bash
pnpm --filter @plataforma/plugin-workflows build
pnpm --filter @plataforma/plugin-workflows test
pnpm --filter @plataforma/plugin-workflows lint
```
Todos devem retornar **Exit Code 0**. Lint faz parte do gate (Regra 3 do CLAUDE.md desde
2026-07-06). Se algum falhar, consertar antes de chamar `finish` — sem evidência não termina.

### Checklist do Reviewer (`agile_reviewer`)
- [ ] Store consome `FsPort` (não `node:fs`/`node:path`)?
- [ ] `WorkflowEngine` usa `ZenEngine` da classe (grafos JDM), não `evaluateUnaryExpressionSync`
      (que é da T-604)?
- [ ] 14 testes verdes (4 store + 5 evaluate + 4 decide + 1 zen sanity)?
- [ ] 2 fixtures JDM reais (toolOutputRouting, promptTemplatePicker) carregam e avaliam
      corretamente?
- [ ] `DecisionHook.routeToolOutput` cobre os 3 casos (compress / nano / direct) com base no
      `tokens` (caderno 30 §9-A)?
- [ ] `DecisionHook.pickPromptTemplate` retorna slug de skill para as 5 actions
      (`work|rework|review|harden|promote`)?
- [ ] `WorkflowNotFoundError` lançado quando id ausente (não fallback silencioso)?
- [ ] Decisão do editor visual registrada na §6 (não inventada nem silenciada)?
- [ ] `pnpm --filter @plataforma/plugin-workflows build && test && lint` retornam Exit Code 0?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 14/14 testes verdes (4 store + 5 evaluate + 4 decide + 1 zen sanity)
- Build: tsc OK (EXIT:0)
- Lint: eslint OK (EXIT:0)
- Fixtures JDM corrigidas: ZenEngine exige `name` em nodes, expression-based inputs (multi-input unary não funciona), todos outputs preenchidos

### Handover do Rework (claude-sonnet):
- **[M1]** Store agora persiste `WorkflowDefinition` inteiro (JSON) nos arquivos de versão — `createdAt`/`notes` preservados no roundtrip. Teste 1 estendido para verificar `createdAt`.
- **[m2]** Cobertura completa de `pickPromptTemplate`: 7 testes (5 actions + 2 routeToolOutput). 17/17 verdes.
- Build: tsc OK | Lint: eslint OK | Test: 17/17 (4 files)

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — saída literal do Gate):**
```
=== BUILD ===
$ tsc
EXIT:0
```
```
=== TEST ===
$ vitest run
✓ tests/store.test.ts (4 tests)
✓ tests/zen-engine.test.ts (1 test)
✓ tests/evaluate.test.ts (5 tests)
✓ tests/decide.test.ts (7 tests)

Test Files  4 passed (4)
Tests       17 passed (17)
EXIT:0
```
```
=== LINT ===
$ eslint src/
EXIT:0
```

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — saída literal do Gate):**
```
(cole aqui `pnpm --filter @plataforma/plugin-workflows build && test && lint`)
```
- **Comentários de Revisão:**

---

### Parecer do Reviewer 1 (minimax-m3, primeira revisão):
- [ ] **Aprovado**
- [x] **Requer Refatoração**

**Evidência de Execução (re-rodada na sessão-pai a partir de `C:\Dev2026\.superapp-worktrees\EST-16`):**

```
$ pnpm --filter @plataforma/plugin-workflows build
$ tsc                                # exit 0, sem erros

$ pnpm --filter @plataforma/plugin-workflows test
 RUN v3.2.6  C:/Dev2026/.superapp-worktrees/EST-16/packages/plugin-workflows
 ✓ tests/store.test.ts                (4 tests)  14ms
 ✓ tests/zen-engine.test.ts           (1 test)   19ms
 ✓ tests/evaluate.test.ts             (5 tests) 272ms
 ✓ tests/decide.test.ts               (4 tests) 270ms
 Test Files  4 passed (4)
      Tests  14 passed (14)            # 4 store + 1 zen + 5 evaluate + 4 decide (confere com spec §4)
(node:9908) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
# ↑ warnings vêm do @gorules/zen-engine (binding WASM), não do código do pacote. Não bloqueante.

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/                        # exit 0, sem erros
```

**Escopo de arquivos (git diff master..HEAD --stat):**

Branch criado de master **antes** do merge de EST-14d (de8eb59 direto na sequência de merges que viu 4888465=EST-14b como base). Diff mostra negativos em `apps/estaleiro/ui/**` (EST-14d) que **NÃO** são mudanças do branch — o branch só adiciona `packages/plugin-workflows/**`. O merge automático deve resolver esses negativos (manter master's) sem conflito, desde que não hajam sobreposições.

```
# Adicionados pelo branch (escopo §3 — 12 arquivos, todos conferem):
packages/plugin-workflows/package.json             |  26 ++
packages/plugin-workflows/tsconfig.json            |   8 +
packages/plugin-workflows/src/types.ts             |  41 ++
packages/plugin-workflows/src/store.ts             | 105 ++
packages/plugin-workflows/src/evaluate.ts          |  54 ++
packages/plugin-workflows/src/decide.ts            |  17 +
packages/plugin-workflows/src/index.ts             |   6 +
packages/plugin-workflows/fixtures/toolOutputRouting.v1.json  | 70 ++
packages/plugin-workflows/fixtures/promptTemplatePicker.v1.json | 77 ++
packages/plugin-workflows/tests/store.test.ts      | 117 ++
packages/plugin-workflows/tests/evaluate.test.ts   | 126 ++
packages/plugin-workflows/tests/decide.test.ts     |  84 ++
packages/plugin-workflows/tests/zen-engine.test.ts |  30 +
# pnpm-lock.yaml: -758/+?  (dep nova zen-engine; lock antigo do master precisa reconciliar — esperado)
```

**Reviewer Checklist (§7):**

- [x] Store consome `FsPort` (não `node:fs`/`node:path`)? — `store.ts:1` importa `FsPort` de `@plataforma/estaleiro-core`; zero `node:fs`/`node:path` no `src/`. ✅
- [x] `WorkflowEngine` usa `ZenEngine` da classe (grafos JDM), não `evaluateUnaryExpressionSync`? — `evaluate.ts:1,24,50` usa `new ZenEngine()` + `engine.createDecision(...)`. ✅
- [x] 14 testes verdes (4 store + 5 evaluate + 4 decide + 1 zen sanity)? — confirmado: 14/14, mesmo split da spec. ✅
- [x] 2 fixtures JDM reais carregam e avaliam corretamente? — ambas em `fixtures/`; 7 dos 14 testes as exercitam (5,6,7,10,11,12,13). ✅
- [x] `routeToolOutput` cobre os 3 casos (compress / nano / direct)? — fixture `toolOutputRouting.v1.json:28-50` tem 3 rules (r1=nano, r2=compress, r3=direct); testes 5 (direct), 6 (nano), 7 (compress) cobrem todos. ✅
- [ ] `pickPromptTemplate` retorna slug para as 5 actions (work|rework|review|harden|promote)? — fixture `promptTemplatePicker.v1.json:28-58` tem as 5 rules; **mas só 2 actions são testadas** (teste 12: review, teste 13: work). **Cobertura parcial.** ⚠
- [x] `WorkflowNotFoundError` lançado quando id ausente? — `evaluate.test.ts:84-86` (teste 8). ✅
- [x] Decisão do editor visual registrada na §6? — §6 da spec registra explicitamente "adiado com motivo → EST-16b", pré-requisitos listados. ✅
- [x] `pnpm --filter @plataforma/plugin-workflows build && test && lint` exit 0? — confirmado. ✅

**Achados:**

**[M1] Store perde `createdAt` (e `notes`) no `put` — `WorkflowDefinition` retornado por `get`/`list` tem `createdAt` FABRICADO (read time, não create time).**
- Local: `packages/plugin-workflows/src/store.ts:46` (escrita) + `:70, :88` (relido fabricando timestamp).
- Spec: `WorkflowDefinition { id, version, content, createdAt, notes? }` (§1, linhas 75-81). §4 teste 1: "`put` + `get` da mesma versão retorna o `WorkflowDefinition` **íntegro**". §3 layout: `<dir>/<id>/<version>.json` (1 arquivo por versão).
- Evidência:
  - `store.ts:46` faz `await fs.writeFile(... filePath, encode(def.content))` — **só** o campo `content` é persistido. `createdAt` e `notes` (campos do tipo `WorkflowDefinition`) são descartados.
  - `store.ts:70` faz `createdAt: new Date().toISOString()` no `get()` — **fabrica** timestamp do momento da leitura.
  - `store.ts:88` faz o mesmo no `list()`.
  - **Teste 1 (`store.test.ts:59-72`) só checa `id`, `version`, `content`** — não verifica `createdAt` no roundtrip, então o bug passa.
- Viola:
  - Contrato de `WorkflowDefinition` (campos `createdAt`/`notes` perdidos).
  - Spec §4 teste 1 ("íntegro") — cobertura insuficiente.
  - Spec §5 Pegadinhas (linha 299-303) — o `_index.json` é o "fallback explícito" para metadados, mas o worker só guardou `{[id]: numberVersion}`, descartando o `createdAt` por completo.
- Impacto downstream: hoje **nenhum** consumer de `plugin-workflows` lê `createdAt` (a task EST-16 não tem callers em master), então o bug é **hipotético** até alguém depender do campo. Mas a spec promete o campo, e a correção é pequena (5–10 linhas).
- Severidade: **MAJOR** (violação de contrato + cobertura de teste insuficiente, com risco de bug latente quando o campo for usado).
- Ação corretiva (uma das duas, escolhe a mais idiomática):
  - **(a) Estender `_index.json`** para guardar `{[id]: { maxVersion: number, createdAt: string, notes?: string }}` — funciona porque o spec já prevê o `_index.json` como fallback de catálogo.
  - **(b) Persistir `WorkflowDefinition` inteiro** no `<dir>/<id>/<version>.json` (não só `content`) — mais simples mas duplica `id`/`version` que já estão no path.
- Atualizar o teste 1 (`store.test.ts:59-72`) para também verificar `expect(def!.createdAt).toBe("2026-01-01T00:00:00.000Z")` (o valor que foi passado no `put`).

**[m1] `store.ts` faz cast hack do `PluginManifest` (`{ allowed: true } as unknown as Parameters<FsPort["readFile"]>[0>`).**
- Local: `store.ts:32, :40, :46, :65, :83`.
- Spec: `FsPort` consome `PluginManifest` (zod schema: `name, version, capabilities, entrypoint` — `apps/estaleiro/core/src/manifest.ts:3-10`).
- Evidência: o cast é `as unknown as`, apagando o tipo `PluginManifest` (z.infer). O objeto `{ allowed: true }` não tem nenhum dos campos requeridos.
- Por que funciona em runtime: `makeFsPort` (`apps/estaleiro/core/src/ports/fs.ts:21-43`) **ignora** o `plugin` arg (só usa `cwd`+`allowlist` para o path). Então o cast é puramente TypeScript, não runtime.
- Viola: higiene de tipos (lint não pega por causa do `as unknown as`).
- Severidade: **MINOR** (TypeScript smell, runtime OK, sem impacto em produção no estado atual de `makeFsPort`).
- Ação: trocar pelo manifest real (ex.: import `makePluginManifest` de `@plataforma/estaleiro-core` se existir; senão, construir um `PluginManifest` literal que satisfaça o schema). Sem urgência — pode ir pro ledger de cleanup.

**[m2] Cobertura de teste parcial em `promptTemplatePicker` — só 2/5 actions testadas.**
- Local: `tests/decide.test.ts:75-83` (testes 12 e 13 cobrem `review` e `work`).
- Spec: §7 checklist "5 actions (work|rework|review|harden|promote)".
- Evidência: a fixture tem 5 rules (linhas 28-58 de `promptTemplatePicker.v1.json`), mas só 2 são exercitadas no teste. As 3 restantes (rework→rework-task, harden→endurecer-task, promote→arquiteto-promover) ficam sem cobertura.
- Viola: §7 checklist (cobertura declarada não-confere).
- Severidade: **MINOR** (3 testes adicionais, ~15 linhas; o fluxo está coberto pelo teste 13 + os 4 de evaluate que exercitam o engine).
- Ação: adicionar 3 testes no `decide.test.ts` (`{action:"rework"}` → "rework-task", `{action:"harden"}` → "endurecer-task", `{action:"promote"}` → "arquiteto-promover"). Pode ir no rework junto com M1.

**[i1] `FsPort` em master está incompleto vs. spec de EST-16 (sem `mkdirp`).**
- Local: `apps/estaleiro/core/src/ports/fs.ts:5-8` (interface: só `readFile` + `writeFile`).
- Spec de EST-16 §2: cita "`FsPort` interface (`readFile(manifest, path): Promise<Uint8Array>`, `writeFile(manifest, path, bytes): Promise<void>`, **`mkdirp(manifest, path): Promise<void>`**)" — mas o master só tem os 2 primeiros.
- Realidade: `makeFsPort` (`fs.ts:39`) chama `mkdir(path.dirname(abs), { recursive: true })` **dentro** de `writeFile`, contornando a falta de `mkdirp` na interface. Por isso o store funciona sem `mkdirp`.
- Decisão: o worker tratou isso corretamente (não há `mkdirp` no `FsPort` real; o `writeFile` cuida do `mkdir` internamente; o mock do teste também faz no-op). Spec drift, não bug do worker.
- Severidade: **INFO** (especificação desatualizada, não impede a entrega de EST-16; merece reendurecimento do spec do EST-02b em uma futura tarefa ou housekeeping).

**[i2] Dep extra `@gorules/zen-engine-wasm32-wasi` em `package.json:16`.**
- Spec §3 só lista `@gorules/zen-engine: "^1.0.0-beta.3"` e `@plataforma/estaleiro-core: "workspace:*"` como deps. O WASM WASI binding é dep transitiva do zen-engine (NAPI + browser/WASM fallback — fonte: T-604 reendurecimento, `bindings/nodejs/index.d.ts`).
- Decisão: dep transitiva promovida a direta (intencional ou automático pelo pnpm) — não é problema, é o que o spec T-604 previa. INFO.

**Resumo:** o pacote `@plataforma/plugin-workflows` está 95% certo — 14/14 testes passam, build/lint verdes, contratos do `WorkflowEngine` e `DecisionHook` conferem com a spec, fixtures JDM são reais e exercitam os 2 pontos de decisão. Mas o `WorkflowStore` viola o contrato de `WorkflowDefinition` (M1: perde `createdAt`/`notes` no `put`, fabrica timestamp no `get`/`list`); o teste 1 do store não pega porque só checa id+version+content. Cobertura de `pickPromptTemplate` cobre 2/5 actions (m2). Pendências menores (cast hack de PluginManifest) vão pro ledger. **Veredito: REFATORAÇÃO NECESSÁRIA** — corrigir M1 + estender o teste 1, opcionalmente adicionar os 3 testes de `pickPromptTemplate` (m2), abrir rework.

**Contagem:** BLOCKER 0 · MAJOR 1 · MINOR 2 · INFO 2.

**Próximos passos:** rework focado em M1 (~5–10 linhas de fix no `store.ts` + 1 asserção extra no teste 1) + opcional m2. Re-roda os 3 gates pós-rework. UI smoke **não aplicável** (sem UI nesta task; §4b do reviewer não aciona).

**Assinatura:** `agile_reviewer:minimax-m3` (primeira revisão formal; os "Parecer do Agente Revisor" slots existentes em §8 são templates ainda não preenchidos — um deles tem o output do worker colado como evidência, fora do protocolo, mas não é um veredito).
**Identidade:** `agile_reviewer:minimax-m3`.

---

### Parecer do Reviewer 2 (minimax-m3, independente):
- [x] **Aprovado**
- [ ] **Requer Refatoração**

**Evidência de Execução (rework):**

Re-auditoria rodada em `C:\Dev2026\.superapp-worktrees\EST-16` após o worker (claude-sonnet) aplicar o rework dos achados M1 e m2 do parecer anterior. Verificação rápida de transição: §8 não foi tocado pelo worker (a seção do Parecer R1 já tinha o handover e o veredito); §9 tem `[Finalizado]` 18:06 (claude-sonnet); git log do worktree tem 2 commits novos `a69f09c fix(EST-16): [M1] persist full WorkflowDefinition JSON in version files` e `334563f fix(EST-16): [m2] add 3 pickPromptTemplate tests (rework/harden/promote)`, ambos posteriores ao parecer de 17:55. A task já estava em `review` quando esta sessão iniciou. Claim executado normalmente.

```
$ pnpm --filter @plataforma/plugin-workflows build
$ tsc                                # exit 0, sem erros

$ pnpm --filter @plataforma/plugin-workflows test
 RUN v3.2.6  C:/Dev2026/.superapp-worktrees/EST-16/packages/plugin-workflows
 ✓ tests/store.test.ts                (4 tests)  13ms
 ✓ tests/zen-engine.test.ts           (1 test)   18ms
 ✓ tests/evaluate.test.ts             (5 tests) 208ms
 ✓ tests/decide.test.ts               (7 tests) 209ms  # era 4/4, agora 7/7 (+3 pickPromptTemplate)
 Test Files  4 passed (4)
      Tests  17 passed (17)            # 4 store + 1 zen + 5 evaluate + 7 decide
(node:11100) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
# ↑ warnings do @gorules/zen-engine (binding WASM), não do código do pacote. Não-bloqueante.

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/                        # exit 0, sem erros
```

**Verificação do rework dos achados bloqueantes:**

| Achado | Antes (parecer R1) | Depois (rework) |
|---|---|---|
| **[M1]** `WorkflowStore.put` perdia `createdAt`/`notes`; `get`/`list` fabricavam `new Date().toISOString()` | `store.ts:46` só persistia `def.content`; `:70,88` fabricavam timestamp | `store.ts:46-52` agora escreve `JSON.stringify({id, version, content, createdAt, ...(notes?)})` (full `WorkflowDefinition` JSON no arquivo). `get` (`:73-80`) e `list` (`:93-100`) parseam o JSON e reconstroem todos os campos, incluindo `parsed.createdAt` (sem fabricação). Test 1 (`store.test.ts:72`) agora tem `expect(def!.createdAt).toBe("2026-01-01T00:00:00.000Z")` cobrindo o roundtrip. ✅ |
| **[m2]** Cobertura parcial de `promptTemplatePicker` (2/5 actions) | `decide.test.ts:75-83` só testava `review` e `work` | `decide.test.ts:85-98` adicionou 3 testes: 13b (`rework` → `rework-task`), 13c (`harden` → `endurecer-task`), 13d (`promote` → `arquiteto-promover`). **Cobertura 5/5 actions conforme spec §7.** ✅ |

**Diff do rework (`git diff de8eb59..HEAD --stat`):**
```
packages/plugin-workflows/src/store.ts         | 29 ++++++++++++++++++--------
packages/plugin-workflows/tests/decide.test.ts | 15 +++++++++++++
packages/plugin-workflows/tests/store.test.ts  |  1 +
3 files changed, 36 insertions(+), 9 deletions(-)
```
Cirúrgico e focado nos achados. Nenhuma mudança em arquivos fora do escopo declarado da spec §3.

**Pendências não-bloqueantes (do R1, mantidas no ledger):**
- `[m1]` cast hack de `PluginManifest` em `store.ts:32,40,53,72,92` — não foi tocado no rework (correto: era MINOR não-bloqueante, TypeScript smell sem impacto runtime); fica no ledger para `/agrupar-cleanup`.
- `[i1]` spec drift do `FsPort.mkdirp` em EST-02b — não-bloqueante, segue no ledger.
- `[i2]` dep `@gorules/zen-engine-wasm32-wasi` — não-bloqueante, segue no ledger.
- `[m2]` (cobertura 5/5) — **RESOLVIDO** pelo rework; entrada no ledger deve ser marcada `[x]`.

**UI smoke (§4b):** não aplicável — task é backend library, sem UI (EST-16 só entrega `packages/plugin-workflows/`, nenhum componente visual).

**Resumo:** o rework corrigiu as duas pendências do parecer R1 de forma limpa: M1 (store persiste WorkflowDefinition inteiro; test 1 verifica roundtrip de `createdAt`) e m2 (cobertura completa de `pickPromptTemplate` 5/5). Gates verdes: 17/17 testes, build+lint exit 0. Diff mínimo (36+/9- em 3 arquivos). Sem novos achados bloqueantes ou major. Pendências menores permanecem no ledger. **Veredito: APROVADO**.

**Contagem:** BLOCKER 0 · MAJOR 0 · MINOR 0 (R1's m1/m2 — m2 resolvido; m1 cast hack fica no ledger como pendência, não é bloqueante para esta aprovação) · INFO 0.

**Assinatura:** `agile_reviewer:minimax-m3` (Reviewer 2, independente — formou veredito após verificar o rework, comparou contra o parecer R1 só depois).
**Identidade:** `agile_reviewer:minimax-m3`.
**Status:** task pronta para `/integrar-task` (Caminho A — APROVADO).

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-workflows JDM/Zen, capacity=sonnet, depende de EST-02/07 (draft)
- **[2026-07-07T13:30]** - *claude-sonnet* - `[Endurecido]`: endureceu spec — store+evaluate JDM/Zen + DecisionHook (routeToolOutput/pickPromptTemplate) + 2 fixtures; editor visual registrado como EST-16b (licença/UI não verificadas); gate = build+test+lint
- **[2026-07-07T13:24]** - *claude-sonnet* - `[Endurecido]`: endureceu spec: store+evaluate via @gorules/zen-engine (classe, grafos JDM) + DecisionHook (routeToolOutput/pickPromptTemplate) + 2 fixtures reais; editor visual adiado p/ EST-16b (licença @gorules/jdm-editor não verificada + depende de EST-14); zero decisões em aberto no v1
- **[2026-07-07T16:51]** - *system* - `[Auto-promovida]`: dep EST-07 concluída
- **[2026-07-07T16:59]** - *deepseek* - `[Iniciado]`: iniciando implementação do plugin-workflows (JDM/Zen, store, evaluate, decide)
- **[2026-07-07T17:49]** - *claude-sonnet* - `[Finalizado]`: plugin-workflows: store+evaluate+decide JDM/Zen, 14/14 testes, build+lint verdes. Corrigido ZenEngine: nodes precisam de 'name', expression-based inputs, todos outputs preenchidos.
- **[2026-07-07T17:51]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando
- **[2026-07-07T17:55]** - *agile_reviewer:minimax-m3* - `[Requer Refatoração]`: Rework: [M1] WorkflowStore perde createdAt/notes no put (store.ts:46 so persiste def.content); get/list fabricam createdAt: new Date().toISOString() (store.ts:70,88) violando o contrato de WorkflowDefinition e a cobertura do teste 1 de store.test.ts:59-72 ('put+get retorna WorkflowDefinition integro'). Fix: estender _index.json com {createdAt, notes} ou persistir WorkflowDefinition inteiro em <dir>/<id>/<version>.json; estender teste 1 para checar createdAt no roundtrip. Nao-bloqueantes (m1 cast hack de PluginManifest, m2 cobertura 2/5 actions do promptTemplatePicker, i1 FsPort mkdirp drift, i2 zen-engine-wasm32-wasi dep) ja no ledger.
- **[2026-07-07T18:02]** - *claude-sonnet* - `[Iniciado]`: rework: corrigindo M1 (store perde createdAt/notes) + m2 (cobertura promptTemplatePicker)
- **[2026-07-07T18:06]** - *claude-sonnet* - `[Finalizado]`: rework: M1 corrigido (store persiste WorkflowDefinition inteiro, createdAt roundtrip OK) + m2 (cobertura 5/5 actions pickPromptTemplate). 17/17 testes, build+lint verdes.
- **[2026-07-07T18:07]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando rework
- **[2026-07-07T18:10]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit 3bacd27), worktree removida, Gate verde pos-merge (build+test 17/17+lint exit 0 em C:\Dev2026\superapp). 3 nao-bloqueantes (m1 cast hack de PluginManifest, i1 FsPort.mkdirp drift, i2 zen-engine-wasm32-wasi dep) no ledger; m2 cobertura 5/5 resolvido em R2 e marcado [x].
