---
id: EST-27
title: "Dispatcher: verbos corretos, identidade e worktrees isoladas"
status: draft:triaged
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-07", "EST-22", "EST-24a"]
blocks: ["EST-25"]
capacity_target: sonnet
---

# EST-27 · Dispatcher correto

## 1. Objetivo
Fazer `executeDispatch` respeitar a ação planejada (`start`, `claim`, `promote`, `harden`, `review`, `rework`) e executar workers em worktrees isoladas, com actor válido.

## 2. Contexto RAG
- `packages/plugin-dispatcher/src/dispatcher.ts`, `types.ts`, `selectModel.ts`.
- `packages/plugin-tasks/src/stateMachine.ts` e guards.
- `docs/CLAUDE.md`, seção de identidade e papéis.

## 3. Escopo
- **[UPDATE]** dispatcher/types.
- **[CREATE]** adapter de worktree ou reuso do helper existente, sem interpolar IDs sem validação.
- **[UPDATE]** testes do dispatcher.

## 4. Testes
Tabela ação→verbo, circuito de review/rework, ausência de modelo, provider sem saldo, worktree por task e actor não-harness.

## 5. DoD
Nenhuma ação planejada é executada como `start` por engano; cwd nunca aponta para a working tree compartilhada.

## 6. Feedback
Não fazer chamadas de modelo real nos testes.

## 7. Verificação
`pnpm --filter @plataforma/plugin-dispatcher build`, `test`, `lint`.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
