# Wiki da Plataforma Projeto SuperApp V0.41 — convenções

## Estrutura
- docs/conceitos/<slug>.md  → verbete canônico (definição única)
- docs/caderno-{1..4}/...    → lentes que LINKAM, não redefinem

## Regra de fonte única (inviolável)
Cada conceito é definido UMA vez, em docs/conceitos/. Em qualquer outro
lugar, referencie via [[slug]] — nunca redefina. Se algo já está definido,
linke; não copie.

## As quatro lentes
vision = por quê/para quem · protocol = contrato (fio/matemática, agnóstico
de linguagem) · sdk = implementação TS · governance = política/evolução.
Cada caderno ADICIONA um ângulo sobre o conceito, não uma cópia dele.

## Realoque, não reescreva
Conteúdo normativo (crypto, invariantes, fórmulas, assinaturas de interface):
MOVA o texto original literalmente. Não parafraseie de memória — você degrada
a precisão. Resumo só com link explícito para o canônico.

## Histórico
Não é mais append-only. Você PODE mover, mesclar e DELETAR livremente —
o git guarda o histórico. Não deixe duplicatas "por segurança".

## Workflow
Um conceito ou um caderno por vez. Commit por unidade, mensagem descritiva.
Nunca um PR monolítico. Ao terminar uma unidade, rode /verificar antes de seguir.

## Links
Wikilinks [[slug]] para conceitos. Slugs kebab-case, estáveis.

## Absorção de RFCs
RFCs são propostas; conteúdo aceito vive nos cadernos/conceitos, não em rfc-*.md.
Todo RFC novo segue docs/rfcs/_TEMPLATE.md (tabela "Onde integrar" + "Texto
normativo") para ser auto-roteável. Absorver com /absorver-rfc; a RFC é deletada
ao fim. docs/rfcs/_status.md registra status e destino-caderno de cada RFC.

## Migração wiki — Fase 2

Estado da migração e ferramentas:
- Inventário de conceitos: docs/conceitos/_inventario.md
- Plano de ondas: docs/conceitos/_plano-de-ondas.md
- Executar uma onda: /rodar-onda <n>
- Verificar o wiki: Use o subagent auditor-wiki

Ondas 1 a 12 concluídas. Fase 2 de migração de conceitos concluída com sucesso.

---

# Modelo de Gestão de Tarefas (MGTIA) e Execução

Você (Claude) atua agora sob o Modelo de Gestão de Tarefas Interoperável para Agentes (MGTIA). Todas as tarefas de código vivem no diretório `/tasks/` e possuem status (`draft`, `ready`, `in_progress`, `review`, `rework`, `done`).

## As 3 Regras de Execução de Tarefas

### 1. Spec-Driven Development (SDD) e Spec Feedback Loop
Toda tarefa em `ready` contém um bloco "Contexto RAG". Você **DEVE** ler os arquivos linkados ali antes de codar. A Spec é a fonte absoluta da verdade.
- Se a Spec estiver ambígua, falha, ou impossível de implementar de forma correta, **PARE**. Não invente um comportamento. Altere o status da tarefa para `blocked`, preencha o bloco "Feedback de Especificação" e encerre.

### 2. Test-Driven Development (TDD) e Agentes Sem Visão
Você **DEVE** escrever e rodar o teste (Vitest, Playwright, ou CLI) que afirma o comportamento esperado **ANTES** de escrever a funcionalidade.
Se a tarefa envolver UI, e você não tiver capacidade de validar visualmente, siga as orientações da tarefa para usar asserções baseadas em texto/DOM (ex: `@testing-library/react`), ou delegue E2E visual indicando na seção de review.

### 3. O Fluxo de Code Review (PR Assíncrono)
Nunca marque uma tarefa sua como `done` se você for o executor.
- Quando terminar a feature e os testes passarem, marque como `review`.
- Preencha o "Log de Handover" e entregue. Outro agente (o `agile_reviewer`) validará seu código.
- Se o revisor mandar para `rework`, leia os comentários, corrija, e envie para `review` novamente.

## Seus Possíveis Papéis (Skills) neste Modelo

1. **Task Architect (Groomer):** Pegar Épicos do `plano-de-implementacao.md` e quebrá-los em arquivos `T-XXX.md` na pasta `/tasks`, populando o RAG e orientando o executor com o script `node tools/scripts/generate-task.mjs`.
2. **Worker (Executor):** Implementar tarefas Nível 1 a 3. Aplicar TDD/SDD estritamente.
3. **Agile Reviewer (Revisor):** Ler tarefas em `review`, auditar o código feito pelo Worker, rodar a suíte de testes e o linter, checar a aderência à spec e decidir se vai para `done` ou `rework`.
