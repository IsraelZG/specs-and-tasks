---
id: EST-14b
title: "View Board: kanban/grid de tasks consumindo plugin-tasks (EST-03) + WS event subscription (EST-14a)"
status: in_progress
complexity: 2
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14a", "EST-03"]
blocks: []
capacity_target: haiku
---

# EST-14b · View Board (tasks)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/ui/`.
- **Package Manager:** `pnpm` (monorepo do superapp).
- **Language:** TypeScript + React (estabelecido por EST-14a).
- **Test Runner:** `vitest` + JSDOM (configurado por EST-14a `vitest.config.ts`).
- **Lint:** `eslint src/` (typescript-eslint strict — padrão do monorepo). **Lint faz parte do
  gate** (Regra 3 do CLAUDE.md desde 2026-07-06).
- **Dep. de runtime (adicionar a `apps/estaleiro/ui/package.json`):**
  - `@dnd-kit/core@^6.1.0` — drag-and-drop (padrão de facto em React; orca usa o mesmo —
    `docs/_vendor/orca/package.json`).
  - `@dnd-kit/sortable@^8.0.0` — sortable lists.
  - `react@^18.0.0`, `react-dom@^18.0.0` — já na semente A1.
- **Consome (DI):**
  - `boardStore` (TinyBase, criado por EST-14a `apps/estaleiro/ui/src/stores/board.ts`) — cache
    local das tasks.
  - `WsClient` (EST-14a `apps/estaleiro/ui/src/ws/client.ts`) — para assinar `task:updated`.
  - `TaskClient` interface (definida NESTE spec, §1) — abstração de transporte para CRUD/
    `transition`. **A implementação concreta (HTTP / WS / IPC Electron) é decisão de
    integração — registrada em §6 como aberta.**
- **Capacidade-alvo:** **haiku** (UI padrão: kanban com drag-and-drop usando lib conhecida; sem
  algoritmo novo; otimistic update com rollback é o padrão `react-query`/manual).
- **NÃO consome:** `@gorules/zen-engine`, `@plataforma/estaleiro-core` diretamente (a UI passa
  pelo shell — não importa do host backend; este pacote fica em `apps/estaleiro/ui/`).

## 1. Objetivo
Implementar a **view Board** do Estaleiro: grid/kanban de tasks consumindo o `plugin-tasks` (EST-03)
via a interface `TaskClient` (ver §6 — transporte concreto é follow-up). Lê da TinyBase `boardStore`
(criada em EST-14a) e atualiza a UI em tempo real via evento WS `task:updated`. Permite transicionar
tasks por **drag-and-drop entre colunas de status** (comando via `TaskClient.transition()`) ou por
**botões de ação** (mesmo verbo). Status real reflete no backend — não é local-only.

### Fluxo de dados (puxa + empurra)
1. **Mount:** `useBoardTasks()` chama `taskClient.listTasks({ prefix?: 'EST-14' })`, popula
   `boardStore` (`boardStore.setRow('tasks', id, { id, status, title })`).
2. **Drag-and-drop / botão:** usuário arrasta card de coluna A → coluna B. View computa o
   `TransitionVerb` correspondente ao par (A, B) via `STATUS_TRANSITIONS` (constante local, §1) e
   chama `taskClient.transition(taskId, verb, actor)` com **optimistic update** do `boardStore`.
3. **WS push:** quando OUTRA instância transiciona uma task, o backend emite `task:updated`
   (EST-14a `TaskUpdatedEvent`); o handler atualiza `boardStore` (sobrescreve o row, fonte da
   verdade = backend). Se a transição local falhar (`task:updated` chega com status diferente do
   optimistic), o `boardStore` reflete o estado real.
4. **Erro de transição:** se `taskClient.transition()` rejeita, a view faz **rollback** do
   optimistic update (reverte `status` no `boardStore`) e exibe toast (ou estado inline de erro).

### Contratos exatos

```ts
// --- apps/estaleiro/ui/src/views/board/TaskClient.ts
// Interface transport-agnostic consumida pela view Board.
// A implementação concreta é injetada pelo host no startup (HTTP / WS / IPC).
// EST-14b consome só a interface — a fiação é responsabilidade de uma task de integração
// (registrada em §6).

import type { Task, TransitionVerb } from "@plataforma/plugin-tasks";

export interface ListTasksFilter {
  status?: Task["status"];          // filtro exato por status (sub-status)
  prefix?: string;                  // filtro por prefixo de id (ex.: "EST-14")
  assignee?: string;                // filtro por actor atual
}

export interface TaskClient {
  /** Lista tasks aplicando o filtro. */
  listTasks(filter?: ListTasksFilter): Promise<Task[]>;
  /** Retorna 1 task por id. */
  getTask(id: string): Promise<Task | null>;
  /** Aplica uma transição. Ator = identity do modelo (regras do MGTIA, ver §6). */
  transition(
    taskId: string,
    verb: TransitionVerb,
    actor: string,
    message?: string
  ): Promise<Task>;
}
```

