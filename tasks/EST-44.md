---
id: EST-44
title: "substituir jdm-editor e WorkflowTree local pelo FlowGrid compartilhado"
status: draft:pending_decision
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-UIE-02", "DMM-06", "DMM-07"]
blocks: []
capacity_target: sonnet
decisions: ["FlowGraphViewModel tipos exatos dependem de T-UIE-02 — endurecer JIT", "Adapter inverso FlowGraph→JDM: contrato exato depende dos tipos de comando T-UIE-02"]
ui: true
---

# EST-44 · Migrar planejamento e execução para FlowGrid

## 0. Ambiente de Execução Obrigatório
- **Repo:** `C:\Dev2026\superapp` · app `@plataforma/estaleiro-ui`.
- **Prioridade:** P7. Não executar antes das prioridades 1–6.

## 1. Objetivo
Substituir o editor `@gorules/jdm-editor` e o `WorkflowTree` hardcoded pela engine compartilhada
`FlowGrid`. Preservar o store JDM/Zen e o orquestrador: apenas a camada visual e seus adapters mudam.

## 2. Contexto RAG
- ADR 0016; ADR 0014.
- `tasks/DMM-10.md`, `tasks/DMM-09.md`, `tasks/T-UIE-02.md`.
- `packages/plugin-workflows` e `packages/plugin-zen-engine` — contratos existentes, não modificar.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/ui/src/views/planner/jdm-flow-adapter.ts` — adapter JDM→FlowGraphViewModel.
  - `adaptJdmToFlowGraph(jdm: JdmWorkflow): FlowGraphViewModel` (derivado de DMM-06, ADR 0016 §3).
  - converte ids, arestas, labels e tipos de nó sem perder dados.
  - Não muta o JDM original (input é read-only).
- **[UPDATE]** `PlannerView.tsx` para `FlowGrid mode="edit"`.
  - Substitui `@gorules/jdm-editor` por `FlowGrid` de `@plataforma/ui-engines`.
  - Comandos `connect`/`disconnect`/`update_node`/`reorder` do FlowGrid são convertidos de volta
    para operações JDM via adapter inverso.
- **[UPDATE]** execution view para `FlowGrid mode="execution"`, sem passos hardcoded.
  - Nó atual é destacado via prop `currentNodeId` (derivado de DMM-07 eventos WS).
  - Não recomputa grafo no cliente.
- **[DELETE]** wrapper/estilos específicos de `JdmEditor` quando não houver caller.
- **[UPDATE]** package.json/lockfile removendo `@gorules/jdm-editor`.
- **[UPDATE]** testes unitários e Playwright de planejamento/execução.
- **[NO CHANGE]** `@gorules/zen-engine`, schema JDM, store JDM/Zen, plugin-workflows.

## 4. Estratégia de Testes
- **Framework:** Vitest/JSDOM (unit) + Playwright/Chromium (E2E).
- **Caso de teste (numerados):**
  1. Adapter converte fixture JDM real sem perder ids/arestas/labels (anti-fake: `adaptJdmToFlowGraph(jdm).nodes.size === jdm.nodes.length`).
  2. Edição salva JDM novamente aceito pelo store/Zen (round-trip: edit → adapter inverso → store → re-export → adapter → FlowGraph idêntico).
  3. Workflow com nós além dos quatro antigos aparece integralmente (anti-fake: `FlowGrid` renderiza todos os nós do grafo).
  4. Evento WS destaca nó atual sem recomputar grafo no cliente (anti-fake: `currentNodeId` prop muda, `FlowGraphViewModel` não é recriado).
  5. Browser cria bifurcação/join, salva, recarrega e acompanha execução.
  6. Busca no bundle/package confirma ausência de `@gorules/jdm-editor` (anti-fake: `grep` no lockfile/bundle retorna null).
- **Fora de escopo:** migrar JDM para schema novo, remover zen-engine, duplicar FlowGrid no app.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO remover `@gorules/zen-engine`.
> - NÃO migrar JDM para um schema novo.
> - NÃO duplicar FlowGrid dentro do app.
> - NÃO persistir coluna/linha/X/Y no JDM.

## 6. Feedback de Especificação
Sem decisões abertas. A ADR 0016 supersede somente o editor da ADR 0013 §1.2.

- **Aberto (decisão de arquiteto):** Assinatura exata de `FlowGraphViewModel` e tipos
  `FlowNodeViewModel`/`FlowEdgeViewModel` dependem de T-UIE-02. O adapter JDM→FlowGraph é
  derivado de ADR 0016 §3 mas os tipos concretos ainda não existem. Registrar como open;
  endurecer JIT quando T-UIE-02 estiver done.
- **Aberto (decisão de arquiteto):** Adapter inverso (FlowGraph→JDM) — qual o contrato exato?
  O FlowGrid emite comandos (`connect`, `disconnect`, `update_node`, `reorder`); estes precisam
  ser convertidos de volta para operações JDM. A forma exata depende do schema JDM (DMM-06, done)
  mas a implementação depende dos tipos de comando do FlowGrid (T-UIE-02).

## 7. Definition of Done
- [ ] Adapter JDM→FlowGraph converte corretamente fixtures reais.
- [ ] PlannerView usa FlowGrid mode="edit" e emite comandos.
- [ ] Execution view usa FlowGrid mode="execution" com highlight de nó atual.
- [ ] `@gorules/jdm-editor` removido do package e bundle.
- [ ] Lint passa (Gate de Evidência inclui lint desde 2026-07-06).

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:e2e
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.
> **Lint é parte do gate** (Regra 3 do CLAUDE.md, desde 2026-07-06).

## 8. Log de Handover e Revisão
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução

- **[2026-07-13T19:17]** - *gpt-5* - `[Triado]`: Migração incremental do planner e execução para FlowGrid, preservando Zen e JDM
- **[2026-07-13T18:00]** - *deepseek* - `[Endurecido]`: endureceu spec — 2 decisões em aberto (Seção 6: FlowGraphViewModel tipos abertos p/ JIT, adapter inverso FlowGraph→JDM). Capacidade: sonnet.
- **[2026-07-13T22:31]** - *deepseek* - `[Reconciliado]`: status restaurado de draft:pending_decision para draft:triaged (drift corrigido)
- **[2026-07-13T22:31]** - *deepseek* - `[Decisão pendente]`: 2 decisões abertas: FlowGraphViewModel tipos abertos, adapter inverso
