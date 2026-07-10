---
id: EST-32
title: "Testes de integração do runtime DMM + harness stub"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-24a", "EST-24b"]
blocks: ["EST-25", "EST-33"]
capacity_target: sonnet
---

# EST-32 · Integração runtime DMM

## 1. Objetivo
Provar a composição real do workflow DMM no host usando provider/harness stubados, mas registry, queue, handlers, Envelope e bridge reais.

## 2. Contexto RAG
- ADR-0013/0014.
- `packages/plugin-workflows/src/orchestrator.ts`, `templates`, `nodes`.
- EST-24a/24b.

## 3. Escopo
- **[CREATE]** `apps/estaleiro/core/tests/workflow-runtime.integration.test.ts`.
- **[UPDATE]** somente adaptadores necessários para injeção de stub.

## 4. Testes
Ingress→Explorer/Editor→terminal, Delta acumulado, evento antes/depois, handler ausente, erro do harness, maxSteps e cancelamento.

## 5. DoD
O teste atravessa pelo menos dois plugins reais e não chama rede/modelo real.

## 6. Feedback
Não transformar o stub em uma segunda implementação do runner.

## 7. Verificação
Gates do `estaleiro-core`, `plugin-workflows`, `plugin-agent-harness` e `plugin-fs-tools`.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
