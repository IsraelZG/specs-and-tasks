---
id: EST-71
title: "Despacho Granular de Agentes e Workflows (Task, Galho e Board)"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-07", "EST-69", "EST-70"]
blocks: ["EST-72"]
capacity_target: sonnet
ui: true
test_profile: full
---

# EST-71 · Despacho Granular de Agentes e Workflows (Task, Galho e Board)

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-71`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest, Playwright.
- **Capacidade-alvo:** sonnet (mecanismo de despacho de sub-árvores no dispatcher e ações na UI).

## 1. Objetivo
Implementar a mecânica de despacho de execuções agenticas em três níveis na UI e no backend:
1. **Despacho Individual:** Acionar uma task específica.
2. **Despacho por Galho (Branch Dispatch):** Selecionar um nó de task raiz e acionar a execução de toda a sub-árvore descendente de dependências (respeitando a ordem topológica de conclusão).
3. **Despacho Global (Board / Épico):** Acionar o despacho da fila de todas as tarefas prontas/bloqueadas do Épico ou Board selecionado.

## 2. Contexto RAG
- [especificação do Estaleiro §5.2 e §5.3](../docs/especificacao-estaleiro.md) — Despacho por Fila e Invocação de Workflows.
- EST-07 — `plugin-dispatcher` (dispatcher de tarefas e locks).
- EST-69 / EST-70 — Visualização de Grafo FlowGrid e Épicos.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-dispatcher/src/dispatcher.service.ts`.
- **[UPDATE]** `packages/plugin-dispatcher/src/dispatcher.service.ts` — implementar métodos `dispatchSingle(taskId)`, `dispatchBranch(rootTaskId)` (resolução topológica do subgrafo) e `dispatchEpic(epicId)`.
- **[UPDATE]** `packages/plugin-dispatcher/src/routes.ts` — expor endpoints `POST /api/dispatch/single`, `POST /api/dispatch/branch`, `POST /api/dispatch/epic`.
- **[UPDATE]** `apps/estaleiro/ui/src/views/BoardView.tsx` — adicionar menus contextuais nos cards do FlowGrid ("Despachar Task", "Despachar Galho") e o botão de ação "Despachar Fila do Épico" no header do Board.
- **[CREATE]** `packages/plugin-dispatcher/test/branchDispatch.test.ts` — testes de resolução de sub-árvore e trava de locks.

## 4. Estratégia de Testes Estrita
1. **Resolução de Sub-Árvore (Galho):** Dada uma task raiz $A$ com dependentes $B \rightarrow C$, a chamada `dispatchBranch(A)` resolve o subgrafo contendo $A, B, C$ e os enfileira na ordem estrita de dependência.
2. **Prevenção de Corrida (Lock):** O despacho por galho falha graciosamente se uma das tasks dependentes já estiver em `in_progress` ou bloqueada por outro executor.
3. **Despacho por Épico:** `dispatchEpic(epicId)` coleta apenas as tarefas prontas do Épico ativo e dispara o despacho sem tocar em tasks de outros Épicos.

## 5. Não fazer
- NÃO ignorar as guardas MGTIA ou desrespeitar os relacionamentos de dependência durante o despacho em lote.

## 6. Feedback de Especificação
- Spec triada e alinhada com o `plugin-dispatcher` e com os botões contextuais aprovados no plano.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/plugin-dispatcher --profile full
```

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-22T21:57]** - *gemini-3.6-flash* - `[Triado]`: Spec criada baseada na aprovacao do Bloco 1.
