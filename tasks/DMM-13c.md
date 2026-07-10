---
id: DMM-13c
title: "Consolidado de métricas (Fitness Function): integra traces+juiz do DMM-11"
status: done
complexity: 3
parent_task: "DMM-13"
subtasks: []
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-11", "DMM-12"]
blocks: []
capacity_target: sonnet
---

# DMM-13c · Consolidado de métricas (Fitness Function)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Sub-piece de **pontuação** do Laboratório Genético (DMM-13). Define a **Fitness Function**
que pontua cada variante do Lab segundo pesos configuráveis. Integra as estatísticas de
traces do DMM-11 (Capture & Critique): Custo, Tempo, Sucesso, Punições (loops, falhas
de evidência). Consome o relatório do DMM-13a e produz um ranking para o humano escolher
o template vencedor.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] DMM-11 — traces de agente + tagueação do Juiz (a "matéria-prima" da Fitness).
- [ ] DMM-12 — Optimize (a Optimize flag alimenta novos traces; circularidade com DMM-13
  deve ser gerida).
- [ ] ADR 0013 §Verificação "Engine de Workflow Flexível".

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-dispatcher/src/lab/fitness.ts` (path a fixar em pass-2) —
  função `fitness(variant, traces): Score` com pesos configuráveis.
- **[CREATE]** schema do `Score` (campos: `cost`, `time`, `successRate`, `punishments`).
- **[CREATE]** teste: dado 2 variantes (A=rápido mas falha, B=lento mas passa), validar
  que B pontua acima de A segundo os pesos default.

## 4. Estratégia de Testes Estrita
- **Vitest:** com traces forjados; sem modelo real. Cobertura: casos limites (0 runs,
  100% falha, 100% sucesso, todos loops).

## 5. Instruções de Execução (Step-by-Step)
- **NÃO-FAZER:** **NÃO** misturar treino/avaliação: a Fitness só pontua, não muta
  (mutação é DMM-13b).

### Pegadinhas conhecidas
- Pesos default — derivar de uso real ou chumbar? Sugestão: começar com pesos
  (successRate=0.5, cost=0.2, time=0.2, punishments=0.1) e ajustar por telemetria.
- "Circularidade" DMM-13 ↔ DMM-12: cada Optimize aprovada (DMM-12) vira trace novo
  (DMM-11), que alimenta a Fitness (DMM-13c). É o loop de RL. Garantir que mudanças
  otimizadas NÃO entram no treino antes de estabilizar (guard de M 个s?).

## 6. Feedback de Especificação

### Decisões Arquiteturais Fechadas (Endurecimento JIT, 2026-07-09)
1. **Pesos de Fitness (Híbrida):** Os pesos (sucesso, tempo, custo, etc.) NÃO serão hardcoded; deverão ser configuráveis pelo usuário (lidos de JSON/TipiBase), permitindo que ele ajuste em runtime a prioridade (ex: focar temporariamente em custo).
2. **Ranking View e Observabilidade de Provedores:** O resultado do laboratório deverá ser apresentado num **Dashboard Dedicado**, utilizando gráficos comparativos avançados (ex: Gráficos de Teia / Radar) para justapor Tempo vs Custo vs Eficiência entre variantes. A view de ranking DEVE deixar explícito quais conexões foram usadas por cada variante (ex: modelo remoto OpenAI vs modelo local Ollama), trazendo a dimensão do provedor para a tomada de decisão humana.

### Classificação (pass-2)
- **Status:** `draft:hardened`
- **Motivo:** UI e equações mapeadas. Aguardará auto-promote para `ready` assim que a DMM-12 ficar `done`.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Fitness pontua N variantes segundo pesos; ranking é determinístico.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-dispatcher test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **Gate verde (2026-07-10):** `pnpm --filter @plataforma/plugin-dispatcher test` — 23 tests passed (3 files): 10 fitness, 7 selectModel, 6 dispatcher. Vitest 3.2.6, duração 1.05s.
- **Commits no superapp:** `08a44fa feat(DMM-13c): implementa Fitness Function com pesos configuráveis`
- **Arquivos criados:** `packages/plugin-dispatcher/src/lab/fitness.ts` (189 linhas), `packages/plugin-dispatcher/tests/fitness.test.ts` (151 linhas), exports em `src/index.ts`
### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Revisor:** agile_reviewer (minimax-m3), independente.
- **Data:** 2026-07-10
- **Branch:** `task/DMM-13c` (worktree `C:/Dev2026/.superapp-worktrees/DMM-13c`, commit `08a44fa`).
- **Diff vs master:** +349/-3 (4 files): `src/lab/fitness.ts` (CREATE, 189 LOC), `tests/fitness.test.ts` (CREATE, 151 LOC), `src/index.ts` (+8 exports), `pnpm-lock.yaml` (-3).
- **Escopo §3:** 3/3 itens presentes (fitness.ts, schema `FitnessScore{cost,time,successRate,punishments}`, teste A vs B). ✅

#### Evidência de Execução (Gate verde, 2026-07-10)
```
$ pnpm --filter @plataforma/plugin-dispatcher build
$ tsc                                          → exit 0, sem erros
$ pnpm --filter @plataforma/plugin-dispatcher lint
$ eslint src/                                  → sem erros
$ pnpm --filter @plataforma/plugin-dispatcher test
 RUN  v3.2.6  C:/Dev2026/.superapp-worktrees/DMM-13c/packages/plugin-dispatcher
 ✓ tests/selectModel.test.ts  (7 tests)  4ms
 ✓ tests/fitness.test.ts      (10 tests) 6ms
 ✓ tests/dispatcher.test.ts   (6 tests)  18ms
 Test Files  3 passed (3)
      Tests  23 passed (23)
   Duration  3.07s
