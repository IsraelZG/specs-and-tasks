---
id: EST-78
title: "TaskService sobre markdown: fonte unica de verdade e sync multi-maquina por git"
status: ready
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
test_profile: backend # backend | ui | full — sem browser: troca de storage backend + shell-out
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: ["EST-81"] # IDs de tarefas que esta bloqueia
capacity_target: sonnet # haiku | sonnet | opus-spike
---

# EST-78 · TaskService sobre markdown: fonte unica de verdade e sync multi-maquina por git

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest`
- **Capacidade-alvo:** `sonnet` — troca mecânica de backend de storage, contratos já existem, zero decisão de arquitetura em aberto.

## 1. Objetivo

Hoje o Estaleiro guarda tasks em **SQLite** (`estaleiro.db`), populado **uma vez no boot** a partir de
`Docs/tasks/*.md` (`apps/estaleiro/core/src/seed.ts`), em **sentido único**. Consequência verificada:

> **toda transição feita pelo Estaleiro é invisível para o git, para o `manage-task.mjs`, para o
> `INDEX.md` e para a outra máquina.** Já existem duas fontes de verdade divergindo.

Isso bloqueia frontalmente o objetivo de sincronizar duas máquinas por git. Esta task **elimina o
SQLite como storage de tasks** e faz o `TaskServicePort` operar direto sobre os markdowns de
`Docs/tasks/`, delegando a escrita ao `manage-task.mjs` (que já é o dono dos guards, do §9 e do
INDEX) e enfileirando/flushando o commit via `fila.mjs`.

Resultado: **markdown = fonte única**; **git = mecanismo de sync multi-máquina**; **frontmatter
`machine:` = consciência de quem está fazendo o quê**. Nenhum mecanismo novo é introduzido.

## 2. Contexto RAG (Spec-Driven Development)
- [x] `CLAUDE.md` → seção "MGTIA — Gestão de Tarefas": fonte canônica, verbos, ciclo de vida, e a
      regra INVIOLÁVEL "Paralelismo no controle" (agentes não rodam git no Docs; enfileiram).
- [x] `tools/scripts/manage-task.mjs` — **comportamento canônico vivo** das transições (guards,
      escrita do §9, regeneração do INDEX). Uso: `node manage-task.mjs <verbo> <TaskID> <Ator> [msg]`.
- [x] `tools/scripts/fila.mjs` — `add <taskId> "<msg>" [paths...]` / `flush [Ator]` / `ls`.
- [x] `apps/estaleiro/core/src/seed.ts` — **já sabe parsear** o frontmatter YAML de `tasks/*.md`
      para o tipo `Task`. É a base do novo `listTasks`, não código a jogar fora.
- [x] `packages/plugin-tasks/src/service.ts` — `StorageBackend` e `TaskServicePort` (contratos a preservar).
- [x] `packages/plugin-tasks/src/storage/sqlite.ts` — o que sai.
- [ ] ⛔ **NÃO** citar `apps/nexus-backend/**` como fonte (nexus congelado, CLAUDE.md).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `tools/scripts/manage-task.mjs`, `tools/scripts/fila.mjs` (repo Docs — contratos de CLI)
- **[READ]** `apps/estaleiro/core/src/seed.ts` (parser de frontmatter a reaproveitar)
- **[READ]** `packages/plugin-tasks/src/service.ts`, `schema.ts`, `stateMachine.ts`, `guards/**`
- **[CREATE]** `packages/plugin-tasks/src/storage/markdown.ts` — `createMarkdownStorageBackend(opts)`
- **[CREATE]** `packages/plugin-tasks/tests/markdown-storage.test.ts`
- **[UPDATE]** `packages/plugin-tasks/src/index.ts` — exportar o novo backend
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts` — trocar `createSqliteStorageBackend` por
  `createMarkdownStorageBackend`; **remover a chamada `seedDatabase`** (linhas ~109-110: o seed
  perde o sentido quando o markdown É o storage)
- **[UPDATE]** `apps/estaleiro/e2e/global-setup.ts`, `apps/estaleiro/tests/integration/server.test.ts`,
  `apps/estaleiro/tests/integration/task-api.test.ts` — fixtures passam a ser um diretório temporário
  de `.md`, não um `estaleiro.db`
- **[DELETE]** `packages/plugin-tasks/src/storage/sqlite.ts` **apenas a parte de `tasks`**
  ⚠️ a tabela `epics` continua em SQLite (ver §5, passo 5). Se o arquivo ficar só com epics, mantenha-o.
- **[DELETE]** `apps/estaleiro/core/src/seed.ts` + `apps/estaleiro/core/tests/seed.test.ts`
  *(a lógica de parse migra para `markdown.ts`; git guarda o histórico — CLAUDE.md/Wiki)*

**Fora de escopo:** `mcp-config-store.ts`, `conversation-store.ts`, `profile-store.ts` e demais
stores continuam em `estaleiro.db` intocados. Esta task só move **tasks**.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser).
- [x] **Ambiente do Teste:** diretório temporário (`node:fs.mkdtemp`) com 3-4 `.md` de fixture. O
      shell-out é **injetado** (`runManageTask?: (args: string[]) => Promise<string>`) para que o
      teste unitário não dependa do repo Docs real.
- [x] **Casos obrigatórios:**
  1. `listTasks()` retorna todas as tasks do diretório, com `status`/`dependencies`/`machine` corretos.
  2. `listTasks({ prefix: 'EST' })` filtra; `listTasks({ status: 'ready' })` filtra.
  3. `getTask(id)` inexistente → `null`.
  4. `transition(id, 'start', ator)` **invoca `manage-task.mjs start <id> <ator> <msg>`** com os
     argumentos exatos (spy) e **relê o markdown** para devolver o `Task` atualizado.
  5. `manage-task.mjs` saindo com código ≠ 0 → o erro **propaga** (não é engolido). Guard de
     regressão: o `dispatcher.executeDispatch` tem `catch {}` silencioso — o erro precisa chegar lá
     com mensagem útil.
  6. Arquivo sem frontmatter válido → ignorado no `listTasks`, **não derruba** a listagem inteira.
  7. Após transição bem-sucedida, `fila.mjs add` **e** `fila.mjs flush` foram chamados nessa ordem.
  8. Concorrência: duas `transition()` simultâneas em tasks **diferentes** ambas persistem (o
     `manage-task.mjs` é o serializador; o teste prova que não há cache em memória sobrescrevendo).
- [x] **Fora de Escopo:** testar o interior do `manage-task.mjs` (é do repo Docs, já coberto lá);
      testar push real para o remote.

## 5. Instruções de Execução (Step-by-Step)

> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** reimplemente em TypeScript a escrita de frontmatter/§9/INDEX. Isso duplicaria os guards
>   (identidade, evidência, papéis) e criaria a terceira fonte de verdade. Shell-out no `manage-task.mjs`.
> - **NÃO** mantenha um cache em memória das tasks entre requests. A outra máquina altera o markdown
>   por trás; ler do disco a cada `listTasks` é o comportamento correto (é I/O local de ~550 arquivos,
>   medido em ms). Se virar gargalo, otimize com `mtime`, não com cache cego.
> - **NÃO** rode `git commit`/`push` direto. Use `fila.mjs` (regra INVIOLÁVEL do CLAUDE.md). O
>   Estaleiro assume o papel de **consumidor serial** enquanto está rodando.
> - **NÃO** toque nos outros stores do `estaleiro.db`.

### Pegadinhas conhecidas
- `manage-task.mjs` **recusa** verbos fora do papel (worker não chama `approve`) e exige evidência
  de gate no `finish`. O `TaskService.transition` vai passar a falhar em casos onde o SQLite deixava
  passar — **isso é o ponto**, não um bug. Ajuste as fixtures de teste, não os guards.
- O ator (`<SeuNome>`) precisa ser o **modelo real**, e `approve`/`request_changes` exigem o prefixo
  `agile_reviewer:` (CLAUDE.md, identidade do agente). O `actorFromModel()` do dispatcher já corta
  o prefixo de provider — verifique se o resultado passa no `assertValidModelIdentity`.
- O `Task` do `schema.ts` tem `section0..section9`. O `seed.ts` preenche tudo com `""`. Mantenha
  isso: o board não usa as seções, e parsear 550 markdowns inteiros a cada listagem é desperdício.
  **Exceção:** `getTask(id)` (um arquivo só) **deve** preencher as seções — o Task Inspector (EST-72)
  e o contexto de `get-task` dependem disso.
- Caminho do repo Docs: derive de env (`DOCS_DIR`) com default `path.resolve(codeRepo, '..', 'Docs')`,
  espelhando o que o `get-task.mjs` já faz com `SUPERAPP_DIR`. Não hardcode `C:\Dev2026\Docs`.
- `epics` **não têm markdown**. Mantenha o backend de epics em SQLite e componha os dois:
  `createMarkdownStorageBackend({ tasksDir, epicStorage })`. `inferEpicId()` já deriva o épico do
  prefixo do id — a tabela só guarda os épicos criados à mão.

### Passos
1. **[TDD]** Escreva `packages/plugin-tasks/tests/markdown-storage.test.ts` com os 8 casos do §4.
2. Crie `markdown.ts` com a assinatura:
   ```ts
   export interface MarkdownStorageOptions {
     /** Diretório dos markdowns (ex.: <Docs>/tasks). */
     tasksDir: string;
     /** Raiz do repo Docs — cwd do manage-task.mjs / fila.mjs. */
     docsRoot: string;
     /** Backend de epics (SQLite). */
     epicStorage: Pick<StorageBackend, "getEpic" | "listEpics" | "saveEpic" | "deleteEpic">;
     /** Injetável p/ teste. Default: execFile de `node tools/scripts/<script>`. */
     runScript?: (script: "manage-task.mjs" | "fila.mjs", args: string[]) => Promise<string>;
   }
   export function createMarkdownStorageBackend(opts: MarkdownStorageOptions): StorageBackend;
   ```
3. Migre o parser de frontmatter do `seed.ts` para `markdown.ts` (mover, não copiar) e adicione o
   campo `machine` ao `Task` do `schema.ts` (`machine?: string`) — é o que dá consciência
   multi-máquina ao board.
4. `saveTask` do `StorageBackend` **não faz sentido** aqui (o markdown só muda por verbo). Implemente
   lançando `Error("saveTask: use transition() — markdown é escrito pelo manage-task.mjs")`. O
   `service.ts` chama `saveTask` dentro de `transition` — **refatore `service.ts`** para que o
   backend markdown assuma a transição inteira (adicione `transition?` opcional ao `StorageBackend`;
   quando presente, o `service.ts` delega e pula guards+saveTask, porque o `manage-task.mjs` já os roda).
5. Após transição OK: `fila.mjs add <id> "<verbo>(<id>): <msg>"` seguido de `fila.mjs flush <ator>`.
   Falha do flush (ex.: sem rede) **não** deve reverter a transição — logue e siga (o markdown já
   está correto em disco; o próximo flush pega).
6. Troque o wiring no `bootstrap.ts`, remova `seedDatabase`, ajuste os testes de integração e e2e.
7. `pnpm gate estaleiro-core --profile backend` e `pnpm gate plugin-tasks --profile backend`.

## 6. Feedback de Especificação (Spec Feedback Loop)
- **Decisão tomada (registrada, não em aberto):** shell-out no `manage-task.mjs` em vez de
  reimplementar a escrita em TS. Custo: ~80ms de processo por transição e acoplamento do Estaleiro
  aos scripts do Docs. Benefício: **um** lugar com os guards, o §9 e o INDEX — o oposto do bug que
  esta task existe para matar. Se o arquiteto preferir a reimplementação em TS, isso vira
  `draft:pending_decision` **antes** de começar, não no meio.
- Se ao ler o `manage-task.mjs` o worker achar que algum verbo usado pelo dispatcher (`start`,
  `claim`) tem pré-condição que o Estaleiro não consegue satisfazer → **PARE** e `pause` com o caso concreto.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `estaleiro.db` **não tem mais** a tabela `tasks` sendo lida/escrita no caminho de produção.
- [ ] Uma transição feita pela API do Estaleiro **altera o `.md` em disco** e aparece em `git log`.
- [ ] `listTasks()` reflete uma alteração feita **fora** do processo (edite um `.md` à mão, recarregue).
- [ ] O erro do `manage-task.mjs` propaga com mensagem legível (não vira `catch {}` mudo).
- [ ] `pnpm gate plugin-tasks --profile backend` e `pnpm gate estaleiro-core --profile backend` verdes.
- [ ] Linter limpo.
- [ ] Nenhum `git commit`/`push` direto no código — só via `fila.mjs`.

### Verificação automática
```bash
pnpm gate plugin-tasks --profile backend
```

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
- **[2026-07-27T15:55]** - *claude-opus* - `[Triado]`: spec escrita a partir da auditoria do Estaleiro 2026-07-27
- **[2026-07-27T15:56]** - *claude-opus* - `[Endurecido]`: spec executavel: assinaturas, casos de teste, pegadinhas e DoD por comando
- **[2026-07-27T15:56]** - *claude-opus* - `[Promovida p/ ready]`: deps vazias, spec fechada
