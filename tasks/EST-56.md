---
id: EST-56
title: "Investigar: contexto CLAUDE.md/skills nao gera system message no chat (deploy standalone)"
status: done
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
capacity_target: haiku
---

# EST-56 · Investigar: contexto CLAUDE.md/skills nao gera system message no chat (deploy standalone)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
No deploy standalone (o binário usado pelo `test:e2e` do Playwright), ativar o toggle
"CLAUDE.md" ou uma skill no Chat e enviar mensagem **não produz uma mensagem `role: "system"`**
no request enviado ao backend — `chat.spec.ts` casos 18-20 (contrato de EST-47) falham com
`systemMsg` `undefined`. Investigar se é: (a) o `contextReader` construído em
`apps/estaleiro/server.mjs` (via `makeSkills`) não consegue ler `CLAUDE.md`/skills reais no
`cwd` do binário deployado (path resolution diferente do monorepo fonte), (b) um bug real na
rota `POST /api/chat` (`bootstrap.ts` linha ~168, condicional `if (contextReader && context &&
...)`), ou (c) um problema no client (`ChatView.tsx`) que não está enviando `context` de fato
apesar do checkbox marcado. **Esta é uma investigação — o achado pode virar spike ou fix direto
dependendo da causa.**

**Descoberto em 2026-07-18** durante o rework de [EST-53](./EST-53.md): ao rodar
`chat.spec.ts` isoladamente contra o binário standalone (após EST-53/54/55 corrigirem outros
bloqueios de infra), os casos 18 ("CLAUDE.md ligado"), 19 e 20 (seleção de skills) falharam
consistentemente com `expect(systemMsg).toBeDefined()` recebendo `undefined` — ou seja, o
request chega ao mock, mas nenhuma mensagem de sistema é injetada, mesmo com o contexto
supostamente habilitado na UI.

## 2. Contexto RAG (Spec-Driven Development)
- `apps/estaleiro/e2e/chat.spec.ts:100-129,131-168,170-210` — casos 18/19/20, escritos em
  [EST-47](./EST-47.md) (`done`) como parte do contrato original — presumivelmente passavam no
  ambiente/momento em que EST-47 foi revisada; confirmar se a revisão da época rodou o E2E de
  verdade ou só o gate unitário/integração (suspeita, dado que o E2E está quebrado há várias
  tasks por outras razões de infra — ver EST-53/54/55).
- `apps/estaleiro/core/src/bootstrap.ts` (linha ~168, `EST-47.md:168` cita o trecho original)
  — `if (contextReader && context && (context.includeClaudeMd || (context.skillNames ??
  []).length > 0)) { ... buildChatContext(selection, contextReader) ... }` monta a mensagem
  system SOMENTE se `contextReader` truthy E `context` presente no body.
- `apps/estaleiro/server.mjs` — constrói `contextReader` via `makeSkills({ manifest, fs:
  fsPort, bash: bashPort, commit: {...} })`, onde `fsPort = makeFsPort({ cwd: process.cwd() })`
  — **o `cwd` do binário deployado em `estaleiro-run/vN.N.N/backend/` pode não ter
  `CLAUDE.md`/`.claude/skills/` no lugar esperado**, fazendo `readClaudeMd()`/`listSkills()`
  retornarem vazio/erro silencioso.
- `apps/estaleiro/ui/src/views/chat/ChatView.tsx:40-41` — client só inclui `context` no
  payload quando `contextEnabled || selectedSkills.length > 0` — confirmar que o clique no
  checkbox de teste realmente atualiza esse estado antes do envio (poderia ser um problema de
  timing do teste, não do app).
- **Relacionado, não bloqueante:** [EST-55](./EST-55.md) (seed de tasks polui DB do E2E) e
  [EST-54](./EST-54.md) (packaging de `plugin-skills`) são bugs DIFERENTES descobertos na
  mesma sessão — não confundir causas.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `apps/estaleiro/server.mjs` — confirmar construção de `contextReader`/`makeSkills`.
- **[READ]** `apps/estaleiro/core/src/bootstrap.ts` — trecho de `POST /api/chat` que monta a
  mensagem system.
- **[READ]** `apps/estaleiro/ui/src/views/chat/ChatView.tsx` — lógica de `contextEnabled`/
  `selectedSkills` e o payload enviado.
