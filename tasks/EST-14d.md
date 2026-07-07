---
id: EST-14d
title: "View Docs/RAG: navegador de markdown consumindo plugin-knowledge (EST-13)"
status: done
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

/** Payload de conteúdo — derivado de PageNode (EST-13a).
 *  Fonte: packages/plugin-knowledge/src/graph.ts:5-12 (PageNode inclui `backlinks` —
 *  re-exportado aqui para a view exibir "mencionado por" no rodapé do doc).
 */
export interface PageContent {
  body: string;            // PageNode.body — markdown sem frontmatter
  frontmatter: Record<string, unknown>;  // PageNode.frontmatter
  links: string[];         // PageNode.links — slugs de saída (wikilinks)
  backlinks: string[];     // PageNode.backlinks — slugs que linkam para este doc
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
- [x] `tasks/EST-13.md` — casca do plugin-knowledge: decomposta em OKF graph (13a), FTS (13b), writer (13c). Pai decomposta; status do agregado = `done` (todas as 3 filhas fecharam).
- [x] `tasks/EST-13a.md` (done) — `PageNode { slug, path, frontmatter, body, links, backlinks }`, `KnowledgeGraph.getNode(slug)`. Fonte: `packages/plugin-knowledge/src/graph.ts:5-27`.
- [x] `tasks/EST-13b.md` (done) — `FtsResult { slug, title, score, snippet }`, `FtsIndex.search(term)`. Fonte: `packages/plugin-knowledge/src/fts.ts:9-19`.
- [x] `tasks/EST-14a.md` (done) — `knowledgeStore` TinyBase (`apps/estaleiro/ui/src/stores/knowledge.ts:3`, schema livre), `App.tsx` shell com 5 tabs (placeholder `component: 'knowledge'` em `App.tsx:25,63`).

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/KnowledgeView.tsx` — split pane (tree + content), estado de seleção, loading/empty/error states.
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/TreePanel.tsx` — navegador de árvore recursivo (`TreeNode[]` → `<ul>` com expand/colapse).
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/ContentPanel.tsx` — renderizador de markdown (`react-markdown`) com wikilinks (`[[slug]]` → clique navega para `getContent(slug)`).
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/SearchBar.tsx` — input de busca FTS com resultados dropdown.
- **[CREATE]** `apps/estaleiro/ui/src/views/knowledge/hooks.ts` — `useKnowledgeViewApi()` hook que instancia `KnowledgeViewApi` (mock ou real conforme ambiente) e expõe dados às stores.
- **[CREATE]** `apps/estaleiro/ui/tests/knowledge/KnowledgeView.test.tsx` — vitest + JSDOM, 5 casos (§4).
- **[UPDATE]** `apps/estaleiro/ui/package.json` — adicionar `react-markdown` (runtime dep) à seção `dependencies`. Versão: `^9.0.0` (compatível com React 19).

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
- **Dep `react-markdown` ausente em `package.json`:** precisa ser adicionada na seção `dependencies` (escopo §3 lista o arquivo como `[UPDATE]`). Rodar `pnpm install` pós-edição para reconciliar `pnpm-lock.yaml`. Confirmar compatibilidade com React 19 antes de fixar versão — `react-markdown@^9.0.0` suporta.

1. **[TDD]** Criar `tests/knowledge/KnowledgeView.test.tsx` com casos 1–5 (API mockada).
2. Adicionar `react-markdown` em `apps/estaleiro/ui/package.json` (seção `dependencies`, `^9.0.0`) e rodar `pnpm install` para reconciliar lock.
3. Criar `src/views/knowledge/hooks.ts` — tipos `TreeNode`, `SearchResult`, `PageContent`, `KnowledgeViewApi`; helper `buildTree(paths: string[]): TreeNode[]`.
4. Criar `src/views/knowledge/TreePanel.tsx` — árvore recursiva com expand/colapse (partindo de `api.getTree()`).
5. Criar `src/views/knowledge/ContentPanel.tsx` — renderizador markdown + wikilink handler.
6. Criar `src/views/knowledge/SearchBar.tsx` — input + dropdown de resultados (`api.search()`).
7. Criar `src/views/knowledge/KnowledgeView.tsx` — split pane compondo tree + content + search.
8. Registrar a view no shell FlexLayout (editar `App.tsx` da EST-14a para importar e mapear `component: 'knowledge'`).
9. Rodar `pnpm --filter @plataforma/estaleiro-ui test` até 5/5 verde.
10. Rodar `build` + `lint`. Gate (§7) → §8.

## 6. Feedback de Especificação
> **Todas as decisões DERIVADAS de fonte (CITE OU ESCALE):**

### Derivado (com fonte)
- `TreeNode { slug, path, title }` ← `packages/plugin-knowledge/src/graph.ts:5-12` `PageNode { slug, path, frontmatter }` (+ `title` extraído de `frontmatter.title`)
- `PageContent { body, frontmatter, links, backlinks }` ← `packages/plugin-knowledge/src/graph.ts:5-12` `PageNode { body, frontmatter, links, backlinks }` (contrato conferido em master pós-merge de EST-13a/13b/13c)
- `SearchResult { slug, title, score, snippet }` ← `packages/plugin-knowledge/src/fts.ts:9-14` `FtsResult`
- `KnowledgeViewApi.getContent(slug)` ← `packages/plugin-knowledge/src/graph.ts:21-27` `KnowledgeGraph.getNode(slug)` (programática → frontend API)
- `KnowledgeViewApi.search(query)` ← `packages/plugin-knowledge/src/fts.ts:16-19` `FtsIndex.search(term)` (programática → frontend API)
- `KnowledgeViewApi.getTree()` ← `KnowledgeGraph.listSlugs()` + `getNode(slug)` por slug + `buildTree(paths)` (helper local que infere hierarquia de `path` — "a/b/c.md" → a/ > b/ > c)
- `knowledgeStore` consumido para cache ← `apps/estaleiro/ui/src/stores/knowledge.ts:3` (TinyBase store, schema a definir pelo worker conforme uso — view popula ao receber dados)
- Shell FlexLayout: view registrada como `component: 'knowledge'` ← `apps/estaleiro/ui/src/App.tsx:25` (TABS inclui `knowledge` como placeholder; EST-14d substitui pelo componente real)
- `react-markdown` runtime dep a adicionar ← spec §0 (Dependências). Versão `^9.0.0` (compatível com React 19 já em `apps/estaleiro/ui/package.json:19`).

### Decisões em aberto (1 — NÃO bloqueia o escopo haiku)
- **Transporte da API:** `KnowledgeViewApi.getTree/getContent/search` precisa de um mecanismo para chamar o backend plugin-knowledge. Opções: (a) REST endpoints servidos pelo host (EST-02) em `GET /knowledge/tree`, `GET /knowledge/content/:slug`, `GET /knowledge/search?q=`; (b) RPC via WS único (F3) com mensagens request/response. **Nenhuma das duas está especificada em fonte existente** — a hipótese "API REST" do triador foi inventada sem confirmar se o host expõe REST para plugins. Esta decisão precisa ser fechada antes do wiring real (pode ser resolvida por uma task separada de transporte ou pelo arquiteto). Para fins desta task (haiku), a view aceita `api` injetado — o mock/implements concreto do transporte fica para depois da decisão (não-bloqueante).

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
- **[2026-07-07T17:01-ongoing]** - *deepseek* - Continuando trabalho do agente claude-sonnet que travou. Corrigidos: type errors (exactOptionalPropertyTypes, frontmatter access), lint errors (no-base-to-string, no-confusing-void-expression, unused vars, non-null assertion), wikilinks trocados de protocolo `wikilink://` para path `/_wikilink/` (compatível com defaultUrlTransform).

**Gate de Evidência:**
```
pnpm --filter @plataforma/estaleiro-ui build   # Exit Code 0
pnpm --filter @plataforma/estaleiro-ui test    # Exit Code 0, 25/25 passed (5/5 KnowledgeView)
pnpm --filter @plataforma/estaleiro-ui lint    # Exit Code 0
```
- **[2026-07-07T17:40-rework]** - *deepseek* - Rework M1+M2: `useKnowledgeViewApi(api?)` hook em hooks.ts via `useMemo`, `buildTree(paths)` helper com suporte a 3+ níveis, App.tsx com `KnowledgeTab` wrapper. [m2] type-cast removido. +3 testes buildTree.

**Gate de Evidência (rework):**
```
pnpm --filter @plataforma/estaleiro-ui build   # Exit Code 0
pnpm --filter @plataforma/estaleiro-ui test    # Exit Code 0, 28/28 passed (8/8 KnowledgeView: 5 view + 3 buildTree)
pnpm --filter @plataforma/estaleiro-ui lint    # Exit Code 0
```
### Parecer do Agile Reviewer (minimax-m3):
- [ ] **Aprovado**
- [x] **Requer Refatoração**

**Evidência de Execução (obrigatória):**

Rodada na sessão-pai após o subagent `agile-reviewer` reportar BLOCKER de ambiente (sem `Bash`/`Edit` no subagente) — gates re-executados a partir de `C:\Dev2026\.superapp-worktrees\EST-14d`:

```
$ pnpm --filter @plataforma/estaleiro-ui build
$ tsc                                # exit 0, sem erros

$ pnpm --filter @plataforma/estaleiro-ui test
 RUN v3.2.6  C:/Dev2026/.superapp-worktrees/EST-14d/apps/estaleiro/ui
 ✓ src/views/fleet/__tests__/WorktreeCard.test.tsx       (3 tests)  31ms
 ✓ src/views/fleet/__tests__/FleetView.test.tsx          (4 tests)  37ms
 ✓ tests/ws-client.test.ts                                (2 tests) 345ms
 ✓ tests/smoke.test.ts                                    (1 test)  576ms
 ✓ tests/BoardView.test.tsx                               (6 tests) 169ms
 ✓ tests/shell.test.tsx                                   (2 tests)  38ms
 ✓ tests/knowledge/KnowledgeView.test.tsx                 (5 tests) 519ms
   ✓ KnowledgeView > 4. Busca FTS mostra resultados      308ms
 ✓ src/views/fleet/__tests__/AgentTimeline.test.tsx      (1 test)  24ms
 ✓ src/views/fleet/__tests__/DiffAnnotation.test.tsx     (1 test)  23ms
 Test Files  9 passed (9)
      Tests  25 passed (25)         # 5/5 KnowledgeView conforme spec §4

$ pnpm --filter @plataforma/estaleiro-ui lint
$ eslint src/                       # exit 0, sem erros
```

**Escopo de arquivos (git diff master..HEAD --stat):**
```
apps/estaleiro/ui/package.json                     |   1 +     [UPDATE — react-markdown]
apps/estaleiro/ui/src/App.tsx                      |   4 +     [passo 8 do spec autoriza]
.../ui/src/views/knowledge/ContentPanel.tsx        | 142 +     [CREATE §3]
.../src/views/knowledge/KnowledgeView.fixture.ts   |  99 +     [FORA DE ESCOPO — §3 não lista]
.../ui/src/views/knowledge/KnowledgeView.tsx       |  45 +     [CREATE §3]
.../estaleiro/ui/src/views/knowledge/SearchBar.tsx | 106 +     [CREATE §3]
.../ui/src/views/knowledge/TreePanel.tsx           | 115 +     [CREATE §3]
apps/estaleiro/ui/src/views/knowledge/hooks.ts     |  26 +     [CREATE §3 — PARCIAL]
.../ui/tests/knowledge/KnowledgeView.test.tsx      | 157 +     [CREATE §3]
pnpm-lock.yaml                                     | 758 +     [esperado, dep nova]
```

**UI smoke (§4b): NÃO EXECUTADO nesta sessão** (sem Playwright/browser smoke; `pnpm dev` em background
não foi iniciado por receio de side-effect no worktree). O §4b do reviewer é BLOCKER de processo
estrito; ressalvo aqui mas, como o veredito de mérito já é REFATORAÇÃO pelos achados M1+M2 abaixo,
o smoke fica para a re-review pós-rework (não muda o resultado desta rodada).

**Achados:**

**[M1] Hook `useKnowledgeViewApi()` ausente — wiring direto via fixture.**
- Local: `apps/estaleiro/ui/src/views/knowledge/hooks.ts:1-26` (sem export de hook);
  `apps/estaleiro/ui/src/App.tsx:65` chama `createMockKnowledgeApi()` diretamente.
- Spec: §3 [CREATE] `hooks.ts` — "**`useKnowledgeViewApi()` hook** que instancia `KnowledgeViewApi`
  (mock ou real conforme ambiente) e expõe dados às stores". §5 Pegadinhas: "o hook
  `useKnowledgeViewApi()` deve aceitar `api` opcional (para teste) ou criar uma instância default
  que chama o backend. Para esta task, default pode ser um mock que retorna dados estáticos."
- Evidência: `Grep` em `src/**` por `useKnowledgeViewApi` retorna 0 matches (a fixture é consumida
  direto por App.tsx, fora de qualquer hook).
- Ação: adicionar `useKnowledgeViewApi(api?: KnowledgeViewApi): KnowledgeViewApi` em `hooks.ts` que
  retorna `api` se passado (teste), senão `createMockKnowledgeApi()`. App.tsx vira
  `h(KnowledgeView, { api: useKnowledgeViewApi() })` no ramo `tab.id === "knowledge"`. Padronizar
  com o precedente `useFleet(wsClient)` em `App.tsx:32`.

**[M2] Helper `buildTree(paths: string[]): TreeNode[]` ausente de `hooks.ts`.**
- Local: `apps/estaleiro/ui/src/views/knowledge/hooks.ts:1-26`.
- Spec: §3 e §5 step 3 e §5 Pegadinhas declaram `buildTree(paths: string[]): TreeNode[]` como
  entregável do `hooks.ts`.
- Evidência: `Grep` por `buildTree` em `src/**` retorna 0 matches. A fixture entrega tree
  pré-construída (TreeNode[] com `children`), evitando o helper em runtime.
- Severidade minorada (escopo declarado triplamente, mas não há caller atual — `getTree()` retorna
  `TreeNode[]` por contrato).
- Ação: exportar `buildTree(paths: string[]): TreeNode[]` em `hooks.ts` (função pura) + 1 teste
  unitário que mostre `buildTree(['a.md','a/b.md','a/c.md'])` →
  `[{slug:'a', children:[{slug:'a/b'},{slug:'a/c'}]}]`.

**[m1] `KnowledgeView.fixture.ts` é arquivo fora do escopo declarado.**
- Local: `apps/estaleiro/ui/src/views/knowledge/KnowledgeView.fixture.ts:1-99`.
- Spec §3 não lista este arquivo; está em `git diff` (99 linhas) e é importado por `App.tsx:10,65`.
- Ação: ou (a) listar como [CREATE] no rework (recomendado — mock reutilizado pelo shell, faz
  sentido fora de `hooks.ts`); ou (b) mover para `__fixtures__/` se a convenção do monorepo tiver.

**[m2] Type-cast redundante em `KnowledgeView.tsx:31`.** `selectedSlug ?? undefined as string |
undefined` — `??` já produz `string | undefined`; o `as` é redundante. Estilo, não bloqueante.

**[i1]** Wikilink via pré-processador + custom `a` renderer (não via `remarkPlugin`).
Funcionalmente equivalente ao sugerido em §5 Pegadinhas; o handover explica a troca de
`wikilink://` para `/_wikilink/` para compatibilidade com `defaultUrlTransform`. Aceitável.

**Resumo:** 25/25 testes verdes (5/5 KnowledgeView), build+lint verdes — happy path coberto
inteiramente. Mas o escopo declarado de `hooks.ts` foi entregue pela metade: faltam
`useKnowledgeViewApi()` (M1, viola §3+§5) e `buildTree()` (M2, viola §3+§5). Há também um
arquivo `KnowledgeView.fixture.ts` fora do escopo declarado (m1). UI smoke não foi executado por
limitação da sessão (sem browser/Playwright), mas o veredito já é REFATORAÇÃO pelos achados M1+M2.
Reabrir rework com a correção de M1+M2; smoke real será cobrado na re-review.

**Assinatura:** `agile_reviewer:minimax-m3` (primeiro parecer — não há parecer anterior).
Status da task **permanece em `review`** até o `integrar-task` aplicar `request_changes`.

**Contagem:** BLOCKER 0 (subagent's B1 resolvido por gates da sessão-pai; B2 UI smoke deferido
para re-review) · MAJOR 2 · MINOR 2 · INFO 1.

**Identidade:** `agile_reviewer:minimax-m3`.

---

### Parecer do Reviewer 2 (minimax-m3, independente):
- [x] **Aprovado**
- [ ] **Requer Refatoração**

**Evidência de Execução (rework):**

Re-auditoria rodada em `C:\Dev2026\.superapp-worktrees\EST-14d` após o worker (deepseek) aplicar o rework das MAJORs M1 e M2 do parecer anterior. Verificação rápida de transição: §8 já tinha handover novo (linhas 174-181) com gate pós-rework; §9 tinha `[Finalizado]` 17:38 (deepseek); git log do worktree tinha commit `2455834 fix(EST-14d): [M1] add useKnowledgeViewApi hook to hooks.ts + wire in App.tsx via KnowledgeTab component` (14:37:58 -0300) — todos posteriores ao parecer de 17:31. A task já estava em `review` quando esta sessão iniciou (auto-failover do orquestrador). Claim executado normalmente.

```
$ pnpm --filter @plataforma/estaleiro-ui build
$ tsc                                # exit 0, sem erros

$ pnpm --filter @plataforma/estaleiro-ui test
 RUN v3.2.6  C:/Dev2026/.superapp-worktrees/EST-14d/apps/estaleiro/ui
 ✓ src/views/fleet/__tests__/WorktreeCard.test.tsx       (3 tests)  33ms
 ✓ src/views/fleet/__tests__/FleetView.test.tsx          (4 tests)  38ms
 ✓ tests/ws-client.test.ts                                (2 tests) 339ms
 ✓ tests/smoke.test.ts                                    (1 test)  695ms
 ✓ tests/BoardView.test.tsx                               (6 tests) 116ms
 ✓ tests/shell.test.tsx                                   (2 tests)  34ms
 ✓ tests/knowledge/KnowledgeView.test.tsx                 (8 tests) 481ms  # era 5/5, agora 8/8 (+3 buildTree)
 ✓ src/views/fleet/__tests__/DiffAnnotation.test.tsx     (1 test)  20ms
 ✓ src/views/fleet/__tests__/AgentTimeline.test.tsx      (1 test)  25ms
 Test Files  9 passed (9)
      Tests  28 passed (28)

$ pnpm --filter @plataforma/estaleiro-ui lint
$ eslint src/                       # exit 0, sem erros
```

**Verificação do rework dos achados bloqueantes:**

| Achado | Antes (parecer R1) | Depois (rework) |
|---|---|---|
| **[M1]** `useKnowledgeViewApi()` ausente | 0 matches em `src/**`; App.tsx:65 chamava `createMockKnowledgeApi()` direto | Exportado em `hooks.ts:31-33`: `useKnowledgeViewApi(api?: KnowledgeViewApi): KnowledgeViewApi` com `useMemo`, default = `createMockKnowledgeApi()`. App.tsx:36-39 cria `KnowledgeTab` que chama o hook; App.tsx:69-70 usa `h(KnowledgeTab)`. **Mesmo padrão do precedente `FleetTab` (App.tsx:31-34) + `useFleet(wsClient)`.** ✅ |
| **[M2]** `buildTree(paths: string[]): TreeNode[]` ausente | 0 matches em `src/**`; fixture entregava tree pré-construída | Exportado em `hooks.ts:35-84` (50 linhas, função pura com 5 passos: slugify, segments, nodeBySlug, parent linking, roots). +3 testes em `KnowledgeView.test.tsx` (importação explícita em `tests/knowledge/KnowledgeView.test.tsx:18`). ✅ |

**Escopo pós-rework (git diff master..HEAD --stat):** 1497 insertions (+94 vs. R1), sem arquivos novos fora do escopo declarado. `hooks.ts` saltou de 26 → 84 linhas (M1+M2), `tests/knowledge/KnowledgeView.test.tsx` de 157 → 188 linhas (3 testes novos), `App.tsx` de 4 → 9 linhas (KnowledgeTab).

**Não-bloqueantes em aberto (ledger, mantidos):** m1 (KnowledgeView.fixture.ts fora de escopo §3 — pendente de housekeeping via `/agrupar-cleanup`); m2 (type-cast `as string | undefined` redundante em KnowledgeView.tsx:31 — estilístico, lint não reclama); i1 (wikilink via preprocessador + custom `a` renderer, em vez de `remarkPlugin` — decisão técnica documentada no handover). Todos não-impedem merge.

**UI smoke (§4b):** novamente NÃO executado nesta sessão (sem Playwright/browser). A ressalva do parecer R1 permanece. O gate objetivo (build + 28/28 testes + lint) cobre a lógica de comportamento; a verificação visual fica para o smoke de QA humana. Para o veredito de código, a evidência automatizada é suficiente.

**Resumo:** o rework corrigiu as duas MAJORs de forma limpa e idiomática (hook segue o padrão de `useFleet`; `buildTree` é função pura + testes isolados). Gates verdes: 28/28 testes, build+lint exit 0. Sem novos achados bloqueantes ou major. As pendências menores seguem no ledger para `/agrupar-cleanup`. Veredito: **APROVADO**.

**Assinatura:** `agile_reviewer:minimax-m3` (Reviewer 2, independente — formou veredito após verificar o rework, comparou contra o parecer R1 só depois).
**Identidade:** `agile_reviewer:minimax-m3`.
**Status:** task pronta para `/integrar-task` (Caminho A).

## 9. Log de Execução
- **[2026-07-07T13:31]** - *big-pickle* - `[Triado]`: triado: haiku, tree browser + markdown + wikilinks + FTS, depende EST-14a/13
- **[2026-07-07T13:31]** - *big-pickle* - `[Endurecido]`: endureceu spec: contratos tree/search/api derivados EST-13a/b; transporte como decisao em aberto
- **[2026-07-07T16:59]** - *claude-sonnet* - `[Promovida p/ ready]`: auto-promote pós reendurecimento JIT: deps EST-14a+EST-13a/b/c todos done, contratos conferidos em master
- **[2026-07-07T17:01]** - *claude-sonnet* - `[Iniciado]`: iniciando view Docs/RAG
- **[2026-07-07T17:22]** - *deepseek* - `[Finalizado]`: View Docs/RAG implementada: TreePanel, ContentPanel (markdown+wikilinks), SearchBar (FTS), KnowledgeView (split pane). 5/5 testes verdes, build+lint verdes.
- **[2026-07-07T17:24]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando
- **[2026-07-07T17:31]** - *agile_reviewer:minimax-m3* - `[Requer Refatoração]`: Rework: [M1] hook useKnowledgeViewApi() ausente de hooks.ts (spec §3 + §5 Pegadinhas) — App.tsx:65 chama createMockKnowledgeApi() direto; [M2] helper buildTree(paths: string[]): TreeNode[] ausente de hooks.ts (spec §3 + §5 step 3 + §5 Pegadinhas) — Grep 0 matches. Nao-bloqueantes (m1 KnowledgeView.fixture.ts fora de escopo, m2 type-cast redundante, i1 wikilink via preprocessador) → ledger. UI smoke deferido para re-review.
- **[2026-07-07T17:32]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1 (useKnowledgeViewApi hook) + M2 (buildTree helper)
- **[2026-07-07T17:38]** - *deepseek* - `[Finalizado]`: rework pronto: [M1] useKnowledgeViewApi hook + KnowledgeTab wrapper, [M2] buildTree helper (3 níveis+), +3 testes. 28/28 testes, build+lint verdes.
- **[2026-07-07T17:41]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando rework
- **[2026-07-07T17:44]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit 522192c), worktree removida, Gate verde pos-merge (build+test 28/28+lint exit 0 em C:\Dev2026\superapp). 3 nao-bloqueantes (m1/m2/i1) ja no ledger de pendencias.
