---
id: EST-13b
title: "plugin-knowledge: FTS local (full-text search sobre OKF)"
status: done
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-13a"]
blocks: []
parent: "EST-13"
capacity_target: sonnet
---

# EST-13b · plugin-knowledge: FTS local

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js 22+. `packages/plugin-knowledge/` (ja existe apos EST-13a).
- **Extende EST-13a:** este plugin adiciona o indice FTS ao `KnowledgeGraph` existente — nao cria pacote novo, adiciona modulo ao mesmo `@plataforma/plugin-knowledge`.
- **Fonte:** RFC-018 §2 E2 — "FTS local (SQLite/ripgrep-like) no v1, nao espera o cofre de codigo (caderno 31)".
- **Contratos consumidos:** `KnowledgeGraph` e `PageNode` de EST-13a (`packages/plugin-knowledge/src/graph.ts`).

### Contratos do plugin
```ts
// --- packages/plugin-knowledge/src/fts.ts
import type { KnowledgeGraph } from "./graph";

export interface FtsOptions {
  graph: KnowledgeGraph;
  /** Strategy de indexacao: "simple" (inverted index case-insensivel, padrao) | "trigram" (futuro, sift-like) */
  strategy?: "simple" | "trigram";
  signal?: AbortSignal;
}

export interface FtsResult {
  slug: string;
  title: string;
  score: number;       // soma de ocorrencias no body + 3× ocorrencias no title
  snippet: string;     // trecho de ~120 chars ao redor do primeiro match
}

export interface FtsIndex {
  /** Constroi/reconstroi o indice a partir do grafo. Retorna numero de termos indexados. */
  buildIndex(): Promise<number>;
  /** Busca por termo. Case-insensitive. Retorna resultados ordenados por score descendente. */
  search(term: string): Promise<FtsResult[]>;
}

export function makeFts(opts: FtsOptions): FtsIndex;
```

### Comportamento esperado
- `buildIndex()`: itera `graph.listSlugs()`, para cada no extrai termos do body + title (split por whitespace/pontuacao), mantem contagem de ocorrencias por slug. Usa estrategia `simple` (inverted index em memoria: `Map<termo, Map<slug, {count, positions}>>`). Estrategia `trigram` e placeholder (lanca `Error("trigram nao implementado")` — upgrade futuro).
- `search(term)`: normaliza termo (lowercase, trim), consulta indice, computa `score = (bodyHits + 3 * titleHits)`, gera snippet (primeiros ~120 chars ao redor do primeiro match no body via `graph.getNode(slug).body`). Retorna array sorted por score DESC. Termo vazio → array vazio. Sem matches → array vazio.

