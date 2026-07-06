---
id: EST-13b
title: "plugin-knowledge: FTS local (full-text search sobre OKF)"
status: draft:hardened
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
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoracao**
- **Evidencia de Execucao (obrigatoria):**
```
```
- **Comentarios de Revisao:**

## 9. Log de Execucao (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessao de trabalho usando `node tools/scripts/manage-task.mjs`.

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-06T18:24]** - *big-pickle* - `[Triado]`: triado — FTS inverted index + search, capacity=sonnet, decisoes fechadas, depende EST-13a (draft:hardened)
- **[2026-07-06T18:24]** - *big-pickle* - `[Endurecido]`: endureceu spec — FTS inverted index, 7 testes, gate build+test+lint, capacity=sonnet