- **[A DEFINIR pelo executor, após diagnóstico]** arquivo(s) a corrigir — depende da causa raiz
  encontrada (path resolution do `cwd`, bug de condicional no backend, ou bug de estado no
  client). **Não adivinhar o arquivo antes de confirmar a causa com um teste isolado
  (`console.log`/inspeção de rede) — esta task começa como investigação, não como fix cego.**

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Playwright (`chat.spec.ts` casos 18-20 já existem e servem de gate).
- [ ] **Diagnóstico inicial obrigatório:** rodar `pnpm --filter @plataforma/estaleiro test:e2e`
  isolando `chat.spec.ts`, capturar o `postDataJSON()` real enviado (já instrumentado no teste
  via `capturedBody`) e inspecionar se `context` está no payload do CLIENTE (prova/descarta
  causa (c)) — se `context` chega no request mas a resposta não tem `system`, a causa é
  server-side (a ou b).
- [ ] **Ambiente do Teste:** binário standalone deployado (mesmo ambiente do bug observado).
- [ ] **Fora de Escopo:** não expandir para outras funcionalidades do chat além do wiring de
  contexto/system message.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO reescreva o contrato de `ChatContextSelection`/`buildChatContext` sem antes confirmar
>   que o problema está ali (pode ser só path resolution do deploy).
> - NÃO mude os specs `chat.spec.ts` 18-20 para "passar de qualquer jeito" — se a causa for um
>   bug real, corrija o app; os testes já estão corretos por design (contrato de EST-47).

### Pegadinhas conhecidas
- O binário deployado roda de um `cwd` diferente do monorepo fonte — qualquer leitura de
  arquivo relativa (`CLAUDE.md`, `.claude/skills/`) pode resolver para um caminho que não
  existe nesse contexto. Confirmar isso ANTES de suspeitar do código de lógica.

1. Rodar `chat.spec.ts` caso 18 isolado, inspecionar `capturedBody` real (adicionar log
   temporário se necessário) para confirmar se `context` chega ao backend.
2. Se `context` chega mas não vira `system` message → investigar `contextReader`/`makeSkills`
   no ambiente deployado (path resolution).
3. Se `context` NÃO chega no request → investigar `ChatView.tsx` (client-side).
4. Corrigir a causa raiz confirmada; re-rodar os 3 casos (18, 19, 20) até verdes.

