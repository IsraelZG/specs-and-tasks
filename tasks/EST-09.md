---
id: EST-09
title: "plugin-context: migrar o otimizador do ORQ-13 (crusher+CCR+nano) e acrescentar tier LLMLingua-2 via plugin-local-inference"
status: done
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-08"]
blocks: []
capacity_target: sonnet # migra ORQ-13 + tier LLMLingua-2 via ORT
---

# EST-09 · plugin-context (move do ORQ-13 + tier LLMLingua-2)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-context/`. **Componente NOVO**, package `@plataforma/plugin-context` *(RFC-018 §3, G1)*.
- **Move de código/especificação do ORQ-13** (crusher estrutural + CCR store + nano-preprocess) — o otimizador que ORQ-13 descreve para `tools/orchestrator/` é CRIADO diretamente neste pacote, **não** movido de código existente (ORQ-13 está `ready`, código não existe em worktree ainda). O código de referência do mecanismo está em `tools/orchestrator/context-bench.poc.mjs` (PoC dos spikes ORQ-12/14/15) — porte a partir daí.
- **Dependências de runtime:**
  - `@plataforma/plugin-local-inference` (EST-08, `done`) — `loadSession`/`infer` para o tier L2.
  - `@huggingface/transformers@^4.2.0` — AutoTokenizer para tokenização L2 (necessário porque o substrato EST-08 não expõe tokenizer; o PoC também carrega tokenizer separado em `onnxInit`).
  - `ai` + `@ai-sdk/openai` — nano-preprocess (mesmo padrão do PoC: `generateText` com provider deepseek; não depende de `plugin-providers` que é EST-10, task futura).
  - `vitest` (devDep) — test runner.
- **Dependências de runtime exclusivas do L2 (não mover para o package.json a menos que o consumidor exija):** `onnxruntime-node` NÃO é dep direta — é encapsulado por `@plataforma/plugin-local-inference`; o tokenizer `@huggingface/transformers` sim é dep direta.
- **Modelo L2 em `~/.cache/orq15-llmlingua2/model.onnx`** (ADR-0011 §Decisão D — fora do repo, modelo-como-dado).
- **Tokenizer L2:** `KatawaDead/llmlingua-2-bert-base-multilingual-cased-meetingbank-onnx-int8` (HuggingFace), cache em `~/.cache/orq15-hf/`.
- **Vocab L2:** `~/.cache/orq15-llmlingua2/vocab.txt` — para agregação por palavra (`##` subword prefix, ADR-0011 §Decisão D).
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes).
- **Test Runner:** `vitest` (consistente com EST-08 e os demais EST-*).
- **Capacidade-alvo:** sonnet (migração ORQ-13 + tier L2 novo com ORT + multi-arquivo).

## 1. Objetivo
Criar o pacote `packages/plugin-context/` com o otimizador de contexto (ladder de compressão ADR-0009/0011) que será consumido pelo harness de agente (`plugin-agent-harness`, EST-06) e, eventualmente, pelo `plugin-dispatcher` (EST-07). O ladder segue a ordem: **crusher estrutural → LLMLingua-2 → nano-preprocess → CCR store** *(derivado de ADR-0011 §Decisão E)*.

Contém quatro módulos e um orquestrador:
1. **CCR store** — store reversível por hash em disco (portado do PoC `localStore()`).
2. **Crusher estrutural** — colapso de linhas de mesma forma + JSON→CSV (E3, RFC-018 §2/E3).
3. **LLMLingua-2** — compressor extractivo ONNX via `plugin-local-inference` (NOVO, ADR-0011).
4. **Nano-preprocess** — sumarizador instruído via deepseek-flash (portado do PoC).
5. **`optimizeToolOutput`** — orquestrador do ladder com gating por tamanho >2k tok *(derivado de ADR-0009 §Decisão D)*.

### Contratos (todos DERIVADOS de fonte — CITE OU ESCALE)

