---
id: EST-50
title: "Fix: CSS do @plataforma/shell nao chega ao bundle (tela vazia do Estaleiro)"
status: draft:placeholder
complexity: 1
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: # haiku | sonnet | opus-spike — preenchido no endurecimento (pass 2)
ui: true
# decisions: ["..."]          ← só quando status: draft:pending_decision (espelha a Seção 6)
---

# EST-50 · Fix: CSS do @plataforma/shell nao chega ao bundle (tela vazia do Estaleiro)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
Fazer o CSS de `@plataforma/shell` (incluindo `flexlayout-react/style/alpha_dark.css`, importado em
`workspace-shell.tsx:5`) chegar ao bundle final da UI do Estaleiro. Hoje ele fica preso em
`packages/shell/dist/index.css` e nenhum consumidor importa esse arquivo — o CSS do FlexLayout
nunca chega ao browser, o `.flexlayout__layout`/`.flexlayout__tab` ficam sem altura (colapsam a
0px) e o app renderiza só as tiras de abas, sem nenhuma view visível (nem Chat, nem Board — tela
"vazia"). Diagnóstico completo: comparar `dist/assets/index-*.css` da UI (≈1,2 kB, só tokens do
tema) contra `packages/shell/dist/index.css` (≈19 kB, tema+flexlayout) prova a ausência.

## 2. Contexto RAG (Spec-Driven Development)
- `packages/shell/src/workspace-shell.tsx:5` — `import 'flexlayout-react/style/alpha_dark.css';`
  dentro do pacote `@plataforma/shell` (build vite lib mode extrai isso para `dist/index.css`,
  não injeta no DOM nem reexporta via JS).
- `packages/shell/package.json` — `"exports": { ".": { "import": "./dist/index.js", "types":
  "./dist/index.d.ts" } }` — **sem entrada para o CSS**, então nenhum consumidor consegue
  `import "@plataforma/shell/index.css"` hoje (subpath não declarado).
- `apps/estaleiro/ui/src/main.tsx` — entrypoint real da UI standalone (monta `<App/>` na `#root`);
  hoje só importa `./index.css` (tema do próprio app), nunca o CSS do shell.
- `apps/estaleiro/ui/src/index.css` — tema local (`--bg-dark`, overrides `.flexlayout__*`
  específicos) — depende que as classes base do `alpha_dark.css` já existam no DOM.
- `tasks/EST-45.md` — introduziu o consumo de `@plataforma/shell` (`done`); não cobriu CSS.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/shell/src/workspace-shell.tsx` (confirmar import do CSS do flexlayout).
- **[UPDATE]** `packages/shell/package.json` — adicionar em `exports`:
  `"./index.css": "./dist/index.css"` (subpath export do CSS gerado pelo build).
- **[UPDATE]** `apps/estaleiro/ui/src/main.tsx` — adicionar
  `import "@plataforma/shell/index.css";` ANTES de `import "./index.css";` (ordem importa: tema
  local sobrepõe defaults do flexlayout).
- **[READ]** `apps/estaleiro/ui/vite.config.ts` — confirmar que resolve subpath exports de
  workspace packages sem config extra (vite 8 + node resolution já suporta; se não resolver,
  reportar como achado, não inventar plugin).
- Verificar se outro app consumidor de `@plataforma/shell` (buscar com Grep por
  `@plataforma/shell` em `apps/*/ui/src` ou `apps/*/src`) tem o mesmo problema e precisa do
  mesmo import — escopo desta task é só o Estaleiro, mas reportar achados de outros apps na
  Seção 6 se encontrados (não corrigir fora do escopo).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Playwright (smoke), não há teste de CSS em Vitest/JSDOM que prove isto —
  JSDOM não calcula layout real, o bug só aparece com renderer de browser de verdade.
- [ ] **Ambiente do Teste:** browser real (Playwright/Chromium) contra o build de produção
  (`vite build` + servidor estático), não o dev server.
- [ ] **Fora de Escopo:** não testar pixel-perfect do tema; só que os painéis de conteúdo do
  FlexLayout têm altura > 0 e a aba "Chat" renderiza o `textarea` de composer.
> Esta task afeta UI. `ui: true`. O `agile-reviewer` DEVE subir o app
> (`pnpm --filter @plataforma/estaleiro-ui build` + servir `dist/` num servidor estático, ou usar
> o standalone) e confirmar visualmente que a tela deixou de ficar vazia — não basta ler o diff.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO reescrever `index.css` do Estaleiro nem migrar para CSS Modules/Tailwind — é fora de
>   escopo, o único problema é o CSS do shell não estar chegando ao bundle.
> - NÃO adicionar plugin de CSS extra ao vite se o subpath export já resolver — testar primeiro.
> - NÃO tocar em `packages/shell/src/workspace-shell.tsx` — o import já está correto lá; o
>   problema é de exports/consumo, não de origem.

### Pegadinhas conhecidas
- Vite lib mode por padrão gera 1 arquivo CSS por build (`dist/index.css`ou nome do pacote) —
  confirme o nome real gerado (`ls packages/shell/dist/*.css`) antes de escrever o path no
  `exports` — pode não ser exatamente `index.css`.
- Ordem de import de CSS importa em produção (o vite costuma concatenar na ordem dos imports do
  grafo JS) — importar o CSS do shell ANTES do `index.css` local garante que os overrides
  `.flexlayout__tab_button--selected` etc. do tema Estaleiro vençam os defaults do
  `alpha_dark.css`.
- Depois do fix, rebuildar (`pnpm --filter @plataforma/estaleiro-ui build`) e checar
  `dist/assets/index-*.css` tem >15kB (hoje tem ~1,2kB) como sinal rápido de que o CSS entrou.

1. **[Smoke manual antes]** Reproduzir o bug: buildar a UI hoje, servir `dist/` (`npx serve
   dist` ou similar), abrir no browser, confirmar `.flexlayout__layout` com `height: 0` via
   devtools/computed style.
2. Adicionar subpath export `./index.css` em `packages/shell/package.json`.
3. Rebuildar `packages/shell` (`pnpm --filter @plataforma/shell build`) e confirmar
   `dist/index.css` existe com o conteúdo esperado.
4. Adicionar o import em `apps/estaleiro/ui/src/main.tsx`.
5. Rebuildar a UI e confirmar CSS bundlado cresce (>15kB) e que abrir o app mostra as views
   (Chat como primeira aba, `textarea` visível).
6. Escrever/ajustar smoke Playwright que assert layout tem altura real (ver §4).

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado — causa raiz e fix confirmados manualmente em sessão de
  diagnóstico 2026-07-18: anexar `packages/shell/dist/index.css` ao bundle da UI e recarregar
  fez o app renderizar por completo (Chat, textarea, botão Enviar, resposta real do DeepSeek).]*

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?
- [ ] **[gate de wiring — se a task entrega primitiva de autorização/privacidade]** existe caller de produção em `src/**` que a consome no caminho real, OU há task de integração linkada? (primitiva só testada = feature NÃO entregue)
- [ ] **[gate de acoplamento — se a task adiciona import cruzando pacote]** o import respeita a direção `protocol ← crypto ← core ← transport` (`visao-arquitetural.md §1`) e NÃO fecha ciclo?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter <pacote> build      # tsc — precisa terminar sem erro
pnpm --filter <pacote> test       # precisa ficar verde, sem regressão
pnpm --filter <pacote> lint       # ZERO erros novos (rode o baseline ANTES de tocar; regressão de lint bloqueia no review)
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

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