## 1. Objetivo
Adicionar busca full-text sobre o grafo OKF (EST-13a) com inverted index em memoria.
RFC-018 E2: "FTS local (SQLite/ripgrep-like) no v1" — nao espera o cofre de codigo
(caderno 31) para ter busca basica.

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (E2) — FTS local no v1, nao esperar caderno 31.
- [x] `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §5/§7 — OKF como padrao nativo de navegacao.
- [x] `docs/_vendor/sift/` (clone raso local) — referencia do indice trigram; escopo futuro (nao implementar agora).
- [x] `packages/plugin-knowledge/src/graph.ts` (EST-13a) — `KnowledgeGraph`, `PageNode`.

## 3. Escopo de Arquivos
- **[READ]** `packages/plugin-knowledge/src/graph.ts` (EST-13a) — `KnowledgeGraph` para iterar slugs e obter body/title.
- **[CREATE]** `packages/plugin-knowledge/src/fts.ts` — `makeFts` + tipos `FtsIndex`, `FtsOptions`, `FtsResult`.
- **[UPDATE]** `packages/plugin-knowledge/src/index.ts` — re-export `makeFts` e `FtsIndex`.
- **[CREATE]** `packages/plugin-knowledge/tests/fts.test.ts` — vitest, 7 casos da S4.

## 4. Estrategia de Testes
- [x] **Framework:** `vitest`.
- **Ambiente:** Node puro. Usar `makeGraph` com corpus fixture (5 .md files com termos variados) + `makeFts` em cima do grafo.

### Casos (numerados, 7 total):
1. `buildIndex()` apos `graph.buildGraph()` → retorna numero de termos > 0. `search("termo")` com termo existente retorna resultados.
2. `search("TERMO")` (maiusculo) retorna mesmos slugs que `search("termo")` (case-insensitive).
3. `search("termo")` com termo presente em 2 arquivos, 1 com titulo contendo o termo → resultado do title-match tem score maior.
4. `search("termo")` com termo ausente em todos → array vazio `[]`.
5. `search("")` (vazio) → array vazio (edge).
6. Roundtrip: `buildIndex()` duas vezes (reindex) → `search("termo")` estavel (idempotente).
7. `signal.aborted` antes de `buildIndex()` → lanca `Error("cancelado")` (usar `vi.fn()` spy no graph).

## 5. Instrucoes de Execucao
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** implementar trigram/sift — e upgrade futuro (S6).
> - **NAO** usar banco externo (SQLite) — RFC-018 E2 diz "ou SQLite ou ripgrep-like"; inverted index em memoria e suficiente para o corpus de docs (centenas, nao milhoes de paginas).
> - **NAO** modificar `graph.ts` (EST-13a) — se precisar de mais dados do grafo, adicione campos ao `PageNode` em EST-13a primeiro.
> - **NAO** depender de `FsPort`/`BashPort` — FTS opera sobre o grafo em memoria, nao sobre disco.

1. Implementar `src/fts.ts` com inverted index em memoria + scoring.
2. Criar `tests/fts.test.ts` com fixtures.
3. Rodar `pnpm --filter @plataforma/plugin-knowledge test` ate todos verdes (incluindo os 8 de EST-13a).
4. Rodar `build` + `lint`. Gate (S7).

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **Todas as decisoes de desenho DERIVADAS de fonte (CITE OU ESCALE):**
> - `FtsOptions.graph` (KnowledgeGraph) ← EST-13a `graph.ts` (`KnowledgeGraph` class)
> - `FtsOptions.strategy: "simple" | "trigram"` ← RFC-018 §2 E2: "FTS local (SQLite/ripgrep-like)"; inverted index = `simple`, `trigram` reservado para upgrade futuro
> - `FtsResult.score = bodyHits + 3*titleHits` ← padrao TF-IDF simplificado: title weighed 3× body (convencao de busca)
> - `FtsResult.snippet` (~120 chars ao redor do primeiro match) ← padrao de UI de busca (grep - context lines)
> - `makeFts` como fabrica (nao classe) ← `makeGraph` de EST-13a (mesmo padrao)
> - `FtsIndex.buildIndex()`/`search()` ← interface de indice invertido canonica (build + query separados)
> - In-memory inverted index (`Map<termo, Map<slug, {count, positions}>>`) ← RFC-018 E2 permite SQLite ou ripgrep-like; memoria cobre o cenario (centenas de paginas), sem dependencia externa conforme `ponytail: stdlib before dep`
> - `signal?: AbortSignal` ← padrao de `AbortController` usado no ADR-0008/ORQ-10 (consistencia com o ecossistema)
>
> **Decisoes em aberto:** nenhuma. Todo contrato deriva de EST-13a (graph.ts) + RFC-018 E2. A escolha de inverted index em memoria (vs SQLite) e explicita e reversivel.
>
> **Dependencias:** EST-13a (`draft:hardened`) — `KnowledgeGraph`, `PageNode`, `listSlugs()`, `getNode()` consumidos pelo FTS.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `FtsIndex.buildIndex()` itera graph.listSlugs() e constroi inverted index em memoria?
- [ ] `FtsIndex.search()` case-insensitive, ordenado por score DESC, com snippet?
- [ ] `search("")` e sem matches → array vazio (nao throw)?
- [ ] `strategy: "trigram"` lanca `Error("trigram nao implementado")`?
- [ ] Nenhuma dependencia externa adicionada?
- [ ] Testes 1–7 verdes? E os 8 de EST-13a continuam passando?

### Verificacao automatica (Gate de Evidencia)
```bash
pnpm --filter @plataforma/plugin-knowledge build
pnpm --filter @plataforma/plugin-knowledge test
pnpm --filter @plataforma/plugin-knowledge lint
```
> **GATE DE EVIDENCIA (Regra 3 do CLAUDE.md):** Worker cola a saida literal de build + test + lint (todos Exit Code 0) na Secao 8. Lint incluido desde 2026-07-06 apos 3 reworks consecutivos por regressao (T-807, EST-02b, EST-02c).

### Checklist do Reviewer
- [ ] Apenas arquivos da S3 foram criados/editados? (sem modificar graph.ts, sem sqlite)
- [ ] `FtsIndex.search` e case-insensitive? retorna snippet?
- [ ] 7 casos da S4 verdes? (`Tests 7 passed (7)`) — e os 8 de EST-13a continuam passando?
- [ ] `tsc` sem erros? `eslint` sem erros NOVOS?

## 8. Log de Handover e Revisao Agile (Code Review)
### Handover do Executor:
- **Arquivos criados/editados** (todos no escopo declarado §3, sem diff fora):
  - `packages/plugin-knowledge/src/fts.ts` (CREATE, 156 linhas) — `FtsIndexImpl` com `buildIndex()` (inverted index `Map<termo, Map<slug, {count, positions}>>` em memória, AbortSignal honored, strategy=`simple`) e `search()` (case-insensitive, scoring `bodyHits + 3*titleHits`, snippet ~120 chars ao redor do primeiro match, sort por score DESC); `makeFts()` factory.
  - `packages/plugin-knowledge/src/index.ts` (UPDATE) — re-export adicionado: `makeFts, type FtsIndex, type FtsOptions, type FtsResult`.
  - `packages/plugin-knowledge/tests/fts.test.ts` (CREATE, 156 linhas) — 7 testes cobrindo §4: buildIndex+termCount, case-insensitive, title-3× body, sem matches, vazio, idempotência, AbortSignal.
- `graph.ts` (EST-13a) **não** foi modificado — `FtsIndexImpl` consome a interface `KnowledgeGraph` via DI sem tocar a impl.
- Nenhuma dep externa adicionada: `fts.ts` importa só `./graph.js` (mesmo pacote).
- Gate declarado (Log §9, 2026-07-07T13:31 *deepseek*): `build ✅ · test 14/14 ✅ · lint ✅` (7 graph + 7 fts).

### Parecer do Reviewer 1 (claude-sonnet, independente):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Evidência de Execução (obrigatória, re-verificada por R1 na worktree `C:/Dev2026/.superapp-worktrees/EST-13b/`):**
```
> pnpm --filter @plataforma/plugin-knowledge build
$ tsc
(sem saída — OK)

