---
id: EST-22
title: "Composition root do Estaleiro: TaskService + API HTTP + WS"
status: draft:triaged
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-20", "EST-21"]
blocks: ["EST-23", "EST-24a", "EST-31"]
capacity_target: sonnet
---

# EST-22 · Composition root do Estaleiro

## 0. Ambiente
Node.js 20+, pnpm, servidor HTTP/WS existente em `apps/estaleiro`.

## 1. Objetivo
Criar o bootstrap real do Estaleiro: storage de tasks, `TaskService`, portas do host e API mínima para a UI. O processo deve listar/ler tasks, executar transições autorizadas e publicar `task:updated` no mesmo canal WS.

## 2. Contexto RAG
- `docs/rfcs/rfc-018-estaleiro.md` — B1/B3/B6/F3.
- `apps/estaleiro/server.mjs`, `apps/estaleiro/core/src/index.ts`.
- `packages/plugin-tasks/src/service.ts`.

## 3. Escopo
- **[CREATE]** `apps/estaleiro/core/src/bootstrap.ts`.
- **[UPDATE]** `apps/estaleiro/server.mjs` para usar `startServer`/`stopServer` e rotas de tasks.
- **[CREATE]** `apps/estaleiro/core/tests/bootstrap.test.ts`.
- **[READ]** EST-20; preservar o contrato `/ws`.

## 4. Testes
Unitários do bootstrap com storage fake e testes de integração em EST-31 para HTTP+WS reais. Cobrir 404, transição inválida, guarda bloqueante, evento emitido e teardown da porta.

## 5. Instruções
1. Isolar inicialização para permitir testes sem processo pendurado.
2. Não duplicar state machine no servidor.
3. Propagar erros de domínio como respostas HTTP estáveis.
4. O actor recebido deve respeitar a guarda de identidade.

## 6. Decisões
Endpoints e payloads devem ser fixados no endurecimento antes do worker; não inventar um segundo protocolo.

## 7. DoD
Composition root consumível por UI e dispatcher; servidor inicia/paralisa deterministicamente; build/test/lint do core e app verdes.

## 8. Handover e revisão
Colar evidência literal e descrever o caminho HTTP→service→WS.

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
