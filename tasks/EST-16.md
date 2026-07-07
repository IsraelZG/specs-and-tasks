---
id: EST-16
title: "plugin-workflows: desenho e gestão de fluxos de agente (JDM/Zen — nano-broker, pipelines de prompt, políticas de dispatch)"
status: draft:hardened
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
- [x] `tasks/EST-07.md` §1 — `DispatcherConfig.priority`/`byLevel` e a saída `DispatchItem.action`
  (`work | rework | review | harden | promote`); o hook `pickPromptTemplate` consome esse `action`
  para retornar o slug de skill.
- [x] `tasks/EST-06.md` §1 — `RunOptions.tools` é o `PluginTools` injetado pelo host; o hook
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
-

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — saída literal do Gate):**
```
(cole aqui `pnpm --filter @plataforma/plugin-workflows build && test && lint`)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-workflows JDM/Zen, capacity=sonnet, depende de EST-02/07 (draft)
- **[2026-07-07T13:30]** - *claude-sonnet* - `[Endurecido]`: endureceu spec — store+evaluate JDM/Zen + DecisionHook (routeToolOutput/pickPromptTemplate) + 2 fixtures; editor visual registrado como EST-16b (licença/UI não verificadas); gate = build+test+lint
- **[2026-07-07T13:24]** - *claude-sonnet* - `[Endurecido]`: endureceu spec: store+evaluate via @gorules/zen-engine (classe, grafos JDM) + DecisionHook (routeToolOutput/pickPromptTemplate) + 2 fixtures reais; editor visual adiado p/ EST-16b (licença @gorules/jdm-editor não verificada + depende de EST-14); zero decisões em aberto no v1
