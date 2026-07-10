---
name: rework-task
description: >
  Ciclo de RETRABALHO de uma task MGTIA em status `rework` (modelo dois-repos). Lê o Parecer do
  Reviewer (Seção 8), corrige EXATAMENTE os achados bloqueantes [Bn]/[Mn] na worktree existente,
  commita por correção, re-roda o Gate e finaliza pra review. Auto-contido (Regra 4) — NUNCA aprova.
  Ex.: /rework-task T-204
---

# Rework Task $ARGUMENTS

Você é um **Worker em retrabalho**. Igual ao `/executar-task`, há **DOIS repos**: CONTROLE
(`<CTRL>` = `Docs`, tem a spec + Parecer + `manage-task.mjs`) e CÓDIGO (a worktree do `superapp` na
branch `task/$ARGUMENTS`). A diferença: seu escopo **não** é a spec inteira — é a **lista de achados
do Reviewer**. Use o **MODELO real** onde aparecer `<EU>` (ex.: `deepseek`, `gemini`) — nunca o
harness (`Crush`, `Antigravity`) nem um papel (`agile_reviewer`, `logic_agent`). Ver "Identidade do
agente" no AGENTS.md.

## Contrato inegociável
- O **Parecer (Seção 8) é o escopo**. Corrija os `[Bn]`/`[Mn]` **bloqueantes**, nada além. Não
  refatore o que o reviewer não apontou; não "melhore" de brinde (vira novo achado).
- **NUNCA** `approve`/`request_changes` (Regra 6) — só `start`/`finish`/`pause`/`block`.
- Achado impossível/contraditório com a spec → `pause`/`block` com o motivo. Não invente.
- Se a spec ou o **Plano de Batalha (§5b)** diz PAUSE/ABORT numa condição e você a observa →
  **pare de verdade** (`pause`/`block`). Não improvise (não dropar o item, não alargar tipo/schema
  de OUTRO arquivo pra caber, não aceitar teste que você sabe que vai falhar). Um contrato que não
  bate com uma dependência `done` é decisão de arquitetura — não conserto de worker.

## Passo a passo
1. **Prontidão:** `<CTRL>/tasks/$ARGUMENTS.md` deve estar `status: rework`. Se `review`/`done` →
   **PARE** (não é seu momento). Se `in_progress` por você, siga.
2. **Leia o Parecer (Seção 8).** Extraia a lista de achados **bloqueantes** com seus códigos
   (`[B1]`, `[M1]`…), o **local** (`arquivo:linha`) e a **Ação corretiva** de cada um. Essa lista é
   seu checklist fechado. (Os **não-bloqueantes** minor/info já foram pro `_pendencias.md` pelo
   integrar-task — **não** são seu trabalho aqui; deixe-os.)
3. **Worktree:** reuse a existente — `pnpm wt ls` deve mostrar `task/$ARGUMENTS`. Se sumiu,
   `pnpm wt new $ARGUMENTS` recria da branch. Confirme `git branch --show-current`.
4. **Inicie:** `node "<CTRL>/tools/scripts/manage-task.mjs" start $ARGUMENTS <EU> "rework: corrigindo B1..Bn"`
   (move `rework→in_progress`).
5. **Corrija achado a achado.** Para cada `[Bn]`/`[Mn]`: aplique a Ação corretiva, e **commite por
   achado** — `git add -A && git commit -m "fix($ARGUMENTS): [B1] <o que corrigiu>"`. Rastreável,
   e o reviewer confere 1-a-1. Se o reviewer deixou uma sonda (`*.probe.test.ts`) que falhava,
   adicione a cobertura **própria** equivalente (a sonda em si não entra no deliverable).
6. **Gate de Evidência (INVIOLÁVEL):** re-rode os comandos EXATOS da Seção 7 **na worktree** e cole
   a **saída literal** na Seção 8. Tudo verde. Vermelho → conserte; falha de ambiente →
   `pause`/`block` (mesmo aviso de terminal standalone do `/executar-task`).
7. **Finalize:** `node "<CTRL>/tools/scripts/manage-task.mjs" finish $ARGUMENTS <EU> "rework pronto:
   B1..Bn corrigidos + placar de testes"` (move pra `review`). O reviewer/integrar-task reassume.
7a. **VERIFIQUE a transição — NÃO assuma que deu certo (INVIOLÁVEL).** A saída do `finish` deve
   mostrar explicitamente `Status: review`. Qualquer coisa diferente (erro, status inalterado,
   exceção) → **NÃO prossiga** para push/enqueue como se a task estivesse fechada. Confirme lendo
   o frontmatter real (`grep "^status:" "<CTRL>/tasks/$ARGUMENTS.md"`). Se ainda não for `review`:
   (a) tente `finish` de novo uma vez (pode ser falha transiente); (b) falhou de novo → **é falha
   de ambiente = BLOCKER** (AGENTS.md Regra 3 — "falha de ambiente durante uma transição é ela
   mesma um blocker"). Chame `pause` explicando literalmente o que a saída do `finish` mostrou.
   NUNCA passe pro passo 8 com a task ainda em `rework`/`in_progress` — é isso que faz o Reviewer
   perder tempo descobrindo sozinho que o trabalho estava pronto mas preso no status errado.
8. **Push do CÓDIGO** (worktree): `git push origin task/$ARGUMENTS`.
9. **Persiste o CONTROLE — ENFILEIRE, não comite** (Docs é compartilhado; agentes não rodam git lá —
   ver regra de Paralelismo no AGENTS.md): `node "<CTRL>/tools/scripts/fila.mjs" add $ARGUMENTS
   "chore($ARGUMENTS): rework + evidência"`. Um único `/drenar-fila` commita+pusha depois. **PARE.**
10. **Dispara o orquestrador (fire-and-forget).** Após enfileirar, rode **sem aguardar** —
   `node tools/scripts/orquestrar.mjs --on-finish $ARGUMENTS` — para liberar seu slot e deixar o
   orquestrador despachar o próximo passo. NÃO espere a saída nem cole no Gate; é disparar e seguir.

## NÃO faça
- NÃO corrija além dos achados bloqueantes do Parecer (escopo fechado).
- NÃO edite arquivo de OUTRA task (mesmo "só uma linha") pra fazer a sua caber — isso é sintoma de
  contrato desalinhado entre specs. `pause`/`block` e registre; não conserte silenciosamente.
- NÃO mexa nos não-bloqueantes do `_pendencias.md` — são do `/agrupar-cleanup`.
- NÃO chame `approve`/`request_changes` — nem pra "destravar".
- NÃO finalize sem a saída literal do Gate na Seção 8.
- NÃO edite `status`/`INDEX`/Log na mão. **NÃO rode `git commit`/`push` no Docs — enfileire.**
