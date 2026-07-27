---
id: EST-81
title: "Loop de despacho: sessoes fixadas a epico, contexto get-task real, re-despacho e auto-harden"
status: draft:hardened
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
test_profile: ui # o gate da onda é um smoke de produto observável (M1), não só unit
ui: true
dependencies: ["EST-78", "EST-79", "EST-80"]
blocks: []
capacity_target: opus # trabalho INTEGRATIVO — composto por M5, não decomposto
---

# EST-81 · Loop de despacho: sessões fixadas a épico, contexto get-task real, re-despacho e auto-harden

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Test Runner:** `vitest` + `playwright`
- **Capacidade-alvo:** `opus`. **Justificativa (regra M5 do CLAUDE.md — dimensionar é bidirecional):**
  esta é uma fatia vertical (loop + binding de sessão + prompt + UI de controle) cujas partes só
  fecham sabendo o contrato uma da outra e que tocam os mesmos arquivos (`bootstrap.ts`,
  `dispatcher.ts`, `ChatView.tsx`). Decompor em 4 Sonnet custaria 4 endurecimentos + 4 reviews +
  reconciliação de specs que se cruzam — mais caro que uma Opus coerente.

## 1. Objetivo

O despacho automático do Estaleiro existe e **não funciona**, por três motivos verificados:

1. **O prompt é literalmente inútil.** `apps/estaleiro/core/src/bootstrap.ts:599`:
   ```ts
   prompt: `Execute task ${opts.taskId} in ${opts.cwd}`
   ```
   Sem spec, sem RAG, sem skill, sem worktree, sem gate. O `tools/scripts/get-task.mjs` do Docs já
   produz exatamente esse contexto (skill + task + RAG + guarda de identidade) e **não é chamado**.
2. **Não há loop.** `/api/dispatch/{single,branch,epic}` é one-shot por request HTTP. Nada
   re-despacha quando um worker termina. O sistema precisa de um humano clicando a cada task.
3. **`harden` está fora da prioridade.** `dispatcher.ts` define
   `ACTION_PRIORITY = {review:0, rework:1, work:2, harden:3, promote:4}` — a ordem correta, já
   implementada — mas `bootstrap.ts:590` passa `priority: ["work","review","rework"]`, **excluindo
   `harden` e `promote`**. Tasks destravadas por um `done` nunca são endurecidas automaticamente.

Esta task fecha o loop: **sessão de chat fixada a um épico, alimentada por um script que seleciona a
próxima task pela prioridade, injeta o contexto real do `get-task`, e reencaminha a próxima assim que
o worker termina** — com uma das sessões marcada como integradora (a única que roda gate/e2e/merge).

**Entregável de verdade:** duas sessões vivas, uma fila, três tasks indo de `ready` a `done` sem
intervenção humana.

## 2. Contexto RAG (Spec-Driven Development)
- [x] `packages/plugin-dispatcher/src/dispatcher.ts` — `planDispatch`, `executeDispatch`,
      `dispatchEpic`, `ACTION_PRIORITY` (a prioridade pedida **já está certa** aqui).
- [x] `packages/plugin-dispatcher/src/selectModel.ts` — seleção de modelo por `capacityTarget`.
- [x] `apps/estaleiro/core/src/bootstrap.ts:229-330` (`runAgentTurn`), `:586-655` (dispatch routes).
- [x] `tools/scripts/get-task.mjs` (Docs) — `node get-task.mjs <ID> [--json]`, **READ-ONLY**, resolve
      skill + task + RAG + worktree + guarda de identidade. É o gerador de prompt, não reimplemente.
- [x] `packages/plugin-tasks/src/epic.service.ts` — `Epic`, `DEFAULT_PREFIXES`, `inferEpicId`.
- [x] `apps/estaleiro/ui/src/views/chat/ChatView.tsx` — conversas, `workspaceRoot` por conversa,
      seletor de modelo (**hoje global, precisa virar por conversa**).
