---
id: EST-21
title: "plugin-tasks: StorageBackend durável + exports públicos"
status: ready
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
Preencher com evidência literal dos três comandos e parecer do reviewer.

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:02]** - *Antigravity* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