```ts
// --- apps/estaleiro/ui/src/views/board/statusTransitions.ts
// Tabela canônica de transições permitidas pela UI (subconjunto do que o backend aceita —
// o backend é a fonte da verdade; a UI só computa "qual verb faz sentido ao arrastar de A → B").
// DERIVADO de EST-03b (state machine) + Tabela MGTIA do CLAUDE.md §MGTIA.

import type { TaskStatus, TransitionVerb } from "@plataforma/plugin-tasks";

/** Mapa "status origem → lista de status destino clicáveis". Cada entrada tem o `verb`
 *  que produz a transição (ex.: de "ready" para "in_progress" → "start"). */
export const STATUS_TRANSITIONS: Readonly<Record<TaskStatus, ReadonlyArray<{
  to: TaskStatus;
  verb: TransitionVerb;
  label: string;                     // texto do botão / drop hint
}>>> = {
  "draft:placeholder":      [],
  "draft:triaged":          [],
  "draft:pending_decision": [],
  "draft:hardened":         [],
  "draft:decomposed":       [],
  "ready":                  [{ to: "in_progress", verb: "start",    label: "Iniciar"  }],
  "in_progress":            [{ to: "review",      verb: "finish",   label: "Finalizar" },
                             { to: "ready",       verb: "pause",    label: "Pausar"   }],
  "review":                 [],
  "in_review":              [],
  "rework":                 [{ to: "in_progress", verb: "start",    label: "Retomar"  }],
  "done":                   [],
  "blocked":                [{ to: "ready",       verb: "unblock",  label: "Desbloquear" }],
};
```

```tsx
// --- apps/estaleiro/ui/src/views/board/BoardView.tsx
// Componente principal da view. DERIVADO de: padrão kanban React (dnd-kit) + TinyBase
// (reativo a `boardStore`).

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { boardStore } from "../../stores/board";     // EST-14a
import { useBoardTasks } from "./hooks";              // §3
import { STATUS_TRANSITIONS } from "./statusTransitions";
import type { TaskClient } from "./TaskClient";

export interface BoardViewProps {
  taskClient: TaskClient;                             // DI — implementação injetada
  actor: string;                                      // identidade do modelo p/ transitions
}

export function BoardView({ taskClient, actor }: BoardViewProps): JSX.Element;
```

```tsx
// --- apps/estaleiro/ui/src/views/board/BoardColumn.tsx
// Coluna de status. Aceita drops; cada card filho é `BoardCard`.
export interface BoardColumnProps {
  status: TaskStatus;
  tasks: ReadonlyArray<Task>;
}
export function BoardColumn({ status, tasks }: BoardColumnProps): JSX.Element;
```

```tsx
// --- apps/estaleiro/ui/src/views/board/BoardCard.tsx
// Card arrastável. Mostra id, título, complexidade, e (se aplicável) ações alternativas
// (botões para `STATUS_TRANSITIONS[status]`).
export interface BoardCardProps {
  task: Task;
}
export function BoardCard({ task }: BoardCardProps): JSX.Element;
```

```ts
// --- apps/estaleiro/ui/src/views/board/hooks.ts
// Hooks: useBoardTasks (assinatura WS + leitura inicial) e useTransitionTask (optimistic + rollback).

import type { Task, TaskStatus } from "@plataforma/plugin-tasks";
import { boardStore } from "../../stores/board";
import type { WsClient } from "../../ws/client";        // EST-14a
import type { TaskClient } from "./TaskClient";

/** Assina `boardStore` (TinyBase reativo) + WS `task:updated` + carga inicial via
 *  `taskClient.listTasks()`. Retorna tasks agrupadas por status. */
export function useBoardTasks(taskClient: TaskClient, ws: WsClient): {
  byStatus: Readonly<Record<TaskStatus, ReadonlyArray<Task>>>;
  isLoading: boolean;
  error: Error | null;
};

/** Transição com optimistic update + rollback em erro. */
export function useTransitionTask(taskClient: TaskClient, actor: string): {
  transition: (taskId: string, to: TaskStatus) => Promise<void>;
  pendingIds: ReadonlySet<string>;                     // ids com optimistic pendente
  errors: ReadonlyMap<string, Error>;                  // id → erro (mostrar inline/toast)
};
```

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 F2 (board é a **primeira** das 5 views) + F3 (1 canal WS
  pra tudo).
