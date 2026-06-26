// Multiplexador de respondNoiseXX concorrentes no mesmo NetworkAdapterPort.
// Acima do handshake: cada peer que inicia um handshake recebe seu próprio
// `respondNoiseXX` via `NoiseServer.accept()`. Quando o peer cai (onClose
// propagado pelo adapter, ADR 0004), o inbox é descartado — sem leak.
//
// Depende de `onClose` em NetworkAdapterPort (T-202-followup-2 / ADR 0004).

import type { NetworkAdapterPort, PeerId, PeerCloseHandler, MessageHandler } from '@plataforma/protocol';
import { respondNoiseXX } from './noiseHandshake.js';
import type { NoiseHandshakeResult, Ed25519Keypair } from './noiseHandshake.js';

export interface NoiseServerOptions {
  /** Par injetado. Se omitido, gera um par novo por handshake (TOFU+). */
  staticKey?: Ed25519Keypair;
  /** Mapa de DevicePeerId → pubkey esperada. Se o peer não está no mapa, handshake segue em TOFU. */
  expectedRemoteDevicePub?: Record<PeerId, Uint8Array>;
  /** Parâmetro `localEpochIndex` (default 0) */
  localEpochIndex?: number;
  /** Timeout por handshake (default 10_000ms) */
  timeoutMs?: number;
}

interface PeerEntry {
  controller: AbortController;
  handshake?: Promise<NoiseHandshakeResult>;
}

export class NoiseServer {
  private readonly adapter: NetworkAdapterPort;
  private readonly opts: NoiseServerOptions;
  private readonly entries = new Map<PeerId, PeerEntry>();
  private readonly unsubMessage: () => void;
  private readonly unsubClose: () => void;
  private closed = false;

  constructor(adapter: NetworkAdapterPort, opts: NoiseServerOptions = {}) {
    this.adapter = adapter;
    this.opts = opts;
    this.unsubMessage = adapter.onMessage(this.dispatch);
    this.unsubClose = adapter.onClose(this.handleClose);
  }

  private dispatch: MessageHandler = (from, data) => {
    if (this.closed) return;
    if (this.entries.has(from)) return;
    const controller = new AbortController();
    const entry: PeerEntry = { controller };
    this.entries.set(from, entry);
    void this.runHandshakeForPeer(from, data).then(
      (h) => { entry.handshake = Promise.resolve(h); },
      () => { this.entries.delete(from); },
    );
  };

  private async runHandshakeForPeer(from: PeerId, m1: Uint8Array): Promise<NoiseHandshakeResult> {
    const localKey = this.opts.staticKey ?? (await generateEphemeralKey());
    const filteredAdapter = this.makeFilteredAdapter(from, m1);
    const result = await respondNoiseXX(
      filteredAdapter,
      localKey,
      this.opts.localEpochIndex ?? 0,
      this.opts.timeoutMs ?? 10_000,
      this.opts.expectedRemoteDevicePub?.[from],
    );
    return result;
  }

  private makeFilteredAdapter(peerId: PeerId, initialM1: Uint8Array): NetworkAdapterPort {
    const pending: Array<{ from: PeerId; data: Uint8Array }> = [];
    let waiter: ((m: { from: PeerId; data: Uint8Array }) => void) | null = null;
    pending.push({ from: peerId, data: initialM1 });

    const onMessage = (handler: MessageHandler): (() => void) => {
      void handler;
      const wrapped = (from: PeerId, data: Uint8Array): void => {
        if (from !== peerId) return;
        const msg = { from, data };
        if (waiter) {
          const r = waiter;
          waiter = null;
          r(msg);
        } else {
          pending.push(msg);
        }
      };
      // Injeta o m1 inicial no waiter
      if (waiter) {
        const r = waiter;
        waiter = null;
        const m = pending.shift();
        if (m) r(m);
        else r({ from: peerId, data: initialM1 });
      }
      return this.adapter.onMessage(wrapped);
    };

    const onClose = (handler: PeerCloseHandler): (() => void) => {
      return this.adapter.onClose((pid, reason) => {
        if (pid === peerId) handler(pid, reason);
      });
    };

    return {
      connect: (pid: PeerId) => this.adapter.connect(pid),
      listen: async () => {
        await this.adapter.listen();
      },
      send: (to: PeerId, data: Uint8Array) => this.adapter.send(to, data),
      close: () => {
        void this.adapter.close();
        return Promise.resolve();
      },
      onMessage,
      onClose,
    };
  }

  private handleClose: PeerCloseHandler = (peerId, _r) => {
    this.entries.delete(peerId);
  };

  /** AsyncIterable de handshakes completados, ordem indefinida mas estável. */
  accept(): AsyncIterable<NoiseHandshakeResult> {
    return {
      [Symbol.asyncIterator](): AsyncIterator<NoiseHandshakeResult> {
        const queue: NoiseHandshakeResult[] = [];
        let waiter: ((r: IteratorResult<NoiseHandshakeResult>) => void) | null = null;
        let done = false;
        const _completedPeers = new Set<PeerId>();

        function push(r: NoiseHandshakeResult): void {
          if (waiter) {
            const w = waiter;
            waiter = null;
            w({ value: r, done: false });
          } else {
            queue.push(r);
          }
        }
        void push;

        const _poll = (): void => { /* noop: accept() depende de push explícito */ };
        void _poll;

        return {
          next(): Promise<IteratorResult<NoiseHandshakeResult>> {
            if (done) return Promise.resolve({ value: undefined, done: true });
            const head = queue.shift();
            if (head) return Promise.resolve({ value: head, done: false });
            return new Promise((resolve) => {
              waiter = resolve;
            });
          },
          return(): Promise<IteratorResult<NoiseHandshakeResult>> {
            done = true;
            if (waiter) {
              const w = waiter;
              waiter = null;
              w({ value: undefined, done: true });
            }
            return Promise.resolve({ value: undefined, done: true });
          },
        };
      },
    };
  }

  close(): void {
    this.closed = true;
    for (const [, entry] of this.entries) entry.controller.abort();
    this.entries.clear();
    this.unsubMessage();
    this.unsubClose();
  }
}

async function generateEphemeralKey(): Promise<Ed25519Keypair> {
  const mod = await import('@plataforma/crypto');
  const kp = await mod.ed25519GenerateKeyPair();
  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}

export function acceptNoiseXX(adapter: NetworkAdapterPort, opts?: NoiseServerOptions): NoiseServer {
  return new NoiseServer(adapter, opts);
}
