---
id: T-OFF-02
title: "doc perfil documento (blocos, Automerge, backlinks) + markdown simples"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-OFF-01", "T-PG-01", "T-403"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# T-OFF-02 · doc perfil documento (blocos, Automerge, backlinks) + markdown simples

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar editor de documentos rico (perfil `documento`) com blocos como CONTENT, colaboração Automerge,
backlinks nativos do grafo, e editor markdown simples para comentários/posts. Fonte: `caderno-3-sdk/27-suite-office.md §2`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/office/src/doc-editor.ts

export type DocBlockType = "heading" | "paragraph" | "image" | "table" | "code" | "callout" | "list";

export interface DocBlock {
  id: string;
  type: DocBlockType;
  content: unknown; // payload específico do tipo
  /** Backlinks para outros nós no grafo (wiki-links). */
  backlinks: string[]; // entity_ids
}

export interface DocEditorProps {
  /** Perfil de capacidade (sempre "documento"). */
  profile: "documento";
  /** Blocos iniciais (opcional). */
  initialBlocks?: DocBlock[];
  /** Se true, habilita colaboração Automerge. */
  collaborative?: boolean;
  /** Callback ao salvar/persistir (opt-in). */
  onPersist?: (blocks: DocBlock[]) => Promise<void>;
}

export interface RichDocEditor {
  /** Insere bloco no documento. */
  insertBlock(block: DocBlock, index?: number): void;
  /** Remove bloco por ID. */
  removeBlock(blockId: string): void;
  /** Atualiza conteúdo de um bloco. */
  updateBlock(blockId: string, content: unknown): void;
  /** Retorna array ordenado de blocos. */
  getBlocks(): DocBlock[];
  /** Resolve backlinks do grafo (wiki-links bidirecionais). */
  resolveBacklinks(): Map<string, string[]>; // entity_id → [page titles]
}

// --- packages/office/src/markdown-simple.ts 
---

export interface SimpleMarkdownEditor {
  /** Conteúdo atual em markdown. */
  getContent(): string;
  /** Atualiza conteúdo. */
  setContent(markdown: string): void;
  /** Renderiza preview HTML (leitura). */
  renderPreview(): string;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/27-suite-office.md](../docs/caderno-3-sdk/27-suite-office.md) §2 — Docs (Notion/Obsidian) e markdown simples
- [[perfil-de-capacidade]] — Perfil `documento` define whitelist de blocos permitidos
- [[sessao-colaborativa]] — Colaboração em tempo real via Automerge com opt-in de persistência

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/27-suite-office.md` §2, §7
- **[READ]** `packages/page-engine/src/capacity-profile.ts` — CapacityProfile, ProfileValidator (T-OFF-01)
- **[CREATE]** `packages/office/src/doc-editor.tsx` — componente React RichDocEditor
- **[CREATE]** `packages/office/src/markdown-simple.tsx` — componente SimpleMarkdownEditor
- **[CREATE]** `packages/office/src/doc-blocks.ts` — tipos de blocos + renderizadores
- **[CREATE]** `packages/office/tests/doc-editor.test.tsx` — testes RTL
- **[CREATE]** `packages/office/e2e/doc-editor.spec.ts` — Playwright
- **[UPDATE]** `packages/office/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** React Testing Library (JSDOM) para componentes; Playwright para E2E.
- [x] **Ambiente do Teste:** JSDOM para unitários; headless Chromium para E2E.
- [x] **Fora de Escopo:** Integração real com Automerge (T-403). Persistência no grafo (T-108). Colaboração multiplayer real (T-MOD-03).

Casos de teste (numerados):
1. Editor exibe blocos iniciais (heading + paragraph) corretamente.
2. `insertBlock({ type: "image", ... })` insere bloco de imagem; renderizado no DOM.
3. `removeBlock(id)` remove bloco; `getBlocks()` reflete remoção.
4. Bloco de código renderiza com syntax highlight.
5. Backlinks: `resolveBacklinks()` retorna referências bidirecionais do grafo.
6. `SimpleMarkdownEditor.setContent("# Título")` → `renderPreview()` retorna `<h1>Título</h1>`.
7. Perfil `documento` rejeita componente "game_engine" (validador de T-OFF-01).
8. Playwright: usuário digita, insere imagem, remove bloco, backlinks aparecem.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** construa um motor de páginas separado para docs — use o motor de páginas existente (T-PG-01) com perfil `documento`.
> - **NÃO** implemente Automerge do zero — use a abstração de T-403 (Documentos casca Automerge) como dependência.
> - **NÃO** invente sintaxe de wiki-link — backlinks são arestas do grafo, resolvidas por traversal. Use a API de T-108 (linhagem) para resolver.

### Pegadinhas conhecidas
- **Markdown simples NÃO é o motor de páginas:** o `SimpleMarkdownEditor` é um componente leve para comentários/posts — usa textarea + preview, não o FlexLayout de blocos. Não tente unificar com o RichDocEditor.
- **Backlinks são de graça no grafo (§2.1):** a plataforma é um grafo; wiki-links e retrolinks vêm do traversal. Não implemente índice de backlinks separado — consulte as arestas do grafo.
- **Colaboração é opt-in:** o editor funciona offline sem Automerge; quando `collaborative: true`, a sessão é envelopada por T-403. Sempre funciona em modo single-user primeiro.

1. **[TDD]** Crie `packages/office/tests/doc-editor.test.tsx` com casos 1–4, 6–7 (RTL).
2. Implemente `packages/office/src/doc-blocks.ts` com tipos e renderizadores de bloco.
3. Implemente `packages/office/src/doc-editor.tsx` com insert/remove/update/resolveBacklinks.
4. Implemente `packages/office/src/markdown-simple.tsx` com editor textarea + preview.
5. Adicione Playwright E2E (caso 8) em `packages/office/e2e/doc-editor.spec.ts`.
6. Re-exporte em `packages/office/src/index.ts`.
7. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] RichDocEditor suporta insert/remove/update de blocos (heading, paragraph, image, table, code)?
- [ ] Backlinks resolvidos via grafo (não índice separado)?
- [ ] SimpleMarkdownEditor renderiza preview HTML a partir de markdown?
- [ ] Perfil `documento` validado pelo ProfileValidator de T-OFF-01?
- [ ] `pnpm test` verde? Playwright E2E passa?

### Verificação automática
```bash
pnpm --filter @plataforma/office build
pnpm --filter @plataforma/office test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
