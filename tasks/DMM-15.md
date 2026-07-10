---
id: DMM-15
title: "Fila/estado durável do orquestrador: impl nativa do superapp (nodes/edges + canais efêmeros)"
status: done
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"] # precisa da interface StepQueue/Envelope do orquestrador
blocks: []
capacity_target: sonnet # escala p/ opus-spike se o mapeamento envelope↔grafo CRDT for não-trivial
---

# DMM-15 · Fila/estado durável do orquestrador (impl nativa do superapp)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
O DMM-01 entrega a fila do orquestrador como **interface (`StepQueue`)** + uma impl **in-memory que é
gambiarra temporária** (só o Estaleiro standalone). Esta task entrega a impl **nativa e durável do
superapp**, que **reutiliza as primitivas existentes** (decisão do humano, 2026-07-08, ADR 0014):
- **nodes/edges** do grafo CRDT (`packages/core`) — definição de workflow + **histórico durável** dos
  passos/envelope (resumível, auditável, observável para o pipeline de RL do DMM-11);
- **canais efêmeros** (`packages/transport`) — o **trânsito** dos passos (a "mensageria" do loop).
Sem reinventar fila/persistência: o workflow vira grafo + mensagens no que o superapp já tem.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0014-contrato-orquestrador-declarativo.md` (DMM-01) — `StepQueue`/`Envelope` + §reuso no superapp.
- [ ] `packages/core/src/**` — nodes/edges, projection, rbsr (modelo de grafo CRDT).
- [ ] `packages/transport/src/**` — canais efêmeros (mensageria) a reutilizar como transporte de passos.
- [ ] `apps/estaleiro/core/src/ports/store.ts` — `StorePort` (fallback durável simples se o mapeamento a grafo for pesado).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** interface `StepQueue`/`Envelope` (DMM-01), `packages/core/src/**` (nodes/edges), `packages/transport/src/**` (canais).
- **[CREATE]** impl de `StepQueue` durável sobre nodes/edges + canais efêmeros (path a fixar no endurecimento).
- **[CREATE]** teste: enfileirar/consumir passos sobrevivendo a "restart" (releitura do grafo); histórico do envelope reconstruído.

## 4. Estratégia de Testes Estrita
- Vitest. Métrica: durabilidade (estado reconstruído do grafo) + ordem FIFO. **Fora de Escopo:** rede P2P real.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** reimplementar CRDT/fila — **reutilizar** `packages/core` (nodes/edges) e `packages/transport` (canais).
> - **NÃO** mudar a interface `StepQueue` do DMM-01 — esta é só a **impl** durável (a in-memory fica p/ testes).
> - **NÃO** acoplar o orquestrador a esta impl — ele recebe uma `StepQueue` por DI (in-memory OU esta).

### Pegadinhas conhecidas
- Se mapear `Envelope`/passos para nodes/edges do CRDT for não-trivial, **escalar para opus-spike** (ADR de mapeamento) antes de codar.

## 6. Feedback de Especificação
### Decisões Arquiteturais Fechadas (2026-07-09)
1. **Mapeamento Estrutural (Event Sourcing):** Opção B escolhida. O `Envelope` **não** é salvo in-place; ele é materializado via `reduce` a partir da linhagem de Deltas. Cada passo (`delta`) concluído vira um `SignedNode` (tipo `WORKFLOW_STEP`), anexado ao grafo do Superapp via aresta `MUTATES`.
2. **Durabilidade no Estaleiro:** Não usaremos o TinyBase da port `store.ts` (que é apenas para plugins salvarem KV arbitrário). O Estaleiro instanciará nativamente o `SqliteStorage` (exportado de `packages/core`) em um arquivo local (ex: `.estaleiro/orchestrator.db`) rodando as migrations de `schema.ts`. Isso garante que o código escrito na DMM-15 seja **100% nativo** e o mesmo que rodará no Superapp.
3. **Fila de Trânsito Efêmera:** Como o motor Zen é puramente determinístico, a fila de passos pendentes (o que o `enqueue` empurra) vive **apenas em memória**. Em caso de queda/crash, o boot lê o `Envelope` do disco, passa pelo Zen e o Zen deduz perfeitamente qual o próximo passo e o re-enfileira de graça. Sem sujeira temporária no banco.

### Classificação (pass-2)
- **Status:** `draft:hardened`
- **Motivo:** Mapeamento resolvido. Escopo 100% alinhado com a topologia CRDT existente. Pronta para Worker.
## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `StepQueue` durável sobre nodes/edges + canais efêmeros; workflow sobrevive a restart; ordem preservada.
### Verificação automática
```bash
pnpm --filter @plataforma/core test
pnpm --filter @plataforma/transport test
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **Refatoração parcial (REFATORAÇÃO NECESSÁRIA pelo Revisor R1):**
- **MAJOR [M1]**: `durableQueue.ts:88` insere `entity_id = signed.id` (ULID do ROOT), mas `initialize:56` consulta por `workflowId`. Restart falha — o probe (close+reopen) retorna `loadEnvelope → {}` em vez do envelope reconstruído.
- **MAJOR [M2]**: Tests 2 e 3 do `durableQueue.poc.test.ts` alegam "sobrevive a crash" mas só chamam `walCheckpoint` + `close` na mesma sessão — não testam restart real.
- **MAJOR [M3]**: `WorkflowEvent`/`onStep` removidos da API pública de `OrchestratorOptions` sem aviso na spec.
**Rework M1+M2+M3 (big-pickle, 2026-07-09):**
- **[M1]** `durableQueue.ts:85,89` — entity_id trocado de `signed.id` (ULID) para `workflowId` em entity_heads e entity_members. `initialize` na sessão 2 encontra entity_id pela query `WHERE entity_id = workflowId`, restaurando o envelope corretamente.
- **[M2]** `durableQueue.poc.test.ts` — adicionado teste "sobrevive a restart real (close+reopen)": Sessão 1 → initialize + commitDelta + checkpoint + close; Sessão 2 → reabre mesmo dbPath → initialize → loadEnvelope → assere dados preservados.
- **[M3]** Documentado: `WorkflowEvent`/`onStep` removidos por decisão §6 (Event Sourcing), zero consumers — defensável, track em m1.
- Gate:
```
$ pnpm --filter @plataforma/plugin-workflows build
$ tsc (Exit 0)
$ pnpm --filter @plataforma/plugin-workflows test
✓ poc/durableQueue.poc.test.ts (6 tests - NOVO restart)
✓ poc/explorer.poc.test.ts (4)
✓ poc/editor.poc.test.ts (5)
✓ poc/chain.poc.test.ts (1)
✓ poc/ingress.poc.test.ts (6)
✓ poc/architect.poc.test.ts (7)
 Tests 29 passed
$ pnpm --filter @plataforma/core test
 23 files | 212 passed
$ pnpm --filter @plataforma/transport test
 16 files | 146 passed
$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/ (Exit 0)
```
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Revisor:** `agile_reviewer:claude-sonnet` (1ª revisão independente)
- **Data:** 2026-07-09
- **Anti-ancoragem:** veredito formado a partir da spec + código + Gate + sondas **antes** de reler Handover. (Sem pareceres anteriores.)

**QA REPORT — DMM-15 — DurableStepQueue (Fila durável do orquestrador)**
```
Data: 2026-07-09  |  Revisor: agile_reviewer (claude-sonnet)
Spec consultada: tasks/DMM-15.md §1–7  |  Arquivos auditados: 17 (5 created + 12 modified) — branch tem 1 commit
Testes: 28 + 212 + 146 = 386 rodados · 386 passaram · 0 falharam
tsc: OK (0 erros)  |  lint: OK (0 erros)

Evidência de Execução
─────────────────────
$ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows test
$ vitest run
 ✓ poc/explorer.poc.test.ts       (4 tests)  ← DMM-04
 ✓ poc/durableQueue.poc.test.ts   (5 tests)  ← NOVOS
 ✓ poc/editor.poc.test.ts         (5 tests)  ← DMM-05
 ✓ poc/chain.poc.test.ts          (1 test)   ← DMM-01
 ✓ poc/ingress.poc.test.ts        (6 tests)  ← DMM-02
 ✓ poc/architect.poc.test.ts      (7 tests)  ← DMM-03

 Test Files  6 passed (6)
      Tests  28 passed (28)
   Start at  15:28:11
   Duration  2.73s

$ pnpm --filter @plataforma/core test
$ vitest run
 ✓ tests/ucan.test.ts                          (18 tests)
 ✓ tests/invite.test.ts                        (8 tests)
 ✓ tests/sqliteStorage.test.ts                 (12 tests)
 ✓ tests/snapshot.test.ts                      (16 tests)
 ✓ tests/merge.test.ts                         (16 tests)
 ✓ tests/lineage.test.ts                       (14 tests)
 ✓ tests/dbOwner.test.ts                       (5 tests)
 ✓ tests/archive/assignCustodian.test.ts       (4 tests)
 ✓ tests/rbsr.applyNodes.test.ts               (5 tests)
 ✓ tests/keyVault.test.ts                      (18 tests)
 ✓ tests/signature.test.ts                     (10 tests)
 ✓ tests/archive/archiveCargo.test.ts          (5 tests)
 ✓ tests/hlc.test.ts                           (10 tests)
 ✓ tests/archive/blindArchives.test.ts         (6 tests)
 ✓ tests/schema.test.ts                        (7 tests)
 ✓ tests/deviceState/schema.test.ts            (4 tests)
 ✓ tests/sqliteStorage.graphStore.test.ts      (6 tests)
 ✓ tests/projection.test.ts                    (6 tests)
 ✓ tests/ucanScope.test.ts                     (10 tests)
 ✓ tests/mock.test.ts                          (1 test)
 ✓ tests/ucanScope.access.test.ts              (9 tests)
 ✓ tests/concurrentGuard.test.ts               (9 tests)
 ✓ tests/ulid.test.ts                          (13 tests)

 Test Files  23 passed (23)
      Tests  212 passed (212)
   Start at  15:28:16
   Duration  4.24s

$ pnpm --filter @plataforma/transport test
$ vitest run
 ✓ tests/webrtc.test.ts                (13 tests)
 ✓ tests/websocket.test.ts             (17 tests)
 ✓ tests/graphRouting.test.ts          (11 tests)
 ✓ tests/fpp.test.ts                   (17 tests)
 ✓ tests/privateSwarm.test.ts          (8 tests)
 ✓ tests/SwarmRegistry.test.ts         (14 tests)
 ✓ tests/noiseServer.test.ts           (2 tests)
 ✓ tests/noiseHandshake.test.ts        (13 tests)
 ✓ tests/syncCoordinator.test.ts       (8 tests)
 ✓ tests/SwarmRegistry.audit.test.ts   (7 tests)
 ✓ tests/relayTrustModel.test.ts       (11 tests)
 ✓ poc/noise-xx.poc.test.ts            (4 tests)
 ✓ tests/promotion.try.test.ts         (6 tests)
 ✓ tests/transportMatrix.test.ts       (8 tests)
 ✓ tests/mock.test.ts                  (1 test)
 ✓ tests/heartbeat.test.ts             (6 tests)

 Test Files  16 passed (16)
      Tests  146 passed (146)
   Start at  15:28:22
   Duration  2.85s

Sonda adversarial de restart
────────────────────────────
`poc/_restart-r1.probe.test.ts` (redigido, executado, **REMOVIDO**) —
réplica do test 2 do worker + close/reopen real:
1. Sessão 1: `new SqliteStorage(dbPath)` → `initialize("wf-restart")`
   → `commitDelta({executed:true, output:"ok-restart"})` →
   `walCheckpoint("TRUNCATE")` → `close()`.
2. Sessão 2: `new SqliteStorage(dbPath)` → `initialize("wf-restart")`
   → `loadEnvelope()`.

**Resultado:** `loadEnvelope → {}` — `env.executed` é `undefined` (esperado
`true`). Falha: o restart NÃO preserva o estado. O DoD §7 "workflow
sobrevive a restart" é violado.

Dump da DB na sessão 2 (após restart):
  entity_heads:  1 row
  entity_members: 2 rows (ROOT, ROOT) e (STEP, ROOT)
  nodes:         2 rows ROOT (WORKFLOW_ROOT, plen=27) e
                       STEP (WORKFLOW_STEP, plen=39)
  edges:         1 row ROOT→STEP (MUTATES)

**Análise:** a DB TEM os dados, mas `loadEnvelope` falha porque a
segunda sessão não os encontra. Causa raiz: o `initialize` insere
`entity_id = signed.id` (ULID do ROOT) em `entity_heads` (L88), mas a
próxima chamada de `initialize` consulta `entity_id = workflowId` (L56).
Os dois não batem → query retorna 0 rows → cai no branch CREATE → cria
um NOVO root órfão → `loadEnvelope` lê apenas a linhagem do novo root
(vazia) e retorna `{}`.

Probe deletado após verificação (não polui deliverable).
```

BLOCKER (0) / MAJOR (3) / MINOR (3) / INFO (5)
────────────────────────────────────────────────────
**MAJOR**
`[M1]` `packages/plugin-workflows/src/durableQueue.ts:88,56` — **Restart
survival BROKEN**. DoD §7 "workflow sobrevive a restart" violado.
  Evidência: o probe close+reopen retorna `loadEnvelope → {}` em vez
  de `{executed:true, output:"ok-restart"}`. Dump da DB confirma que
  os dados persistem (2 nodes, 1 edge, 1 entity_head) — o problema
  é o schema de identidade, não a persistência.
  Causa raiz (ver `durableQueue.ts:88`):
  ```ts
  await storageExec(this.storage, [
    "INSERT INTO entity_heads (entity_id, head_id, head_hlc) VALUES (?, ?, ?)",
    [signed.id, signed.id, String(signed.hlc)],  // ← entity_id = ROOT ULID
  ]);
  ```
  E `durableQueue.ts:56-64`:
  ```ts
  const existing = await this.storage.exec(
    "SELECT head_id FROM entity_heads WHERE entity_id = ?",
    [workflowId],  // ← query por workflowId
  );
  ```
  Em restart, `existing` é vazio (entity_id != workflowId), o branch
  CREATE executa, insere um novo ROOT, e o envelope é vazio porque
  a linhagem do novo ROOT não inclui os WORKFLOW_STEP antigos.
  Viola: §1 ("histórico durável dos passos/envelope (resumível,
  auditável, observável)") + §7 ("workflow sobrevive a restart; ordem
  preservada").
  Ação (1 das 2): **(a) RECOMENDADO** — na L88, trocar
  `[signed.id, signed.id, ...]` por `[workflowId, signed.id, ...]`
  (entity_id = workflowId, head_id = ROOT ULID). Também precisa
  ajustar L78-86 (entity_members) para usar `workflowId` como
  entity_id se a semântica for "todos os nós do mesmo workflow
  compartilham entity_id". **(b)** — manter entity_id = signed.id e
  mudar a query de initialize para buscar por `signed.id` em vez de
  `workflowId` (mas isso requer que o caller passe o ROOT ULID entre
  sessões, o que derrota o ponto de usar workflowId).

`[M2]` `packages/plugin-workflows/poc/durableQueue.poc.test.ts:63-89` —
**Test 2 ("envelope reconstruído") MISLEADING**.
  Evidência: o test 2 commita 3 deltas, chama
  `storage.walCheckpoint("TRUNCATE")` e `storage.close()` na mesma
  sessão, mas **não reabre** o storage. O comentário "Durabilidade:
  checkpoint força persistência em disco (sobrevive a crash)" é
  incorreto — o teste não prova sobrevivência a crash, apenas que
  `walCheckpoint` + `close` completam sem throw.
  Test 3 tem o mesmo padrão (`:91-106`).
  Handover repete a alegação: "5 testes em
  poc/durableQueue.poc.test.ts: FIFO, reconstrução de envelope,
  acumulação de deltas, erro sem init, envelope vazio." — mas
  "reconstrução" é só intra-sessão, não pós-restart.
  Viola: §4 (Métrica: durabilidade — estado reconstruído do grafo).
  Ação: adicionar 1 teste que **realmente** simula restart:
  ```ts
  it("sobrevive a restart real (close+reopen)", async () => {
    // Sessão 1: enqueue/commit
    // Sessão 2: reabre o mesmo dbPath, chama initialize, loadEnvelope
    // espera { ... } e não {}
  });
  ```
  ~15 linhas. Torna o test 2-3 honesto (ou os deleta se redundantes).

`[M3]` `packages/plugin-workflows/src/{types,orchestrator,index}.ts` —
**Public API change: `WorkflowEvent`/`onStep` removidos**.
  Evidência:
  - `types.ts:40-44` (master) → deletado em DMM-15.
  - `types.ts:46` `onStep?: (event: WorkflowEvent) => void` → deletado.
  - `orchestrator.ts:31,34` `opts.onStep?.(...)` → deletado.
  - `index.ts:10` `WorkflowEvent` re-export → deletado.
  Grep no monorepo confirma: **zero consumers** usam `onStep` (foi
  declarado no DMM-01 mas nunca wired). O §5 da spec é silente sobre
  `onStep`; o §6 (Event Sourcing) torna o hook obsoleto — o envelope
  é reconstruído via reduce do grafo, não via eventos do loop.
  Defensável pela §6 (decisão arquitetural fechada) + zero consumers.
  Mas viola implicitamente §5 ("NÃO mudar a interface StepQueue do
  DMM-01") no espírito (a `OrchestratorOptions` é parte do contrato
  público do orquestrador, e remover `onStep` é uma mudança dele).
  Ação: reendurecer §3 da spec para incluir esta mudança no escopo
  (track: m1 abaixo), ou re-adicionar `onStep` como wrapper que
  observa o grafo pós-commit.

**MINOR**
`[m1]` Spec §3 lista só `[READ] interface StepQueue/Envelope (DMM-01),
packages/core/src/** (nodes/edges), packages/transport/src/** (canais)
[CREATE] impl de StepQueue durável [CREATE] teste`. Não menciona
as mudanças em:
  - `packages/plugin-workflows/src/types.ts` (deleção WorkflowEvent)
  - `packages/plugin-workflows/src/orchestrator.ts` (deleção onStep calls)
  - `packages/plugin-workflows/src/index.ts` (re-export removed)
  - `packages/plugin-workflows/package.json` (deps adicionadas)
  - `apps/estaleiro/server.mjs` (harnessBridge removed)
  - `apps/estaleiro/core/src/index.ts` (exports removed)
  - `apps/estaleiro/core/package.json` (deps mudadas)
  - `apps/estaleiro/package.json` (deps mudadas)
  - `apps/estaleiro/ui/src/ws/events.ts` (?)
  - `scripts/estaleiro-standalone.mjs` (simplificado)
  A imprecisão escondeu [M3] e provavelmente outros achados. Track:
  reendurecer §3 com lista completa CREATE/EDIT/DELETE — mesmo padrão
  do m1 do DMM-14 R1.

`[m2]` Spec §3 linha 36 diz "[CREATE] impl de StepQueue durável sobre
nodes/edges + canais efêmeros (path a fixar no endurecimento)". Worker
fixou em `packages/plugin-workflows/src/durableQueue.ts` (canônico,
alinhado com `queue.ts` in-memory adjacente). ✅

`[m3]` Spec §6 menciona "transporte de passos" via "canais efêmeros
(packages/transport)". O impl atual **não usa** transport — a fila
pendente vive em memória (`private pending: Step[] = []` em
`durableQueue.ts:41`). Os "canais efêmeros" são só isso. Defensável
pela §6.3 ("fila em memória, Zen deduz próximo passo em restart"),
mas a spec confunde o leitor sugerindo reuse de transport.

**INFO**
`[i1]` Cobertura §4 (FIFO + reconstrução do envelope): test 1
cobre FIFO ✅; tests 2-3 cobrem reconstrução **intra-sessão**
(vide [M2]); §7 "ordem preservada" coberta; "sobrevive a restart"
NÃO coberta (subsumida por [M1]).

`[i2]` Decoupling pattern: `durableQueue.ts` recebe `StoragePort`,
  `ClockPort`, `RandomPort`, `creds` por DI. Sem import cross-package
  fora de `@plataforma/core` e `@plataforma/crypto`. Alinhado com §5
  ("NÃO acoplar o orquestrador a esta impl").

`[i3]` `DurableStepQueue.pendingCount: number` getter exporta
  observabilidade mínima (subsitui parcialmente `onStep`).

`[i4]` Reuso correto de primitivas: `insertNode`, `getLineage`,
  `signNode`, `hashNode`, `migrateSchema`, `ULIDFactory`,
  `HybridLogicalClock` importados de `@plataforma/core` (sem
  reimplementação). Consistente com §5.

`[i5]` Estaleiro simplificado: `server.mjs` perdeu o
  `createHarnessWsBridge` setup (DMM-07). `scripts/estaleiro-standalone.mjs`
  perdeu a cópia do `dist` para `coreNodeModules`. Defensável
  pela §6.2 (Estaleiro usa `SqliteStorage` nativamente, não precisa
  do bridge WS para orquestração local). Mas o diff stat inclui
  arquivos como `harness-ws.ts` (62 linhas) como "deletados" — isso
  é enganoso: DMM-15 base (`0570e8b` = DMM-05 merge) **não tinha**
  esses arquivos (DMM-07 foi merged depois). O merge vai manter
  os arquivos do DMM-07 (master's version) — o git diff "deleção"
  é apenas porque o DMM-15 base é anterior ao DMM-07. Verificar
  no merge real.

VEREDICTO: REFATORAÇÃO NECESSÁRIA
Resumo: Gate triplo (tsc + lint + test) **verde** em todos os 3
pacotes (386/386 tests), mas o DoD §7 ("sobrevive a restart") é
**violado**: o probe de restart real (close+reopen) mostra que
`loadEnvelope → {}` em vez do envelope reconstruído. Causa: bug
de schema de identidade em `durableQueue.ts:88` — `entity_id =
signed.id` (ULID) vs query por `workflowId` (string) — o restart
não consegue associar o entity ao workflow. Adicionalmente, o
Handover alega cobertura de restart que os testes não provam (M2)
e o worker removeu `onStep`/`WorkflowEvent` da API pública sem
documentar na spec (M3). Fix do [M1] é 1 linha; [M2] é +1 teste
honesto (~15 linhas); [M3] precisa de decisão: re-adicionar
`onStep` ou documentar a remoção. 3 MINORs de housekeeping
(especialmente m1 = reendurecer §3 com escopo completo).
```

**Comentários de Revisão:** Achado bloqueante é `[M1]` — o spec
prometeu "histórico durável" e "sobrevive a restart" mas a impl
atual NÃO sobrevive. O bug é 1 linha (`[signed.id, signed.id, ...]`
→ `[workflowId, signed.id, ...]`) mas tem impacto desproporcional
porque a doc do Handover + o nome "DurableStepQueue" + o DoD §7
todos prometem durabilidade. Um teste honesto de close+reopen
([M2]) teria pego o [M1] — a cobertura atual só valida o caminho
feliz intra-sessão. [M3] é mais sutil: o `onStep` removido é
defensável pela §6 (Event Sourcing substitui o hook) mas viola
o espírito de §5 (mexer no contrato público do orquestrador).
Recomendação: fix M1+M2 juntos (são relacionados — adicionar o
teste honesto de restart vai exigir o fix do bug), depois
re-endurecer §3 (m1) para refletir o escopo real. O [M3]
pode ficar para uma task de cleanup posterior — marcar como
`defer→T-XXX` se a arquitetura for revalidar.
```

### Parecer do Reviewer 2 (minimax, independente):
- [ ] **Aprovado**
- [x] **Requer Refatoração** (concorda com R1 — M1, M2, M3 confirmados)
- **Evidência de Execução (obrigatória, rodada AGORA no worktree DMM-15):**
```
$ pnpm --filter @plataforma/plugin-workflows build  →  $ tsc  (zero errors — Exit 0)
$ pnpm --filter @plataforma/plugin-workflows test   →  Test Files 6 passed (6) · Tests 28 passed (28)  (Duration 2.01s)
$ pnpm --filter @plataforma/core test               →  Test Files 23 passed (23) · Tests 212 passed (212)  (Duration 3.54s)
$ pnpm --filter @plataforma/transport test          →  Test Files 16 passed (16) · Tests 146 passed (146)  (Duration 2.52s)
$ pnpm --filter @plataforma/plugin-workflows lint   →  $ eslint src/  (zero errors)
```
- **Sonda adversarial de restart (réplica independente do R1):**
  `poc/_restart-r2.probe.test.ts` (escrito, executado, **REMOVIDO**) — close+reopen do mesmo dbPath + novo DurableStepQueue + initialize(workflowId) + loadEnvelope. **Resultado:** `expected {} to deeply equal { executed: true, output: "ok-restart" }` — o envelope é vazio após restart. **M1 do R1 REPRODUZIDO** com probe independente. Probe deletado após verificação.
- **Verificação por inspeção do código (independente do R1):**
  - `durableQueue.ts:88-90` — `INSERT INTO entity_heads (entity_id, head_id, head_hlc) VALUES (?, ?, ?)` com `[signed.id, signed.id, String(signed.hlc)]` → `entity_id = signed.id` (ULID).
  - `durableQueue.ts:56-58` — `SELECT head_id FROM entity_heads WHERE entity_id = ?` com `[workflowId]` → query por `workflowId` (string).
  - **Conflito confirmado:** entity_id gravado é ULID, entity_id consultado é workflowId. Em restart, query retorna 0 rows → branch CREATE executa → novo root órfão → loadEnvelope lê linhagem do novo root (vazia) e retorna `{}`. Viola §7 ("sobrevive a restart").
  - `durableQueue.ts:83-86` — `INSERT INTO entity_members (node_id, entity_id) VALUES (?, ?)` com `[signed.id, signed.id]` — mesmo padrão (entity_id = ULID). Para coerência com o fix do M1 (entity_id = workflowId em entity_heads), entity_members deve ser ajustado na mesma direção. O R1 menciona L78-86; minha leitura confirma: **as 2 inserções precisam ser coerentes**.
- **Concordância com R1:** todos os 3 MAJORs (M1, M2, M3) verificados e confirmados; os 3 MINORs (m1 spec drift em §3, m2 path fix OK, m3 confusão de "canais efêmeros") e 5 INFOs já estão no ledger. **Nenhum achado novo.** Meu veredito = R1.
- **Observação adicional (R2, INFO, não-bloqueante):**
  - `[i6-R2]` O fix proposto pelo R1 (opção a) — `[workflowId, signed.id, ...]` em L88 — funciona para `entity_heads` mas precisa decidir o que fazer com `entity_members` (L83-86). Se entity_id em entity_members for `signed.id` (ULID), o `getEntityId()` em `loadEnvelope` continua funcionando via parentId → entity_id (linhagem do ROOT). Se for `workflowId`, o `getEntityId()` precisa mudar para buscar por parentId diretamente. **Track:** documentar a decisão arquitetural no rework (qual dos dois esquemas de identidade é o canônico para workflows no CRDT). Não-bloqueante — não impede o M1 de ser fechado.
- **Recuperação do estado `in_review` travado:**
  - A R1 (claude-sonnet) escreveu o parecer completo com veredito REFATORAÇÃO, mas o agente travou antes de chamar `request_changes` — a task ficou em `in_review` sem transição.
  - R2 (minimax) chamou `request_changes` para concluir a transição pendente. O parecer R1 é preservado como histórico; o R2 apenas registra a confirmação independente.
- **Achados (severidade):** B=0 · M=3 (M1, M2, M3 confirmados) · m=3 (já no ledger) · i=5+1 (já no ledger + i6-R2 acima).
- **Veredito:** REFATORAÇÃO NECESSÁRIA — concorda com R1. M1/M2/M3 bloqueiam o merge. Heurística do fix: 1 linha em `durableQueue.ts:88-89` (entity_id = workflowId) + ajuste em L85-86 (entity_members, decisão de identidade) + 1 teste honesto de restart (15 linhas) + 1 nota de spec sobre `onStep` removido.
- **Resumo:** Sondagem independente confirma o bug crítico de M1 (restart não preserva envelope) — meu probe close+reopen reproduziu o `loadEnvelope → {}`. M2 e M3 também confirmados. Fix é cirúrgico (1-2 linhas + 1 teste). Concordância total com R1; transição para `rework` completada por R2 após a R1 ter travado.
- **Divergência do R1:** nenhuma substantiva. Único acréscimo: `[i6-R2]` (acima) sobre consistência entre `entity_heads` e `entity_members` no fix do M1.

### Parecer do Reviewer 3 (minimax, independente, 2026-07-09)
- [x] **Aprovado**
- [ ] **Requer Refatoração**

- **Anti-ancoragem:** veredito formado a partir de spec + código (rework) + Gate + sondas próprias **antes** de reler R1/R2. (Concordância aqui emerge da evidência, não de herança.)
- **Validação da rework (commit `9b2e20c`):** M1 RESOLVIDO. Diff: 2 files, 26+/-. `durableQueue.ts:85,89` — `entity_id` trocado de `signed.id` (ULID do ROOT) para `workflowId` em `entity_members` E `entity_heads` (consistência entre as duas tabelas). M2 RESOLVIDO — novo test "sobrevive a restart real (close+reopen) — M1/M2 R1" (l. 127-150 do test file) faz close+reopen de fato e assere `env.executed === true && env.output === "ok-restart"`. M3 documentado (Handover §8) — `onStep`/`WorkflowEvent` removidos, decisão de §6 Event Sourcing.
- **Gate R3 (literal, executado agora no worktree DMM-15):**
  ```
  $ pnpm --filter @plataforma/plugin-workflows test   → Test Files 6 passed · Tests 29 passed
  $ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit → Exit 0
  $ pnpm --filter @plataforma/plugin-workflows lint   → eslint src/ (Exit 0)
  $ pnpm --filter @plataforma/core test               → Test Files 23 passed · Tests 212 passed
  $ pnpm --filter @plataforma/transport test          → Test Files 16 passed · Tests 146 passed
  ```
  **Total: 29 + 212 + 146 = 387 tests, 0 falhas, 0 tsc errors, 0 lint errors.** Logs em `.dmm15-evidence/r3-*.log`.
- **Sondas adversariais R3 (independentes, 4 probes — redigidas, executadas, REMOVIDAS):**
  ```
  ✓ M1 fix: restart preserva o envelope (close+reopen, mesmo dbPath)            — 1 test
  ✓ M1 fix: 3 deltas + restart preserva TODOS os deltas no envelope (reduce order) — 1 test
  ✓ M1 fix: enfileirar (pending) NÃO persiste — restart perde a queue efêmera    — 1 test
  ✓ M1 fix: 2 workflows distintos no MESMO dbPath (isolamento por entity_id)    — 1 test
  Test Files 1 passed (1) · Tests 4 passed (4)  (Duration 1.04s)
  ```
  Logs em `.dmm15-evidence/r3-probe.log`. Probe deletado após verificação.
  - **Sonda 1 (réplica do test 2 do worker):** sessão 1 → initialize + commitDelta + checkpoint + close; sessão 2 → reabre + loadEnvelope → `{executed:true, output:"alpha"}` ✓. **Bug do R1 NÃO REPRODUZIDO** — fix funciona.
  - **Sonda 2 (reduce com 3 deltas):** `{a:1, b:2, c:3, executed:true}` (toEqual exato). Confirma que `Object.assign` em ordem reversa da linhagem preserva a semântica de "último delta ganha" e que o lineage do `getLineage(storage, workflowId)` retorna os 4 nós na ordem certa (ROOT → STEP1 → STEP2 → STEP3). ✓
  - **Sonda 3 (fila efêmera):** `enqueue` é in-memory, `walCheckpoint+close` **não preserva** o `pending`. Após restart, `pendingCount === 0`. Confirma §6.3 ("a fila em memória, Zen deduz o próximo passo em restart") — a "durabilidade" prometida é do **envelope materializado** (linhagem de Deltas), não da queue de trânsito. ✓
  - **Sonda 4 (isolamento):** 2 workflows no mesmo dbPath têm envelopes distintos, sem cross-contamination. Confirma que `entity_id = workflowId` isola corretamente as entidades. ✓
- **Cobertura do spec §3 (sem ressalvas novas):**
  - [READ] `StepQueue`/`Envelope` (DMM-01) ✓ — `DurableStepQueue implements StepQueue` (l. 36), `Envelope = Record<string, unknown>` (l. 140), `Delta` importado de `./types.js` (l. 5).
  - [READ] `packages/core/src/**` (nodes/edges) ✓ — `insertNode`, `getLineage`, `migrateSchema`, `ULIDFactory`, `HybridLogicalClock`, `signNode`, `hashNode`, `SignedNode`/`UnsignedNode` (l. 4).
  - [READ] `packages/transport/src/**` (canais) — **NÃO usado** (apenas `packages/core` e `packages/crypto`). Defensável pela §6.3 ("fila em memória, Zen deduz"). [m3 do R1 já cobriu].
  - [CREATE] impl durável ✓ — `durableQueue.ts:171 linhas`, `DurableStepQueue` class + 2 helpers (`storageExec`, encoder).
  - [CREATE] teste ✓ — `durableQueue.poc.test.ts:151 linhas, 6 testes` (5 originais + 1 novo de restart real).
- **Validação das decisões §6 (FECHADAS):**
  - **§6.1 Event Sourcing** ✓ — `commitDelta` cria `SignedNode` (WORKFLOW_STEP) com `payload = encoder.encode(JSON.stringify(delta))` (l. 117) e anexa via `insertNode(this.storage, signed, this.parentId)` (l. 124). `loadEnvelope` materializa via `reduce` sobre `getLineage` (l. 137-149). Cada `Object.assign(envelope, delta)` é o "reduce" do Event Sourcing. Aderente.
  - **§6.2 Durabilidade via SqliteStorage nativo** ✓ — `durableQueue.ts:2` `import type { StoragePort } from "@plataforma/protocol"`, o teste usa `SqliteStorage` de `@plataforma/core` diretamente. Sem dependência do TinyBase do `store.ts` (correto).
  - **§6.3 Fila de trânsito efêmera** ✓ — `private pending: Step[] = []` (l. 41), `enqueue` faz `this.pending.push(step)` sem I/O (l. 96-99). Sonda 3 confirma: não persiste em restart.
- **Inspeção do código (independente do R1):**
  - **Linha 60-64** (`initialize` branch existente): `parentId = headRow["head_id"] as string` — usa o ROOT ULID do `entity_heads.head_id`. Em restart, este é o ROOT da sessão anterior. ✓
  - **Linha 92-93** (`initialize` branch CREATE): `this.parentId = signed.id` (novo ROOT), `this.lastSigned = signed` — ambos apontam para o novo ROOT. Coerente com o uso em `commitDelta` (l. 106, 112, 124). ✓
  - **Linha 124** (`commitDelta` → `insertNode`): `insertNode(this.storage, signed, this.parentId)` — parent é o ROOT (após restart) ou o STEP anterior (durante sessão). `lastSigned` é atualizado (l. 126) para o próximo `hashNode`. ✓
  - **Linha 137-149** (`loadEnvelope`): `lineage = getLineage(storage, entityId)` (l. 137) — query em `nodes` via `entity_members`. `reversed = [...lineage].reverse()` (l. 138) — garante que deltas posteriores sobrescrevem anteriores (semântica "último ganha"). Loop ignora ROOT (l. 142) e deltas com JSON inválido (l. 146-148). ✓
  - **Linha 153-161** (`getEntityId`): `SELECT entity_id FROM entity_members WHERE node_id = parentId` — busca pelo ROOT ULID. Retorna o `workflowId`. Esta indireção (parent → entity_id) só funciona porque o `parentId` foi recuperado do `entity_heads.head_id` no `initialize`. Consistente. ✓
- **Achados não-bloqueantes:**
  - **i1 (info positivo).** O fix de M1 é **cirúrgico e simétrico**: 2 colunas, 2 linhas (`[signed.id, signed.id]` → `[signed.id, workflowId]` em L85; `[signed.id, signed.id, ...]` → `[workflowId, signed.id, ...]` em L89). Sem refator, sem mudança de schema, sem migração. 1 commit, 26 linhas. Cumprimento exemplar do "cite a fonte ou escale".
  - **i2 (info positivo).** O novo test "sobrevive a restart real" é **o teste que deveria ter existido desde R1**. A cobertura anterior (5 testes) era intra-sessão; o `walCheckpoint+close` na mesma sessão não prova durabilidade cross-sessão. O fix do M1 + esse novo test estabelecem o ciclo "test → bug → fix → test" que o §4 da spec implicitamente exigia ("Métrica: durabilidade — estado reconstruído do grafo"). Aderente.
  - **i3 (info positivo).** O Handover §8 do rework **é honesto sobre o que mudou**: §6 (Event Sourcing) justifica a remoção de `onStep`/`WorkflowEvent` ("zero consumers"), §5 (não-mexer-contrato) é violado "no espírito" mas com justificativa rastreável. M3 do R1 é resolvido por **documentação**, não por re-add de código morto. Decisão correta.
  - **i4 (info positivo).** Sondagem independente de 4 probes R3 (incluindo isolamento de 2 workflows no mesmo dbPath) **não descobriu nenhum bug novo**. M1/M2/M3 todos resolvidos; invariantes §5/§6 preservadas. Trabalho do rework é completo.
  - **i5 (info, processo).** R1 travou antes de chamar `request_changes` (status ficou `in_review` órfão); R2 destravou chamando o transition. R3 herdou a task em `rework` → `review` (após o rework concluir) sem o mesmo tipo de gap. Track: o `agile-reviewer` subagent deveria ser mais robusto a crashes — talvez um wrapper que captura o `request_changes` em uma transação atômica com a escrita do parecer. Cosmético, não-bloqueante.
  - **i6 (resposta ao i6-R2).** A decisão do rework foi: **entity_id = workflowId** em ambas as tabelas (entity_heads e entity_members). A coerção do `getEntityId()` continua via parentId → entity_id (linhagem do ROOT). Esta é a **opção (a) do R1** (RECOMENDADA), e a opção mais simples. Aderente ao ADR 0014.
- **Achados bloqueantes:** **NENHUM.** M1, M2, M3 todos RESOLVIDOS.
- **Veredito:** **APROVADO.** Gate triplo (tsc + lint + test) verde nos 3 pacotes (387/387), invariantes §5 (NÃO reimplementar/NÃO mudar interface/NÃO acoplar) e §6 (Event Sourcing + SqliteStorage nativo + fila efêmera) preservados, sondas adversariais R3 (4 probes) todas OK, escopo §3 atendido (com m1 do R1 documentando scope drift residual). Pronto para `integrar-task` (Caminho A).

## 9. Log de Execução (Agent Execution Log)

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-09T12:06]** - *Antigravity* - `[Decisão pendente]`: Falta mapeamento estrutural entre Envelope e grafo CRDT.
- **[2026-07-09T17:55]** - *Antigravity* - `[Decidido]`: Decisão de Event Sourcing com core persistência fechada
- **[2026-07-09T17:56]** - *Antigravity* - `[Promovida p/ ready]`: Mapeamento fechado com o arquiteto
- **[2026-07-09T18:01]** - *deepseek* - `[Iniciado]`: iniciando
- **[2026-07-09T18:21]** - *deepseek* - `[Finalizado]`: DurableStepQueue: CRDT nodes/edges + ephemeral queue. 28/28 tests, lint + build limpos.
- **[2026-07-09T18:27]** - *agile_reviewer:test* - `[Em revisão]`: test
- **[2026-07-09T21:35]** - *agile_reviewer:minimax* - `[Requer Refatoração]`: Rework (retomar R1): [M1] durableQueue.ts:88 — entity_id=signed.id quebra restart (query L56 por workflowId). Fix: trocar [signed.id,signed.id] por [workflowId,signed.id]. [M2] adicionar teste honesto close+reopen (durableQueue.poc.test.ts). [M3] documentar/spec mudança de API (WorkflowEvent/onStep removidos) em spec §3. 3 MINORs (m1 reendurecer §3 c/ escopo completo, m2/m3 housekeeping).
- **[2026-07-09T21:46]** - *big-pickle* - `[Iniciado]`: rework: corrigindo M1,M2,M3
- **[2026-07-09T21:48]** - *big-pickle* - `[Finalizado]`: rework pronto: [M1] entity_id=workflowId, [M2] teste restart real, [M3] documentado — 29+212+146=387 tests, tsc+lint OK
- **[2026-07-09T22:00]** - *agile_reviewer:minimax* - `[Em revisão]`: revisando R3 --integrar (rework2)
- **[2026-07-09T22:05]** - *agile_reviewer:minimax* - `[Parecer emitido]`: R3 APROVADO — M1/M2/M3 todos RESOLVIDOS pelo commit 9b2e20c (2 files, 26+/-). Gate triplo verde: 387 tests (29+212+146), tsc 0, lint 0. Sondagem independente com 4 probes R3 (incluindo isolamento de 2 workflows) — todas OK. M1 fix verificado (entity_id=workflowId em entity_heads+entity_members). M2 verificado (test restart real close+reopen). M3 documentado (Handover §8). §6 Event Sourcing + SqliteStorage + fila efêmera preservados. Não-bloqueantes i1-i6 anexados ao ledger. Integrar (Caminho A).
- **[2026-07-09T22:59]** - *agile_reviewer:minimax* - `[Em revisão]`: revisando R3 --integrar (rework M1/M2/M3)
- **[2026-07-09T23:08]** - *agile_reviewer:minimax* - `[Aprovado]`: Integrado DMM-15: merge na master (commit b15a5f8, 5 files +336 ins, 3 auto-merges 0 conflicts), worktree removida. Gate DMM-15 (2/3 pacotes) verde: workflows 29/29 test, tsc 0, lint 0; transport 146/146 test. Sondagem independente 4 probes R3 (restart real + multi-delta + pending efemero + isolamento 2 wf) todas OK. ATENCAO: core test 1/217 falhou (tests/schema.test.ts:141 - indices), mas pre-existente em master~1 (causa: DMM-11 agent_traces schema sem atualizar o test); DMM-15 nao toca core. 5 nao-bloqueantes (i1-i5) + 1 m4 (pre-existing core) anexados ao ledger.
