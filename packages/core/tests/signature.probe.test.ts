import { describe, it, expect, beforeAll } from 'vitest';
import { ed25519GenerateKeyPair } from '@plataforma/crypto';
import type { Ed25519PrivateKey, Ed25519PublicKey } from '@plataforma/crypto';
import { ULIDFactory } from '../src/ulid.js';
import { VirtualClock, SeededRandom } from '@plataforma/testkit';
import { signNode, verifyNode, signEdge, verifyEdge, canonicalizeEdge } from '../src/signature.js';
import type { UnsignedNode, UnsignedEdge } from '../src/signature.js';

function makeNode(overrides: Partial<UnsignedNode> = {}): UnsignedNode {
  const factory = new ULIDFactory({
    clock: new VirtualClock(0),
    random: new SeededRandom('seed'),
  });
  const now = BigInt(Date.now());
  return {
    id: factory.generate(),
    nodeType: 'PROFILE',
    payload: new Uint8Array([1, 2, 3]),
    hlc: (now << 16n) | BigInt(Math.floor(Math.random() * 65535)),
    publicKey: new Uint8Array(32).fill(0xaa),
    ...overrides,
  };
}

function makeEdge(overrides: Partial<UnsignedEdge> = {}): UnsignedEdge {
  const factory = new ULIDFactory({
    clock: new VirtualClock(0),
    random: new SeededRandom('seed'),
  });
  const now = BigInt(Date.now());
  return {
    id: factory.generate(),
    edgeType: 'MUTATES',
    sourceId: factory.generate() as string,
    targetId: factory.generate() as string,
    payload: new Uint8Array([4, 5, 6]),
    hlc: (now << 16n) | BigInt(Math.floor(Math.random() * 65535)),
    publicKey: new Uint8Array(32).fill(0xbb),
    ...overrides,
  };
}

describe('Adversarial Signature Probes', () => {
  let keys: { privateKey: Ed25519PrivateKey; publicKey: Ed25519PublicKey };
  beforeAll(async () => {
    keys = await ed25519GenerateKeyPair();
  });

  it('Probe 1: verifyNode com nodeType adulterado → deve retornar false', async () => {
    const node = makeNode({ publicKey: keys.publicKey, nodeType: 'PROFILE' });
    const signed = await signNode(node, keys.privateKey);
    signed.nodeType = 'CONTENT';
    const valid = await verifyNode(signed);
    expect(valid).toBe(false);
  });

  it('Probe 2: verifyEdge com edgeType adulterado → deve retornar false', async () => {
    const edge = makeEdge({ publicKey: keys.publicKey, edgeType: 'MUTATES' });
    const signed = await signEdge(edge, keys.privateKey);
    signed.edgeType = 'DELEGATED_TO';
    const valid = await verifyEdge(signed);
    expect(valid).toBe(false);
  });

  it('Probe 3: verifyEdge com targetId adulterado → deve retornar false', async () => {
    const edge = makeEdge({
      publicKey: keys.publicKey,
      sourceId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      targetId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
    });
    const signed = await signEdge(edge, keys.privateKey);
    signed.targetId = '01ARZ3NDEKTSV4RRFFQ69G5FAY'; // altera targetId para outro ULID
    const valid = await verifyEdge(signed);
    expect(valid).toBe(false);
  });

  it('Probe 4: Node e Edge com payload vazio (0 bytes) → deve validar normalmente', async () => {
    const node = makeNode({ publicKey: keys.publicKey, payload: new Uint8Array(0) });
    const signedNode = await signNode(node, keys.privateKey);
    expect(await verifyNode(signedNode)).toBe(true);

    const edge = makeEdge({ publicKey: keys.publicKey, payload: new Uint8Array(0) });
    const signedEdge = await signEdge(edge, keys.privateKey);
    expect(await verifyEdge(signedEdge)).toBe(true);
  });
});
