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

Use o **MODELO real** (ex.: `deepseek`, `gemini`, `claude-sonnet`, `minimax`) onde aparecer `<EU>` —
**nunca** o harness/TUI que te hospeda (`Crush`, `Antigravity`, `opencode` não são identidade) e
**nunca** um papel (`agile_reviewer`, `devops_agent`, `logic_agent`). Ver "Identidade do agente" no
CLAUDE.md — o Log §9 e o `ledger.mjs` só têm valor se isso for respeitado.

## Contrato inegociável
- A **spec é a fonte da verdade**. Leia `<CTRL>/tasks/$ARGUMENTS.md` INTEIRA antes de codar.
- **NUNCA** edite `status`/`INDEX.md`/Log na mão — só via `manage-task.mjs` (no `<CTRL>`).
- Você **NUNCA** chama `approve`/`request_changes` (Regra 6). Só `start`/`finish`/`pause`/`block`.
- Spec ambígua/contraditória/impossível → `pause`/`block` com o motivo. **Não invente.**

## Passo a passo
1. **Prontidão:** `<CTRL>/tasks/$ARGUMENTS.md` deve estar `status: ready`. Se `draft` → **PARE**
   (precisa endurecer — `/endurecer-task`). Se `review`/`done` → **PARE** (não reexecute).
2. **Worktree (uma por task — disciplina INVIOLÁVEL):**
   - Se ainda **não** existe, crie do controle: `pnpm wt new $ARGUMENTS` (roda `worktree.mjs`, que
     cria em `C:\Dev2026\.superapp-worktrees\$ARGUMENTS` na branch `task/$ARGUMENTS` e imprime o
     caminho do `manage-task.mjs`). **Nunca** crie worktree à mão nem em outro diretório — já
     quebrou antes (worktrees iam parar em `.nexus-worktrees`). Confira com `pnpm wt ls`.
   - Trabalhe **dentro** dela. Confirme: `git branch --show-current` → `task/$ARGUMENTS`. **Não
     troque de branch numa worktree**, **não** abra duas worktrees pra mesma task.
3. **Inicie** (ledger no controle): `node "<CTRL>/tools/scripts/manage-task.mjs" start $ARGUMENTS <EU> "iniciando"`.
   - Se já em `in_progress` por você, siga. Se `review`/`done` → PARE.
4. **Implemente no CÓDIGO** (sua pasta) — ESTRITAMENTE a Seção 3 da spec, respeitando a Seção 5
   ("NÃO FAZER"). TDD quando a spec pedir. Nada fora do escopo.
   - **Commit a cada unidade que fecha** (um teste verde, um arquivo concluído, um sub-passo da
     Seção 5) — `git add -A && git commit -m "wip($ARGUMENTS): <o que fechou>"`. Não acumule tudo
     num commit gigante no fim: commits frequentes preservam o trabalho se a sessão estourar tokens
     ou travar, e dão um handoff legível pro próximo agente. **Pushe** de tempos em tempos
     (`git push -u origin task/$ARGUMENTS`) — o push barato é melhor que perder uma tarde.
5. **Gate de Evidência (INVIOLÁVEL):** rode os comandos EXATOS da Seção 7 **na sua pasta (CÓDIGO)** e
   cole a **saída literal** na Seção 8 de `<CTRL>/tasks/$ARGUMENTS.md`. Tudo verde é obrigatório.
   Vermelho → conserte; falha de ambiente → `pause`/`block` (nunca finalize no escuro).
   > **Ambiente do Gate (Windows-native):** `pnpm install`/build **trava** se rodado pelo terminal
   > **integrado do VS Code** (PITFALLS P-002). Rode o worker num **terminal standalone** (Windows
   > Terminal/PowerShell) para o Gate ser autônomo; se estiver no VS Code, peça o Gate ao usuário e
   > finalize com a saída colada. **pnpm 11:** se `pnpm install` der `ERR_PNPM_IGNORED_BUILDS`, o campo
   > é `allowBuilds:` → `<pkg>: true` no `pnpm-workspace.yaml` (P-006), **não** `onlyBuiltDependencies`;
   > e config nova só vale após apagar `node_modules`+`pnpm-lock.yaml` (o lock velho pula a resolução).
6. **Finalize** (ledger): `node "<CTRL>/tools/scripts/manage-task.mjs" finish $ARGUMENTS <EU> "<resumo + placar de testes>"`.
   - Move pra `review`. Daqui em diante o reviewer assume — você **NÃO** aprova.
7. **Commit final + push do CÓDIGO** (na sua pasta = superapp) — fecha o que sobrou desde o último
   commit incremental (passo 4) e garante que **tudo** está no remoto:
   ```
   git add -A
   git commit -m "feat($ARGUMENTS): <resumo curto>"   # se houver algo não-commitado
   git push -u origin task/$ARGUMENTS
   ```
8. **Persiste o CONTROLE — ENFILEIRE** (no `<CTRL>` = Docs): o `manage-task` + sua edição da Seção 8
   alteraram `tasks/$ARGUMENTS.md`. O Docs é compartilhado e **agentes não rodam git lá** (ver regra
   de Paralelismo no CLAUDE.md). Enfileire a intenção de commit:
   ```
   node "<CTRL>/tools/scripts/fila.mjs" add $ARGUMENTS "chore($ARGUMENTS): review + evidência"
   ```
   Um único `/drenar-fila` (consumidor serial) commita+pusha depois. Você não toca git no Docs.
9. **Próxima task:** só depois desta em `review`, com código pushado e controle **enfileirado**. **PARE.**

## NÃO faça
- NÃO toque arquivos fora da Seção 3 (no CÓDIGO); NÃO toque o repo do nexus.
- NÃO chame `approve`/`request_changes` — nem pra "destravar" uma task presa em `review`.
- NÃO finalize sem a saída literal do Gate colada na Seção 8.
- NÃO edite `status`/`INDEX`/Log na mão (use `manage-task.mjs`).
- NÃO rode `git commit`/`push`/`add` no Docs — **enfileire** (`fila.mjs add`). O git do controle é só do `/drenar-fila`. (No superapp/worktree o git continua igual.)
- NÃO faça `merge` no branch default do `superapp` — é do reviewer/integração (`pnpm wt merge` após `approve`).
