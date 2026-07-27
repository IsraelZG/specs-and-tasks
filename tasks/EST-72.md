---
id: EST-72
machine: Vivobook16
worktree_path: C:\Dev2026\.superapp-worktrees\EST-72
title: "Task Inspector em Coluna Adjunta FlexLayout"
status: in_progress
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-45", "EST-69", "EST-71"]
blocks: []
capacity_target: sonnet
ui: true
test_profile: ui
---

# EST-72 · Task Inspector em Coluna Adjunta FlexLayout

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-72`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Playwright, Vitest + JSDOM + `@testing-library/react`.
- **EST-71 deve estar integrado (mergeado na master) antes de iniciar** — os métodos `dispatchSingle`/`dispatchBranch`/`dispatchEpic` na interface `TaskClient` são pré-requisito.
- **Capacidade-alvo:** sonnet (componente de inspeção multi-aba + integração com FlexLayout + acionamento de transições).

## 1. Objetivo
Implementar o **TaskInspectorColumn** — painel de inspeção de task que abre como aba na **border direita** do FlexLayout (`@plataforma/shell`) ao selecionar um card no Board (modo Kanban) ou nó no FlowGrid (modo Grafo).

Quatro abas internas:
1. **Visão Geral** — metadados da task (id, título, status, complexidade, dependências, blocks) + spec markdown.
2. **Grafo Local** — subgrafo com antecessores diretos (dependencies) e sucessores diretos (tasks que dependem desta).
3. **Diffs** — seção 8 (handover) formatada, com lista de arquivos alterados.
4. **Logs** — seção 9 (log de execução) em timeline.

**Transições MGTIA:** botões de ação dinâmicos conforme `STATUS_TRANSITIONS` (start, pause, finish, unblock) + botão de despachar individual/galho.

### Fluxo de dados
1. **Seleção de card (Kanban ou Grafo):** BoardView → `onSelectTask(taskId | null)` → App.tsx atualiza `selectedTaskId`.
2. **Tab ativa no FlexLayout:** App.tsx obtém o modelo FlexLayout via callback `onModelReady` do `WorkspaceShell`. Ao mudar `selectedTaskId`, chama `model.doAction(Actions.selectTab("task-inspector"))` e `model.doAction(Actions.updateNodeAttributes("task-inspector", { name: "Task: <id>" }))`.
3. **Render:** `renderPanel("task-inspector")` → `<TaskInspectorColumn taskId={selectedTaskId} taskClient={taskClient} actor="operator" />`.
4. **Transição:** TaskInspectorColumn usa `STATUS_TRANSITIONS` e `taskClient.transition(verb)`; erros mostrados inline.

## 2. Contexto RAG
- [especificação do Estaleiro §2](../docs/especificacao-estaleiro.md) — Paradigma de Colunas Adjuntas; right border com 320px.
- EST-45 (done) — `@plataforma/shell`: `WorkspaceShell`, `WorkspaceShellProps`, `WorkspaceShellContext`. Fonte: `packages/shell/src/workspace-shell.tsx:11-21`, `packages/shell/src/index.ts:22-25`.
- EST-69 (done) — BoardView com `viewMode: 'kanban' | 'grafo'`, `useBoardTasks`, `useTransitionTask`, `toFlowGraphViewModel`, `FlowGrid` em execution mode. Fonte: `BoardView.tsx:12,20-22`, `hooks.ts:120-171`.
- EST-71 (done) — `TaskClient` interface com `dispatchSingle`, `dispatchBranch`, `dispatchEpic`. Fonte: `TaskClient.ts:10-25`.
- `STATUS_TRANSITIONS` — fonte: `statusTransitions.ts:3-21`. Mapeamento exato de `TaskStatus → verb`.
- `Task` interface — fonte: `packages/plugin-tasks/src/schema.ts:44-70`.
- `FlexLayout.Model.doAction()` — API pública de flexlayout-react; `Actions.selectTab()`, `Actions.updateNodeAttributes()`.

## 3. Escopo de Arquivos (Inputs e Outputs)

### Fontes (leitura, não modificar)
- **[READ]** `apps/estaleiro/ui/src/views/board/BoardView.tsx` — estrutura do Board, estado `viewMode`, `contextMenu` dispatch, `FlowGrid` render. Fonte verifica: `BoardView.tsx:1-370` (master, EST-69 + EST-71 mergeados).
- **[READ]** `apps/estaleiro/ui/src/views/board/statusTransitions.ts` — `STATUS_TRANSITIONS`, `VISIBLE_STATUSES`. Fonte: `statusTransitions.ts:3-34`.
- **[READ]** `apps/estaleiro/ui/src/views/board/TaskClient.ts` — interface `TaskClient` com `getTask`, `transition`, `dispatchSingle`, `dispatchBranch`. Fonte: `TaskClient.ts:10-25`.
- **[READ]** `apps/estaleiro/ui/src/views/board/TaskClient.http.ts` — implementação HTTP da TaskClient. Fonte: `TaskClient.http.ts`.
- **[READ]** `apps/estaleiro/ui/src/views/board/TaskClient.fixture.ts` — mock da TaskClient. Fonte: `TaskClient.fixture.ts`.
- **[READ]** `apps/estaleiro/ui/src/shell/default-layout.ts` — `defaultLayout()` função que retorna `FlexLayoutJson`. Fonte: `default-layout.ts:138-183`.
- **[READ]** `apps/estaleiro/ui/src/App.tsx` — estrutura do `renderPanel`, `selectedTaskId`/`setSelectedTaskId` state. Fonte: `App.tsx:1-150`.
- **[READ]** `packages/shell/src/workspace-shell.tsx` — `WorkspaceShellProps`, `WorkspaceShellContext`. Fonte: `workspace-shell.tsx:11-21`.

### Criação
- **[CREATE]** `apps/estaleiro/ui/src/views/inspector/TaskInspectorColumn.tsx` — componente com 4 abas internas + transições MGTIA.
  - Props: `{ taskId: string | null, taskClient: TaskClient, actor: string }`.
  - 4 abas com estado local `activeTab: 'overview' | 'graph' | 'diffs' | 'logs'`.
  - Se `taskId === null`, mostra estado vazio "Nenhuma task selecionada".
  - **Aba Visão Geral:** renderiza `id`, `title`, status badge com cor, `complexity`, `targetAgent`, dependências (linkáveis), lista de blocks. Seção 1 (objetivo) da task como texto.
  - **Aba Grafo Local:** subgrafo com 2 níveis: antecessores (`dependencies`) e sucessores (tasks cujo `dependencies` contém `taskId`). Render com mini-lista, sem FlowGrid (apenas lista de nós com setas). Usa `taskClient.listTasks()` para obter o grafo completo e filtra.
  - **Aba Diffs:** renderiza `section8_handover` formatado (Markdown simples). Se vazio, mostra "Nenhum dado de handover registrado."
  - **Aba Logs:** renderiza `section9_log` em timeline (timestamp, actor, action, message). Se vazio, mostra "Nenhum log de execução."
  - **Transições:** mapeia `task.status` via `STATUS_TRANSITIONS` → renderiza botão para cada transição disponível, chamando `taskClient.transition(taskId, verb, actor)`. Botão desabilitado durante pending. Erro exibido inline.
  - **Despacho:** botões "Despachar Individual" e "Despachar Galho", chamando `taskClient.dispatchSingle(taskId, actor)` e `taskClient.dispatchBranch(taskId, actor)`.

- **[CREATE]** `apps/estaleiro/ui/src/views/inspector/TaskInspectorColumn.test.tsx` — 6 casos de teste (Vitest + JSDOM + @testing-library/react).

### Modificação
- **[UPDATE]** `packages/shell/src/workspace-shell.tsx` — adicionar `onModelReady?: (model: FlexLayout.Model) => void` à `WorkspaceShellProps`. Chamar `onModelReady(model)` no `useMemo` após criar o modelo. `Model` importado de `flexlayout-react`. **Backward-compatible** (opcional).
- **[UPDATE]** `packages/shell/src/index.ts` — re-exportar `WorkspaceShellProps` já incluído; sem mudança necessária no barrel (já exporta `WorkspaceShellProps`).
- **[UPDATE]** `apps/estaleiro/ui/src/shell/default-layout.ts` — adicionar tab `{ type: "tab", name: "Inspector", component: "task-inspector" }` ao array `children` da border `location: "right"`.
- **[UPDATE]** `apps/estaleiro/ui/src/views/board/BoardView.tsx`:
  - Adicionar `onSelectTask?: (taskId: string | null) => void` à interface `BoardViewProps`.
  - **Modo Kanban:** adicionar `onClick` no `BoardCard` (ou container do card) que chama `onSelectTask(task.id)` e alterna (mesmo card clicado novamente → `onSelectTask(null)`). O `BoardCard` exporta `data-task-id` para facilitar seleção.
  - **Modo Grafo:** o `FlowGrid` já gerencia `selectedNodeId` internamente com toggle via `update_node` command. O `FlowGrid` exibe o `FlowInspector` interno em sidebar — manter esse comportamento (não removê-lo). A TaskInspectorColumn é **adicional**, não substituta. Quando um nó é clicado no FlowGrid, não temos callback externo; usar `onCommand` prop do `FlowGrid` para detectar `update_node` e chamar `onSelectTask(cmd.nodeId || null)`.
  - Implementar: capturar `onCommand` do `FlowGrid` no modo Grafo para detectar seleção de nó e propagar via `onSelectTask`.
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx`:
  - Guardar ref do modelo FlexLayout: `const modelRef = useRef<FlexLayout.Model | null>(null)`, `onModelReady={(m) => { modelRef.current = m; }}`.
  - Efeito `useEffect` em `selectedTaskId`: se modelRef.current, chamar `modelRef.current.doAction(Actions.selectTab("task-inspector"))` e `modelRef.current.doAction(Actions.updateNodeAttributes("task-inspector", { name: selectedTaskId ? `Task: ${selectedTaskId}` : "Inspector" }))`.
  - Passar `onModelReady` para `<WorkspaceShell>`.
  - Passar `onSelectTask={setSelectedTaskId}` para `<BoardView>`.
  - Adicionar case `"task-inspector"` ao `renderPanel`: `h(TaskInspectorColumn, { taskId: selectedTaskId || null, taskClient, actor: "operator" })`.
  - Import: `import * as FlexLayout from 'flexlayout-react'` (já presente via shell). Import `TaskInspectorColumn` do novo path.
