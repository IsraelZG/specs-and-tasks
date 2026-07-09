---
id: DMM-08
title: "Painel Terminal do Agente (side panel): stream de log do harness ao vivo"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
ui: true
dependencies: ["DMM-07"]
blocks: []
capacity_target: sonnet
---

# DMM-08 · Painel Terminal do Agente

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo · UI: FlexLayout + TinyBase

## 1. Objetivo
Painel lateral (ADR 0013 §1.1): ao clicar numa task, uma aba revela o **stream de log ao vivo** do
`runner.ts` — mostrando em tempo real o que a persona ativa faz (Explorer rodando `bash grep`, Editor
alterando arquivo), além do contexto já processado. Consome os eventos WS roteados por DMM-07.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §1.1 (Painel Lateral / Terminal do Agente).
- [ ] DMM-07 — eventos `agent:*`/`tool-call`/`step` no WS.
- [ ] `apps/estaleiro/ui/src/views/fleet/**` — padrão de consumo de eventos WS já existente (EST-14c).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `apps/estaleiro/ui/src/ws/**`, `apps/estaleiro/ui/src/views/fleet/**` (padrão de hook/store).
- **[CREATE]** `apps/estaleiro/ui/src/views/terminal/**` — o painel Terminal + hook de consumo do stream.
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx` — expor o painel como aba lateral ao selecionar task.

## 4. Estratégia de Testes Estrita
- **UI (ui: true):** unit/JSDOM NÃO basta. Exigir **smoke** (render do Terminal recebendo eventos
  mockados via WS e exibindo linhas) OU verificação manual do revisor (subir standalone, disparar um
  run, ver o stream). Marcar no Parecer.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** abrir uma segunda conexão WS — reusar o `wsClient` já criado em `App.tsx`.
> - **NÃO** bufferizar log ilimitado em memória — cap/ring buffer (definir no endurecimento).

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-07` (acabei de marcar `draft:pending_decision` neste lote — 5 decisões
  abertas de arquitetura: entrypoint, LanguageModel, PluginTools, subscription per-taskId,
  concorrência+cancelamento). A spec §1 consome "eventos WS roteados por DMM-07" e §3 marca
  `[READ] apps/estaleiro/ui/src/ws/**` — sem o **formato final** do que chega do DMM-07, este
  painel só pode declarar "consome AgentWsEvent" como placeholder.
- **Por que NÃO `harden`:** o painel lê `WsEvent` (definido em `apps/estaleiro/ui/src/ws/events.ts`)
  e filtra por `event.type.startsWith("agent:")` (App.tsx:24); o consumidor real depende de
  qual subset dos eventos o DMM-07 expõe (decisão 4 do DMM-07: filter client-side vs
  roteamento server-side). Inventar o filtro aqui seria reescrever o DMM-07.
- **Próximo passo:** após DMM-07 virar `done` (decisões fechadas + reendurecido + executado),
  reendurecer (pass-2 JIT) com: (a) o `taskId` da task selecionada (vem do store de board,
  EST-14b); (b) o filtro exato (client-side ou server-side); (c) o ring buffer size (NÃO-FAZER
  §5 — citar fonte ou abrir).
- **Capacidade:** `sonnet` já no frontmatter — render + hook é mecânico, não algorítmico.
- **Pré-endurecimento já válido:** `ui: true` (gate manual/smoke), `dependencies: [DMM-07]`
  consistente com `blocks:` de DMM-07.
- **Pendente p/ pass-2:** assinatura TS do componente, path exato
  (`apps/estaleiro/ui/src/views/terminal/**` a fixar), casos enumerados (smoke com eventos
  mockados; ring buffer aplicado; cap de linhas).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Terminal renderiza o stream ao vivo de uma task selecionada; verificação de UI feita.
### Verificação automática
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro-ui test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T18:42]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-07 ainda draft:pending_decision; reendurecer JIT após DMM-07→done
