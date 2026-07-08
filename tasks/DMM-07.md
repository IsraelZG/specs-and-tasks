---
id: DMM-07
title: "Roteamento de eventos runner.ts → WS → UI (host real, substitui o echo do server.mjs)"
status: draft:placeholder
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [] # EST-06 (harness) done; porta/WS única já em master (server.mjs)
blocks: ["DMM-08","DMM-09"]
capacity_target: sonnet
---

# DMM-07 · Roteamento runner.ts → WS → UI

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Rotear os eventos emitidos pelo `runner.ts` do `plugin-agent-harness` (`type: 'agent:start'|'step'|
'tool-call'|'tool-result'|'done'|...`) via **WebSocket**, através do host, até a UI (ADR 0013 —
"Stream para UI"). Hoje o `apps/estaleiro/server.mjs` só faz **echo/broadcast** entre clientes WS; esta
task pluga a **fonte real** (runs do harness) no WS, para o Terminal do Agente (DMM-08) e a Frota
consumirem eventos ao vivo. WS já está na mesma porta livre do HTTP (`/ws`).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Verificação "Stream para UI".
- [ ] `apps/estaleiro/server.mjs` — servidor único HTTP+WS `/ws` (broadcast atual a substituir/estender).
- [ ] `packages/plugin-agent-harness/src/runner.ts` (EST-06) — formato dos eventos emitidos.
- [ ] `apps/estaleiro/ui/src/ws/{client,events}.ts` — contrato `WsEvent`/`AgentWsEvent` já consumido pela UI.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `apps/estaleiro/server.mjs`, `packages/plugin-agent-harness/src/runner.ts`, `apps/estaleiro/ui/src/ws/events.ts`.
- **[UPDATE/CREATE]** wiring no host que assina os eventos do harness e os publica no WS `/ws` (path a fixar).
- **[CREATE]** teste: run do harness (stub) emite eventos → cliente WS recebe na ordem, com o shape de `events.ts`.

## 4. Estratégia de Testes Estrita
- Vitest + cliente `ws` de teste conectando no server; harness stub emitindo eventos conhecidos.
- **Fora de Escopo:** render do Terminal (é DMM-08); execução real de modelo.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** reintroduzir porta WS separada — WS vive na mesma porta do HTTP (`server.mjs`, path `/ws`).
> - **NÃO** mudar o shape de `WsEvent`/`AgentWsEvent` já consumido pela UI sem migrar os consumidores.

### Pegadinhas conhecidas
- O `server.mjs` é copiado para o dir standalone; o wiring precisa funcionar no processo servido, não só em dev.

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Eventos reais do harness chegam a um cliente WS via `/ws`, no shape de `events.ts`.
### Verificação automática
```bash
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/plugin-agent-harness test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