## 6. Feedback de Especificação (Spec Feedback Loop)
- **Diagnóstico adicional (2026-07-18, mesma sessão do achado):** revisei
  `ChatView.tsx:27-48` e `ChatClient.http.ts:26-34` — o CLIENTE está correto: monta `context:
  { includeClaudeMd, skillNames }` como campo SEPARADO do array `messages` e o envia via
  `fetch("/api/chat", { body: JSON.stringify({ messages, context }) })`. Por design (confirmado
  em `EST-47.md`: "O contexto é montado pelo route handler e injetado" — a mensagem `role:
  "system"` é construída **server-side**, em `bootstrap.ts`, a partir do campo `context`.
  **Os casos 18/19/20 de `chat.spec.ts` usam `page.route("**\/api/chat", ...)`, que intercepta
  o `fetch` NO BROWSER antes de sair para a rede** — ou seja, o servidor real NUNCA processa o
  request nesses testes, e a construção de `system` (que só acontece no route handler) nunca
  roda. **Os testes checam `capturedBody.messages.find(m => m.role === "system")` — isso é
  estruturalmente impossível de ser verdadeiro com esse tipo de mock**, independente de o app
  estar correto ou não.
- **Confirmação de que isso é dívida nunca validada, não regressão:** `EST-47.md` linha 634 do
  seu próprio Log de Execução diz literalmente *"adicionados casos 17-23... E2E não roda por
  @plataforma/shell ausente"* — ou seja, estes 3 casos foram ESCRITOS e a task foi aprovada
  (`done`) sem o E2E jamais ter rodado (bloqueado pelo mesmo bug de CSS que [EST-50](./EST-50.md)
  corrigiu). Esta é a primeira vez que alguém observa o resultado real.
- **Decisão em aberto para quem pegar esta task:** o fix correto é (a) trocar a asserção dos
  casos 18/19/20 para checar `capturedBody.context` (o que o cliente de fato controla e envia)
  em vez de `capturedBody.messages` (que só o servidor real popularia), OU (b) reescrever os
  testes para NÃO mockar `**/api/chat` e em vez disso rodar contra o servidor real com um
  upstream fake (padrão `EST-43a`), provando a integração ponta-a-ponta de verdade. **(b) é mais
  fiel ao objetivo original do teste, (a) é mais barato — escalar via `block_decision` se a
  spec original (EST-47 §4.4) não deixar claro qual foi a intenção.**

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
# Executa a geração do build standalone a partir da raiz do monorepo
node scripts/estaleiro-standalone.mjs
# Executa testes Playwright E2E específicos de chat para verificar os asserts de contexto
pnpm --filter @plataforma/estaleiro test:e2e --grep "contexto"
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal de veredito de investigação e correção da asserção de teste ou mock colada na seção 8. Marcar `[x]` sem evidência é violação.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **Diagnóstico confirmado (§6):** testes 18-20 mockam `page.route("**/api/chat")` no browser, interceptando o fetch antes do servidor. A mensagem `system` é construída server-side (`bootstrap.ts` → `buildChatContext`), nunca roda com esse tipo de mock. As asserções em `capturedBody.messages.find(m => m.role === "system")` eram estruturalmente impossíveis — confirmado pela inspeção do `ChatClient.http.ts` (envia `context` como campo separado de `messages`), `bootstrap.ts` (constroi `system` no route handler), e `ChatView.tsx` (cliente correto, monta `context` via `contextEnabled`/`selectedSkills`).
- **Correção aplicada (opção a):** casos 18-20 corrigidos para verificar `capturedBody.context` (includeClaudeMd/skillNames) em vez de `capturedBody.messages`, seguindo o padrão do caso 23 que já fazia isso corretamente.
- **Gate:** `pnpm gate @plataforma/estaleiro` — build ✅ (15/15 cached), test:integration ✅ (24/24 pass), test:e2e ❌ falha no `@plataforma/estaleiro-ui build` por `@plataforma/shell/index.css` não resolvido (bloqueio pré-existente EST-50/EST-53, não relacionado às alterações desta task).

- **[Desbloqueio 2026-07-18T21:32, claude-sonnet-5]:** causa raiz real era a branch estar cortada da master antes do merge de EST-53 (schema fix/EBUSY/TASKS_DIR ausentes) + `packages/shell/dist` não construído numa worktree fresca (fix isolado via `pnpm --filter` não resolve o grafo de deps) + processo Node zumbi na porta 8899 servindo build antigo (`reuseExistingServer` reaproveitou). Resolvido via `git merge task/EST-53` (traz os fixes, preserva a correção de EST-56) + kill do processo zumbi + rebuild via turbo. Gate final:
```
$ pnpm gate @plataforma/estaleiro
✅ build | exit=0 | 2466ms
✅ test | exit=0 | 69328ms  (16/16 passed — chat.spec.ts 10/10 incl. casos 18-20, config.spec.ts 3/3, estaleiro.spec.ts 3/3)
✅ lint | exit=0 | 726ms
📦 artefato: .gate/0fea1cce111c44f3f1db2c725a74e73997602d0d.json | allGreen=true
```
Branch `task/EST-56` pushada em `1515f58`.

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test + lint):**
```
build ✅ exit=0 (15 tasks, all cached)
test:integration ✅ 5 files / 24 tests passed (chat-route.test.ts, task-api.test.ts, server.test.ts, provider-remote-smoke.test.ts, provider-routes.test.ts)
test:e2e ❌ @plataforma/estaleiro-ui build falha: Cannot resolve @plataforma/shell/index.css (pré-existente, EST-50)
```
- **Comentários de Revisão:**

### Parecer do Reviewer 2 (claude-sonnet-5, independente):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução:** o Parecer anterior está obsoleto (pré-desbloqueio). Diagnóstico e fix
  já documentados em detalhe no Handover acima e no Log §9 (desbloqueio 2026-07-18T21:32-21:35).
  Reexecutei de forma independente o diff de `task/EST-56` contra `origin/master` **após** os
  merges de [EST-53](./EST-53.md)/[EST-54](./EST-54.md)/[EST-55](./EST-55.md):
  ```
  $ git diff origin/master..task/EST-56 --stat
  apps/estaleiro/package.json         | 2 +-  (version, atrás da master — irrelevante)
  apps/estaleiro/playwright.config.ts | 2 +-  (ESTALEIRO_TASKS_DIR já presente na master via EST-55)
  scripts/estaleiro-standalone.mjs    | 4 ++--  (plugin-skills já presente na master via EST-54)
  ```
  **`chat.spec.ts` não aparece no diff — o fix desta task (casos 18-20, `body.context` em vez de
  `body.messages`) já está integralmente presente na master**, herdado via o merge de EST-53 (que
  trouxe `task/EST-56` para dentro de si antes de ser mergeada). O gate `allGreen=true` já
  confirmado nos merges de EST-53/54/55 (16/16 E2E, incl. casos 18-20) cobre exatamente este
  deliverable.
  ```
  $ node scripts/worktree.mjs merge EST-56
  Already up to date.
  ✅ task/EST-56 mergeado em master — nenhum commit novo necessário (conteúdo já presente).
  ```
