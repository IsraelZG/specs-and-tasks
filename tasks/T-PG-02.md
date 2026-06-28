---
id: T-PG-02
title: "renderizador React sobre o catalogo (resolve sources, avalia ZEN sob orcamento, render progressivo)"
status: draft
complexity: 5
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PG-01"]
blocks: ["T-PG-04", "T-PG-05"]
ui: true
---

# T-PG-02 · renderizador React sobre o catalogo (resolve sources, avalia ZEN sob orcamento, render progressivo)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (JSDOM) + `playwright` (smoke E2E)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o renderizador React que consome um `PageDocument` validado (T-PG-01), resolve fontes de dados (`sources`), avalia expressões ZEN sob orçamento de recurso (L3) e renderiza a árvore progressivamente (streaming para experiência de geração por IA). O renderizador é um motor único; cada caso de uso é um perfil de capacidade declarado na `SPEC:PAGE`.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §3 (fontes, ZEN, state), §4 (componentes ricos, code-splitting), §7 (render progressivo por streaming)
- Enriquecimento: [[catalogo-de-componentes]] — mapeia `component` → implementação React; [[spec-page]] — nó canônico

### Contratos TS (derivados do RAG §3, §4, §7)

```ts
// --- packages/pages/src/renderer.ts ---
import type { PageDocument, PageNode, PageSource, BindingOrExpression } from './schema';
import type { ReactElement } from 'react';

/** Perfil de capacidade do motor (§8). */
export type PageProfile = 'pagina_completa' | 'documento' | 'anuncio' | 'slide' | 'comentario_post';

export interface RenderBudget {
  maxTreeDepth: number;
  maxNodeCount: number;
  maxExpressionLength: number;
  /** Milissegundos máximos por ciclo de render. */
  evalBudgetMs: number;
  maxDocumentSizeBytes: number;
}

export interface ResolvedSource {
  data: unknown;
  error?: string;
}

export interface SourceResolver {
  resolve(source: PageSource, routeParams: Record<string, string>, sessionCtx: SessionContext): Promise<ResolvedSource>;
}

export interface SessionContext {
  persona_id: string;
  theme: string;
  locale: string;
  jurisdiction?: string;
}

export interface ZenEvaluationResult {
  value: unknown;
  budgetExhausted: boolean;
  error?: string;
}

export interface ZenEvaluator {
  /**
   * Avalia expressão ZEN sobre as fontes resolvidas e estado local.
   * Deve ser interrompível sob o orçamento L3 (execução em Worker).
   * Retorna `budgetExhausted: true` se o orçamento estourar.
   */
  evaluate(expression: string, context: ZenContext, budgetMs: number): ZenEvaluationResult;
}

export interface ZenContext {
  sources: Record<string, unknown>;
  state: Record<string, unknown>;
}

export interface ComponentResolver {
  /**
   * Resolve nome de componente do catálogo para implementação React.
   * Componentes ricos (planilha, player) usam React.lazy para code-splitting.
   */
  resolve(name: string): React.ComponentType<unknown> | null;
}

export interface RenderOptions {
  /** Se true, emite atualizações parciais conforme a árvore é construída (streaming). */
  progressive: boolean;
}

export interface RenderResult {
  element: ReactElement;
  budgetExhausted: boolean;
  diagnostics: string[];
}

export interface PageRenderer {
  render(
    doc: PageDocument,
    resolver: SourceResolver,
    zen: ZenEvaluator,
    components: ComponentResolver,
    budget: RenderBudget,
    sessionCtx: SessionContext,
    options?: RenderOptions
  ): Promise<RenderResult>;
}

/** State local transiente de render — descartável, nunca replicado (§3.5). */
export interface PageState {
  [key: string]: unknown;
}

export interface PageStateStore {
  getState(): PageState;
  setState(field: string, value: unknown): void;
  subscribe(listener: () => void): () => void;
}

/** Adaptador para fontes editoriais (Automerge CRDT — §3.6). */
export interface EditorialSourceAdapter {
  /** Assina mutations do CRDT e notifica quando dados mudam. */
  subscribe(docId: string, onChange: (data: unknown) => void): () => void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/11-linguagem-de-paginas.md](../docs/caderno-3-sdk/11-linguagem-de-paginas.md) §3 (fontes, ZEN, state), §4 (componentes ricos, code-splitting), §7 (render progressivo por streaming), §8 (perfis)
- [docs/conceitos/catalogo-de-componentes.md](../docs/conceitos/catalogo-de-componentes.md) — ComponentResolver mapeia para React
- [docs/conceitos/spec-page.md](../docs/conceitos/spec-page.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/pages/src/schema.ts` (tipos base — T-PG-01)
- **[READ]** `packages/pages/src/validator.ts` (validador — T-PG-01)
- **[READ]** `docs/caderno-3-sdk/11-linguagem-de-paginas.md`
- **[CREATE]** `packages/pages/src/renderer.ts` — PageRenderer, contratos de portas
- **[CREATE]** `packages/pages/src/zen-evaluator.ts` — ZenEvaluator com orçamento e executor em Worker
- **[CREATE]** `packages/pages/src/source-resolver.ts` — resolve fontes contra projeções/TinyBase
- **[CREATE]** `packages/pages/src/component-resolver.ts` — mapeia catálogo → React (React.lazy)
- **[CREATE]** `packages/pages/src/page-renderer.tsx` — implementação PageRenderer
- **[CREATE]** `packages/pages/src/progressive-renderer.ts` — streaming de árvore parcial
- **[CREATE]** `packages/pages/tests/renderer.test.tsx` — JSDOM (vitest + React Testing Library)
- **[UPDATE]** `packages/pages/src/index.ts` — adicionar exports

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (JSDOM) + React Testing Library para render; Playwright para smoke E2E
- [x] **Ambiente do Teste:** JSDOM (`pnpm --filter @plataforma/pages test`)
- [x] **Fora de Escopo:** EXTENDS (T-PG-03), formulários (T-PG-04), vetores adversariais (T-PG-05)

