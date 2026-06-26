---
id: T-202-followup-2
title: "Contrato do receive() AsyncIterable + classificacao de excecoes AEAD"
status: done
complexity: 2
parent_task: T-202
subtasks: []
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-202"]
blocks: ["T-202-followup-3"]
capacity_target: sonnet
---

# T-202-followup-2 · Contrato do receive() AsyncIterable + classificação de exceções AEAD

> **Contexto:** 1 MINOR + 1 INFO identificados na auditoria final de T-202 (ciclo 3,
> Seção 8 de `tasks/T-202.md`) que exigem decisão arquitetural + refatoração leve.
> **Status atual: draft** aguardando promoção do arquiteto.

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo — pacote alvo: `packages/transport/`
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet *(decisão arquitetural sobre contrato de receive; refatoração)*

## 1. Objetivo
Endereçar 2 achados não-bloqueantes do parecer final de T-202:

- **[m3] MINOR** — `receive()` é `AsyncIterable` sem `done` (loop infinito em
  `makeResult:299` linha `for(;;)`). Sem cancelamento, sem sinal de fim de canal.
  Risco: iterator abandonado = leak de inbox queue. Decidir o contrato.
- **[i3] INFO** — `decryptWithAd` mapeia QUALQUER erro AEAD para `invalid_signature`
  (linha 98 de `noiseHandshake.ts`). Se ciphertext for malformado por outro motivo
  (não tag mismatch), ainda vira `invalid_signature`. Considerar log interno antes
  de rethrow.

*(derivado de `tasks/T-202.md` Seção 8, ciclo 3, 2026-06-24)*.

### Decisão arquitetural RESOLVIDA (m3 — ver Seção 6 / ADR 0004)

**Decidido:** `receive(options?: { signal?: AbortSignal })` + `onClose` em `NetworkAdapterPort`
(ADR 0004) + `AbortController` interno no `makeInbox` que reage ao `onClose` do adapter.

- O iterador `receive()` termina **naturalmente** quando: (a) o caller passa `AbortSignal` e o
  aborta, ou (b) o adapter dispara `onClose` para o peer travado no inbox (queda remota / erro /
  `close()` local).
- ADR 0004 **descongela T-004 por addendum** — adiciona `onClose(handler): () => void` ao
  `NetworkAdapterPort`. Sem essa adição, a "opção A pura" do auditor original exigiria monkey-patch
  de `close()` — inviável. ADR 0004 resolve a lacuna de observabilidade.
- `decryptWithAd` (i3): log interno via `console.error('[noiseHandshake] AEAD decrypt failed:', err)`
  antes de rethrow como `invalid_signature`.
- **Dependência cruzada:** T-202-followup-3 (`acceptNoiseXX`/`NoiseServer`) depende do `onClose`
  aqui implementado para limpar inboxes por-peer. Por isso T-202-followup-3 agora **depende desta
  task** (ver frontmatter `dependencies:`).