- [x] `CLAUDE.md` → "As 6 Regras" (§2 handoff, §3 gate de evidência, §3c gate de onda, §6 separação
      de papéis) e "Paralelismo no controle".
- [x] `tools/scripts/manage-task.mjs` — os verbos; `tools/scripts/fila.mjs` — commit/push serial.
- [x] `EST-78` — o `TaskService` sobre markdown (esta task **depende** de tasks serem lidas do disco
      a cada ciclo, senão a outra máquina é invisível).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** todos os itens do §2
- **[CREATE]** `apps/estaleiro/core/src/task-prompt.ts` — `buildTaskPrompt()` (shell-out no `get-task.mjs`)
- **[CREATE]** `apps/estaleiro/core/src/dispatch-loop.ts` — `createDispatchLoop()`
- **[CREATE]** `apps/estaleiro/core/tests/dispatch-loop.test.ts`, `tests/task-prompt.test.ts`
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts` — `runAgent` real; `priority` completa;
  rotas `POST /api/dispatch/loop/{start,stop}` + `GET /api/dispatch/loop`
- **[UPDATE]** `apps/estaleiro/core/src/conversation-store.ts` — campos `epicId`, `modelId`,
  `role: "worker" | "integrator"` por conversa
- **[UPDATE]** `packages/plugin-dispatcher/src/dispatcher.ts` + `types.ts` — filtro por `epicId` e
  por `role` no `planDispatch`
- **[UPDATE]** `apps/estaleiro/ui/src/views/chat/ChatView.tsx` — modelo/épico/papel por conversa
- **[CREATE]** `apps/estaleiro/e2e/dispatch-loop.spec.ts` — o smoke de onda (§7)

**Fora de escopo:** novos sub-status (ver §6). Balanceamento de custo/`getBalances` (hoje `[]`).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest para o loop e o prompt; **Playwright** para o smoke de onda.
- [x] **Casos obrigatórios (unit):**
  1. `buildTaskPrompt("EST-XX")` invoca `get-task.mjs` e o texto resultante contém a §3 (escopo de
     arquivos) e o path da worktree — **falha o teste se o prompt for menor que 500 chars**
     (guard contra a regressão para `"Execute task X"`).
  2. `get-task.mjs` com exit ≠ 0 → o item é **pulado com motivo registrado**, o loop não morre.
  3. `planDispatch` com `epicId: "estaleiro"` só devolve tasks daquele épico.
  4. Sessão `role: "worker"` nunca recebe ação `review`; sessão `integrator` **só** recebe
     `review`/`rework`.
  5. Duas sessões, duas tasks: cada uma recebe uma, **nenhuma recebe as duas** (sem corrida de slot).
  6. Ao terminar um turno, o loop despacha a próxima **sem** novo request HTTP.
  7. Uma task indo a `done` dispara `harden` nas tasks que ela destravava (`blocks`) e que estão em
     `draft:triaged` com **todas** as deps `done`.
  8. `stop()` não mata o turno em andamento; para de despachar novos e o turno corrente termina.
  9. Antes de cada ciclo, `git pull --ff-only` no Docs; **divergência → o loop para** e reporta
     (nunca resolve merge sozinho).
- [x] **Smoke de onda (Playwright, regra M1/§3c — este é o critério que importa):**
  subir o Estaleiro, criar duas conversas (uma worker/uma integrator, mesmo épico), iniciar o loop,
  e observar **três tasks reais transitando `ready` → `in_progress` → `review` → `done`** com o
  board atualizando por WS e os commits aparecendo em `git log` do Docs. Screenshot + `git log` colados.
- [x] **Fora de Escopo:** provar que o código produzido pelos workers está correto (isso é o gate de
      cada task, não desta).

## 5. Instruções de Execução (Step-by-Step)

> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** reimplemente a resolução de contexto de task em TypeScript. `get-task.mjs` já faz, tem
>   `--json`, é READ-ONLY e é a mesma coisa que as skills usam. Shell-out.
> - **NÃO** deixe o worker chamar `approve`/`request_changes` (regra 6 INVIOLÁVEL). A sessão
>   integradora usa `agile_reviewer:<modelo>` como ator; a worker usa `<modelo>` puro. O
>   `assertWorkerNotApproving` vai barrar — **não contorne o guard**, corrija o ator.
> - **NÃO** crie sub-status novos (`in_progress:test`, `review:approved` etc). Ver §6.
> - **NÃO** deixe o `catch {}` mudo do `executeDispatch` (dispatcher.ts:~155) engolir a falha de
>   transição. Um `start` que falha silenciosamente faz o loop rodar em falso para sempre — o
>   sintoma exato que a EST-78 §4 caso 5 cobre do outro lado.
> - **NÃO** rode gate/e2e/merge na sessão worker. Só a integradora.
> - **NÃO** faça `git push --force` nem resolva conflito automaticamente no Docs.

### Pegadinhas conhecidas
- **`maxConcurrent` = 0 mata tudo** (regra M7 do CLAUDE.md: o custo do pipeline existe sem
  benefício). Default desta task = **2**, uma sessão cada. Deixe configurável, mas nunca 0 por default.
- **`isBusy` conta tasks, não sessões.** `planDispatch` calcula slots por
  `maxConcurrent - tasks(in_progress|in_review)`. Com duas máquinas mexendo no mesmo markdown, uma
  task `in_progress` na **outra** máquina consome slot aqui. Isso é *desejável* (evita duplicar
  trabalho) mas exige que o filtro considere o campo `machine:` — task `in_progress` em outra
  máquina não deve ser recontada como slot **local**. Resolva explicitamente e teste.
- **Máquina toca uma fila só.** O binding é `machine → epicId` (config, não código). Duas máquinas
  no mesmo épico duplicam trabalho mesmo com o markdown sincronizado, porque o pull tem latência.
- **`git pull` no meio de um turno** troca arquivos debaixo de um worker que está editando. Puxe
  **entre** ciclos, com nenhum turno rodando, ou apenas no repo Docs (o superapp tem worktrees por
  task, isoladas — o risco real é só no Docs).
- **Identidade do ator** (CLAUDE.md, INVIOLÁVEL): `actorFromModel()` corta o prefixo do provider
  (`anthropic/claude-opus` → `claude-opus`). Confirme que o resultado passa no
  `assertValidModelIdentity` **antes** de rodar o loop, ou toda transição falha na primeira volta.
- **Circuit breaker existe** (`maxReviewCycles: 3`) e é o que impede um par worker/reviewer de
  ping-pongar para sempre queimando tokens. Não o afrouxe.
- O `runAgentTurn` monta `taskId: chat:<conversationId>`; os eventos WS `agent:*` usam isso. Para o
  loop, o `taskId` precisa carregar a task real (ex.: `EST-42@chat:<convId>`) ou o board não
  consegue ligar o stream à task. Escolha um formato e use-o em todos os emissores.

### Passos
1. **[TDD]** `task-prompt.test.ts` (casos 1-2), depois `task-prompt.ts`:
   ```ts
   export async function buildTaskPrompt(opts: {
     taskId: string;
     action: "work" | "rework" | "review" | "harden" | "promote";
     docsRoot: string;
     runScript?: (script: string, args: string[]) => Promise<string>; // injetável p/ teste
   }): Promise<string>;
   ```
2. Troque o `runAgent` do `buildDispatchCtx` (bootstrap.ts:598) para usar `buildTaskPrompt` e o
   `conversationId` da sessão fixada ao épico. Corrija `priority` para
   `["review","rework","work","harden","promote"]`.
3. Adicione `epicId`/`modelId`/`role` ao `conversation-store` + migração da tabela.
4. **[TDD]** `dispatch-loop.test.ts` (casos 3-9), depois `dispatch-loop.ts`:
   ```ts
   export interface DispatchLoop {
     start(): void;
     stop(): Promise<void>;
     status(): { running: boolean; sessions: { conversationId: string; epicId: string;
       role: "worker" | "integrator"; currentTaskId: string | null }[] };
   }
   export function createDispatchLoop(opts: {
     ctx: DispatchContext;
     conversationStore: ConversationStore;
     docsRoot: string;
     /** Puxa o Docs entre ciclos. Para o loop se divergente. */
     pullDocs: () => Promise<{ ok: boolean; reason?: string }>;
     onEvent?: (e: { type: string; taskId?: string; detail?: string }) => void;
   }): DispatchLoop;
   ```
   O loop é **event-driven, não polling**: ao terminar um turno, replaneja. Um tick de fallback
   (60s) cobre o caso de a fila estar vazia e uma task nova chegar por `git pull`.
5. Auto-harden (caso 7): após um `approve → done`, para cada id em `blocks` cujo estado é
   `draft:triaged` e cujas deps estão todas `done`, enfileire ação `harden`. O `manage-task.mjs`
   já auto-promove `harden` com deps `done` (T-1029) — **não duplique** o auto-promote.
6. Rotas `POST /api/dispatch/loop/start|stop` e `GET /api/dispatch/loop` + broadcast WS do status.
7. `ChatView`: seletor de modelo/épico/papel **por conversa** (hoje o modelo é estado global do view).
8. Smoke Playwright (`e2e/dispatch-loop.spec.ts`).
9. `pnpm gate estaleiro-core --profile backend` + `pnpm gate estaleiro --profile ui`.

## 6. Feedback de Especificação (Spec Feedback Loop)

**Decisão registrada — sub-status novos foram deliberadamente recusados.** A proposta original pedia
`in_progress:test`, `:in-test`, `:tested` e `review:approved`. O ciclo atual já os expressa:

| Pedido | Já é |
|---|---|
| `in_progress:test` (código pronto, falta testar) | `finish` → **`review`** |
| `in_progress:in-test` (gate rodando) | `claim` → **`in_review`** |
| `in_progress:tested` (gate verde, falta merge) | **`in_review`** |
| `review:approved` → falha no merge → rework | `request_changes` → **`rework`** (o `/integrar-task` já faz merge e approve juntos) |

"Só uma sessão roda testes/e2e/merge" é **roteamento** (`role: integrator` filtra `review`/`in_review`),
não lifecycle. Cinco status × guards × `TRANSITIONS` × UI do board para expressar o que dois filtros
expressam. Se depois de rodar faltar granularidade real, aí vira task — com o caso concreto em mãos.

**Se o worker discordar disso ao implementar → PARE e `pause`.** Não introduza status novo no meio.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] **[GATE DE ONDA — M1/§3c, o critério que importa]** Duas sessões de chat vivas (worker +
      integrator, mesmo épico), loop iniciado, **três tasks reais** indo de `ready` a `done` sem
      intervenção humana. Evidência: screenshot do board + `git log --oneline -10` do Docs colados no §8.
- [ ] O prompt enviado ao worker é o output do `get-task.mjs` (colar os primeiros 30 linhas de um
      prompt real no §8).
- [ ] `priority` inclui `harden` e `promote`; uma task destravada por um `done` é endurecida sozinha.
- [ ] Sessão worker nunca executa `approve`/`request_changes`.
- [ ] Modelo é selecionável **por sessão** na UI.
- [ ] `git pull` divergente **para** o loop e reporta, sem resolver sozinho.
- [ ] `maxConcurrent` default ≠ 0.
- [ ] Falha de transição não é engolida por `catch {}`.
- [ ] Gates verdes (`backend` no core, `ui` no app); linter limpo.

### Verificação automática
```bash
pnpm gate estaleiro --profile ui
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test + lint):**
```
(cole aqui a saída real de pnpm build, pnpm test e pnpm lint)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-27T15:55]** - *claude-opus* - `[Triado]`: spec escrita a partir da auditoria do Estaleiro 2026-07-27
- **[2026-07-27T15:56]** - *claude-opus* - `[Endurecido]`: spec executavel: assinaturas, casos de teste, pegadinhas e DoD por comando