- **[UPDATE]** `apps/estaleiro/ui/src/views/board/hooks.ts` — **sem mudança necessária** (`selectedTaskId` e `setSelectedTaskId` já existem em App.tsx; BoardView recebe por prop `onSelectTask`).

### NÃO MODIFICAR
- `packages/ui-engines/src/flow/` — `FlowGrid`, `FlowInspector`, `types.ts` são fontes READ. O `FlowGrid` mantém seu `FlowInspector` interno; TaskInspectorColumn é adicional.
- `packages/plugin-tasks/src/` — schema, service não mudam.
- `packages/plugin-dispatcher/` — dispatcher não muda.
- `apps/estaleiro/ui/src/views/board/BoardColumn.tsx`, `BoardCard.tsx` — estrutura de card não muda; só BoardView adiciona `onClick` em modo Kanban.
- `apps/estaleiro/ui/src/stores/board.ts`, `ws/` — stores e WS não mudam.

## 4. Estratégia de Testes Estrita

**Framework:** Vitest + JSDOM + `@testing-library/react`. Fixtures: `TaskClient.fixture.ts` (mock HTTP).

### Casos de Teste (6) — `TaskInspectorColumn.test.tsx`

1. **taskId null → estado vazio.** Renderizar `<TaskInspectorColumn taskId={null} taskClient={mock} actor="tester" />`. Assert: texto "Nenhuma task selecionada" visível. Nenhuma aba renderizada.

