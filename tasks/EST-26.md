---
id: EST-26
title: "Workflow durável: persistência integrada ao loop e restart"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-15", "EST-24b"]
blocks: ["EST-25"]
capacity_target: sonnet
---

# EST-26 · Workflow durável

## 1. Objetivo
Integrar `DurableStepQueue` ao ciclo real do orquestrador, reidratar corretamente o último nó assinado após restart e provar retomada sem perder Deltas.

## 2. Contexto RAG
- `packages/plugin-workflows/src/durableQueue.ts`.
- `packages/plugin-workflows/src/orchestrator.ts`.
- `packages/plugin-workflows/poc/durableQueue.poc.test.ts`.
- ADR-0014 e DMM-15.

## 3. Escopo
- **[UPDATE]** queue/orchestrator.
- **[CREATE]** testes de commit após reopen, crash entre passos e isolamento de workflows.
- Não alterar schema do core fora da necessidade comprovada.

## 4. Testes
Unitários do queue + integração SQLite com restart e execução que materializa Envelope depois de reabrir.

## 5. DoD
Nenhum Delta executado fica apenas em memória quando a fila durável está selecionada; restart é idempotente.

## 6. Feedback
Preservar a fila efêmera para o modo standalone de teste.

## 7. Verificação
`pnpm --filter @plataforma/plugin-workflows build`, `test`, `lint`.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
