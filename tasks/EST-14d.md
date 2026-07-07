---
id: EST-14d
title: "View Docs/RAG: navegador de markdown consumindo plugin-knowledge (EST-13)"
status: draft:hardened
complexity: 2
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14a", "EST-13"]
blocks: []
capacity_target: haiku
---

# EST-14d · View Docs/RAG (navegador de markdown)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/ui/`.
- **Package Manager:** `pnpm` (monorepo do superapp).
- **Test Runner:** `vitest` (JSDOM).
- **Lint:** `eslint src/` (typescript-eslint strict).
- **Capacidade-alvo:** haiku (tree browser + markdown renderer — padrão já conhecido, sem novidade algorítmica).
- **Consome:** `@plataforma/estaleiro-ui` stores (EST-14a — `knowledgeStore` via `import('../../stores/knowledge')`) + API do plugin-knowledge (EST-13a/b — contratos abaixo).
- **Dependências:** `react-markdown` (ou similar) para renderizar markdown no browser.

## 1. Objetivo
Implementar a **view Docs/RAG** do Estaleiro: navegador de árvore do repositório de conhecimento markdown (OKF) consumindo o `plugin-knowledge` (EST-13). Exibe árvore de arquivos/diretórios (derivado de `PageNode[]`), prévia de conteúdo markdown com `[[wikilinks]]` navegáveis (derivado de `PageNode.body`), e busca FTS local (derivado de `FtsIndex.search` — EST-13b).

### Contratos

```ts
// --- apps/estaleiro/ui/src/views/knowledge/hooks.ts
// Tipos consumidos do plugin-knowledge via transporte (WS/REST — TBD, ver §6).
// DERIVADOS de: EST-13a (PageNode, KnowledgeGraph) + EST-13b (FtsResult, FtsIndex).

/** Nó da árvore — derivado de PageNode (EST-13a). */
export interface TreeNode {
  slug: string;            // PageNode.slug — identificador único
  path: string;            // PageNode.path — path relativo
  title: string;           // PageNode.frontmatter.title — título do doc
  children?: TreeNode[];   // inferido da hierarquia de paths (ex.: "a/b/c.md" → a/ > b/ > c)
}

/** Resultado de busca — derivado de FtsResult (EST-13b). */
export interface SearchResult {
  slug: string;            // FtsResult.slug
  title: string;           // FtsResult.title
  score: number;           // FtsResult.score
  snippet: string;         // FtsResult.snippet (~120 chars)
}

/** Payload de conteúdo — derivado de PageNode (EST-13a). */
export interface PageContent {
  body: string;            // PageNode.body — markdown sem frontmatter
  frontmatter: Record<string, unknown>;  // PageNode.frontmatter
  links: string[];         // PageNode.links — slugs de saída para navegação via wikilink
}

/** API que a view consome — transportada por WS (F3) ou REST (decisão em aberto, ver §6). */
export interface KnowledgeViewApi {
  getTree(): Promise<TreeNode[]>;
  getContent(slug: string): Promise<PageContent>;
  search(query: string): Promise<SearchResult[]>;
}
```