2. **taskId definido → mostra id, título e status badge.** Mock `taskClient.getTask` retorna `{ id: 'T-99', title: 'Minha Task', status: 'ready', ... }`. Assert: `T-99`, `Minha Task`, e badge de status `ready` visíveis. Assert: `getTask` foi chamado com `'T-99'`.

3. **Transições disponíveis → botões correspondentes ao status.** task com `status: 'in_progress'`. Assert: botões "Finalizar" (label de `finish`) e "Pausar" (label de `pause`) visíveis. Não mostra botão "Iniciar".

4. **Transição é chamada ao clicar em botão.** task com `status: 'ready'`. Clicar "Iniciar". Assert: `taskClient.transition` chamado com `('T-99', 'start', 'tester')`. Botão desabilitado durante pending.

5. **Navegação entre abas.** taskId setado. Clicar em cada aba (overview, graph, diffs, logs). Assert: conteúdo correspondente visível (`spec`, `dependentes`, `handover`, `timeline` como marcadores textuais) e aba ativa destacada.

6. **Dispatch individual e galho.** task com status `ready`. Assert: botões "Despachar Individual" e "Despachar Galho" visíveis. Clicar "Despachar Individual" → `taskClient.dispatchSingle('T-99', 'tester')` chamado.

### Export público esperado na §3? — Worker checklist
- `TaskInspectorColumn` exportado de `apps/estaleiro/ui/src/views/inspector/TaskInspectorColumn.tsx`.
- `WorkspaceShellProps` tipo `onModelReady` exportado de `packages/shell/src/index.ts` (já re-exporta `WorkspaceShellProps`).
- `BoardViewProps` inclui `onSelectTask?: (taskId: string | null) => void`.
- `default-layout.ts` inclui `task-inspector` tab na right border.
- `App.tsx` renderiza `TaskInspectorColumn` no case `"task-inspector"`.

