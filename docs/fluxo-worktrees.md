# Fluxo de Worktrees por Task

> **MODELO DOIS-REPOS (2026-06-17).** Este repo (`specs-and-tasks`/`Docs`) é o **controle**
> (specs, tasks, ledger, ferramenta). O **código do produto** vive no repo **`superapp`** (irmão,
> `C:\Dev2026\superapp`). O `pnpm wt` roda **aqui (Docs)** mas cria worktrees **do superapp** em
> `C:\Dev2026\.superapp-worktrees/<ID>`. O worker lê a spec + rastreia status no `Docs` e
> implementa/commita/pusha o código no `superapp` (ver skill `/executar-task`). Aponte o repo de
> código com `SUPERAPP_DIR` (default `../superapp`). **As menções a `.nexus-worktrees`/`master` e
> "mesmo repo" abaixo são do modelo antigo single-repo — a fonte operativa é
> [worktree.mjs](../tools/scripts/worktree.mjs) + a skill.**

Cada task do SuperApp roda **isolada numa git worktree** (branch `task/<ID>`), e o worker
(opencode/DeepSeek) é despachado **manualmente** ali dentro. Helper: `pnpm wt`
([tools/scripts/worktree.mjs](../tools/scripts/worktree.mjs)).

> Decisão (2026-06-17): este é o fluxo de desenvolvimento ativo. A orquestração automática
> (Nexus runner + Headroom por task) ficou de lado por baixo retorno. O `pnpm nexus` (backend+
> frontend+Headroom) existe e funciona, mas não é pré-requisito deste fluxo.

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm wt new <ID>`   | cria a worktree em `../.nexus-worktrees/<ID>` na branch `task/<ID>`, roda `pnpm install` (~8s, store quente) e imprime o comando `opencode run --dir ...` pronto |
| `pnpm wt ls`         | lista as worktrees ativas |
| `pnpm wt merge <ID>` | `git merge --no-ff task/<ID>` em master (exige repo principal **limpo** e em **master**) |
| `pnpm wt rm <ID>`    | remove a worktree (a branch `task/<ID>` é **preservada**) |

## Multi-máquina (2026-06-22)

> Hoje rodamos em **duas máquinas** (ARM64 com WSL/abandonado e x64 nativo) contra o **mesmo
> remote**. Diferente do modelo antigo (single-repo, single-máquina), o checkout local pode estar
> **desatualizado** a qualquer momento — a outra máquina pode ter pushado tasks, mergeado, ou
> avançado o ledger. **Nunca presuma que o seu `master`/`Docs` local é o mais recente.**
>
> `pnpm wt new` e `pnpm wt merge` agora fazem `git fetch` + `pull --ff-only` automaticamente no
> `Docs` e no `superapp` antes de agir, e **abortam** (em vez de seguir desatualizados) se houver
> divergência ou mudanças não commitadas — nesse caso resolva manualmente (`git pull`/rebase) antes
> de tentar de novo. Ainda assim, **dê `git pull` manualmente em ambos os repos ao começar uma
> sessão de trabalho** (antes mesmo de rodar `pnpm wt`), e sempre que alternar de máquina.

## Passo a passo

1. **Sincronize antes de começar:** `git -C Docs pull` e `git -C superapp pull` (ou deixe o
   `pnpm wt new` fazer isso por você — mas confirme que não há "divergente" no output).
2. **Criar:** `pnpm wt new T-MK-01`
   → copie o comando impresso (path nativo do Windows, ex.: `<repo>\..\.superapp-worktrees\T-MK-01`).
3. **Despachar o worker:** cole o `opencode run --dir "<path>" "<prompt da task>"`.
   O worker trabalha isolado na branch `task/T-MK-01`, sem tocar o master nem outras tasks.
4. **Gate de Evidência:** dentro da worktree, o `pnpm --filter <pkg> build` / `test` roda normal
   (node_modules nativo da worktree). Worker cola a saída literal antes de finalizar.
5. **Integrar:** com o master limpo, `pnpm wt merge T-MK-01` (sincroniza o superapp antes de
   mesclar). **Depois do merge, `git push origin master` no superapp** — o script não pusha por
   você, e até o push a outra máquina não vê o merge.
6. **Limpar:** `pnpm wt rm T-MK-01` (e `git branch -D task/T-MK-01` se não quiser mais a branch).
7. **Commit + push do controle:** o `manage-task.mjs` (via skill `/executar-task`) altera
   `tasks/<ID>.md` no `Docs` — commit e `git push` lá também, senão a outra máquina não vê o status
   atualizado do ledger.

## Notas de ambiente

- **`pnpm install` na worktree leva ~8s** (store global quente) — é o caminho correto/pnpm-nativo.
- **NÃO** funciona "compartilhar" o `node_modules` via junction/symlink do repo principal: o `tsc`
  até resolve, mas `pnpm run` faz `runDepsStatusCheck`, acha tudo fora de sync e aborta
  (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). Por isso cada worktree tem seu `pnpm install`.
- Worktrees ficam **fora do repo** (`<repo>/../.nexus-worktrees/`), não versionadas.
- Conflito no `merge` → resolva manualmente no repo principal (o script avisa e para).
