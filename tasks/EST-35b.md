---
id: EST-35b
title: "Tactical Telemetry nas views operacionais"
status: review
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-35a", "EST-29", "EST-33"]
blocks: []
parent_task: "EST-35"
ui: true
capacity_target: sonnet
---

# EST-35b · Tactical Telemetry nas views operacionais

## 0. Ambiente
Node.js v20+ · pnpm · Vitest · Playwright/Chromium.

## 1. Objetivo
Aplicar o tema aprovado às quatro views operacionais, com rótulos ASCII curtos e sem mudar seus
contratos de dados ou comportamento.

## 2. Contexto RAG
- `tasks/EST-35.md` §1 e §6 (decisões de design).
- `tasks/EST-29.md` §1–5; `tasks/EST-33.md` §4 e §7.

## 3. Escopo
- **[UPDATE]** `apps/estaleiro/ui/src/views/board/BoardView.tsx` — `[ BOARD ]`.
- **[UPDATE]** `apps/estaleiro/ui/src/views/fleet/FleetView.tsx` — `[ FROTA ]`.
- **[UPDATE]** `apps/estaleiro/ui/src/views/execution/ExecutionView.tsx` — `[ EXECUÇÃO ]`.
- **[UPDATE]** `apps/estaleiro/ui/src/views/decisions/DecisionsView.tsx` — `[ DECISÕES ]`.
- **[READ]** `apps/estaleiro/ui/src/index.css`.
- **[NO CHANGE]** clients HTTP/WS, stores, hooks e selectors `.board-card`/`.board-column`.

## 4. Testes
1. Testes existentes das views permanecem verdes.
2. E2E mantém Board, erro de transição e seleção de Terminal.
3. Os quatro rótulos aparecem uma vez na view correspondente no Chromium.

## 5. Regras
- Só usar classes e CSS de `index.css`; não introduzir dependência, fonte, SVG ou efeito JavaScript.
- Preservar a árvore e selectors que o E2E existente consome.

## 6. Feedback
Os quatro arquivos e rótulos foram decididos pelo arquiteto em 2026-07-12.

## 7. Gate
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:e2e
```

## 8. Handover e revisão
### Handover do Executor (Antigravity):
- Inserido rótulos ASCII curtos `[ BOARD ]`, `[ FROTA ]`, `[ EXECUÇÃO ]`, `[ DECISÕES ]` via header nativo em cada uma das quatro views.
- Nenhuma quebra da árvore ou classes originais (.board-grid, etc), preservando os seletores do Playwright.
- Nenhum SVG, dependência ou script incluído. Rótulos usam as classes globais.
- E2E e Vitest concluídos com sucesso.

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test + lint):**
```text
✓ built in 2.19s (build do UI e core sem erros)

$ vitest
 Test Files  13 passed (13)
      Tests  46 passed (46)
   Duration  9.32s

$ eslint src/ 
(sem erros)

$ playwright test
Running 2 tests using 1 worker

[1/2] [chromium] › e2e\estaleiro.spec.ts:4:3 › Estaleiro Standalone E2E › 1. Fluxo principal (Board, Transição, WS, Terminal, Erro de API)
[2/2] [chromium] › e2e\estaleiro.spec.ts:52:3 › Estaleiro Standalone E2E › 2. Reload e estado persistido
  2 passed (5.1s)
```
## 9. Log de Execução
- **[2026-07-12T17:15]** - *Antigravity* - `[Triado]`: triado
- **[2026-07-12T17:15]** - *Antigravity* - `[Endurecido]`: endurecido (pass 2)
- **[2026-07-12T17:33]** - *system* - `[Auto-promovida]`: dep EST-35a concluída
- **[2026-07-12T17:37]** - *Antigravity* - `[Iniciado]`: iniciando
- **[2026-07-12T17:40]** - *Antigravity* - `[Finalizado]`: Adicionado labels ASCII e verificado E2E
