---
id: EST-14c
title: "View Frota: painel ao vivo de agentes via plugin-agent-harness (EST-06) + padrões Orca"
status: done
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14a", "EST-06"]
blocks: []
capacity_target: sonnet
---

# EST-14c · View Frota (agentes ao vivo)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/ui/`.
- **Package Manager:** `pnpm` (monorepo do superapp).
- **Test Runner:** `vitest` (JSDOM + React Testing Library).
- **Lint:** `eslint src/` (typescript-eslint strict).
- **Capacidade-alvo:** sonnet (live streaming state, diff annotation, worktree lifecycle — complexidade intrínseca, requer coordenação multi-componente).
- **Consome EST-14a:** WS client `createWsClient` + `WsEvent`/`AgentWsEvent` + `fleetStore` (TinyBase store).
- **Consome EST-06:** event stream `AgentEvent` (mapeado como `AgentWsEvent` em EST-14a) emitido por `run()` e recebido via WS único (F3).
- **UI de referência:** `docs/_vendor/orca/src/shared/worktree-card-properties.ts` (propriedades do card de worktree), `docs/_vendor/orca/src/shared/diff-comments-format.ts` (formato de diff annotation).

## 1. Objetivo
Implementar a **view Frota** do Estaleiro: painel ao vivo de agentes em execução, consumindo o event stream do `plugin-agent-harness` (EST-06) via o canal WS único (EST-14a/F3). Mostra worktrees ativas, status de cada agente, diff annotation por worktree, e fan-out N-worktrees (padrão Orca — RFC-018 D2, opcional por task).

### Contratos (todos DERIVADOS de fonte — CITE OU ESCALE)

```ts
// === apps/estaleiro/ui/src/views/fleet/hooks.ts ===

// Tipos de evento consumidos via WS — 1:1 com AgentWsEvent de EST-14a ws/events.ts
// (DERIVADO de ADR-0008 §D + EST-06 §1 AgentEvent union)
import type { AgentWsEvent } from '../../ws/events';
import type { WsClient } from '../../ws/client';

/** Estado interno de um agente/worktree na frota (derivado de EST-14a fleetStore schema). */
export interface FleetAgent {
  taskId: string;
  model: string;
  status: 'starting' | 'in_progress' | 'paused' | 'done' | 'failed' | 'aborted';
  started: number;       // timestamp do evento agent:start
  lastEventTs: number;
  cwd: string;
  branch?: string;       // extraído do cwd ou do evento (worktree branch)
  diffSummary?: string;  // preview do diff, se disponível
}

/** Hook que subscreve o WS único e mantém a fleetStore sincronizada.
 *  Retorna o estado reativo dos agentes para os componentes consumirem.
 *  DERIVADO de: EST-14a ws/client.ts (createWsClient, onEvent) + fleetStore
 */
export function useFleet(ws: WsClient): { agents: FleetAgent[]; status: WsClient['getStatus'] };
```

```tsx
// === apps/estaleiro/ui/src/views/fleet/FleetView.tsx

/** Grid principal de worktrees/agentes.
 *  Recebe a lista do hook {@link useFleet} e delega a renderização
 *  para {@link WorktreeCard} e {@link AgentTimeline}.
 *  Suporta fan-out (D2): se agent.length > 1 para mesma task, exibe grupo.
 *  DERIVADO de: RFC-018 F2 (frota), D2 (fan-out Orca)
 */
export function FleetView({ ws }: { ws: WsClient }): JSX.Element;

// === apps/estaleiro/ui/src/views/fleet/WorktreeCard.tsx

/** Card de uma worktree/agente.
 *  Exibe: status badge, nome do modelo, branch (se disponível),
 *  tempo decorrido, botão de cancel, preview de diff.
 *  Propriedades (WorktreeCardProperty) inspiradas em:
 *  docs/_vendor/orca/src/shared/worktree-card-properties.ts (status, branch, pr, automation)
 */
export function WorktreeCard({ agent }: { agent: FleetAgent }): JSX.Element;

// === apps/estaleiro/ui/src/views/fleet/AgentTimeline.tsx

/** Timeline vertical de eventos do agente (start → steps → tool-calls → done/aborted/error).
 *  Consome `fleetStore` diretamente (armazena os eventos recebidos por taskId).
 *  DERIVADO de: ADR-0008 §D (sequência de eventos emitidos por run()).
 */
export function AgentTimeline({ taskId }: { taskId: string }): JSX.Element;

// === apps/estaleiro/ui/src/views/fleet/DiffAnnotation.tsx

/** Diff annotation para uma worktree.
 *  Exibe trecho de diff com realce (linhas adicionadas/removidas).
 *  Formato de diff derivado de: docs/_vendor/orca/src/shared/diff-comments-format.ts
 *  (formatDiffComment, DiffComment interface)
 */
export function DiffAnnotation({ diffSummary }: { diffSummary: string }): JSX.Element;
```

