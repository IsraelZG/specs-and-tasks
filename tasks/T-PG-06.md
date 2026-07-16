---
id: T-PG-06
title: "Modelo de comandos e histórico do editor de páginas"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PG-01", "T-PG-03"]
blocks: ["T-PG-07"]
capacity_target: sonnet
---

# T-PG-06 · Modelo de comandos e histórico do editor de páginas

## 0. Ambiente de Execução Obrigatório
- **Repo:** `C:\Dev2026\superapp`, worktree `task/T-PG-06`.
- **Runtime:** Node.js v20+, TypeScript, Vitest; pacote `@plataforma/pages`.
- **Capacidade-alvo:** `sonnet` após as dependências ficarem `done`.

## 1. Objetivo
Criar o núcleo puro e imutável de edição de `PageDocument`: comandos atômicos, validação antes do
commit, seleção e histórico undo/redo. A UI futura despacha comandos; ela não manipula a árvore por
conta própria. IDs são fornecidos pelo caller para que replay, colaboração e testes sejam determinísticos.

## 2. Contexto RAG
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §§2–5 e 7.
- `docs/caderno-3-sdk/03-engines-and-spec-driven-ui.md` §§1–3.
- `docs/caderno-3-sdk/10-design-system.md` §2 — esta task edita spec, não DS.
- `tasks/T-PG-01.md` — `PageDocument`, `PageNode` e validador canônicos.
- `tasks/T-PG-03.md` — semântica de `EXTENDS`/overrides que precisa estar estabilizada antes do endurecimento.
- `tasks/T-PG-07.md` — único consumidor visual previsto.

## 3. Escopo de Arquivos
- **[READ]** `packages/pages/src/schema.ts`, `validator.ts`, `index.ts`.
- **[READ após done]** outputs reais de T-PG-03.
- **[CREATE]** `packages/pages/src/editor/commands.ts` — união discriminada de comandos:
  `insert`, `remove`, `move`, `duplicate`, `replace`, `updateProps` e `setVisibility`.
- **[CREATE]** `packages/pages/src/editor/history.ts` — estado e operações puras `dispatch`, `undo`, `redo`.
- **[CREATE]** `packages/pages/src/editor/index.ts` — barrel público.
- **[UPDATE]** `packages/pages/src/index.ts` — exportar contratos do editor.
- **[CREATE]** `packages/pages/tests/editor-commands.test.ts`.
- **[NO CHANGE]** React/DOM, Design System, renderer, Automerge, shell e persistência.

### Invariantes que o endurecimento deve preservar
- Todo comando opera sobre `PageDocument`/`PageNode` existentes; não cria schema paralelo.
- `insert`/`move` recebem `parentId` e índice; raiz e slots respeitam limites do validador.
- `duplicate` recebe do caller o mapa completo `oldId → newId`; colisão ou mapa incompleto falha.
- `updateProps` usa o tipo derivado de `PageNode['props']`; `null` remove a prop.
- Aplicação é atômica: se o comando ou a validação falhar, documento e histórico não mudam.
- Novo `dispatch` limpa a pilha de redo; undo/redo restauram documento e seleção exatamente.
- Nenhuma função gera UUID, lê relógio, filesystem, browser ou rede.

## 4. Estratégia de Testes Estrita
- **Framework:** Vitest, Node puro, sem JSDOM.
- [ ] Um teste por comando com sucesso e erro estrutural.
- [ ] Remover/mover pai com descendentes não perde subárvore; ciclo é rejeitado.
- [ ] IDs duplicados, nó ausente, índice inválido, mapa incompleto e raiz inválida falham atomicamente.
- [ ] Validador rejeitando o resultado mantém o estado anterior e devolve diagnostics.
- [ ] Sequência dispatch → undo → redo restaura JSON byte-equivalente e seleção.
- [ ] Dispatch após undo invalida redo.
- **Fora de escopo:** atalhos de teclado, drag-and-drop, rendering, colaboração e persistence.

## 5. Instruções de Execução
1. Quando T-PG-03 estiver `done`, reendurecer assinaturas contra seus outputs reais.
2. Escrever fixtures mínimas de `PageDocument` e testes de invariantes.
3. Implementar transformações imutáveis e history sem framework/dependência.
4. Exportar somente a API necessária à T-PG-07.

### Não fazer / pegadinhas
- NÃO guardar snapshots mutáveis nem inverter comandos por heurística; undo deve restaurar o estado aceito.
- NÃO gerar IDs internamente: isso quebra replay e merge colaborativo.
- NÃO validar props/componentes à mão; chamar o validador canônico.
- NÃO adicionar Zustand/Redux/Immer/command bus ou abstração genérica.

## 6. Feedback de Especificação
- **JIT obrigatório:** os nomes e assinaturas finais ficam pendentes até T-PG-03 entregar a forma real de
  `EXTENDS`; cite os símbolos entregues, não antecipe um contrato concorrente.

## 7. Definition of Done
- [ ] Comandos e history são puros, imutáveis, determinísticos e exportados por `@plataforma/pages`.
- [ ] Falhas são atômicas e carregam diagnostics acionáveis.
- [ ] Testes cobrem comandos, ciclos, IDs, validação e undo/redo.

### Gate de Evidência
```bash
pnpm --filter @plataforma/pages build
pnpm --filter @plataforma/pages test
pnpm --filter @plataforma/pages lint
```

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-15T20:18]** - *gpt-5* - `[Triado]`: Núcleo puro de comandos/history triado; endurecimento JIT após T-PG-03.
