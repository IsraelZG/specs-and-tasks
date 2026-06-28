# Fluxo de Worktrees por Task

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

## Passo a passo

1. **Criar:** `pnpm wt new T-MK-01`
   → copie o comando impresso (já com o path WSL `/mnt/c/Dev2026/.nexus-worktrees/T-MK-01`).
2. **Despachar o worker** (no WSL): cole o `opencode run --dir <path> "<prompt da task>"`.
   O worker trabalha isolado na branch `task/T-MK-01`, sem tocar o master nem outras tasks.
3. **Gate de Evidência:** dentro da worktree, o `pnpm --filter <pkg> build` / `test` roda normal
   (node_modules nativo da worktree). Worker cola a saída literal antes de finalizar.
4. **Integrar:** com o master limpo, `pnpm wt merge T-MK-01`.
5. **Limpar:** `pnpm wt rm T-MK-01` (e `git branch -D task/T-MK-01` se não quiser mais a branch).

## Notas de ambiente

- **`pnpm install` na worktree leva ~8s** (store global quente) — é o caminho correto/pnpm-nativo.
- **NÃO** funciona "compartilhar" o `node_modules` via junction/symlink do repo principal: o `tsc`
  até resolve, mas `pnpm run` faz `runDepsStatusCheck`, acha tudo fora de sync e aborta
  (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). Por isso cada worktree tem seu `pnpm install`.
- Worktrees ficam **fora do repo** (`<repo>/../.nexus-worktrees/`), não versionadas.
- Conflito no `merge` → resolva manualmente no repo principal (o script avisa e para).
