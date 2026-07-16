---
id: EST-24
title: "Runtime DMM do Estaleiro — casca decomposta"
status: done
complexity: 6
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-06", "EST-07", "EST-10", "DMM-01", "DMM-06", "DMM-12"]
blocks: ["EST-24a", "EST-24b"]
capacity_target: sonnet
subtasks: ["EST-24a", "EST-24b"]
---

# EST-24 · Runtime DMM do Estaleiro

## 1. Objetivo
Compor os plugins já implementados em uma execução DMM real. Esta task é apenas a casca; o código fica nos filhos EST-24a e EST-24b.

## 2. Contexto RAG
- ADR-0013/0014 e `packages/plugin-workflows`.
- `packages/core/src/pluginRegistry.ts`.
- `apps/estaleiro/core`.

## 3. Escopo
Somente coordenação e critérios dos filhos; nenhum worker deve executar a casca diretamente.

## 4. Testes
Ver EST-32 para integração do runtime.

## 5. DoD
EST-24a e EST-24b concluídas e integradas; EST-32 verde.

## 6. Feedback
Reendurecer filhos quando as APIs de host estiverem fixadas.

## 7. Gate
Não executar diretamente; verificar gates dos dois filhos.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T12:50]** - *gpt-5* - `[Decomposto]`: Casca decomposta em EST-24a (runtime factory) e EST-24b (workflow DMM real); executar apenas os filhos.
- **[2026-07-14T12:30]** - *system* - `[Auto-encerrado retroativo]`: M-016: todas as 2 filhas done — backfill one-shot
