# ADR 0007 — Painel remoto (modelo B): UI na nuvem + agente local via WebSocket outbound

- **Status:** aceito (2026-07-01 — spike ORQ-07, opus). Destrava a futura task hardened de implementação.
- **Decisores:** humano (israel) para C/D (auth e exposição de gasto); opus para A/B (técnicas).
- **Contexto:** o painel local (ORQ-06) roda em `127.0.0.1:8780` com 5 rotas JSON
  (`/api/status`, `/api/ledger`, `/api/instances`, `/api/saldo`, `POST /api/dispatch`). O modelo A
  (cloudflared) já dá acesso remoto tunelando essa porta — mas **abre entrada** na máquina. O modelo B
  quer uma UI hospedada (Lovable) e a máquina **inbound-fechada**, com um agente local que disca
  **para fora**. Este ADR fixa as 4 decisões que estavam abertas na spec ORQ-07 e registra o PoC.

## Problema

Três restrições que amarram o desenho:
1. **O agente local só disca para fora** (sem porta de entrada) — logo browser e agente precisam de um
   **ponto de encontro** comum.
2. **Nem Lovable nem Vercel hospedam WebSocket server persistente** de forma limpa (são serverless) —
   então não dá pra "hospedar o relay" nesses lugares.
3. **`POST /api/dispatch` gasta dinheiro real** (spawna agentes pagos via Headroom) — expor isso à
   internet é uma decisão de risco, não de plumbing.

## Decisões

### A — Hosting da UI → **Lovable (estático)**
UI estática hospedada no Lovable (onde o humano já prototipa; hospeda direto, sem infra). Vercel fica
como graduação se o build ficar custom. A UI é um **cliente** do broker — não tem backend próprio.

### B — Protocolo → **broker de realtime gerenciado** (Ably ou Supabase Realtime)
Descarta WS cru self-hosted e socket.io self-hosted — ambos exigiriam hospedar um servidor stateful,
que é exatamente o que Lovable/Vercel não fazem. Com um **broker gerenciado**, browser e agente
**conectam no broker** e trocam mensagens por um canal; reconexão, fan-out e TLS vêm de graça, e a
máquina permanece inbound-fechada (o agente é cliente WS outbound). **Recomendado: Ably** (pub/sub
puro, token-auth, free tier generoso). Supabase Realtime é a alternativa (bundle com Postgres+Auth,
útil se um dia quiser multi-usuário).

> **Independência de broker:** o agente fala um **envelope JSON próprio** (`{type,id,method,path,body}`)
> sobre um WS. Trocar de broker é trocar a URL + o handshake de auth — a lógica de relay não muda.

### C — Auth → **token secreto compartilhado**
Um segredo longo aleatório (`PAINEL_TOKEN`), no `.env` do agente e colado 1× na UI. Proporcional para
ferramenta pessoal de 1 usuário — sem OAuth, sem conta extra. Todo envelope carrega o token; o agente
**rejeita** o que não bate. (Graduação: se virar multi-usuário, migrar para Supabase Auth / Cloudflare
Access — a fronteira de verificação já está isolada no agente.)

### D — Dispatch remoto → **aberto atrás do token** (com defesa-em-profundidade barata)
Decisão do humano: o `dispatch` remoto é **permitido**, gated apenas pelo `PAINEL_TOKEN`.

> ⚠️ **RISCO ACEITO, EXPLÍCITO:** o token é a **única** barreira entre a internet e gasto real. Se ele
> vazar, um terceiro pode disparar agentes pagos até o saldo/limite acabar. Mitigações que **não**
> adicionam fricção (mantêm "aberto") e entram no PoC:
> - **Token forte e único** (≥32 bytes aleatórios), nunca commitado, rotacionável.
> - **TLS fim-a-fim** (o broker já força `wss://`).
> - **Rate-limit** no agente: no máximo `N` dispatches por janela (default 3/min) — um token vazado
>   não drena a conta em segundos.
> - **Allowlist de rotas**: o agente só relaia as 5 rotas conhecidas; nunca um path local arbitrário.
> - **Audit**: cada dispatch relaiado é logado (ts + envelope id) em `tasks/.orchestrator/painel-agente.log`.
>
> Se um dia quiser apertar, a opção "2ª confirmação" fica disponível sem reescrever nada (é um flag).

## Arquitetura resultante

```
  [Browser: UI Lovable] ──wss──► [Broker Ably] ◄──wss── [painel-agente.mjs (local, outbound)]
        envia {cmd}                  canal                    valida token + rate-limit
        recebe {res}                                          relaia p/ 127.0.0.1:8780 (ORQ-06)
                                                              devolve {res}
```

- **Máquina inbound-fechada** (agente só disca pra fora) — ganho de segurança sobre o cloudflared (A).
- **Sem relay stateful pra hospedar** — o broker é o rendezvous.
- **Reusa 100% a API da ORQ-06** — o agente é um relay, não reimplementa nada.

## PoC entregue (esta spike)

- **`tools/scripts/painel-agente.mjs`** — o agente relay, **dependency-free** (usa o `WebSocket`
  global nativo do Node 22). Contém a lógica load-bearing: `handleCommand(envelope)` → valida token +
  allowlist + rate-limit → `fetch` na rota local → devolve `{id,status,body}`. Modo `--selftest` prova
  o relay contra o dashboard local real, **sem** precisar de broker (o transporte WS é ortogonal e
  trivial; o risco estava no relay + guards, que o selftest exercita).
- **Runbook de deploy** (abaixo) — os passos que dependem das SUAS contas (broker + Lovable).

### Runbook (o que fica pra você, precisa das suas contas)
1. **Broker:** crie um app Ably (free), pegue uma API key. Defina no `.env`: `PAINEL_BROKER_URL`,
   `PAINEL_BROKER_KEY`, `PAINEL_TOKEN` (gere: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
2. **Agente:** `node tools/scripts/painel-agente.mjs` (fica rodando, disca no broker, relaia).
3. **UI Lovable:** app estático que conecta no mesmo canal do broker, renderiza ledger/instâncias/saldo
   e tem botão despachar. Cola o `PAINEL_TOKEN` uma vez (guardado no localStorage). Esqueleto mínimo em
   `docs/painel-remoto/ui-poc.html` (ponto de partida — o app "bonito" é a task hardened seguinte).

## Consequências

- **Positivas:** máquina inbound-fechada; URL pública estável; UI hospedada onde você já trabalha;
  nada de servidor WS pra manter; reusa a API existente.
- **Negativas / a vigiar:** dependência de um broker externo (SPOF + free-tier limits); o risco do D
  (token = chave do cofre) exige higiene de segredo; o agente precisa ficar rodando (é um daemon local).
- **Não-objetivos desta spike:** a UI final polida (é a próxima task hardened); multi-usuário; o deploy
  nas suas contas (runbook acima).

## O que esta spike destrava

Uma task hardened `ORQ-08` (implementação do modelo B) agora é **mecânica**: broker=Ably, auth=token,
dispatch=aberto+rate-limit, agente=`painel-agente.mjs` (já existe), UI=Lovable consumindo o envelope
já definido. Zero decisão em aberto.
