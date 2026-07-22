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
- Se a spec ou o **Plano de Batalha (§5b)** diz PAUSE/ABORT numa condição e você a observa →
  **pare de verdade** (`pause`/`block`). Não improvise (não dropar o item, não alargar tipo/schema
  de OUTRO arquivo pra caber, não aceitar teste que você sabe que vai falhar). Um contrato que não
  bate com uma dependência `done` é decisão de arquitetura — não conserto de worker.

## Passo a passo
1. **Prontidão comum:** sem manifesto de campanha, a task deve estar `status: ready`; `draft:*` →
   **PARE**. Em campanha, um descendente `draft:hardened` pode receber admissão staged somente pelo
   procedimento do passo 2. `review`/`done` → **PARE**.
2. **Admissão de campanha (se aplicável):** localize o único `_campanha-*.md` que contém a task.
   - Crie primeiro a worktree na base declarada: trunk usa `pnpm wt new $ARGUMENTS`; descendente usa
     `pnpm wt new $ARGUMENTS --base task/<PREDECESSOR>`.
   - Registre a base: trunk → `campanha.mjs register-review-base <manifesto> $ARGUMENTS master`;
     descendente → `campanha.mjs register-stack-base <manifesto> $ARGUMENTS task/<PREDECESSOR>`.
   - Rode `campanha.mjs validate` e `campanha.mjs can-start`. Falha ou predecessor antes de
     `review` → PARE. Se a task estiver `draft:hardened`, só após esses checks chame `promote` com
     motivo `admissão staged <campaign_id>`; depois chame `start`.
   - Descendente cujo predecessor ainda não está `done` permanece **staged**: pode ser implementado,
     commitado, pushado e gated, mas não pode chamar `finish`.
3. **Worktree comum (uma por task — disciplina INVIOLÁVEL):**
   - Fora de campanha, se ainda **não** existe, crie do controle: `pnpm wt new $ARGUMENTS` (roda `worktree.mjs`, que
     cria em `C:\Dev2026\.superapp-worktrees\$ARGUMENTS` na branch `task/$ARGUMENTS` e imprime o
     caminho do `manage-task.mjs`). **Nunca** crie worktree à mão nem em outro diretório — já
     quebrou antes (worktrees iam parar em `.nexus-worktrees`). Confira com `pnpm wt ls`.
   - Trabalhe **dentro** dela. Confirme: `git branch --show-current` → `task/$ARGUMENTS`. **Não
     troque de branch numa worktree**, **não** abra duas worktrees pra mesma task.
4. **Inicie** (ledger no controle): `node "<CTRL>/tools/scripts/manage-task.mjs" start $ARGUMENTS <EU> "iniciando"`.
   - Se já em `in_progress` por você, siga. Se `review`/`done` → PARE.
5. **Context pack** (1 chamada, substitui 4-8 leituras):
   `node "<CTRL>/tools/scripts/get-task.mjs" $ARGUMENTS`
   - Imprime task completa, RAG resolvido, estado da worktree, branch, merge-base e o
   texto inline desta skill. Use a saída como **única fonte de contexto** para os passos
   seguintes — não releia arquivo por arquivo.
6. **Implemente no CÓDIGO** (sua pasta) — ESTRITAMENTE a Seção 3 da spec, respeitando a Seção 5
   ("NÃO FAZER"). TDD quando a spec pedir. Nada fora do escopo.
   - **Commit a cada unidade que fecha** (um teste verde, um arquivo concluído, um sub-passo da
     Seção 5) — `git add -A && git commit -m "wip($ARGUMENTS): <o que fechou>"`. Não acumule tudo
     num commit gigante no fim: commits frequentes preservam o trabalho se a sessão estourar tokens
     ou travar, e dão um handoff legível pro próximo agente. **Pushe** de tempos em tempos
     (`git push -u origin task/$ARGUMENTS`) — o push barato é melhor que perder uma tarde.
7. **Gate de Evidência (INVIOLÁVEL):** `pnpm gate <pkg> --profile <test_profile>` (spec antiga sem
   campo ⇒ `full`). O script entra
   na fila única da máquina e grava o artefato `.gate/<tree-sha>.json` na branch, contendo fases, tempos,
   exitCodes e a saída literal. Cole a **saída literal** na Seção 8 de `<CTRL>/tasks/$ARGUMENTS.md`.
   `backend` não abre browser; `ui` e `full` incluem Playwright. Não invoque runners internos por
   fora da fila. Tudo verde é obrigatório. Vermelho → conserte; falha de ambiente → `pause`/`block`.
   > **Ambiente do Gate (Windows-native):** `pnpm install`/build **trava** se rodado pelo terminal
   > **integrado do VS Code** (PITFALLS P-002). Rode o worker num **terminal standalone** (Windows
   > Terminal/PowerShell) para o Gate ser autônomo; se estiver no VS Code, peça o Gate ao usuário e
   > finalize com a saída colada. **pnpm 11:** se `pnpm install` der `ERR_PNPM_IGNORED_BUILDS`, o campo
   > é `allowBuilds:` → `<pkg>: true` no `pnpm-workspace.yaml` (P-006), **não** `onlyBuiltDependencies`;
   > e config nova só vale após apagar `node_modules`+`pnpm-lock.yaml` (o lock velho pula a resolução).