```ts
// === packages/plugin-context/src/ccrStore.ts ===
// Deriva de: context-bench.poc.mjs:227-237 (localStore)
export interface CCRStore {
  stash(content: string): string;      // hash hex(12)
  retrieve(hash: string): string;      // throw se não existir
  dispose(): void;                     // limpa diretório temporário
}
export function createCCRStore(): CCRStore;

// === packages/plugin-context/src/crusher.ts ===
// Deriva de: context-bench.poc.mjs:56-72 (nativeCrush) + ORQ-13 §3 (kind routing)
// + RFC-018 §2/E3 (JSON→CSV)
export type CrushKind = 'code' | 'search' | 'text';

/**
 * Colapsa linhas de mesma forma (dígitos/hashes → #), preservando 1 exemplo + contagem.
 * kind='code' bypassa o crush (retorna intacto); default kind='text' crusha.
 */
export function crushStructural(text: string, kind?: CrushKind): string;

/**
 * JSON→CSV: transforma array-de-dicts em CSV header+rows.
 * Se input não é JSON array, retorna texto original inalterado.
 */
export function crushToCsv(jsonText: string): string;

// === packages/plugin-context/src/l2Compressor.ts ===
// Deriva de: context-bench.poc.mjs:145-192 (onnxVia para llmlingua2)
// + ADR-0011 §Decisão D (L2 domina kompress, word aggregation, window=510, threshold 0.7)
// Consome: EST-08 infer() + loadSession
import type { InferenceSession } from 'onnxruntime-node';
import type { AutoTokenizer } from '@huggingface/transformers';

export interface L2Options {
  session: InferenceSession;
  tokenizer: AutoTokenizer;
  vocab: string[];            // linhas do vocab.txt para agregação ##
  threshold?: number;         // default 0.7
  window?: number;            // default 510 (janela máxima do L2)
}

export interface L2Result {
  text: string;               // texto comprimido (tokens originais preservados, verbatim)
  keptPct: number;            // percentual de tokens mantidos
  ms: number;                 // latência da inferência (exclui tokenização)
  totalTokens: number;        // tokens de entrada antes da compressão
}

/**
 * Comprime texto usando LLMLingua-2 via ORT (logits [1,seq,2] → softmax idx1 = P(keep)).
 * Agrega por palavra (## subword) antes do threshold — ADR-0011 §Decisão D.
 */
export function compressL2(text: string, options: L2Options): Promise<L2Result>;

// === packages/plugin-context/src/nanoPreprocess.ts ===
// Deriva de: context-bench.poc.mjs:83-100 (nanoPreprocess)
import type { LanguageModel } from 'ai';

export interface NanoOptions {
  model: LanguageModel;             // deepseek-chat via @ai-sdk/openai
  store?: CCRStore;                 // se presente, stash original + marker no retorno
  cap?: number;                     // default 24000 chars (~6k tok)
}

export interface NanoResult {
  text: string;                     // sumário + marker opcional
  ms: number;
  hash?: string;                    // hash do original se store presente
  fullTok: number;                  // tokens estimados do original
}

export function compressNano(text: string, options: NanoOptions): Promise<NanoResult>;

// === packages/plugin-context/src/optimize.ts ===
// Deriva de: ORQ-13 §3 (optimizeToolOutput) + ADR-0011 §Decisão E (ladder order)
// + ADR-0009 §Decisão D (gating >2k tok)
import type { LanguageModel } from 'ai';
import type { InferenceSession } from 'onnxruntime-node';
import type { AutoTokenizer } from '@huggingface/transformers';

export interface OptimizeContext {
  kind?: CrushKind;
  nano?: LanguageModel;                       // se ausente, pula tier nano
  l2?: { session: InferenceSession; tokenizer: AutoTokenizer; vocab: string[] };
  store?: CCRStore;                           // se ausente, pula CCR + nano marker
}

/**
 * Orquestra o ladder completo: crusher → L2 → nano → CCR.
 * Gating: L2 e nano só rodam se output > 2000 tok (chars/4).
 * Ordem fixa (ADR-0011 §Decisão E): primeiro crusher (sempre, 0ms),
 * depois L2 (se houver contexto + >2k), depois nano (se houver + >2k),
 * por fim CCR stash (se store presente + >2k).
 */
export function optimizeToolOutput(out: string, ctx: OptimizeContext): Promise<string>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (E1, E3) e §3 (diagrama, plugin-context DEPENDE de plugin-local-inference, G1 namespace) — FONTE da ordem de construção, JSON→CSV, dependência explícita.
- [x] `tasks/ORQ-13.md` — spec completa do otimizador a portar: assinaturas `ccrStore`, `crusher`, `optimizeToolOutput`, test cases enumerados §4.
- [x] `tasks/EST-08.md` §1 — API `loadSession`, `infer`, tipos `ExecutionProvider`, `SessionOptions`, `InferenceSession` — o substrato ORT que o tier L2 consome.
- [x] `docs/adr/0009-otimizacao-de-contexto-agent-adapter.md` — veredito GO no padrão próprio in-process NO-GO proxy, gate >2k tok, CCR reversível.
- [x] `docs/adr/0011-infra-de-inferencia-local.md` §Decisão D/E — LLMLingua-2 domina kompress, ladder final (crusher→L2→nano→CCR), word aggregation, window 510, threshold 0.7.
- [x] `tools/orchestrator/context-bench.poc.mjs` — código de referência: `nativeCrush()` (linha 56), `localStore()` (linha 227), `nanoPreprocess()` (linha 83), `onnxInit()`/`onnxVia()` (linhas 124-192) — assinaturas a portar.
- [x] `docs/_vendor/headroom/headroom/transforms/smart_crusher.py` — inspiração para o crusher estrutural (mecanismo, não portar fiel; o shape-collapse do PoC já é suficiente). Fonte presente: `C:\Dev2026\Docs\docs\_vendor\headroom\headroom\transforms\smart_crusher.py`.
- [x] `docs/_vendor/OmniRoute/` — fonte para futuro 3º degrau (fora de escopo desta task, RFC-018 §6.6).
- [ ] **Modelo L2 real verificado presente** (pré-requisito dos testes): `ls ~/.cache/orq15-llmlingua2/model.onnx`. Se ausente, baixar instruções no Plano de Batalha.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-context/package.json` — `@plataforma/plugin-context`, deps: `@plataforma/plugin-local-inference`, `@huggingface/transformers@^4.2.0`, `ai`, `@ai-sdk/openai`; devDeps: `vitest`, `typescript`, `eslint`.
- **[CREATE]** `packages/plugin-context/tsconfig.json` — estende `../../tsconfig.base.json`, outDir: `dist`, include: `["src"]`.
- **[CREATE]** `packages/plugin-context/vitest.config.ts` — testTimeout: 30_000 (cold-start ORT, seguir padrão EST-08 §5b M4).
- **[CREATE]** `packages/plugin-context/src/index.ts` — re-exporta `createCCRStore`, `crushStructural`, `crushToCsv`, `compressL2`, `compressNano`, `optimizeToolOutput` e tipos.
- **[CREATE]** `packages/plugin-context/src/ccrStore.ts` — `createCCRStore()` → `CCRStore` (stash/retrieve/dispose) — portado do PoC `localStore()`.
- **[CREATE]** `packages/plugin-context/src/crusher.ts` — `crushStructural(text, kind?)` + `crushToCsv(jsonText)` — portado do PoC `nativeCrush()` + JSON→CSV (E3, RFC-018).
- **[CREATE]** `packages/plugin-context/src/l2Compressor.ts` — `compressL2(text, options)` — LLMLingua-2 via `loadSession`/`infer` (EST-08), tokenizer `@huggingface/transformers`, word aggregation `##` (portado do PoC `onnxVia` para llmlingua2).
- **[CREATE]** `packages/plugin-context/src/nanoPreprocess.ts` — `compressNano(text, options)` — portado do PoC `nanoPreprocess()` (AI SDK `generateText`).
- **[CREATE]** `packages/plugin-context/src/optimize.ts` — `optimizeToolOutput(out, ctx)` — orquestrador do ladder crusher→L2→nano→CCR com gating >2k tok.
- **[CREATE]** `packages/plugin-context/tests/ccrStore.test.ts` — testes do CCR store.
- **[CREATE]** `packages/plugin-context/tests/crusher.test.ts` — testes do crusher + JSON→CSV.
- **[CREATE]** `packages/plugin-context/tests/l2Compressor.test.ts` — testes do L2 (model-dependents, skipIf sem modelo).
- **[CREATE]** `packages/plugin-context/tests/nanoPreprocess.test.ts` — testes do nano (fake determinístico + opt-in real).
- **[CREATE]** `packages/plugin-context/tests/optimize.test.ts` — testes de integração do ladder.
- **[UPDATE]** `pnpm-workspace.yaml` (raiz) — adicionar `onnxruntime-node: true` ao bloco `allowBuilds:` se ainda não existir (já adicionado por EST-08; verificar antes de tocar).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- **Framework:** `vitest` (Node puro).
- **Ambiente:** Node.js 22+, `packages/plugin-context/`.
- **Fora de Escopo:** Testes de integração com plugin-agent-harness (EST-06) ou plugin-dispatcher (EST-07); testes com EP dml (falha conhecida, ADR-0011 §Decisão B).

