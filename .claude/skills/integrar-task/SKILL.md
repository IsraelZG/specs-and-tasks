---
name: integrar-task
description: >
  Operação INTEGRAR do MGTIA: para uma task em `review`, lê o(s) parecer(es) da Seção 8 e DECIDE —
  se aprovada, faz merge da branch na master do superapp + remove a worktree + move para `done` e
  anexa os não-bloqueantes ao ledger de pendências; se reprovada, devolve para `rework`. NÃO revisa
  código (isso é do qa-review) — só age sobre o parecer existente. Ex.: /integrar-task T-204
model: sonnet
---

# Integrar Task $ARGUMENTS

Você é o **Integrador** (papel de Reviewer que decide e integra). Esta skill é a operação
**INTEGRAR**: ela NÃO produz parecer de código (isso é o `qa-review`) — ela **age** sobre o parecer
que já está na Seção 8 da task. É o passo que faltava e que causou o gap de integração (4 tasks
`done` cujo código nunca entrou na master porque o `wt merge` era manual e foi pulado).

> **Capacidade-alvo: sonnet.** Merge de branch antiga exige resolver conflito e **adaptar a
> contratos que evoluíram depois** que a branch foi escrita. NÃO é mecânico, NÃO é Haiku.

## Pré-condições (PARE se faltar)

- A task está em **`review`** e a Seção 8 tem um **parecer** com veredito (Aprovado / Requer
  Refatoração). Sem parecer → use `/qa-review $ARGUMENTS` primeiro (ou `qa-review --integrar`).
- Você roda **a partir do repo de controle (Docs)**. O merge opera sobre o **checkout principal do
  superapp** (não uma worktree) — o `worktree.mjs merge` cuida disso.
- Em tasks complexas há **vários** pareceres (review-only). Considere o **agregado**: só prossiga
  para aprovar se TODOS os bloqueantes (`Bn`) estão resolvidos e o último veredito é Aprovado.

## Caminho A — Parecer = APROVADO

1. **Pré-flight.** `git -C ../superapp status` deve estar limpo e em `master`. Rode
   `node tools/scripts/drift-check.mjs` para ter o baseline.
2. **Merge.** `node tools/scripts/worktree.mjs merge $ARGUMENTS`.
   - **Conflito? NÃO force.** Resolva à mão e re-rode o Gate. Conflitos típicos (vistos na
     integração tardia de T-204/T-501/T-301/T-308):
     - `*/src/index.ts`: **combine** os exports dos dois lados (não escolha um).
     - **Contrato evoluído** — a branch precede mudanças que entraram na master. Ex.: `WsAdapter`
       não tinha `onClose` (ADR-0004); fixture de teste não tinha `parentHash` (T-108-rework-3).
       Implemente/ajuste o que o contrato atual exige, **citando** a evolução.
     - `pnpm-lock.yaml`: `git checkout --ours` + `pnpm install` (se a branch adicionou dep) para
       reconciliar; o lock da master pode estar stale (diff grande é esperado).
3. **Gate pós-merge (INVIOLÁVEL).** Rode `pnpm --filter <pacote(s) da task> build && test && lint`
   na master e **confirme verde**. Sem Gate verde, o merge não vale — `git merge --abort` e devolva
   para `rework` com o motivo.
4. **Commit + push** do merge no superapp (`git push origin master`).
5. **Verifica integração:** `node tools/scripts/drift-check.mjs` → sem novo integration drift para
   `$ARGUMENTS` (os arquivos do deliverable estão na master).
6. **Remove a worktree:** `node tools/scripts/worktree.mjs rm $ARGUMENTS` (preserva a branch).
7. **Pendências:** extraia os achados **não-bloqueantes** (`MAJOR`/`MINOR`/`INFO`) dos pareceres da
   Seção 8 e **anexe** ao `tasks/_pendencias.md` (entre os marcadores `BEGIN/END PENDENCIAS`), uma
   linha por achado: `- [ ] [M|m|i][$ARGUMENTS][pacote] achado — ref`. (Não crie task `-followup`.)
