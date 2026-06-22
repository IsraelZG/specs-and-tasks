import { ed25519Sign, ed25519Verify } from '@plataforma/crypto';
import type { Ed25519PublicKey, Ed25519PrivateKey, Ed25519Signature } from '@plataforma/crypto';
import type { ULID } from './ulid.js';
import type { HLCTimestamp } from './hlc.js';

/** Nó do grafo sem assinatura (pré-Layer 1). */
export interface UnsignedNode {
  id: ULID;
  nodeType: string;
  payload: Uint8Array;
  hlc: HLCTimestamp;
  publicKey: Ed25519PublicKey;
}

/** Nó do grafo com assinatura Layer 1. */
export interface SignedNode extends UnsignedNode {
  signature: Ed25519Signature;
}

/** Aresta do grafo sem assinatura. */
export interface UnsignedEdge {
  id: ULID;
  edgeType: string;
  sourceId: ULID;
  targetId: ULID;
  payload: Uint8Array | null;
  hlc: HLCTimestamp;
  publicKey: Ed25519PublicKey;
}

/** Aresta do grafo com assinatura Layer 1. */
export interface SignedEdge extends UnsignedEdge {
  signature: Ed25519Signature;
}

// --- helpers de concatenação binária ---

/** Escreve inteiro de 8 bytes big-endian no buffer na posição `offset`. */
function writeBigInt64BE(buf: Uint8Array, offset: number, value: bigint): void {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  dv.setBigInt64(offset, value, false); // false = big-endian
}

/** Escreve inteiro sem sinal de 4 bytes big-endian. */
function writeUint32BE(buf: Uint8Array, offset: number, value: number): void {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  dv.setUint32(offset, value, false);
}

/** Concatena dois Uint8Arrays. */
function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}

/** Codifica string como bytes UTF-8. */
const encoder = new TextEncoder();
function encodeUtf8(s: string): Uint8Array {
  return encoder.encode(s);
}

// --- canonicalize ---

/**
 * Serialização canônica para nó.
 * Ordem alfabética de campos: hlc, id, nodeType, payload, publicKey.
 *
 * Layout: hlc(8B BE) | id(26B UTF-8) | nodeType_len(u8) | nodeType(UTF-8)
 *       | payload_len(u32BE) | payload | publicKey(32B)
 */
export function canonicalizeNode(node: UnsignedNode): Uint8Array {
  const hlcBytes = new Uint8Array(8);
  writeBigInt64BE(hlcBytes, 0, node.hlc);

  const idBytes = encodeUtf8(node.id);
  const nodeTypeBytes = encodeUtf8(node.nodeType);
  const payloadLen = new Uint8Array(4);
  writeUint32BE(payloadLen, 0, node.payload.length);

  const nodeTypeLen = new Uint8Array(1);
  nodeTypeLen[0] = nodeTypeBytes.length;

  return concat(
    concat(hlcBytes, idBytes),
    concat(
      concat(nodeTypeLen, nodeTypeBytes),
      concat(
        concat(payloadLen, node.payload),
        node.publicKey,
      ),
    ),
  );
}

/**
 * Serialização canônica para aresta.
 * Ordem alfabética de campos: edgeType, hlc, id, payload, publicKey, sourceId, targetId.
 *
 * Layout: edgeType_len(u8) | edgeType(UTF-8) | hlc(8B BE) | id(26B UTF-8)
 *       | payload_len(u32BE) | payload | publicKey(32B)
 *       | sourceId(26B UTF-8) | targetId(26B UTF-8)
 */
export function canonicalizeEdge(edge: UnsignedEdge): Uint8Array {
  const edgeTypeBytes = encodeUtf8(edge.edgeType);
  const edgeTypeLen = new Uint8Array(1);
  edgeTypeLen[0] = edgeTypeBytes.length;

  const hlcBytes = new Uint8Array(8);
  writeBigInt64BE(hlcBytes, 0, edge.hlc);

  const idBytes = encodeUtf8(edge.id);

  const payload = edge.payload ?? new Uint8Array(0);
  const payloadLen = new Uint8Array(4);
  writeUint32BE(payloadLen, 0, payload.length);

  const sourceIdBytes = encodeUtf8(edge.sourceId);
  const targetIdBytes = encodeUtf8(edge.targetId);

  return concat(
    concat(edgeTypeLen, edgeTypeBytes),
    concat(
      concat(hlcBytes, idBytes),
      concat(
        concat(payloadLen, payload),
        concat(
          edge.publicKey,
          concat(sourceIdBytes, targetIdBytes),
        ),
      ),
    ),
  );
}

// --- sign ---

export async function signNode(
  node: UnsignedNode,
  privateKey: Ed25519PrivateKey,
): Promise<SignedNode> {
  const message = canonicalizeNode(node);
  const signature = await ed25519Sign(privateKey, message);
  return { ...node, signature };
}

export async function signEdge(
  edge: UnsignedEdge,
  privateKey: Ed25519PrivateKey,
): Promise<SignedEdge> {
  const message = canonicalizeEdge(edge);
  const signature = await ed25519Sign(privateKey, message);
  return { ...edge, signature };
}

// --- verify ---

export async function verifyNode(node: SignedNode): Promise<boolean> {
  const { signature, ...unsigned } = node;
  const message = canonicalizeNode(unsigned as UnsignedNode);
  return ed25519Verify(node.publicKey, message, signature);
}

export async function verifyEdge(edge: SignedEdge): Promise<boolean> {
  const { signature, ...unsigned } = edge;
  const message = canonicalizeEdge(unsigned as UnsignedEdge);
  return ed25519Verify(edge.publicKey, message, signature);
}
