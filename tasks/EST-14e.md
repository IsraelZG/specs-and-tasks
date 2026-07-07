---
id: EST-14e
title: "Views Decisões + Custo: fila de decisões do arquiteto e painel de custo/telemetria (EST-10)"
status: draft:hardened
complexity: 2
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14a", "EST-10"]
blocks: []
capacity_target: haiku
---

# EST-14e · Views Decisões + Custo

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/ui/`.
- **Package Manager:** `pnpm` (monorepo do superapp).
- **Test Runner:** `vitest` (JSDOM + React Testing Library).
- **Lint:** `eslint src/` (typescript-eslint strict).
- **Capacidade-alvo:** haiku (duas views de dashboard simples — listas + indicadores, sem streaming complexo).
- **Consome EST-14a:** `decisionsStore`, `costStore` (TinyBase stores) + `WsClient` / `WsEvent` (`TaskUpdatedEvent`, `CostUpdateEvent`).
- **Consome EST-03:** `TaskServicePort.listTasks({ status: 'draft:pending_decision' })` + `transition()` para ações.
- **Consome EST-10c:** `CallRecord`, `UsageSnapshot`, `queryUsage(provider, windowMs)` — telemetria de custo/uso.

## 1. Objetivo
Implementar duas views do Estaleiro: **Decisões** (fila de decisões do arquiteto — tarefas em `draft:pending_decision`) e **Custo** (painel de custo/telemetria dos providers consumindo EST-10). Separadas em abas/painéis distintos no shell FlexLayout, mas agrupadas numa subtask por serem ambas dashboards simples de listas + indicadores.

### Contratos (todos DERIVADOS de fonte — CITE OU ESCALE)

```ts
// === apps/estaleiro/ui/src/views/decisions/hooks.ts
// DERIVADO de: EST-03a TaskStatus (draft:pending_decision) + EST-03d TaskServicePort.listTasks()
// + EST-14a ws/events.ts TaskUpdatedEvent

import type { Task } from '@plataforma/plugin-tasks';        // EST-03a Task interface
import type { TaskServicePort } from '@plataforma/plugin-tasks'; // EST-03d API

/** Resultado do hook de decisões: fila + ação de resolver.
 *  DERIVADO de: EST-03a TaskStatus (draft:pending_decision) + EST-03d TaskServicePort
 */
export function useDecisions(taskService: TaskServicePort): {
  decisions: Task[];                    // tasks com status === 'draft:pending_decision'
  resolve: (taskId: string) => void;    // chama taskService.transition(taskId, 'decide', 'architect')
  defer: (taskId: string) => void;      // chama taskService.transition(taskId, 'block_decision', 'architect')
  loading: boolean;
};
```

```ts
// === apps/estaleiro/ui/src/views/cost/hooks.ts
// DERIVADO de: EST-10c telemetry.ts CallRecord, UsageSnapshot, queryUsage
// + EST-14a ws/events.ts CostUpdateEvent

export interface ProviderCost {
  provider: string;
  totalCost: number;
  totalCalls: number;
  avgLatency: number;
  period: { start: number; end: number };
}

/** Hook de custo: agrega telemetria dos providers.
 *  Consome EST-10c queryUsage(provider, windowMs).
 *  Atualiza via WS (CostUpdateEvent) e polling periódico.
 *  DERIVADO de: EST-10c UsageSnapshot + EST-14a costStore
 */
export function useCost(providers: string[]): {
  costs: ProviderCost[];
  totalCost: number;
  loading: boolean;
};
```

```tsx
// === apps/estaleiro/ui/src/views/decisions/DecisionsView.tsx

/** Fila de decisões do arquiteto.
 *  Lista tasks em draft:pending_decision.
 *  Cada card: id, título, dependências, ações (Resolver/Adiar).
 *  DERIVADO de: EST-03a TaskStatus + EST-03d TaskServicePort
 */
export function DecisionsView({ taskService }: { taskService: TaskServicePort }): JSX.Element;

// === apps/estaleiro/ui/src/views/decisions/DecisionCard.tsx

/** Card de uma decisão pendente.
 *  Exibe: id, título, complexity, target_agent, dependências.
 *  Botões: "Resolver →" (decide), "Adiar" (block_decision).
 *  DERIVADO de: EST-03a Task interface
 */
