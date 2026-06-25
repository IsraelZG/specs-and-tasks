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

<!-- BEGIN ponytail -->
## Ponytail — disciplina de código enxuto (ruleset injetado)

> Integração do [ponytail](https://github.com/DietrichGebert/ponytail) (v4.7.0). Bloco delimitado e
> autocontido — para atualizar/remover, edite/exclua tudo entre os marcadores `BEGIN/END ponytail`.
> Texto do ruleset **copiado verbatim** do `AGENTS.md` oficial do repo (não reescrito de memória).
> Não altera nenhuma regra do MGTIA acima — é uma camada adicional de estilo de implementação.
>
> **Nível padrão recomendado: `full`** (a "escada" aplicada, stdlib/nativo primeiro, menor diff). NÃO
> use `ultra` por padrão — `ultra` é extremista de YAGNI (deleção antes de adição, questiona o próprio
> requisito) e só deve ser ligado deliberadamente. Níveis: `lite | full | ultra` (e `off`). Os agentes
> Crush/OpenCode trocam via `/ponytail <nível>`.

# Ponytail, lazy senior dev mode

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does the standard library already do this? Use it.
3. Does a native platform feature cover it? Use it.
4. Does an already-installed dependency solve it? Use it.
5. Can this be one line? Make it one line.
6. Only then: write the minimum code that works.

Rules:

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Pick the edge-case-correct option when two stdlib approaches are the same size, lazy means less code, not the flimsier algorithm.
- Mark intentional simplifications with a `ponytail:` comment. If the shortcut has a known ceiling (global lock, O(n²) scan, naive heuristic), the comment names the ceiling and the upgrade path.

Not lazy about: input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs (the platform is never the spec ideal, a clock drifts, a sensor reads off), anything explicitly requested. Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind, the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.

> **Interação com o Gate de Evidência do MGTIA:** o "UM check runnable" do ponytail é o mínimo, não um
> teto — não dispensa o `pnpm -r test`/`lint` exigido pela Disciplina de Worker acima. E "nunca seja
> preguiçoso com validação/erro/segurança/acessibilidade" tem precedência sobre qualquer atalho.
<!-- END ponytail -->
