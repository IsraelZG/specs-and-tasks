---
id: DMM-13
title: "Laboratório Genético de Workflows (Autoajuste A/B) — casca decomposta"
status: draft:decomposed
complexity: 7
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-12"]
blocks: []
capacity_target: sonnet
subtasks: ["DMM-13a", "DMM-13b", "DMM-13c"]
---

# DMM-13 · Laboratório Genético de Workflows (casca decomposta)

> **⚠️ TASK-CASCA DECOMPOSTA — NÃO EXECUTA DIRETAMENTE.** Complexidade 7 ultrapassa o
> limiar "5 exige quebra" da skill `endurecer-task`. Escopo fatiado em 3 sub-pieces por
> **seam de execução** (não por camadas técnicas):

| Sub-task | Preocupação | Capacidade-alvo | Deps propostas |
|---|---|---|---|
| **DMM-13a** — Módulo "Laboratório" no `plugin-dispatcher` (clone worktrees, despacha N variantes em paralelo, integra relatório) | dispatch | sonnet | DMM-06, DMM-12 |
| **DMM-13b** — Persona *Meta-Arquiteto* (prompt estruturado para mutar JSON/JDM: swap de nós, alteração de prompts, troca de modelo) | geração | sonnet | DMM-01, DMM-06 |
| **DMM-13c** — Consolidado de métricas (Fitness Function integrando estatísticas do DMM-11) | pontuação | sonnet | DMM-11, DMM-12 |

> **Nota:** as deps propostas são derivadas de quem cada sub-piece realmente consome. Em
> pass-2, quando DMM-01/DMM-06/DMM-11/DMM-12 virarem `done`, reendurecer cada filho com
> assinaturas TS concretas.

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo
- **Esta é uma task-casca decomposta.** A capacidade-alvo da casca (`sonnet`) é a soma das
  capacidades dos filhos; nenhum worker recebe esta ID para executar.

## 1. Objetivo (visão consolidada)
Implementar o ápice da autonomia sistêmica: a evolução de workflows via **Algoritmo Genético**.
Um usuário poderá acionar o Laboratório Genético manualmente na UI. O *Meta-Arquiteto* irá
gerar workflows variantes (mutando JSON/JDM), despachá-los paralelamente em worktrees isoladas
e processá-los com o Nó Juiz. Um relatório final informará as métricas de Fitness (Custo,
Tempo, Sucesso) para que o humano escolha qual variante será o novo padrão (template) daquele
Tipo de Tarefa.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] DMM-06 (Workflows por Tipos Dinâmicos).
- [ ] ADR 0013 / ADR 0014 — Contratos de nós declarativos (DMM-01, ainda `pending_decision`).

## 3. Escopo de Arquivos (Inputs e Outputs)
- Veja tabela acima — cada sub-piece tem escopo próprio em `tasks/DMM-13{a,b,c}.md`.
- **Esta casca não tem §3 próprio.**

## 4. Estratégia de Testes Estrita
- Veja `tasks/DMM-13a.md` (teste A/B com 2 genomas), `tasks/DMM-13b.md` (teste de mutação),
  `tasks/DMM-13c.md` (teste de Fitness com pesos).
- **Esta casca não tem §4 próprio.**

## 5. Instruções de Execução (Step-by-Step)
- **NÃO-FAZER globais** (valem p/ todos os filhos):
  - **NÃO** rodar o laboratório genético de forma automática nas tasks do dia a dia. É um
    processo caro de tentativa-e-erro ativado **manualmente**.
  - **NÃO** sobrepor diretórios; garantir isolamento absoluto (`git worktree`) para cada
    variante testada.
- **Esta casca não tem §5 próprio além do acima.**

### Pegadinhas conhecidas (consolidadas)
- "Persona Meta-Arquiteto" — persona é um **artefato do harness** (cfr. `runner.ts` aceita
  `persona` em `RunOptions`? — verificar em pass-2 contra
  `packages/plugin-agent-harness/src/types.ts:19`; hoje só
  `taskId, model, cwd, prompt, timeoutMs, onEvent, signal, maxSteps, cancelWatcher, tools` —
  **persona NÃO está na assinatura atual**, será necessário adicionar). Flag p/ pass-2.
- "JSON/JDM" mutar — formato JDM é o do `plugin-workflows` (ver `types.ts:5-11`:
  `WorkflowDefinition.content: string` — JSON cru de grafo JDM). Mutação opera sobre esse
  string.

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:decomposed` via `decompose`
- **Motivo:** `complexity: 7` no frontmatter. A skill `endurecer-task` define "complexity 5
  exige quebra" — 7 está bem acima do limiar. O §3 já lista 3 sub-pieces com seams de
  execução claros (dispatch / geração / pontuação), então o fatiamento é natural, não
  artificial.
- **Por que NÃO `triaged`:** triaged implica execução futura; com complexity 7 em worker
  ≤ Sonnet, "execução" vai inevitavelmente colidir com o "5 exige quebra". Decompor AGORA
  torna a fila visível no painel como 3 pieces sonnet amigáveis.
- **Por que NÃO `harden`:** DMM-13 ainda depende de DMM-12 (e transitivamente de DMM-01,
  DMM-06, DMM-11). As 3 sub-pieces herdam essas deps e serão endurecidas quando os pais
  fecharem.
- **Pré-endurecimento já válido:** `subtasks: [DMM-13a, DMM-13b, DMM-13c]`,
  `parent_task: "DMM-13"` em cada filho, `capacity_target: sonnet` em cada (e não opus-spike
  — cada piece é bem-definido quando o pai fecha).
- **Próximo passo:** após DMM-12 → done, reendurecer cada filho (DMM-13a/b/c) com
  assinaturas TS concretas. Painel listará DMM-13a/b/c como "REENDURECER".

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] DMM-13a, DMM-13b, DMM-13c todos `done`.

### Verificação automática
- Veja `tasks/DMM-13a.md`, `tasks/DMM-13b.md`, `tasks/DMM-13c.md`.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T19:12]** - *arquiteto:minimax* - `[Decomposto]`: complexity 7 > 5 (exige quebra); fatiado em DMM-13a (dispatch), DMM-13b (geração), DMM-13c (pontuação)