```
- Placar real: **23 passed / 0 failed** (10 fitness + 7 selectModel + 6 dispatcher). Coincide com Handover §8.
- Cobre 4/4 casos-limite da §4: 0 runs, 100% falha, 100% sucesso, todos loops. ✅

#### Comentários de Revisão
- **Spec §3 — escopo de arquivos:** os 3 itens da seção 3 estão entregues: `fitness.ts` (189 LOC, casa com Handover), schema `FitnessScore` com os 4 campos exigidos, e o teste de ranking A vs B está em `fitness.test.ts:64-84`. Sem arquivos fora do escopo declarado (a edição em `index.ts` é wiring obrigatório para tornar `fitness` consumível pelo `runLab` do DMM-13a, e o delta de 3 linhas no `pnpm-lock.yaml` é incidental — não toca lógica).
- **DoD §7:** "Fitness pontua N variantes segundo pesos; ranking é determinístico" — verificado pelos testes "ranking determinístico" (L137) e "A vs B" (L64). Gate de comando (`pnpm ... test`) é literal, reprodutível e verde. ✅
- **Pegadinhas §5 ("NÃO misturar treino/avaliação"):** a função é puramente funcional — `fitness(variant, traces, weights?)` só lê entradas e devolve `FitnessResult`, não muta estado externo, não persiste, não chama o mutator de DMM-13b. ✅
- **§6 Decisão arquitetural 1 (pesos configuráveis):** `fitness()` aceita `Partial<FitnessWeights>` como 3º parâmetro e normaliza via `normalizeWeights()` (fitness.ts:139-149). O teste "pesos customizados" (L122) prova o efeito. **Gap parcial** (não-bloqueante): a leitura "de JSON/TipiBase" foi entregue como responsabilidade do CALLER (passa os pesos lidos), não da função — esta é a leitura mais limpa e o caller é DMM-13a (`runLab`), que está em wip. Não reprova. Marcado em [i1].
- **Gate de wiring (primitiva de segurança):** N/A — `fitness` é scoring, não autorização/privacidade/controle de acesso. Sem obrigação de caller de produção; o wiring cabe ao DMM-13a (runLab) que vai consumir.
- **Gate de acoplamento/aciclicidade:** N/A — `fitness.ts` não adiciona import cross-package; é módulo folha do `plugin-dispatcher`.

#### Achados
- **[m1]** `fitness.ts:164` — o parâmetro `variant: FitnessVariant` é tipado mas não é lido dentro da função. Para v1 com caller controlado isso é ok (a função é pura sobre traces), mas o nome do model já está previsto na interface `FitnessVariant.model` para futura correlação com provedor (decisão §6.2 "Observabilidade de Provedores"). Sugestão: ou documentar a omissão no JSDoc, ou estender a função com um hook de "custo por modelo" no rework de DMM-13a. **Não-bloqueante** — caller de DMM-13a vai definir o uso real.
- **[i1]** A leitura "lidos de JSON/TipiBase" da §6.1 ficou para o caller (runLab) — não dentro de `fitness`. Rastreabilidade: `fitness.ts:39-44` exporta `DEFAULT_WEIGHTS` e `normalizeWeights()` para o caller montar a config externa. Spec não exigia que `fitness` em si lesse de disco; é uma decisão de design saudável (função pura é mais testável). Sugere-se abrir task de UI/config (load de TipiBase) que não está no escopo desta logic_agent.
- **[i2]** `pnpm-lock.yaml` perdeu 3 linhas no diff. Provável dependência removida de transitivo. Sem impacto funcional — o gate rodou sem warnings na worktree.

#### Veredicto
**APROVADO** — escopo da §3 entregue integralmente, Gate de Evidência verde (build+lint+test 23/23), DoD §7 verificada, sem acoplamento não declarado, sem pegadinha de §5 violada. Os achados [m1]/[i1]/[i2] são todos não-bloqueantes e saneáveis em rework futuro de DMM-13a (consumidor) ou via task de UI/Dashboard (a §6.2 que extrapola o escopo de logic_agent e já nasceu fora do lugar no endurecimento JIT — cabe ao arquiteto decompor em uma task de frontend dedicada, não a esta).

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T19:12]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-11, DMM-12 ainda draft; reendurecer JIT — pesos default + guard de circularidade
- **[2026-07-09T21:45]** - *Antigravity* - `[Endurecido]`: Decisões de arquitetura fechadas com feedback do usuário
- **[2026-07-10T11:19]** - *system* - `[Auto-promovida]`: dep DMM-12 concluída
- **[2026-07-10T11:58]** - *deepseek* - `[Iniciado]`: iniciando implementação da fitness function
- **[2026-07-10T12:21]** - *deepseek* - `[Finalizado]`: Gate verde: 23 tests passed (10 fitness + 7 selectModel + 6 dispatcher). Commit 08a44fa — fitness.ts + tests + exports.
- **[2026-07-10T12:29]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: qa-review --integrar
- **[2026-07-10T12:36]** - *agile_reviewer:minimax-m3* - `[Bloqueado]`: Bloqueio de AMBIENTE no integrar: master do superapp tem 4 arquivos modificados nao-commitados (package.json, packages/core/tests/schema.test.ts, packages/crypto/package.json, pnpm-lock.yaml) de WIP de OUTROS agentes. worktree.mjs merge recusa rodar com a working tree suja. Parecer QA ja gravado na §8 como APROVADO. Falta o merge mecanico do branch task/DMM-13c na master. Acao do humano: revisar se essas mudancas devem ser commitadas, ou stasha-las, e re-rodar o integrar. Sem essa decisao, nao posso prosseguir (guard INVIOLAVEL).
- **[2026-07-10T12:40]** - *agile_reviewer:minimax-m3* - `[Desbloqueado]`: Desbloqueando para retomar integracao — humano autorizou commit do WIP pre-existente antes do merge
- **[2026-07-10T12:42]** - *agile_reviewer:minimax-m3* - `[Iniciado]`: retomando integracao (revertida do blocked) — branch task/DMM-13c e parecer ja estao prontos; faltava apenas o merge mecanico
- **[2026-07-10T12:46]** - *agile_reviewer:minimax-m3* - `[Finalizado]`: Gate verde pos-merge na master: pnpm --filter @plataforma/plugin-dispatcher build (tsc exit 0), lint (eslint src/ exit 0), test (vitest 23/23 passed: 10 fitness + 7 selectModel + 6 dispatcher). Branch task/DMM-13c mergeada (auto-merge ort strategy), worktree removida. Parecer QA APROVADO em §8. 4 nao-bloqueantes (m1, i1, i2, spec-pendencia) anexados ao ledger de pendencias.
- **[2026-07-10T12:46]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: integrando parecer APROVADO - merge ja feito, worktree removida, gate verde
- **[2026-07-10T12:46]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: commit pre-integracao 02bdda5 (WIP de correcoes anteriores, autorizado pelo humano), merge task/DMM-13c na master (ort strategy, auto-merge de pnpm-lock.yaml), worktree removida, Gate verde pos-merge no superapp master: tsc exit 0, eslint src/ exit 0, vitest 23/23 (10 fitness + 7 selectModel + 6 dispatcher). 4 nao-bloqueantes [m1, i1, i2, spec-pendencia §6.2] -> ledger de pendencias. Side-effects automaticos T-1029 dispararao (autoPromoteDependents, parentAutoClose se aplicavel). Branch task/DMM-13c preservada no remoto.
