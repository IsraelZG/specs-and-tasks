---
id: EST-69
title: "Projeção Topológica da Árvore de Tasks no FlowGrid"
status: in_progress
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14b", "EST-44"]
blocks: ["EST-70", "EST-71", "EST-72"]
capacity_target: sonnet
ui: true
test_profile: ui
---

# EST-69 · Projeção Topológica da Árvore de Tasks no FlowGrid

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-69`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Playwright, Vitest + JSDOM + `@testing-library/react` (já configurado no `apps/estaleiro/ui`).
- **Capacidade-alvo:** sonnet (projeção determinística de grafo de dependências e integração visual no Board do Estaleiro).

## 1. Objetivo
Adicionar o modo de visualização **Grafo de Dependências** no Board do Estaleiro UI (`apps/estaleiro/ui`), alternável com o modo Kanban existente. O modo Grafo projeta as tasks e suas `dependencies` no modelo `FlowGraphViewModel` de `@plataforma/ui-engines`, renderizado pelo componente `FlowGrid` em `mode="execution"` com sobreposição de status (`FlowExecutionOverlay`). O layout (colunas = profundidade topológica, linhas = paralelismo) é calculado deterministicamente pelo `computeLayout()` já existente — sem persistir coordenadas.

### Fluxo de dados
1. **Board carrega tasks:** mesmas hooks `useBoardTasks` (EST-14b) que o modo Kanban — fonte é `boardStore` (TinyBase) alimentada por `TaskClient.listTasks()` + WS `task:updated`.
2. **Toggle Kanban/Grafo:** estado local `boardMode: 'kanban' | 'graph'` no `BoardView`. Default = `'kanban'` (não quebra existente).
3. **Modo Grafo:** chama `toFlowGraphViewModel(tasks)` para converter `Task[]` → `FlowGraphViewModel`; chama `computeExecutionOverlay(tasks)` para derivar o overlay de status; renderiza `<FlowGrid graph={viewModel} mode="execution" execution={overlay} />`.
4. **Atualização em tempo real:** como as tasks vêm do `boardStore` (reativo a WS `task:updated`), o memo do grafo recalcula automaticamente — o nó reflete status/cores sem recriação manual.
5. **Seleção de nó:** clique num card no FlowGrid seleciona/desseleciona o nó (inspector interno do `FlowGrid`). Navegação para detalhe é follow-up.

## 2. Contexto RAG
- [especificação do Estaleiro §4](../docs/especificacao-estaleiro.md) — FlowGrid Motor Compartilhado de Fluxo em Grade.
- [ADR 0016](../docs/adr/0016-ui-engines-e-flow-grid.md) — Contrato `FlowGraphViewModel`, `FlowGridProps`, `computeLayout`.
- EST-44 — FlowGrid compartilhado em `@plataforma/ui-engines`, adapter pattern `jdm-flow-adapter`.
- EST-14b — View Board kanban com `TaskClient`, `boardStore`, `useBoardTasks`, `useTransitionTask`, `STATUS_TRANSITIONS`.

## 3. Escopo de Arquivos (Inputs e Outputs)

### Fontes (leitura, não modificar)
- **[READ]** `packages/ui-engines/src/flow/types.ts` — `FlowGraphViewModel`, `FlowGraphNode`, `FlowGraphEdge`, `FlowExecutionState`, `FlowExecutionOverlay`. _(path corrigido: dir é `flow/`, não `flow-grid/` — verificado no fs)_
- **[READ]** `packages/ui-engines/src/flow/FlowGrid.tsx` — `FlowGridProps` (`graph`, `mode`, `execution`, `onCommand`). _(idem)_
- **[READ]** `packages/ui-engines/src/flow/layout.ts` — `computeLayout()` (Kahn topológico, usado internamente pelo `FlowGrid`).
- **[READ]** `packages/plugin-tasks/src/schema.ts` — `Task`, `TaskStatus`. _(path corrigido: arquivo correto é `schema.ts`, não `task.service.ts`)_
- **[READ]** `apps/estaleiro/ui/src/views/board/BoardView.tsx` — estrutura atual do Board kanban.
- **[READ]** `apps/estaleiro/ui/src/views/board/hooks.ts` — `useBoardTasks`, `useTransitionTask`.
- **[READ]** `apps/estaleiro/ui/src/views/board/statusTransitions.ts` — `VISIBLE_STATUSES`, `STATUS_TRANSITIONS`.

### Criação
- **[CREATE]** `apps/estaleiro/ui/src/views/board/taskGraphAdapter.ts` — adaptador `Task[] → FlowGraphViewModel + FlowExecutionOverlay`. _(localização derivada do padrão `jdm-flow-adapter.ts` em EST-44: adapter no app layer para evitar dependência `plugin-tasks → ui-engines`)_
  - `toFlowGraphViewModel(tasks: Task[]): FlowGraphViewModel` — cada task vira nó `kind="state"` (ADR 0016 define 4 kinds; task não é rule/tool/human — é state); arestas de `dependencies`: `source: depId, target: taskId`.
  - `taskStatusToExecutionState(status: string): FlowExecutionState` — mapeia `TaskStatus` para `'blocked' | 'ready' | 'running' | 'done' | 'failed'`:
    - `blocked` → `'blocked'`
    - `ready` → `'ready'`
    - `in_progress` → `'running'`
    - `review | in_review | rework` → `'ready'`
    - `done` → `'done'`
    - `draft:* | blocked` → `'blocked'`
  - `computeExecutionOverlay(tasks: Task[], currentNodeId?: string): FlowExecutionOverlay` — aplica o mapeamento a todas as tasks.
- **[CREATE]** `apps/estaleiro/ui/src/views/board/taskGraphAdapter.test.ts` — teste do adaptador (6 casos, Vitest/JSDOM, função pura).

### Modificação
- **[UPDATE]** `apps/estaleiro/ui/src/views/board/BoardView.tsx`:
  - Estado local `boardMode: 'kanban' | 'graph'` (useState, default `'kanban'`).
  - Alternador visual (botões/tabs/seletor) entre Kanban e Grafo.
  - No modo `'graph'`: derivar `FlowGraphViewModel` via `toFlowGraphViewModel(allTasks)` + `FlowExecutionOverlay` via `computeExecutionOverlay(allTasks)`; renderizar `<FlowGrid graph={...} mode="execution" execution={...} />` no lugar do `DndContext`.
  - Manter Kanban inalterado. Não remover/não quebrar. Round-trip verificado no teste 6.

### NÃO MODIFICAR
- `packages/plugin-tasks/src/index.ts` (adapter está no app — não precisa de export do plugin-tasks).
- `packages/plugin-tasks/src/service.ts`, `packages/plugin-tasks/src/schema.ts` (domain packages).
- `packages/ui-engines/src/flow/` (engine compartilhada, não tocar).
- `apps/estaleiro/ui/src/App.tsx`, `apps/estaleiro/ui/src/stores/board.ts`, `apps/estaleiro/ui/src/ws/` (fora de escopo).

## 4. Estratégia de Testes Estrita

**Framework:** Vitest + JSDOM (configurado por EST-14a). Testes do adaptador são funções puras (sem render). Teste do BoardView (modo grafo) usa `@testing-library/react` com `TaskClient` mockado.

### Casos de teste (6)

**Adapter (função pura — `taskGraphAdapter.test.ts`):**

1. **Task única sem dependências → 1 nó, 0 arestas, coluna 0.**  
   `toFlowGraphViewModel([{ id: 'T-1', title: 'Task 1', dependencies: [] }])` → `{ nodes: [{ id: 'T-1', kind: 'state', label: 'T-1: Task 1' }], edges: [] }`.  
   `computeLayout(result)` → `{ columns: Map { 0 => [{ nodeId: 'T-1', row: 0, depth: 0 }] }, errors: [] }`.

2. **Cadeia linear A→B→C → 3 nós, 2 arestas, profundidades 0, 1, 2.**  
   Tasks: `T-A` (deps: `[]`), `T-B` (deps: `['T-A']`), `T-C` (deps: `['T-B']`).  
   Arestas: `T-A→T-B`, `T-B→T-C`. `computeLayout` → colunas 0,1,2.

3. **Join N→1 (duas tasks independentes convergem numa terceira).**  
   Tasks: `T-A` (deps: `[]`), `T-B` (deps: `[]`), `T-C` (deps: `['T-A', 'T-B']`).  
   Arestas: `T-A→T-C`, `T-B→T-C`. `computeLayout` → A,B na coluna 0, C na coluna 1.  
   Anti-fake: profundidade de C = `1 + max(0,0) = 1`.

4. **Ciclo em dependências → layout retorna erro de ciclo (anti-fake).**  
   Tasks: `T-A` (deps: `['T-B']`), `T-B` (deps: `['T-A']`).  
   `computeLayout` → `errors: [{ type: 'cycle' }]`. Adapter não detecta ciclo (delega ao `computeLayout` do `FlowGrid`).

5. **Mapeamento de todos os 12 sub-status do `TaskStatus` para `FlowExecutionState`.**  
   `computeExecutionOverlay([...tasks com cada status])` → verificar cada mapeamento conforme tabela da §3.  
   Anti-fake: todo sub-status tem entrada em `nodeStates`; `currentNodeId` undefined quando omitido.

**BoardView (componente — junto aos testes existentes em `BoardView.test.tsx`):**

6. **Toggle Kanban→Grafo renderiza FlowGrid com dados adaptados; toggle de volta restaura Kanban.**  
   Mock `taskClient.listTasks()` retorna 3 tasks com dependências. Render `BoardView`.  
   Alternar para `'graph'` → assert que `<FlowGrid>` está no DOM com labels das tasks visíveis.  
   Alternar de volta para `'kanban'` → assert que `DndContext` retornou e `FlowGrid` não está.

## 5. Não fazer
- NÃO implementar drag-and-drop no modo Grafo (FlowGrid em `mode="execution"` é read-only; edição topológica foge do escopo).
- NÃO persistir coluna/linha/X/Y (ADR 0016 — layout determinístico, sem persistência).
- NÃO quebrar o modo Kanban existente (toggle default `'kanban'`, teste 6 garante round-trip).
- NÃO adicionar dependências novas a `apps/estaleiro/ui/package.json` — `@plataforma/ui-engines` já está no grafo de dependências do app (EST-44).
- NÃO modificar `packages/plugin-tasks` ou `packages/ui-engines` (são fontes READ, não UPDATE).

## 6. Feedback de Especificação

### Derivado (com fonte)

| Item | Fonte |
|------|-------|
| `FlowGraphViewModel`, `FlowGraphNode`, `FlowGraphEdge` | `packages/ui-engines/src/flow/types.ts` (verificado no fs) |
| `FlowGridProps` (`graph`, `mode`, `execution`, `onCommand`) | `packages/ui-engines/src/flow/FlowGrid.tsx` (verificado no fs) |
| `computeLayout` (Kahn topológico) | `packages/ui-engines/src/flow/layout.ts` (verificado no fs) |
| `Task`, `TaskStatus`, `dependencies` | `packages/plugin-tasks/src/schema.ts` (verificado no fs) |
| `FlowExecutionState` (`'blocked' | 'ready' | 'running' | 'done' | 'failed'`) | `packages/ui-engines/src/flow/types.ts` (verificado no fs) |
| Adapter no app layer (`apps/estaleiro/ui/src/views/board/`) | Padrão `jdm-flow-adapter.ts` em EST-44 — adapter no app, não no domain |
| `kind="state"` para nós de task | ADR 0016 §2 define 4 kinds (`rule | tool | state | human`); task não é rule/tool/human |
| `BoardView` estrutura, `useBoardTasks`, `DndContext` | `apps/estaleiro/ui/src/views/board/BoardView.tsx` + `hooks.ts` (verificado no fs) |
| `VISIBLE_STATUSES` (agrupamento de colunas) | `apps/estaleiro/ui/src/views/board/statusTransitions.ts` (verificado no fs) |
| Gate escopado a `apps/estaleiro` | Só `apps/estaleiro/ui` é UPDATE; `packages/plugin-tasks` e `packages/ui-engines` são READ. CLÁUSULA MGTIA §3 |

### Decisões em aberto
- **NENHUMA** decisão de arquiteto pendente no escopo de EST-69. Todos os contratos e paths são deriváveis de fontes existentes e confirmadas no fs. O endurecedor recomenda `harden`.

## 7. Gate por Comando
```bash
pnpm gate apps/estaleiro --profile ui
```

> **Escopo:** apenas `apps/estaleiro` — o adapter `taskGraphAdapter.ts` vive em `apps/estaleiro/ui`, único pacote modificado. `packages/plugin-tasks` e `packages/ui-engines` são fonte (READ), não UPDATE.

### Checklist do Reviewer (`agile_reviewer`)
- [ ] `toFlowGraphViewModel` é função pura (sem efeito colateral, sem DOM/IO)?
- [ ] Adapter vive em `apps/estaleiro/ui/src/views/board/` (app layer, não domain)?
- [ ] `BoardView` mantém modo Kanban inalterado (default `'kanban'`, round-trip testado)?
- [ ] Modo Grafo usa `mode="execution"` (read-only, sem `onCommand` de edição)?
- [ ] Mapeamento status→execution cobre todos os 12 sub-status de `TaskStatus`?
- [ ] 6/6 testes verdes?
- [ ] `pnpm gate apps/estaleiro --profile ui` → Exit Code 0 com artefato `.gate/<tree>.json`?
- [ ] Nenhum arquivo de `packages/plugin-tasks` ou `packages/ui-engines` foi modificado?
- [ ] Nenhuma dependência nova adicionada ao `package.json`?

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-22T21:57]** - *gemini-3.6-flash* - `[Triado]`: Spec criada baseada na aprovacao do Bloco 1.
- **[2026-07-22]** - *deepseek* - `[Harden]`: Endurece spec — corrige paths (flow-grid/ → flow/, task.service.ts → schema.ts), move adapter p/ app layer (padrão jdm-flow-adapter EST-44), adiciona tipos TS exatos derivados de fontes verificadas, expande testes p/ 6 casos com anti-fake, define mapeamento status→execution state, escopa gate ao pacote alterado. Zero decisões em aberto.
- **[2026-07-23T13:12]** - *deepseek* - `[Endurecido]`: endureceu spec — paths corrigidos, adapter no app layer, tipos derivados de fontes, 6 casos de teste com anti-fake, zero decisoes em aberto
- **[2026-07-23T13:12]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-23T17:39]** - *deepseek* - `[Iniciado]`: iniciando implementação da projeção topológica no FlowGrid