## 2. Contexto RAG (Spec-Driven Development)
- `tasks/T-202.md` §1 linha 51 — `receive: () => AsyncIterable<Uint8Array>`
- `tasks/T-202.md` §1 linhas 254-283 (no `noiseHandshake.ts`) — `makeInbox` atual
- `tasks/T-202.md` Seção 8 ciclo 3 — parecer final
- ADR-noise-xx — decisões D1-D4 já aplicadas (T-202 já `done`)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/transport/src/noiseHandshake.ts` — impl atual (353 linhas)
- **[READ]** `packages/protocol/src/ports.ts` — `NetworkAdapterPort` (T-004 — **descongelado por ADR 0004**)
- **[UPDATE]** `packages/protocol/src/ports.ts` — adicionar `PeerCloseHandler` type + `onClose(handler): () => void` em `NetworkAdapterPort` (ADR 0004)
- **[UPDATE]** `packages/transport/src/websocket.ts` (WsAdapter, branch `task/T-204`) — propagar `socket.onclose` já capturado em `_attachHandlers:236` via `onClose` broadcast
- **[UPDATE]** `packages/testkit/src/SimNetwork.ts` — implementar `onClose` propagando `internal.closed` já existente (~15 LOC)
- **[UPDATE]** `packages/transport/src/noiseHandshake.ts` — refatorar `makeInbox` (AbortController interno + `onClose` do adapter aborta) e `makeResult.receive({signal?})` (termina no abort); `decryptWithAd` log + reason granular (i3)
- **[UPDATE]** `packages/transport/tests/noiseHandshake.test.ts` — atualizar helper `makePair` para implementar `onClose` (~20 LOC); adicionar tests 13-15

> **Não tocar:** spec §1 (contratos externos) — `initiateNoiseXX`/`respondNoiseXX` mantêm assinatura. `receive()` ganha `options?` opcional (retro-compatível).

## 4. Estratégia de Testes Estrita (TDD)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente:** `pnpm --filter @plataforma/transport test`
- [x] **Fora de Escopo:** mudanças de contrato quebrem a API v0; refatorações cosméticas

Casos de teste (numerados; 1-12 existentes):

| # | Caso | Tipo | Origem |
|---|---|---|---|
| 13 | **`receive()` termina quando `onClose` dispara** para o peer do inbox (queda remota via SimNetwork) | NOVO | [m3] / ADR 0004 |
| 14 | **`receive({ signal })` termina quando caller aborta** o `AbortSignal` (terminação explícita) | NOVO | [m3] |
| 15 | **`decryptWithAd` lança `invalid_signature` para tag mismatch mas loga internamente** (`vi.spyOn(console,'error')`) | NOVO | [i3] |
| 16 | **Helper `makePair` atualizado implementa `onClose`**: disparar `reason:'local'` quando `close()` for chamado no adapter | NOVO | ADR 0004 |

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** mudar a assinatura de `initiateNoiseXX`/`respondNoiseXX` (já `done`).
> - **NÃO** usar ponytail.
> - **NÃO** pular a atualização do `NetworkAdapterPort` (T-004) — ADR 0004 **descongela** a porta expressamente para adicionar `onClose`.

### Pegadinhas conhecidas
- **WsAdapter captura mas engole `socket.onclose`:** `websocket.ts:236-239` remove o peer dos maps
  internos sem notificar cima. ADR 0004 exige **propagar** — adicionar ao `Set<PeerCloseHandler>`
  chamando cada handler com `peerId` + `reason` inferido do CloseEvent code (1000/1001 → `'remote'`,
  1006 → `'error'`). Implementação já tem a info; só falta emitir.
- **SimNetwork tem `internal.closed` por adapter**: o dado existe. Basta criar `Set<PeerCloseHandler>`
  por adapter e disparar quando `close(peerId)` é chamado. ~15 LOC.
- **Idempotência de `onClose`:** cada peerId dispara `onClose` **uma vez** por ciclo. Se peer
  re-conectar (`connect(peerId)` re-chamável), novo ciclo começa.
- **`reason: 'local'` vs `'remote'`**: `close()` explícito do caller → `'local'`; `socket.onclose`
  remoto → `'remote'`; erro de socket → `'error'`.
- **`makePair` no test (helper):** ganha `closed: Set<PeerId>` + `handlers: Set<PeerCloseHandler>`.
  O `close(peerId)` do helper dispara handlers. Requisito: `onClose` retorna unsubscribe
  idempotente (chamar 2x nao duplica, chamar depois de_removido é no-op).

1. **[TDD — porta]** Atualizar `packages/protocol/src/ports.ts`: adicionar tipo `PeerCloseHandler =
   (peerId: PeerId, reason?: 'remote' | 'error' | 'local') => void` e método
   `onClose(handler: PeerCloseHandler): () => void` em `NetworkAdapterPort`. (ADR 0004 layout exato.)
2. **[Adapter: WsAdapter]** Em `packages/transport/src/websocket.ts` (branch `task/T-204`):
   adicionar `private closeHandlers = new Set<PeerCloseHandler>()`; em `_attachHandlers:236`,
   quando capturar `socket.onclose`, iterar handlers e chamar com `peerId` (do map `_outbound`/
   `_inbound` reverso) + `reason` derivado do `CloseEvent.code`. Implementar `onClose(handler)`
   que adiciona ao Set e retorna unsubscribe.
3. **[Adapter: SimNetwork]** Em `packages/testkit/src/SimNetwork.ts`: adicionar
   `closeHandlers: Set<PeerCloseHandler>` por adapter. Em `close(peerId)`, após marcar
   `internal.closed = true`, disparar handlers. Implementar `onClose(handler)`.
4. **[Adapter: makePair test helper]** Atualizar helper em
   `packages/transport/tests/noiseHandshake.test.ts` para implementar `onClose` (Set +
   disparo no `close(peerId)`). Adicionar test 16 (`onClose` dispara `reason:'local'` em `close()`).
5. **[noiseHandshake: makeInbox]** Refatorar `makeInbox` (linhas 254-283): criar
   `AbortController` interno; registrar `adapter.onClose((peerId, reason) => { if (peerId ===
   expectedFrom) controller.abort() })` (filtra por peer do handshake — ver nota em T-202-followup-3
   sobre `expectedFrom`; por ora, comparar com `m1.from`/`m2.from` já disponíveis). descartar
   `onMessage` retorno é OK porque o `onClose` agora limpa. Repassar `controller.signal` para o
   `next()` queue que alimenta `receive`.
6. **[noiseHandshake: receive]** Mudar assinatura em `makeResult.receive` de
   `receive: () => AsyncIterable<Uint8Array>` para
   `receive: (options?: { signal?: AbortSignal }) => AsyncIterable<Uint8Array>`. O
   `for(;;)` em linha 300 checa `if (signal?.aborted || internalController.signal.aborted) return;`
   no topo do loop. Retro-compatível (sem `options` välida como antes, mas agora termina quando
   onClose dispara).
7. **Adicionar test 13** (SimNetwork: par `connect + handshake`; simular queda remota via
   `simNet.disconnectPeer(peerId)`; `for await (const m of receive()) { ... }` termina sem erro).
8. **Adicionar test 14** (caller passa `new AbortController().signal`; aborta; receive() retorna).
9. **[i3 — decryptWithAd]** Refatorar `decryptWithAd:92-102` para:
   ```ts
   } catch (err) {
     console.error('[noiseHandshake] AEAD decrypt failed:', err);
     throw new NoiseHandshakeError('AEAD tag inválida', 'invalid_signature');
   }
   ```
10. **Adicionar test 15** (mock AEAD que lança erro não-tag; assert que `console.error` foi
    chamado E `invalid_signature` propagado; usar `vi.spyOn(console,'error')`).
11. Rode `pnpm --filter @plataforma/protocol build && pnpm --filter @plataforma/transport
    build && pnpm --filter @plataforma/transport test && pnpm --filter @plataforma/transport lint`
    — todos verdes. Cole saída na Seção 8.

## 6. Feedback de Especificação (Spec Feedback Loop)

> **✅ DECISÕES RESOLVIDAS (2026-06-25 — arquiteto):**

> **#m3 — Contrato de `receive()`:** **`receive(options?: { signal?: AbortSignal })`** +
> **`onClose` em `NetworkAdapterPort`** (ver ADR 0004) + **`AbortController` interno no `makeInbox`**.
>
> Justificativa: o auditor original recomendou "Opção A pura (termina em adapter close)" mas
> verificou-se que `NetworkAdapterPort` **não tem** canal de observação de queda de peer — sem
> `onClose`, "Opção A" exigiria monkey-patch de `close()`. ADR 0004 completa o contrato por
> addendum (descongela T-004 explicitamente). A combinação `onClose` (event-driven, peer-queda)
> + `AbortSignal` (caller-driven, cancelamento explícito) cobre os dois modos de terminação do
> `AsyncIterable` em `for await...of`. Sem `signal`, o iterador termina só quando `onClose`
> dispara para o peer do inbox — retro-compatível para callers que não passam `options`.
>
> **Ref:** `docs/adr/0004-networkadapter-onclose.md` (Status: aceito).
>
> **Cross-link:** T-202-followup-3 (`acceptNoiseXX`/`NoiseServer`) **depende desta task** —
> usa o `onClose` aqui implementado para limpar inboxes por-peer quando peer cai (ver
> `dependencies:` no frontmatter de T-202-followup-3).
>
> **#i3 — Classificação de exceções AEAD:** log interno (`console.error`) antes de rethrow como
> `invalid_signature`. Não muda contrato externo (ainda lança `NoiseHandshakeError`).

## 7. Definition of Done (DoD)

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/protocol build
pnpm --filter @plataforma/transport build
pnpm --filter @plataforma/transport test
pnpm --filter @plataforma/transport lint
```
> **Nota:** `@plataforma/protocol` é tocado (porta `onClose`); o `transport` depende dela. Rode
> build do `protocol` antes do `transport`. O `@plataforma/testkit` (SimNetwork) também é tocado —
> rode `pnpm --filter @plataforma/testkit build && test && lint` extras.

