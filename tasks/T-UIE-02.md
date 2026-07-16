---
id: T-UIE-02
title: "FlowGrid determinístico compartilhado: render, edição e overlay de execução"
status: ready
complexity: 5
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-UIE-01", "T-DS-03"]
blocks: ["EST-44"]
capacity_target: sonnet
ui: true
---

# T-UIE-02 · FlowGrid determinístico compartilhado

## 0. Ambiente de Execução Obrigatório
- **Repo:** `C:\Dev2026\superapp` · pacote `@plataforma/ui-engines`.
- **UI:** React 19, CSS Grid, SVG, `@plataforma/design-system`, Vitest e Playwright.
- **Prioridade:** P7. Não furar o gate P1 do Estaleiro.

## 1. Objetivo
Implementar a engine `FlowGrid` da ADR 0016 em modos `edit` e `execution`. O layout é projeção pura
de `FlowGraphViewModel`: colunas por profundidade topológica, linhas por ordem estável, sem X/Y
persistido. A engine emite comandos; adapters de domínio ficam fora desta task.

## 2. Contexto RAG
- `docs/adr/0016-ui-engines-e-flow-grid.md` §§2–4.
- `docs/especificacao-estaleiro.md` §4.
- `docs/caderno-3-sdk/03-engines-and-spec-driven-ui.md` §2.2.
- `tasks/T-UIE-01.md`.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/ui-engines/src/flow/layout.ts` — validação, Kahn/topological depth e rows.
  - `computeLayout(graph: FlowGraphViewModel): FlowLayout` (derivado de ADR 0016 §2).
  - `FlowLayout { columns: Map<number, FlowNodeSlot[]>; errors: FlowLayoutError[] }`.
  - `FlowNodeSlot { nodeId: string; row: number; depth: number }`.
  - `FlowLayoutError { type: "cycle" | "missing_node" | "missing_edge"; nodeId?: string; edgeId?: string }`.
  - Algoritmo: Kahn para ordem topológica + profundidade por arestas; ciclos → erro tipado.
- **[CREATE]** `packages/ui-engines/src/flow/FlowGrid.tsx` — container principal.
  - Props: `graph: FlowGraphViewModel`, `mode: "edit" | "execution"`,
    `execution?: FlowExecutionOverlay`, `onCommand?: (cmd: FlowCommand) => void`.
  - CSS Grid para cards, SVG absoluto para arestas.
  - `FlowCommand = ConnectCommand | DisconnectCommand | UpdateNodeCommand | ReorderCommand`.
- **[UPDATE]** `packages/ui-engines/src/flow/types.ts` — preservar os tipos canônicos entregues por
  T-UIE-01 (`FlowGraphNode`, `FlowGraphEdge`, `FlowGraphViewModel`) e acrescentar somente:
  `FlowExecutionState = "blocked" | "ready" | "running" | "done" | "failed"` e
  `FlowExecutionOverlay { currentNodeId?: string; nodeStates: Readonly<Record<string,
  FlowExecutionState>>; budget?: { sliceId: string; remainingSteps: number; maxSteps: number } }`.
- **[CREATE]** `packages/ui-engines/src/flow/FlowNodeCard.tsx` — card de nó.
  - Props: `node: FlowGraphNode`, `state?: FlowExecutionState`, `current?: boolean`, `mode`,
    `onCommand?`.
  - Estados: default, current (execution), selected (edit), disabled.
  - Acessibilidade: `role="gridcell"`, `aria-label`, `tabIndex`.
- **[CREATE]** `packages/ui-engines/src/flow/FlowEdgeLayer.tsx` — SVG de arestas.
  - Props: `edges: FlowGraphEdge[]`, `columns: Map<number, FlowNodeSlot[]>`.
  - Uma única camada SVG por grid, não SVG por nó.
- **[CREATE]** `packages/ui-engines/src/flow/FlowInspector.tsx` — painel lateral de detalhes.
  - Props: `selectedNode?: FlowGraphNode`, `mode`.
  - Mostra propriedades do nó selecionado; edit mode permite `update_node`.
- **[CREATE]** `packages/ui-engines/src/flow/flow-grid.css` — somente tokens semânticos.
  - `var(--ds-color-*)`, `var(--ds-spacing-*)`, `var(--ds-typography-*)` — sem literais.
- **[CREATE]** `packages/ui-engines/src/flow/flow-layout.test.ts` — testes unitários de layout.
  - Casos 1–5 do §4.
- **[CREATE]** `packages/ui-engines/src/flow/FlowGrid.test.tsx` — testes de render/modo.
  - Casos 6–7 do §4.
- **[CREATE]** `packages/ui-engines/tests/flow-grid.e2e.ts` — smoke Playwright.
  - Caso 8 do §4.
- **[UPDATE]** `packages/ui-engines/src/index.ts` — exports públicos do flow.

## 4. Estratégia de Testes
- **Framework:** Vitest/JSDOM (unit) + Playwright/Chromium (E2E).
- **Caso de teste (numerados):**
  1. Cadeia A→B→C ocupa três colunas (anti-fake: `layout.columns.size === 3`).
  2. B e C com predecessor A ocupam mesma coluna em linhas estáveis (anti-fake: mesma `depth`, `row` diferente).
  3. Join B+C→D posiciona D após ambos (anti-fake: `D.depth > max(B.depth, C.depth)`).
  4. Mesmo grafo em ordem de array diferente produz layout idêntico (anti-fake: `JSON.stringify(layout1) === JSON.stringify(layout2)`).
  5. Nó/aresta ausente e ciclo retornam erro tipado, sem render parcial (anti-fake: `expect(layout.errors).toHaveLength(1)`).
  6. `execution` destaca current node e cinco estados sem habilitar edição (anti-fake: `onCommand` não chamado).
  7. `edit` emite `connect`, `disconnect`, `update_node` e `reorder`; não muta props (anti-fake: spy no onCommand + shallowEqual nas props).
  8. Playwright cria bifurcação e join, redimensiona painel e confirma legibilidade/teclado.
- **Fora de escopo:** ReactFlow, GoRules, persistência de coordenadas, ciclos no v1, SVG manual por nó.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO adicionar ReactFlow, GoRules editor ou outra engine de canvas.
> - NÃO persistir coordenadas.
> - NÃO aceitar ciclo no v1.
> - NÃO executar Zen/tools nem importar plugin-workflows.
> - NÃO criar SVG manual por nó; use uma única edge layer.

Use CSS Grid para cards e SVG absoluto para arestas. Ordenação: `order`, depois `id`. Repetição é
`invoke_workflow` com orçamento, não back-edge. O FlowGrid só projeta o orçamento recebido; não cria,
renova nem impõe limites de execução.

## 6. Feedback de Especificação

**DECIDIDO (arquiteto, 2026-07-16) — contrato e orçamento reutilizam o que já existe.**

1. T-UIE-01 já fixou `FlowGraphNode`, `FlowGraphEdge` e `FlowGraphViewModel`; T-UIE-02 usa esses
   nomes e acrescenta um `FlowExecutionOverlay` separado. Estado de execução não é escondido em
   `metadata` e tipos paralelos `FlowNodeViewModel`/`FlowEdgeViewModel` não serão criados.
2. Repetição reutiliza `maxSteps`, já presente em `plugin-workflows`, `agent-harness`,
   `estaleiro-contracts` e no composition root. `100` é somente o default atual, não teto universal.
   O host escolhe a política por perfil de workload e pode conceder fatias maiores a tradução,
   compressão, ferramentas e outros subprocessos.
3. Uma **fatia de execução durável** possui `sliceId`, orçamento e deadline próprios. Todos os nós e
   subworkflows chamados dentro da fatia consomem o mesmo contador; `invoke_workflow` nunca renova
   orçamento e deve usar fila/frames duráveis, não recursão da stack JavaScript.
4. Workflows podem viver indefinidamente como uma sequência de fatias finitas. Ao atingir o limite,
   o runtime persiste envelope, fila e frames num checkpoint e retorna `suspended: budget_exhausted`.
   Só o scheduler/host abre uma nova fatia e renova o orçamento. Reiniciar o próprio workflow ou
   chamar a si mesmo não renova nada. Falha sem checkpoint válido não gera renovação automática.
5. `maxSteps` limita controle; ferramentas continuam sujeitas aos seus limites próprios de tempo,
   bytes, tokens e permissões. A UI apenas exibe o orçamento e não constitui barreira de segurança.

Extensão visual futura para ciclos ainda exige nova ADR/contrato; a execução contínua acima preserva
cada fatia como DAG observável.

## 7. Definition of Done
- [ ] Layout determinístico e independente de domínio.
- [ ] Modos edit/execution exercitados.
- [ ] Acessibilidade de foco e labels de ports.
- [ ] Lint passa (Gate de Evidência inclui lint desde 2026-07-06).

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/ui-engines build
pnpm --filter @plataforma/ui-engines test
pnpm --filter @plataforma/ui-engines lint
pnpm --filter @plataforma/ui-engines test:e2e
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

- **[2026-07-13T19:17]** - *gpt-5* - `[Triado]`: FlowGrid compartilhado priorizado como substituto incremental do editor local
- **[2026-07-13T18:00]** - *deepseek* - `[Endurecido]`: endureceu spec — 2 decisões em aberto (Seção 6: FlowGraphViewModel tipos abertos, orçamento invoke_workflow). Capacidade: sonnet. NOTA: complexity 5 não exige quebra por esta task ser a engine core do FlowGrid — o layout determinístico é coeso e autocontido.
- **[2026-07-13T22:11]** - *deepseek* - `[Reconciliado]`: status restaurado de draft:pending_decision para draft:triaged (drift corrigido)
- **[2026-07-13T22:11]** - *deepseek* - `[Decisão pendente]`: 2 decisões abertas: FlowGraphViewModel tipos abertos, orçamento invoke_workflow
- **[2026-07-16T09:47]** - *gpt-5* - `[Decidido]`: decisão: orçamento por fatias duráveis; subworkflows compartilham budget; execução infinita renova apenas após checkpoint do host
- **[2026-07-16T09:47]** - *system* - `[Auto-promovida]`: deps todas done