### Casos enumerados

**ccrStore.test.ts (4 casos):**
1. `stash` + `retrieve` — stash(content) → hash; retrieve(hash) devolve byte-a-byte idêntico (derivado de ORQ-13 §4 caso 1 / PoC reversibilidade).
2. `retrieve` de hash inexistente → throw (derivado de ORQ-13 §4 caso 2).
3. `dispose` após stash → retrieve lança erro (store limpo).
4. `stash` de conteúdos diferentes → hashes diferentes (colisão SHA256 extremamente improvável).

**crusher.test.ts (5 casos):**
1. `crushStructural` — array JSON repetitivo colapsa ≥40% preservando 1 exemplo (derivado de ORQ-13 §4 caso 3 / PoC nativeCrush).
2. `crushStructural` — código `.ts`/`.mjs` com `kind='code'` retorna intacto (derivado de ORQ-13 §4 caso 4 / PoC kind routing).
3. `crushStructural` — listagem de diretório colapsa linhas de mesma forma com contagem `×N` (derivado de ORQ-13 §4 caso 5).
4. `crushToCsv` — JSON array de dicts → CSV header+rows (RFC-018 §2 E3).
5. `crushToCsv` — input não-JSON → retorna inalterado (graceful).

**l2Compressor.test.ts (4 casos):**
1. `compressL2` com sessão+tokenizer+vocab válidos → texto comprimido, keptPct < 100% (derivado de PoC `onnxVia` com llmlingua2 @0.7 — ADR-0011 mostra ~45% keep = 89% Δ na prosa).
2. `compressL2` com threshold=0.0 → keptPct ≈ 100% (tudo passa, prova que threshold funciona).
3. `compressL2` — output preserva tokens originais verbatim (extractivo, nunca alucina — ADR-0011 §Decisão C).
4. `compressL2` com sessão inválida → throw / erro claro (graceful).

