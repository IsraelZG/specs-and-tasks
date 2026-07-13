---
id: EST-21
title: "plugin-tasks: StorageBackend durável + exports públicos"
status: done
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-03", "DMM-15"]
blocks: ["EST-22"]
capacity_target: sonnet
---

# EST-21 · plugin-tasks: StorageBackend durável + exports públicos

## 0. Ambiente
Node.js 20+, pnpm, Vitest, SQLite já usado por `@plataforma/core`.

## 1. Objetivo
Entregar um `StorageBackend` DB-first para `createTaskService`, reutilizando o storage SQLite existente, com CRUD, filtros por status/prefixo e persistência do log/veredito. Exportar a fachada pública do plugin pela raiz do pacote.

## 2. Contexto RAG
- `docs/rfcs/rfc-018-estaleiro.md` — decisão B1, tasks DB-first.
- `packages/plugin-tasks/src/service.ts`, `schema.ts`, `stateMachine.ts`.
- `packages/core/src/sqliteStorage.ts` e `packages/plugin-workflows/src/durableQueue.ts`.

## 3. Escopo
- **[CREATE]** `packages/plugin-tasks/src/storage/sqlite.ts`
  - Assinatura: `export function createSqliteStorageBackend(db: import("better-sqlite3").Database): import("../service.js").StorageBackend` *(depende da interface de service.ts)*.
  - Implementa `getTask`, `listTasks`, `saveTask` persistindo JSON.
- **[UPDATE]** `packages/plugin-tasks/src/index.ts`
  - Adicionar: `export { createSqliteStorageBackend } from "./storage/sqlite.js";` e tipos públicos do plugin.
- **[CREATE]** `packages/plugin-tasks/tests/storage.test.ts`
  - O test runner deve mockar ou injetar o SQLite real do `@plataforma/core`.

## 4. Testes
Framework: `vitest` em Node.js (usando `better-sqlite3` in-memory `:memory:`). Casos enumerados:
1. Deve criar e salvar uma nova Task, persistindo `section8_handover` e `section9_log`.
2. Deve recuperar uma Task corretamente com `getTask(id)`.
3. Deve listar tasks filtrando por `status` exato (`listTasks({ status: 'ready' })`).
4. Deve listar tasks filtrando por prefixo de ID (`listTasks({ prefix: 'EST-' })`).
5. Alteração de propriedades (update) no DB.

## 5. Instruções
1. Reutilizar as portas/SQLite existentes.
2. Persistir Task sem perder campos `section8_*` e `section9_log`.
3. Expor `createTaskService` e os tipos necessários pela entrada pública.
4. Não alterar a máquina de estados nesta task.

## 6. Decisões
Se o storage atual não suportar a consulta necessária, pausar e registrar a decisão; não introduzir ORM.

## 7. DoD
- Adapter durável usado por um caller de produção futuro.
- Export público verificável por import real.

### Verificação Automática
- `pnpm --filter @plataforma/plugin-tasks build`
- `pnpm --filter @plataforma/plugin-tasks test`
- `pnpm --filter @plataforma/plugin-tasks lint`

> **Gate de Evidência:** Cole a saída literal (Exit Code 0) dos comandos acima na Seção 8.

## 8. Handover e revisão

### Evidência do Gate

**`pnpm --filter @plataforma/plugin-tasks build`:**
```
$ tsc
```
Exit code: 0

**`pnpm --filter @plataforma/plugin-tasks test`:**
```
$ vitest run

 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/EST-21/packages/plugin-tasks

 ✓ tests/schema.test.ts (5 tests) 4ms
 ✓ tests/stateMachine.test.ts (7 tests) 4ms
 ✓ tests/guards.test.ts (22 tests) 6ms
 ✓ tests/service.test.ts (14 tests) 7ms
 ✓ tests/storage.test.ts (6 tests) 45ms
 ✓ tests/parser.test.ts (6 tests) 17ms
 ✓ tests/runner.test.ts (3 tests) 537ms
 ✓ tests/validate.test.ts (4 tests) 1158ms

 Test Files  8 passed (8)
      Tests  67 passed (67)
   Start at  11:12:53
   Duration  2.05s
```
Exit code: 0

**`pnpm --filter @plataforma/plugin-tasks lint`:**
```
$ eslint src/ scripts/
```
Exit code: 0

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**

Comandos reexecutados no worktree `C:/Dev2026/.superapp-worktrees/EST-21` (branch `task/EST-21`, commit `4d1344c`):

```
$ pnpm --filter @plataforma/plugin-tasks build
$ tsc
```
Exit code: 0 — sem erros TS.

