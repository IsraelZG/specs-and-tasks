---
id: EST-08
title: "plugin-local-inference: substrato ORT in-process (modelo-como-dado), consumido por plugin-context e futuramente T-IA-01/T-IA-05"
status: ready
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: sonnet # substrato ORT in-process, modelo-como-dado, ADR-0011
---

# EST-08 · plugin-local-inference (substrato ORT in-process)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-local-inference/`. **Componente NOVO**, identificado
  durante a sessão de decisões do RFC-018 (não estava no esboço original) — separação entre
  "conector de API" (plugin-providers, HTTP) e "inferência dentro do próprio processo" (este
  plugin, sem rede, sem servidor externo).
- **Dependências de runtime (derivadas do ADR-0011 + POC context-bench.poc.mjs VIA 4/5):**
  - `onnxruntime-node` — ONNX Runtime nativo (Node.js 22 ARM64)
  - `@huggingface/transformers@^4.2.0` — tokenizer (AutoTokenizer via `@huggingface/transformers`;
    `env.cacheDir` em `~/.cache/orq15-hf/`)
- **Package name:** `@plataforma/plugin-local-inference` *(RFC-018 §3, G1)*
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest`
- **Capacidade-alvo:** sonnet (substrato ORT in-process, modelo-como-dado, integração multi-consumidor)

## 1. Objetivo
Extrair o mecanismo de inferência ONNX Runtime in-process já provado nos spikes ORQ-14/15
(sessão ORT, tokenizer, modelo-como-dado, EPs cpu/dml/webgpu) para um pacote **compartilhado**
(sob `@plataforma/`), em vez de embutido dentro do `plugin-context`. Hoje só a compressão
(LLMLingua-2) usa isso; a fila já tem dois outros consumidores planejados que vão precisar do
MESMO runtime: **T-IA-01** (embeddings) e **T-IA-05** (SLM do command palette). Um substrato só
evita 3 cópias do gerenciamento de sessão ORT.

### Contratos (derivados do POC `context-bench.poc.mjs` VIA 4/5 + ADR-0011)

```ts
// --- packages/plugin-local-inference/src/session.ts
import type { InferenceSession as OrtSession } from 'onnxruntime-node';

/** Execution Provider suportado neste hardware (ADR-0011 §Decisão B). */
export type ExecutionProvider = 'cpu' | 'dml';
//   cpu  → onnxruntime-node nativo, funcional (ARM64)
//   dml  → DirectML (Adreno X1-45), FALHA conhecida: 887A0005 device-removed
//   webgpu / qnn → follow-up (ADR-0011 §Decisão F), NÃO implementar aqui

/**
 * Opções de carregamento de sessão.
 * @param modelPath — Caminho absoluto para o .onnx (fora do repo, ex. ~/.cache/).
 * @param executionProviders — Provider(s) a tentar em fallback (default ['cpu']).
 *        Derivado do POC: `InferenceSession.create(path, { executionProviders })`
 */
export interface SessionOptions {
  executionProviders?: ExecutionProvider[];
  /** Inter/Intra op threads (default: 0 = ORT decide). */
  numThreads?: number;
  /** Cache dir para tokenizer HF (default: ~/.cache/orq15-hf/). */
  modelCacheDir?: string;
}

/**
 * Carrega (ou retorna do cache) uma sessão ORT.
 * Cache: Map<modelPath, InferenceSession> em processo — lifecyle = vida do host.
 *       (derivado do `_sessions` Map do POC)
 * Retorna null se o modelo não existe no path ou o EP falha.
 */
export function loadSession(modelPath: string, options?: SessionOptions): Promise<OrtSession | null>;

/** Libera uma sessão do cache (descarrega modelo da memória). */
export function unloadSession(modelPath: string): void;

// --- packages/plugin-local-inference/src/infer.ts
import type { InferenceSession } from 'onnxruntime-node';

/**
 * Inferência genérica: executa o grafo ONNX com os tensors de entrada.
 * Sem acoplamento a tokenização, threshold, compressão — é o substrate puro.
 * (Derivado do POC: `session.run(feeds)` que retorna `Record<string, Tensor>`)
 */
