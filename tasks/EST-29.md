---
id: EST-29
title: "Integração de layout FlexLayout real no shell"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14", "EST-23", "EST-24b"]
blocks: ["EST-33"]
capacity_target: sonnet
ui: true
---

# EST-29 · FlexLayout real

## 1. Objetivo
Manter `flexlayout-react`, substituir a casca CSS falsa por um modelo FlexLayout real e oferecer colunas/painéis redimensionáveis para Board, Execução, Planejamento, Terminal, Decisões e Custo.

## 2. Contexto RAG
- `docs/rfcs/rfc-018-estaleiro.md`, F1/F2.
- `apps/estaleiro/ui/package.json` e `src/App.tsx`.
- `apps/estaleiro/ui/src/views/*`.

## 3. Escopo
- **[CREATE]** modelo/layout inicial e persistência local.
- **[UPDATE]** `App.tsx` e testes de shell.
- Não remover `flexlayout-react`.

## 4. Testes
Testing Library para modelo/painéis e Playwright em EST-33 para resize, troca de tabs e seleção task→Terminal.

## 5. DoD
Layout real com coluna principal e lateral, sem `onClick: undefined` ou conteúdo duplicado montado como tabs falsos.

## 6. Feedback
Se apenas duas colunas fixas forem suficientes, documentar a decisão antes de trocar por CSS Grid.

## 7. Verificação
`pnpm --filter @plataforma/estaleiro-ui build`, `test`, `lint`.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
