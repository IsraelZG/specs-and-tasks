# 02 - Gestão de Tarefas (MGTIA)

> **Referência canônica completa:** [`docs/conceitos/mgtia-workflow.md`](../conceitos/mgtia-workflow.md)
> — pipeline end-to-end, dois eixos, paralelismo, skills, papéis. Leia lá primeiro.
> Este playbook cobre só os detalhes operacionais do `manage-task.mjs`.

O **MGTIA** é o motor de controle de fluxo de trabalho do repositório. O painel global de tarefas vive em `tasks/INDEX.md`, mas ele é um arquivo **read-only** para humanos e agentes em operação manual (gitignored — regenerado pelo serviço a cada transição).

## 1. O Script de Transição (`manage-task.mjs`)

Todas as transições de status DEVEM passar pelo serviço de gestão via comando CLI (ou ferramenta MCP nativa `nexus_transition_task`):

```bash
node tools/scripts/manage-task.mjs <action> <taskId> <SeuNome> "[mensagem opcional]"
```

**Verbos Permitidos (`<action>`):**
- `promote`: (`draft` → `ready`) Promove a task quando não há mais decisões em aberto.
- `start`: (`ready` → `in_progress`) Assinala a task a você e cria isolamento.
- `pause`: (`in_progress` → `ready`) Devolve a task para a fila com anotações de handoff ou bloqueio de ambiente.
- `finish`: (`in_progress` | `rework` → `review`) Submete a task para auditoria, obrigatoriamente colando os logs do Gate de Evidência na mensagem.
- `approve`: (`review` → `done`) Exclusivo do perfil Reviewer.
- `request_changes`: (`review` → `rework`) Exclusivo do perfil Reviewer.
- `block` / `unblock`: Para gerenciar dependências bloqueantes graves.

## 2. A Regra do Handoff (`pause`)

Se, durante a execução de uma task, o tempo, os tokens ou a paciência esgotarem, **nunca abandone o estado sujo**.
1. Faça commit do progresso (se aplicável localmente).
2. Use a ação `pause` descrevendo exatamente onde parou, quais bugs encontrou e quais testes ainda estão falhando. O próximo agente na fila começará lendo este log de handoff.

## 3. Papéis Estritos

- **Arquiteto**: Dono do plano de alto nível, único autorizado a criar specs em `docs/conceitos` e abrir tasks.
- **Worker (Executor)**: Nunca chama `approve` ou `request_changes`. Seu papel termina no `finish`.
- **Reviewer (Auditor)**: Nunca codifica (gera PRs). Apenas roda o pipeline de auditoria e comanda `approve` ou `request_changes`. Se o Reviewer tentar consertar o código diretamente, o sistema perde o rastro de auditoria.
