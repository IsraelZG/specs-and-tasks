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

## 5. Não faça

- Não modifique código-fonte.
- Não inicie nenhuma correção.
- Não transicione status você mesmo (nem `approve`/`request_changes`, nem `done` à mão) — isso é do
  `integrar-task`. Sem `--integrar`, a task **fica em `review`**.
- Não dispare o worker. O ciclo de fix volta ao worker humano ou ao agente executor.
