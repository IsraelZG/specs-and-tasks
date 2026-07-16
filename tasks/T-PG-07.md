---
id: T-PG-07
title: "Superfície visual de autoria de páginas"
status: draft:triaged
complexity: 5
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PG-02", "T-PG-06", "T-DS-06"]
blocks: ["T-PG-08"]
capacity_target: opus-spike
ui: true
---

# T-PG-07 · Superfície visual de autoria de páginas

## 0. Ambiente de Execução Obrigatório
- **Repo:** `C:\Dev2026\superapp`, worktree `task/T-PG-07`.
- **Pacote:** `@plataforma/pages`; React/browser real; Design System canônico.
- **Capacidade-alvo:** `opus-spike` no endurecimento JIT, pois integra três contratos ainda não entregues.

## 1. Objetivo
Entregar um `PageEditor` visual spec-driven: catálogo pesquisável, árvore estrutural, canvas vivo e
inspetor de propriedades. Toda ação visual despacha comandos de T-PG-06 sobre `PageDocument`; o
canvas usa o renderer de T-PG-02; catálogo/props vêm de T-DS-06. O editor compõe componentes e tokens
semânticos do Design System e não abre uma rota para HTML/CSS/JS livre.

## 2. Contexto RAG
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` — dialeto, catálogo, validação, agentes e perfis.
- `docs/caderno-3-sdk/03-engines-and-spec-driven-ui.md` — separação spec/renderer/engine.
- `docs/caderno-3-sdk/10-design-system.md` e `09-hierarchical-theme-customization.md` — DS e tokens.
- `docs/adr/0016-ui-engines-e-flow-grid.md` — não confundir editor de página com FlowGrid.
- `tasks/T-PG-02.md`, `T-PG-06.md`, `T-DS-06.md` — renderer, comandos/history e catálogo.
- `tasks/T-MOD-03.md` — colaboração/persistência pertencem à task seguinte, não a esta.

### Referência externa fixada (produto, não código)
- Dashi [`layout-query.mjs`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/scripts/workflow/layout-query.mjs) e
  [`inspect-layout.mjs`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/scripts/inspect-layout.mjs): descoberta progressiva.
- Dashi [`renderDeck.jsx`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/src/renderDeck.jsx): view-model antes da renderização.
- Dashi [`persist-deck-state.mjs`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/scripts/persist-deck-state.mjs): referência dos tipos de edição; **não copiar auto-save**, pois o SuperApp exige persistência opt-in.

## 3. Escopo de Arquivos (provisório até dependências done)
- **[READ]** outputs públicos reais de T-PG-02, T-PG-06 e T-DS-06.
- **[READ]** `packages/design-system/src/index.ts` e metadados dos componentes selecionados.
- **[CREATE]** `packages/pages/src/editor/PageEditor.tsx` — composição da superfície e contrato público.
- **[CREATE]** `packages/pages/src/editor/CatalogPalette.tsx` — `query → inspect`, busca e inserção.
- **[CREATE]** `packages/pages/src/editor/PageTree.tsx` — seleção, reordenação e hierarquia acessível.
- **[CREATE]** `packages/pages/src/editor/PageCanvas.tsx` — wrapper do `PageRenderer`, sem renderer paralelo.
- **[CREATE]** `packages/pages/src/editor/PropsInspector.tsx` — controles derivados de metadata/prop specs.
- **[CREATE]** `packages/pages/src/editor/editor.css` somente se o pacote já tiver pipeline CSS; usar apenas
  tokens semânticos existentes. Se não houver pipeline, composição/layout deve usar primitivas DS existentes.
- **[UPDATE]** `packages/pages/src/editor/index.ts` e `packages/pages/src/index.ts`.
- **[CREATE]** `packages/pages/tests/page-editor.test.tsx`.
- **[CREATE]** `packages/pages/e2e/page-editor.spec.ts` e fixture/harness mínimo no padrão do pacote/monorepo.
- **[NO CHANGE]** tokens/tema/componentes DS, shell, Automerge, persistence, geração por IA.

### Estados e comportamentos obrigatórios
- Layout responsivo: catálogo/árvore/inspector recolhíveis; canvas continua navegável em viewport estreito.
- Estados explícitos: loading do catálogo, catálogo vazio, documento inválido, componente desconhecido,
  seleção perdida após edição e read-only.
- Teclado: tab order lógico; árvore com setas/Enter; Delete com confirmação quando remove subárvore;
  undo/redo via comandos, sem capturar atalhos em inputs de texto.
- Drag-and-drop é opcional; botões/teclado para mover são obrigatórios e constituem o caminho acessível.
- Inspector não oferece prop, variant ou slot ausente do `ComponentMetadata`; expressão/binding é editada
  por controles estruturados, nunca por `eval`.

## 4. Estratégia de Testes Estrita
- **Unit/RTL:** composição, estados, dispatch correto e ausência de mutação direta.
- **Playwright obrigatório:** inserir componente via catálogo, selecionar na árvore/canvas, editar prop,
  mover, undo, redo, remover e alternar read-only em browser real.
- **Acessibilidade:** teclado cobre o fluxo essencial; foco visível; labels/names acessíveis; sem axe
  violations críticas/serious se o monorepo já possuir axe.
- **Responsive:** smoke em viewport desktop e estreita.
- **Anti-fake:** teste espiona o renderer e o dispatcher públicos; falha se o editor renderizar JSX de
  componente catalogado diretamente ou mutar o documento sem comando.
- **Fora de escopo:** colaboração, persistência, IA, edição de código e criação de novos componentes DS.

## 5. Instruções de Execução
1. Reendurecer após as três dependências `done`, copiando suas assinaturas reais para esta spec.
2. Fazer inventário dos componentes DS existentes; reutilizar antes de propor qualquer extensão.
3. Implementar por fatias verticais com testes: seleção → inserção → props → movimento/history.
4. Rodar Playwright em browser real e registrar screenshots/evidência dos dois viewports.

### Não fazer / pegadinhas
- NÃO criar um segundo renderer, store, schema de props ou catálogo local.
- NÃO depender de 1020 layouts Dashi, copiar seu React/CSS ou reproduzir seu mecanismo de auto-save.
- NÃO aceitar HTML, CSS, JS, `className`, token primitivo ou componente arbitrário.
- NÃO criar novo tema; esta task usa o Design System canônico.
- NÃO tornar drag-and-drop o único meio de ordenação.

## 6. Feedback de Especificação
- **JIT obrigatório:** paths são estáveis, mas props/imports/test harness finais só podem ser fixados após
  T-PG-02, T-PG-06 e T-DS-06 `done`. Se algum output divergir, atualizar esta task antes de executar.

## 7. Definition of Done
- [ ] Usuário cria e edita uma página exclusivamente por contratos spec-driven.
- [ ] Catálogo, tree, canvas e inspector usam os outputs canônicos sem duplicação.
- [ ] Fluxo essencial funciona por mouse e teclado, em desktop e viewport estreito.
- [ ] Unit, build, lint e Playwright verdes com evidência literal.

### Gate de Evidência (fixar filtro E2E no endurecimento JIT)
```bash
pnpm --filter @plataforma/pages build
pnpm --filter @plataforma/pages test
pnpm --filter @plataforma/pages lint
pnpm --filter @plataforma/pages exec playwright test e2e/page-editor.spec.ts
```

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração
- **Evidência visual:** screenshots desktop/estreita + saída Playwright.

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-15T20:18]** - *gpt-5* - `[Triado]`: Editor visual spec-driven triado; integra renderer, comandos e catálogo sem duplicá-los.
