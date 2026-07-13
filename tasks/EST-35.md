---
id: EST-35
title: "Implementar design Tactical Telemetry UI e CSS global — casca decomposta"
status: draft:decomposed
complexity: 5
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["EST-29", "EST-33"]
blocks: ["EST-35a", "EST-35b", "EST-35c"]
ui: true
subtasks: ["EST-35a", "EST-35b", "EST-35c"]
capacity_target: sonnet
---

# EST-35 · Implementar design Tactical Telemetry UI e css global

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo; o pacote de UI é `@plataforma/estaleiro-ui`.
- **Test Runner:** Vitest no pacote de UI e Playwright no app `@plataforma/estaleiro`.
- **Capacidade-alvo:** sonnet distribuído em três filhos. Esta casca não é executável.

## 1. Objetivo
Implementar o Design System "Industrial Brutalism & Tactical Telemetry UI" para o frontend do Estaleiro Standalone, introduzindo um CSS global rigoroso. A UI deve adotar o arquétipo "Tactical Telemetry & CRT Terminal" (Dark Mode exclusivo).

**Contratos de design decididos (arquiteto, 2026-07-12):**
1. **Tipografia:** pilha local monoespaçada para dados e telemetria; pilha local sans-serif para
   cabeçalhos. Não carregar fontes remotas nem versionar binários de fontes.
2. **Cores:** `#0A0A0A` fundo, `#121212` painéis, `#EAEAEA` texto e `#E61919` acento. Verde terminal
   não é usado. Não usar gradientes ou drop-shadows suaves.
3. **Layout:** Grid arquitetural rígido (`display: grid; gap: 1px;`), sem `border-radius` (apenas ângulos de 90 graus). Divisórias geradas pela cor de fundo do parent vs gap.
4. **Efeitos:** Simulação CRT e degradação tática (scanlines via `repeating-linear-gradient` no fundo, ruído de estática SVG global).
5. **Decoração de Sintaxe:** Envolver elementos chave com marcações ASCII, ex: `[ DELIVERY SYSTEMS ]`, `>>>`.

## 2. Contexto RAG (Spec-Driven Development)
- `tasks/EST-29.md` §1–4 e §8: o shell mantém `flexlayout-react`, renderiza oito abas e usa o
  modelo em `apps/estaleiro/ui/src/shell/default-layout.ts`; a mudança visual não pode substituir
  o layout real por CSS Grid.
- `tasks/EST-33.md` §4, §7 e §8: o browser gate atual verifica Board, Terminal, erro de API e
  persistência do layout com `pnpm --filter @plataforma/estaleiro test:e2e`.
- `apps/estaleiro/ui/src/App.tsx`: importa `flexlayout-react/style/light.css` e monta o `Layout`;
  isto diverge da exigência de dark mode exclusivo e requer D-EST35-3.
- `apps/estaleiro/ui/src/main.tsx`: é o entrypoint React; hoje importa apenas `App`.
- `apps/estaleiro/ui/src/shell/default-layout.ts`: fixa as oito abas atuais — Board, Execução,
  Frota, Docs/RAG, Decisões, Custo, Planejamento e Terminal.
- `apps/estaleiro/ui/package.json`: declara os comandos `build: vite build`, `test: vitest run` e
  `lint: eslint src/`; não declara biblioteca de design, fonte ou runner de regressão visual.
- **Divergência de fonte:** a referência original `docs/tasks/EST-33.md` não resolve neste repo;
  a task existente é `tasks/EST-33.md`. Ela prova o E2E, mas não registra que CSS tenha sido
  omitido numa migração Vite; essa alegação permanece sem fonte.

## 3. Escopo de Arquivos (Inputs e Outputs)
> **CASCA DECOMPOSTA — não executar diretamente.** O escopo está nos filhos.
- **[READ]** `apps/estaleiro/ui/src/App.tsx`, `apps/estaleiro/ui/src/main.tsx`,
  `apps/estaleiro/ui/src/shell/default-layout.ts`, `apps/estaleiro/ui/index.html`,
  `apps/estaleiro/ui/package.json` e `apps/estaleiro/e2e/estaleiro.spec.ts`.
- **EST-35a:** tema global, `alpha_dark.css` e evidência visual do shell.
- **EST-35b:** Board, Frota, Execução e Decisões.
- **EST-35c:** Docs/RAG, Custo, Planejamento e Terminal.

## 4. Estratégia de Testes
- **Framework derivado:** Vitest (`@plataforma/estaleiro-ui`) para preservar o shell e Playwright
  (`@plataforma/estaleiro`) em Chromium para browser real.
