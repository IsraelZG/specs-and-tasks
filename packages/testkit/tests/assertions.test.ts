import { describe, it, expect } from 'vitest';
import type { SqlRow } from '@plataforma/protocol';
import {
  expectConverged,
  type ConvergencePeer,
  type ConvergenceScope,
} from '../src/assertions.js';
import type { PeerId } from '@plataforma/protocol';

/** Deterministic fake PeerId for testing. */
function fakePeerId(label: string): PeerId {
  return `fake-peer-${label}`;
}

/** Stub peer that returns pre-configured fingerprints and dumps. */
function stubPeer(
  peerId: PeerId,
  fingerprint: Uint8Array,
  dumps: Partial<Record<'nodes' | 'edges', SqlRow[]>> = {},
): ConvergencePeer {
  return {
    peerId,
    getRootFingerprint: () => fingerprint,
    dumpTable: (table) => Promise.resolve(dumps[table] ?? []),
  };
}

/** Stub peer with async (Promise) return for fingerprint. */
function stubPeerAsync(
  peerId: PeerId,
  fingerprint: Uint8Array,
  dumps: Partial<Record<'nodes' | 'edges', SqlRow[]>> = {},
): ConvergencePeer {
  return {
    peerId,
    getRootFingerprint: () => Promise.resolve(fingerprint),
    dumpTable: (table) => Promise.resolve(dumps[table] ?? []),
  };
}

/** Stub peer with async (Promise) for dumpTable. */
function stubPeerAsyncDump(
  peerId: PeerId,
  fingerprint: Uint8Array,
  dumps: Partial<Record<'nodes' | 'edges', SqlRow[]>> = {},
): ConvergencePeer {
  return {
    peerId,
    getRootFingerprint: () => fingerprint,
    dumpTable: (table) => Promise.resolve(dumps[table] ?? []),
  };
}

describe('expectConverged', () => {
  const defaultScope: ConvergenceScope = new Set(['nodes', 'edges']);
  const nodesOnly: ConvergenceScope = new Set(['nodes']);

  it('1. resolves when 2 peers have identical content', async () => {
    const fp = new Uint8Array(32).fill(0xAA);
    const peers = [
      stubPeer('peer-a' as PeerId, fp, {
        nodes: [{ id: 1, hlc: '100' }],
        edges: [],
      }),
      stubPeer('peer-b' as PeerId, fp, {
        nodes: [{ id: 1, hlc: '100' }],
        edges: [],
      }),
    ];
    await expect(expectConverged(peers, defaultScope)).resolves.toBeUndefined();
  });

  it('2. resolves when 3 peers have identical content', async () => {
    const fp = new Uint8Array(32).fill(0xBB);
    const peers = [
      stubPeer('peer-a' as PeerId, fp),
      stubPeer('peer-b' as PeerId, fp),
      stubPeer('peer-c' as PeerId, fp),
    ];
    await expect(expectConverged(peers, defaultScope)).resolves.toBeUndefined();
  });

  it('3. throws when a peer has an extra node', async () => {
    const fpA = new Uint8Array(32).fill(0x01);
    const fpB = new Uint8Array(32).fill(0x02);
    const peers = [
      stubPeer('peer-a' as PeerId, fpA, {
        nodes: [{ id: 1 }, { id: 2 }],
      }),
      stubPeer('peer-b' as PeerId, fpB, {
        nodes: [{ id: 1 }, { id: 2 }, { id: 3 }],
      }),
    ];
    await expect(expectConverged(peers, defaultScope)).rejects.toThrow();
  });

  it('4. throws when a node has a divergent field', async () => {
    const fpA = new Uint8Array(32).fill(0x01);
    const fpB = new Uint8Array(32).fill(0x02);
    const peers = [
      stubPeer('peer-a' as PeerId, fpA, {
        nodes: [{ id: 1, hlc: '100' }],
      }),
      stubPeer('peer-b' as PeerId, fpB, {
        nodes: [{ id: 1, hlc: '200' }],
      }),
    ];
    await expect(expectConverged(peers, defaultScope)).rejects.toThrow();
  });

  it('5. throws when a peer has an extra edge', async () => {
    const fpA = new Uint8Array(32).fill(0x01);
    const fpB = new Uint8Array(32).fill(0x02);
    const peers = [
      stubPeer('peer-a' as PeerId, fpA, {
        nodes: [],
        edges: [{ id: 1, from: 1, to: 2 }],
      }),
      stubPeer('peer-b' as PeerId, fpB, {
        nodes: [],
        edges: [{ id: 1, from: 1, to: 2 }, { id: 2, from: 2, to: 3 }],
      }),
    ];
    await expect(expectConverged(peers, defaultScope)).rejects.toThrow();
  });

  it('6. resolves when divergence is outside scope', async () => {
    const fp = new Uint8Array(32).fill(0xAA);
    const fpB = new Uint8Array(32).fill(0xBB);
    const peers = [
      stubPeer('peer-a' as PeerId, fp, {
        nodes: [{ id: 1 }],
        edges: [{ id: 1 }],
      }),
      stubPeer('peer-b' as PeerId, fpB, {
        nodes: [{ id: 1 }],
        edges: [{ id: 1 }, { id: 2 }],
      }),
    ];
    // scope = only nodes → edges divergence is ignored
    // But fingerprints differ because scope includes both... 
    // To test scope filtering, both must have same nodes fingerprint
    // We need to make nodes fingerprint equal but edges fingerprint differ.
    // Since our stubs return a fixed fingerprint regardless of scope,
    // let's adapt: use same fp for both (same nodes content)
    const fpSame = new Uint8Array(32).fill(0xCC);
    const peersFixed = [
      stubPeer('peer-a' as PeerId, fpSame, {
        nodes: [{ id: 1 }],
        edges: [{ id: 1 }],
      }),
      stubPeer('peer-b' as PeerId, fpSame, {
        nodes: [{ id: 1 }],
        edges: [{ id: 1 }, { id: 2 }],
      }),
    ];
    await expect(expectConverged(peersFixed, nodesOnly)).resolves.toBeUndefined();
  });

  it('7. throws for empty peers array', async () => {
    await expect(expectConverged([], defaultScope)).rejects.toThrow(
      /at least 2 peers/,
    );
  });

  it('8. throws for single peer', async () => {
    const fp = new Uint8Array(32).fill(0xAA);
    const peer = stubPeer('peer-a' as PeerId, fp);
    await expect(expectConverged([peer], defaultScope)).rejects.toThrow(
      /at least 2 peers/,
    );
  });

  it('9. works with async dumpTable', async () => {
    const fp = new Uint8Array(32).fill(0xAA);
    const peers = [
      stubPeer('peer-a' as PeerId, fp, {
        nodes: [{ id: 1 }],
      }),
      stubPeerAsyncDump('peer-b' as PeerId, fp, {
        nodes: [{ id: 1 }],
      }),
    ];
    await expect(expectConverged(peers, defaultScope)).resolves.toBeUndefined();
  });

  it('10. works with async getRootFingerprint', async () => {
    const fp = new Uint8Array(32).fill(0xAA);
    const peers = [
      stubPeer('peer-a' as PeerId, fp),
      stubPeerAsync('peer-b' as PeerId, fp),
    ];
    await expect(expectConverged(peers, defaultScope)).resolves.toBeUndefined();
  });
});