**nanoPreprocess.test.ts (3 casos):**
1. `compressNano` com modelo fake determinístico → retorna texto (sem rede, sem custo) (derivado de ORQ-13 §4 caso 10 — fake determinístico).
2. `compressNano` com store presente → resultado contém hash do original.
3. `compressNano` — smoke opt-in com modelo real (`OPT_IN_NANO_REAL=1`, precisa de `DEEPSEEK_API_KEY` configurada) — SÓ RODA se env presente.

**optimize.test.ts (4 casos):**
1. `optimizeToolOutput` com output <2k tok → passa cru (sem L2, sem nano) (derivado de ORQ-13 §4 caso 6).
2. `optimizeToolOutput` com output >2k tok + L2 configurado → L2 aplicado (derivado de ORQ-13 §4 caso 8 adaptado para L2).
3. `optimizeToolOutput` com store presente → output contém hash + retrieve recupera original (derivado de ORQ-13 §4 caso 7).
4. `optimizeToolOutput` com store ausente → output sem hash (CCR opcional — ORQ-13 §4 caso 9).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** portar o codebase inteiro do Headroom — só o mecanismo do crusher + store (mesma disciplina de ORQ-13).
> - **NÃO** possuir lógica de sessão ORT — use `loadSession`/`infer` de `@plataforma/plugin-local-inference`.
> - **NÃO** implementar o 3º degrau do E1 (extração OmniRoute — session-dedup, relevance) — é task futura (RFC-018 §6.6).
> - **NÃO** depender de `plugin-providers` (EST-10) para o nano tier — o nano usa `ai`+`@ai-sdk/openai` direto (mesmo padrão do PoC).
> - **NÃO** encorpar modelo ONNX no repo — modelo-como-dado em `~/.cache/` (ADR-0011 §Consequências).
> - **NÃO** editar arquivos fora do Escopo de Arquivos listado na Seção 3.

