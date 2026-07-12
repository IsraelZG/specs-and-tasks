---
id: EST-36
title: "Importar tasks markdown para SQLite e persistir DB no Docs"
status: review
complexity: 3
target_agent: coder_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: # haiku | sonnet | opus-spike — preenchido no endurecimento (pass 2)
# decisions: ["..."]          ← só quando status: draft:pending_decision (espelha a Seção 6)
---

# EST-36 · Importar tasks markdown para SQLite e persistir DB no Docs

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Criar um inicializador (`seed.ts`) que lê todas as tasks em markdown do diretório de controle (`Docs/tasks/*.md`), realiza parse do frontmatter, e as importa para o SQLite. O banco de dados `estaleiro.db` deve ser persistido fora da pasta efêmera de build (`estaleiro-run`), garantindo a preservação do estado entre execuções do script standalone.

## 2. Contexto RAG (Spec-Driven Development)
- `packages/plugin-tasks/src/sqlite.ts` (Implementação do storage backend atual)
- `packages/plugin-tasks/src/service.ts` (TaskServicePort, `saveTask`)
- `packages/plugin-tasks/src/schema.ts` (Formato exato de `Task`)
- `AGENTS.md` (Regra ponytail: evitar dependências excessivas se regex bastar)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `apps/estaleiro/core/package.json`
  - Adicionar a dependência `"yaml": "^2.3.0"` ou usar parse nativo se preferível. (Como parse manual de YAML complexo é frágil, instale `"yaml"` em `dependencies`).
- **[CREATE]** `apps/estaleiro/core/src/seed.ts`
  - Exportar: `export async function seedDatabase(taskService: TaskServicePort, tasksDirPath: string): Promise<void>`
  - Lógica: Listar arquivos `.md`, extrair o frontmatter entre `---`, parsear via `yaml`, mapear propriedades (ex.: `id`, `title`, `status`) para a interface `Task` (de `@plataforma/plugin-tasks/schema`), preenchendo as seções (strings vazias se omitido) e salvando via `taskService.transition` ou injetando silenciosamente via `storage.saveTask` (se mockar o storage for impossível, adicione um endpoint ou use método direto). Nota: usar um backend port para salvar é mais robusto.
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts`
  - Na função `createBootstrap(opts)`, receber um novo parâmetro opcional em `BootstrapOptions`: `tasksDir?: string`.
  - Antes de retornar a interface `BootstrapInstance`, verificar se `await taskService.listTasks()` está vazia. Se estiver, e `opts.tasksDir` for fornecido, chamar `seedDatabase(taskService, opts.tasksDir)`.
- **[UPDATE]** `scripts/estaleiro-standalone.mjs`
  - Alterar a resolução de `DB_PATH` e injetar `tasksDir`.
  - Definir que o SQLite seja salvo em `../../../Docs/estaleiro.db` (em relação ao diretório onde o repositório Superapp estiver rodando o script).
  - Passar `tasksDir` apontando para `../../../Docs/tasks`.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest para Node puro (`apps/estaleiro/core/tests/seed.test.ts`).
- [x] **Casos de Teste Enumerados:**
  1. `seedDatabase` lê arquivos `EST-*.md` simulados, recorta o frontmatter corretamente e salva as Tasks via `taskService`.
  2. Arquivos sem frontmatter válido são ignorados ou logados sem quebrar a inicialização.
  3. `createBootstrap` aciona `seedDatabase` **apenas** se `taskService.listTasks()` retornar um array vazio.
- [x] **Ambiente do Teste:** Node puro, utilizando in-memory mock de `TaskServicePort` e mock de `fs/promises`.
- [x] **Fora de Escopo:** Não é necessário testar a gravação real de SQLite, apenas os contratos (Ports).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO utilize expressões regulares simples e frágeis para parsear strings YAML multilinhas se a biblioteca `yaml` for mais segura.
> - NÃO apague arquivos existentes do banco SQLite a cada boot. Se ele já contiver dados (persistido em `Docs/`), o seeder NÃO deve sobreescrever.

### Pegadinhas conhecidas
- `seedDatabase` não pode emitir transições na state machine (`transition`) para tarefas `done`, pois o status inicial no markdown pode violar regras se não houver payload real. Recomendação: Expor um método `forceImportTask(task: Task)` na service ou instanciar `storage` e injetar os dados diretamente na tabela pulando a state machine durante o seeder. 

1. **[TDD]** Crie `seed.test.ts` mockando `fs` e `taskService`.
2. Implemente `seedDatabase` em `seed.ts`.
3. Ajuste `bootstrap.ts` e o script standalone `estaleiro-standalone.mjs`.

## 6. Feedback de Especificação (Spec Feedback Loop)
- **Aberto (Decisão):** O seeder vai injetar as tasks importadas chamando a State Machine, ou diretamente no Storage Bypass? *Decidido nesta spec: Bypass ou método force-import, já que tasks fechadas (`done`) não podem ser re-criadas via transição nominal.* (Fonte: `service.ts` validations).

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O script standalone persiste `estaleiro.db` fora da worktree (ex: repo Docs)?
- [ ] O mock DB é preenchido no primeiro boot caso as tasks originais estejam disponíveis?
- [ ] O `pnpm test` roda sem erros em `estaleiro-core`?
- [ ] Linter (`pnpm lint`) não acusa problemas em `estaleiro-core`?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Criada a dependência para ler o `yaml` nativamente.
- O mock do SQLite foi ajustado injetando diretamente o _storage no TaskService.
- Configurado o standalone para resolver paths a partir do diretório onde for iniciado.

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução:**
```
$ tsc
$ vitest run

 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/est-36/apps/estaleiro/core

 ✓ tests/run-service.test.ts (1 test) 88ms
 ✓ tests/commit.test.ts (7 tests) 3839ms
 ✓ tests/workflow-runtime.integration.test.ts (8 tests) 221ms
 ✓ tests/workflow-composer.test.ts (10 tests) 441ms
 ✓ tests/bash.test.ts (3 tests) 557ms
 ✓ tests/harness-ws.test.ts (4 tests) 262ms
 ✓ tests/bootstrap.test.ts (7 tests) 128ms
 ✓ tests/factory.test.ts (8 tests) 103ms
 ✓ tests/network.test.ts (2 tests) 27ms
 ✓ tests/seed.test.ts (2 tests) 11ms
 ✓ tests/fs.test.ts (3 tests) 6ms
 ✓ tests/manifest.test.ts (5 tests) 4ms
 ✓ tests/events.test.ts (2 tests) 4ms
 ✓ tests/store.test.ts (2 tests) 3ms

 Test Files  14 passed (14)
      Tests  64 passed (64)
   Start at  14:32:09
   Duration  12.63s

$ eslint src/
```

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-12T17:13]** - *Antigravity* - `[Triado]`: triado
- **[2026-07-12T17:14]** - *Antigravity* - `[Endurecido]`: endureceu spec
- **[2026-07-12T17:21]** - *Antigravity* - `[Promovida p/ ready]`: promovendo task endurecida
- **[2026-07-12T17:22]** - *Antigravity* - `[Iniciado]`: iniciando
- **[2026-07-12T17:34]** - *Antigravity* - `[Finalizado]`: Implementado seed de SQLite, injetado standalone paths. Gate de evidência passou: 64 testes rodados.