8. **Finalize** (ledger): antes do `finish` de task em campanha, rode `campanha.mjs can-finish
   <manifesto> $ARGUMENTS`. O comando exige deps `done`, branch transplantada e
   `review_base_sha` válida. Depois chame `node "<CTRL>/tools/scripts/manage-task.mjs" finish
   $ARGUMENTS <EU> "<resumo + placar de testes>"`.
   - Move pra `review`. Daqui em diante o reviewer assume — você **NÃO** aprova.
   - **Staged:** se o predecessor ainda não está `done`, chame `pause` com "staged — implementação
     e gates prontos; aguardando upstream <predecessor>". Após ele ficar `done`, retome, faça
     `git rebase --onto master <stack_base_sha> task/$ARGUMENTS`, registre `review_base_sha` com
     `campanha.mjs register-review-base ... master`, re-gate e só então rode `can-finish` + `finish`.
8a. **VERIFIQUE a transição — NÃO assuma que deu certo (INVIOLÁVEL).** A saída do `finish` deve
   mostrar explicitamente `Status: review`. Qualquer coisa diferente (erro, status inalterado,
   exceção) → **NÃO prossiga** para push/enqueue como se a task estivesse fechada. Confirme lendo
   o frontmatter real (`grep "^status:" "<CTRL>/tasks/$ARGUMENTS.md"`). Se ainda não for `review`:
   (a) tente `finish` de novo uma vez (pode ser falha transiente); (b) falhou de novo → **é falha
   de ambiente = BLOCKER** (CLAUDE.md Regra 3 — "falha de ambiente durante uma transição é ela
   mesma um blocker"). Chame `pause` explicando literalmente o que a saída do `finish` mostrou.
   NUNCA passe pro passo 8 com a task ainda em `in_progress` — é isso que faz o Reviewer perder
   tempo descobrindo sozinho que o trabalho estava pronto mas preso no status errado.
9. **Commit final + push do CÓDIGO** (na sua pasta = superapp) — fecha o que sobrou desde o último
   commit incremental (passo 6) e garante que **tudo** está no remoto:
   ```
   git add -A
   git commit -m "feat($ARGUMENTS): <resumo curto>"   # se houver algo não-commitado
   git push -u origin task/$ARGUMENTS
   ```
10. **Persiste o CONTROLE — ENFILEIRE** (no `<CTRL>` = Docs): o `manage-task` + sua edição da Seção 8
   alteraram `tasks/$ARGUMENTS.md`. O Docs é compartilhado e **agentes não rodam git lá** (ver regra
   de Paralelismo no CLAUDE.md). Enfileire a intenção de commit:
   ```
   node "<CTRL>/tools/scripts/fila.mjs" add $ARGUMENTS "chore($ARGUMENTS): review + evidência"
   ```
   Um único `/drenar-fila` (consumidor serial) commita+pusha depois. Você não toca git no Docs.
11. **Dispara o orquestrador (fire-and-forget).** Após enfileirar, rode **sem aguardar** —
   `node tools/scripts/orquestrar.mjs --on-finish $ARGUMENTS` — para liberar seu slot e deixar o
   orquestrador despachar o próximo passo. NÃO espere a saída nem cole no Gate; é disparar e seguir.
12. **Próxima task:** só depois desta em `review`, com código pushado e controle **enfileirado**. **PARE.**

## NÃO faça
- NÃO toque arquivos fora da Seção 3 (no CÓDIGO); NÃO toque o repo do nexus.
- NÃO edite arquivo de OUTRA task (mesmo "só uma linha") pra fazer a sua caber — isso é sintoma de
  contrato desalinhado entre specs. `pause`/`block` e registre; não conserte silenciosamente.
- NÃO chame `approve`/`request_changes` — nem pra "destravar" uma task presa em `review`.
- NÃO finalize sem a saída literal do Gate colada na Seção 8.
- NÃO edite `status`/`INDEX`/Log na mão (use `manage-task.mjs`).
- NÃO rode `git commit`/`push`/`add` no Docs — **enfileire** (`fila.mjs add`). O git do controle é só do `/drenar-fila`. (No superapp/worktree o git continua igual.)
- NÃO faça `merge` no branch default do `superapp` — é do reviewer/integração (`pnpm wt merge` após `approve`).
