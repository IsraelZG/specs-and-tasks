---
id: EST-53
title: "Fix: global-setup do E2E Playwright quebrado (better-sqlite3 db.prepare) mascara regressoes de UI"
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

# EST-53 · Fix: global-setup do E2E Playwright quebrado (better-sqlite3 db.prepare) mascara regressoes de UI

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
O E2E Playwright do Estaleiro (`apps/estaleiro/e2e/*.spec.ts`) está falhando no `globalSetup` há
várias tasks seguidas (EST-46, EST-47, EST-48c todas registraram isso como "falha de infra
pré-existente, não relacionada"), e por isso o gate de evidência mais forte que existe para UI —
o único que abre um browser de verdade — não está rodando. **Esta task corrige a causa raiz
exata** (já isolada, não é mais "algo com better-sqlite3 db.prepare" genérico) e destrava o E2E
para voltar a pegar regressões como a tela vazia diagnosticada em EST-50.

**Causa raiz confirmada (2026-07-18):** `apps/estaleiro/e2e/global-setup.ts` cria manualmente uma
tabela `tasks` com um schema de colunas largas (legado, `title`/`status`/`complexity`/...) e
insere via `storage.saveTask()` do `@plataforma/plugin-tasks`. Mas
`createSqliteStorageBackend()` (`packages/plugin-tasks/src/storage/sqlite.ts:5-9`) espera um
schema **totalmente diferente**: `tasks(id TEXT PRIMARY KEY, data TEXT NOT NULL)` — um blob JSON
por linha, não colunas largas. Seu `db.exec(SCHEMA)` usa `CREATE TABLE IF NOT EXISTS`, que é
**no-op** porque `global-setup.ts` já criou a tabela `tasks` (com outro shape) antes de chamar
`createSqliteStorageBackend(db)`. Quando `storage.saveTask()` roda
`INSERT INTO tasks (id, data) VALUES (?, ?)`, o SQLite rejeita: `SqliteError: no such column:
data`. Reproduzido isoladamente nesta sessão invocando `globalSetup()` direto (fora do Playwright)
— stack trace exato:
```
SqliteError: no such column: data
    at Database.prepare (.../better-sqlite3/lib/methods/wrappers.js:5:21)
    at createSqliteStorageBackend (.../packages/plugin-tasks/dist/src/storage/sqlite.js:9:24)
    at Module.globalSetup (apps/estaleiro/e2e/global-setup.ts:35:19)
```
Ou seja: **não é um bug do better-sqlite3, é schema drift** entre um `CREATE TABLE` manual
obsoleto no test setup e o schema real que `plugin-tasks` usa desde que migrou para storage
JSON-blob (provavelmente EST-21 "StorageBackend durável"). Bônus: o próprio `global-setup.ts` já
importa `unlinkSync, existsSync` de `node:fs` no topo mas **nunca os chama** — sinal de que a
intenção original era apagar o DB antigo antes de recriar e ficou incompleta.

## 2. Contexto RAG (Spec-Driven Development)
- `apps/estaleiro/e2e/global-setup.ts:1-91` — arquivo com o bug; linhas 8-33 fazem o
  `CREATE TABLE`/`DELETE FROM tasks` manual incompatível; linha 35 chama
  `createSqliteStorageBackend(db)`; linhas 38-88 montam 2 tasks de seed (`E2E-01` ready, `E2E-02`
  in_progress) no shape de colunas largas; linha 87 chama `storage.saveTask(task)` (com
  `@ts-ignore` — sinal de que o shape já não batia com o tipo `Task` esperado).
- `packages/plugin-tasks/src/storage/sqlite.ts:5-53` — **fonte canônica do schema real**:
  `SCHEMA` (linhas 5-10) = `tasks(id TEXT PRIMARY KEY, data TEXT NOT NULL)`; `saveTask` (linha
  48-51) faz `JSON.stringify(task)` inteiro na coluna `data`; `getTask`/`listTasks` fazem
  `JSON.parse(r.data)`. **Task NÃO precisa mapear para colunas SQL — é serializada inteira.**
- `packages/plugin-tasks/src/schema.ts` — tipo `Task` real esperado por `saveTask`/`getTask`
  (**ler antes de montar os objetos de seed** — o shape usado hoje em `global-setup.ts` linhas
  38-60 pode não bater 1:1 com `Task`, dado o `@ts-ignore` na linha 86).
- `apps/estaleiro/playwright.config.ts:12` — `globalSetup: './e2e/global-setup.ts'`;
  `webServer.command` sobe `estaleiro-run/v${pkg.version}/backend/server.mjs` (o build
  standalone, não `apps/estaleiro/server.mjs` direto — **não confundir com EST-51**, que corrige
  o server.mjs do monorepo; o E2E usa outro binário, já empacotado).
- `apps/estaleiro/e2e-test.db` — arquivo de DB do E2E; se sobreviver entre execuções com o
  schema legado quebrado já criado nele, o bug persiste mesmo depois do fix de código (SQLite
  não recria tabela existente). **O fix precisa garantir que o DB comece limpo a cada run.**

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `apps/estaleiro/e2e/global-setup.ts`:
  1. No início da função, se `existsSync(dbPath)` → `unlinkSync(dbPath)` (usar os imports que já
     existem e estão órfãos) — garante DB limpo a cada run, sem schema legado sobrevivendo.
  2. Remover o bloco manual `db.exec(\`CREATE TABLE ...\`)` (linhas 9-33) — a tabela correta é
     criada por `createSqliteStorageBackend(db)` (chamada já existe na linha 35).
  3. Reconstruir os objetos de seed `E2E-01`/`E2E-02` para bater com o tipo `Task` real de
     `packages/plugin-tasks/src/schema.ts` (ler o tipo primeiro — não adivinhar). Remover o
     `@ts-ignore` da chamada `storage.saveTask(task)` — se o `@ts-ignore` continuar necessário
     depois do reshape, é sinal de que o shape ainda está errado.
  4. Manter os `id`s `E2E-01`/`E2E-02` e os status `ready`/`in_progress` — specs de E2E existentes
     (`apps/estaleiro/e2e/*.spec.ts`) podem depender desses IDs/status; **grep por `E2E-01` e
     `E2E-02`** nos specs antes de mudar qualquer coisa nesses valores.
- **[READ]** `apps/estaleiro/e2e/*.spec.ts` (todos) — confirmar quais specs dependem do shape/IDs
  do seed antes de reshapear.
- **NÃO tocar** em `packages/plugin-tasks/src/storage/sqlite.ts` — o schema real ali está correto;
  o bug é só no consumidor (`global-setup.ts`).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Playwright — a prova de sucesso desta task é o **próprio E2E rodando**.
- [ ] **Ambiente do Teste:** `pnpm --filter @plataforma/estaleiro test:e2e` (que já dispara
  `pretest:e2e` → builda a UI + roda `scripts/estaleiro-standalone.mjs` para gerar o binário que
  o `webServer` do Playwright sobe).
- [ ] **Métricas/Cobertura:** todos os specs existentes em `apps/estaleiro/e2e/` devem PASSAR
  (não só o `globalSetup` não lançar erro — os testes que dependem dos dados semeados precisam
  encontrar `E2E-01`/`E2E-02` corretamente).
- [ ] **Fora de Escopo:** não escrever novos specs E2E nesta task — só destravar os existentes.
  Se algum spec falhar por razão NÃO relacionada a este bug (ex.: tela vazia de EST-50 ainda não
  corrigida), documentar como achado separado na Seção 6, não tentar corrigir aqui.
> `ui: false` — esta task não muda UI, só a infra de teste que valida UI. Mas o **resultado**
> (E2E verde) é o que vai proteger UI daqui pra frente — dependência lógica forte com EST-50/EST-51
> (rodar depois delas, ou os specs vão falhar por causa da tela vazia, não por este bug).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO alterar o schema de `packages/plugin-tasks/src/storage/sqlite.ts` — ele está correto,
>   é a fonte da verdade.
> - NÃO adicionar um `try/catch` silencioso em volta de `storage.saveTask()` para "engolir" o
>   erro — o objetivo é os dados serem semeados corretamente, não esconder a falha.
> - NÃO deletar `apps/estaleiro/e2e-test.db` manualmente uma única vez como "fix" — o fix tem que
>   ser o `global-setup.ts` se auto-limpar a cada run (senão o bug volta na próxima execução com
>   DB persistido).

### Pegadinhas conhecidas
- `CREATE TABLE IF NOT EXISTS` é traiçoeiro: se a tabela já existe com schema diferente, o
  `IF NOT EXISTS` faz o `CREATE` virar no-op silencioso — não lança erro na hora de criar, só
  mais tarde quando uma query referencia uma coluna que não existe. Isso é exatamente o que
  mascarou este bug por várias tasks.
- Depois de reshapear os objetos de seed para o tipo `Task` real, **specs existentes podem
  quebrar** se eles leem campos do shape antigo (ex.: acessam `task.status` direto de uma
  resposta HTTP — isso deve continuar funcionando, já que a API pública provavelmente expõe o
  `Task` serializado; mas se algum spec faz assunção sobre colunas SQL específicas, vai falhar) —
  rodar o E2E completo, não só assumir que compilar é suficiente.
- Esta task depende logicamente de [EST-50](./EST-50.md) e [EST-51](./EST-51.md) estarem
  concluídas para o E2E ficar 100% verde (senão os specs que verificam conteúdo visual da UI vão
  falhar por causa da tela vazia, não por este bug de seed). Se rodar antes delas, é esperado
  que o `globalSetup` pare de falhar mas alguns specs de UI ainda falhem — documentar isso como
  esperado, não como falha desta task.

1. Ler `packages/plugin-tasks/src/schema.ts` para confirmar o shape exato de `Task`.
2. Grep por `E2E-01`/`E2E-02` em `apps/estaleiro/e2e/*.spec.ts` para levantar dependências.
3. Editar `global-setup.ts`: usar `unlinkSync`/`existsSync` já importados para limpar o DB antes
   de abrir; remover o `CREATE TABLE`/`DELETE FROM` manual; reshapear os 2 objetos de seed para
   o tipo `Task` real; remover o `@ts-ignore`.
4. Rodar `pnpm --filter @plataforma/estaleiro test:e2e` e colar a saída completa (não só "passou"
   — quantos specs, quais falharam se algum falhar por razão externa a esta task).
5. Se algum spec falhar por causa de EST-50/EST-51 ainda não estarem prontas, documentar
   explicitamente quais e por quê na Seção 8 (handover), para o reviewer não confundir com
   regressão desta task.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado — causa raiz isolada e reproduzida isoladamente em sessão de
  diagnóstico 2026-07-18 (stack trace completo em §1). Substitui o rótulo genérico "falha de
  infra pré-existente: better-sqlite3 db.prepare" usado em EST-46/EST-47/EST-48c pela causa
  exata: schema drift entre `global-setup.ts` (legado, colunas largas) e
  `createSqliteStorageBackend` (atual, blob JSON).]*

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
