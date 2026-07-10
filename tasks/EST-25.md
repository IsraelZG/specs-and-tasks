---
id: EST-25
title: "Cut-over operacional: standalone smoke e runbook"
status: draft:triaged
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-22", "EST-23", "EST-24b"]
blocks: ["EST-33"]
capacity_target: sonnet
---

# EST-25 · Cut-over operacional

## 1. Objetivo
Garantir que o build standalone inicia fora da working tree e documentar o fluxo operacional do Estaleiro.

## 2. Contexto RAG
- `docs/adr/0012-empacotamento-standalone-estaleiro.md`.
- `scripts/estaleiro-standalone.mjs` e `apps/estaleiro/server.mjs`.

## 3. Escopo
- **[UPDATE]** `scripts/estaleiro-standalone.mjs` e runbook em `docs/`.
- **[CREATE]** smoke Node sem browser para build, cópia, start e stop.

## 4. Testes
Smoke de processo, porta HTTP/WS, diretório standalone separado e ausência de import da working tree. Browser fica em EST-33.

## 5. DoD
`pnpm estaleiro:standalone` deixa uma instância executável e o runbook permite repetir o cut-over.

## 6. Feedback
Não automatizar atualização periódica além do escopo do ADR-0012.

## 7. Verificação
Gates de `estaleiro-core`, `estaleiro-ui` e smoke standalone.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
