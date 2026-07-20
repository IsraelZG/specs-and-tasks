---
id: EST-67
title: "Chrome do shell do Estaleiro: Header + Footer + toggle de tema (padrão superapp-shell)"
status: draft:hardened
complexity: 2
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [EST-65]
blocks: []
capacity_target: sonnet
ui: true
---

# EST-67 · Chrome do shell: Header + Footer + tema

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-67`.
- **Pré-condição:** EST-65 `done` (tokens/Tailwind ativos).
- **Skill do worker:** `/executar-task-ui` (loop visual HMR + `/frontend-design`).
- **Referência estrutural (read-only):**
  `C:\Dev2026\Docs\docs\_vendor\superapp-shell\src\components\shell\{AppShell,Header,Footer}.tsx`
  — estrutura `flex h-screen flex-col` com Header, miolo `flex-1 min-h-0`, Footer.

## 1. Objetivo
O Estaleiro hoje é o FlexLayout cru colado nas bordas da janela — sem identidade nem "moldura".
Adicionar o chrome mínimo do padrão superapp-shell: **Header** (título "Estaleiro" + versão,
status da conexão WS, toggle dark/light) e **Footer** fino (linha de status), envolvendo o
FlexLayout existente.

## 2. Contexto RAG
- `apps/estaleiro/ui/src/App.tsx` — onde o WorkspaceShell/FlexLayout monta hoje; o wrapper novo
  envolve isso.
- `apps/estaleiro/ui/src/ws/client.js` — estado de conexão WS (para o dot de status no Header;
  se o client não expõe estado observável, exibir estático "local" e anotar no §8 — NÃO
  refatorar o client nesta task).
- Tema: EST-65 fixa `data-theme="dark"` no `<html>`. O toggle alterna `data-theme` entre
  `dark`/`light` e persiste em `localStorage("estaleiro-theme")`; boot lê a preferência antes do
  primeiro paint (inline no `index.html` ou no topo do `main.tsx`).
- Visual: Header usa `--ds-theme-surface-subdued` + borda `--ds-theme-border-subtle`, altura
  ~48px; Footer ~28px, `content-muted`, mono opcional para métricas.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/ui/src/shell/Header.tsx` — título, versão (importar de
  `package.json` via `import.meta.env` ou constante), dot WS, botão de tema (sol/lua unicode —
  sem lib de ícones nova).
- **[CREATE]** `apps/estaleiro/ui/src/shell/Footer.tsx` — linha de status (placeholder: versão +
  tema ativo; métricas reais ficam para task futura).
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx` — envolver o layout em
  `flex h-screen flex-col` com Header/Footer; miolo `flex-1 min-h-0 relative` (FlexLayout usa
  position absolute — o wrapper precisa de `relative`).
- **[UPDATE]** `apps/estaleiro/ui/src/main.tsx` ou `index.html` — boot do tema persistido.

## 4. Estratégia de Testes
- Unit (RTL/jsdom): Header renderiza título+toggle; clicar no toggle alterna `data-theme` no
  `document.documentElement` e grava no localStorage; boot respeita valor persistido.
- E2E existente verde (o wrapper não pode quebrar o FlexLayout — atenção ao `min-h-0`).
- **Verificação visual (Parecer):** screenshot dark E light no standalone.

## 5. Instruções de Execução
- **NÃO FAZER:**
  - NÃO portar CommandPalette/menus/módulos do vendored — só Header/Footer.
  - NÃO adicionar lucide-react ou outra lib de ícones.
  - NÃO mexer no ws client além de LER estado existente.

## 7. Definition of Done
- [ ] Header + Footer renderizando; FlexLayout intacto entre eles (E2E verde).
- [ ] Toggle de tema funcional e persistido; light theme legível (tokens light da EST-65).
- [ ] Gate `pnpm gate @plataforma/estaleiro` allGreen + screenshots dark/light no Parecer.

## 8. Handover / Parecer

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-20T12:26]** - *claude-fable* - `[Triado]`: triagem: escopo e capacidade definidos na criação (estilo-first, ref superapp-shell vendored)
- **[2026-07-20T12:27]** - *claude-fable* - `[Endurecido]`: endurecida na criação: fatos verificados no código em 2026-07-20 (vite sem tailwind, index.css brutalista, tokens DS divergem do vendored), oráculo = docs/_vendor/superapp-shell, decisões de marca fechadas pelo arquiteto
