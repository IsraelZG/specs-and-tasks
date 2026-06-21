# SuperApp Project Rules

Este arquivo define as regras de desenvolvimento do SuperApp, adaptadas do arquivo CLAUDE.md do projeto e das convenções gerais do MGTIA.

## Diretrizes de Ambiente (INVIOLÁVEL)

- **Runtime:** Node.js v20+.
- **Package Manager:** `pnpm` (nunca use `npm` ou `yarn`). O lockfile é `pnpm-lock.yaml`.
- **Monorepo:** Turborepo (`turbo.json` + `pnpm-workspace.yaml` mapeando `packages/*` e `apps/*`).
- **TS:** strict (`tsconfig.base.json` com `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`).
- **Testes:** `vitest` (packages) e `playwright` (E2E/web).
- **Lint:** `eslint` + `typescript-eslint`.
- **Arquitetura da Máquina:** Windows 11 ARM64. O `.npmrc` precisa de `supportedArchitectures` contendo win32+arm64 para build/install pesado.

## Git Worktrees por Task

- O desenvolvimento de tasks ocorre isolado numa git worktree dedicada por task (branch `task/<ID>`), criada pelo helper `pnpm wt new <ID>` no repositório de controle (`Docs`).
- Worktrees ficam localizadas em `C:\Dev2026\.superapp-worktrees\<ID>` (fora do repo, não versionadas).
- Cada worktree tem seu próprio `pnpm install` — não compartilhe `node_modules` via junctions (pode quebrar comandos com `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`).

## Disciplina de Worker (Execução de Tasks)

Como um agente executando tarefas (Worker):

1. **Escopo Estrito:** A Seção 3 da especificação da tarefa (`<Docs>/tasks/<ID>.md`) é o escopo absoluto. Não toque em arquivos fora dela. Não instale libs não autorizadas.
2. **Gate de Evidência (INVIOLÁVEL):** Só finalize a tarefa com a saída literal de `pnpm install && pnpm -r build && pnpm -r test && pnpm -r lint` (Exit Code 0) colada na Seção 8 da especificação da tarefa. Sem evidência = tarefa incompleta.
3. **Gerenciamento de Status por Script:** Transições de status (`start`, `finish`, `pause`, `block`) devem ser feitas **apenas** rodando o script:
   `node "<Docs>/tools/scripts/manage-task.mjs" <ação> <ID> Antigravity "<msg>"`
   NUNCA altere status, `INDEX.md` ou logs de histórico manualmente nos markdowns.
4. **Separação de Papéis:** O Worker NUNCA chama `approve` ou `request_changes` (ações exclusivas do Reviewer). Se o `finish` falhar porque a task já está em `review`, PARE e use `pause`.
5. **Commit duplo:**
   - No repositório do código (`superapp`): push do branch da task (`git push -u origin task/<ID>`).
   - No repositório de controle (`Docs`): commit da spec atualizada (`git -C "<Docs>" add tasks/<ID>.md && git -C "<CTRL>" commit -m "chore(<ID>): review + evidência"`).
