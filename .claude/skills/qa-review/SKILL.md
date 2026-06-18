---
name: qa-review
description: Roda o ciclo completo de QA em tarefas em status `review`. Sem args revisa
  todas as tarefas em review; com ID revisa uma específica. Ex.: /qa-review T-1011
model: sonnet
---
# QA Review $ARGUMENTS

## 1. Identificar tarefas a revisar

Se `$ARGUMENTS` for um ID de task (ex.: `T-1011`):
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

## 4. Não faça

- Não modifique código-fonte.
- Não inicie nenhuma correção.
- Não marque tarefas como `done` manualmente.
- Não dispare o worker. O ciclo de fix volta ao worker humano ou ao agente executor.