> pnpm --filter @plataforma/plugin-knowledge test
$ vitest run
✓ tests/graph.test.ts (7 tests) 43ms
✓ tests/fts.test.ts   (7 tests) 46ms
Test Files  2 passed (2)
     Tests  14 passed (14)

> pnpm --filter @plataforma/plugin-knowledge lint
$ eslint src/
(sem saída — 0 erros)
```
- **Sondas adversariais (7 testes em `fts.probe.test.ts`, R1 removeu após uso — cobertura ativa, não passiva):**
```
✓ probe: search('   ') (whitespace) → []
✓ probe: search sem buildIndex → [] (não throw)
✓ probe: buildIndex com graph vazio → termCount=0
✓ probe: buildIndex propaga erro de listSlugs (não silencioso)
✓ probe: frontmatter ausente (sem title) → title='' score>0, sem throw
✓ probe: score formula (1 body + 1 title = 4, bate com bodyHits + 3*titleHits)
✓ probe: snippet contém o termo (length<=120)
```
Todas as 7 sondas **passaram** — implementação aguenta bordas. Removidas após validação (não poluem o deliverable).
- **Veredito formado independentemente (anti-ancoragem §2b):** inspecionei `src/fts.ts` (156 linhas), `tests/fts.test.ts` (156 linhas), `src/index.ts` (2 linhas), `package.json`. Rodei build+test+lint na worktree. R1 é a primeira revisão; não havia parecer anterior.
- **Achados:**
  - **[M1] `package.json:7` — `exports` field stale, `makeFts` não exposto via o pacote.**
    - **Local:** `packages/plugin-knowledge/package.json:7`
    - **Evidência:**
      ```json
      "exports": { ".": "./src/graph.ts" }
      ```
      Apontava para `./src/graph.ts` no setup de EST-13a (single-file package). EST-13b adicionou `index.ts` que re-exporta `makeGraph` + `makeFts` + tipos, **mas o `exports` field não foi atualizado** para `./src/index.ts`. Consequência: `import { makeFts } from '@plataforma/plugin-knowledge'` (forma canônica usada pelo consumidor EST-14d View Knowledge) **falha** — o `exports` field é o gate do Node ESM (vazio para o entrypoint, ou resolve apenas para `graph.ts`).
    - **Verificação estática:** `dist/index.d.ts` E `dist/index.js` existem e re-exportam corretamente (build OK), mas ficam inacessíveis pelo nome do pacote. Acessíveis só por path literal `import from '@plataforma/plugin-knowledge/dist/index.js'` (hack).
    - **Viola:** §3 (escopo não cobre o `package.json`, mas a omissão quebra a §1 — `FtsIndex` precisa ser consumível pelo dispatcher/harness) + §6 (re-export é o ÚNICO ponto onde EST-13b adiciona superfície pública ao pacote; sem `exports` ajustado, o re-export é inerte).
    - **Gate de wiring §5.1 do agente (MAJOR arquitetural):** primitiva testada (`makeFts` + 7 testes verdes) mas **não-ligada** — consumidor real (EST-14d) não consegue importar. Mesmo padrão do gap EST-03c→EST-03d (primitivas sem caller) endereçado em R2 do EST-03d. Aqui a ligação é puramente declarativa (1 linha no `package.json`), mas o efeito é idêntico: feature não-entregue.
    - **Ação corretiva (mínima, 1 linha):**
      ```diff
      -    ".": "./src/graph.ts"
      +    ".": "./src/index.ts"
      ```
      Re-rodar `pnpm --filter @plataforma/plugin-knowledge build` para confirmar que `dist/index.js` continua sendo o entrypoint.
  - **[m1] §3 da spec diz "8 de EST-13a continuam passando" mas EST-13a tem 7 testes, não 8.**
    - **Local:** `tasks/EST-13b.md:119` ("Testes 1–7 verdes? E os 8 de EST-13a continuam passando?").
    - **Evidência:** `tests/graph.test.ts` tem 7 testes (`vitest run` mostra `tests/graph.test.ts (7 tests)`). EST-13a §4 também lista 7 casos.
    - **Não-bloqueante:** discrepância documental, não afeta o código. A spec foi escrita com base numa contagem errada; o resultado real (7+7=14) está documentado no Log §9 e bate com a §4 do EST-13a. A spec deveria ser corrigida em reendurecimento leve, não no rework do código.
  - **[i1] ✓ POSITIVO — gate de evidência triplo (build+test+lint) aplicado desde o 1º commit.** O Log §9 do worker já documenta os 3 comandos com 0 erros / 14/14. Após 3 reworks consecutivos por regressão de lint (T-807, EST-02b, EST-02c), ver o gate triplo executado e logado no 1º `finish` é o comportamento esperado desde a regra de 2026-07-06.
  - **[i2] Implementação segue o pattern `makeFts`/`FtsIndexImpl` (factory + interface)** — consistente com `makeGraph` de EST-13a. Zero inconsistência de estilo.
  - **[i3] `buildIndex()` é `async` mas não usa `await` em nenhum ponto do loop (só `await graph.listSlugs()` e `await graph.getNode(slug)` no body).** Promise wrapping honesto (compatível com a interface `Promise<number>` da §1, e o graph pode vir a ter I/O assíncrono real em produção).
  - **[i4] `signal.aborted` checado em 2 pontos: início do `buildIndex` e no topo do loop por slug.** Para grafos com centenas de páginas, isso é suficiente; para grafos com páginas gigantes indexadas, faria sentido checar a cada N iterações. **Não-bloqueante** — corpus-alvo é "centenas de páginas" (RFC-018 E2), não milhões.
  - **[i5] Cobertura da §4 da spec, item por item:**
    | Caso §4 | Teste em `fts.test.ts` | Verificado por R1 |
    |---|---|---|
    | 1. buildIndex + search retorna resultados | it("1. buildIndex() ... termCount > 0 ...") | ✓ |
    | 2. case-insensitive TERMO==termo | it("2. search('TERMO') ...") | ✓ |
    | 3. title match score > body match | it("3. termo no titulo ... score maior") | ✓ |
    | 4. sem matches → [] | it("4. search('inexistente') → array vazio") | ✓ |
    | 5. search('') → [] | it("5. search('') → array vazio (edge case)") | ✓ |
    | 6. buildIndex() × 2 idempotente | it("6. buildIndex() duas vezes ...") | ✓ |
    | 7. signal.aborted → "cancelado" | it("7. signal.aborted antes de buildIndex() ...") | ✓ |
    Cobertura 1:1, sem gaps.
- **DoD §7 (re-verificada):**
  | Item | Status | Evidência |
  |------|--------|-----------|
  | `FtsIndex.buildIndex()` itera `listSlugs()` + inverted index | ✓ | `fts.ts:62-114`; 7 testes |
  | `FtsIndex.search()` case-insens, score DESC, snippet | ✓ | `fts.ts:119-150`; sort em `:148` |
  | `search('')` e sem matches → [] (não throw) | ✓ | `fts.ts:121` e `:124` |
  | `strategy: "trigram"` lança `Error("trigram nao implementado")` | ✓ | `fts.ts:58-60` |
  | Nenhuma dep externa adicionada | ✓ | `package.json:14-16` inalterado |
  | 7 testes verdes + EST-13a continua passando | ✓ (7+7=14) | vitest output acima |
- **Veredito R1:** **REFATORAÇÃO NECESSÁRIA** (1 MAJOR bloqueante). M1 = 1 linha em `package.json`. Build verde, testes verdes, lint 0. Sondas adversariais (7) todas passam — a `fts.ts` em si está sólida. Após M1 corrigido, `pnpm build && test && lint` continuam verdes e a primitiva fica **ligada** (consumível por EST-14d via `import { makeFts } from '@plataforma/plugin-knowledge'`). Não-bloqueante colateral: m1 (spec diz "8" mas são 7) é housekeeping documental.

---

### Parecer do Reviewer 2 (minimax — independente, FRIO, pós-rework)
**Data:** 2026-07-07
**Revisor:** agile_reviewer (minimax) — modelo diferente de R1 (claude-sonnet), **anti-ancoragem** (formado após grep cruzado da spec, código e Gate, sem ler R1 primeiro)
**Commit do rework:** `124bd6b fix(EST-13b): [M1] update exports to ./src/index.ts so makeFts is consumable`

- [x] **Aprovado**
- [ ] **Requer Refatoração**

**Evidência de Execução (re-executada por R2 pós-rework):**
```
=== BUILD ===
$ pnpm --filter @plataforma/plugin-knowledge build
$ tsc
(sem saída — OK)

