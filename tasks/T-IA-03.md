---
id: T-IA-03
title: "recuperacao hibrida RRF (FTS+vetor+traversal) com filtro de permissao + bypass escalar"
status: draft
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-IA-01", "T-IA-02"]
blocks: ["T-IA-04", "T-IA-05"]
---

# T-IA-03 · recuperacao hibrida RRF (FTS+vetor+traversal) com filtro de permissao + bypass escalar

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar recuperação híbrida por Reciprocal Rank Fusion (RRF) combinando 3 sinais: léxico (`search_index_fts`), semântico (`vector_index`), e estrutural (GraphRAG — traversal de arestas a partir dos candidatos). Com filtro de permissão (só recupera nós que o principal pode ler). Bypass escalar: consultas determinísticas (contagem, soma, status) não passam por IA — resolvem-se nas projeções SQLite.
**Fonte:** `caderno-3-sdk/14-ia-rag-e-agentes.md §3` — RRF + GraphRAG, permissão, bypass. **Conceitos:** [[recuperacao-hibrida]], [[agente-de-ia]].

### Contratos exatos

```ts
// --- packages/rag/src/hybrid-retrieval.ts ---

/** Sinal de busca (um dos 3 eixos do RRF). */
export type RetrievalSignal = 'fts' | 'vector' | 'graph';

/** Resultado ranqueado de recuperação. */
export interface RankedResult {
  nodeId: string;
  score: number; // RRF score combinado
  signals: {
    ftsScore: number;
    vectorScore: number;
    graphScore: number;
  };
  /** Vizinhança estrutural (GraphRAG): arestas relevantes. */
  graphContext?: {
    relatedNodes: string[];
    edgeTypes: string[];
  };
}

/** Query de recuperação híbrida. */
export interface HybridQuery {
  /** Texto para busca léxica (FTS). */
  textQuery: string;
  /** Vetor para busca semântica (opcional). */
  vectorQuery?: Float32Array;
  /** Nó âncora para traversal estrutural (opcional). */
  anchorNodeId?: string;
  /** Máximo de resultados. */
  topK: number;
  /** Sinais a incluir (default: todos). */
  signals?: RetrievalSignal[];
  /** Se true, bypass: resolve nas projeções relacionais, sem IA. */
  bypassScalar?: boolean;
}

/** Resultado da recuperação híbrida. */
export interface HybridRetrievalResult {
  results: RankedResult[];
  /** Sinais efetivamente usados. */
  signalsUsed: RetrievalSignal[];
  /** Se bypass escalar foi aplicado. */
  bypassed: boolean;
  latencyMs: number;
}

/** Motor de recuperação híbrida (RRF + GraphRAG). */
export interface HybridRetrieval {
  /**
   * Executa recuperação híbrida com RRF.
   * Combina FTS, vetor e grafo via Reciprocal Rank Fusion.
   */
  retrieve(query: HybridQuery, principalId: string): Promise<HybridRetrievalResult>;

  /**
   * Bypass escalar: consultas determinísticas resolvidas nas projeções SQLite.
   */
  scalarQuery(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

/** Parâmetros do RRF. */
export interface RRFParams {
  /** Constante de suavização (default: 60). */
  k: number;
  /** Pesos por sinal (default: fts=0.4, vector=0.4, graph=0.2). */
  weights: Record<RetrievalSignal, number>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/14-ia-rag-e-agentes.md](../docs/caderno-3-sdk/14-ia-rag-e-agentes.md) — §3 (RRF 3 sinais, permissão na recuperação, bypass escalar, traversal ancorado em projeções)
- [[recuperacao-hibrida]] — definição canônica
- [[agente-de-ia]] — consumidor da recuperação

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/vector-index/src/vector-index.ts` — `VectorIndex` (T-IA-01)
- **[READ]** `packages/protocol/src/ports.ts` — `StoragePort` (T-004 ready, para FTS e projeções relacionais)
- **[CREATE]** `packages/rag/src/hybrid-retrieval.ts` — `HybridRetrieval`, `RRFParams`, implementação
- **[CREATE]** `packages/rag/tests/hybrid-retrieval.test.ts` — testes RRF + bypass + permissão
- **[UPDATE]** `packages/rag/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/rag test`).
- [x] **Fora de Escopo:** FTS real (mock), embedding real, grafo real, verificação de permissão real.

Casos de teste:
1. RRF combina 3 sinais: resultado com match em FTS+vetor+grafo tem score > resultado só FTS.
2. `topK=5` retorna no máximo 5 resultados.
3. `signals=['fts']` só usa busca léxica — `vectorScore` e `graphScore` = 0.
4. `bypassScalar=true` → `scalarQuery` executada, `retrieve` retorna `bypassed: true`.
5. `principalId` filtra: nó sem permissão não aparece nos resultados.
6. RRF com `k=60` produz scores no intervalo esperado (0–1 normalizado).
7. Query sem `vectorQuery` → sinal vetorial ignorado (weight redistribuído).
8. Latência reportada em `latencyMs` > 0.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente FTS real nem índice vetorial real. Use mocks injetáveis.
> - **NÃO** implemente verificação de permissão real — use função dummy `(nodeId, principalId) => boolean`.
> - **NÃO** implemente traversal de grafo real — use lookup em `Map<string, string[]>`.

### Pegadinhas conhecidas
- RRF: `score = sum_over_signals(weight_s / (k + rank_s))`. Rank 1-based (primeiro = 1, não 0).
- Filtro de permissão é aplicado ANTES do RRF (cada sinal só retorna nós permitidos), não depois.
- `bypassScalar` delega totalmente ao `StoragePort.exec()` — se o SQL falhar, a exceção propaga.
- Os pesos devem somar 1.0 — validar no constructor.

1. **[TDD]** Crie `packages/rag/tests/hybrid-retrieval.test.ts` com 8 casos.
2. Crie `packages/rag/src/hybrid-retrieval.ts`: `HybridRetrieval`, `RRFParams`, implementação.
3. Implemente RRF com `k=60`, pesos defaults `{fts: 0.4, vector: 0.4, graph: 0.2}`.
4. Re-exporte em `packages/rag/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:**
> - **T-IA-01 (vector_index) e T-IA-02 (ai-plugins) estão sendo endurecidas nesta passada.** Os tipos `VectorIndex`, `Float32Array` estão definidos. A integração real depende da implementação.
> **Status:** `draft` até T-IA-01 e T-IA-02 chegarem a `ready`. Contratos RRF estão derivados de fonte.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/rag build
pnpm --filter @plataforma/rag test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] RRF combina 3 sinais com Reciprocal Rank Fusion (k=60)?
- [ ] `topK` e `signals` filtram corretamente?
- [ ] `bypassScalar` delega para `scalarQuery`?
- [ ] Filtro de permissão (`principalId`) exclui nós proibidos?
- [ ] `pnpm --filter @plataforma/rag build` e `test` verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