export function DecisionCard({ task, onResolve, onDefer }: {
  task: Task;
  onResolve: (id: string) => void;
  onDefer: (id: string) => void;
}): JSX.Element;
```

```tsx
// === apps/estaleiro/ui/src/views/cost/CostView.tsx

/** Painel de custo.
 *  Exibe: gráfico de gasto por provider (barra/linha), tabela de uso,
 *  total acumulado do período, indicador de orçamento.
 *  DERIVADO de: EST-10c UsageSnapshot + EST-14a costStore
 */
export function CostView(): JSX.Element;

// === apps/estaleiro/ui/src/views/cost/CostChart.tsx

/** Gráfico de gasto por provider.
 *  DERIVADO de: EST-14a costStore (name, costUsd, ts)
 *  Uso: recharts BarChart/LineChart ou chart.js (biblioteca a escolher do worker).
 */
export function CostChart({ costs }: { costs: ProviderCost[] }): JSX.Element;

// === apps/estaleiro/ui/src/views/cost/CostTable.tsx

/** Tabela de uso por modelo/provider.
 *  Colunas: provider, modelo, chamadas, custo, latência média.
 *  DERIVADO de: EST-10c CallRecord (provider, model, cost, latencyMs, success)
 */
export function CostTable({ costs }: { costs: ProviderCost[] }): JSX.Element;
```

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (F2 — decisões + custo são 2 das 5 views mantidas, C2 — telemetria de custo como módulo interno de EST-10).
- [x] `tasks/EST-03a.md` — `TaskStatus` (inclui `draft:pending_decision`), `Task` interface (id, title, status, complexity, dependencies).
- [x] `tasks/EST-03d.md` — `TaskServicePort.listTasks(filter)`, `transition(verb)` — API REST para listar e agir sobre decisões.
- [x] `tasks/EST-10c.md` §1/§2 — `CallRecord`, `UsageSnapshot`, `queryUsage(provider, windowMs)` — contratos de telemetria.
- [x] `tasks/EST-14a.md` §1 — `decisionsStore` (createStore vazio), `costStore` schema (`{ name, costUsd, ts }`), `TaskUpdatedEvent`, `CostUpdateEvent`.
- [x] `docs/adr/0008-agent-adapter-in-process.md` §D — protocolo de eventos (estendido para `task:updated` em EST-03d, `cost:updated` em EST-10c).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `apps/estaleiro/ui/src/views/decisions/DecisionsView.tsx` — fila de decisões.
- **[CREATE]** `apps/estaleiro/ui/src/views/decisions/DecisionCard.tsx` — card de decisão.
- **[CREATE]** `apps/estaleiro/ui/src/views/decisions/hooks.ts` — `useDecisions()` (consome EST-03d API).
- **[CREATE]** `apps/estaleiro/ui/src/views/cost/CostView.tsx` — painel de custo.
- **[CREATE]** `apps/estaleiro/ui/src/views/cost/CostChart.tsx` — gráfico de gasto.
- **[CREATE]** `apps/estaleiro/ui/src/views/cost/CostTable.tsx` — tabela de uso.
- **[CREATE]** `apps/estaleiro/ui/src/views/cost/hooks.ts` — `useCost()` (consome EST-10c + costStore).
- **[CREATE]** `apps/estaleiro/ui/src/views/decisions/DecisionsView.test.tsx` — 3 testes.
- **[CREATE]** `apps/estaleiro/ui/src/views/cost/CostView.test.tsx` — 3 testes.
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx` — registrar `<DecisionsView />` e `<CostView />` no FlexLayout (tabs "Decisões" e "Custo", substituindo placeholders de EST-14a).
- **[UPDATE]** `apps/estaleiro/ui/src/stores/decisions.ts` — opcional: estender schema se precisar de campos além do `createStore()` vazio de EST-14a.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- **Framework:** `vitest` + JSDOM + React Testing Library.
- **Ambiente:** Node puro, JSDOM. Mock do `TaskServicePort` e `CostView` data (usar fixtures).
- **Fora de Escopo:** Testes de gráfico real (renderização SVG/biblioteca de chart). Testes de integração com servidor EST-10 real.

