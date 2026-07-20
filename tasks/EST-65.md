---
id: EST-65
title: "Fundação de estilo: Tailwind 4 + tokens DS rebrand + skin FlexLayout (matar CSS brutalista)"
status: ready
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: [EST-66, EST-67]
capacity_target: opus
ui: true
---

# EST-65 · Fundação de estilo do Estaleiro

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-65`.
- **Referência de design (read-only):** `C:\Dev2026\Docs\docs\_vendor\superapp-shell\` — export
  GitHub do projeto Lovable que o arquiteto definiu como direção visual (2026-07-20). NÃO copie
  o repo inteiro; porte só o que a spec pede.
- **Capacidade-alvo: opus** (M5 — trabalho integrativo: vite config + pacote DS + shell css + app
  css se cruzam; o valor só aparece com tudo junto).

## 1. Objetivo
O Estaleiro está **sem pipeline de estilo**: as centenas de classes Tailwind nas views não geram
CSS nenhum (não há Tailwind no build), as vars `--ds-*` não resolvem (tokens nunca importados), e
um `index.css` "brutalista" com `* { border-radius: 0 !important; box-shadow: none !important }`
mata o que sobra. Esta task instala a fundação: Tailwind 4 no vite, tokens do design-system
atualizados para a marca nova (vermelho/lima do superapp-shell), skin DS do FlexLayout, e remoção
do CSS brutalista. **Depois dela, as views renderizam como escritas.**

## 2. Contexto RAG (fatos VERIFICADOS em 2026-07-20)
- `apps/estaleiro/ui/vite.config.ts` — só `@vitejs/plugin-react`; **sem** `@tailwindcss/vite`.
- `apps/estaleiro/ui/src/main.tsx` — importa `@plataforma/shell/index.css` (FlexLayout base, tema
  preto hardcoded) + `./index.css` (brutalista). Nenhum token DS chega ao browser.
- `apps/estaleiro/ui/src/index.css` — o CSS brutalista a remover (scanlines, mono, uppercase,
  `* { border-radius:0 !important }`).
- `packages/design-system/` — fonte dos tokens em `tokens/{global,semantics,themes}/*.json`
  (style-dictionary; `pnpm --filter @plataforma/design-system build:tokens` regenera
  `build/web/*.css`). Exports: `./theme-dark.css`, `./theme-light.css`. Deps `tailwindcss@^4.1` e
  `@tailwindcss/vite@^4.1` já existem no pacote (versões a reusar no estaleiro-ui).
- **Marca atual (build) ≠ marca alvo (vendored):** build atual = lavanda (`accent-fill:
  lavender-500`, botão pill, card 2xl). Alvo (vendored `theme-dark.css`, geração 2026-05-20) =
  **accent `#E63347`** (fill-hover/focus `#D71E33`), link `#D1FF00`, `button/card/input-radius: 0`,
  surface-canvas `#121212`, glass tokens. O CSS vendored é o **oráculo de aceitação**.
- Vendored `src/styles.css` — ordem de imports canônica:
  `@import "tailwindcss" source(none); @source "../src"; tokens-global; theme-light; theme-dark;
  flexlayout-react/style/light.css; flexlayout-ds.css`.
- Vendored `src/styles/flexlayout-ds.css` (91 linhas) — mapeia as vars internas do FlexLayout para
  tokens `--ds-theme-*` (tabset radius 20, tab pill, splitter accent). Portar como está.
- `ChatView.tsx` importa `Select` de `@plataforma/design-system` — as classes utilitárias DESSES
  componentes também precisam existir no CSS final (ver §3 item 5).

## 3. Escopo de Arquivos
1. **[UPDATE]** `packages/design-system/tokens/themes/dark/theme.json`, `tokens/themes/light/theme.json`,
   `tokens/semantics/components.json` — atualizar valores para que `build:tokens` regenere
   `build/web/theme-{dark,light}.css` **equivalentes token-a-token** aos vendored
   (`docs/_vendor/superapp-shell/src/styles/theme-{dark,light}.css`). Método: diff dos gerados vs
   vendored → retro-propagar na fonte JSON (preferir referências a `--ds-color-*` onde o valor
   bater com a paleta global; hex literal onde não bater, ex. `#E63347`, `#D1FF00`, `#121212`).
   Rodar `build:tokens` e commitar fonte + build (build é commitado — padrão existente do pacote).
2. **[CREATE]** `packages/shell/flexlayout-ds.css` + export `"./flexlayout-ds.css"` no
   `packages/shell/package.json` — porte do vendored `flexlayout-ds.css` (reutilizável: qualquer
   app que use o shell ganha o skin; requisito de reuso do projeto).
3. **[UPDATE]** `apps/estaleiro/ui/vite.config.ts` + `package.json` — adicionar `tailwindcss` e
   `@tailwindcss/vite` (^4.1, mesmas do design-system) e o plugin no vite.
4. **[UPDATE]** `apps/estaleiro/ui/src/index.css` — REESCREVER (deletar o brutalista):
   `@import "tailwindcss" source(none); @source "./";` + imports dos tokens
   (`@plataforma/design-system/theme-dark.css` + `theme-light.css`) + `@plataforma/shell/index.css`
   + `@plataforma/shell/flexlayout-ds.css` + body base usando tokens (`background:
   var(--ds-theme-surface-canvas); color: var(--ds-theme-content-default); font-family:
   var(--ds-font-family-sans)`). Mono APENAS onde intencional (código/terminal), não global.
5. **[UPDATE]** `packages/design-system/package.json` — adicionar export `"./index.css":
   "./build/react/index.css"`; **[UPDATE]** `apps/estaleiro/ui/src/index.css` importa-o (garante
   as utilities dos componentes DS compilados, ex. Select). Alternativa aceitável se o import
   duplicar utilities de forma conflitante: `@source` apontando para
   `node_modules/@plataforma/design-system/build/react/`.
6. **[UPDATE]** `apps/estaleiro/ui/index.html` (ou `main.tsx`) — `data-theme="dark"` no `<html>`
   como default (os tokens são gateados por `:root[data-theme="dark"]`). Sem toggle nesta task
   (fica na EST-67).

## 4. Estratégia de Testes
- **Gate:** `pnpm gate @plataforma/estaleiro` verde (inclui unit UI + E2E existentes — os E2E de
  chat/board devem continuar passando; seletores são por role/testid, não por estilo).
- **E2E novo (anti-regressão do brutalismo):** um teste Playwright que abre a página e afirma via
  `getComputedStyle`: (a) `body` tem `background-color` = rgb do `#121212`; (b) um
  `.flexlayout__tabset` tem `border-radius` **não-zero** (prova que o `* {radius:0 !important}`
  morreu e o skin entrou); (c) a var `--ds-theme-intent-accent-fill` resolve para `#E63347`.
- **DS:** `pnpm --filter @plataforma/design-system build && test` verde após o rebrand (o pacote
  tem testes próprios de tokens/componentes — se algum cravar valores lavanda, atualizar o teste
  JUNTO com evidência do porquê).
- **Verificação visual (obrigatória no Parecer):** screenshot do standalone reconstruído
  (`node scripts/estaleiro-standalone.mjs` → abrir :8899) colado/descrito no Parecer. Regra 3c:
  o gate desta onda É a tela com o visual novo.

## 5. Instruções de Execução
- Comece pelo item 1 (tokens) — é o oráculo; sem ele o resto não tem cor certa.
- O diff de tokens é mecânico: `diff build/web/theme-dark.css docs/_vendor/.../theme-dark.css`
  depois de cada `build:tokens`, até zerar (modulo comentário de timestamp/formatação).
- **NÃO FAZER:**
  - NÃO usar bun/`@tanstack/*`/shadcn do repo vendored — só CSS/tokens/estrutura visual. Nosso
    stack é pnpm + vite + react puro.
  - NÃO reintroduzir regras globais com `!important`.
  - NÃO tocar nas views (`src/views/**`) além do estritamente necessário para compilar — a
    varredura de conformidade é a EST-66.
  - NÃO alterar `@plataforma/shell/index.css` existente (outros consumidores) — o skin é ADITIVO
    via novo arquivo exportado.
  - NÃO deletar o repo vendored.

## 6. Decisões de Arquitetura (fechadas)
- Marca alvo = geração vendored 2026-05-20 (vermelho `#E63347`/lima `#D1FF00`, radius 0 em
  botão/card/input, tabsets FlexLayout arredondados via skin). Decidido pelo arquiteto em
  2026-07-20 ("design mais próximo do que planejo").
- Rebrand é NA FONTE do design-system (não fork no estaleiro) — o superapp herda depois. Requisito
  de reuso explícito do usuário.

## 7. Definition of Done
- [ ] `build/web/theme-{dark,light}.css` regenerados equivalentes aos vendored (diff colado no §8).
- [ ] Tailwind ativo no build do estaleiro-ui; utilities das views geram CSS real.
- [ ] `index.css` brutalista removido; tokens + skin FlexLayout importados; `data-theme="dark"`.
- [ ] E2E anti-regressão (§4) passando; gate `pnpm gate @plataforma/estaleiro` allGreen.
- [ ] Screenshot do standalone com o visual novo no Parecer.

## 8. Handover / Parecer

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-20T12:26]** - *claude-fable* - `[Triado]`: triagem: escopo e capacidade definidos na criação (estilo-first, ref superapp-shell vendored)
- **[2026-07-20T12:27]** - *claude-fable* - `[Endurecido]`: endurecida na criação: fatos verificados no código em 2026-07-20 (vite sem tailwind, index.css brutalista, tokens DS divergem do vendored), oráculo = docs/_vendor/superapp-shell, decisões de marca fechadas pelo arquiteto
- **[2026-07-20T12:27]** - *claude-fable* - `[Promovida p/ ready]`: sem dependências — pronta para despacho (estilo-first: bloqueia dispatch das ondas C-G por decisão do arquiteto)