- [x] `tasks/EST-14a.md` §1 — `boardStore` (`createStore().setTablesSchema({ tasks: { id, status,
  title } })`), `WsEvent = ... | TaskUpdatedEvent`, `createWsClient()`, shell FlexLayout com
  tab `Board` (`component: "board"` — esta task substitui o placeholder pelo `BoardView` real
  importado no `App.tsx`).
- [x] `tasks/EST-03a.md` §1 — `Task` interface (id, title, status, complexity, targetAgent,
  reviewerAgent, dependencies, children?, capacityTarget?); `TaskStatus` union (12 sub-status);
  `TransitionVerb` union (14 verbos).
- [x] `tasks/EST-03d.md` §1 — `TaskServicePort` server-side (CRUD + transition + getLog +
  submitVerdict). `TaskClient` (UI) é o **espelho client-side** do `TaskServicePort` — assinatura
  1:1, mas retorna DTOs serializáveis (não `Storage`/`Promise.all` interno).
- [x] `tasks/EST-03b.md` — state machine: dita quais transições são válidas (origem → destino
  por verbo). O `STATUS_TRANSITIONS` da view é **subconjunto** do que a state machine aceita
  (UI não pode inventar transições que o backend rejeita — mas pode omitir verbos disponíveis).
- [x] `docs/_vendor/orca/package.json` (RF-018 §6.6 — citar vendor, não GitHub) — confirma
  `@dnd-kit/core` + `@dnd-kit/sortable` como libs de DnD usadas pelo projeto de referência.
- [x] `tasks/EST-07.md` §1 — `DispatcherConfig.priority` lista os verbos que o dispatcher
  despacha: `work|rework|review|harden|promote`. A view não despacha agente (esse é papel do
  dispatcher); ela só aplica transições de lifecycle.
- [x] `CLAUDE.md` §MGTIA — separação de papéis: `approve`/`request_changes` são exclusivos do
  Reviewer; worker NUNCA chama. A view Board **não** expõe botões para esses verbos (eles são
  fluxo do `/qa-review`, não da UI). O `STATUS_TRANSITIONS` reflete isso — `review → in_review`
  é feito pelo serviço de review, não pelo board.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `apps/estaleiro/ui/package.json` — adicionar `@dnd-kit/core@^6.1.0` e
  `@dnd-kit/sortable@^8.0.0` em `dependencies`.
- **[CREATE]** `apps/estaleiro/ui/src/views/board/TaskClient.ts` — interface `TaskClient` +
  `ListTasksFilter` (contratos da §1).
- **[CREATE]** `apps/estaleiro/ui/src/views/board/statusTransitions.ts` — constante
  `STATUS_TRANSITIONS` (tabela canônica UI).
- **[CREATE]** `apps/estaleiro/ui/src/views/board/BoardView.tsx` — componente raiz da view
  (DndContext + grid de colunas).
- **[CREATE]** `apps/estaleiro/ui/src/views/board/BoardColumn.tsx` — coluna droppable.
- **[CREATE]** `apps/estaleiro/ui/src/views/board/BoardCard.tsx` — card draggable + ações.
- **[CREATE]** `apps/estaleiro/ui/src/views/board/hooks.ts` — `useBoardTasks` + `useTransitionTask`.
- **[CREATE]** `apps/estaleiro/ui/src/views/board/BoardView.test.tsx` — vitest + JSDOM +
  `@testing-library/react` (já em EST-14a ou a adicionar), 6 casos (§4).
