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

**Validação de campanha (INVIOLÁVEL):** se a task pertence a uma campanha (`tasks/_campanha-*.md`),
verifique ANTES do merge:

1. **Predecessor `done`:** `node tools/scripts/campanha.mjs state <manifesto>` — o predecessor
   declarado no manifesto deve estar `done`. Se não, PARE (descendente staged não pode ser
   integrado antes do predecessor).
2. **Base de review válida:** `node tools/scripts/campanha.mjs check-review-base <manifesto>
   $ARGUMENTS` deve terminar com exit 0. `pending`, branch fora da base ou qualquer erro → PARE.
3. **Manifesto válido:** `node tools/scripts/campanha.mjs validate <manifesto>` — se falhar, PARE.

Essas validações previnem integração de descendente antes do transplante/re-gate (ADR 0017 §5).

## Detecta tooling-do-controle (sem worktree) — ANTES de escolher o caminho

Algumas tasks (ex.: `ORQ-*`) são **tooling do Docs** — editam scripts/skills direto no controle, sem
branch/worktree no superapp (§0 da spec diz "Tarefa de TOOLING do CONTROLE"). Confirme:
`node tools/scripts/worktree.mjs ls | grep task/$ARGUMENTS` — **vazio** = tooling. Para essas, use
**Caminho A-tooling** (pula merge — não existe o que mergear) em vez do Caminho A normal.
**NUNCA** rode `manage-task.mjs approve` direto fora desta skill — é exatamente esse atalho que pula:
- **Passos MANUAIS** desta skill: anexar pendências ao ledger, encerrar pais não decompostos.
- **Side-effects AUTOMÁTICOS** (T-1029): `parentAutoClose` (encerra pai decomposto, log `[Auto-encerrado]`), `autoPromoteDependents` (promove dependentes elegíveis).
Foi o approve manual que travou ORQ-02 esperando ORQ-01 (aprovada na mão, sem a propagação automática).

## Caminho A-tooling — Parecer = APROVADO, SEM worktree (task de tooling do controle)

1. **Gate (sem merge — não há branch a integrar):** confirme que a evidência colada na §8 é a saída
   real dos comandos da §7 da própria spec (não invente). Se o parecer aponta achado não resolvido,
   trate como Caminho B.
2. Pule os passos 1-6 do Caminho A (não há `git`/worktree/superapp aqui). Vá direto para os passos
   **7 a 8** (pendências → approve). Os side-effects automáticos (T-1029: autoPromoteDependents,
   parentAutoClose) rodam no `approve` sem intervenção manual.

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
4. **Atualiza manifesto de saúde (fire-and-forget).** Rode `node tools/scripts/saude.mjs` em background
   (não aguarde — o manifesto regenera assíncrono) para que o manifesto reflita o estado pós-merge.
6. **Commit + push** do merge no superapp (`git push origin master`).
7. **Verifica integração:** `node tools/scripts/drift-check.mjs` → sem novo integration drift para
   `$ARGUMENTS` (os arquivos do deliverable estão na master).
8. **Remove a worktree:** `node tools/scripts/worktree.mjs rm $ARGUMENTS` (preserva a branch).
9. **Pendências:** extraia os achados **não-bloqueantes** (`MAJOR`/`MINOR`/`INFO`) dos pareceres da
   Seção 8 e **anexe** ao `tasks/_pendencias.md` (entre os marcadores `BEGIN/END PENDENCIAS`), uma
   linha por achado: `- [ ] [M|m|i][$ARGUMENTS][pacote] achado — ref`. (Não crie task `-followup`.)
10. **Fecha o status pelo serviço:** o ator é `agile_reviewer:<SeuModelo>` (papel autoriza, modelo fica
   no ledger — ver "Identidade do agente" no CLAUDE.md): `node tools/scripts/manage-task.mjs approve
   $ARGUMENTS agile_reviewer:<SeuModelo> "Integrado: merge na master (commit <hash>), worktree
   removida, Gate verde (<evidência>). N não-bloqueantes → ledger de pendências."`
   *(O `approve → done` automaticamente dispara `autoPromoteDependents` e `parentAutoClose` — T-1029.
   Não é mais necessário reendurecer dependentes nem encerrar pais decompostos manualmente.)*
11. **Persiste o controle — ENFILEIRE** (agentes não rodam git no Docs; ver Paralelismo no CLAUDE.md).
   Enfileire UMA intenção com **só os arquivos que VOCÊ tocou**: `tasks/$ARGUMENTS.md` (default) e
   `tasks/_pendencias.md`: `node tools/scripts/fila.mjs add $ARGUMENTS "<msg>" tasks/_pendencias.md`.
   **NÃO** enfileire `INDEX.md` (gitignored). Um `/drenar-fila` commita+pusha depois — você não toca
   git no Docs (no superapp, o push do merge já foi no passo 6).
12. **Dispara o orquestrador (fire-and-forget).** Após enfileirar, rode **sem aguardar** —
   `node tools/scripts/orquestrar.mjs --on-finish $ARGUMENTS` — para liberar seu slot e deixar o
   orquestrador despachar o próximo passo. NÃO espere a saída nem cole no Gate; é disparar e seguir.

## Caminho B — Parecer = REQUER REFATORAÇÃO

1. **Pendências:** anexe os **não-bloqueantes** ao `tasks/_pendencias.md` (mesmo formato).
2. **Devolve:** `node tools/scripts/manage-task.mjs request_changes $ARGUMENTS agile_reviewer:<SeuModelo>
   "Rework: <lista dos Bn/Mn bloqueantes a corrigir>. Não-bloqueantes → ledger."` (in_review|review→rework).
3. **NÃO** faça merge, **NÃO** remova a worktree (o worker volta a usá-la). **Enfileire** o controle:
   `node tools/scripts/fila.mjs add $ARGUMENTS "chore($ARGUMENTS): request_changes" tasks/_pendencias.md`.
4. **Dispara o orquestrador (fire-and-forget).** Após enfileirar, rode **sem aguardar** —
   `node tools/scripts/orquestrar.mjs --on-finish $ARGUMENTS` — para que o orquestrador veja o rework
   e despache o próximo agente. NÃO espere a saída nem cole no Gate; é disparar e seguir.

## NÃO faça

- **NÃO** aprove/integre uma task cujo merge você não conseguiu deixar verde no Gate — devolva.
- **NÃO** edite `status`/`INDEX.md`/Log na mão — só via `manage-task.mjs`.
- **NÃO** revise o código aqui (parecer é do `qa-review`). Esta skill só decide+integra.
- **NÃO** invente evidência. Cole a saída literal do Gate na mensagem do `approve`.

## Ferramentas

Use os MCPs (`git`, `github`, `context7` ao adaptar a libs, `sequential-thinking` se o conflito
for não-trivial) e os LSPs (`lsp_diagnostics` após cada edição de resolução de conflito). Ver
`AGENTS.md` §MCP/LSP.
