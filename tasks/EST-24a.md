---
id: EST-24a
title: "Agent runtime factory: provider + tools + harness + RunService"
status: draft:triaged
complexity: 3
parent_task: "EST-24"
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-05", "EST-06", "EST-10", "EST-22"]
blocks: ["EST-24b", "EST-32"]
capacity_target: sonnet
---

# EST-24a · Agent runtime factory

## 1. Objetivo
Criar a composição injetável que resolve modelo via `plugin-providers`, cria `PluginTools` mediadas e encaminha `runner` pelo `RunService`/`harnessBridge`.

## 2. Contexto RAG
- `packages/plugin-providers/src/registry.ts`.
- `packages/plugin-fs-tools/src/index.ts`.
- `packages/plugin-agent-harness/src/runner.ts`.
- `apps/estaleiro/core/src/run-service.ts` e portas do host.

## 3. Escopo
- **[CREATE]** factory no core do Estaleiro e testes unitários.
- **[UPDATE]** bootstrap do EST-22 somente para registrar a factory.
- Não alterar contratos públicos dos plugins base.

## 4. Testes
Stubs de provider, tools, runner e bridge; verificar propagação de abort, timeout, eventos e cwd.

## 5. DoD
Factory usada por caller real e pronta para EST-24b; build/test/lint verdes.

## 6. Feedback
Se `resolveModel` não produzir `LanguageModel` compatível, pausar e registrar decisão.

## 7. Verificação
`pnpm --filter @plataforma/estaleiro-core build`, `test`, `lint`; testes do harness se afetados.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