8. **Fecha o status pelo serviço:** o ator é `agile_reviewer:<SeuModelo>` (papel autoriza, modelo fica
   no ledger — ver "Identidade do agente" no CLAUDE.md): `node tools/scripts/manage-task.mjs approve
   $ARGUMENTS agile_reviewer:<SeuModelo> "Integrado: merge na master (commit <hash>), worktree
   removida, Gate verde (<evidência>). N não-bloqueantes → ledger de pendências."`
9. **Encerra pais decomposed (se aplicável).** Se `$ARGUMENTS` é uma task filha (ID com sufixo
   `a`/`b`/`c` ou nome indica split), verifique se existe um pai com `spec_status: decomposed`.
   Leia o frontmatter `blocks:` do pai para encontrar todas as filhas. Se **todas** estiverem `done`:
   fast-track o pai pelo serviço: `promote → start → finish → approve agile_reviewer:<SeuModelo>` com
   mensagem "decomposed — filhas <lista> concluídas". Nunca edite o status do pai na mão. Se alguma
   filha ainda não for `done`, pule — o pai será encerrado quando a última filha for integrada.
10. **Reendurece os dependentes (JIT).** Agora que `$ARGUMENTS` é `done`, a fundação que os
   dependentes dela só podiam citar vagamente **existe de verdade**. Rode
   `node tools/scripts/hardening.mjs` e olhe **REENDURECER**. Para cada dependente de `$ARGUMENTS`
   (task com `$ARGUMENTS` em `dependencies:`, ou em `blocks:` desta) **cujas deps agora estão TODAS
   `done`**, rode `/endurecer-task <dep>` — troca placeholder pela assinatura real e re-carimba
   `hardened_at`. Dependente com **outra** dep ainda aberta: **pule** (reendurecer seria prematuro;
   o painel o pega quando fechar). Em seguida `/arquiteto-promover` promove os que ficaram `hardened`.
11. **Persiste o controle — ENFILEIRE** (agentes não rodam git no Docs; ver Paralelismo no CLAUDE.md).
   Enfileire UMA intenção com **só os arquivos que VOCÊ tocou** (a 1ª é o id, as demais são paths
   extras) — `tasks/$ARGUMENTS.md` (default), `tasks/_pendencias.md` e **cada dependente que
   reendureceu** (liste por nome): `node tools/scripts/fila.mjs add $ARGUMENTS "<msg>"
   tasks/_pendencias.md tasks/T-305.md`. **NÃO** enfileire `INDEX.md` (gitignored). Um `/drenar-fila`
   commita+pusha depois — você não toca git no Docs (no superapp, o push do merge já foi no passo 4).

## Caminho B — Parecer = REQUER REFATORAÇÃO

1. **Pendências:** anexe os **não-bloqueantes** ao `tasks/_pendencias.md` (mesmo formato).
2. **Devolve:** `node tools/scripts/manage-task.mjs request_changes $ARGUMENTS agile_reviewer:<SeuModelo>
   "Rework: <lista dos Bn/Mn bloqueantes a corrigir>. Não-bloqueantes → ledger."` (review→rework).
3. **NÃO** faça merge, **NÃO** remova a worktree (o worker volta a usá-la). **Enfileire** o controle:
   `node tools/scripts/fila.mjs add $ARGUMENTS "chore($ARGUMENTS): request_changes" tasks/_pendencias.md`.

## NÃO faça

- **NÃO** aprove/integre uma task cujo merge você não conseguiu deixar verde no Gate — devolva.
- **NÃO** edite `status`/`INDEX.md`/Log na mão — só via `manage-task.mjs`.
- **NÃO** revise o código aqui (parecer é do `qa-review`). Esta skill só decide+integra.
- **NÃO** invente evidência. Cole a saída literal do Gate na mensagem do `approve`.

## Ferramentas

Use os MCPs (`git`, `github`, `context7` ao adaptar a libs, `sequential-thinking` se o conflito
for não-trivial) e os LSPs (`lsp_diagnostics` após cada edição de resolução de conflito). Ver
`AGENTS.md` §MCP/LSP.
