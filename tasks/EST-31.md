---
id: EST-31
title: "Testes de integração do host: API de tasks + WebSocket"
status: draft:triaged
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-20", "EST-22"]
blocks: ["EST-25", "EST-33"]
capacity_target: sonnet
---

# EST-31 · Integração do host

## 1. Objetivo
Testar o processo real do Estaleiro sem browser: HTTP de tasks, transição via TaskService e publicação/recepção de eventos WS.

## 2. Contexto RAG
- `tasks/EST-20.md` — lifecycle WS existente.
- `apps/estaleiro/server.mjs` e bootstrap do EST-22.
- `packages/plugin-tasks/src/service.ts`.

## 3. Escopo
- **[CREATE]** `apps/estaleiro/tests/integration/task-api.test.ts`.
- **[UPDATE]** script `test:integration` de `apps/estaleiro/package.json` somente se necessário.
- Reusar `startServer`/`stopServer`; não duplicar servidor.

## 4. Testes
Vitest + `ws`: dois clientes, list/get task, transição válida, transição rejeitada, evento `task:updated`, teardown e porta livre.

## 5. DoD
Integração roda em processo real e falha se o caminho UI/API/WS quebrar.

## 6. Feedback
Não usar mock do `server.mjs`; mocks ficam apenas nas dependências externas.

## 7. Verificação
`pnpm --filter @plataforma/estaleiro test:integration` e `pnpm --filter @plataforma/estaleiro lint`.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
