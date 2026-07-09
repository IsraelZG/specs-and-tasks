---
id: DMM-01
title: "SPIKE: orquestrador declarativo (Zen decide, loop executa) — contrato + rename + PoC"
status: review
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [] # EST-16 (plugin-workflows/Zen) já done
blocks: ["DMM-02","DMM-03","DMM-04","DMM-05","DMM-06","DMM-10"]
capacity_target: opus-spike # design de contrato central + PoC; decisões RESOLVIDAS (ver §6)
---

# DMM-01 · SPIKE: orquestrador declarativo (Orchestrator Pattern)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo
- **Capacidade-alvo:** opus-spike — entregável é **ADR 0014 + rename + PoC**, não a implementação final dos estágios.

## 1. Objetivo
Definir e provar o **contrato do orquestrador declarativo** (ADR 0013). Fato descoberto no
endurecimento: o `plugin-workflows` de hoje é **só o Zen engine** (`@gorules/zen-engine`) — um motor
de **decisão puro e síncrono** (`WorkflowEngine.evaluate(ctx) → result`), que **decide quem rodar**,
não executa plugins async. Logo a arquitetura é **Orchestrator Pattern**: o Zen decide o próximo
passo; um **loop orquestrador assíncrono** executa o plugin escolhido e realimenta o resultado.

Este spike: (a) **renomeia** o pacote atual `@plataforma/plugin-workflows` → `@plataforma/plugin-zen-engine`
(é só o motor de decisão; zero consumidores hoje → rename barato); (b) cria o **novo**
`@plataforma/plugin-workflows` = o **orquestrador** (fila de passos + envelope + handler-map +
loop que consulta o zen-engine); (c) entrega **ADR 0014** com o contrato; (d) um **PoC** que encadeia
2 plugins reais (`harness (stub) → crushToCsv`) pela fila, provando o contrato ponta-a-ponta.

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/adr/0013-delegacao-multimodelo-declarativa.md` — arquitetura + princípio declarativo (fonte).
- [x] `packages/plugin-workflows/src/{evaluate,decide,store,types}.ts` — Zen engine + JDM store + DecisionHook (EST-16). **Confirmado:** só decisão pura, sem execução async.
- [x] `packages/plugin-agent-harness/src/{runner,types}.ts` — `run(RunOptions)→AgentRunResult`, emite `AgentEvent` via `onEvent` (EST-06).
- [x] `packages/plugin-context/src/crusher.ts` — `crushToCsv(jsonText: string): string` (transição pura).
- [x] `apps/estaleiro/core/src/ports/store.ts` — `StorePort { get/set/delete }` (base durável futura da fila).
- [x] `packages/plugin-providers/src/registry.ts` — `resolveModel`/`PROVIDERS` (fonte de LanguageModel, p/ estágios).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-workflows/src/**` (será renomeado), `packages/plugin-agent-harness/src/runner.ts`,
  `packages/plugin-context/src/crusher.ts`, `apps/estaleiro/core/src/ports/store.ts`.
- **[RENAME]** `packages/plugin-workflows/` → `packages/plugin-zen-engine/` (dir + `package.json.name` →
  `@plataforma/plugin-zen-engine`; ajustar `tsconfig`/`turbo` refs se houver). Sem mudança de API interna.
- **[CREATE]** `packages/plugin-workflows/` (NOVO — o orquestrador):
  - `src/envelope.ts` — `Envelope` (JSON imutável) + `applyDelta(env, delta): Envelope` (merge estilo Redux).
  - `src/queue.ts` — `interface StepQueue { enqueue(step): Promise<void>; dequeue(): Promise<Step|null>; }`
    + `createInMemoryQueue(): StepQueue` (impl do spike — **gambiarra temporária**, ver §5).
  - `src/orchestrator.ts` — o loop: dequeue → `zenEngine.evaluate(envelope)` decide próximo → resolve
    handler no **handler-map (DI)** → executa → `applyDelta` → enqueue próximo(s) → repete até terminal.
  - `src/types.ts` — `Step`, `Envelope`, `HandlerMap` (`Record<string, (args, env) => Promise<Delta>>`),
    `Delta`, `OrchestratorOptions { zen, queue, handlers }`.
  - `src/index.ts` — exports públicos.
  - `poc/chain.poc.test.ts` — PoC: grafo Zen que decide `harness → crushToCsv`; handler-map com harness
    **stub** (retorna JSON) + `crushToCsv` real; asserta o envelope final com o CSV denso.
- **[CREATE]** `docs/adr/0014-contrato-orquestrador-declarativo.md` — o contrato (ver §6).

## 4. Estratégia de Testes Estrita
- **Framework:** Vitest (Node). O **PoC É o teste**: encadeia 2 plugins pela fila e asserta o envelope final.
- **Fora de Escopo:** UI, os 4 estágios de produção (DMM-02…05), a fila durável (task futura), PluginRegistry (task futura).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** tentar fazer o Zen `await` plugin async (custom-function hack) — Decisão 1-B rejeitada:
>   quebra a pureza/serialização do Zen. Zen **só decide**; o loop executa.
> - **NÃO** hardcodar tradução/compressão/papéis nos plugins-base — vivem como passos do orquestrador.
> - **NÃO** implementar os 4 estágios nem a fila durável — só contrato + PoC com fila **in-memory**.
> - **NÃO** criar PluginRegistry aqui — resolução é **handler-map por DI** (mapa `{nome→fn}` injetado). O
>   registry real fica para **DMM-14** (no `packages/core` do superapp).

