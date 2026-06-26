# ADR 0004 — `NetworkAdapterPort.onClose`: observa queda de peer

- **Status:** aceito (2026-06-25 — arquiteto, destrava T-202-followup-2 [m3] e T-202-followup-3 [i4])
- **Contexto:** `NetworkAdapterPort` (T-004, `done`) expõe `connect/listen/send/onMessage/close` —
  permite **observar entrada de mensagens** e **fechar ativamente**, mas não tem canal para
  observar **queda remota** de um peer (TCP RST, WebSocket close frame, WebRTC DataChannel close).
  O `WsAdapter` (T-204) **já captura** `socket.onclose` em `_attachHandlers` mas **engole o
  evento** — só remove o peer dos maps internos. Sem observação externa, qualquer consumidor que
  roda sobre a porta (notadamente o handshake Noise_XX e o `receive()` pós-handshake) **não sabe**
  que o canal morreu e o iterador `for(;;)` em `makeResult.receive` (noiseHandshake.ts:300) fica
  para sempre esperando — leak.
- **Decisores:** arquiteto

## Problema

Contrato assimétrico: a porta vê **entrada** (`onMessage`) e **acao explícita do caller**
(`close`), mas não vê **queda remota**. Isso é uma lacuna de observabilidade, não uma decisão
de design — WsAdapter, SimNetwork e WebRTC todos conseguem detectar a queda na própria camada;
falta apenas **propagar**.

Sem este canal:
1. `receive()` AsyncIterable **nunca termina** quando o peer remoto cai (noiseHandshake.ts:300 `for(;;)`).
2. `makeInbox`'s `onMessage` handler **permanece registrado** mesmo após o peer morrer — leak de
   handler por handshake.
3. `acceptNoiseXX`/`NoiseServer` (planejado em T-202-followup-3) não pode limpar inboxes
   per-peer quando peer cai — multi-peer = accumulação de leaks.

## Decisão

**Adicionar `onClose(handler: PeerCloseHandler): () => void` a `NetworkAdapterPort`.**

```ts
// packages/protocol/src/ports.ts — adição
export type PeerCloseHandler = (peerId: PeerId, reason?: 'remote' | 'error' | 'local') => void;

export interface NetworkAdapterPort {
  // ... contratos existentes ...
  /**
   * Registra callback para Queda/desconexão de um peer.
   * Dispara quando: o peer remoto desconecta (`reason: 'remote'`),
   * erro de socket发生后 (`reason: 'error'`) ou `close()` do adapter (`reason: 'local'`).
   * Suporta múltiplos handlers (broadcast — consistente com `onMessage`).
   * @returns função de unsubscribe para remover APENAS este handler. Idempotente.
   */
  onClose(handler: PeerCloseHandler): () => void;
}
```

Justificativa arquitetural:

1. **Simetria com `onMessage`.** Se a porta avisa entrada, deve avisar saída. Contrato
   incompleto vs completa — esta é a distinção relevante; não é "reabrir por over-reach" como
   Opção C do T-202-followup-3 (sub-roteamento por destino). É completar o que é intrínseco à
   abstração.
2. **Dados já existem na camada.** `WsAdapter._attachHandlers:236` captura `socket.onclose`;
   `SimNetwork` tem `internal.closed` por adapter; WebRTC DataChannel tem `onclose`. Implementar
   é **propagar**, não inventar.
3. **Compatível com múltiplos handlers (broadcast).** Os adapters já mantêm `Set<MessageHandler>`,
   mesmo padrão para `Set<PeerCloseHandler>`.
4. **Optional em adapters legados.** Qualquer adapter que `implements NetworkAdapterPort` antes
   desta mudança quebra no TypeScript (contrato adicionado). Isto é **desejado**: força
   propagação explícita. Para o monorepo, os únicos implementadores são `WsAdapter` (T-204),
   `SimNetwork` (T-005) e o adapter in-memory dos testes do `noiseHandshake.test.ts` — todos
   ganham impl trivial (<30 LOC cada).

### Decisões específicas sobre `reason`

- **`'remote'`** — o socket/peer remoto fechou normalmente (FIN / WS CloseEvent code=1000 / DataChannel close).
- **`'error'`** — falha de socket (TCP RST, WS 1006, DataChannel iceFailed). Erro *não-moralizado*: o adapter
  já loga via `console.error` (WsAdapter:227-234 continua); `onClose` apenas avisa Queda com a causa.
- **`'local'`** — disparado pelo próprio `close()` do adapter. Útil para consumidores que querem
  distinguir teardown intencional vs Queda remota.

Idempotência: cada peerId dispara `onClose` **uma única vez** por ciclo de conexão. Se peer
re-conectar (`connect(peerId)` re-chamável per T-204 §6.1), novo ciclo de eventos começa.

## Alternativas consideradas

- **B — `done()` explícito no `NoiseHandshakeResult` + `AbortSignal` em `receive({signal})`, sem
  `onClose`.** Insuficiente: o consumer (sync-worker) só sabe abortar ativamente; nada dispara
  aborto quando o peer cai por inatividade. Combina com `onClose`, não substitui.
- **C — Deixar adapters propagarem via canal próprio (não-port).** Rejeitada: o handshake
  Noise_XX precisa observar `NetworkAdapterPort` genérico; acoplar lógica de handshake a internals
  de WsAdapter/SimNetwork/WebRTC específicos é exatamente o que a porta existe para evitar.

## Consequências

- Atualização do contrato canônico `NetworkAdapterPort` (`packages/protocol/src/ports.ts`). T-004
  marcava o port "congelado" — este ADR **descongela-T-004 por addendum explícito** (sem remover
  métodos, sem mudar semântica existente — apenas extensão). Riscável proceduralmente, aceitável
  nesta fase do projeto; futuras mudanças deverão novamente seguir via ADR.
- `WsAdapter`, `SimNetwork` e o helper `makePair` (em `noiseHandshake.test.ts`) ganham
  implementação (~20 LOC cada).
- T-202-followup-2 (lifecycle de `receive()`) depende deste ADR: o iterador termina quando
  `onClose` dispara para o `from` travado no inbox, ou quando o caller passa `AbortSignal` em
  `receive({signal})`.
- T-202-followup-3 (`acceptNoiseXX`/`NoiseServer`) depende deste ADR: limpa inboxes por-peer em
  `onClose`.
- Sem breaking change para callers existentes de Noise: `initiateNoiseXX`/`respondNoiseXX`
  continuam com a mesma assinatura pública (mudança no `receive()` — adiciona `options?` opcional —
  é retro-compatível).

## Escopo do descongelamento

Apenas **acréscimo** de `onClose`. Não reconsiderar `connect`/`listen`/`send`/`onMessage`/`close`
———— esses permanecem canônicos. Se futura mudança em qualquer um deles for necessária, exige novo
ADR.