---
id: DMM-15
title: "Fila/estado durável do orquestrador: impl nativa do superapp (nodes/edges + canais efêmeros)"
status: ready
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"] # precisa da interface StepQueue/Envelope do orquestrador
blocks: []
capacity_target: sonnet # escala p/ opus-spike se o mapeamento envelope↔grafo CRDT for não-trivial
---

# DMM-15 · Fila/estado durável do orquestrador (impl nativa do superapp)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
O DMM-01 entrega a fila do orquestrador como **interface (`StepQueue`)** + uma impl **in-memory que é
gambiarra temporária** (só o Estaleiro standalone). Esta task entrega a impl **nativa e durável do
superapp**, que **reutiliza as primitivas existentes** (decisão do humano, 2026-07-08, ADR 0014):
- **nodes/edges** do grafo CRDT (`packages/core`) — definição de workflow + **histórico durável** dos
  passos/envelope (resumível, auditável, observável para o pipeline de RL do DMM-11);
- **canais efêmeros** (`packages/transport`) — o **trânsito** dos passos (a "mensageria" do loop).
Sem reinventar fila/persistência: o workflow vira grafo + mensagens no que o superapp já tem.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0014-contrato-orquestrador-declarativo.md` (DMM-01) — `StepQueue`/`Envelope` + §reuso no superapp.
- [ ] `packages/core/src/**` — nodes/edges, projection, rbsr (modelo de grafo CRDT).
- [ ] `packages/transport/src/**` — canais efêmeros (mensageria) a reutilizar como transporte de passos.
- [ ] `apps/estaleiro/core/src/ports/store.ts` — `StorePort` (fallback durável simples se o mapeamento a grafo for pesado).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** interface `StepQueue`/`Envelope` (DMM-01), `packages/core/src/**` (nodes/edges), `packages/transport/src/**` (canais).
- **[CREATE]** impl de `StepQueue` durável sobre nodes/edges + canais efêmeros (path a fixar no endurecimento).
- **[CREATE]** teste: enfileirar/consumir passos sobrevivendo a "restart" (releitura do grafo); histórico do envelope reconstruído.

## 4. Estratégia de Testes Estrita
- Vitest. Métrica: durabilidade (estado reconstruído do grafo) + ordem FIFO. **Fora de Escopo:** rede P2P real.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** reimplementar CRDT/fila — **reutilizar** `packages/core` (nodes/edges) e `packages/transport` (canais).
> - **NÃO** mudar a interface `StepQueue` do DMM-01 — esta é só a **impl** durável (a in-memory fica p/ testes).
> - **NÃO** acoplar o orquestrador a esta impl — ele recebe uma `StepQueue` por DI (in-memory OU esta).

### Pegadinhas conhecidas
- Se mapear `Envelope`/passos para nodes/edges do CRDT for não-trivial, **escalar para opus-spike** (ADR de mapeamento) antes de codar.

## 6. Feedback de Especificação
### Decisões Arquiteturais Fechadas (2026-07-09)
1. **Mapeamento Estrutural (Event Sourcing):** Opção B escolhida. O `Envelope` **não** é salvo in-place; ele é materializado via `reduce` a partir da linhagem de Deltas. Cada passo (`delta`) concluído vira um `SignedNode` (tipo `WORKFLOW_STEP`), anexado ao grafo do Superapp via aresta `MUTATES`.
2. **Durabilidade no Estaleiro:** Não usaremos o TinyBase da port `store.ts` (que é apenas para plugins salvarem KV arbitrário). O Estaleiro instanciará nativamente o `SqliteStorage` (exportado de `packages/core`) em um arquivo local (ex: `.estaleiro/orchestrator.db`) rodando as migrations de `schema.ts`. Isso garante que o código escrito na DMM-15 seja **100% nativo** e o mesmo que rodará no Superapp.
3. **Fila de Trânsito Efêmera:** Como o motor Zen é puramente determinístico, a fila de passos pendentes (o que o `enqueue` empurra) vive **apenas em memória**. Em caso de queda/crash, o boot lê o `Envelope` do disco, passa pelo Zen e o Zen deduz perfeitamente qual o próximo passo e o re-enfileira de graça. Sem sujeira temporária no banco.

### Classificação (pass-2)
- **Status:** `draft:hardened`
- **Motivo:** Mapeamento resolvido. Escopo 100% alinhado com a topologia CRDT existente. Pronta para Worker.
## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `StepQueue` durável sobre nodes/edges + canais efêmeros; workflow sobrevive a restart; ordem preservada.
### Verificação automática
```bash
pnpm --filter @plataforma/core test
pnpm --filter @plataforma/transport test
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-09T12:06]** - *Antigravity* - `[Decisão pendente]`: Falta mapeamento estrutural entre Envelope e grafo CRDT.
- **[2026-07-09T17:55]** - *Antigravity* - `[Decidido]`: Decisão de Event Sourcing com core persistência fechada
- **[2026-07-09T17:56]** - *Antigravity* - `[Promovida p/ ready]`: Mapeamento fechado com o arquiteto
