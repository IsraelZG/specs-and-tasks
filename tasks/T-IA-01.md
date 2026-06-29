---
id: T-IA-01
title: "projecao vector_index (sqlite-vec/WASM) + embedding no pipeline pos-decifra (irma do FTS)"
status: draft
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-106", "T-101"]
blocks: ["T-IA-03"]
---

# T-IA-01 · projecao vector_index (sqlite-vec/WASM) + embedding no pipeline pos-decifra (irma do FTS)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** haiku (vetores — complexidade de integração, não de lógica)

## 1. Objetivo
Criar a 7ª projeção `vector_index` (irmã do FTS) usando sqlite-vec via WASM. Embeddings são computados no pipeline pós-decifra (mesmo ponto que `search_index_fts`), invocando a capacidade `compute` de embedding (preferencialmente on-device). A `SPECIFICATION` do nó declara campos `embeddable: true` e qual estratégia de embedding usar. Vetor de campo cifrado/sem-chave não é gerado.
**Fonte:** `caderno-3-sdk/14-ia-rag-e-agentes.md §2` — substrato de embeddings. **Conceitos:** [[utilitario-de-ia]], [[recuperacao-hibrida]].

### Contratos exatos

```ts
// --- packages/vector-index/src/vector-index.ts ---

import type { StoragePort } from '@plataforma/protocol';

/** Estratégia de embedding por tipo de conteúdo. */
export type EmbeddingStrategy = 'text' | 'code' | 'image';

/** Configuração de campo embeddable na SPECIFICATION. */
export interface EmbeddableField {
  field: string;
  strategy: EmbeddingStrategy;
  /** Capacidade de embedding a usar (ex.: "text-embedding-3-small"). */
  capabilityId: string;
}

/** Entrada no vector_index. */
export interface VectorEntry {
  nodeId: string;
  field: string;
  /** Vetor de embedding (dimensão varia por modelo). */
  vector: Float32Array;
  /** Estratégia usada. */
  strategy: EmbeddingStrategy;
  indexedAt: number;
}

/** Projeção vector_index — a 7ª projeção do sistema. */
export interface VectorIndex {
  /**
   * Indexa um campo embeddable de um nó decifrado.
   * Só indexa se o campo não for cifrado/sem-chave.
   */
  indexField(nodeId: string, field: string, plaintext: string, strategy: EmbeddingStrategy): Promise<void>;

  /**
   * Remove entradas de um nó (expurgo/arquivamento).
   * Ciclo de vida casado com o nó de origem (§2.5).
   */
  removeNode(nodeId: string): Promise<void>;

  /**
   * Busca por similaridade de cosseno (KNN).
   * Retorna nodeIds ordenados por distância.
   */
  search(queryVector: Float32Array, topK: number): Promise<Array<{ nodeId: string; distance: number }>>;

  /**
   * Podar entradas expurgadas — projeção reconstruível sob demanda.
   */
  prune(): Promise<void>;
}

/** Configuração do vector_index (sqlite-vec via WASM). */
export interface VectorIndexConfig {
  /** Caminho para o banco SQLite (via StoragePort). */
  storage: StoragePort;
  /** Dimensão do vetor (depende do modelo de embedding). */
  dimensions: number;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/14-ia-rag-e-agentes.md](../docs/caderno-3-sdk/14-ia-rag-e-agentes.md) — §2 (embeddings, punto do pipeline pós-decifra, 7ª projeção, ciclo de vida, eager/lazy)
- [[utilitario-de-ia]] — capacidade compute de embedding
- [[recuperacao-hibrida]] — usa vector_index como sinal semântico no RRF

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/protocol/src/ports.ts` — `StoragePort` (T-004 ready)
- **[READ]** `packages/core/src/schema.ts` — schema SQLite (T-106 ready, para integrar projeção)
- **[CREATE]** `packages/vector-index/src/vector-index.ts` — interface + implementação `SqliteVectorIndex`
- **[CREATE]** `packages/vector-index/tests/vector-index.test.ts` — testes de indexação, busca, remoção, poda
- **[UPDATE]** `packages/vector-index/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/vector-index test`).
- [x] **Fora de Escopo:** Embedding real (usar vetor dummy), integração com pipeline de decifra, WASM real.

Casos de teste:
1. `indexField` insere entrada; `search` com vetor similar retorna o nodeId.
2. `search` com vetor dissimilar → distância alta, rank baixo.
3. `removeNode` remove todas as entradas do nó; `search` não retorna mais.
4. `prune` remove entradas cujo nó de origem foi expurgado (simulado).
5. `indexField` com string vazia → não indexa (sem entrada fantasma).
6. `topK` limita resultados: `search(v, 3)` retorna no máximo 3.
7. Type-check: `Float32Array` para vetor; `EmbeddingStrategy` union literal.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente embedding real — use `Float32Array` dummy preenchido com valores fixos.
> - **NÃO** dependede sqlite-vec WASM real — use `better-sqlite3` ou `sql.js` com tabela simples para protótipo.
> - **NÃO** implemente RRF ou recuperação híbrida (T-IA-03). Apenas a projeção.

### Pegadinhas conhecidas
- `Float32Array` não é serializável diretamente em JSON. Precisa converter para `Array<number>` ou `Buffer` antes de armazenar.
- A busca KNN com distância de cosseno usa `vector` como array de floats — a similaridade é `1 - cosine_distance`.
- `prune()` precisa de join com a tabela de nós para detectar expurgados. Use `StoragePort.exec()` com query SQL.
- SHA-256 (T-101b) é necessário para hash do conteúdo na deduplicação de embedding — se T-101b ainda estiver draft, usar `crypto.subtle.digest('SHA-256')` nativo como fallback.

1. **[TDD]** Crie `packages/vector-index/tests/vector-index.test.ts` com casos 1–7.
2. Crie `packages/vector-index/src/vector-index.ts` com `VectorIndex` + implementação.
3. Use `StoragePort` para criar tabela `vector_index(node_id, field, vector_blob, strategy, indexed_at)`.
4. Implemente `search` com similaridade de cosseno simples (dot product normalizado).
5. Re-exporte em `packages/vector-index/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:**
> - **T-101b (SHA-256) está `draft`.** O hash de conteúdo para dedup de embedding depende de SHA-256. O worker deve usar `crypto.subtle.digest('SHA-256')` nativo (Node 20+) como fallback, com comentário para migrar quando T-101b estiver pronto.
> - **WASM sqlite-vec:** A integração real com sqlite-vec via WASM depende da disponibilidade no runtime. O protótipo usa tabela SQLite simples com BLOB para vetor; a migração para extensão vec é incremental.
> **Status:** `draft` até T-101b chegar a `ready`. Contratos da projeção estão derivados de fonte.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/vector-index build
pnpm --filter @plataforma/vector-index test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] `VectorIndex` com `indexField`, `removeNode`, `search`, `prune`?
- [ ] `search` usa similaridade de cosseno, `topK` respeitado?
- [ ] `removeNode` limpa todas as entradas do nó?
- [ ] `prune` remove órfãos com join em nós expurgados?
- [ ] `pnpm --filter @plataforma/vector-index build` e `test` verdes?

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