export function infer(
  session: InferenceSession,
  feeds: Record<string, unknown>,
): Promise<Record<string, unknown>>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §3 (nota "plugin-local-inference", diagrama revisado) — a decisão que criou este componente.
- [x] `docs/adr/0010-compressor-ml-onnx-in-process.md` e `docs/adr/0011-infra-de-inferencia-local.md` — os spikes que provaram o mecanismo: `onnxruntime-node`, modelo-como-dado, matriz de EPs (cpu funciona; dml falha no Adreno; qnn/webgpu são follow-up).
- [x] `tools/orchestrator/context-bench.poc.mjs` (VIA 4/5) — o código de referência (`onnxInit`, `onnxVia`) a generalizar para um substrato reusável (hoje é específico da bancada).
- [x] T-IA-01 (embeddings, `ready`) e T-IA-05 (SLM palette, `draft:triaged`) — os consumidores futuros; NÃO modificar essas tasks aqui, só garantir que a API deste substrato sirva a ambas.
- [x] EST-02a/b/c (`@plataforma/estaleiro-core`, `done`) — `PluginManifest` com capability "compute" (o consumo por plugins usa host mediation, mas o substrato em si é import direto, sem manifest).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-local-inference/package.json` — `@plataforma/plugin-local-inference`, deps: `onnxruntime-node`, `@huggingface/transformers@^4.2.0`
- **[CREATE]** `packages/plugin-local-inference/tsconfig.json` — estende `../../tsconfig.base.json`, outDir: `dist`, include: `["src"]`
- **[CREATE]** `packages/plugin-local-inference/src/session.ts` — `loadSession()`, `unloadSession()`, cache Map<path, session> (derivado do POC)
- **[CREATE]** `packages/plugin-local-inference/src/infer.ts` — `infer()` genérica (derivado do POC `session.run()`)
- **[CREATE]** `packages/plugin-local-inference/src/index.ts` — re-exporta `loadSession`, `unloadSession`, `infer`, tipos
- **[CREATE]** `packages/plugin-local-inference/tests/local-inference.test.ts` — testes com modelo fixture

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** vitest (Node puro).
- [x] **Ambiente do Teste:** Node 22 com `onnxruntime-node` instalado.
- [x] **Fora de Escopo:** Tokenização real (uso de modelo fixture), integração com consumidores (plugin-context/T-IA-01/T-IA-05), EP dml (falha conhecida só documentada).

**Casos de teste (enumerados):**
1. `loadSession` com path inválido → retorna `null` (sem crash).
2. `loadSession` com path válido (modelo ONNX de teste) → retorna `InferenceSession`.
3. `infer` executa forward pass: feeds com tensor dummy → retorna outputs (shape e tipo verificados).
4. `loadSession` idempotente: chamada repetida com mesmo path → retorna sessão em cache (mesma ref).
5. `unloadSession` remove do cache; `loadSession` após unload → carrega sessão nova.
6. `loadSession` com EP inválido/inexistente → retorna `null` (graceful, sem throw).
7. Type-check: `ExecutionProvider` é `'cpu' | 'dml'`; `SessionOptions` tipos explícitos.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente tokenização, compressão, threshold, agregação de palavra — isso é do plugin-context.
> - **NÃO** encorpe o modelo ONNX no repo — modelo é dado, em `~/.cache/` (ADR-0011).
> - **NÃO** adicione dependências além de `onnxruntime-node` e `@huggingface/transformers`.
> - **NÃO** invente formato de registro de modelos (ex.: arquivo JSON de registry) — o consumidor passa o path absoluto.
> - **NÃO** tente EP `dml` como default — só `cpu`. Se testar `dml`, documente a falha (ADR-0011 §Decisão B).

### Pegadinhas conhecidas
- `InferenceSession.create()` no POC recebe `{ executionProviders: ['cpu'] }` — array, não string.
- `ort.Tensor(type, data, dims)`: `type` é string (`'int64'`, `'float32'`); `data` é `BigInt64Array` ou `Float32Array`; `dims` é `number[]`.
- Sessões ORT ocupam ~200–600MB — o cache em processo é um `Map` (POC); NÃO adicione LRU/TTL (fora da §4, é extensão posterior).
- No Windows, `path.resolve()` normaliza separadores — use sempre paths absolutos normalizados como chave do cache.

1. **[TDD]** Crie `tests/local-inference.test.ts` com casos 1–7.
2. Crie `src/session.ts` — `loadSession` + `unloadSession` + cache Map.
3. Crie `src/infer.ts` — `infer(session, feeds)` delegando a `session.run()`.
4. Crie `package.json` — nome `@plataforma/plugin-local-inference`, deps ORT/HF.
5. Crie `tsconfig.json` — estende base, aponta `outDir: dist`, `include: ["src"]`.
6. Rode build + test + lint (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Todas as decisões de desenho DERIVADAS de fonte (CITE OU ESCALE):**
> - `loadSession` assinatura ← POC `onnxInit()`: `InferenceSession.create(path, {executionProviders})`
> - `infer` assinatura ← POC `session.run(feeds)` retornando `Record<string, Tensor>`
> - EP matrix ← ADR-0011 §Decisão B (cpu ✓, dml ✗ no Adreno)
> - Modelos como dados fora do repo ← ADR-0011 §Consequências
> - Cache Map em processo ← POC `_sessions` Map
> - `@plataforma/plugin-local-inference` ← RFC-018 §3, G1
> - `"compute"` capability no PluginManifest ← EST-02a
>
> **Decisões em aberto:** nenhuma. O substrato é puramente mecânico — toda decisão de execução (qual modelo, que EP, tokenização, algoritmo de compressão) é do consumidor.
>
> **Dependências:** EST-02 (decomposta em EST-02a/b/c, todas `done`) — o host de plugins está disponível. O substrato não consome o host diretamente (é import direto por packages consumidores).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `loadSession` carrega e cacheia sessão ORT?
- [ ] `infer` executa forward pass genérico?
- [ ] Modelo nunca commitado no repo (path externo `~/.cache/`)?
- [ ] Testes 1–7 verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/plugin-local-inference build
pnpm --filter @plataforma/plugin-local-inference test
pnpm --filter @plataforma/plugin-local-inference lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + test + lint (todos Exit Code 0) na Seção 8. Lint incluído desde 2026-07-06 após 3 reworks consecutivos por regressão (T-807, EST-02b, EST-02c; lint não pode ser descoberto só no review).

### Checklist do Reviewer
- [ ] Contratos da §1 seguem exatamente o padrão do POC (não inventa abstração nova)?
- [ ] `loadSession` retorna `null` em fallback (nunca throw)?
- [ ] Sem dependências além de `onnxruntime-node` + `@huggingface/transformers`?
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
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-local-inference ORT in-process, capacity=sonnet, depende de EST-02 (draft)
- **[2026-07-06T17:20]** - *deepseek* - `[Endurecido]`: endureceu spec — contratos TS derivados do POC+ADR-0011+RFC-018, casos de teste enumerados, gate build+test+lint
- **[2026-07-06T17:28]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