### Pegadinhas conhecidas
- **L2 janela 510:** textos maiores que 510 tokens precisam ser chunkados (ou truncados); o PoC trunca para a janela máxima (`ids.slice(0, cfg.window)`). Documentar no L2Result se houve truncamento.
- **L2 logits-2class:** o output do modelo tem shape `[1, seq, 2]` — softmax no eixo 1 das 2 classes, P(keep) = softmax idx1 (código no PoC linha 167-173).
- **Aggregação por palavra:** usar vocab.txt onde tokens começando com `##` são continuação de palavra anterior — agrupar e usar prob média (PoC linha 176-188).
- **Cleanup do CCR store:** `dispose()` deve engolir erro (EBUSY/EPERM no Windows — mesmo padrão do PoC `try/catch`).
- **pnpm allowBuilds:** se `onnxruntime-node` ainda não estiver em `allowBuilds:` do `pnpm-workspace.yaml` (EST-08 já adicionou), adicionar.
- **vitest pool:** se ORT crashar com segfault, adicionar `test: { pool: 'forks' }` no `vitest.config.ts` (padrão EST-08 F1).

1. **[TDD]** Crie os arquivos de teste (ccrStore.test.ts, crusher.test.ts, l2Compressor.test.ts, nanoPreprocess.test.ts, optimize.test.ts) com os 20 casos enumerados.
2. Crie `src/ccrStore.ts` — porte `localStore()` do PoC (linha 227-237).
3. Crie `src/crusher.ts` — porte `nativeCrush()` do PoC (linha 56-72) + `crushToCsv()` para JSON→CSV.
4. Crie `src/l2Compressor.ts` — porte `onnxVia()` (linha 145-192) com word aggregation + threshold, consumindo `loadSession`/`infer` da EST-08.
5. Crie `src/nanoPreprocess.ts` — porte `nanoPreprocess()` do PoC (linha 83-100) com AI SDK.
6. Crie `src/optimize.ts` — orquestrador do ladder crusher→L2→nano→CCR com gating >2k tok.
7. Crie `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/index.ts`.
8. Rode build + test + lint (Seção 7) e cole saída.

## 5b. Plano de Batalha *(wargame opcional — pode ser preenchido por modelo forte antes da execução)*
> Pendente. Wargame recomendado (pós-hardened, pré-execução) para mapear bifurcações reais do ambiente (modelo ORT presente/ausente, cold-start, chunking L2).

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões DERIVADAS de fonte (CITE OU ESCALE):**

