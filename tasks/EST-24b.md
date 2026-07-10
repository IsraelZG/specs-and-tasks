---
id: EST-24b
title: "Composição do workflow DMM: registry + handlers reais + execução"
status: draft:triaged
complexity: 4
parent_task: "EST-24"
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14", "EST-24a", "DMM-01", "DMM-06", "DMM-14"]
blocks: ["EST-25", "EST-32"]
capacity_target: sonnet
---

# EST-24b · Workflow DMM real

## 1. Objetivo
Registrar handlers reais para Ingress, Architect, Explorer, Editor, Judge e Optimizer, carregar o template JDM e expor uma operação de execução que devolva Envelope/Delta e eventos.

## 2. Contexto RAG
- `packages/plugin-workflows/src/templates` e `src/nodes`.
- `packages/plugin-workflows/src/registry-resolver.ts`.
- `packages/core/src/pluginRegistry.ts`.
- `docs/adr/0014-contrato-orquestrador-declarativo.md`.

## 3. Escopo
- **[CREATE]** composição de handlers no core do Estaleiro.
- **[UPDATE]** endpoint/serviço do EST-22 para iniciar execução.
- **[CREATE]** teste de integração em EST-32; não chamar provider real.

## 4. Testes
Grafo padrão completo, handler ausente, terminal, maxSteps, propagação de Delta e stream de eventos.

## 5. DoD
Uma execução real do `runWorkflow` passa por pelo menos dois plugins distintos e chega ao host/WS.

## 6. Feedback
Não acoplar nós ao servidor; usar DI/registry.

## 7. Verificação
`pnpm --filter @plataforma/plugin-workflows build`, `test`, `lint` e gates do core.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