```tsx
// --- apps/estaleiro/ui/src/views/knowledge/KnowledgeView.tsx

export interface KnowledgeViewProps {
  api: KnowledgeViewApi;   // injetado pelo shell (pode ser mock em teste)
}

// Split pane: TreePanel (esquerda) | ContentPanel (direita)
// SearchBar no topo
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (F2 — docs/RAG entre as 5 views mantidas; E2 — FTS local).
- [x] `tasks/EST-13.md` — casca do plugin-knowledge: decomposta em OKF graph (13a), FTS (13b), writer (13c).
- [x] `tasks/EST-13a.md` (done) — `PageNode { slug, path, frontmatter, body, links, backlinks }`, `KnowledgeGraph.getNode(slug)`.
- [x] `tasks/EST-13b.md` (in_progress) — `FtsResult { slug, title, score, snippet }`, `FtsIndex.search(term)`.
- [x] `tasks/EST-14a.md` (ready) — `knowledgeStore` TinyBase (inicialmente vazia, populada pela view ao receber dados da API).

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/KnowledgeView.tsx` — split pane (tree + content), estado de seleção, loading/empty/error states.
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/TreePanel.tsx` — navegador de árvore recursivo (`TreeNode[]` → `<ul>` com expand/colapse).
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/ContentPanel.tsx` — renderizador de markdown (`react-markdown`) com wikilinks (`[[slug]]` → clique navega para `getContent(slug)`).
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/SearchBar.tsx` — input de busca FTS com resultados dropdown.
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/hooks.ts` — `useKnowledgeViewApi()` hook que instancia `KnowledgeViewApi` (mock ou real conforme ambiente) e expõe dados às stores.
- **[CREATE]** `apps/estaleiro/ui/tests/knowledge/KnowledgeView.test.tsx` — vitest + JSDOM, 5 casos (§4).

## 4. Estratégia de Testes
- **Framework:** vitest + JSDOM + React Testing Library (`render`, `screen`, `fireEvent`).
- **Ambiente:** Node puro, JSDOM. API mockada via `KnowledgeViewApi` fake (retorna dados fixture inline).
- **Fora de Escopo:** Renderização de markdown completa com todos os plugins GFM/extras (só `react-markdown` básico + wikilinks). Testes de integração com o backend real (EST-13).

### Casos de teste (5)
1. **TreePanel carrega e exibe árvore:** `api.getTree()` retorna `[{ slug: 'index', path: 'index.md', title: 'Home' }]`. Renderizar `<KnowledgeView api={mockApi} />`. Verificar que o texto 'Home' aparece na tela.
2. **Clique em arquivo → conteúdo carregado:** `api.getTree()` retorna 1 node. Clicar no node. `api.getContent(node.slug)` é chamado. `ContentPanel` exibe o markdown retornado.
3. **Wikilink clicado → navega para documento linkado:** `api.getContent('doc-a')` retorna body contendo `[[doc-b]]`. Clicar no wikilink renderizado. `api.getContent('doc-b')` é chamado e seu conteúdo substitui o painel.
4. **Busca FTS → resultados:** Digitar 'teste' no `SearchBar`. `api.search('teste')` retorna `[{ slug: 'doc-x', title: 'Doc X', score: 3, snippet: '...teste...' }]`. Resultados aparecem no dropdown.
5. **Estado vazio:** `api.getTree()` retorna `[]`. Mensagem "Nenhum documento encontrado" é exibida no tree panel.

## 5. Instruções de Execução
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implementar a lógica de transporte (WS/REST) — o `api` é injetado pelo shell; esta task só constrói os componentes de UI que consomem a interface `KnowledgeViewApi`. O transporte real é decidido em separate task/decisão (ver §6).
> - **NÃO** modificar `packages/plugin-knowledge/` (EST-13) nem `src/ws/` (EST-14a) — são pacotes separados, fora de escopo.
> - **NÃO** implementar cache complexo além do `knowledgeStore` já existente da EST-14a.

### Pegadinhas conhecidas
- **Wikilinks no markdown:** `react-markdown` não entende `[[slug]]` nativamente. Usar um plugin/custom renderer (`remarkPlugin`) que transforma `[[slug]]` em `<a href="#" data-slug="slug">` com `onClick` que chama `api.getContent(slug)`.
- **Árvore de diretórios:** `TreeNode.children` é inferido da hierarquia de `path`. Ex.: files `a/b.md` e `a/c.md` → node `a/` com 2 children. Implementar função `buildTree(paths: string[]): TreeNode[]`.
- **API injetada vs import direto:** o hook `useKnowledgeViewApi()` deve aceitar `api` opcional (para teste) ou criar uma instância default que chama o backend. Para esta task, default pode ser um mock que retorna dados estáticos — o wiring real com o backend é futuro.