- **Comentários de Revisão:** Sem BLOCKER/MAJOR. O diagnóstico (§6, opção a — corrigir asserção
  para `context` em vez de `messages`) foi a decisão correta e já está validada em produção do
  código (master). Nenhuma pendência.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-18T19:09]** - *gemini* - `[Triado]`: triando spec
- **[2026-07-18T19:09]** - *gemini* - `[Endurecido]`: endureceu spec
- **[2026-07-18T19:16]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
- **[2026-07-18T19:34]** - *deepseek* - `[Iniciado]`: iniciando investigação de contexto no chat
- **[2026-07-18T19:49]** - *deepseek* - `[Pausado/Handoff]`: Investigação concluída: causa raiz confirmada (§6) — testes mockam page.route antes do servidor. Fix aplicado (opção a): asserções corrigidas para capturedBody.context (padrão caso 23). Gate: build+integration passam (24/24), E2E bloqueado por @plataforma/shell/index.css (pré-existente EST-50/EST-53). Código pushado em task/EST-56 (7404a58).
- **[2026-07-18T19:50]** - *deepseek* - `[Bloqueado]`: E2E bloqueado por @plataforma/shell/index.css (EST-50/EST-53). Investigação concluída + fix aplicado + pushado. Gate: build ✅ integration ✅ (24/24). Reativar quando standalone build do estaleiro-ui funcionar.
- **[2026-07-18T21:32]** - *claude-sonnet-5* - `[Desbloqueado]`: **Causa raiz real não era o CSS.** Diagnóstico: (1) worktree `task/EST-56` foi cortada da master ANTES de [EST-53](./EST-53.md) ser mergeada — herdava o `global-setup.ts` pré-fix (schema drift `no such column: data`) e nenhum dos fixes de EST-54/EST-55 (TASKS_DIR/plugin-skills). O `@plataforma/shell/index.css` "não resolvido" era só `packages/shell/dist/` ausente numa worktree fresca — `pnpm --filter <pkg> build` isolado não constrói o grafo de deps workspace; só `turbo run build` (usado pelo `pnpm gate`) resolve isso. (2) Depois de rebuildar o grafo completo, achei um processo Node **zumbi** na porta 8899 (rodando desde antes desta sessão, servindo o build antigo sem os fixes) — como `reuseExistingServer: !process.env.CI` reaproveita servidor já ativo, o Playwright testava contra o binário velho. **Ação:** `git merge task/EST-53` na branch `task/EST-56` (traz schema fix + EBUSY fix + EST-54/EST-55 já embutidos, preservando a correção própria do EST-56 nos casos 18-20 — `body.context` em vez de `body.messages`), resolvido 1 conflito trivial de version bump, matei o processo zumbi da porta 8899, rebuild completo. **Gate `pnpm gate @plataforma/estaleiro`: allGreen=true, 16/16 testes E2E passando** (chat.spec.ts 10/10 incl. casos 18-20, config.spec.ts 3/3, estaleiro.spec.ts 3/3). Branch pushada (`1515f58`). Devolvendo ao worker (`unblock`) para revisão/finish.
- **[2026-07-18T21:31]** - *claude-sonnet-5* - `[Desbloqueado]`: Desbloqueado: causa raiz era branch cortada antes do merge de EST-53 (schema fix/EBUSY/TASKS_DIR ausentes) + dist/ de packages/shell/ui-engines nao construidos + processo zumbi na porta 8899 servindo build antigo. Fix: merge task/EST-53 + kill do processo zumbi + rebuild via turbo. Gate allGreen=true, 16/16 E2E passando (push 1515f58). Devolvendo ao worker para retomar/finish.
- **[2026-07-18T21:34]** - *claude-sonnet* - `[Iniciado]`: retomando pós-desbloqueio — gate já passou (allGreen)
- **[2026-07-18T21:35]** - *claude-sonnet* - `[Finalizado]`: Gate allGreen: build ✅ test ✅ (16/16, chat.spec.ts 10/10 incl. casos 18-20) lint ✅. Fix: asserções corrigidas para capturedBody.context (padrão caso 23). Branch task/EST-56 @ 1515f58.
- **[2026-07-19T01:08]** - *agile_reviewer:claude-sonnet-5* - `[Em revisão]`: revisando
- **[2026-07-19T01:11]** - *agile_reviewer:claude-sonnet-5* - `[Aprovado]`: Integrado: codigo ja presente na master via merge de EST-53 (worktree.mjs merge confirmou 'already up to date', nenhum commit novo necessario). Gate allGreen=true confirmado nos merges de EST-53/54/55 (16/16 E2E incl. casos 18-20 desta task). Worktree removida. Zero nao-bloqueantes pendentes.