- **Casos funcionais de regressão derivados de EST-33 §4/§8:**
  1. O Board carrega a task real e o fluxo de erro de transição continua visível.
  2. A aba Terminal abre e `.agent-terminal` permanece visível.
  3. Após reload, a task e a aba Terminal continuam visíveis.
  4. O build Vite, os testes Vitest e o lint do pacote terminam sem erro.
- **Aceitação visual decidida:** Chromium no viewport já configurado de `1280×720`, usando
  `alpha_dark.css` + `index.css`; o executor anexa screenshot atual à Seção 8 para revisão humana.
- **Fora de escopo derivado:** alterar modelos de layout, fluxos de API, WebSocket ou comportamento
  de transição.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** remover ou substituir `flexlayout-react`; EST-29 §1/§3 o mantém como contrato.
> - **NÃO** adicionar dependência de design, webfont remoto, SVG decorativo ou biblioteca de efeitos.
> - **NÃO** alterar `default-layout.ts`, API ou WebSocket para obter um efeito visual.
> - **NÃO** criar rótulos além dos oito nomes decididos: `[ BOARD ]`, `[ FROTA ]`, `[ EXECUÇÃO ]`,
>   `[ KNOWLEDGE ]`, `[ DECISÕES ]`, `[ CUSTO ]`, `[ PLANEJAMENTO ]` e `[ TERMINAL ]`.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
*(Liste aqui os erros prováveis e como evitá-los. Ex.: "mudar uma assinatura síncrona para `async`*
*exige `await` em TODOS os callers (controller, rota REST, MCP tools)"; "mapear `A.foo → bar`*
*ao passar para o método X"; "não duplicar a lógica de Y — chamar o método existente Z".)*
- `App.tsx` importa o tema claro de FlexLayout; uma folha global sem estratégia explícita pode
  deixar controles light inacessíveis no dark mode. Resolver somente pelo contrato D-EST35-3.
- Os E2E localizam `.board-card`, `.board-column` e `.agent-terminal`; alterações de markup devem
  preservar esses seletores ou atualizar a task de E2E em escopo explicitamente aprovado.
- A opção mais enxuta é CSS e assets já locais; só introduzir fonte/dependência se a referência
  visual aprovada exigir isso (disciplina ponytail).

1. Executar somente EST-35a, EST-35b e EST-35c, respeitando suas dependências.
2. Nenhum worker executa esta casca diretamente.

## 6. Feedback de Especificação (Spec Feedback Loop)
### Derivado (com fonte)
- FlexLayout real e oito abas persistidas ← EST-29 §1–5 e
  `apps/estaleiro/ui/src/shell/default-layout.ts`.
- Tema claro importado no shell ← `apps/estaleiro/ui/src/App.tsx`.
- Entry React e comandos exatos do pacote ← `apps/estaleiro/ui/src/main.tsx` e `package.json`.
- Gate browser funcional e seus seletores ← EST-33 §4/§7 e
  `apps/estaleiro/e2e/estaleiro.spec.ts`.

### Decidido (arquiteto, 2026-07-12)
- **D-EST35-1:** usar os quatro tokens definidos no §1, fontes locais e nenhum verde, webfont ou
  asset adicional.
- **D-EST35-2:** alterar todas as oito abas; o fatiamento é EST-35b (operacionais) e EST-35c
  (suporte), com os oito rótulos curtos fixados nas regras globais.
- **D-EST35-3:** substituir `light.css` por `alpha_dark.css`, carregar `index.css` depois e anexar
  screenshot Chromium de `1280×720` na evidência da EST-35a.

## 7. Definition of Done (DoD) & Reviewer Checklist
### Gate da casca
Não executar diretamente. O fechamento depende de EST-35a, EST-35b e EST-35c concluídas.

### Verificação automática do passe profundo
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:e2e
```
> **GATE DE EVIDÊNCIA:** Worker e reviewer colam a saída literal dos quatro comandos na Seção 8.
> A decisão D-EST35-3 acrescentará a evidência visual obrigatória, sem substituir esses gates.

### Checklist do Reviewer (passe profundo)
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] EST-35a, EST-35b e EST-35c concluídas e integradas?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test + lint):**
```
(cole aqui a saída real de pnpm build, pnpm test e pnpm lint)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-12T16:31]** - *gpt-5* - `[Decisão pendente]`: D-EST35-1/2/3: referencia visual, escopo de componentes e estrategia/evidencia FlexLayout nao possuem fonte decidida
- **[2026-07-12T16:50]** - *gpt-5* - `[Decomposto]`: decisão: tokens locais e alpha_dark; oito abas fatiadas em EST-35a (shell), EST-35b (operacionais) e EST-35c (suporte)
