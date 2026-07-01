---
id: ORQ-07
title: "UI na nuvem (Lovable/Vercel) + agente local via WebSocket outbound — acesso remoto modelo B"
status: done
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

## 4–7. Entregue (spike executado 2026-07-01, opus)

**Decisões A/B/C/D resolvidas** → ver o ADR. **Entregáveis:**
- **docs/adr/0007-painel-remoto-modelo-b.md** — ADR: 4 decisões, arquitetura, risco do D (dispatch
  aberto atrás do token) explícito, runbook de deploy (broker Ably + Lovable).
- **tools/scripts/painel-agente.mjs** — PoC do agente relay, dependency-free (WebSocket nativo Node 22).
  Load-bearing `handleCommand()`: token → allowlist de rotas → rate-limit → relay p/ 127.0.0.1:8780.
- **docs/painel-remoto/ui-poc.html** — esqueleto mínimo da UI na nuvem (ponto de partida p/ Lovable).

**Decisões travadas:** A=Lovable (estático) · B=broker gerenciado (Ably/Supabase, sem WS self-hosted) ·
C=token secreto compartilhado · D=dispatch aberto atrás do token (+rate-limit/allowlist/audit).

**Gate (PoC provado via `--selftest` contra o dashboard ORQ-06 real):**
```
=== SELFTEST ===
  ✅ token inválido → 401
  ✅ rota não permitida → 403
  ✅ GET /api/ledger relaiado → 200
  ✅ rate-limit: 3 ok + 1 bloqueado (429)
✅ selftest OK   (exit=0)
```

**Destrava** uma futura `ORQ-08` (implementação hardened do modelo B) — mecânica agora: broker=Ably,
auth=token, dispatch=aberto+rate-limit, agente já existe, UI=Lovable consumindo o envelope definido.

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

## 8. Parecer QA — Code Review

### Parecer QA — Reviewer 1 (agile_reviewer:minimax-m3, 2026-07-01)
- [x] **Aprovado**
- **Veredito:** Aprovado. Spike cumpre o entregável: ADR + PoC + UI skeleton; gate `--selftest` 4/4 verde.
- **Escopo (§4-7):** 3 entregáveis presentes e coerentes com a spike:
  - `docs/adr/0007-painel-remoto-modelo-b.md` — ADR com 4 decisões travadas (A=Lovable, B=Ably/Supabase broker, C=token compartilhado, D=dispatch aberto+rate-limit), risco do D explícito, runbook de deploy.
  - `tools/scripts/painel-agente.mjs` — agente relay, dependency-free (WebSocket nativo Node 22 + fetch global). Núcleo load-bearing `handleCommand()`: token → allowlist → rate-limit → fetch local. Modo `--selftest` provado.
  - `docs/painel-remoto/ui-poc.html` — esqueleto mínimo (mesmo envelope JSON do agente), ponto de partida p/ Lovable.
- **Decisões A/B/C/D (§6) — todas resolvidas e documentadas no ADR**, sem ambiguidade restante. O spike
  atinge o objetivo: destravar a futura ORQ-08 (hardened, mecânica) com **zero decisão em aberto**.
- **Gate (re-execução independente) — `PAINEL_TOKEN=test-token node tools/scripts/painel-agente.mjs --selftest`:**
  ```
  ✅ token inválido → 401
  ✅ rota não permitida → 403
  ✅ GET /api/ledger relaiado → 200
  ✅ rate-limit: 3 ok + 1 bloqueado (429)
  ✅ selftest OK
  ```
  Match 1:1 com a §4-7 do worker (opus). Dashboard ORQ-06 está no ar em 127.0.0.1:8780 — relay real
  testado contra ele, não mock. O mock só é usado no teste 4 (rate-limit) para não gastar $ via
  `/api/dispatch` real.
- **Risco do D (dispatch aberto atrás do token) — defesa-em-profundidade barata, todos os 4 mitigantes
  presentes no PoC:** token ≥32 bytes (runbook do ADR), `wss://` (broker força), rate-limit
  (`PAINEL_DISPATCH_PER_MIN`, default 3), allowlist de 5 rotas, audit em `tasks/.orchestrator/painel-agente.log`.
  Graduação p/ "2ª confirmação" é um flag, não reescrita (ADR §D).
- **Sondas adversariais:** N/A — diff é ADR+PoC+HTML, sem lógica executável de produto pra quebrar;
  o selftest já cobre os guards. Análise estática do `handleCommand()`: 5 rotas na allowlist, valida
  token, valida rota, rate-limit só no dispatch, fallback 502 se painel local cai.
- **UI (esqueleto):** HTML standalone, conecta no broker via WS, fala o mesmo envelope. Não é o app
  "bonito" (essa é ORQ-08) — é só prova de conceito, intencionalmente mínimo. Sem fumaça de browser
  obrigatória (PoC, não entrega de UI).
- **Ripple de assinatura:** N/A — nenhuma função de produção alterada; o agente é código novo, isolado
  em `tools/scripts/`. API da ORQ-06 reusada sem modificação.
- **Conclusão:** entregar. Encadear `/integrar-task ORQ-07` (Caminho A-tooling, sem worktree).
- **Achados:** 0 BLOCKER, 0 MAJOR, 0 MINOR, 0 INFO. Veredito limpo.

## 9. Log de Execução (Agent Execution Log)
> Registrem via `manage-task.mjs`. Identidade = modelo real.
- **[2026-07-01T13:05]** - *claude-opus* - `[Iniciado]`: spike: ORQ-06 done (deps satisfeitas) — resolvendo decisões A/B/C/D + ADR + PoC do agente relay
- **[2026-07-01T13:12]** - *claude-opus* - `[Finalizado]`: spike concluído: ADR 0007 + painel-agente.mjs (PoC, selftest 4/4 verde) + ui-poc.html. Decisões A/B/C/D resolvidas. Destrava ORQ-08 (impl hardened do modelo B).
- **[2026-07-01T13:18]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (Caminho A-tooling, sem worktree): spike cumpre entregável — ADR 0007 com 4 decisões A/B/C/D travadas + PoC painel-agente.mjs dependency-free (selftest 4/4 re-executado: 401/403/200/429 todos ✅) + ui-poc.html. Gate rodou contra dashboard ORQ-06 real em 127.0.0.1:8780 (relay end-to-end, não mock). Defesa-em-profundidade do D presente: token ≥32B, wss, rate-limit 3/min, allowlist de 5 rotas, audit em tasks/.orchestrator/painel-agente.log. Destrava futura ORQ-08 (hardened, mecânica). 0 não-bloqueantes → ledger.
