---
id: EST-23
title: "UI: TaskClient real e remoção de fixtures do Board/Decisões"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-22"]
blocks: ["EST-25", "EST-33"]
capacity_target: sonnet
ui: true
---

# EST-23 · UI TaskClient real

## 0. Ambiente
Node.js 20+, React, Vitest/Testing Library e servidor do EST-22.

## 1. Objetivo
Substituir `createMockTaskClient()` pelo cliente HTTP real no Board e em Decisões, mantendo rollback otimista e estados de loading/erro.

## 2. Contexto RAG
- `apps/estaleiro/ui/src/App.tsx`.
- `apps/estaleiro/ui/src/views/board/TaskClient.ts` e `TaskClient.fixture.ts`.
- `apps/estaleiro/ui/src/views/board/hooks.ts` e `views/decisions`.

## 3. Escopo
- **[CREATE]** `apps/estaleiro/ui/src/views/board/TaskClient.http.ts`.
- **[UPDATE]** `App.tsx`, Board/Decisions hooks e testes existentes.
- **[CREATE]** testes de cliente HTTP com `fetch` mockado.

## 4. Testes
Unitários para sucesso, 404, erro de transição e rollback. O fluxo browser real será coberto em EST-33; não considerar JSDOM suficiente para o DoD completo.

## 5. Instruções
Remover fixture do caminho de produção, manter a interface `TaskClient`, não duplicar regras de transição no frontend e encaminhar eventos WS pelo cliente compartilhado.

## 6. Decisões
Fixar formato dos endpoints do EST-22 antes de endurecer.

## 7. DoD
Board e Decisões carregam dados reais; nenhuma fixture é importada por `App.tsx`; build/test/lint + teste de integração posterior verdes.

## 8. Handover e revisão
Incluir screenshot/manual ou evidência Playwright de EST-33 quando disponível.

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