=== TEST ===
$ pnpm --filter @plataforma/plugin-knowledge test
✓ tests/graph.test.ts (7 tests) 54ms
✓ tests/fts.test.ts   (7 tests) 57ms
Test Files  2 passed (2)
     Tests  14 passed (14)
(Exit code 0)

=== LINT ===
$ pnpm --filter @plataforma/plugin-knowledge lint
$ eslint src/
(sem saída — 0 erros)
```

**Verificação adicional do fix M1 (R2):**
```bash
$ cat packages/plugin-knowledge/dist/index.js
export { makeGraph } from "./graph.js";
export { makeFts } from "./fts.js";

$ node -e "import('./dist/index.js').then(m => console.log('exports:', Object.keys(m)))"
exports: [ 'makeFts', 'makeGraph' ]
```
Confirmação independente: o entrypoint re-exporta ambas as factories, e o `makeFts` agora é consumível via `import { makeFts } from '@plataforma/plugin-knowledge'`.

**Comentários de Revisão:**

**MAJOR (0).** M1 do R1 foi **completamente resolvido** pelo commit `124bd6b`. Wire contract com consumidores (EST-14d View Knowledge) agora funciona.

**Análise do M1 (verificação independente):**

- `package.json:7` mudou de `"./src/graph.ts"` (stale) para `"./src/index.ts"` (correto) — diff mínimo de 1 linha, conforme sugerido por R1.
- `tsconfig.json` (`include: ["src"]`) já cobre `index.ts`, então o `tsc` build emite corretamente `dist/index.js` + `dist/index.d.ts`.
- O `dist/index.js` gerado contém exatamente `export { makeGraph } from "./graph.js"` e `export { makeFts } from "./fts.js"` — gate de wiring do agente §5.1 satisfeito: primitiva agora **ligada**.
- `node -e "import('./dist/index.js')..."` confirma exports `['makeFts', 'makeGraph']` — verificável em runtime.

**Análise estática dos contratos (Spec §1, independente de R1):**

- ✅ `FtsOptions { graph, strategy?, signal? }` (fts.ts:3-7) — match com spec L28-33.
- ✅ `FtsResult { slug, title, score, snippet }` (fts.ts:9-14) — match com spec L35-40.
- ✅ `FtsIndex { buildIndex(): Promise<number>, search(term): Promise<FtsResult[]> }` (fts.ts:16-19) — match com spec L42-47.
- ✅ `makeFts(opts: FtsOptions): FtsIndex` (fts.ts:153-155) — match com spec L49.
- ✅ `strategy: "trigram"` lança `Error("trigram nao implementado")` (fts.ts:58-60) — match com spec L53 e DoD L117.
- ✅ `signal.aborted` honrado em 2 pontos (início de `buildIndex` L54-56 + por-slug L67-69) — match com §5 L107.
- ✅ `search("")` → `[]` (fts.ts:121); `search("inexistente")` → `[]` (fts.ts:124) — match com DoD L116.
- ✅ `score = bodyHits + 3 * titleHits` (fts.ts:142) — match com spec L38 e §6 L102.
- ✅ Snippet ~120 chars centrado no match (fts.ts:33-43, `Math.floor(snippetLen/2) = 60` antes + `snippetLen` total) — match com §6 L103.
- ✅ Sort por score DESC (fts.ts:148) — match com §1 L46.

**Testes (Spec §4, cobertura 1:1 — confirmada por R1, re-verificada por R2):**

| Caso §4 | Teste | R2 |
|---|---|---|
| 1. buildIndex + search retorna resultados | it("1. buildIndex() ... termCount > 0 ...") | ✓ |
| 2. case-insensitive TERMO==termo | it("2. search('TERMO') ...") | ✓ |
| 3. title match score > body match | it("3. termo no titulo ... score maior") | ✓ |
| 4. sem matches → [] | it("4. search('inexistente') → []") | ✓ |
| 5. search('') → [] | it("5. search('') → [] (edge case)") | ✓ |
| 6. buildIndex() × 2 idempotente | it("6. buildIndex() duas vezes ...") | ✓ |
| 7. signal.aborted → "cancelado" | it("7. signal.aborted ... lanca Error('cancelado')") | ✓ |

14/14 verde (7 fts + 7 graph do EST-13a). **EST-13a continua passando** — sem regressão cruzada.

**DoD §7 (re-verificada por R2):**

- [x] `FtsIndex.buildIndex()` itera `listSlugs()` + inverted index em memória — ✓ (fts.ts:62-114)
- [x] `FtsIndex.search()` case-insensitive, ordenado por score DESC, com snippet — ✓ (fts.ts:119-150)
- [x] `search('')` e sem matches → array vazio (não throw) — ✓
- [x] `strategy: "trigram"` lança `Error("trigram nao implementado")` — ✓
- [x] Nenhuma dependência externa adicionada — ✓ (`package.json:14-16` inalterado: só `@plataforma/estaleiro-core` workspace)
- [x] Testes 1–7 verdes + EST-13a continua passando — ✓ (14/14)

**Reviewer Checklist §7:**

- [x] Apenas arquivos da §3 foram criados/editados + 1 fix necessário — **parcial**: a rework adicionou `package.json` (não estava em §3, mas era o objeto do M1). Justificado pelo fix; 1 linha de diff.
- [x] `FtsIndex.search` é case-insensitive + retorna snippet — ✓
- [x] 7 casos da §4 verdes + 8 de EST-13a (NOTA: R1 detectou que são 7, não 8 — vide [m1] abaixo) — ✓ (14/14 real)
- [x] `tsc` sem erros + `eslint` sem erros NOVOS — ✓

**MINOR (1) — não-bloqueante, vai pro ledger:**

- **[m1]** Spec §3 L119 (DoD) + §7 L132 (Reviewer Checklist) dizem "8 de EST-13a continuam passando" mas EST-13a tem **7** testes (`tests/graph.test.ts (7 tests)` no vitest output). Discrepância documental herdada de draft → endurecido. Spec deveria ser corrigida em reendurecimento leve (trocar "8" por "7"). **Não-bloqueante** — comportamento real (7+7=14) está documentado no Log §9 e bate com a §4 do EST-13a. Mantido após rework (correção é editorial, não de código).

**INFO (3):**

- **[i1]** `TermEntry.positions: number[]` (fts.ts:23) é armazenada no `buildIndex` (L93, L110) mas **nunca usada** em `search` — o snippet é encontrado via `bodyLower.indexOf(termLower)` (fts.ts:35), e o scoring usa `entry.count - titleHits` (fts.ts:141). Posições são código morto. Sugestão: remover o campo (simplifica a interface `TermEntry`) ou usar para highlighting futuro (futuro, não agora). **Não-bloqueante**.

- **[i2]** `package.json` foi modificado pelo rework mas **não está em §3** (escopo declarava só `fts.ts`/`index.ts`/`tests/fts.test.ts` + READ `graph.ts`). A modificação foi necessária para o fix do M1. **Não-bloqueante** — diff mínimo (1 linha em `exports`), mas o §3 deveria ser atualizado em reendurecimento para incluir `[EDIT] package.json` no rework (mesmo padrão dos achados [m1] do EST-06/EST-10b/EST-10c).

- **[i3]** `splitTerms` regex (fts.ts:29) é ASCII-only — não cobre acentos, cedilha, ou hifens especiais. Para o corpus testado (Português com termos simples: `termo`, `busca`, `arquivo`, `conteudo`) funciona porque os termos não têm diacríticos. Para um corpus real, pode causar inconsistência na busca (e.g., "informação" e "informacao" viram termos diferentes). **Não-bloqueante** — corpus-alvo é controlado; RFC-018 E2 não menciona Unicode. Track: normalizar Unicode (NFD + remove combining marks) no rework futuro se virar issue.

**Divergência do parecer anterior:** R1 (claude-sonnet) marcou **REFATORAÇÃO NECESSÁRIA** com 1 MAJOR (M1 = `package.json:7` stale). O worker (deepseek) fez rework focado no M1 via commit `124bd6b`. R2 confirma que o M1 foi corretamente resolvido (1 linha de diff, conforme R1 sugeriu). O m1 (spec "8" vs real 7) é editorial e permaneceu, conforme esperado — não é trabalho de rework. Mantenho APROVADO.

**Veredito:** **APROVADO** — DoD §7 100% atendido, M1 do R1 RESOLVIDO, wire contract do pacote agora funcional (consumidores podem importar `makeFts` via `@plataforma/plugin-knowledge`), 14/14 testes verdes, gates build/test/lint limpos, sondas adversariais do R1 (7) todas passaram. EST-13b pode ser mergeado.

## 9. Log de Execucao (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessao de trabalho usando `node tools/scripts/manage-task.mjs`.

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-06T18:24]** - *big-pickle* - `[Triado]`: triado — FTS inverted index + search, capacity=sonnet, decisoes fechadas, depende EST-13a (draft:hardened)
- **[2026-07-06T18:24]** - *big-pickle* - `[Endurecido]`: endureceu spec — FTS inverted index, 7 testes, gate build+test+lint, capacity=sonnet
- **[2026-07-07T13:25]** - *system* - `[Auto-promovida]`: dep EST-13a concluída
- **[2026-07-07T13:28]** - *deepseek* - `[Iniciado]`: iniciando implementacao do FTS inverted index
- **[2026-07-07T13:31]** - *deepseek* - `[Finalizado]`: FTS inverted index implementado: makeFts + FtsIndex (buildIndex, search) com scoring bodyHits+3*titleHits, snippet ~120 chars, case-insensitive, idempotente. Gate: build ✅ · test 14/14 ✅ · lint ✅
- **[2026-07-07T13:37]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando EST-13b
- **[2026-07-07T13:41]** - *agile_reviewer:claude-sonnet* - `[Requer Refatoração]`: Rework: [M1] packages/plugin-knowledge/package.json:7 — exports field aponta para ./src/graph.ts mas EST-13b adicionou ./src/index.ts que re-exporta makeGraph+makeFts+tipos. Corrigir para './src/index.ts' (1 linha) — sem isso, consumidores (EST-14d View Knowledge) nao conseguem importar makeFts via '@plataforma/plugin-knowledge'. Nao-bloqueantes: spec §3 diz '8 de EST-13a' mas sao 7 (m1), Handover §8 ficou em branco (i5), gate triplo aplicado no 1o finish (i3, positivo), sinal checado em 2 pontos (i4) — todos para o ledger.
- **[2026-07-07T13:52]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1 (exports stale no package.json)
- **[2026-07-07T13:53]** - *deepseek* - `[Finalizado]`: rework pronto: [M1] exports corrigido para ./src/index.ts. Gate: build+test(14/14)+lint ✅
- **[2026-07-07T14:01]** - *agile_reviewer:minimax* - `[Em revisão]`: revisando EST-13b (qa-review --integrar)
- **[2026-07-07T14:07]** - *agile_reviewer:minimax* - `[Aprovado]`: Integrado: merge 4df636d+124bd6b na master (commit 44fe401), worktree removida, Gate verde (build tsc OK, test 14/14, lint OK). 1 nao-bloqueante [m1] ja no ledger _pendencias.md (spec §7 diz 8 de EST-13a mas sao 7). R2 reviewer (independente, frio) APROVOU — M1 do R1 (package.json:7 exports stale) RESOLVIDO pelo rework (124bd6b): agora './src/index.ts' e makeFts consumivel. Wire contract com EST-14d View Knowledge agora funcional.
