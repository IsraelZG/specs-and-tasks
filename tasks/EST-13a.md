---
id: EST-13a
title: "plugin-knowledge: OKF graph — wikilinks + frontmatter"
status: draft:hardened
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
parent: "EST-13"
capacity_target: haiku
---

# EST-13a · plugin-knowledge: OKF graph

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js 22+. `packages/plugin-knowledge/` — criar do zero (pacote nao existe).
- **Package Manager:** `pnpm` (monorepo superapp, ja cobre `packages/*`).
- **Language:** TypeScript (padrao do monorepo).
- **Test Runner:** `vitest` (padrao do monorepo).

### Contratos consumidos (EST-02a + EST-02b — ambos done)
```ts
// PluginManifest (EST-02a — apps/estaleiro/core/src/manifest.ts)
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
// Campos: name, version, capabilities, entrypoint

// FsPort (EST-02b — apps/estaleiro/core/src/ports/fs.ts)
export interface FsPort {
  readFile(plugin: PluginManifest, path: string): Promise<Uint8Array>;
}
```

### Contratos do plugin
```ts
// --- packages/plugin-knowledge/src/graph.ts
import type { PluginManifest, FsPort } from "@plataforma/estaleiro-core";

export interface PageNode {
  slug: string;            // nome do arquivo sem .md, ex: "plugin-skills"
  path: string;            // path relativo ao corpus
  frontmatter: Record<string, unknown>;
  body: string;            // conteudo markdown sem frontmatter
  links: string[];         // slugs de saida resolve de [[wikilinks]]
  backlinks: string[];     // slugs que apontam para este (preenchido apos buildGraph)
}

export interface MakeGraphOptions {
  manifest: PluginManifest;      // capabilities DEVE incluir "fs"
  fs: FsPort;
  corpusDir: string;              // path para raiz dos .md, ex: "docs"
  signal?: AbortSignal;
}

export interface KnowledgeGraph {
  /** Le o diretorio, parseia cada .md, resolve wikilinks, preenche backlinks. Retorna numero de nos. */
  buildGraph(): Promise<number>;
  /** Retorna no por slug. Lanca se nao existir. */
  getNode(slug: string): Promise<PageNode>;
  /** Lista todos os slugs. */
  listSlugs(): Promise<string[]>;
  /** Dado um slug, retorna os vizinhos de saida (paginas linkadas por este). */
  outbound(slug: string): Promise<PageNode[]>;
  /** Dado um slug, retorna os vizinhos de entrada (que linkam este). */
  inbound(slug: string): Promise<PageNode[]>;
}

export function makeGraph(opts: MakeGraphOptions): KnowledgeGraph;
```

### Comportamento esperado
- `buildGraph()`: varre `corpusDir` recursivamente (via FsPort: lista diretorio com bash `find` ou leitura Node), identifica `.md` files, extrai frontmatter YAML (regex simples entre `---` marcadores), extrai `[[slug]]` wikilinks do body (regex `/\[\[([^\]]+)\]\]/g`), constroi mapa de nos. Preenche backlinks apos processar todos os nos. Retorna contagem total.
- `getNode(slug)`: busca no mapa interno; se nao existir, lanca `Error('slug nao encontrado: ' + slug)`.
- `listSlugs()`: retorna chaves do mapa interno (array sorted).
- `outbound(slug)`: mapeia `node.links` → `getNode()` para cada (ignora slugs nao encontrados com log warning).
- `inbound(slug)`: retorna nos cujo `links` inclui slug.