Casos de teste (numerados):
1. Renderiza `PageDocument` mínimo (1 nó Card) → elemento React contém `<Card>`.
2. Resolve `$bind` sobre fonte → prop `title` recebe valor da fonte resolvida.
3. Resolve `$zen` (ex.: concatenação de duas fontes) → valor derivado correto.
4. Expressão ZEN com `visible: { $zen: "false" }` → nó NÃO aparece no output.
5. Expressão ZEN com `visible: { $zen: "true" }` → nó aparece no output.
6. Componente desconhecido no catálogo → diagnóstico, fallback, sem crash.
7. Orçamento de avaliação ZEN estoura (`budgetExhausted: true`) → render aborta com diagnóstico.
8. Resolução de fonte falha → nó mostra fallback de erro.
9. `state` local: `set_state` atualiza e re-renderiza sem perder outros campos.
10. `navigate` dispara callback de navegação sem alterar DOM.
11. `intent` dispara callback de emissão de intent com payload montado.
12. Render progressivo: árvore parcial válida é emitida antes do documento completo.
13. Componente rico (ex.: planilha) é carregado via React.lazy (code-splitting).
14. Perfil `documento`: componentes não-documento (ex.: Card) são rejeitados.
15. Smoke E2E (Playwright): página mínima renderiza no browser sem erro de console.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente a lógica de resolução real de fontes contra TinyBase — use mock/stub.
> - NÃO implemente o motor ZEN real — use um stub que avalia expressões triviais.
> - NÃO implemente EXTENDS (T-PG-03).
> - NÃO renderize HTML/CSS inline — só componentes do catálogo (L2).

### Pegadinhas conhecidas
- O ZenEvaluator deve rodar em Web Worker para ser interrompível sem bloquear main thread. O stub pode ser síncrono no teste JSDOM, mas a interface deve suportar abort.
- `state` da página é transiente e NUNCA replicado (§3.5). Não confundir com sessão-doc editorial.
- Componentes ricos (planilha, player) são carregados via `React.lazy` — o `ComponentResolver.resolve()` retorna um wrapper lazy, não o componente direto.
- `$bind` é açúcar — internamente convertido para `$zen` antes da avaliação.

1. **[TDD]** Escreva `packages/pages/tests/renderer.test.tsx` com os 15 casos (RED).
2. Implemente `packages/pages/src/zen-evaluator.ts` (stub com orçamento).
3. Implemente `packages/pages/src/source-resolver.ts` (stub que retorna dados mockados).
4. Implemente `packages/pages/src/component-resolver.ts` (mapeamento catálogo → React.lazy).
5. Implemente `packages/pages/src/page-renderer.tsx` (árvore recursiva, resolução de props, visibilidade ZEN).
6. Implemente `packages/pages/src/progressive-renderer.ts` (streaming incremental).
7. Atualize `packages/pages/src/index.ts`.
8. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` — OK (103 linhas)
- `docs/conceitos/catalogo-de-componentes.md` — OK
- `docs/conceitos/spec-page.md` — OK
- `packages/pages/src/schema.ts` — será criado por T-PG-01 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] Todos os 14 casos de teste (vitest) passam?
- [ ] Playwright smoke (caso 15) não produz erro de console?
- [ ] O renderizador NÃO injeta HTML/CSS inline (L2)?
- [ ] `state` local é transiente e não persiste entre montagens diferentes?
- [ ] Orçamento estourado produz `budgetExhausted: true` sem crash?

### Verificação automática
```bash
pnpm --filter @plataforma/pages build
pnpm --filter @plataforma/pages test
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
