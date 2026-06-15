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

Você (Claude/OpenCode/Antigravity) atua agora sob o Modelo de Gestão de Tarefas Interoperável para Agentes (MGTIA).
As tarefas de implementação do projeto vivem no diretório `/tasks/` e as de gestão no diretório `/meta-tasks/`.

**IMPORTANTE:** Você **NUNCA** deve editar o status de uma tarefa ou seu Log de Execução manualmente no Markdown. Você deve SEMPRE usar a CLI oficial: `node tools/scripts/manage-task.mjs <action> <taskId> <SeuNome> [mensagem]`.
As ações disponíveis são `start`, `pause`, e `finish`.

Para encontrar a próxima tarefa a fazer, **NÃO** inspecione os arquivos individuais. Leia SEMPRE o Dashboard em `tasks/INDEX.md` ou `meta-tasks/INDEX.md`.

## As 3 Regras de Execução de Tarefas

### 1. Spec-Driven Development (SDD) e Spec Feedback Loop
Toda tarefa em `ready` contém um bloco "Contexto RAG". Você **DEVE** ler os arquivos linkados ali antes de codar. A Spec é a fonte absoluta da verdade.
- Se a Spec estiver ambígua, falha, ou impossível de implementar de forma correta, **PARE**. Use `manage-task.mjs pause` indicando o bloqueio e encerre.

### 2. Gestão de Estado, Handoff e Log de Execução
Ao iniciar uma tarefa, chame `manage-task.mjs start <TaskID> <SeuNome>`.
Se você atingir o limite de tokens, perceber que não conseguirá terminar a tarefa na mesma sessão, ou precisar de ajuda do usuário, chame `manage-task.mjs pause <TaskID> <SeuNome> "sua mensagem"` com um resumo claro do que você fez e do que o próximo agente deve fazer para continuar de onde você parou.
**Isto é essencial para que outro agente possa assumir a tarefa.**

### 3. O Fluxo de Code Review (PR Assíncrono)
Nunca marque uma tarefa sua como `done` se você for o executor.
- Quando terminar a feature e os testes passarem, chame `manage-task.mjs finish <TaskID> <SeuNome> "log final"`.
- O script mudará o status para `review`. Outro agente (o `agile_reviewer`) validará seu código.

## Seus Possíveis Papéis (Skills) neste Modelo

1. **Task Architect / Manager:** Criar tarefas de implementação em `/tasks` e de organização/chat em `/meta-tasks` usando o script `node tools/scripts/generate-task.mjs`.
2. **Worker (Executor):** Implementar tarefas Nível 1 a 3 verificando o `INDEX.md`. Aplicar SDD estritamente. Registrar seu progresso com `manage-task.mjs`.
3. **Agile Reviewer (Revisor):** Ler o `INDEX.md` buscando tarefas em `review`, auditar o código feito pelo Worker e rodar os testes/lint.

## Dimensionamento de Tarefas (regra de criação — INVIOLÁVEL)

Toda task DEVE ser dimensionada para execução por um agente de capacidade
**≤ Sonnet (preferencialmente Haiku)**. Na prática, a spec precisa ter:
- **Zero decisões de arquitetura em aberto** (sem "faça X **OU** Y" — escolha e pine).
- **Assinaturas e contratos de dados explícitos** (tipos, formato de entrada/saída).
- **Nenhuma API externa não-fixada** — se um pacote/serviço externo for usado e sua
  interface não estiver documentada/estável, isole a descoberta num **spike** antes.
- **Verificação por comando** (testes/CLI), não por julgamento subjetivo.

O que exigir nível **Opus** (pesquisa, design aberto, integração externa incerta)
NÃO vira uma task comum: defina como **spike** (entregável = relatório/PoC/ADR, com
critério de sucesso claro) ou como **épico** a ser subdividido em tasks ≤ Sonnet.

Inclua no corpo da task a linha **`Capacidade-alvo: haiku | sonnet | opus-spike`**.
O **Task Architect** é responsável por aplicar esta regra ao criar/editar tasks.
