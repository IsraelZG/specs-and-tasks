---
id: DMM-01
title: "SPIKE: contrato de nó/transição declarativa no plugin-workflows (invoca plugins + encadeia payloads)"
status: draft:placeholder
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [] # EST-16 (plugin-workflows) já done
blocks: ["DMM-02","DMM-03","DMM-04","DMM-05","DMM-06","DMM-10"]
capacity_target: opus-spike # design de contrato central + PoC — decisões em aberto (schema de nó, mecanismo de transição)
---

# DMM-01 · SPIKE: contrato de nó/transição declarativa no plugin-workflows

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo
- **Capacidade-alvo:** opus-spike — entregável é **ADR + PoC**, não implementação final.

## 1. Objetivo
Definir o **contrato central** que torna a delegação multi-modelo declarativa (ADR 0013): como um
**nó** do grafo JDM no `plugin-workflows` (EST-16) **invoca outro plugin** (`plugin-providers`,
`plugin-local-inference`, `plugin-agent-harness`) e como o **output de um nó vira input do próximo**
(a "transição declarada", ex.: `crushToCsv` do `plugin-context` entre Explorer e o próximo estágio).
É o linchpin: DMM-02…06 e DMM-10 dependem deste contrato. Entregável de spike: **ADR de decisão +
PoC executável** que encadeia 2 plugins distintos via workflow (sem lógica hardcoded nos plugins-base).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` — arquitetura + princípio declarativo (fonte).
- [ ] `packages/plugin-workflows/` — engine JDM/Zen entregue em EST-16 (ler o modelo de nó/expressão atual).
- [ ] `packages/plugin-agent-harness/` — `runner.ts` + `VercelAgentAdapter` (EST-06): assinatura de `run`.
- [ ] `packages/plugin-context/` — `crusher.ts`, `l2Compressor.ts`, `crushToCsv` (funções de transição).
- [ ] `packages/plugin-providers/`, `packages/plugin-local-inference/` — invocação de modelo.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-workflows/src/**` — modelo de nó/graph/expressão existente.
- **[READ]** `packages/plugin-agent-harness/src/runner.ts` — o que `run()` recebe/retorna/emite.
- **[READ]** `packages/plugin-context/src/**` — assinaturas de `crushToCsv`/`crusher`/`l2Compressor`.
- **[CREATE]** `docs/adr/0014-contrato-no-workflow-declarativo.md` — ADR: schema de nó (compute vs delegated),
  mecanismo de transição (como o payload flui entre nós), como plugins são resolvidos/injetados.
- **[CREATE]** PoC (local à branch, ex.: `packages/plugin-workflows/poc/chain.poc.test.ts`) que roda um
  workflow encadeando **run do harness (Explorer) → crushToCsv → nó seguinte**, provando o contrato.

## 4. Estratégia de Testes Estrita
- **Framework:** Vitest (Node). O PoC É o teste: encadeia 2 plugins e asserta o payload transformado.
- **Fora de Escopo:** UI, os 4 estágios finais (são DMM-02…05), templates de produção.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** hardcodar tradução/compressão/papéis dentro de `plugin-context`/`plugin-dispatcher` — o
>   ponto do spike é provar que isso vive como **nó/transição declarativa** no `plugin-workflows`.
> - **NÃO** entregar implementação dos 4 estágios — só o **contrato + PoC**. Estágios são DMM-02…05.
> - **NÃO** adicionar dep nova sem justificar no ADR.

### Pegadinhas conhecidas
- A engine JDM (Zen) pode não ter, nativamente, um nó "invoca função async de plugin". Decidir no ADR
  se é um *custom node type*, uma *expression function* registrada, ou um *hook* pré/pós-nó — e por quê.

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] ADR 0014 responde: schema de nó, mecanismo de transição, resolução de plugin — com trade-offs.
- [ ] PoC roda verde encadeando ≥2 plugins distintos via workflow.
- [ ] Nenhuma lógica de estágio hardcoded em plugin-base.

### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