| Item | Fonte |
|---|---|
| `CCRStore` assinatura (stash/retrieve/dispose) | `context-bench.poc.mjs:227-237` (`localStore()`) |
| `crushStructural(text, kind)` assinatura | `context-bench.poc.mjs:56-72` (`nativeCrush`) + ORQ-13 §3 kind routing |
| `crushToCsv(jsonText)` | RFC-018 §2 E3 ("JSON→CSV: mais um transform do crusher") |
| `compressL2` pipeline | `context-bench.poc.mjs:145-192` (`onnxVia` para llmlingua2) |
| L2 threshold 0.7, window 510, wordAgg=true | ADR-0011 §Decisão D/E |
| `compressNano` assinatura | `context-bench.poc.mjs:83-100` (`nanoPreprocess`) |
| `optimizeToolOutput` assinatura + gating >2k tok | ORQ-13 §3 + ADR-0009 §Decisão D |
| Ladder ordem crusher→L2→nano→CCR | ADR-0011 §Decisão E |
| Dependência de `@plataforma/plugin-local-inference` | RFC-018 §3 (diagrama: plugin-context DEPENDE de plugin-local-inference) |
| `@plataforma/plugin-context` package name | RFC-018 §3, G1 |
| Modelo-como-dado (fora do repo) | ADR-0011 §Consequências |
| L2 como degrau entre crusher e nano (não runtime próprio) | ADR-0011 §Consequências: "ORQ-13 ganha um degrau novo barato" |

> **Decisões em aberto:** nenhuma. Todos os contratos derivam de fonte (PoC + ADR + RFC + EST-08). O design é puramente mecânico — portar código de referência e integrar com API já fixada da EST-08.

> **Dependências:** EST-02 (done), EST-08 (done) — ambas disponíveis para execução.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `CCRStore` implementado (stash/retrieve/dispose) e testes verdes?
- [ ] `crushStructural` com roteio por kind (code bypassa)?
- [ ] `crushToCsv` (JSON→CSV) implementado e testado?
- [ ] `compressL2` consumindo `loadSession`+`infer` de EST-08, com word aggregation e threshold?
- [ ] `compressNano` com AI SDK, gating >2k tok, opcional marker + hash?
- [ ] `optimizeToolOutput` orquestrando crusher→L2→nano→CCR?
- [ ] Modelo L2 nunca commitado no repo (path `~/.cache/`)?
- [ ] Sem dependência para `plugin-providers` (nano usa AI SDK direto)?
- [ ] Sem possessão de runtime ORT próprio (usa EST-08)?
- [ ] 20/20 casos de teste enumerados verdes (zero skip na máquina com modelo presente)?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/plugin-context build
pnpm --filter @plataforma/plugin-context test
pnpm --filter @plataforma/plugin-context lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + test + lint (todos Exit Code 0) na Seção 8. Lint incluído desde 2026-07-06 após 3 reworks consecutivos por regressão (T-807, EST-02b, EST-02c). Os 20 casos de teste DEVEM estar verdes; se algum caso pular por modelo ausente, registrar no §8 com justificativa e path do modelo.

### Checklist do Reviewer
- [ ] Contratos da §1 seguem exatamente as fontes citadas (PoC/ADR/EST-08)?
- [ ] `compressL2` nunca possui runtime ORT próprio (sempre consome EST-08)?
- [ ] Nano tier não depende de `plugin-providers` (EST-10)?
- [ ] `crushStructural` com `kind='code'` nunca destrói código?
- [ ] `crushToCsv` é seguro para entrada não-JSON (não crasha)?
- [ ] `pnpm build + test + lint` verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- CCR store (stash/retrieve/dispose), crusher (nativeCrush + crushToCsv), L2 compressor via EST-08, nano-preprocess, optimize ladder
- L2 usa loadSession/infer do EST-08 + AutoTokenizer HF + word aggregation `##`
- 19/19 testes verdes, 1 skipped (nano real smoke — requer API key)
- 3 testes L2 passaram (modelo ORT presente em `~/.cache/orq15-llmlingua2/`)
- Gate: build ✅ · test ✅ (19/19) · lint ✅
### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**