### Pegadinhas conhecidas
- **A impl da fila/store no Estaleiro é GAMBIARRA TEMPORÁRIA (in-memory / fs).** O ADR 0014 DEVE
  registrar por escrito: no **superapp**, `StepQueue`/estado do workflow **reutilizam as primitivas
  existentes** — **nodes/edges** do grafo (`packages/core`) para definição+histórico durável e
  **canais efêmeros** (`packages/transport`) para o trânsito dos passos. O `plugin-workflows` define a
  **interface (port)**; Estaleiro dá uma impl descartável; superapp dá a impl nativa. (Decisão do humano, 2026-07-08.)
- O `crushToCsv` recebe **JSON string** (`crusher.ts:48`) — o handler do harness-stub deve emitir JSON.
- Zen `evaluate(context)` retorna `{ result }` — o grafo do PoC decide via campos do envelope, não side-effects.

1. **[RENAME]** `plugin-workflows` → `plugin-zen-engine` (dir + name). Build verde do pacote renomeado.
2. **[CREATE]** novo `plugin-workflows`: `envelope.ts`, `queue.ts` (in-memory), `types.ts`, `orchestrator.ts`, `index.ts`.
3. **[ADR]** Escrever `docs/adr/0014-contrato-orquestrador-declarativo.md` (contrato + princípio de reuso no superapp).
4. **[PoC]** `poc/chain.poc.test.ts` — grafo Zen decide `harness→crushToCsv`; roda o loop; asserta envelope final.
5. Gate: build + test dos pacotes tocados; colar saída na §8.

## 6. Feedback de Especificação (Spec Feedback Loop)

### ✅ DECISÕES RESOLVIDAS (humano, 2026-07-08)
1. **Schema de nó → Orchestrator Pattern (Opção A).** Zen não invoca plugins; avalia o JDM e o loop
   orquestrador (novo `plugin-workflows`) executa o passo decidido e realimenta o resultado. (Zen puro/rápido; padrão Temporal/Step-Functions.)
2. **Transição → Redux-style Context Envelope (Opção A).** Estado = JSON imutável (`Envelope`); cada
   passo retorna um **delta**; o orquestrador faz merge e passa o envelope atualizado ao Zen. (Observabilidade total p/ o pipeline de RL.)
3. **Resolução de plugin → Handler-map por DI (agora).** JDM emite **strings**; o orquestrador resolve
   no mapa `{nome→handler}` injetado no construtor (padrão DI já usado em `createFileStore({fs})`). JDM
   segue 100% JSON portátil. **NÃO existe PluginRegistry no EST-02** — só `PluginManifest` + ports.
   → **Deferido p/ DMM-14:** mecanismo tipo PluginRegistry (lookup-por-nome) no `packages/core` do superapp.
4. **Fila/storage → Queue port + impl in-memory no spike.** Durável e nativa do superapp é task futura
   (**DMM-15**), reutilizando **nodes/edges + canais efêmeros** (ver §5 pegadinha — registrar no ADR 0014).

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax) — *histórico, decisões acima resolvem*
- Marcado `draft:pending_decision` (opus-spike, 3 decisões abertas). Fonte RAG: ADR 0013 §Consequências.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `plugin-workflows` renomeado p/ `plugin-zen-engine` (build verde, name atualizado).
- [ ] Novo `plugin-workflows` (orquestrador) com Envelope + StepQueue(in-memory) + handler-map + loop.
- [ ] ADR 0014 fixa: Orchestrator Pattern, Envelope, handler-map DI, e **por escrito** o reuso no superapp (nodes/edges + canais efêmeros; impl Estaleiro = temporária).
- [ ] PoC roda verde encadeando `harness(stub) → crushToCsv` pela fila; envelope final tem o CSV.
- [ ] Nenhuma lógica de estágio hardcoded em plugin-base; sem PluginRegistry; sem fila durável.

### Verificação automática
```bash
pnpm --filter @plataforma/plugin-zen-engine build
pnpm --filter @plataforma/plugin-workflows build
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T18:37]** - *arquiteto:minimax* - `[Decisão pendente]`: spike: entregável = ADR 0014 + PoC; decisions: schema de nó, mecanismo de transição, resolução de plugin
- **[2026-07-08T21:14]** - *arquiteto:claude-opus* - `[Decidido]`: Decisões resolvidas pelo humano: (1) Orchestrator Pattern — Zen decide, loop executa; (2) Redux Envelope — delta merge; (3) handler-map por DI agora (PluginRegistry real → DMM-14 no core); fila = Queue port + in-memory no spike, durável nativa (nodes/edges + canais efêmeros) → DMM-15. Rename plugin-workflows→plugin-zen-engine + novo plugin-workflows=orquestrador. Spec DMM-01 endurecida.
- **[2026-07-08T21:15]** - *arquiteto:claude-opus* - `[Promovida p/ ready]`: deps [] (EST-16 done); spec endurecida com decisões resolvidas → ready
- **[2026-07-08T21:15]** - *claude-opus* - `[Iniciado]`: iniciando spike: rename plugin-workflows→plugin-zen-engine + novo plugin-workflows (orquestrador) + ADR 0014 + PoC
- **[2026-07-09T11:29]** - *Antigravity* - `[Finalizado]`: Spike concluída com sucesso: ADR 0014 criado, Orquestrador separado do Zen Engine, e PoC testado verde.