### Mapeamento de eventos (AgentWsEvent → fleetStore)

| Evento WS | Ação na fleetStore |
|---|---|
| `agent:start { taskId, ts, model, cwd }` | `addRow('agents', { taskId, model, status:'in_progress', started:ts, lastEventTs:ts, cwd })` |
| `agent:step { taskId, ts, ... }` | `setRow('agents', taskId, { lastEventTs:ts })` — atualiza timestamp |
| `agent:tool-call { taskId, ts, tool, args }` | `addRow('events', { taskId, type:'tool-call', tool, ts })` — anexa à timeline |
| `agent:tool-result { taskId, ts, tool, ok }` | `addRow('events', { taskId, type:'tool-result', tool, ok, ts })` |
| `agent:done { taskId, ts, text, steps }` | `setRow('agents', taskId, { status:'done', lastEventTs:ts })` |
| `agent:aborted { taskId, ts, reason }` | `setRow('agents', taskId, { status:'aborted', lastEventTs:ts })` |
| `agent:error { taskId, ts, message }` | `setRow('agents', taskId, { status:'failed', lastEventTs:ts })` |

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (F2 — frota, D2 — fan-out Orca, D3 — multi-máquina) — FONTE: view frota existe, fan-out é opcional, multi-máquina na base.
- [x] `tasks/EST-06.md` §1 — contratos `AgentEvent` (7 tipos), `AgentRunResult` — assinaturas exatas do event stream consumido.
- [x] `tasks/EST-14a.md` §1 — `AgentWsEvent` types, `WsClient`, `createWsClient`, `fleetStore` schema — a infraestrutura que esta view consome.
- [x] `docs/adr/0008-agent-adapter-in-process.md` §D — protocolo de eventos (ADR-0008 §D tabela linhas 62-69): sequência de eventos, payload de cada tipo.
- [x] `docs/_vendor/orca/src/shared/worktree-card-properties.ts` — `WorktreeCardProperty` ('status', 'branch', 'pr', 'automation'), `DEFAULT_WORKTREE_CARD_PROPERTIES` — referência de quais info exibir no card de worktree.
- [x] `docs/_vendor/orca/src/shared/diff-comments-format.ts` — `formatDiffComment`, `DiffComment { filePath, lineNumber, body, source }` — formato de diff annotation, quote-safe.
- [x] `docs/_vendor/orca/src/renderer/src/` — (referência visual de renderização de worktree cards no Orca).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `apps/estaleiro/ui/src/views/fleet/FleetView.tsx` — grid de worktrees/agentes, usa `useFleet`.
- **[CREATE]** `apps/estaleiro/ui/src/views/fleet/WorktreeCard.tsx` — card de worktree (status, branch, modelo, diff preview, cancel).
- **[CREATE]** `apps/estaleiro/ui/src/views/fleet/AgentTimeline.tsx` — timeline vertical de eventos (start → steps → done/aborted/error).
- **[CREATE]** `apps/estaleiro/ui/src/views/fleet/DiffAnnotation.tsx` — diff highlight com realce de linhas.
- **[CREATE]** `apps/estaleiro/ui/src/views/fleet/hooks.ts` — `useFleet()` hook (subscreve WS + mantém fleetStore).
- **[CREATE]** `apps/estaleiro/ui/src/views/fleet/FleetView.test.tsx` — testes da view frota (8 casos enumerados).
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx` — registrar o componente `FleetView` no FlexLayout (tab "Frota", component 'fleet' — EST-14a já criou o placeholder; esta task substitui pelo componente real).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- **Framework:** `vitest` + JSDOM + React Testing Library (`@testing-library/react`).
- **Ambiente:** Node puro, JSDOM. Mock do WebSocket e fleetStore (usar `vi.fn()` + TinyBase store real em memória).
- **Fora de Escopo:** Testes de integração com agente real ou servidor WS real (são do EST-14a). Testes de diff annotation complexo com diff real de 100+ linhas.

### Casos enumerados (8)

**FleetView.test.tsx (4 casos):**
1. **Renderiza lista de worktrees ativas:** mock fleetStore com 2 agentes em status `in_progress` e `done`. Renderizar `<FleetView ws={mockWs} />` → verificar que 2 `WorktreeCard` estão presentes.
2. **Estado vazio → mensagem:** fleetStore sem agentes → renderizar → verificar texto "Nenhum agente ativo" (empty state).
3. **Evento WS agent:start → card aparece:** `mockWs.onEvent` (callback que o hook registra) recebe `{ type: 'agent:start', taskId: 'T-1', ts: 1000, model: 'sonnet', cwd: '/tmp' }`. Verificar que fleetStore ganhou linha agents/T-1 com `status:'in_progress'`.
4. **Evento WS agent:done → status atualiza:** fleetStore já tem row `T-1` com `status:'in_progress'`. `mockWs.onEvent` recebe `{ type: 'agent:done', taskId: 'T-1', ts: 5000, text: 'done', steps: 12 }`. Verificar fleetStore agents/T-1.status === `'done'`.

**WorktreeCard.test.tsx (2 casos):**
5. **Renderiza informações do agente:** mock agente `{ taskId: 'T-1', model: 'sonnet', status: 'in_progress', started: Date.now()-60000, cwd: '/tmp' }`. Renderizar `<WorktreeCard agent={agent} />` → verificar texto com "sonnet", "T-1", badge status.
6. **Card em estado 'done' mostra duração:** mock agente com `status:'done'`. Renderizar → verificar que não mostra botão de cancel.

**AgentTimeline.test.tsx (1 caso):**
7. **Timeline renderiza eventos de tool-call na ordem:** mock fleetStore com eventos tool-call e tool-result. Renderizar `<AgentTimeline taskId="T-1" />` → verificar que eventos aparecem em ordem cronológica.

**DiffAnnotation.test.tsx (1 caso):**
8. **DiffAnnotation renderiza diff com realce:** mock diffSummary com `+console.log('added')` e `-const old = 'removed'`. Renderizar `<DiffAnnotation diffSummary={...} />` → verificar que linhas + e - têm classes CSS diferentes (`.diff-added`, `.diff-removed`).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** criar um WebSocket próprio — usar o `createWsClient` + `WsClient` já construídos em EST-14a.
> - **NÃO** duplicar a fleetStore schema — está definida em EST-14a, esta view só a população.
> - **NÃO** implementar `run()` nem `startMonitor()` — isso é escopo de EST-06, não da UI.
> - **NÃO** implementar o 3º degrau de extração OmniRoute (relevance, session-dedup) — isso é escopo de task futura (RFC-018 §6.6).
> - **NÃO** adicionar dependências de runtime além das trazidas pela semente A1 + React Testing Library (devDep).
> - **NÃO** editar stores/board.ts, stores/knowledge.ts, stores/decisions.ts, stores/cost.ts (são de outras views filhas).

### Pegadinhas conhecidas
- **WS client já existe em EST-14a:** o hook `useFleet` recebe `ws: WsClient` como parâmetro, não cria instância própria. O `onEvent` é registrado via `createWsClient({ onEvent: (e) => { /* dispatch para fleetStore */ } })` em App.tsx (que centraliza o dispatch para todas as stores por domínio).
- **TinyBase é reativa:** `useFleet` deve usar `useCreateStore` / `useCell` / `useRowIds` (hooks TinyBase) para que a UI re-renderize automaticamente quando a store muda. NÃO fazer `getTables()` manual em cada render.
- **`@testing-library/react` é devDep:** adicionar ao `apps/estaleiro/ui/package.json` se ainda não estiver lá (EST-14a pode não tê-la incluído — verificar antes de adicionar).
- **Fan-out (D2) é opcional:** implementar o caso base (1 worktree = 1 card). O agrupamento de múltiplas worktrees da mesma task é feature pós-v1, ativável por flag. Não arquitetar para suportar fan-out desde o v1 se isso aumentar a complexidade.
- **Branch name:** extrair do `cwd` (padrão: `/caminho/para/.superapp-worktrees/EST-14c/` → branch = `task/EST-14c`) ou de metadado enviado no evento `agent:start`. Se o evento não incluir branch, mostrar como "—".

1. **[TDD]** Criar `tests/FleetView.test.tsx` com casos 1–4.
2. **[TDD]** Criar `tests/WorktreeCard.test.tsx` com casos 5–6.
3. **[TDD]** Criar `tests/AgentTimeline.test.tsx` com caso 7.
4. **[TDD]** Criar `tests/DiffAnnotation.test.tsx` com caso 8.
5. Implementar `hooks.ts` — `useFleet(ws)` que subscreve `ws.onEvent` e popula fleetStore conforme tabela de mapeamento da §1.
6. Implementar `FleetView.tsx` — grid de WorktreeCards, integrado com `useFleet`.
7. Implementar `WorktreeCard.tsx` — status badge, modelo, branch, diff preview, botão de cancel (só se `status === 'in_progress'`).
8. Implementar `AgentTimeline.tsx` — timeline vertical de tool-calls/tool-results.
9. Implementar `DiffAnnotation.tsx` — diff highlight com classes CSS `.diff-added`/`.diff-removed`.
10. Atualizar `App.tsx` — importar `<FleetView />` e passar `ws` como prop no componente da tab "Frota".
11. Rodar build + test + lint (Seção 7) e colar saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões DERIVADAS de fonte (CITE OU ESCALE):**

| Item | Fonte |
|---|---|
| `AgentWsEvent` tipos (7 eventos) | EST-06 §1 `AgentEvent` union + EST-14a §1 `ws/events.ts` (prefixo `agent:`) |
| `FleetAgent.status` enum (in_progress/done/failed/aborted) | ADR-0008 §D (start → done/aborted/error) |
| `useFleet(ws)` recebe WsClient externo | EST-14a §1 `createWsClient()` — WS é único, compartilhado |
| `fleetStore` schema (`taskId, model, status, started`) | EST-14a §1 `stores/fleet.ts` |
| WorktreeCard propriedades (status, branch, model) | `docs/_vendor/orca/src/shared/worktree-card-properties.ts` — `WorktreeCardProperty` enum (status, unread, branch, pr, automation) |
| Diff annotation formato | `docs/_vendor/orca/src/shared/diff-comments-format.ts` — `formatDiffComment` (filePath, lineNumber, body), quote-safe |
| Fan-out opcional | RFC-018 D2 ("opcional por task, não o padrão") |
| Timeline de eventos | ADR-0008 §D (sequência: start → step/tool-call/tool-result → done/aborted/error) |
| Mapa evento→store da §1 | ADR-0008 §D payload de cada tipo de evento |

> **Decisões em aberto:** nenhuma. Todos os contratos derivam de EST-06 + EST-14a + ADR-0008 + RFC-018. O design é puramente mecânico — conectar eventos WS recebidos à TinyBase store e renderizar cards.

> **Dependências:** EST-14a (`done`, `ready`) — infraestrutura disponível. EST-06 (`in_review`) — event stream ainda não `done`, mas os contratos `AgentEvent` estão fixados na spec de EST-06 §1 (não devem mudar). Esta task pode ser executada em paralelo (modo `sequential` da task refere-se a steps internos, não ao bloqueio por EST-06).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `useFleet` subscreve WS único e popula fleetStore conforme mapeamento de eventos?
- [ ] FleetView exibe grid de WorktreeCards com dados ao vivo?
- [ ] WorktreeCard mostra status, modelo, branch, diff preview?
- [ ] Botão de cancel aparece só para agentes `in_progress`?
- [ ] AgentTimeline exibe tool-calls na ordem cronológica?
- [ ] DiffAnnotation renderiza diff com realce (+/-)?
- [ ] Fan-out não implementado como complexidade extra (só caso base 1 card = 1 agent)?
- [ ] App.tsx atualizado com FleetView real (não mais placeholder)?
- [ ] 8/8 testes verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + test + lint (todos Exit Code 0) na Seção 8. Lint incluído desde 2026-07-06 após 3 reworks consecutivos por regressão (T-807, EST-02b, EST-02c). Os 8 casos de teste DEVEM estar verdes.

### Checklist do Reviewer
- [ ] `useFleet` nunca cria ws próprio (recebe `WsClient` externo)?
- [ ] `FleetView` não duplica store schema (usa fleetStore de EST-14a)?
- [ ] Componentes tratam estado vazio (sem agentes)?
- [ ] Botão de cancel só aparece quando status === 'in_progress'?
- [ ] `App.tsx` atualizado com import real de FleetView?
- [ ] `pnpm build + test + lint` verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- View Frota implementada: 5 arquivos (hooks, FleetView, WorktreeCard, AgentTimeline, DiffAnnotation) + 4 arquivos de teste (9 casos cobrindo 8 exigidos pela spec; +1 caso extra em WorktreeCard cobrindo o caminho "in_progress mostra cancel"). App.tsx atualizado com FleetTab wrapper. Build + test + lint verdes: 14/14 testes passaram. Commit único: c4d68bc.

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
=== BUILD ===
$ pnpm --filter @plataforma/estaleiro-ui build
$ tsc
EXIT:0
```
```
=== TEST ===
$ pnpm --filter @plataforma/estaleiro-ui test
 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/EST-14c/apps/estaleiro/ui
 ✓ tests/smoke.test.ts (1 test) 263ms
 ✓ tests/ws-client.test.ts (2 tests) 368ms
 ✓ src/views/fleet/__tests__/FleetView.test.tsx (4 tests) 30ms
 ✓ src/views/fleet/__tests__/WorktreeCard.test.tsx (3 tests) 30ms
 ✓ src/views/fleet/__tests__/AgentTimeline.test.tsx (1 test) 23ms
 ✓ src/views/fleet/__tests__/DiffAnnotation.test.tsx (1 test) 22ms
 ✓ tests/shell.test.tsx (2 tests) 30ms

 Test Files  8 passed (8)
      Tests  14 passed (14)
EXIT:0
```
```
=== LINT ===
$ pnpm --filter @plataforma/estaleiro-ui lint
$ eslint src/
EXIT:0
```
- **Sondas adversariais (probes.test.ts, removido após uso):** 3 testes extra cobrindo ramos do `dispatchFleetEvent` não cobertos pela spec — `agent:aborted` → status `aborted`, `agent:error` → status `failed`, `agent:step` preserva status e atualiza `lastEventTs`. **Todas passaram** (17/17 com probes, 14/14 após remoção). Cobertura aguenta.
- **Comentários de Revisão:**
  - Escopo de arquivos: 6/6 arquivos `[CREATE]` existem (FleetView, WorktreeCard, AgentTimeline, DiffAnnotation, hooks, FleetView.test). 1/1 `[UPDATE]` aplicado (App.tsx com `FleetTab` wrapper). Sem diff fora do escopo (`git status` clean no commit c4d68bc).
  - Conformidade com DoD: 8/8 itens conferidos. Botão de cancel restrito a `status === 'in_progress'` (teste 6 + extra em WorktreeCard). Empty state implementado (teste 2). App.tsx substituiu o placeholder de EST-14a (tabs incluem `fleet` consumindo `FleetTab`). Sem dep nova de runtime: deps herdadas da semente A1 + `@testing-library/react` (devDep já presente).
  - Desvio de assinatura aceito: spec §1 declarava `FleetView({ ws })`; impl define `FleetView({ agents })` + wrapper `FleetTab` que faz `useFleet(ws)`. Esta divisão é mais limpa (view = puro presentacional, hook = bridge reativo, wrapper = compose) e a Pegadinha Conhecida do §5 já previa centralização do dispatch em App.tsx. **MINOR (i1)** — não impede aprovação; registrar na spec via cleanup se a forma `FleetView({ ws })` for canônica desejada.
  - `useFleet(ws).status`: declarado `string` no retorno (não o tipo discriminado `"connected"|...|"reconnecting"` que `WsClient['getStatus']()` produz). Capturado **uma vez** em `useState(() => ws.getStatus())` — não atualiza em mudanças de conexão após mount. **MINOR (m1)** — spec não exige exibição ao vivo do status da conexão (DoD/Reviewer Checklist não cobrem o item). Anotar para cleanup futuro se o painel precisar reagir a reconnect.
  - `FleetAgent.status` enum declara `'starting' | 'paused'` mas `dispatchFleetEvent` só emite `'in_progress' → 'done'|'aborted'|'failed'`. Estados reservados para o futuro. **INFO (i2)**.
  - `DiffAnnotation` faz split-de-linhas com prefixo `+`/`-` puro; a referência citada (`docs/_vendor/orca/.../diff-comments-format.ts`) usa `formatDiffComment(filePath,lineNumber,body)`. Para v1, a versão simples cumpre o requisito do teste 8; integração plena com o formato Orca é trabalho de cleanup. **MINOR (m2)**.
  - Gate de acoplamento: `apps/estaleiro/ui` não importa nada de `apps/nexus-backend` nem fecha ciclo com o `protocol ← crypto ← core ← transport`. **OK**.