**Evidência de Execução (obrigatória):**
```
=== BUILD ===
$ pnpm --filter @plataforma/plugin-context build
$ tsc
(sem erros, exit code 0)

=== TEST ===
$ pnpm --filter @plataforma/plugin-context test
✓ tests/ccrStore.test.ts        (4 tests)        11ms
✓ tests/crusher.test.ts         (5 tests)         5ms
✓ tests/nanoPreprocess.test.ts  (3 tests | 1 skipped)  4ms
✓ tests/optimize.test.ts        (4 tests)         9ms
✓ tests/l2Compressor.test.ts    (4 tests)      1842ms
  ✓ l2Compressor > 1: compressL2 com modelo real → keptPct < 100%, texto comprimido 1387ms

Test Files  5 passed (5)
     Tests  19 passed | 1 skipped (20)
(Exit code 0)
```

```
=== LINT ===
$ pnpm --filter @plataforma/plugin-context lint
$ eslint src/
(sem warnings, exit code 0)
```

**Sondas adversariais (17 probes, 17/17 passaram):**

Sondas ad-hoc em `tests/probe.test.ts` (criado durante revisão, removido depois — arquivo de prova, não entregável):

| # | Categoria | Sonda | Resultado |
|---|---|---|---|
| 1 | ccrStore edge | stash de string VAZIA → hash 12-hex, retrieve devolve '' | ✓ |
| 2 | ccrStore edge | retrieve de hash inexistente → throw ENOENT (não silencioso) | ✓ |
| 3 | ccrStore edge | stash do MESMO conteúdo 2x → mesmo hash (idempotência) | ✓ |
| 4 | ccrStore edge | stash de string 1MB → retrieve preserva integridade (1000000 chars) | ✓ |
| 5 | ccrStore edge | dispose() 2x → não throw (idempotente, EBUSY/EPERM Windows) | ✓ |
| 6 | crusher edge | crushStructural texto VAZIO → '' | ✓ |
| 7 | crusher edge | crushStructural 1 linha só → retorna intacta | ✓ |
| 8 | crusher edge | crushToCsv array 1 dict → CSV "a\n1" (header + 1 row) | ✓ |
| 9 | crusher edge | crushToCsv string vazia → '' (não throw) | ✓ |
| 10 | crusher edge | crushToCsv JSON objeto (não array) → retorna inalterado | ✓ |
| 11 | crusher edge | crushToCsv valores com vírgula → CSV com aspas (escape) | ✓ |
| 12 | crusher edge | crushToCsv valores com aspas → aspas duplas duplicadas (RFC 4180) | ✓ |
| 13 | crusher edge | crushToCsv array de primitivos → retorna inalterado | ✓ |
| 14 | optimize edge | optimizeToolOutput input VAZIO → '' (crusher não crasha) | ✓ |
| 15 | optimize edge | L2 throws → catch silencioso, segue com crusher output | ✓ |
| 16 | optimize edge | nano throws → catch silencioso, segue com crusher output | ✓ |
| 17 | nano edge | compressNano é função, assinatura conforme §1 (model: LanguageModel) | ✓ |

> Probes 3 e 4 substituíram a sonda original "objeto circular JSON-stringified" — a sonda
> original era mal-formada (testava JSON.stringify no escopo de teste, não no CCR store).
> Store só recebe strings, nunca objetos. As 2 novas sondas testam propriedades reais
> (idempotência por hash + integridade de conteúdo grande).

**Inspeção de código (além do gate):**

- **Contratos §1 seguem as fontes citadas:** ✓
  - `CCRStore` derivada de `context-bench.poc.mjs:227-237` (stash/retrieve/dispose, hash hex 12).
  - `crushStructural` com `kind='code'` bypassa (linha 14) — código nunca é destruído.
  - `crushToCsv` graceful para entrada não-JSON (linha 52-54) — não crasha.
  - `compressL2` consome `loadSession`/`infer` de EST-08 (linha 3, 49) — sem runtime ORT próprio.
  - `compressNano` usa `ai`+`@ai-sdk/openai` direto (linha 1) — não depende de `plugin-providers` (EST-10).
  - `optimizeToolOutput` ladder crusher→L2→nano→CCR (linhas 24-57) com gate `>2k tok` (chars/4).