## 1. Objetivo
Implementar a camada de leitura/navegacao do conhecimento OKF (markdown-first): parse de
frontmatter YAML, resolucao de wikilinks `[[slug]]`, e construcao do grafo de navegacao.
Base para o FTS (EST-13b) e o writer serial (EST-13c).

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (E2 — FTS, OKF markdown-first como padrao).
- [x] `docs/conceitos/` e `docs/caderno-*` (Docs) — o corpus OKF real: frontmatter YAML, `modo: canonical`, wikilinks `[[slug]]`.
- [x] `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §5/§7 — OKF como padrao nativo de navegacao por agente.
- [x] `apps/estaleiro/core/src/manifest.ts` (EST-02a) — `PluginManifest`.
- [x] `apps/estaleiro/core/src/ports/fs.ts` (EST-02b) — `FsPort`.

## 3. Escopo de Arquivos
- **[READ]** `apps/estaleiro/core/src/manifest.ts` (EST-02a) — `PluginManifest`.
- **[READ]** `apps/estaleiro/core/src/ports/fs.ts` (EST-02b) — `FsPort`.
- **[CREATE]** `packages/plugin-knowledge/package.json` — `@plataforma/plugin-knowledge`, version `0.0.1`, `private: true`, scripts `build`/`test`/`lint` espelhando `packages/plugin-tasks/`. Deps: `@plataforma/estaleiro-core@workspace:*`. DevDeps: `typescript@^5.8.0`, `vitest@^3.0.0`.
- **[CREATE]** `packages/plugin-knowledge/tsconfig.json` — estende `tsconfig.base.json`, `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]`.
- **[CREATE]** `packages/plugin-knowledge/src/graph.ts` — `makeGraph` + tipos `KnowledgeGraph`, `PageNode`, `MakeGraphOptions`.
- **[CREATE]** `packages/plugin-knowledge/tests/graph.test.ts` — vitest, 7 casos da S4.
- **Nao criar:** `src/fts.ts`, `src/writer.ts`, `tests/fts.test.ts`, `tests/writer.test.ts` — estes são escopo de EST-13b e EST-13c.

## 4. Estrategia de Testes
- [x] **Framework:** `vitest`.
- **Ambiente:** Node puro. `FsPort` real (`makeFsPort({cwd: testCorpusDir})`) com corpus fixture (diretorio temporario com 3-5 `.md` files).

### Casos (numerados, 7 total):
1. `buildGraph()` com corpus de 3 arquivos (1 com wikilinks validos, 1 sem links, 1 com frontmatter vazio) → retorna 3, `listSlugs()` contem os 3 slugs.
2. `getNode("existente")` → retorna `PageNode` com frontmatter parseado, body sem `---`, links extraidos.
3. `getNode("inexistente")` → lanca `Error`.
4. `outbound("a")` para `a.md` contendo `[[b]]` e `[[c]]` → retorna `[PageNode(b), PageNode(c)]`.
5. `inbound("b")` quando `a.md` contem `[[b]]` → retorna `[PageNode(a)]`.
6. Roundtrip: arquivo com frontmatter `{title: "Teste", modo: "canonical"}` → `PageNode.frontmatter.title === "Teste"` e `PageNode.frontmatter.modo === "canonical"`.
7. `signal.aborted` antes de `buildGraph()` → lanca `Error("cancelado")` sem chamar `FsPort` (usar `vi.fn()` spy).

## 5. Instrucoes de Execucao
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** importar `node:fs` direto — toda leitura passa por `opts.fs.readFile`.
> - **NAO** implementar FTS nem writer serial — e escopo das irmais EST-13b/EST-13c.
> - **NAO** usar biblioteca YAML externa — frontmatter YAML e simples o suficiente para regex (delimitadores `---`). Se houver YAML complexo (arrays aninhados), usar regex incremental; a grande maioria dos frontmatters do wiki e plano (`title:`, `modo:`, `tags: lista simples`).
> - **NAO** mexer em `pnpm-workspace.yaml`.

1. **[TDD]** Criar `tests/graph.test.ts` com os 8 casos.
2. Criar `packages/plugin-knowledge/package.json` e `tsconfig.json`.
3. Implementar `src/graph.ts` com a API da S0.
4. Rodar `pnpm --filter @plataforma/plugin-knowledge test` ate 7/7 verde.
5. Rodar `build` e `lint`. Gate (S7).

## 6. Feedback de Especificacao
- **Nenhuma decisao em aberto.** Fonte: RFC-018 E2 + OKF patrao existente em `docs/conceitos/`. YAML parsing com regex (nao biblioteca) e escolha consciente de simplicidade (ponytail: YAML dos wikis e sempre plano, regex cobre >95% dos casos).
- `capacity_target: haiku` — parse de frontmatter + regex de wikilinks + grafo em memoria. Mecanico, sem algoritmo novo.

## 7. Definition of Done (DoD)

### Verificacao automatica (Gate de Evidencia)
```bash
pnpm --filter @plataforma/plugin-knowledge build
pnpm --filter @plataforma/plugin-knowledge test
pnpm --filter @plataforma/plugin-knowledge lint
```
Todos Exit Code 0. Lint sem erros NOVOS.

### Checklist do Reviewer
- [ ] Apenas arquivos da S3 foram criados/editados? (sem fts/writer, sem pnpm-workspace.yaml)
- [ ] Nenhum `import` de `node:fs` direto?
- [ ] 7 casos da S4 verdes? (`Tests 7 passed (7)`)
- [ ] `tsc` sem erros? `eslint` sem erros NOVOS?
- [ ] YAML parsing usa regex (nao depende de lib externa)?

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
- **[2026-07-06T18:25]** - *big-pickle* - `[Endurecido]`: endureceu spec — graph OKF, 7 casos, capacity=haiku, 0 decisoes abertas
