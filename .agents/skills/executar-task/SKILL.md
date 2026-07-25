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
AGENTS.md — o Log §9 e o `ledger.mjs` só têm valor se isso for respeitado.

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
3. **Inicie** (ledger no controle): `node "<CTRL>/tools/scripts/manage-task.mjs" start $ARGUMENTS <EU> "iniciando"`.
   - Se já em `in_progress` por você, siga. Se `review`/`done` → PARE.
4. **Implemente no CÓDIGO** (sua pasta) — ESTRITAMENTE a Seção 3 da spec, respeitando a Seção 5
   ("NÃO FAZER"). TDD quando a spec pedir. Nada fora do escopo.
   - **Commit a cada unidade que fecha** (um teste verde, um arquivo concluído, um sub-passo da
     Seção 5) — `git add -A && git commit -m "wip($ARGUMENTS): <o que fechou>"`. Não acumule tudo
     num commit gigante no fim: commits frequentes preservam o trabalho se a sessão estourar tokens
     ou travar, e dão um handoff legível pro próximo agente. **Pushe** de tempos em tempos
     (`git push -u origin task/$ARGUMENTS`) — o push barato é melhor que perder uma tarde.
5. **Gate de Evidência (INVIOLÁVEL):** rode o comando EXATO da Seção 7 — `pnpm gate <pacote(s)>
   --profile <test_profile>` (ausente em spec antiga ⇒ `full`) — **na sua pasta (CÓDIGO)** e cole a saída literal na Seção 8 de
   `<CTRL>/tasks/$ARGUMENTS.md`. O gate entra automaticamente na fila única da máquina; nunca rode
   Vitest/Playwright por fora para ganhar prioridade. `backend` não abre browser; `ui` e `full`
   incluem Playwright. Tudo verde é obrigatório.
  contrato desalinhado entre specs. `pause`/`block` e registre; não conserte silenciosamente.
- NÃO chame `approve`/`request_changes` — nem pra "destravar" uma task presa em `review`.
- NÃO finalize sem a saída literal do Gate colada na Seção 8.
- NÃO edite `status`/`INDEX`/Log na mão (use `manage-task.mjs`).
- NÃO rode `git commit`/`push`/`add` no Docs — **enfileire** (`fila.mjs add`). O git do controle é só do `/drenar-fila`. (No superapp/worktree o git continua igual.)
- NÃO faça `merge` no branch default do `superapp` — é do reviewer/integração (`pnpm wt merge` após `approve`).
