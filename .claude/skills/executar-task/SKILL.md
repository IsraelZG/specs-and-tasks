---
name: executar-task
description: Ciclo completo de execução de uma task MGTIA por um Worker no modelo DOIS-REPOS (controle=specs-and-tasks/Docs; código=worktree do superapp). Lê a spec e rastreia status no controle, implementa/commita/pusha o código no superapp, roda o Gate, finaliza pra review. NUNCA aprova nem inventa.
---

# Executar Task $ARGUMENTS

Você é um **Worker**. Há **DOIS repos**:
- **CONTROLE** (`<CTRL>`) = o repo `specs-and-tasks` (pasta `Docs`; default `C:\Dev2026\Docs`). Tem a
  **spec**, o **ledger** e o `manage-task.mjs`. O caminho exato do `manage-task.mjs` foi **impresso
  pelo `pnpm wt new`** — use-o onde aparecer `<CTRL>/...`.
- **CÓDIGO** = a **sua pasta atual** (a worktree do `superapp`, já na branch `task/$ARGUMENTS`). É
  onde você **implementa, commita e pusha**.

Use seu identificador (ex.: `DeepSeek`) onde aparecer `<EU>` — **nunca** `agile_reviewer`.

## Contrato inegociável
- A **spec é a fonte da verdade**. Leia `<CTRL>/tasks/$ARGUMENTS.md` INTEIRA antes de codar.
- **NUNCA** edite `status`/`INDEX.md`/Log na mão — só via `manage-task.mjs` (no `<CTRL>`).
- Você **NUNCA** chama `approve`/`request_changes` (Regra 6). Só `start`/`finish`/`pause`/`block`.
- Spec ambígua/contraditória/impossível → `pause`/`block` com o motivo. **Não invente.**

## Passo a passo
1. **Prontidão:** `<CTRL>/tasks/$ARGUMENTS.md` deve estar `status: ready`. Se `draft` → **PARE**
   (precisa endurecer — `/endurecer-task`). Se `review`/`done` → **PARE** (não reexecute).
2. **Branch:** você já está na worktree do `superapp`, na branch `task/$ARGUMENTS`. Confirme com
   `git branch --show-current`. **Não troque de branch numa worktree.**
3. **Inicie** (ledger no controle): `node "<CTRL>/tools/scripts/manage-task.mjs" start $ARGUMENTS <EU> "iniciando"`.
   - Se já em `in_progress` por você, siga. Se `review`/`done` → PARE.
4. **Implemente no CÓDIGO** (sua pasta) — ESTRITAMENTE a Seção 3 da spec, respeitando a Seção 5
   ("NÃO FAZER"). TDD quando a spec pedir. Nada fora do escopo.
5. **Gate de Evidência (INVIOLÁVEL):** rode os comandos EXATOS da Seção 7 **na sua pasta (CÓDIGO)** e
   cole a **saída literal** na Seção 8 de `<CTRL>/tasks/$ARGUMENTS.md`. Tudo verde é obrigatório.
   Vermelho → conserte; falha de ambiente → `pause`/`block` (nunca finalize no escuro).
<<<<<<< HEAD
=======
   > **Ambiente do Gate (Windows-native):** `pnpm install`/build **trava** se rodado pelo terminal
   > **integrado do VS Code** (PITFALLS P-002). Rode o worker num **terminal standalone** (Windows
   > Terminal/PowerShell) para o Gate ser autônomo; se estiver no VS Code, peça o Gate ao usuário e
   > finalize com a saída colada. **pnpm 11:** se `pnpm install` der `ERR_PNPM_IGNORED_BUILDS`, o campo
   > é `allowBuilds:` → `<pkg>: true` no `pnpm-workspace.yaml` (P-006), **não** `onlyBuiltDependencies`;
   > e config nova só vale após apagar `node_modules`+`pnpm-lock.yaml` (o lock velho pula a resolução).
>>>>>>> t109/task/T-109
6. **Finalize** (ledger): `node "<CTRL>/tools/scripts/manage-task.mjs" finish $ARGUMENTS <EU> "<resumo + placar de testes>"`.
   - Move pra `review`. Daqui em diante o reviewer assume — você **NÃO** aprova.
7. **Commit + push do CÓDIGO** (na sua pasta = superapp):
   ```
   git add -A
   git commit -m "feat($ARGUMENTS): <resumo curto>"
   git push -u origin task/$ARGUMENTS
   ```
8. **Commit do CONTROLE** (no `<CTRL>` = Docs): o `manage-task` + sua edição da Seção 8 alteraram
   `tasks/$ARGUMENTS.md` lá. Persista:
   ```
   git -C "<CTRL>" add tasks/$ARGUMENTS.md && git -C "<CTRL>" commit -m "chore($ARGUMENTS): review + evidência"
   ```
   (NÃO commite `.nexus/` — é gitignored. O push do controle é do usuário.)
9. **Próxima task:** só depois desta em `review`, com código pushado e controle commitado. **PARE.**

## NÃO faça
- NÃO toque arquivos fora da Seção 3 (no CÓDIGO); NÃO toque o repo do nexus.
- NÃO chame `approve`/`request_changes` — nem pra "destravar" uma task presa em `review`.
- NÃO finalize sem a saída literal do Gate colada na Seção 8.
- NÃO edite `status`/`INDEX`/Log na mão (use `manage-task.mjs`).
- NÃO faça `merge` no branch default do `superapp` — é do reviewer/integração (`pnpm wt merge` após `approve`).
