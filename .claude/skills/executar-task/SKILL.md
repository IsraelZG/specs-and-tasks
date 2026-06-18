---
name: executar-task
description: Ciclo completo de execução de uma task MGTIA por um Worker — entra na branch task/<ID>, implementa estritamente a spec, roda o Gate de Evidência, commita e dá push, e finaliza pelo serviço (vai pra review). NUNCA aprova nem inventa. Para o worker partir pra próxima task.
---

# Executar Task $ARGUMENTS

Você é um **Worker**. Execute a task `$ARGUMENTS` seguindo a spec à risca. Use seu identificador
(ex.: `DeepSeek`) onde aparecer `<EU>` — **nunca** `agile_reviewer`.

## Contrato inegociável (CLAUDE.md)
- A **spec é a fonte da verdade**. Leia `tasks/$ARGUMENTS.md` INTEIRA antes de codar.
- **NUNCA** edite `status`/`INDEX.md`/Log na mão — só via `manage-task.mjs`.
- Você **NUNCA** chama `approve`/`request_changes` (Regra 6). Só `start`/`finish`/`pause`/`block`.
- Se a spec for ambígua/contraditória/impossível → `pause` ou `block` com o motivo. **Não invente.**

## Passo a passo
1. **Prontidão:** confirme `status: ready` em `tasks/$ARGUMENTS.md`. Se `draft` → **PARE** (precisa
   endurecer antes — `/endurecer-task`). Se já `review`/`done` → **PARE** (não reexecute).
2. **Branch `task/$ARGUMENTS`:**
   - Se você está numa **worktree** (criada por `pnpm wt new $ARGUMENTS`) → já está na branch certa;
     confirme com `git branch --show-current`. **Não troque de branch numa worktree.**
   - Senão: `git checkout -B task/$ARGUMENTS` (cria ou entra).
3. **Inicie:** `node tools/scripts/manage-task.mjs start $ARGUMENTS <EU> "iniciando"`.
   - Se falhar porque já está em `in_progress` por você, siga. Se em `review`/`done` → PARE.
4. **Implemente** ESTRITAMENTE o escopo da Seção 3 (só os arquivos listados) respeitando a Seção 5
   ("NÃO FAZER"). Faça TDD quando a spec pedir. Nada fora do escopo.
5. **Gate de Evidência (INVIOLÁVEL):** rode os comandos EXATOS da Seção 7 (build/test) e cole a
   **saída literal** na Seção 8 (Handover do Executor). Tudo verde é obrigatório. Vermelho →
   conserte; falha de ambiente → `pause`/`block` (nunca finalize no escuro).
6. **Finalize:** `node tools/scripts/manage-task.mjs finish $ARGUMENTS <EU> "<resumo + placar de testes>"`.
   - Move pra `review`. Daqui em diante o reviewer assume — você **NÃO** aprova.
7. **Commit + push** (Conventional Commits; captura código + o .md atualizado + INDEX):
   ```
   git add -A
   git commit -m "feat($ARGUMENTS): <resumo curto>"
   git push -u origin task/$ARGUMENTS
   ```
   (Sem remote? Faça só o commit e registre no resumo.)
8. **Próxima task:** só depois que esta estiver em `review`, commitada e pushada. **PARE** aqui.

## NÃO faça
- NÃO toque arquivos fora da Seção 3.
- NÃO chame `approve`/`request_changes` — nem pra "destravar" uma task presa em `review`.
- NÃO finalize sem a saída literal do Gate colada na Seção 8.
- NÃO edite `status`/`INDEX`/Log na mão.
- NÃO faça `merge` em `master` — isso é do reviewer/integração (via `pnpm wt merge` após `approve`).