1. **[TDD]** Criar `tests/knowledge/KnowledgeView.test.tsx` com casos 1–5 (API mockada).
2. Criar `src/views/knowledge/hooks.ts` — tipos `TreeNode`, `SearchResult`, `PageContent`, `KnowledgeViewApi`.
3. Criar `src/views/knowledge/TreePanel.tsx` — árvore recursiva com expand/colapse (partindo de `api.getTree()`).
4. Criar `src/views/knowledge/ContentPanel.tsx` — renderizador markdown + wikilink handler.
5. Criar `src/views/knowledge/SearchBar.tsx` — input + dropdown de resultados (`api.search()`).
6. Criar `src/views/knowledge/KnowledgeView.tsx` — split pane compondo tree + content + search.
7. Registrar a view no shell FlexLayout (editar `App.tsx` da EST-14a para importar e mapear `component: 'knowledge'`).
8. Rodar `pnpm --filter @plataforma/estaleiro-ui test` até 5/5 verde.
9. Rodar `build` + `lint`. Gate (§7) → §8.

## 6. Feedback de Especificação
> **Todas as decisões DERIVADAS de fonte (CITE OU ESCALE):**

### Derivado (com fonte)
- `TreeNode { slug, path, title }` ← EST-13a `PageNode { slug, path, frontmatter }` (+ `title` extraído de `frontmatter.title`)
- `PageContent { body, frontmatter, links }` ← EST-13a `PageNode { body, frontmatter, links }`
- `SearchResult { slug, title, score, snippet }` ← EST-13b `FtsResult { slug, title, score, snippet }`
- `KnowledgeViewApi.getContent(slug)` ← EST-13a `KnowledgeGraph.getNode(slug)` (programática → frontend API)
- `KnowledgeViewApi.search(query)` ← EST-13b `FtsIndex.search(term)` (programática → frontend API)
- `KnowledgeViewApi.getTree()` ← EST-13a `KnowledgeGraph` (construção de árvore a partir de todos os `PageNode[]`, hierarquia inferida de `path`)
- `knowledgeStore` consumido para cache ← EST-14a §1 (stores/ por domínio, view popula ao receber dados)
- Shell FlexLayout: view registrada como `component: 'knowledge'` ← EST-14a `App.tsx` layout com 5 tabs

### Decisões em aberto (1)
- **Transporte da API:** `KnowledgeViewApi.getTree/getContent/search` precisa de um mecanismo para chamar o backend plugin-knowledge. Opções: (a) REST endpoints servidos pelo host (EST-02) em `GET /knowledge/tree`, `GET /knowledge/content/:slug`, `GET /knowledge/search?q=`; (b) RPC via WS único (F3) com mensagens request/response. **Nenhuma das duas está especificada em fonte existente** — a hipótese "API REST" do triador foi inventada sem confirmar se o host expõe REST para plugins. Esta decisão precisa ser fechada antes do wiring real (pode ser resolvida por uma task separada de transporte ou pelo arquiteto). Para fins desta task (haiku), a view aceita `api` injetado — o mock/implements concreto do transporte fica para depois da decisão.

## 7. Definition of Done & Gate
- [ ] TreePanel exibe árvore de arquivos a partir de `api.getTree()`?
- [ ] ContentPanel renderiza markdown com suporte a wikilinks navegáveis?
- [ ] SearchBar executa busca FTS e exibe resultados?
- [ ] Estado vazio tratado (árvore vazia → mensagem)?
- [ ] 5/5 testes verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
```
Todos Exit Code 0. **Lint faz parte do gate** (Regra 3 do CLAUDE.md).

## 8. Log de Handover
### Handover do Executor:
-
### Parecer do Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
- **[2026-07-07T13:31]** - *big-pickle* - `[Triado]`: triado: haiku, tree browser + markdown + wikilinks + FTS, depende EST-14a/13
- **[2026-07-07T13:31]** - *big-pickle* - `[Endurecido]`: endureceu spec: contratos tree/search/api derivados EST-13a/b; transporte como decisao em aberto
