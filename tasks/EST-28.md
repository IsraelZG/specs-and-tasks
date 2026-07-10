---
id: EST-28
title: "Paridade das guardas MGTIA: build + test + lint + bypass"
status: draft:triaged
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-03c", "EST-03d", "EST-21"]
blocks: ["EST-22"]
capacity_target: haiku
---

# EST-28 · Paridade das guardas MGTIA

## 1. Objetivo
Alinhar o gate de evidência implementado ao contrato vigente: evidência literal de build, test e lint; bypass somente quando explicitamente autorizado pela task; identidade e papel coerentes.

## 2. Contexto RAG
- `CLAUDE.md`, Regras 3 e 6.
- `packages/plugin-tasks/src/guards/evidenceGuard.ts`, `identityGuard.ts`, `service.ts`.

## 3. Escopo
- **[UPDATE]** guards/service/schema se necessário.
- **[UPDATE]** testes negativos e de bypass.

## 4. Testes
Casos isolados faltando build/test/lint, bypass explícito, `agile_reviewer:model`, actor harness e transição inválida.

## 5. DoD
Guard rejeita evidência incompleta e não altera manualmente status/INDEX/log.

## 6. Feedback
Não duplicar a política no servidor; consumir as guardas do plugin.

## 7. Verificação
`pnpm --filter @plataforma/plugin-tasks build`, `test`, `lint`.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