## 5. Não fazer
- NÃO utilizar modais flutuantes sobrepostos (dialog/popover em tela cheia) — respeitar estritamente a diretriz de layout FlexLayout em colunas.
- NÃO remover/substituir o `FlowInspector` interno do `FlowGrid` — TaskInspectorColumn é **adicional** no FlexLayout.
- NÃO adicionar dependências novas ao `package.json` — `@plataforma/ui-engines`, `@plataforma/shell`, `@plataforma/plugin-tasks` já estão no grafo.
- NÃO perseguir dados indisponíveis (diffs reais de git, logs do harness em tempo real) — usar os dados já disponíveis na `Task` object (handover text, log entries).

## 6. Feedback de Especificação

### Derivado (com fonte)

| Item | Fonte |
|------|-------|
| `BoardViewProps` com `viewMode: 'kanban' \| 'grafo'` | `BoardView.tsx:12` |
| `TaskClient` interface (`getTask`, `transition`, `dispatchSingle`, `dispatchBranch`) | `TaskClient.ts:10-25` |
| `STATUS_TRANSITIONS` mapeamento `TaskStatus → verb` | `statusTransitions.ts:3-21` |
| `Task` interface (campos `id`, `title`, `status`, `dependencies`, `blocks`, `section*`, `section9_log`) | `packages/plugin-tasks/src/schema.ts:44-70` |
| `WorkspaceShellProps` (`initialLayout`, `renderPanel`, `onLayoutChange`) | `packages/shell/src/workspace-shell.tsx:17-21` |
| `WorkspaceShellContext` (`panelId`, `component`, `name`) | `packages/shell/src/workspace-shell.tsx:11-15` |
| `defaultLayout()` retorna `FlexLayoutJson` com right border 320px | `default-layout.ts:138-183` |
| `App.tsx` já tem `selectedTaskId`/`setSelectedTaskId` (usado por Terminal) | `App.tsx:87` |
| `FlowGrid` já seleciona nó e exibe `FlowInspector` interno | `FlowGrid.tsx:19,87-89` |
| `FlexLayout.Actions.selectTab`, `Actions.updateNodeAttributes` | Documentação flexlayout-react (API pública) |

### Decisões em aberto
- **NENHUMA** decisão de arquiteto pendente. Todos os contratos e paths são deriváveis de fontes existentes e confirmadas no fs. O endurecedor recomenda `harden`.

## 7. Gate por Comando
```bash
pnpm gate apps/estaleiro --profile ui
```

> **Escopo:** `apps/estaleiro/ui` (UPDATE/CREATE) + `packages/shell` (UPDATE menor, backward-compatible). Gate escopado a `apps/estaleiro` (CLÁUSULA MGTIA §3 — só UPDATEs contam para escopo do gate).

### Checklist do Reviewer (`agile_reviewer`)
- [ ] `TaskInspectorColumn` não renderiza modais/dialogs sobrepostos — respeita layout FlexLayout em coluna adjunta.
- [ ] Transições usam `STATUS_TRANSITIONS` existente, não reinventam mapeamento.
- [ ] `onModelReady` em `WorkspaceShellProps` é opcional (backward-compatible).
- [ ] `BoardView` modo Kanban adiciona `onClick` ao card sem quebrar drag-and-drop.
- [ ] `BoardView` modo Grafo usa `onCommand` do `FlowGrid` para detectar seleção de nó (não quebra `FlowInspector` interno).
- [ ] `task-inspector` tab adicionada à right border, não ao layout principal.
- [ ] 6/6 testes verdes?
- [ ] `pnpm gate apps/estaleiro --profile ui` → Exit Code 0 com artefato `.gate/<tree>.json`?
- [ ] Nenhuma dependência nova adicionada ao `package.json`?
- [ ] Nenhum arquivo de `packages/ui-engines`, `packages/plugin-tasks`, `packages/plugin-dispatcher` foi modificado?

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-22T21:57]** - *gemini-3.6-flash* - `[Triado]`: Spec criada baseada na aprovacao do Bloco 1.
- **[2026-07-26]** - *deepseek-v4-flash* - `[Hardened]`: Spec completa com escopo de arquivos exatos, contratos derivados de fontes, casos de teste numerados (6), seção de decisões (0 em aberto), gate escopado e checklist do reviewer.
- **[2026-07-27T12:18]** - *deepseek-v4-flash* - `[Promovida p/ ready]`: deps EST-45/69/71 all done, spec hardened — promoting to ready
- **[2026-07-27T12:41]** - *deepseek* - `[Iniciado]`: iniciando execução da task EST-72
