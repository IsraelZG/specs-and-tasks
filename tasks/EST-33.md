---
id: EST-33
title: "E2E Playwright do Estaleiro standalone"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-25", "EST-29", "EST-31", "EST-32"]
blocks: []
capacity_target: sonnet
ui: true
---

# EST-33 · E2E standalone

## 1. Objetivo
Executar o Estaleiro standalone em browser real e provar a jornada mínima do operador: abrir Board, carregar task, transicionar, abrir painel lateral/Terminal e observar atualização.

## 2. Contexto RAG
- `docs/adr/0012-empacotamento-standalone-estaleiro.md`.
- `apps/estaleiro/ui/src/App.tsx` e EST-29.
- `scripts/estaleiro-standalone.mjs`.

## 3. Escopo
- **[CREATE]** `apps/estaleiro/e2e/estaleiro.spec.ts`.
- **[CREATE/UPDATE]** configuração Playwright e fixture de servidor.
- Não substituir os testes Vitest; este é o browser gate.

## 4. Testes
Playwright: servidor sobe/encerra, Board usa API real, transição aparece, WS atualiza UI, layout FlexLayout abre Terminal, erro de API aparece. Um cenário separado valida reload e estado persistido.

## 5. DoD
E2E passa contra o bundle standalone, sem fixtures de task no caminho principal e sem porta/processo órfão.

## 6. Feedback
Não usar `waitForTimeout` como sincronização; esperar rede, evento ou estado visível.

## 7. Verificação
`pnpm --filter @plataforma/estaleiro test:e2e` e lint do UI; anexar saída literal ao handover.

## 8. Handover e revisão
Incluir evidência do browser real e screenshots apenas se o reviewer exigir.

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