- **Word aggregation L2:** ✓ agrupa por prefixo `##` do vocab (l2Compressor.ts:72-81), threshold 0.7 default, window 510 default, com truncamento `slice(0, window)` se maior.
- **Logits 2-class:** ✓ softmax(idx1) = P(keep) corretamente implementado (l2Compressor.ts:62-69).
- **CCR store cleanup:** ✓ `dispose()` engole erro (Windows EBUSY/EPERM — ccrStore.ts:27-31).
- **package.json exports:** ✓ aponta para `./src/index.ts` (correto, sem o bug do EST-13b).
- **Modelo L2 fora do repo:** ✓ path `~/.cache/orq15-llmlingua2/model.onnx` (ADR-0011 §Conseq).
- **Nano real smoke skip:** 1 skipped (caso 3 §4, requer `DEEPSEEK_API_KEY`) — esperado por spec.

**Achados:**

| Sev | ID | Achado | Disposição |
|---|---|---|---|
| m1 | EST-09/m1 | `nanoPreprocess.ts:41` usa `(generateText as any)({...})` — cast `as any` desnecessário (já é import de valor). Funciona com 3 eslint-disable, mas cheiro. | defer→cleanup; mesma raiz do padrão `as any` ESLint já catalogado em C-18 i2 |
| m2 | EST-09/m2 | `optimize.ts:12` redeclara inline o tipo do tokenizer (`{ encode, decode }`) em vez de importar `L2Tokenizer` de `./l2Compressor.js`. Estruturalmente idêntico, mas duplicação desnecessária. | defer→cleanup |
| m3 | EST-09/m3 | Constante `TOK_EST` duplicada em `optimize.ts:16` e `nanoPreprocess.ts:19` (mesma fórmula `Math.ceil(s.length / 4)`). Refator trivial: extrair para `src/constants.ts`. | defer→cleanup |

> **0 bloqueantes, 0 major, 3 minor (não-bloqueantes).** m1/m2/m3 vão para o ledger de pendências.

**Veredito final:** **APROVADO (Caminho A).** Implementação segue as 6 fontes citadas (PoC + ADR + RFC-018 + EST-08 + ORQ-13 + context-bench.poc.mjs), gate triplo verde (build/test/lint) com 19/19 testes verdes + 1 skip esperado por spec, 17/17 sondas adversariais aprovadas, package.json exports correto. `approve` encadeado via `--integrar`.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-context move ORQ-13 + L2, capacity=sonnet, depende de EST-02/08 (draft)
- **[2026-07-07T13:17]** - *big-pickle* - `[Endurecido]`: endureceu spec — 20 casos de teste enumerados, contratos TS derivados de PoC+ADR+RFC-018+EST-08, gate build+test+lint, capacity sonnet
- **[2026-07-07T13:18]** - *big-pickle* - `[Promovida p/ ready]`: auto-promote — deps done, spec endurecida
- **[2026-07-07T13:21]** - *deepseek* - `[Iniciado]`: iniciando — plugin-context: move ORQ-13 crusher+CCR+nano + tier L2
- **[2026-07-07T13:32]** - *deepseek* - `[Finalizado]`: plugin-context: crusher+CCR+nano+L2+optimize ladder. 19/19 testes verdes. L2 via EST-08, modelo ORT presente. build+lint limpos.
- **[2026-07-07T13:52]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando EST-09
- **[2026-07-07T14:03]** - *agile_reviewer:claude-sonnet* - `[Aprovado]`: Integrado: merge na master (commit faa0fb1), worktree removida, Gate verde (19/19 testes + 1 skipped opt-in nano real, build+lint OK). 3 não-bloqueantes (m1/m2/m3) + 4 infos -> ledger.
