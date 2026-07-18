---
id: EST-51
title: "Fix: server.mjs serve ui/ cru em vez de ui/dist"
status: in_progress
complexity: 1
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
capacity_target: haiku
ui: true
---

# EST-51 · Fix: server.mjs serve ui/ cru em vez de ui/dist

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku

## 1. Objetivo
`apps/estaleiro/server.mjs:7` define `UI_DIR` apontando para `./ui/` (pasta de **código-fonte**
da UI — `index.html` de dev com `<script type="module" src="/src/main.tsx">`, um `.tsx` que o
browser não executa cru). O correto é apontar para `./ui/dist/` (build de produção do Vite).
Rodar `node server.mjs` no monorepo nunca serviu um app funcional — só o deploy standalone
(via `scripts/estaleiro-standalone.mjs`) funcionava porque copia `ui/dist` para outro layout e
faz patch da string. Corrigir ambos: o `server.mjs` local E o patch literal do standalone.

## 2. Contexto RAG (Spec-Driven Development)
- `apps/estaleiro/server.mjs:7` — `const UI_DIR = fileURLToPath(new URL("./ui/",
  import.meta.url));` — aponta para fonte, não para `./ui/dist/`.
- `apps/estaleiro/core/src/bootstrap.ts:~524` (`serveUiFile`) — recebe `uiDir` e serve
  estáticos com fallback para `index.html`; não sabe diferença entre fonte e build.
- `apps/estaleiro/ui/vite.config.ts` — `outDir: 'dist'`, `emptyOutDir: true` (confirmado).
- `apps/estaleiro/package.json` — `"start": "node server.mjs"`, sem `prestart`.
- `scripts/estaleiro-standalone.mjs:209-212` — faz `.replace()` literal buscando
  `` `fileURLToPath(new URL("./ui/", import.meta.url))` `` e substituindo por
  `` `fileURLToPath(new URL("../ui/", import.meta.url))` ``. Se a string fonte mudar e o
  replace não for atualizado, o patch **não casa** e o standalone quebra silenciosamente
  (server.mjs deployado aponta para `./ui/dist/` que não existe no layout standalone).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `apps/estaleiro/server.mjs` — linha 7: trocar `"./ui/"` por `"./ui/dist/"`.
- **[UPDATE]** `scripts/estaleiro-standalone.mjs` — linha 210: trocar a string de busca do
  `.replace()` de `` `fileURLToPath(new URL("./ui/", import.meta.url))` `` para
  `` `fileURLToPath(new URL("./ui/dist/", import.meta.url))` ``. A string de substituição
  (linha 211) **NÃO muda** — continua `` `fileURLToPath(new URL("../ui/", import.meta.url))` ``
  porque no layout standalone os arquivos já estão em `<DEST>/ui/` (sem subpasta `dist/`).
- **[READ]** `apps/estaleiro/ui/vite.config.ts` — confirmar `outDir: 'dist'` (não mudar).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- **Framework:** verificação manual + `test:integration` existente.
- **Ambiente:** Node.js v20+, browser para verificação visual.
- **Casos de verificação:**
  1. `pnpm --filter @plataforma/estaleiro-ui build` → confirmar `apps/estaleiro/ui/dist/index.html` existe.
  2. `pnpm --filter @plataforma/estaleiro start` → abrir `http://localhost:8899/` → página
     carrega (JS/CSS compilados, não `.tsx` cru nem 404).
  3. `pnpm --filter @plataforma/estaleiro test:integration` → verde, sem regressão.
- **Fora de escopo:** não alterar Playwright E2E, não alterar `ui/src`, não adicionar
  bundler/dev-server novo (Vite dev server, HMR).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO adicionar script `prestart` no `package.json` — o worker deve buildar a UI manualmente
>   antes de `pnpm start` (documentar no handover). Evitar side-effect surpresa de rebuild em
>   todo start.
> - NÃO remover ou alterar `apps/estaleiro/ui/src` (fonte).
> - NÃO alterar a lógica do `estaleiro-standalone.mjs` além da string de busca do `.replace()`
>   da linha 210.

### Pegadinhas conhecidas
- `ui/dist/` só existe após build — se testar `pnpm start` sem buildar antes, verá 404 e pode
  concluir erroneamente que o fix falhou. Sempre buildar a UI primeiro.
- O `.replace()` do standalone é **literal** (não regex) — se a string de busca não casar
  exatamente, o patch é silently skipped e o deploy quebra.

### Passos
1. Buildar UI: `pnpm --filter @plataforma/estaleiro-ui build` → confirmar `ui/dist/index.html`.
2. Editar `apps/estaleiro/server.mjs:7`:
   ```js
   // antes
   const UI_DIR = fileURLToPath(new URL("./ui/", import.meta.url));
   // depois
   const UI_DIR = fileURLToPath(new URL("./ui/dist/", import.meta.url));
   ```
3. Editar `scripts/estaleiro-standalone.mjs:210`:
   ```js
   // antes
   `fileURLToPath(new URL("./ui/", import.meta.url))`,
   // depois
   `fileURLToPath(new URL("./ui/dist/", import.meta.url))`,
   ```
   A linha 211 (replacement) **NÃO muda**.
4. Rodar `pnpm --filter @plataforma/estaleiro test:integration` → confirmar verde.
5. Rodar `pnpm --filter @plataforma/estaleiro start` → abrir `http://localhost:8899/` no
   browser → confirmar página carrega (JS/CSS compilados).
6. Rodar `pnpm --filter @plataforma/estaleiro lint` → zero erros novos.

## 6. Feedback de Especificação (Spec Feedback Loop)
- **Divergência detectada no endurecimento:** a spec original (placeholder) dizia "NÃO alterar
  `scripts/estaleiro-standalone.mjs`". Investigando, o standalone faz `.replace()` literal
  buscando a string exata `fileURLToPath(new URL("./ui/", import.meta.url))` (linha 209-212).
  Mudar `server.mjs` sem atualizar essa string de busca faz o patch falhar silenciosamente —
  o deploy standalone quebra. A correção é mecânica (uma string literal) e não altera a
  *lógica* do standalone — apenas a string que ele busca para substituir. Incluido como
  `[UPDATE]` na Seção 3.
- **Relacionada:** EST-50 — sem o fix de CSS, a tela pode parecer vazia mesmo servindo o
  `dist` certo. Independente, não é dependência de bloqueio.

## 7. Definition Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (Seção 3)?
- [ ] `pnpm --filter @plataforma/estaleiro test:integration` roda sem erros?
- [ ] `pnpm --filter @plataforma/estaleiro lint` — ZERO erros novos?
- [ ] A implementação respeita as regras "NÃO FAZER" da Seção 5?
- [ ] Verificação manual: `pnpm start` serve UI compilada em `http://localhost:8899/`?
- [ ] O `.replace()` do standalone (linha 210) foi atualizado para casar com a nova string?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/estaleiro build        # tsc — precisa terminar sem erro
pnpm --filter @plataforma/estaleiro test:integration  # precisa ficar verde, sem regressão
pnpm --filter @plataforma/estaleiro lint          # ZERO erros novos
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
(cole aqui a saída real de pnpm build, pnpm test:integration e pnpm lint)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-18T12:04]** - *qwen3.7-plus* - `[Promovida p/ ready]`: promovido: hardened sem deps, pronto para execução
- **[2026-07-18T12:55]** - *deepseek* - `[Iniciado]`