### Casos enumerados (6)

**DecisionsView.test.tsx (3 casos):**
1. **Renderiza cards de decisões pendentes:** mock `TaskServicePort.listTasks` retorna 2 tasks com `status:'draft:pending_decision'`. Renderizar `<DecisionsView taskService={mock} />` → verificar 2 `DecisionCard` presentes, com títulos e IDs visíveis.
2. **Botão "Resolver" → chama transition:** mock `taskService.transition = vi.fn()`. Clicar "Resolver" no primeiro card. Verificar que `transition` foi chamada com `(taskId, 'decide', 'architect')`.
3. **Estado vazio → mensagem:** mock `listTasks` retorna `[]`. Renderizar → verificar texto "Nenhuma decisão pendente".

**CostView.test.tsx (3 casos):**
4. **Renderiza dados de custo:** mock `useCost` retorna 2 providers com valores. Renderizar `<CostView />` → verificar `<CostChart />` e `<CostTable />` presentes com os nomes dos providers.
5. **Tabela mostra colunas corretas:** mock com 1 provider. Renderizar `<CostTable costs={mockCosts} />` → verificar cabeçalhos "Provider", "Modelo", "Chamadas", "Custo", "Latência".
6. **Dados vazios → mensagem:** mock vazio. Renderizar → verificar texto "Nenhum custo registrado".

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implementar scoring multi-fator nem circuit-breaker — isso é EST-10b/c, a UI só consome os dados agregados.
> - **NÃO** duplicar CRUD de tasks — usar `TaskServicePort` de EST-03d, não reimplementar.
> - **NÃO** adicionar biblioteca de gráficos pesada (preferir uma dep leve: `recharts` ou `chart.js` + `react-chartjs-2`).
> - **NÃO** editar stores/board.ts, stores/fleet.ts, stores/knowledge.ts (são de outras views).
> - **NÃO** implementar autenticação/autorização — o Estaleiro é ferramenta interna, assume trusted network.

### Pegadinhas conhecidas
- **TaskServicePort é interface, não REST:** se EST-03d expõe REST (`GET /tasks?status=pending_decision`, `POST /tasks/:id/transition`), o hook `useDecisions` deve usar `fetch` diretamente ou um client HTTP. A interface TS de EST-03d é o contrato lógico; a implementação real pode ser REST, RPC ou in-process. No mínimo, mockar `fetch` nos testes e usar `fetch` real em produção.
- **decisionsStore é schema-free:** EST-14a criou `decisionsStore` como `createStore()` sem schema. Esta task pode definir o schema ao popular (TinyBase aceita schema posterior). Atualizar `stores/decisions.ts` se necessário com schema.
- **useCost sem provider list:** a view precisa saber quais providers existem. Opções: (a) chamar `queryUsage(undefined, windowMs)` que retorna todos (se EST-10c suportar), (b) lista fixa de `providers: string[]` da config. Se EST-10c não expuser um `listProviders()`, usar lista fixa e registrar no §8.
- **Gráfico em test:** `recharts` em JSDOM pode precisar de polyfill `ResizeObserver`. Adicionar no `vitest.config.ts` setup: `globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }))`.
- **Navegação "Resolver":** o botão "Resolver" pode navegar para uma tela de detalhes da task (a definir em futura UI). No v1, `resolve` chama `transition(taskId, 'decide', 'architect')` e remove o card da fila (otimistic update na decisionsStore).

1. **[TDD]** Criar `tests/DecisionsView.test.tsx` com casos 1–3.
2. **[TDD]** Criar `tests/CostView.test.tsx` com casos 4–6.
3. Implementar `hooks.ts` (decisions) — `useDecisions(taskService)` que chama `listTasks({ status: 'draft:pending_decision' })`.
4. Implementar `DecisionsView.tsx` — lista de `DecisionCard`, subscribe `TaskUpdatedEvent` via WS.
5. Implementar `DecisionCard.tsx` — card com título, ID, botões Resolver/Adiar.
6. Implementar `hooks.ts` (cost) — `useCost(providers)` que chama `queryUsage(provider)` e escuta `CostUpdateEvent`.
7. Implementar `CostView.tsx` — layout split: gráfico (esquerda) + tabela (direita).
8. Implementar `CostChart.tsx` — gráfico de barras/linhas usando recharts ou chart.js.
9. Implementar `CostTable.tsx` — tabela de uso por provider.
10. Atualizar `App.tsx` — registrar `<DecisionsView />` e `<CostView />` nas tabs "Decisões" e "Custo".
11. Rodar build + test + lint (Seção 7) e colar saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões DERIVADAS de fonte (CITE OU ESCALE):**

