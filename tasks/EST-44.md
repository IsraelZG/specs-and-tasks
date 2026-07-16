---
id: EST-44
title: "substituir jdm-editor e WorkflowTree local pelo FlowGrid compartilhado"
status: in_progress
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-UIE-02", "DMM-06", "DMM-07"]
blocks: []
capacity_target: sonnet
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
- **[CREATE]** `apps/estaleiro/ui/src/views/planner/jdm-flow-adapter.ts` — adapter JDM↔FlowGrid.
  - `adaptJdmToFlowGraph(jdm: JdmGraph): FlowGraphViewModel` e `applyFlowCommandToJdm(jdm: JdmGraph, command: FlowCommand): JdmGraph`.
  - JDM é a fonte canônica: `label = name ?? id`, `order` é o índice original e `metadata.__jdm` preserva tipo, conteúdo e extensões semânticas. `decisionTableNode` vira `rule`, `inputNode`/`outputNode` viram `state`, tipo de ferramenta conhecido vira `tool` e desconhecido vira `state` sem perder o tipo original.
  - Arestas são projetadas diretamente como `{ id, source: sourceId, target: targetId }`; o input não é mutado e o adapter não lê, calcula ou grava coordenadas.
- **[UPDATE]** `PlannerView.tsx` para `FlowGrid mode="edit"`.
  - Substitui `@gorules/jdm-editor` por `FlowGrid` de `@plataforma/ui-engines`.
  - `connect` cria somente aresta simples sem portas e rejeita duplicata; `disconnect` remove por `edgeId`; `update_node` aceita apenas `label`→`name`; `reorder` exige uma permutação completa e reordena somente `nodes`. Portas e alterações de `metadata` falham fechadas, sem mutar JDM.
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
  7. Comandos não representáveis (portas/metadata) falham sem mutar o JDM; os suportados preservam `type`, `content` e extensões.
  8. Alterar somente o overlay de execução não recria nem altera o grafo.
- **Fora de escopo:** migrar JDM para schema novo, remover zen-engine, duplicar FlowGrid no app.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO remover `@gorules/zen-engine`.
> - NÃO migrar JDM para um schema novo.
> - NÃO duplicar FlowGrid dentro do app.
> - NÃO persistir coluna/linha/X/Y no JDM.

## 6. Decisão registrada

**DECIDIDO (2026-07-16) — adapter lossless e limitado.** Os contratos canônicos são
`FlowGraphViewModel`, `FlowCommand` e `FlowExecutionOverlay` de `@plataforma/ui-engines`.
JDM é a única fonte persistida e FlowGrid é projeção visual. O adapter conserva em
`metadata.__jdm` os dados semânticos sem equivalente visual, aceita na inversão apenas operações
JDM inequívocas e falha fechada nas demais. Não há campo novo de posição, coluna, linha, X ou Y no
JDM; o overlay de execução é estado separado e efêmero.

Isso evita apagar semântica JDM, inventar portas ou tornar ordenação visual dado de domínio. O
trade-off deliberado é que recursos visuais sem equivalente JDM ficam indisponíveis até uma extensão
canônica do schema.

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
- **[2026-07-16T15:55]** - *gpt-5* - `[Decidido]`: decisão: JDM canônico, projeção FlowGrid lossless e inversão limitada
- **[2026-07-16T15:55]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-16T17:01]** - *deepseek* - `[Iniciado]`: iniciando migração para FlowGrid
