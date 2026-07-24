---
id: T-KNOW-01
title: "Documentos canônicos em nodes do GraphStore e adapters de filesystem"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-1043", "EST-13a", "EST-13b", "EST-13c"]
blocks: ["T-IA-03", "T-CTX-01", "T-MEM-01"]
capacity_target: sonnet
test_profile: backend
---

# T-KNOW-01 · Documentos canônicos em nodes do GraphStore e adapters de filesystem

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/T-KNOW-01`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest.
- **Capacidade-alvo:** sonnet (migração da semântica de documentos para nodes do GraphStore).

## 1. Objetivo
Migrar a semântica de conhecimento do produto de um corpus markdown-first cru no filesystem para nodes versionados no `GraphStorePort` (`packages/core/src/sqliteStorage.ts`). O Markdown continua como formato de visualização/rendition; o filesystem atua exclusivamente como adapter de importação, indexação e exportação. As projeções de busca (FTS, grafo e vetores em `packages/plugin-knowledge`) passam a ser reconstruíveis a partir dos nodes autorizados do `GraphStore`.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §4.
- [caderno SDK/01](../docs/caderno-3-sdk/01-sqlite-and-projections-schema.md) §§4–5 — nodes/edges, projeções e caminho pós-decifra.
- [T-1043](./T-1043.md) — core já usa `GraphStorePort` (`packages/core/src/sqliteStorage.ts`).
- [EST-13a](./EST-13a.md), [EST-13b](./EST-13b.md), [EST-13c](./EST-13c.md) — grafo OKF, FTS local e writer serial em `packages/plugin-knowledge`.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/sqliteStorage.ts` *(derivado de T-1043)*.
- **[READ]** `packages/plugin-knowledge/src/types.ts` e `graph.ts` *(derivado de EST-13a)*.
- **[READ]** `packages/plugin-knowledge/src/fts.ts` *(derivado de EST-13b)*.
- **[CREATE]** `packages/plugin-knowledge/src/documentNodeAdapter.ts` — implementação do `DocumentNodeAdapter` (`persistDocumentNode`, `importFromFilesystem`, `rebuildProjectionsFromNodes`).
- **[UPDATE]** `packages/plugin-knowledge/src/index.ts` — re-exportar `DocumentNodeAdapter`.
- **[CREATE]** `packages/plugin-knowledge/test/documentNodeAdapter.test.ts` — testes de persistência em node, importação e reconstrução de FTS/grafo.

### Assinaturas TS Derivadas (packages/plugin-knowledge/src/documentNodeAdapter.ts)
```typescript
import { GraphStorePort, SignedNode } from '@plataforma/core';
import { OKFNode, OKFEdge } from './types.js';

export interface DocumentNodePayload {
  id: string;
  title: string;
  markdownContent: string;
  frontmatter: Record<string, unknown>;
  authorId: string;
}

export interface DocumentNodeAdapter {
  persistDocumentNode(doc: DocumentNodePayload): Promise<SignedNode>;
  importFromFilesystem(filePath: string): Promise<SignedNode>;
  rebuildProjectionsFromNodes(graphStore: GraphStorePort): Promise<{ nodeCount: number; edgeCount: number }>;
  exportToMarkdown(nodeId: string): Promise<{ filename: string; content: string }>;
}
```

## 4. Estratégia de Testes Estrita
Enumeração dos 5 casos de teste obrigatórios em `packages/plugin-knowledge/test/documentNodeAdapter.test.ts`:

1. **Persistência Canônica em Node:** Um documento Markdown criado persiste como `SignedNode` no `GraphStorePort`, com o payload estruturado contendo title e frontmatter.
2. **Importação via Filesystem Adapter:** Importar um arquivo `.md` do disco cria o `SignedNode` no GraphStore sem tornar o arquivo físico a fonte canônica do registro.
3. **Reconstrução Determinística de Projeções:** Apagar as tabelas de FTS e chamar `rebuildProjectionsFromNodes(graphStore)` reconstrói perfeitamente o índice FTS e o grafo OKF a partir dos nodes do banco.
4. **Filtro de Autoridade na Reindexação:** Nodes cujo payload não possua autorização válida para o usuário são omitidos do FTS derivado local.
5. **Exportação Fiel:** `exportToMarkdown(nodeId)` gera a string Markdown completa sem alterar o ID nem a linhagem do node canônico.

## 5. Não fazer
- NÃO remover ferramentas de filesystem nem impedir leitura/escrita de arquivos locais.
- NÃO gravar plaintext de payload protegido em arquivos `.md` temporários soltos no disco.
- NÃO criar um banco documental paralelo fora do `GraphStorePort`.

## 6. Feedback de Especificação
- Decisão arquitetural 100% fechada pela ADR 0019 §4 e T-1043.
- Tipos alinhados com o `GraphStorePort` em `packages/core/src/sqliteStorage.ts`.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/plugin-knowledge --profile backend
```
*(Executa `pnpm --filter @plataforma/plugin-knowledge build`, `test` e `lint`, colando evidências na Seção 8).*

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada a migração de conhecimento canônico para nodes do GraphStore.
- **[2026-07-23T23:45]** - *gemini-3.6-flash* - `[Hardened]`: Spec endurecida com assinaturas TS exatas e re-exports em plugin-knowledge.

- **[2026-07-24T02:46]** - *Antigravity* - `[Endurecido]`: endureceu spec T-KNOW-01 com assinaturas TS de DocumentNodeAdapter
- **[2026-07-24T02:46]** - *system* - `[Auto-promovida]`: deps todas done
