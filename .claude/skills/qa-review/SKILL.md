---
name: qa-review
description: >
  Audita tarefas em `review` e emite o Parecer (Seção 8) — REVIEW-ONLY, não transiciona nem faz
  merge. Sem args revisa todas em review; com ID revisa uma. Com a flag `--integrar`, encadeia o
  `integrar-task` ao final (merge+approve se aprovado, request_changes se não). Ex.: /qa-review
  T-1011  ·  /qa-review --integrar T-204
model: sonnet
---
# QA Review $ARGUMENTS

> **Review-only por padrão.** Esta skill produz o **Parecer** (via `agile-reviewer`, na Seção 8) e
> **para** — a task fica em `review`. A decisão (merge na master + `approve`, ou `request_changes`)
> é da operação **`/integrar-task`**, que roda depois. Isso existe de propósito: `approve` sem o
> merge foi o que criou o gap de integração. Para fazer os dois de uma vez, use **`--integrar`**.
>
> **Lock de revisão:** o primeiro passo é **`claim`** (`review → in_review`) — trava a task para que
> o orquestrador não despache outro reviewer. Se `claim` falhar (task já está `in_review`), outro
> reviewer já pegou → PARE (não rouba a revisão).

## 1. Identificar tarefas a revisar

Primeiro **separe a flag**: se `$ARGUMENTS` contém `--integrar`, retire-a e guarde "modo integrar
ligado"; o que sobra (um ID ou vazio) é o alvo. Ex.: `--integrar T-204` → alvo `T-204`, integrar=on.

