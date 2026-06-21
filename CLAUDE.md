# SuperApp — Código do Produto

> **Repo de CÓDIGO (greenfield).** As specs, tasks, RFCs, wiki e a ferramenta MGTIA vivem no
> **repo irmão `specs-and-tasks`** (pasta `C:\Dev2026\Docs`). Este repo só contém **produto**.
> A spec de cada task está em `<Docs>/tasks/<ID>.md` — ela é a fonte da verdade. Aqui não há
> conceitos/cadernos/RFCs; se precisar de contexto de arquitetura, leia a spec e os `[[links]]`
> que ela aponta no repo de controle.

## Ambiente (INVIOLÁVEL)

- **Runtime:** Node.js v20+.
- **Package Manager:** `pnpm` — **nunca** npm ou yarn (o lockfile é `pnpm-lock.yaml`).
- **Monorepo:** Turborepo (`turbo.json` + `pnpm-workspace.yaml` mapeando `packages/*` e `apps/*`).
- **TS:** estrito (`tsconfig.base.json` com `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`).
- **Testes:** `vitest` (packages) e `playwright` (E2E/web).
- **Lint:** `eslint` + `typescript-eslint`.
- **Leia `PITFALLS.md` do repo de controle** antes de rodar build/install pesado — esta é máquina
  Windows 11 ARM64; o `.npmrc` precisa de `supportedArchitectures` win32+arm64.
- **Build é Windows-native** (WSL/opencode abandonado — worktree e `node_modules` do WSL quebram no
  Windows; ver PITFALLS P-007). Rode o agente/Gate num **terminal standalone** (não o integrado do
  VS Code, que trava em `pnpm install` — P-002).
- **pnpm 11 bloqueia build scripts:** aprovação é `allowBuilds:` (mapa `pkg: true`) no
  `pnpm-workspace.yaml` — não `onlyBuiltDependencies` (ver PITFALLS P-006).

## Worktrees por task

O desenvolvimento roda **isolado numa git worktree por task** (branch `task/<ID>`), criada pelo
helper `pnpm wt new <ID>` que mora **no repo de controle (Docs)** e opera **sobre este repo**.
As worktrees ficam em `C:\Dev2026\.superapp-worktrees\<ID>` (fora do repo, não versionadas).
Cada worktree tem seu próprio `pnpm install` (~8s, store quente) — **não** compartilhe `node_modules`
via junction (o `pnpm run` aborta com `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`).

## Disciplina do Worker

Se você é um agente executando uma task, siga **`/executar-task <ID>`** (skill em
`.claude/skills/executar-task/`). Em resumo:

1. **A Seção 3 da spec é o escopo absoluto.** Não toque arquivos fora dela. Não instale libs de
   feature fora do que a spec lista.
2. **Gate de Evidência (INVIOLÁVEL):** só finalize com a saída **literal** de
   `pnpm install && pnpm -r build && pnpm -r test && pnpm -r lint` (Exit Code 0) colada na Seção 8
   da spec. Sem evidência = não terminou. Falhou? Conserte antes — nunca finalize no escuro.
3. **Status só pelo serviço:** transições de task (`start`/`finish`/`pause`/`block`) vão por
   `node "<Docs>/tools/scripts/manage-task.mjs" <ação> <ID> <SeuNome> "<msg>"`. **NUNCA** edite
   `status`/`INDEX.md`/Log na mão, mesmo com o ambiente quebrado — falha de ambiente é um BLOCKER
   (`pause`/`block`), não desculpa pra contornar.
4. **Separação de papéis:** o Worker **NUNCA** chama `approve`/`request_changes` — isso é exclusivo
   do Reviewer. Se `finish` falhar porque a task já está em `review`, **PARE** e use `pause`.
5. **Dois commits:** código aqui (`git push -u origin task/<ID>`); status + evidência no controle
   (`git -C "<Docs>" add tasks/<ID>.md && commit`). O `.nexus/` é gitignored.

> A revisão de QA é feita **no repo de controle** (`/qa-review <ID>`), por um agente revisor de
> **modelo diferente** do que codou (evita pontos cegos correlacionados). Você não revisa o que
> você mesmo escreveu.
