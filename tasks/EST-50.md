---
id: EST-50
title: "Fix: CSS do @plataforma/shell nao chega ao bundle (tela vazia do Estaleiro)"
status: in_progress
complexity: 1
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: haiku
ui: true
# decisions: ["..."]          ← só quando status: draft:pending_decision (espelha a Seção 6)
---

# EST-50 · Fix: CSS do @plataforma/shell nao chega ao bundle (tela vazia do Estaleiro)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku *(2 arquivos, wiring mecânico, zero novidade algorítmica)*

## 1. Objetivo
Fazer o CSS de `@plataforma/shell` (incluindo `flexlayout-react/style/alpha_dark.css`, importado em
`workspace-shell.tsx:5`) chegar ao bundle final da UI do Estaleiro. Hoje ele fica preso em
`packages/shell/dist/index.css` e nenhum consumidor importa esse arquivo — o CSS do FlexLayout
nunca chega ao browser, o `.flexlayout__layout`/`.flexlayout__tab` ficam sem altura (colapsam a
0px) e o app renderiza só as tiras de abas, sem nenhuma view visível (nem Chat, nem Board — tela
"vazia"). Diagnóstico completo: comparar `dist/assets/index-*.css` da UI (≈1,2 kB, só tokens do
tema) contra `packages/shell/dist/index.css` (≈19 kB, tema+flexlayout) prova a ausência.

## 2. Contexto RAG (Spec-Driven Development)

**Endurecimento — derivado com fonte:**
- `packages/shell/src/workspace-shell.tsx:5` — `import 'flexlayout-react/style/alpha_dark.css';`
  (confirmado: linha 5 do arquivo atual). Vite lib mode extrai para `dist/index.css`.
- `packages/shell/vite.config.ts` → `build.rollupOptions.output.assetFileNames: 'index[extname]'`
  — confirma que o CSS gerado se chama **`index.css`** (não outro nome).
- `packages/shell/package.json` → `exports` tem só `"."` (JS + types), **sem entrada CSS**.
  `import "@plataforma/shell/index.css"` falha com resolução estrita de `exports`.
- `packages/shell/dist/index.css` — **existe** (~19 kB), contém `alpha_dark.css` integral
  (variáveis `--color-*`, seletores `.flexlayout__*`). Verificado em 2026-07-18.
- `apps/estaleiro/ui/src/main.tsx:4` — `import "./index.css";` é o único import de CSS.
  Não há import do CSS do shell em lugar nenhum do app.
- `apps/estaleiro/ui/src/index.css` — overrides `.flexlayout__*` (linhas 30–62) dependem
  das classes base do `alpha_dark.css` para funcionar (`.flexlayout__layout` sem `height`
  colapsa a 0px sem o base).
- `apps/estaleiro/ui/vite.config.ts` — config mínima (`plugins: [react()]`), sem `resolve.alias`
  nem config CSS especial. Vite 5 honra `exports` do `package.json` nativamente.
- `apps/estaleiro/ui/package.json` — `"@plataforma/shell": "workspace:*"` já declarado.
- **Único consumidor** de `@plataforma/shell` no monorepo: `apps/estaleiro/ui/` (em `App.tsx:2-3`
  e `shell/default-layout.ts:1`). Nenhum outro app afetado.
- `tasks/EST-45.md` (`done`) — introduziu o consumo do shell; não cobriu CSS.

**Aberto:** nenhum.

## 3. Escopo de Arquivos (Inputs e Outputs)

- **[READ]** `packages/shell/src/workspace-shell.tsx` — confirmar `import 'flexlayout-react/style/alpha_dark.css'` na linha 5 (não modificar).
- **[READ]** `packages/shell/vite.config.ts` — confirmar `assetFileNames: 'index[extname]'` (não modificar).
- **[READ]** `packages/shell/dist/index.css` — confirmar que existe e contém estilos flexlayout (não modificar).
- **[UPDATE]** `packages/shell/package.json` — adicionar subpath export `"./index.css"` no campo `exports`. Diff exato:
  ```json
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./index.css": "./dist/index.css"
  }
  ```
