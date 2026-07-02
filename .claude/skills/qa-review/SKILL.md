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

## 1. Identificar tarefas a revisar

Primeiro **separe a flag**: se `$ARGUMENTS` contém `--integrar`, retire-a e guarde "modo integrar
ligado"; o que sobra (um ID ou vazio) é o alvo. Ex.: `--integrar T-204` → alvo `T-204`, integrar=on.

Se o alvo for um ID de task (ex.: `T-1011`):
- Localize `tasks/$ARGUMENTS.md` ou `meta-tasks/$ARGUMENTS.md`.
- Confirme status `review`. Se não estiver em `review`, informe e PARE.

Se `$ARGUMENTS` estiver vazio:
- Leia `tasks/INDEX.md` e `meta-tasks/INDEX.md`.
- Colete todas as linhas com status `` `review` ``.
- Se não houver nenhuma, informe e PARE.
- Se houver mais de uma, liste ao usuário e pergunte qual revisar (ou se quer revisar
  todas em sequência). Aguarde confirmação antes de prosseguir.

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
