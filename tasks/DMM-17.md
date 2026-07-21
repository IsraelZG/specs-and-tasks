---
id: DMM-17
title: "Tool invoke_workflow com orçamento, capacidades e proteção contra ciclos"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-16", "DMM-15"]
blocks: ["T-CTX-01", "T-COLL-01", "T-UIE-04"]
capacity_target: sonnet
---

# DMM-17 · Tool `invoke_workflow` com orçamento, capacidades e proteção contra ciclos

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; localizar contrato de run/envelope e registry após DMM-16.
- **Runtime:** Node.js e TypeScript; `pnpm`; Vitest.
- **Capacidade-alvo:** sonnet; triagem inicial, dependente do contrato efetivo de DMM-16.

## 1. Objetivo
Entregar a Tool canônica `invoke_workflow`. Ela é a única forma de um workflow iniciar outro workflow e a mesma Tool deve permanecer disponível à UI e MCP. A Tool propaga orçamento, prazo, correlation ID e capabilities, recusando ciclo, profundidade excessiva, schema inválido e ampliação de autoridade.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §3.
- [especificação do Estaleiro](../docs/especificacao-estaleiro.md) §§1 e 3 — não há nó de sub-workflow; há `invoke_workflow`.
- [ADR 0016](../docs/adr/0016-ui-engines-e-flow-grid.md) — repetição sem back-edge e com orçamento.
- [DMM-16](./DMM-16.md) — descriptor e adapters únicos.
- [DMM-15](./DMM-15.md) — estado durável de runs.

## 3. Escopo a endurecer
- **[READ]** Tool descriptor/adapters de DMM-16 e modelo de run de DMM-15.
- **[CREATE/UPDATE]** implementação registrada de `invoke_workflow` no pacote confirmado.
- **[CREATE]** testes do runtime, sem UI real; DMM-16 cobre paridade de superfícies.

## 4. Casos obrigatórios no endurecimento
1. Filho recebe o mesmo `correlationId` e deadline menor ou igual ao pai.
2. Filho não recebe capability que o chamador não possua.
3. Entrada incompatível com o schema do filho é recusada antes de executar passo algum.
4. A→A e A→B→A são recusados com trace legível.
5. Profundidade/orçamento esgotados recusam nova invocação sem renovar contador.
6. Run idempotente reaproveita ou recusa duplicata conforme a política registrada.

## 5. Não fazer
- Não adicionar `workflowRef` ao schema Zen/FlowGrid.
- Não criar back-edge visual nem loop implícito.
- Não deixar UI chamar executor de workflow por caminho privado.

## 6. Feedback de Especificação
Sem decisão arquitetural aberta; assinaturas e paths aguardam o contrato produzido por DMM-16. Reendurecer quando DMM-16 estiver `done`.

## 7. Gate futuro
Fixar build/test/lint do pacote dono e teste de integração com fila durável de DMM-15 no endurecimento JIT.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada a Tool invoke_workflow; depende do descriptor universal de DMM-16.