```
$ pnpm --filter @plataforma/plugin-tasks test
 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/EST-21/packages/plugin-tasks

 ✓ tests/schema.test.ts (5 tests) 4ms
 ✓ tests/guards.test.ts (22 tests) 6ms
 ✓ tests/service.test.ts (14 tests) 8ms
 ✓ tests/storage.test.ts (6 tests) 12ms
 ✓ tests/parser.test.ts (6 tests) 14ms
 ✓ tests/stateMachine.test.ts (7 tests) 4ms
 ✓ tests/runner.test.ts (3 tests) 950ms
 ✓ tests/validate.test.ts (4 tests) 1546ms

 Test Files  8 passed (8)
      Tests  67 passed (67)
   Duration  2.09s
```
Exit code: 0 — 67/67 passou.

```
$ pnpm --filter @plataforma/plugin-tasks lint
$ eslint src/ scripts/
```
Exit code: 0 — sem erros/warnings.

- **Arquivos auditados (4):** `packages/plugin-tasks/src/storage/sqlite.ts` (CREATE), `packages/plugin-tasks/src/index.ts` (UPDATE), `packages/plugin-tasks/tests/storage.test.ts` (CREATE), `packages/plugin-tasks/package.json` (UPDATE). Diff vs. `HEAD~1` confere com o escopo declarado na §3 (mais `pnpm-lock.yaml`, esperado).
- **Sondas adversariais (5+3, depois removidas):** rodadas em arquivos `*.probe.test.ts` transitórios:
  - listTasks sem filtro → retorna todas
  - prefix `""` (degenerate) → todas (string.startsWith("")=true; comportamento seguro, documentável)
  - Caracteres especiais (emoji, aspas, `\n`, `\t`) → serialização JSON ok, roundtrip fiel
  - getTask de id inexistente → null sem throw
  - Upsert preserva id e reflete mudança
  - Exports `createSqliteStorageBackend`/`createTaskService`/`Task` tipagem → todos visíveis via `import * as` real do `src/index.ts`
  - Todas as 8 sondas passaram. Removidas após evidência.
- **Conformidade com DoD:** §7.a "Adapter durável usado por um caller de produção futuro" — a primitive é a foundation; o caller de produção vem em task futura (EST-22 ou integração downstream). §7.b "Export público verificável por import real" — verificado por sonda `exports.probe.test.ts`.

- **Comentários de Revisão:**
  - **Sem BLOCKERs/MAJORs/MINORs.** Assinatura `createSqliteStorageBackend(db: Database): StorageBackend` casa exatamente com a spec §3. `getTask`/`listTasks` (com filtros `status` e `prefix`)/`saveTask` (upsert) implementam a interface `StorageBackend` de `service.ts:19-23`. Persistência JSON é inteira (incl. `section8_handover` e `section9_log`); caso de teste 1 cobre roundtrip dos campos exigidos.
  - 5 casos de teste da spec §4 estão todos presentes em `storage.test.ts` (numerados 1-5) + 1 edge case bônus (getTask null).
  - Os tipos públicos exportados em `index.ts` (Task, TaskStatus, TransitionVerb, LogEntry, ReviewVerdict, TaskServicePort, StorageBackend) + funções (createTaskService, createSqliteStorageBackend) satisfazem §3 e DoD 7b.

- **INFO (1):** Tensão menor na spec — §2 diz "reutilizar SQLite existente de `@plataforma/core`" e §5 instrução 1 diz "Reutilizar as portas/SQLite existentes", mas §3 ao mesmo tempo fixa a assinatura como `db: import("better-sqlite3").Database`, o que naturalmente leva a adicionar `better-sqlite3` como dep direta (e o pacote removeu o workspace dep `@plataforma/estaleiro-core`, que era legado sem imports no pacote). O worker escolheu a interpretação literal da assinatura — defensável e o que a spec literalmente prescreve. Se a intenção real era forçar consumo via `@plataforma/core` (wrapper que re-exporta o tipo), isso é decisão de arquiteto, não defeito. Não impede aprovação.

- **Gate de segurança/acoplamento (§5.1):** não se aplica — `createSqliteStorageBackend` é primitive de persistência, não de autorização/privacidade/controle de acesso. DoD 7a reconhece que o caller de produção virá em task posterior; isso está alinhado com o gate (primitiva ainda não consumida, mas o spec não exige caller nesta task).
- **Acoplamento/ciclo:** não introduziu import cruzando pacote (apenas `better-sqlite3` externo e tipos internos do próprio plugin).

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:02]** - *Antigravity* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
- **[2026-07-10T14:10]** - *big-pickle* - `[Iniciado]`: iniciando
- **[2026-07-10T14:14]** - *big-pickle* - `[Finalizado]`: StorageBackend SQLite + exports públicos. Gate: build OK, 67 tests passed, lint clean
- **[2026-07-10T14:23]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando EST-21 (qa-review --integrar)
- **[2026-07-10T14:44]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit 16c173e, 5 files +199/-8), worktree removida, Gate verde (build tsc OK, 67/67 tests passed, lint clean). 1 não-bloqueante (INFO sobre tensão spec 'reuse core' vs. assinatura literal 'better-sqlite3.Database') → ledger de pendências.