| Item | Fonte |
|---|---|
| `TaskStatus` `draft:pending_decision` | EST-03a TaskStatus union |
| `TaskServicePort.listTasks(filter)` | EST-03d TaskServicePort interface |
| `transition(taskId, verb, actor)` com verbos `decide`/`block_decision` | EST-03a TransitionVerb + EST-03d transition() |
| `Task` interface (id, title, status, complexity, dependencies) | EST-03a Task |
| `CallRecord`, `UsageSnapshot`, `queryUsage()` | EST-10c §2 telemetry.ts |
| `decisionsStore` (schema-free) | EST-14a §1 stores/decisions.ts |
| `costStore` schema `{ name, costUsd, ts }` | EST-14a §1 stores/cost.ts |
| `TaskUpdatedEvent` e `CostUpdateEvent` no WS único | EST-14a §1 ws/events.ts |
| Views "Decisões" e "Custo" são 2 das 5 views mantidas | RFC-018 F2 |
| Telemetria como módulo interno de plugin-providers | RFC-018 §6.4 (ex-EST-11 absorvida) |

> **Decisões em aberto:** nenhuma. Todos os contratos derivam de EST-03a/d, EST-10c, EST-14a, RFC-018. O design é puramente mecânico — listas + indicadores consumindo APIs já especificadas.

> **Dependências:** EST-14a (`ready`), EST-10 (`draft:decomposed` — EST-10c `in_review`). Os contratos `CallRecord`/`UsageSnapshot` estão fixados em EST-10c §2. Esta task pode ser executada antes de EST-10c `done` (modo `sequential` refere-se a steps internos; mocks das APIs são suficientes para os testes).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `useDecisions` consome `TaskServicePort.listTasks({ status: 'draft:pending_decision' })`?
- [ ] `DecisionCard` exibe id, título, complexity, dependências?
- [ ] Botão "Resolver" chama `transition(taskId, 'decide', 'architect')`?
- [ ] Botão "Adiar" chama `transition(taskId, 'block_decision', 'architect')`?
- [ ] `useCost` consome `queryUsage(provider)` de EST-10c telemetry?
- [ ] `CostChart` renderiza gráfico de gasto por provider?
- [ ] `CostTable` exibe colunas (provider, modelo, chamadas, custo, latência)?
- [ ] `App.tsx` atualizado com `DecisionsView` e `CostView` reais?
- [ ] 6/6 testes verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + test + lint (todos Exit Code 0) na Seção 8. Lint incluído desde 2026-07-06 após 3 reworks consecutivos por regressão (T-807, EST-02b, EST-02c). Os 6 casos de teste DEVEM estar verdes.

### Checklist do Reviewer
- [ ] `useDecisions` nunca implementa CRUD próprio (sempre delega a EST-03d)?
- [ ] `useCost` nunca implementa scoring/telemetria própria (sempre consome EST-10c)?
- [ ] Componentes tratam estado vazio (sem decisões, sem custo)?
- [ ] Gráfico e tabela usam biblioteca leve (recharts/chart.js)?
- [ ] `App.tsx` atualizado com imports reais de DecisõesView e CostView?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
=== BUILD ===

EXIT:0
```
```
=== TEST ===

EXIT:0
```
```
=== LINT ===

EXIT:0
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-07T13:54]** - *big-pickle* - `[Triado]`: triado — views decisoes+custo, haiku, depende de EST-14a (ready) + EST-10 (decomposed)
- **[2026-07-07T13:54]** - *big-pickle* - `[Endurecido]`: endureceu spec — 6 casos de teste, contratos TS derivados de EST-03a/d+EST-10c+EST-14a, gate build+test+lint