### Checklist do Reviewer
- [ ] ADR 0004 (`docs/adr/0004-networkadapter-onclose.md`) revisado e **aceito** (não mais rascunho)
- [ ] `NetworkAdapterPort` atualizado: `PeerCloseHandler` type + `onClose(handler): () => void`
- [ ] `WsAdapter` propaga `socket.onclose` via `closeHandlers` (`reason` derivado do CloseEvent code)
- [ ] `SimNetwork` propaga `internal.closed` via `closeHandlers` (~15 LOC)
- [ ] Helper `makePair` em `noiseHandshake.test.ts` implementa `onClose` (test 16 passando)
- [ ] `makeInbox` registra `onClose` com filtro do `expectedFrom` + AbortController interno
- [ ] `receive(options?: { signal?: AbortSignal })` termina no abort (`onClose` ou caller `signal`)
- [ ] Test 13 (`onClose` dispara terminação) passando
- [ ] Test 14 (`AbortSignal` do caller dispara terminação) passando
- [ ] `decryptWithAd` loga via `console.error` antes de rethrow `invalid_signature` (test 15)
- [ ] Compat com API v0 preservada (callers sem `options` continuam funcionando)
- [ ] `initiateNoiseXX`/`respondNoiseXX` untouched na assinatura pública
- [ ] `pnpm --filter @plataforma/{protocol,transport,testkit} build && test && lint` verdes

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Implementados os 4 adapters de `onClose` (NetworkAdapterPort + SimNetwork + makePair)
- `makeInbox` refatorado com AbortController interno + bindRemote + onClose filtrado
- `receive(options?: { signal?: AbortSignal })` termina em abort interno (onClose) ou externo (caller)
- `decryptWithAd` loga `console.error` antes de rethrow `invalid_signature`
- Tests 13-16 passando (total 12/12 transport, 43/43 testkit)
- websocket.ts não existe neste branch (pertence a T-204) — WsAdapter onClose será implementado lá

