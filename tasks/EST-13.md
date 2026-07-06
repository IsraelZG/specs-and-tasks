---
id: EST-13
title: "plugin-knowledge: docs/RAG markdown-first (OKF), FTS local, writer serial de commits"
status: draft:decomposed
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: sonnet
children: ["EST-13a", "EST-13b", "EST-13c"]
subtasks: ["EST-13a", "EST-13b", "EST-13c"]
---

# EST-13 · plugin-knowledge (casca decomposta)

## 0. Ambiente de Execucao Obrigatorio
- **Task-casca decomposta.** Esta task nao executa diretamente — seu escopo foi fatiado em:
  - **EST-13a** — OKF graph: wikilinks + frontmatter (haiku)
  - **EST-13b** — FTS local: inverted index + search (sonnet, depende de 13a)
  - **EST-13c** — Writer serial de commits (sonnet, compartilhado com EST-12)

  Cada filha segue o fluxo MGTIA independente. Esta casca fecha quando as 3 filhas estiverem `done`.

## 1. Objetivo
Implementar o plugin que serve o conhecimento markdown-first (OKF) para RAG dos agentes —
navegacao por wikilink, indice FTS local, e writer serial de commits. Fatiado em 3 subtasks
independentes.

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (B4, E2) — writer serial + FTS local.
- [x] RFC-018 S6.4 — writer serial COMPARTILHADO com EST-12.
- [x] `docs/conceitos/` e `docs/caderno-*` — corpus OKF real de referencia.
- [x] `tools/scripts/fila.mjs` — padrao de writer serial.

## 3. Escopo de Arquivos
- Ver as subtasks individuais:
  - EST-13a: `packages/plugin-knowledge/src/graph.ts` + `tests/graph.test.ts`
  - EST-13b: `packages/plugin-knowledge/src/fts.ts` + `tests/fts.test.ts`
  - EST-13c: `packages/plugin-knowledge/src/writer.ts` + `tests/writer.test.ts`

## 4. Estrategia de Testes
- Cada subtask tem sua propria suite de testes (vitest). O package `@plataforma/plugin-knowledge`
  acumula os testes incrementalmente.

## 5. Instrucoes de Execucao
1. EST-13a primeiro (graph, base para as demais).
2. EST-13c em paralelo com EST-13b (writer serial nao depende do graph).
3. EST-13b depois (opera sobre o graph).

## 6. Feedback de Especificacao
- **Decisao em aberto (arquiteto):** local do utilitario de commit serial compartilhado com EST-12
  (RFC-018 S6.4). Afeta EST-13c. Ver `tasks/EST-12.md` S6 para as opcoes.

## 7. Definition of Done (DoD)
- [ ] EST-13a (graph) done?
- [ ] EST-13b (FTS) done?
- [ ] EST-13c (writer) done?

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
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-knowledge OKF+FTS, capacity=sonnet, complexidade 5 requer decomposicao, depende de EST-02 (draft)

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-06T18:21]** - *big-pickle* - `[Reconciliado]`: status restaurado de draft:decomposed para draft:triaged (drift corrigido)
- **[2026-07-06T18:21]** - *big-pickle* - `[Decomposto]`: decomposto em 13a (graph haiku), 13b (fts sonnet), 13c (writer sonnet)