- **[CREATE]** `apps/estaleiro/ui/src/views/board/TaskClient.fixture.ts` — implementação mock
  de `TaskClient` para testes (in-memory, com `vi.fn()` + `boardStore` para asserções).
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx` (de EST-14a) — substituir o placeholder do tab
  `component: "board"` pelo `BoardView` real, passando `taskClient` e `actor` via context/props.
  O `taskClient` vem de um provider no topo — implementação concreta injetada em runtime (ver §6).

## 4. Estratégia de Testes
- [x] **Framework:** `vitest` + JSDOM (configurado por EST-14a).
- [x] **Ambiente:** JSDOM. `TaskClient` mockado (in-memory, atualiza `boardStore` para simular
  o backend). `WsClient` mockado (`vi.fn()` para `onEvent`/`connect`/`disconnect`).
  `@testing-library/react` para renderizar e disparar drag.
- [x] **Fora de escopo:** integração real com backend; DnD nativo (não testamos eventos de mouse
  brutos — usamos `fireEvent` da testing-library); reordering dentro da mesma coluna (esta task
  cobre cross-column; reordering é trivial via mesmo mecanismo).

### Casos de teste (6)
1. **Board carrega lista de tasks → renderiza colunas.** Mock `taskClient.listTasks()` retorna
   3 tasks (1 em `ready`, 2 em `in_progress`); `BoardView` renderiza 5 colunas visíveis (as 12
   sub-status mas a UI agrupa em 5 visíveis: `draft` / `ready` / `in_progress` / `review` /
   `done`/`blocked` — verificar mapeamento na implementação, ou exibir todas se mais simples);
   `boardStore` tem 3 rows.
2. **Drag card de `ready` → `in_progress` chama `taskClient.transition(taskId, 'start', actor)`.**
   Render `BoardView`, `fireEvent.dragStart` no card da coluna `ready`, `fireEvent.drop` na
   coluna `in_progress`; asserção: `taskClient.transition` foi chamado com
   `(taskId, 'start', actor)`. Optimistic update: `boardStore.getCell('tasks', id, 'status') ===
   'in_progress'` imediatamente após o drop, **antes** do `transition` resolver.
3. **Estado vazio (sem tasks) → mensagem.** Mock `listTasks` retorna `[]`; `BoardView` mostra
   `<p class="empty">Nenhuma task</p>` (ou equivalente; texto exato fixado no teste).
4. **Erro na API → mensagem de erro visível.** Mock `listTasks` rejeita com `Error('503')`;
   `BoardView` mostra estado de erro (sem explodir a UI).
5. **Erro de `transition` → rollback + erro inline.** Mock `transition` rejeita com
   `Error('GuardError')`; após a promise resolver, `boardStore.getCell('tasks', id, 'status')`
   volta ao valor original (`'ready'`) e o `useTransitionTask` expõe o erro para o componente
   mostrar (ex.: toast ou texto inline no card).
6. **WS `task:updated` atualiza `boardStore` mesmo sem ação local.** Mock `ws` chama
   `onEvent({ type: 'task:updated', taskId, status: 'in_progress', ts })`; assert
   `boardStore.getCell('tasks', taskId, 'status') === 'in_progress'`. Garante que a view
   reflete mudanças feitas por OUTRA instância (dispatcher / outro operador).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** criar REST endpoints (`GET /tasks`, `POST /tasks/:id/transition`) — eles não existem
>   nem estão no escopo de EST-14b. A view consome a **interface `TaskClient`**; a implementação
>   concreta (HTTP / WS / IPC Electron) é tarefa de integração, registrada em §6.
> - **NÃO** importar `@plataforma/estaleiro-core` ou `plugin-tasks/src/service` (server-side) —
>   a UI fala com a **interface** `TaskClient` que espelha `TaskServicePort`. UI nunca importa
>   código do backend.
> - **NÃO** expor botões para `approve` / `request_changes` / `claim` (verbos do Reviewer —
>   separação de papéis do CLAUDE.md §MGTIA). `STATUS_TRANSITIONS` já reflete isso.
> - **NÃO** reordenar tasks dentro da mesma coluna (cosmético, fora de escopo; mesmo mecanismo
>   serve, mas o teste não cobre).
> - **NÃO** modificar `apps/estaleiro/ui/src/stores/board.ts` ou `apps/estaleiro/ui/src/ws/*`
>   (escopo de EST-14a, frozen para esta task).
> - **NÃO** adicionar dependências de runtime além das listadas em §0.

### Pegadinhas conhecidas
- **Transport de `TaskClient`:** a interface existe, mas a implementação concreta (HTTP / WS /
  IPC Electron) não está em EST-14b. **Registro aberto** em §6 — a integração é uma task de
  fiação separada, e o teste usa mock. Em runtime, o host (EST-02 + EST-15) injeta a impl
  concreta no `App.tsx` via provider — não é problema do board.
- **`actor` para transitions:** o board precisa de uma identidade. Por default, `'ui:operator'`
  (string não-modelo; UI não é worker/reviewer). Esta identidade **não** dispara guardas de
  modelo (EST-03c), mas passa pela state machine. Verificar com EST-03d §1 que `transition()`
  aceita `actor` arbitrário para transições permitidas a qualquer ator (start/finish/pause/
  unblock). Se o backend rejeitar `'ui:operator'` para algum verbo, ajustar para `'operator'`
  ou usar a identidade do usuário logado (autenticação fica para fora do escopo).
- **`TaskStatus` tem 12 valores; a UI mostra 5 colunas visíveis:** agrupar
  `draft:placeholder | draft:triaged | draft:pending_decision | draft:hardened | draft:decomposed`
  em uma única coluna `Draft` (com sub-contador por sub-status se útil). `review`/`in_review`
  em `Review`; `rework` em `Rework` (separado, não confunde com review). `done` e `blocked`
  ficam à direita. Mapeamento fixado no teste 1.
- **Optimistic update + WS race:** se o `transition()` local ainda está em voo e o WS
  `task:updated` chega antes (improvável mas possível), o `useBoardTasks` deve **sobrescrever**
  o `boardStore` com o status do WS (backend é fonte da verdade). O rollback do erro só
  acontece se a promise do `transition()` rejeita.
- **TinyBase reativo:** `useSyncExternalStore` com `boardStore` como source garante que a UI
  re-renderiza ao mudar o store. Padrão já documentado em TinyBase docs.

1. **[TDD]** Criar `TaskClient.fixture.ts` (mock in-memory que atualiza `boardStore`).
2. **[TDD]** Criar `TaskClient.ts` (interface), `statusTransitions.ts` (constante).
3. **[TDD]** Criar `hooks.ts` — `useBoardTasks` (assinatura WS + carga inicial) e
   `useTransitionTask` (optimistic + rollback).
4. **[TDD]** Criar `BoardView.test.tsx` com os 6 casos da §4.
5. Criar `BoardView.tsx`, `BoardColumn.tsx`, `BoardCard.tsx`.
6. Adicionar `@dnd-kit/core` e `@dnd-kit/sortable` em `apps/estaleiro/ui/package.json` (campo
   `dependencies`).
7. Atualizar `apps/estaleiro/ui/src/App.tsx` — importar `BoardView`, injetar via prop ou
   Context (`taskClient` mockado em dev; ver §6 para produção).
8. Rodar `pnpm --filter @plataforma/estaleiro-ui test` até 6/6 verde.
9. Rodar `build` + `lint`. Gate (§7) → §8.

## 6. Feedback de Especificação

### Decisão arquitetural REGISTRADA: transporte de `TaskClient` é follow-up
- **O quê:** a interface `TaskClient` (§1) é o contrato; a **implementação concreta** (HTTP /
  WS-rpc / IPC Electron) NÃO está no escopo de EST-14b.
- **Por quê:**
  1. **Nenhuma fonte atual define o transporte UI ↔ backend.** EST-14a implementa o **WS
     unidirecional** (push de eventos, F3 do RFC-018) mas não RPC. EST-02c define
     `NetworkPort.fetch` (HTTP **outgoing** do plugin para o mundo externo), não um servidor
     HTTP servindo a UI. EST-15 (empacotamento standalone) é a spike `opus-spike` que vai
     decidir **se** a UI roda em Electron (IPC) ou como página servida por um backend (HTTP).
  2. **Acoplar a view a um transporte específico agora violaria CITE OU ESCALE** — inventar
     endpoints REST seria uma decisão arquitetural disfarçada de spec. O board precisa estar
     pronto para QUALQUER um dos 3 transportes.
  3. **O mock em teste cobre o contrato lógico** — o que o board exercita é a interface
     `TaskClient` (listTasks, getTask, transition), não o transporte.
- **Onde vai:** task de integração (nome provisório: `EST-14f` ou parte de EST-15). Critério
  mínimo para abrir: EST-15 ter amadurecido a decisão Electron-vs-server o suficiente para
  escolher um transporte. Pode também ser quebrada em 2: uma task "implementar `TaskClient`
  over HTTP" e outra "implementar `TaskClient` over IPC", com a decisão de qual aplicar
  ficando no spike de EST-15.
- **Coerência com a DoD original:** a DoD pedia "Drag-and-drop transiciona task via EST-03
  API" — o `TaskClient` É a API, do ponto de vista da UI. A integração concreta é follow-up,
  não esquecida.

### Derivado (com fonte) — todos os contratos da §1
- `TaskClient` interface ← espelho client-side de `TaskServicePort` (EST-03d §1), com mesmo
  shape (`listTasks` / `getTask` / `transition`); `message?` opcional (EST-03d aceita
  `message?: string` em `transition`).
- `STATUS_TRANSITIONS` (tabela de transições permitidas na UI) ← subconjunto da state machine
  EST-03b + tabela MGTIA do `CLAUDE.md` §MGTIA. Não inclui `approve` / `request_changes` /
  `claim` (separação de papéis, regra 6 do MGTIA).
- `BoardView` / `BoardColumn` / `BoardCard` ← padrão kanban React + TinyBase (reativo) +
  `@dnd-kit/core` (DnD), libs já validadas pelo projeto de referência (`docs/_vendor/orca`).
- `useBoardTasks` assinatura ← combinação de: (a) `boardStore` (EST-14a), (b) `WsClient`
  (EST-14a) + assinatura de `TaskUpdatedEvent` (EST-14a), (c) `TaskClient.listTasks` (esta spec).
- `useTransitionTask` (optimistic + rollback) ← padrão universal de UI reativa (React Query
  etc.); não-novidade algorítmica, implementação mecânica.
- `@dnd-kit/core@^6.1.0` + `@dnd-kit/sortable@^8.0.0` ← `docs/_vendor/orca/package.json`
  (RFC-018 §6.6 — citar vendor local, não GitHub).

### Decisões em aberto
- **NENHUMA** decisão de arquiteto pendente no escopo de EST-14b. A única decisão aberta
  (transporte de `TaskClient`) está **resolvida** (registrada como follow-up de integração
  dependente de EST-15) acima. O endurecedor recomenda `harden`.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência — INVIOLÁVEL)
O Worker deve colar a saída literal destes comandos na Seção 8 (Handover):
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
```
Todos devem retornar **Exit Code 0**. Lint faz parte do gate (Regra 3 do CLAUDE.md desde
2026-07-06). Se algum falhar, consertar antes de chamar `finish` — sem evidência não termina.

### Checklist do Reviewer (`agile_reviewer`)
- [ ] `TaskClient` é uma **interface** (não implementação concreta) — importável sem
     副作用 de runtime?
- [ ] `BoardView` usa `boardStore` (TinyBase reativo) — não estado local?
- [ ] Drag-and-drop entre colunas dispara `taskClient.transition(taskId, verb, actor)` com
      optimistic update?
- [ ] Erro de `transition` reverte o optimistic update (rollback) e expõe erro para UI?
- [ ] WS `task:updated` atualiza `boardStore` mesmo sem ação local (CASO 6)?
- [ ] Nenhum botão de `approve` / `request_changes` / `claim` exposto (separação de papéis
      do MGTIA)?
- [ ] `@dnd-kit/core` e `@dnd-kit/sortable` declarados em `dependencies` (não `devDependencies`)?
- [ ] 6/6 testes verdes?
- [ ] Decisão do transporte de `TaskClient` registrada na §6 (não inventada nem silenciada)?
- [ ] `pnpm --filter @plataforma/estaleiro-ui build && test && lint` retornam Exit Code 0?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — saída literal do Gate):**
```
(cole aqui `pnpm --filter @plataforma/estaleiro-ui build && test && lint`)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-07T13:35]** - *claude-sonnet* - `[Endurecido]`: endureceu spec — TaskClient interface transport-agnostic + BoardView/Column/Card com @dnd-kit + hooks (useBoardTasks/useTransitionTask com optimistic+rollback) + 6 testes; STATUS_TRANSITIONS derivado de EST-03b (sem verbos de reviewer); transporte de TaskClient registrado como follow-up dependente de EST-15
- **[2026-07-07T13:33]** - *claude-sonnet* - `[Triado]`: triado: view Board kanban DnD, capacity=haiku, depende EST-14a (ready) + EST-03 (done); haiku mecanico: TaskClient interface + dnd-kit + hooks com optimistic
- **[2026-07-07T13:33]** - *claude-sonnet* - `[Endurecido]`: endureceu spec: TaskClient (interface transport-agnostic) + BoardView/Column/Card com @dnd-kit + hooks (useBoardTasks + useTransitionTask optimistic+rollback) + 6 testes; STATUS_TRANSITIONS derivado de EST-03b (sem verbos do reviewer); transporte de TaskClient registrado como follow-up dependente de EST-15
- **[2026-07-07T13:58]** - *system* - `[Auto-promovida]`: dep EST-14a concluída
- **[2026-07-07T14:10]** - *deepseek* - `[Iniciado]`: iniciando implementacao da view Board com DnD kanban
