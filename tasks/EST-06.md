---
id: EST-06
title: "plugin-agent-harness: migrar VercelAgentAdapter + observabilidade/kill do ORQ-09b/10 pro monorepo superapp"
status: draft:triaged
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-05"]
blocks: []
capacity_target: sonnet # move VercelAgentAdapter ORQ-09b/10, adapta ao host mediado
---

# EST-06 · plugin-agent-harness (move do ORQ-09b/10)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-agent-harness/`. Move do código já pronto (ORQ-09b/10,
  `done`) — loop in-process, eventos, cancelamento, painel.

## 1. Objetivo
Mover o `VercelAgentAdapter` (`run()`, registry de provider — ORQ-09b) e a camada de
observabilidade/kill (stream de eventos, detecção de travada, cancelamento — ORQ-10) para
`packages/plugin-agent-harness/`, consumindo `plugin-fs-tools` (EST-05) via host mediado em vez
de import direto (RFC-018 A3). O protocolo de eventos (start/step/tool-call/tool-result/done/
aborted/error — ADR-0008 §D) é a interface que a UI (EST-14) vai consumir via WebSocket (F3).

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (A3, F3, G2) e §3.
- [ ] `tools/orchestrator/src/agentAdapter.mjs` (ORQ-09b, done) + testes.
- [ ] `tools/orchestrator/src/monitor.mjs` (ORQ-10, done) — `startMonitor`, `findStuck`, `writeCancelFlags`.
- [ ] `docs/adr/0008-agent-adapter-in-process.md` — contrato de eventos e AgentRunResult a preservar.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-agent-harness/src/{agentAdapter,monitor}.*` — código movido.
- **[CREATE]** testes portados das suites existentes.
- **[UPDATE]** chamadas a fs-tools para ir via host (EST-02) em vez de import direto.

## 4. Estratégia de Testes
- [ ] Reusar as suites de ORQ-09b/10 (provider fake, timeout, cancelamento, detecção de travada) adaptadas ao novo ponto de entrada.

## 5. Instruções de Execução
1. Mover código + testes.
2. Trocar import direto do fs-tools por chamada mediada pelo host.
3. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 A3/G2. Contrato de eventos do ADR-0008 §D não muda nesta task.

## 7. Definition of Done (DoD)
- [ ] Código movido, suites verdes?
- [ ] fs-tools consumido via host (não import direto)?
- [ ] Protocolo de eventos intacto (para consumo futuro da UI, EST-14)?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-agent-harness test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-agent-harness move ORQ-09b/10, capacity=sonnet, depende de EST-02/05 (draft)