- **[UPDATE]** `apps/estaleiro/ui/src/main.tsx` — inserir `import "@plataforma/shell/index.css";`
  **antes** da linha 4 (`import "./index.css";`). Ordem importa: o CSS do shell (base) deve
  vir antes do tema local (overrides). Resultado esperado:
  ```tsx
  import { createElement } from "react";
  import { createRoot } from "react-dom/client";
  import App from "./App.js";
  import "@plataforma/shell/index.css";
  import "./index.css";
  ```
- **[READ]** `apps/estaleiro/ui/vite.config.ts` — confirmar que resolve subpath exports sem
  config extra (vite 5 + node resolution). Se não resolver, reportar como achado, não inventar
  plugin.
- **Outros consumidores:** buscar `@plataforma/shell` em `apps/*/src` — hoje só o Estaleiro
  importa (verificado). Se outro app existir no futuro, precisará do mesmo import.

## 4. Estratégia de Testes Estrita (Test-Driven Development)

**Framework:** Vitest (unit/import) — suficiente para este fix. JSDOM não calcula layout real,
mas o teste aqui é de **resolução de módulo** (o subpath export funciona?) e **presença no
bundle** (o build inclui o CSS?), não de renderização visual.

> **Nota:** a spec original mencionava Playwright, mas o Estaleiro UI não tem Playwright
> configurado (não há `playwright.config.ts` nem `e2e/`). Os testes existentes são Vitest
> (`tests/smoke.test.ts` etc.). Configurar Playwright só para esta verificação seria
> over-engineering — o build-gate + verificação de tamanho do bundle cobrem o risco.

**Casos de teste (enumerados):**

1. **Subpath export resolves:** `import '@plataforma/shell/index.css'` não lança erro quando
   resolvido pelo Node/bundler (testar via `vitest` no pacote shell ou como parte do smoke
   do Estaleiro). Framework: Vitest, ambiente: Node.
2. **Shell build gera CSS:** após `pnpm --filter @plataforma/shell build`, o arquivo
   `packages/shell/dist/index.css` existe e tem tamanho >10 kB.
3. **Estaleiro build inclui CSS:** após `pnpm --filter @plataforma/estaleiro-ui build`,
   o arquivo `apps/estaleiro/ui/dist/assets/index-*.css` tem tamanho >15 kB (antes do fix:
   ~1,2 kB; depois: >19 kB = 19 kB shell + overrides locais).
4. **Smoke importável:** teste Vitest existente (`tests/smoke.test.ts`) continua passando —
   o novo import não quebra o entrypoint.

**Verificação visual (reviewer):** o `agile_reviewer` DEVE subir o app
(`pnpm --filter @plataforma/estaleiro-ui build` + servir `dist/` com `npx serve dist/`, ou
standalone) e confirmar visualmente que a tela deixou de ficar vazia — painéis FlexLayout
visíveis, aba Chat com textarea. Não basta ler o diff.

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
# 1. Rebuildar o shell (garantir que dist/index.css existe)
pnpm --filter @plataforma/shell build

# 2. Build + test + lint do pacote afetado (Estaleiro UI)
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint

# 3. Smoke: confirmar tamanho do bundle CSS (>15 kB = CSS do shell incluído)
#    Antes do fix: ~1,2 kB. Depois: >19 kB.
ls -la apps/estaleiro/ui/dist/assets/index-*.css
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
- **[2026-07-18T11:36]** - *claude-sonnet* - `[Reconciliado]`: status restaurado de draft:placeholder para draft:hardened (drift corrigido)
- **[2026-07-18T11:37]** - *claude-sonnet* - `[Promovida p/ ready]`: auto-promovivel: hardened + deps todas done (nenhuma dep)
- **[2026-07-18T12:55]** - *minimax* - `[Iniciado]`: iniciando