Se o alvo for um ID de task (ex.: `T-1011`):
- Localize `tasks/$ARGUMENTS.md` ou `meta-tasks/$ARGUMENTS.md`.
- Confirme status `review`. Se estiver em `review`, siga normalmente.
- **Se estiver em `rework`/`in_progress` (NÃO `review`) — rode a VERIFICAÇÃO RÁPIDA antes de
  desistir** (não a auditoria completa — é um atalho de 3 checagens baratas, propositalmente antes
  do trabalho caro da §2, para não gastar minutos analisando código só pra concluir "ah, estava
  pronto"):
  1. Handover (§8) tem entrada **mais nova que o último Parecer**?
  2. Log (§9) tem `[Finalizado]`/entrada de fim-de-rework **após** o timestamp desse Parecer?
  3. `git log` da branch/worktree mostra commit **após** esse mesmo timestamp?
  - **Os 3 batem** → o rework foi concluído mas o `finish` não transicionou (falha conhecida, ver
    `/rework-task` §7a). Feche a lacuna você mesmo: `node tools/scripts/manage-task.mjs finish
    $ARGUMENTS agile_reviewer:<SeuModelo> "finish em nome do worker — rework concluido, transicao
    anterior falhou"`, registre essa correção em 1 linha no Parecer, e **prossiga normalmente**
    (claim → auditoria completa da §2). Não pule a revisão — só destrave o status.
  - **Qualquer um não bate** → é cedo mesmo: informe e **PARE** (comportamento original).

Se `$ARGUMENTS` estiver vazio:
- Leia `tasks/INDEX.md` e `meta-tasks/INDEX.md`.
- Colete todas as linhas com status `` `review` ``.
- Se não houver nenhuma, informe e PARE.
- Se houver mais de uma, liste ao usuário e pergunte qual revisar (ou se quer revisar
  todas em sequência). Aguarde confirmação antes de prosseguir.

## 1a. Claim — trava a task para revisão (NOVO, INVIOLÁVEL)

**Antes** de auditar, reclame a task: `node tools/scripts/manage-task.mjs claim <ID> agile_reviewer:<SeuModelo> "revisando"`.
- Se `claim` falhar (status != `review`, ou papel ≠ reviewer) → **PARE** e explique por quê.
- **Se a task já está `in_review`** → outro reviewer a pegou. PARE. Não audite nem escreva parecer.

## 2. Para cada task identificada

Despache o subagent `agile-reviewer` com o ID da task como argumento.

O subagent retornará o **QA Report completo** (seções BLOCKER/MAJOR/MINOR/INFO + veredicto).
Um relatório **sem a Evidência de Execução** (saída real de build/tsc + test, com o placar
`N passed`) é inválido — devolva ao `agile-reviewer` para rodar e colar a saída antes de
consolidar. Nunca apresente um veredito baseado só em inspeção.

### 2a. Verificação de Disposição por Achado (C-tasks — INVIOLÁVEL)

Para tasks de cleanup (`C-NN`), além do Gate (build verde), o reviewer **VERIFICA** que **CADA
achado da §5** tem disposição explícita no Handover (§8). Taxonomia válida:

- `fixed` — corrigido no código (com ref de arquivo/commit).
- `no-op` — já consistente na impl; justificativa em 1 linha.
- `spec→T-XXX` — exige reendurecer a spec da task-origem.
- `decision→T-XXX` — exige decisão de arquiteto.
- `defer→T-YYY` — trabalho adiado a task futura nomeada.

**Achado sem destino = achado não resolvido → veredito REFATORAÇÃO NECESSÁRIA**, mesmo que o build
esteja verde. "Os demais são spec-only" genérico sem destino per-item é **insuficiente**.

Se o worker classificou achados como `spec→` ou `decision→`, confirme que eles constam no bloco
`<!-- BEGIN SPEC-PENDENCIAS -->` do `_pendencias.md` (o `/agrupar-cleanup` já os roteou; o worker
pode adicionar novos durante a execução).

### 2b. Segunda revisão independente (quando já há um parecer Aprovado)

Um parecer **Aprovado** já na Seção 8 **NÃO** dispensa nem encerra a revisão — ele é o gate
**ideal** para um segundo par de olhos. A própria regra do CLAUDE.md ("revisor de modelo diferente
do que codou") e o `integrar-task` (que decide pelo **agregado** de pareceres) pressupõem que
tasks importantes recebam **mais de uma** revisão independente. Então:

- **Não pule** uma task só porque a Seção 8 já tem `[x] Aprovado`. Se o usuário pediu a revisão
  dela (ID explícito), **revise**.
- **Rode com um modelo DIFERENTE** do que assinou o parecer existente (e do que codou) — o ganho de
  uma 2ª revisão é descorrelacionar pontos cegos; repetir o mesmo modelo não agrega.
- **Revise FRIO (anti-ancoragem):** forme seu próprio veredito a partir da spec + código + Gate +
  sondas **antes** de ler o parecer anterior. Só depois compare. Não herde o "Aprovado" alheio.
- **APPEND, nunca sobrescreva:** o `agile-reviewer` anexa um **novo bloco** de parecer (Reviewer 2,
  3…) — o parecer anterior fica preservado. Se a 2ª revisão achar um bloqueante, o **agregado**
  vira REFATORAÇÃO (o `integrar-task` só aprova se o ÚLTIMO veredito é Aprovado e zero `Bn` aberto).

### 2c. Gate obrigatório: diff × escopo da Seção 3

Antes de aceitar o Parecer, confirme que o `agile-reviewer` comparou **o diff inteiro da branch da
task contra a base correta** com a Seção 3 da spec. `HEAD~1` é insuficiente: perde commits
anteriores da mesma task. Use o MCP de git para obter nomes e status `A/M/D/R`; não use um diff
parcial nem confie apenas no handover.

**Base do diff por contexto:**

- **Task em campanha:** rode `campanha.mjs check-review-base <manifesto> <ID>` e use
  `git diff <review_base_sha>..task/<ID>`. `review_base_sha: pending`, predecessor não `done` ou
  task ainda `in_progress` significam que o elo está staged e **não pode ser revisado**. Nunca use
  `stack_base_sha` para QA: ela serve ao transplante/invalidação, não ao parecer final.
- **Task trunk-based** (sem campanha): diff contra o merge-base com a branch de integração
  (comportamento original).

- `[READ]` nunca autoriza modificação. `[CREATE]` e `[UPDATE]` autorizam só o path declarado ou
  arquivos sob um diretório explicitamente declarado. Arquivos ignorados efêmeros não entram no
  diff, mas artefatos rastreados entram.
- O Parecer deve trazer uma tabela curta `declarado | alterado | disposição`. Mudança necessária
  mas não declarada precisa de justificativa causal no handover e de `spec→T-XXX` quando exigir
  correção da spec; melhoria oportunista vai para `_pendencias.md`, não é absorvida silenciosamente.
- Arquivo rastreado fora do escopo, sem disposição, é **MAJOR** e produz `REFATORAÇÃO NECESSÁRIA`.
  Se ampliar privilégio, vazar segredo, mudar contrato público ou contornar um gate, é **BLOCKER**.
- Relatório sem esta comparação é incompleto, mesmo com build e testes verdes; devolva-o ao reviewer.

## 3. Consolidar e apresentar

Se apenas uma task: exiba o relatório completo diretamente.

Se múltiplas tasks:
```
QA BATCH REPORT — <data>
═══════════════════════════════════
<TASK_ID> · APROVADO / REFATORAÇÃO NECESSÁRIA · <B: n M: n>
<TASK_ID> · ...

Total: N tasks · A aprovadas · R precisam refatoração
```

Ao final, liste apenas as tasks que precisam de ação do worker com seus BLOCKERs resumidos.

## 4. Encadear a integração (só com `--integrar`)

Se `$ARGUMENTS` contém a flag **`--integrar`**, depois de o Parecer estar gravado na Seção 8, rode
**`/integrar-task <ID>`** para cada task revisada. O `integrar-task` lê o próprio Parecer e decide:
APROVADO → merge na master + Gate + `approve`; REFATORAÇÃO → `request_changes`. **Sem** a flag, NÃO
integre — apenas apresente o Parecer e pare (a task fica em `review` para o integrador rodar depois).

## 4b. Persiste o Parecer — ENFILEIRE (sem `--integrar`)

O `agile-reviewer` escreveu o Parecer na Seção 8 de `tasks/<ID>.md`, mas **agentes não rodam git no
Docs** (ver Paralelismo no CLAUDE.md). Para cada task revisada, enfileire a intenção de commit:
`node tools/scripts/fila.mjs add <ID> "chore(<ID>): parecer QA"`. Um `/drenar-fila` commita+pusha
depois. **(Com `--integrar` você NÃO precisa disso aqui** — o `/integrar-task` já enfileira tudo no
passo 10, incluindo o parecer.) Nunca `git commit`/`push` no Docs.

**Após enfileirar cada task, dispare o orquestrador (fire-and-forget):** rode **sem aguardar**
`node tools/scripts/orquestrar.mjs --on-finish <ID>` — para liberar seu slot e deixar o
orquestrador despachar o próximo passo. NÃO espere a saída nem cole no Gate; é disparar e seguir.
(Com `--integrar`, o `/integrar-task` já faz isso — não duplique.)

## 5. Não faça

- Não modifique código-fonte.
- Não inicie nenhuma correção.
- Não transicione status você mesmo (nem `approve`/`request_changes`, nem `done` à mão) — isso é do
  `integrar-task`. Sem `--integrar`, a task **fica em `review`**.
- Não rode `git commit`/`push`/`add` no Docs — **enfileire** (`fila.mjs add`); o git do controle é só
  do `/drenar-fila`.
- Não dispare o worker. O ciclo de fix volta ao worker humano ou ao agente executor.
