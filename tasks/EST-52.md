---
id: EST-52
title: "Fix: imports relativos sem extensao .js em core/testkit quebram Node ESM no standalone"
status: draft:placeholder
complexity: 2
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: # haiku | sonnet | opus-spike — preenchido no endurecimento (pass 2)
# decisions: ["..."]          ← só quando status: draft:pending_decision (espelha a Seção 6)
---

# EST-52 · Fix: imports relativos sem extensao .js em core/testkit quebram Node ESM no standalone

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
`packages/core/src/index.ts` e `packages/testkit/src/index.ts` (+ `SimNetwork.ts`) têm imports
relativos SEM extensão `.js` (ex.: `export { KeyVault } from './keyVault';`). TypeScript/vitest/vite
resolvem isso via resolução de módulo de bundler (tudo verde nos testes), mas o **Node.js ESM
puro exige a extensão do arquivo emitido** — rodar `node` direto contra o `dist/` compilado
(`tsc`) quebra com `ERR_MODULE_NOT_FOUND` antes mesmo de abrir a porta. É o que impede
`apps/estaleiro/server.mjs` (que importa `@plataforma/estaleiro-core`, que importa
`@plataforma/core`) de subir localmente fora do pipeline de deploy standalone. Corrigir os
imports para incluir `.js` (a extensão do arquivo COMPILADO, mesmo a partir de um `.ts` fonte —
convenção padrão de projetos TS com `"module": "NodeNext"`/ESM).

## 2. Contexto RAG (Spec-Driven Development)
- **Lista exaustiva dos imports a corrigir** (confirmada por grep em 2026-07-18, `packages/core/src`
  e `packages/testkit/src`):
  - `packages/core/src/index.ts:7-8` — `from './keyVault'` (×2, export + export type)
  - `packages/core/src/index.ts:10-11` — `from './hlc'` (×2)
  - `packages/core/src/index.ts:82-83` — `from './sqliteStorage'` (×2)
  - `packages/core/src/index.ts:85` — `from './sqliteWasmStorage'` (×1)
  - `packages/testkit/src/index.ts:1` — `from './clock'`
  - `packages/testkit/src/index.ts:2` — `from './random'`
  - `packages/testkit/src/index.ts:3-4` — `from './SimNetwork'` (×2)
  - `packages/testkit/src/index.ts:10` — `from './assertions'`
  - `packages/testkit/src/index.ts:11` — `from './psRegex'`
  - `packages/testkit/src/index.ts:13-14` — `from './playwright'` (×2)
  - `packages/testkit/src/SimNetwork.ts:2` — `from './clock'`
  **Total: 16 statements de import/export em 2 arquivos.** Rode
  `grep -nE "from ['\"]\.\.?/[a-zA-Z0-9_/-]+['\"];" packages/core/src/index.ts
  packages/testkit/src/index.ts packages/testkit/src/SimNetwork.ts` para reconfirmar antes de
  editar (a lista pode ter mudado desde o diagnóstico).
- `packages/core/tsconfig.json` / `packages/testkit/tsconfig.json` — confirmar `"module"` e
  `"moduleResolution"` configurados; se já forem `NodeNext`/`Node16`, o `tsc` DEVERIA acusar erro
  nesses imports sem extensão — se não acusa, pode ser que o build use outra config; investigar e
  reportar em vez de assumir.
- Precedente de fix idêntico (não commitado, feito manualmente em sessão de diagnóstico
  2026-07-18 direto no `dist/` compilado como prova de causa): adicionar `.js` a cada import
  relativo destravou `node apps/estaleiro/server.mjs`.
- `apps/estaleiro/server.mjs` — consumidor final que hoje falha com
  `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../packages/core/dist/keyVault' imported
  from '.../packages/core/dist/index.js'`.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `packages/core/src/index.ts` — adicionar `.js` aos 4 specifiers relativos listados
  em §2 (linhas 7, 8, 10, 11, 82, 83, 85 — 7 statements).
- **[UPDATE]** `packages/testkit/src/index.ts` — adicionar `.js` aos specifiers listados (linhas
  1, 2, 3, 4, 10, 11, 13, 14 — 8 statements).
- **[UPDATE]** `packages/testkit/src/SimNetwork.ts` — adicionar `.js` ao import de `./clock`
  (linha 2 — 1 statement).