- **Decisão:** todos os 8 testes da spec passam + 1 extra em WorktreeCard + 3 sondas adversariais. Build + lint limpos. Zero BLOCKER, zero MAJOR. Os 3 MINOR/INFO acima são observáveis, não bloqueantes — podem ir para o ledger de cleanup.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-07T13:31]** - *big-pickle* - `[Triado]`: triado — view frota, sonnet, depende de EST-14a (ready) + EST-06 (in_review)
- **[2026-07-07T13:31]** - *big-pickle* - `[Endurecido]`: endureceu spec — 8 casos de teste, contratos TS derivados de EST-06+EST-14a+ADR-0008, gate build+test+lint
- **[2026-07-07T13:58]** - *system* - `[Auto-promovida]`: dep EST-14a concluída
- **[2026-07-07T14:11]** - *deepseek* - `[Iniciado]`: iniciando — View Frota: painel de agentes ao vivo
- **[2026-07-07T14:23]** - *deepseek* - `[Finalizado]`: View Frota: FleetView+WorktreeCard+AgentTimeline+DiffAnnotation. 14/14 testes verdes. build+lint limpos.
- **[2026-07-07T16:45]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando
- **[2026-07-07T16:52]** - *agile_reviewer:claude-sonnet* - `[Aprovado]`: Integrado: merge na master (commit 8572cf4), worktree removida, Gate verde (build+test 14/14+lint EXIT:0). 4 nao-bloqueantes -> ledger de pendencias.
