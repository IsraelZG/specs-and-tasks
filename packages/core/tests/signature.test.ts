import { describe, it, expect, beforeAll } from 'vitest';
import { ed25519GenerateKeyPair } from '@plataforma/crypto';
import type { Ed25519PrivateKey, Ed25519PublicKey } from '@plataforma/crypto';
import { ULIDFactory } from '../src/ulid.js';
import { HybridLogicalClock } from '../src/hlc.js';
import { VirtualClock, SeededRandom } from '@plataforma/testkit';
import {
  canonicalizeNode,
  canonicalizeEdge,
  signNode,
  signEdge,
  verifyNode,
  verifyEdge,
} from '../src/signature.js';
import type { UnsignedNode, UnsignedEdge, SignedNode } from '../src/signature.js';

function makeNode(
  overrides: Partial<UnsignedNode> = {},
): UnsignedNode {
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

function makeEdge(
  overrides: Partial<UnsignedEdge> = {},
): UnsignedEdge {
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

describe('Signature Layer 1', () => {
  let keys: { privateKey: Ed25519PrivateKey; publicKey: Ed25519PublicKey };
  beforeAll(async () => {
    keys = await ed25519GenerateKeyPair();
  });

  it('1: signNode + verifyNode roundtrip → true', async () => {
    const node = makeNode({ publicKey: keys.publicKey });
    const signed = await signNode(node, keys.privateKey);
    const valid = await verifyNode(signed);
    expect(valid).toBe(true);
  });

  it('2: verifyNode com chave errada → false', async () => {
    const otherKeys = await ed25519GenerateKeyPair();
    const node = makeNode({ publicKey: keys.publicKey });
    const signed = await signNode(node, otherKeys.privateKey);
    const valid = await verifyNode(signed);
    expect(valid).toBe(false);
  });

  it('3: verifyNode com payload adulterado → false', async () => {
    const node = makeNode({ publicKey: keys.publicKey });
    const signed = await signNode(node, keys.privateKey);
    signed.payload = new Uint8Array([9, 9, 9]);
    const valid = await verifyNode(signed);
    expect(valid).toBe(false);
  });

  it('4: verifyNode com hlc adulterado → false', async () => {
    const node = makeNode({ publicKey: keys.publicKey });
    const signed = await signNode(node, keys.privateKey);
    signed.hlc = signed.hlc + 1n;
    const valid = await verifyNode(signed);
    expect(valid).toBe(false);
  });

  it('5: canonicalizeNode — ordem léxica de campo', () => {
    const factory = new ULIDFactory({
      clock: new VirtualClock(0),
      random: new SeededRandom('seed'),
    });
    const id = factory.generate();
    const hlc = BigInt(1700000000000) << 16n;
    const payload = new Uint8Array([10, 20]);
    const pk = new Uint8Array(32);
    pk[0] = 1;

    const node1: UnsignedNode = { id, nodeType: 'PROFILE', payload, hlc, publicKey: pk };
    // mesmos campos, mas ordem de inserção diferente no plain object
    const node2: UnsignedNode = { hlc, nodeType: 'PROFILE', id, publicKey: pk, payload };

    const c1 = canonicalizeNode(node1);
    const c2 = canonicalizeNode(node2);

    expect(c1).toEqual(c2);
  });

  it('6: signEdge + verifyEdge roundtrip com payload → true', async () => {
    const edge = makeEdge({ publicKey: keys.publicKey });
    const signed = await signEdge(edge, keys.privateKey);
    const valid = await verifyEdge(signed);
    expect(valid).toBe(true);
  });

  it('7: signEdge + verifyEdge roundtrip com payload=null → true', async () => {
    const edge = makeEdge({ publicKey: keys.publicKey, payload: null });
    const signed = await signEdge(edge, keys.privateKey);
    const valid = await verifyEdge(signed);
    expect(valid).toBe(true);
  });

  it('8: verifyEdge com sourceId trocado → false', async () => {
    const edge = makeEdge({ publicKey: keys.publicKey });
    const signed = await signEdge(edge, keys.privateKey);
    const factory = new ULIDFactory({
      clock: new VirtualClock(0),
      random: new SeededRandom('seed2'),
    });
    signed.sourceId = factory.generate() as string;
    const valid = await verifyEdge(signed);
    expect(valid).toBe(false);
  });

  it('9: dois nós com mesmo conteúdo mas ids diferentes → assinaturas diferentes', async () => {
    const factory = new ULIDFactory({
      clock: new VirtualClock(0),
      random: new SeededRandom('seed'),
    });
    const id1 = factory.generate();
    const id2 = factory.generate();
    const hlc = BigInt(1700000000000) << 16n;
    const pk = keys.publicKey;
    const payload = new Uint8Array([1, 2]);

    const node1: UnsignedNode = { id: id1, nodeType: 'PROFILE', payload, hlc, publicKey: pk };
    const node2: UnsignedNode = { id: id2, nodeType: 'PROFILE', payload, hlc, publicKey: pk };

    const signed1 = await signNode(node1, keys.privateKey);
    const signed2 = await signNode(node2, keys.privateKey);

    expect(signed1.signature).not.toEqual(signed2.signature);
  });

  it('10: canonicalize é determinístico — 100× mesma entrada → mesmo buffer', () => {
    const node = makeNode();
    const results: string[] = [];
    for (let i = 0; i < 100; i++) {
      const c = canonicalizeNode(node);
      let hex = '';
      for (const byte of c) {
        hex += byte.toString(16).padStart(2, '0');
      }
      results.push(hex);
    }
    const unique = new Set(results);
    expect(unique.size).toBe(1);
  });
});