- **[READ]** demais arquivos `.ts` de `packages/core/src/**` e `packages/testkit/src/**` — se o
  grep revelar imports relativos extensionless adicionais fora dos 3 arquivos listados (o
  diagnóstico cobriu só os barrels `index.ts` + 1 arquivo interno), corrigi-los também — o
  objetivo final é `node` conseguir importar `@plataforma/core` e `@plataforma/testkit`
  compilados sem `ERR_MODULE_NOT_FOUND`, não só "esses 16 statements".
- **NÃO tocar** em nenhum outro pacote nesta task — se o mesmo padrão existir em
  `packages/protocol`, `packages/crypto`, etc., reportar como achado na Seção 6 (possível task de
  follow-up), não expandir o escopo aqui.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** `pnpm --filter @plataforma/core test` e `pnpm --filter @plataforma/testkit
  test` (Vitest — devem continuar 100% verdes, é uma correção sintática que não muda
  comportamento).
- [ ] **Prova real do fix (obrigatória, não é só o gate de build):** depois de buildar
  (`pnpm --filter @plataforma/core build && pnpm --filter @plataforma/testkit build`), rodar
  `node -e "import('@plataforma/core').then(m => console.log(Object.keys(m)))"` a partir da raiz
  do monorepo (ou script equivalente) e confirmar que resolve sem `ERR_MODULE_NOT_FOUND`. Repetir
  para `@plataforma/testkit`. Colar a saída no handover.
- [ ] **Prova de ponta a ponta:** `cd apps/estaleiro && node server.mjs` (com
  `apps/estaleiro/ui/dist` populado — rode o build da UI antes se necessário) deve conseguir
  iniciar e imprimir `Estaleiro: http://localhost:...` SEM lançar `ERR_MODULE_NOT_FOUND` — mesmo
  que a página ainda não esteja 100% funcional por causa de EST-50/EST-51 (que podem não estar
  concluídas ainda), o processo Node não deve morrer no import.
- [ ] **Fora de Escopo:** não é preciso testar UI nem browser — esta task é puramente sobre
  resolução de módulos ESM no Node.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO mudar a lógica de nenhum módulo — é edição mecânica de specifiers de import/export.
> - NÃO trocar `moduleResolution`/`module` no `tsconfig.json` para "resolver o problema de outro
>   jeito" — a convenção do monorepo (ver outros pacotes que já funcionam em standalone, ex.
>   `apps/estaleiro/core/src`) é escrever `.js` no import mesmo apontando para um `.ts` fonte;
>   seguir o padrão existente, não inventar um novo.
> - NÃO expandir para outros pacotes além de `core`/`testkit` sem reportar antes (ver §3).

### Pegadinhas conhecidas
- `export type { ... } from './x'` também precisa do `.js` — é fácil esquecer as linhas de
  `export type` porque "não é um import de valor", mas o resolvedor ESM trata o specifier igual.
- Depois de editar `.ts`, é preciso **rebuildar** (`pnpm --filter <pkg> build`) para o `dist/`
  refletir a mudança — testar contra um `dist/` velho vai mascarar tanto sucesso quanto falha.
- Se algum arquivo importar um diretório (`from './foo'` onde `foo` é pasta com `index.ts`), a
  extensão correta não é `foo.js` e sim `foo/index.js` — checar caso a caso, não aplicar `.js`
  cegamente por regex sem confirmar que o arquivo alvo existe.

1. Reconfirmar a lista de imports extensionless com o grep de §2 (pode ter mudado).
2. Editar os 3 arquivos listados em §3, adicionando `.js` a cada specifier relativo.
3. Rebuildar `@plataforma/core` e `@plataforma/testkit`.
4. Rodar as provas de §4 (import isolado via `node -e`, depois `node server.mjs`) e colar as
   saídas no handover.
5. Rodar o gate padrão (build + test + lint dos 2 pacotes).

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado — causa raiz e fix confirmados manualmente em sessão de
  diagnóstico 2026-07-18: patch ad-hoc nos `.js` de `dist/` (não commitado) destravou o boot do
  `server.mjs`. Este spec pede a correção correta na fonte `.ts`.]*
- Se o grep de reconfirmação (passo 1) encontrar o mesmo padrão em outros pacotes do monorepo
  além de `core`/`testkit`, registrar aqui como achado para uma task de follow-up — não expandir
  esta task.

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
