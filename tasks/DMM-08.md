---
id: DMM-08
title: "Painel Terminal do Agente (side panel): stream de log do harness ao vivo"
status: draft:placeholder
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
- *[preencher no endurecimento]*

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
