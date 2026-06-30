---
id: ORQ-07
title: "UI na nuvem (Lovable/Vercel) + agente local via WebSocket outbound — acesso remoto modelo B"
status: draft
complexity: 6
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-06"] # reusa a API JSON do painel local
blocks: []
spec_status: triaged # DEFERIDA (Fase B) — endurecer JIT quando ORQ-06 estiver done e o modelo A validado
capacity_target: opus-spike
ui: true
---

# ORQ-07 · UI na nuvem + agente local WS (acesso remoto modelo B) — DEFERIDA

## 0. Ambiente de Execução Obrigatório
- **DEFERIDA (Fase B).** Só endurecer quando ORQ-06 (painel local + cloudflared, modelo A) estiver
  `done` e validado em uso. É a evolução, não o MVP. `spec_status: triaged` de propósito.
- Capacidade **opus-spike**: tem decisões de arquitetura em aberto (protocolo WS, auth, hosting) — o
  entregável do spike é um **ADR + PoC**, não código pronto.

## 1. Objetivo
Mover a UI do painel para a nuvem (Lovable/Vercel) com um **agente local fino** que disca **para fora**
(WebSocket outbound) e relaia comandos para os mesmos endpoints locais (ledger/instances/saldo/dispatch
da ORQ-06). Ganha URL pública estável, hospedagem boa e multi-device, sem abrir porta de entrada na
máquina. Substitui o cloudflared (modelo A) quando a UI amadurecer.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] [ORQ-06](./ORQ-06.md) — a API JSON local (`/api/ledger|instances|saldo|dispatch`) que o agente WS
      vai relaiar. **Sem nova API** — o agente é um relay.
- [ ] Plano (sessão 2026-06-30): modelo A (cloudflared) é o MVP; B (este) é a evolução. Claude pode
      ajudar a montar a UI no Lovable (conectado).

## 3. Escopo (a fixar no endurecimento JIT — hoje é esboço)
- **[CREATE]** UI na nuvem (Lovable/Vercel): consome o relay, renderiza ledger/instâncias/saldo, botão despachar.
- **[CREATE]** `tools/scripts/painel-agente.mjs` — agente local: WS outbound p/ a nuvem, autentica,
  relaia requests para `localhost:8780`, faz heartbeat, reconecta.
- **[CREATE]** ADR do protocolo WS + auth + modelo de hosting.

## 4–7. (a preencher no endurecimento JIT)
Verificação, DoD e passos dependem das decisões da §6.

## 6. Feedback de Especificação — DECISÕES EM ABERTO (resolver com `/arquiteto-decisoes` quando entrar na fila)

### Decisão A — Hosting da UI
Lovable (rápido de prototipar, onde o humano já trabalha) vs Vercel (mais controle/Next) vs ambos
(Lovable gera, deploy na Vercel). Trade-off: velocidade de prototipagem × controle do build.

### Decisão B — Protocolo do relay
WS cru (simples, controla tudo) vs algo tipo socket.io (reconexão/rooms prontos) vs um broker gerenciado
(Ably/Pusher/Supabase Realtime — menos código, dependência externa + custo).

### Decisão C — Auth
Como autenticar o agente local ↔ nuvem e o humano ↔ UI: token compartilhado no `.env` vs OAuth
(Cloudflare Access/Auth0) vs chave por dispositivo. Quem pode despachar (ação que gasta $) precisa de gate forte.

### Decisão D — Segurança do `dispatch` remoto
`POST /api/dispatch` gasta dinheiro (spawna agentes pagos). Exigir confirmação extra? rate-limit?
allowlist de quem dispara? Definir antes de expor.

> **Por que opus-spike:** estas são escolhas de arquitetura/produto, não plumbing — exigem exploração e
> um ADR, não um worker mecânico. Endurecer cedo seria chute.

## 9. Log de Execução (Agent Execution Log)
> Registrem via `manage-task.mjs`. Identidade = modelo real.
