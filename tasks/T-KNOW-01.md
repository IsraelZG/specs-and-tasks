---
id: T-KNOW-01
title: "Documentos canônicos em nodes do GraphStore e adapters de filesystem"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-1043", "EST-13a", "EST-13b", "EST-13c"]
blocks: ["T-IA-03", "T-CTX-01", "T-MEM-01"]
capacity_target: sonnet
---

# T-KNOW-01 · Documentos canônicos em nodes do GraphStore e adapters de filesystem

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; GraphStorePort e plugin-knowledge já existem, mas os paths/exports precisam ser confirmados na master.
- **Runtime:** Node.js e TypeScript; `pnpm`; Vitest.
- **Capacidade-alvo:** sonnet; triagem inicial.

## 1. Objetivo
Migrar a semântica de conhecimento do produto de corpus markdown-first no filesystem para nodes versionados no GraphStore. Markdown continua rendition de conteúdo; filesystem continua adapter de importação, indexação e exportação. FTS/grafo/vetores continuam projeções reconstruíveis de nodes autorizados, não fonte canônica.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §4.
- [caderno SDK/01](../docs/caderno-3-sdk/01-sqlite-and-projections-schema.md) §§4–5 — nodes/edges, projeções e caminho pós-decifra.
- [T-1043](./T-1043.md) — core já usa GraphStorePort.
- [EST-13a](./EST-13a.md), [EST-13b](./EST-13b.md), [EST-13c](./EST-13c.md) — grafo/FTS/writer atuais.
- [Referências locais](../docs/referencias-codigo-aberto.md) — Cognee em `docs/_vendor/cognee` no commit fixado; ler `cognee/memify_pipelines/` apenas como referência de pipeline/provenance.

## 3. Escopo a endurecer
- **[READ]** GraphStorePort e adapters persistentes atuais.
- **[READ]** API do `plugin-knowledge` e tools de filesystem atuais.
- **[CREATE/UPDATE]** adapter de conteúdo canônico por node e adapter de filesystem explícito.
- **[CREATE]** testes de persistência, importação e reconstrução de projeções.

## 4. Casos obrigatórios no endurecimento
1. Documento Markdown criado/alterado no produto persiste como node/versionamento no GraphStore.
2. Importação de arquivo cria ou propõe node, mas arquivo não vira fonte canônica do item importado.
3. Reindexar FTS/grafo a partir dos nodes reconstrói a mesma projeção autorizada.
4. Conteúdo sem permissão não entra em FTS/vetor derivado local.
5. Exportação produz Markdown sem alterar linhagem canônica.

## 5. Não fazer
- Não remover ferramentas de filesystem.
- Não gravar plaintext de payload protegido em arquivo auxiliar.
- Não introduzir um segundo banco documental fora de GraphStore.

## 6. Feedback de Especificação
O tipo de node/SPEC que identifica documento e os paths reais dos adapters não estão fechados nas fontes lidas; não inventar um `CONTENT:DOCUMENT`. Reendurecer contra a master e registrar a escolha derivada da SPEC existente antes de implementação.

## 7. Gate futuro
Fixar build/test/lint dos pacotes confirmados e teste de reconstrução de projeção no endurecimento JIT.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada a migração de conhecimento canônico para nodes do GraphStore.
