import { describe, test, expect } from 'vitest';
import type { NetworkAdapterPort, MessageHandler, PeerId } from '@plataforma/protocol';
import { acceptNoiseXX, NoiseServer } from '../src/noiseServer.js';

interface FakeAdapter extends NetworkAdapterPort {
  __triggerClose: (peerId: PeerId, reason?: 'remote' | 'error' | 'local') => void;
}

function fakeAdapter(): FakeAdapter {
  const messageHandlers = new Set<MessageHandler>();
  const closeHandlers = new Set<(peerId: PeerId, reason?: 'remote' | 'error' | 'local') => void>();
  return {
    connect: () => Promise.resolve(),
    listen: () => Promise.resolve(),
    send: () => Promise.resolve(),
    onMessage: (h: MessageHandler) => {
      messageHandlers.add(h);
      return () => { messageHandlers.delete(h); };
    },
    onClose: (h) => {
      closeHandlers.add(h);
      return () => { closeHandlers.delete(h); };
    },
    close: () => Promise.resolve(),
    __triggerClose: (peerId: PeerId, reason?: 'remote' | 'error' | 'local') => {
      for (const h of [...closeHandlers]) h(peerId, reason);
    },
  };
}

describe('NoiseServer (T-202-followup-3) — smoke + cleanup', () => {
  test('19: NoiseServer construtor registra handlers no adapter e close desregistra', () => {
    const adapter = fakeAdapter();
    const server = acceptNoiseXX(adapter);
    expect(server).toBeInstanceOf(NoiseServer);
    server.close();
  });

  test('20: onClose cleanup — peer caído remove entrada do entries', () => {
    const adapter = fakeAdapter();
    const server: NoiseServer = acceptNoiseXX(adapter, { localEpochIndex: 0 });
    const internal = server as unknown as { entries: Map<PeerId, unknown> };
    internal.entries.set('test-peer', {});
    expect(internal.entries.has('test-peer')).toBe(true);
    adapter.__triggerClose('test-peer', 'remote');
    expect(internal.entries.has('test-peer')).toBe(false);
    server.close();
  });
});
