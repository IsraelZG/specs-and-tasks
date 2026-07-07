---
id: EST-13a
title: "plugin-knowledge: OKF graph — wikilinks + frontmatter"
status: done
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
- [x] **Aprovado**
- [ ] **Requer Refatoracao**
- **Evidencia de Execucao (obrigatoria):**
```
$ pnpm --filter @plataforma/plugin-knowledge build
> tsc
(exit 0)

$ pnpm --filter @plataforma/plugin-knowledge test
> vitest run
 RUN  v3.2.6  C:/Dev2026/.superapp-worktrees/EST-13a/packages/plugin-knowledge
 ✓ tests/graph.test.ts (7 tests) 50ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
(exit 0)

$ pnpm --filter @plataforma/plugin-knowledge lint
> eslint src/
(exit 0 — sem erros)

Sondas adversariais (4/4 passaram — probe removida do deliverable):
- P1. corpus vazio -> buildGraph retorna 0, listSlugs []
- P2. wikilink para slug inexistente -> mantido em `links`, `outbound` ignora sem crash
- P3. subdiretorio descoberto recursivamente
- P4. self-link [[a]] em a.md -> a em proprio `links` e `backlinks`
```
- **Comentarios de Revisao:**
Auditoria independente (anti-ancoragem): li a spec, rodei Gate + sondas, cheguei ao veredito ANTES de olhar a Handover/Log. Resultado: zero achados bloqueantes/maores.

**Conformidade com a spec:**
- §3 Escopo: 4 arquivos criados (package.json, tsconfig.json, src/graph.ts, tests/graph.test.ts). Sem fts.ts/writer.ts (escopo das irmaes EST-13b/13c). Sem mexer em pnpm-workspace.yaml. ✓
- §4 7 casos de teste verdes (1-7 enumerados). Caso 1 esperava 3 arquivos, fixture tem 4 (a, b, c, vazio) — mais estrito, aceitavel.
- §5 NAO FAZER: graph.ts NAO usa `node:fs` para `readFile` (passa por `opts.fs.readFile` do FsPort). Usa `readdir` de `node:fs/promises` APENAS para listar diretorios (FsPort nao expoe readdir), alinhado com §0 "lista diretorio com bash `find` ou leitura Node".
- §7 DoD: build (tsc) exit 0, test 7/7, lint 0 erros NOVOS. Plugin manifest respeitado (TEST_MANIFEST com capabilities `["fs"]`).

**Gate de wiring:** N/A — graph e primitiva de leitura, sera consumida por EST-13b (FTS) e EST-13c (writer). Tarefas-irmaas no backlog ja cobrem a ligacao. Sem gap.
**Gate de acoplamento:** `import` unico cross-package e de `@plataforma/estaleiro-core` (EST-02, done) — direcao `plugin-knowledge -> estaleiro-core` segue a hierarquia `protocol <- crypto <- core <- transport`/`plugins`. Sem ciclo.

**INFO (nao impede aprovacao):**
- `package.json` `exports` aponta para `./src/graph.ts` (TS source) em vez de `./dist/graph.js`. Consistente com packages/plugin-tasks/, mas exige que o consumidor tambem seja TS-aware. Confirmar se alinhado com a politica do monorepo para plugins v1.
- `findMdFiles` faz recursao O(n) sequencial sobre o corpus. Para o wiki atual (centenas de paginas) e OKF incremental, e aceitavel; se chegar a 10k+ arquivos, paralelizar.
- Handover do Executor (§8) nao foi preenchido pelo worker — apenas Log §9 tem resumo. Reendurecer-template ou script de executar-task deveria lembrar o worker a preencher §8 antes de `finish`.

**Veredito:** APROVADO. Implementacao robusta, cobre os 7 casos da spec + 4 edge cases nao-listados, Gate verde, escopo respeitado, arquitetura correta. Pode ser integrada.

## 9. Log de Execucao (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessao de trabalho usando `node tools/scripts/manage-task.mjs`.

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-06T18:25]** - *big-pickle* - `[Endurecido]`: endureceu spec — graph OKF, 7 casos, capacity=haiku, 0 decisoes abertas
- **[2026-07-07T13:07]** - *minimax* - `[Promovida p/ ready]`: draft:hardened com deps done (EST-02) — safety-net flip
- **[2026-07-07T13:09]** - *deepseek* - `[Iniciado]`: iniciando implementacao do plugin-knowledge graph
- **[2026-07-07T13:13]** - *deepseek* - `[Finalizado]`: plugin-knowledge graph implementado: 7/7 testes verdes, lint limpo, build ok. Criado packages/plugin-knowledge com makeGraph + KnowledgeGraph (buildGraph, getNode, listSlugs, outbound, inbound). Frontmatter YAML via regex, wikilinks [[slug]], FsPort para leitura.
- **[2026-07-07T13:17]** - *agile_reviewer:minimax* - `[Em revisão]`: revisando
- **[2026-07-07T13:25]** - *agile_reviewer:minimax* - `[Aprovado]`: Integrado: merge na master (5dcb7a5), worktree removida, Gate verde (build tsc exit 0; test 7/7 passed; lint exit 0). 3 nao-bloqueantes -> ledger de pendencias.