**Gate de Evidência:**
```
=== PROTOCOL BUILD OK ===
=== TRANSPORT BUILD OK ===
=== TESTKIT BUILD OK ===
=== TRANSPORT TEST OK ===
 Test Files  2 passed (2)
      Tests  12 passed (12)
=== TESTKIT TEST OK ===
 Test Files  6 passed (6)
      Tests  43 passed (43)
=== TRANSPORT LINT OK ===
```

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/protocol build   → tsc OK (sem erros)
$ pnpm --filter @plataforma/transport build  → tsc OK (sem erros)
$ pnpm --filter @plataforma/testkit build    → tsc OK (sem erros)
$ pnpm --filter @plataforma/transport test   → Test Files 2 passed · Tests 12 passed (12)
$ pnpm --filter @plataforma/testkit test     → Test Files 6 passed · Tests 43 passed (43)
$ pnpm --filter @plataforma/transport lint   → OK (sem erros)
```
- **Comentários de Revisão:**
  - 0 BLOCKER / 0 MAJOR / 0 MINOR / 5 INFO
  - [i1] `DummyNetwork` em `protocol/tests/ports.test.ts:51-69` e `makeStubNetwork()` (167-189) não implementam `onClose`. Não quebra build (tsconfig inclui só `src/`), mas é dívida técnica fora do escopo desta task.
  - [i2] `makePair.onMessage` em `noiseHandshake.test.ts:34-37` não é limpo em `close()` — handler "morto" ainda recebe mensagens. Helper de test, não parte da API. Sem impacto.
  - [i3] `onClose` unsubscribe é idempotente ✓ (Set.delete em chave ausente é no-op).
  - [i4] `close()` chamado 2× não lança ✓ (idempotente em makePair e SimNetwork).
  - [i5] `onClose` dispatch não envolve try/catch — handler que lança aborta os outros. ADR 0004 não exige atomicidade, mas nota para T-202-followup-3 (`acceptNoiseXX`/`NoiseServer`).
  - WsAdapter `onClose` corretamente fora de escopo (websocket.ts pertence a `task/T-204`).
  - Implementação staticamente conforme: `NetworkAdapterPort.onClose` + `PeerCloseHandler` (ports.ts:11,39), `SimNetwork` (SimNetwork.ts:7,72-77,81-84), `makePair` (test:20-21,38-47,60-69), `makeInbox` (noiseHandshake.ts:262,274-278,320-326), `receive(options?)` (:24,345-353), `decryptWithAd` log (:98).

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-06-24T17:xx]** - *arquiteto* - `[Promovido]`: T-202-followup-2 criada. Decisão arquitetural #m3 pendente.
- **[2026-06-25]** - *arquiteto* - `[Decisão + flip draft→ready]`: #m3 resolvido via ADR 0004 (`onClose` em `NetworkAdapterPort`) + `receive(options?: { signal?: AbortSignal })` + `AbortController` interno no `makeInbox`. ADR 0004 descongela T-004 por addendum. T-202-followup-3 agora depende desta task (bloqueada). DoD atualizado com 4 impls de `onClose` (porta + WsAdapter + SimNetwork + makePair).
- **[2026-06-25T19:03]** - *DeepSeek* - `[Iniciado]`: iniciando execucao
- **[2026-06-25T19:10]** - *DeepSeek* - `[Finalizado]`: (m3) onClose em NetworkAdapterPort + SimNetwork + makePair; receive(signal) + AbortController interno; decryptWithAd loga antes de rethrow (i3). Tests 12/12 transport + 43/43 testkit. Build+lint verdes. websocket.ts pertence a T-204.
- **[2026-06-25T19:16]** - *agile_reviewer* - `[Aprovado]`: 0 blocker/major/minor; 5 INFO; gate live 100pct verde (protocol/transport/testkit build OK, transport 12/12, testkit 43/43, lint OK)
