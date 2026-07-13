---
id: EST-29
title: "Integração de layout FlexLayout real no shell"
status: done
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

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Revisor:** agile_reviewer (minimax-m3) · 2026-07-10
- **Commit auditado:** `7c1ad03` (branch `task/EST-29`)
- **Arquivos auditados:** 4 (default-layout.ts, App.tsx, setup.ts, shell.test.tsx) + 2 (vitest.config, estaleiro root pkg) — todos dentro do escopo declarado em §3 (`flexlayout-react` mantido, App.tsx atualizado, modelo/persistência criados).

**Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/estaleiro-ui build  →  vite OK (built in 4.13s, dist 528KB JS + 4MB editor chunk pre-existente)
$ pnpm --filter @plataforma/estaleiro-ui test   →  Test Files 13 passed (13) · Tests 46 passed (46)
                                                 (3 novos tests em shell.test.tsx: schema/boardStore, App render, layout com 8 abas registradas)
$ pnpm --filter @plataforma/estaleiro-ui lint   →  eslint src/  (sem erros)
```

**Verificação de UI (§4b — INVIOLÁVEL para tasks com `ui: true`):**

Esta task marca `ui: true` mas **delega explicitamente os smoke tests de browser real (Playwright) para EST-33** (spec §4: "Testing Library para modelo/painéis e Playwright em EST-33 para resize, troca de tabs e seleção task→Terminal"). Para EST-29, realizei verificação manual documentada:

1. **Serve estático do dist** (Python http.server na porta 9123):
   - `GET /` → 200, 406B HTML apontando para `/assets/index-DP6XjLL2.js`
   - `GET /assets/index-DP6XjLL2.js` → 200, 528241B
   - Verificou-se no bundle minificado a presença de: `Board`, `Execução`, `Frota`, `Docs/RAG`, `Decisões`, `Custo`, `Planejamento`, `Terminal`, `flexlayout__layout`, `flexlayout__tab`, `flexlayout__border`, `onModelChange`. Todos OK.

2. **3 sondas adversariais JSDOM (probes)** — todas PASSARAM (removidas após confirmar):
   - `2 borders (.flexlayout__border) com sizer redimensionável` — prova que o layout é FlexLayout real com handle de resize (não CSS fixo). Resultado: 2 borders + 1+ sizer.
   - `Layout root com classes canônicas (.flexlayout__layout + .flexlayout__layout_main)` — confirma que o componente `<Layout>` do flexlayout-react montou de verdade (não um placeholder).
   - `Todos os 8 nomes de abas renderizam` (getAllByText ≥ 1) — confirma que a factory cobriu os 8 casos do `node.getComponent()` em `App.tsx:74-93`.

3. **Inspeção DOM completa** (via probe intermediário): FlexLayout renderiza 31 classes canônicas no DOM (`.flexlayout__border`, `.flexlayout__border_right`, `.flexlayout__border_bottom`, `.flexlayout__border_sizer`, `.flexlayout__layout_main`, `.flexlayout__layout_border_container`, etc.). Layout 100% FlexLayout real.

**Cobertura da spec §4 (escopo de teste desta task):**
| Bullet | Teste | Coberto |
|---|---|---|
| Testing Library para modelo/painéis | shell.test.tsx:2 "App renderiza sem crash (FlexLayout real)" + test 3 "layout tem abas registradas" | ✅ |
| Playwright em EST-33 (resize, tabs, task→Terminal) | DEFERIDO para EST-33 conforme spec §4 | ⏭️ |

**Cobertura da spec §5 (DoD):**
- "Layout real com coluna principal e lateral" — ✅ 1 tabset principal (4 abas) + 2 borders (direita=3 abas, inferior=1 aba).
- "sem `onClick: undefined`" — ✅ `App.tsx` usa prop `factory` no `<Layout>`, sem onClick em cada tab.
- "sem conteúdo duplicado montado como tabs falsos" — ✅ cada `case` no switch retorna UM componente (`h(BoardView, {...})` etc.), sem duplicar DOM.

**Achados:** 0 (zero).

═══════════════════════════════════════════════════
VEREDICTO: APROVADO
Resumo: `flexlayout-react` mantido; `default-layout.ts` cria o modelo com persistência local via
  localStorage; `App.tsx` simplificado de 98→98 linhas (mesma contagem) substituindo a casca CSS
  falsa pelo `<Layout>` real com factory que cobre os 8 componentes; 3 novos testes shell cobrem
  schema/boardStore + render sem crash + 8 abas registradas. Gates verdes; UI verificada via bundle
  servido + 3 sondas JSDOM que confirmam layout real (classes canônicas, sizers de resize, 8 nomes
  renderizando). Spec §5 DoD atendida. Smoke tests Playwright ficam para EST-33 conforme spec.

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
- **[2026-07-10T18:15]** - *Antigravity* - `[Endurecido]`: Endurecimento com diretrizes validadas (nenhuma decisão pendente)
- **[2026-07-10T18:15]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-10T18:25]** - *deepseek* - `[Iniciado]`: iniciando integracao FlexLayout real
- **[2026-07-10T18:34]** - *deepseek* - `[Finalizado]`: FlexLayout real integrado no shell: layout com coluna principal (Board|Execução|Frota|Docs/RAG) + lateral direita (Decisões|Custo|Planejamento) + inferior (Terminal), persistência via localStorage, resizeObserver mock p/ jsdom. build: vite OK, test: vitest 46/46, lint: eslint OK
- **[2026-07-10T18:38]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: qa-review --integrar EST-29
- **[2026-07-10T18:55]** - *agile_reviewer:minimax-m3* - `[Parecer]`: APROVADO — 0 achados. Verificação UI §4b via bundle servido + 3 sondas JSDOM (layout real com 2 borders + sizer, root canônico, 8 nomes renderizando). Gates 46/46 verdes. Playwright deferido p/ EST-33.
- **[2026-07-10T19:02]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit bc42e5e, sem conflitos), worktree removida, Gate verde pos-merge (build vite OK, test 46/46, lint OK). 0 achados. Verificacao UI §4b via bundle servido + 3 sondas JSDOM (2 borders + sizer, root canônico, 8 nomes renderizando) — layout real, nao CSS.
