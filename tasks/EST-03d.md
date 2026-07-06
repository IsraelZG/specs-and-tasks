---
id: EST-03d
title: "plugin-tasks — API do serviço (consumível pelo host EST-02 e UI EST-14)"
status: ready
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-03a", "EST-03b", "EST-03c"]
blocks: []
capacity_target: sonnet
---

# EST-03d · plugin-tasks — API do serviço

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-tasks/src/service.*`.
- **Consumido por:** EST-02 host (chamadas internas) e EST-14 UI (via WebSocket).

## 1. Objetivo
Implementar a **API pública** do plugin-tasks, consumível pelo host (EST-02, que media chamadas
de outros plugins) e pela UI (EST-14, via WebSocket). Encapsula o schema (EST-03a), a máquina
de estados (EST-03b) e as guardas (EST-03c) numa fachada com métodos por verbo.

### Contratos
```ts
// --- packages/plugin-tasks/src/service.ts
import type { Task, LogEntry, ReviewVerdict } from "./schema";
import type { TransitionVerb } from "./schema";

export interface TaskServicePort {
  // CRUD
  getTask(id: string): Promise<Task | null>;
  listTasks(filter?: { status?: string; prefix?: string }): Promise<Task[]>;

  // Transições (delega à state machine + guards)
  transition(taskId: string, verb: TransitionVerb, actor: string, message?: string): Promise<Task>;
  // Exceptions: TransitionError (verbo inválido), GuardError (guarda bloqueante)

  // Log (Seção 9)
  getLog(taskId: string): Promise<LogEntry[]>;

  // Parecer (Seção 8)
  submitVerdict(taskId: string, verdict: ReviewVerdict): Promise<void>;
}

// --- Factory: host injeta StorageBackend, o service usa schema + stateMachine + guards
export function createTaskService(storage: StorageBackend): TaskServicePort;
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (B1 — schema completo; B3 — guardas).
- [x] `EST-03a` — tipos do schema.
- [x] `EST-03b` — máquina de estados.
- [x] `EST-03c` — guardas de código.
- [x] `EST-02` — host que consumirá esta API.
- [x] `EST-14` — frontend que consumirá esta API.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-tasks/src/service.ts` — fachada pública
- **[CREATE]** `packages/plugin-tasks/tests/service.test.ts` — testes de integração

## 4. Estratégia de Testes
- [x] **Framework:** vitest (mocks de schema, stateMachine, guards).
- [x] **Casos:**
  1. `getTask` — retorna task existente.
  2. `listTasks` — filtra por status.
  3. `transition` — delega à stateMachine + guards, retorna task atualizada.
  4. `transition` com guarda bloqueante → propaga `GuardError`.
  5. `transition` com verbo inválido → propaga `TransitionError`.
  6. `getLog` — retorna entradas do log.
  7. `submitVerdict` — escreve na seção 8.

## 5. Instruções de Execução
1. Implementar `TaskServicePort` como fachada.
2. Service recebe `StorageBackend` injetado (interface de persistência, implementação posterior).
3. Testar com mocks das dependências.
4. Gate → §8.

## 6. Feedback de Especificação
- **Nenhuma decisão em aberto.** Todo contrato derivado de:
  - Schema ← EST-03a
  - Máquina de estados ← EST-03b
  - Guardas ← EST-03c
- `capacity_target: sonnet` — coordenação entre 3 subsistemas, edge cases de orquestração.

## 7. Definition of Done (DoD)

### Gate de Evidência
```bash
pnpm --filter @plataforma/plugin-tasks build
pnpm --filter @plataforma/plugin-tasks test
```

### Checklist
- [ ] `TaskServicePort` com CRUD + transições + log + veredito?
- [ ] Transição inválida/guarda bloqueante propaga erro?
- [ ] 7 casos de teste verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:54]** - *deepseek* - `[Triado]`: triado — service API, capacity=sonnet, depende de EST-03a/b/c (triaged)
- **[2026-07-06T12:55]** - *deepseek* - `[Endurecido]`: endureceu spec — service API fachada, derivado EST-03a/b/c contracts, capacity=sonnet
- **[2026-07-06T12:55]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
