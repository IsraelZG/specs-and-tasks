// Noise_XX_25519_ChaChaPoly_SHA256 sobre NetworkAdapterPort + channel binding Ed25519.
// Decisões D1–D4 do ADR-noise-xx (spike T-200): @noble/* hand-roll do padrão XX; a identidade
// Ed25519 do device liga-se ao canal assinando o handshake hash `h` no ponto IMEDIATAMENTE antes
// do payload de identidade. X25519 static efêmera por sessão.
import type { NetworkAdapterPort, PeerId } from '@plataforma/protocol';
import { deriveDevicePeerId } from '@plataforma/protocol';
import { ed25519Sign, ed25519Verify } from '@plataforma/crypto';
import type { Ed25519PublicKey, Ed25519PrivateKey } from '@plataforma/crypto';
import { x25519 } from '@noble/curves/ed25519.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';

/** Par de chaves Ed25519 do device. Local (crypto não exporta `Ed25519Keypair`; campo é `privateKey`). */
export interface Ed25519Keypair {
  readonly publicKey: Ed25519PublicKey;
  readonly privateKey: Ed25519PrivateKey;
}

export interface NoiseHandshakeResult {
  readonly remoteDeviceId: PeerId;
  readonly remoteEpochIndex: number;
  readonly send: (data: Uint8Array) => Promise<void>;
  readonly receive: () => AsyncIterable<Uint8Array>;
  readonly epochMismatch: boolean;
}

export type NoiseFailureReason = 'invalid_signature' | 'wrong_key' | 'protocol_error' | 'timeout';

export class NoiseHandshakeError extends Error {
  constructor(
    message: string,
    public readonly reason: NoiseFailureReason,
  ) {
    super(message);
    this.name = 'NoiseHandshakeError';
  }
}

/** Comparação em tempo constante (evita timing side-channel em chaves criptográficas). */
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return d === 0;
}

const PROTOCOL_NAME = 'Noise_XX_25519_ChaChaPoly_SHA256'; // 32 bytes exatos
const HASHLEN = 32;
const DHLEN = 32;
const TAGLEN = 16;
const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);
const hash = (d: Uint8Array): Uint8Array => sha256(d);

function concat(...arrs: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const a of arrs) len += a.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

/** Nonce do Noise: 4 bytes zero || uint64 little-endian do contador. */
function noiseNonce(n: number): Uint8Array {
  const nonce = new Uint8Array(12);
  new DataView(nonce.buffer).setBigUint64(4, BigInt(n), true);
  return nonce;
}

/** HKDF do Noise (2 saídas). */
function hkdf2(ck: Uint8Array, ikm: Uint8Array): [Uint8Array, Uint8Array] {
  const temp = hmac(sha256, ck, ikm);
  const o1 = hmac(sha256, temp, Uint8Array.of(1));
  const o2 = hmac(sha256, temp, concat(o1, Uint8Array.of(2)));
  return [o1, o2];
}

export interface CipherState {
  k: Uint8Array | null;
  n: number;
}
export function encryptWithAd(cs: CipherState, ad: Uint8Array, plaintext: Uint8Array): Uint8Array {
  if (cs.k === null) return plaintext;
  const ct = chacha20poly1305(cs.k, noiseNonce(cs.n), ad).encrypt(plaintext);
  cs.n += 1;
  return ct;
}
export function decryptWithAd(cs: CipherState, ad: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  if (cs.k === null) return ciphertext;
  let pt: Uint8Array;
  try {
    pt = chacha20poly1305(cs.k, noiseNonce(cs.n), ad).decrypt(ciphertext);
  } catch {
    throw new NoiseHandshakeError('AEAD tag inválida', 'invalid_signature');
  }
  cs.n += 1;
  return pt;
}

type PayloadProvider = (bindingHash: Uint8Array) => Promise<Uint8Array>;

/** Estado simétrico + handshake do padrão XX. Assina/verifica o binding no `h` pré-payload.
 *  Exportado para o teste de vetor oficial (caso 9); não faz parte da API pública (index.ts). */
export class NoiseXX {
  private ck: Uint8Array;
  private h: Uint8Array;
  private readonly cs: CipherState = { k: null, n: 0 };
  private e: { priv: Uint8Array; pub: Uint8Array } | null = null;
  private readonly s: { priv: Uint8Array; pub: Uint8Array };
  private re: Uint8Array | null = null;
  private rs: Uint8Array | null = null;

  constructor(staticPriv?: Uint8Array, ephemeralPriv?: Uint8Array, prologue?: Uint8Array) {
    const name = utf8(PROTOCOL_NAME);
    this.h = name.length <= HASHLEN ? concat(name, new Uint8Array(HASHLEN - name.length)) : hash(name);
    this.ck = this.h.slice();
    this.mixHash(prologue ?? new Uint8Array(0));
    const sp = staticPriv ?? x25519.utils.randomSecretKey();
    this.s = { priv: sp, pub: x25519.getPublicKey(sp) };
    if (ephemeralPriv) this.e = { priv: ephemeralPriv, pub: x25519.getPublicKey(ephemeralPriv) };
  }

  get remoteStatic(): Uint8Array | null {
    return this.rs;
  }
  /** Handshake hash corrente (para asserção de test vectors e channel binding). */
  get handshakeHash(): Uint8Array {
    return this.h;
  }
  private mixHash(data: Uint8Array): void {
    this.h = hash(concat(this.h, data));
  }
  private mixKey(ikm: Uint8Array): void {
    const [ck, tempK] = hkdf2(this.ck, ikm);
    this.ck = ck;
    this.cs.k = tempK.slice(0, 32);
    this.cs.n = 0;
  }
  private encryptAndHash(pt: Uint8Array): Uint8Array {
    const ct = encryptWithAd(this.cs, this.h, pt);
    this.mixHash(ct);
    return ct;
  }
  private decryptAndHash(ct: Uint8Array): Uint8Array {
    const pt = decryptWithAd(this.cs, this.h, ct);
    this.mixHash(ct);
    return pt;
  }
  private dh(priv: Uint8Array, pub: Uint8Array): Uint8Array {
    return x25519.getSharedSecret(priv, pub);
  }
  private ensureE(): { priv: Uint8Array; pub: Uint8Array } {
    if (!this.e) {
      const priv = x25519.utils.randomSecretKey();
      this.e = { priv, pub: x25519.getPublicKey(priv) };
    }
    return this.e;
  }

  // msg1: -> e   (payload normalmente vazio na app; raw aqui para test vectors)
  writeA(payload: Uint8Array = new Uint8Array(0)): Uint8Array {
    const e = this.ensureE();
    this.mixHash(e.pub);
    return concat(e.pub, this.encryptAndHash(payload));
  }
  readA(message: Uint8Array): Uint8Array {
    this.re = message.slice(0, DHLEN);
    this.mixHash(this.re);
    return this.decryptAndHash(message.slice(DHLEN));
  }

  // msg2: <- e, ee, s, es   (assina o `h` pós-`es`, antes do payload)
  async writeB(makePayload: PayloadProvider): Promise<Uint8Array> {
    const e = this.ensureE();
    this.mixHash(e.pub);
    if (!this.re) throw new NoiseHandshakeError('XX sem re', 'protocol_error');
    this.mixKey(this.dh(e.priv, this.re)); // ee
    const encS = this.encryptAndHash(this.s.pub); // s
    this.mixKey(this.dh(this.s.priv, this.re)); // es
    const payload = await makePayload(this.h.slice()); // binding sobre h pré-payload
    return concat(e.pub, encS, this.encryptAndHash(payload));
  }
  readB(message: Uint8Array): { payload: Uint8Array; bindingHash: Uint8Array } {
    this.re = message.slice(0, DHLEN);
    this.mixHash(this.re);
    const e = this.e;
    if (!e) throw new NoiseHandshakeError('XX sem e', 'protocol_error');
    this.mixKey(this.dh(e.priv, this.re)); // ee
    this.rs = this.decryptAndHash(message.slice(DHLEN, DHLEN + DHLEN + TAGLEN)); // s
    this.mixKey(this.dh(e.priv, this.rs)); // es
    const bindingHash = this.h.slice();
    const payload = this.decryptAndHash(message.slice(DHLEN + DHLEN + TAGLEN));
    return { payload, bindingHash };
  }

  // msg3: -> s, se   (assina o `h` pós-`se`, antes do payload)
  async writeC(makePayload: PayloadProvider): Promise<Uint8Array> {
    const encS = this.encryptAndHash(this.s.pub); // s
    if (!this.re) throw new NoiseHandshakeError('XX sem re', 'protocol_error');
    this.mixKey(this.dh(this.s.priv, this.re)); // se
    const payload = await makePayload(this.h.slice());
    return concat(encS, this.encryptAndHash(payload));
  }
  readC(message: Uint8Array): { payload: Uint8Array; bindingHash: Uint8Array } {
    this.rs = this.decryptAndHash(message.slice(0, DHLEN + TAGLEN)); // s
    const e = this.e;
    if (!e) throw new NoiseHandshakeError('XX sem e', 'protocol_error');
    this.mixKey(this.dh(e.priv, this.rs)); // se
    const bindingHash = this.h.slice();
    const payload = this.decryptAndHash(message.slice(DHLEN + TAGLEN));
    return { payload, bindingHash };
  }

  split(): [CipherState, CipherState] {
    const [t1, t2] = hkdf2(this.ck, new Uint8Array(0));
    return [
      { k: t1.slice(0, 32), n: 0 },
      { k: t2.slice(0, 32), n: 0 },
    ];
  }
}

// payload de identidade = devicePub(32) || epoch(4 LE) || sig(64) sobre o bindingHash
function buildPayload(devicePub: Uint8Array, epochIndex: number, sig: Uint8Array): Uint8Array {
  const epoch = new Uint8Array(4);
  new DataView(epoch.buffer).setUint32(0, epochIndex, true);
  return concat(devicePub, epoch, sig);
}
interface ParsedPayload {
  devicePub: Uint8Array;
  epochIndex: number;
  sig: Uint8Array;
}
function parsePayload(p: Uint8Array): ParsedPayload {
  if (p.length !== 32 + 4 + 64) throw new NoiseHandshakeError('payload de identidade inválido', 'protocol_error');
  return {
    devicePub: p.slice(0, 32),
    epochIndex: new DataView(p.slice(32, 36).buffer).getUint32(0, true),
    sig: p.slice(36, 100),
  };
}
async function verifyBinding(bindingHash: Uint8Array, parsed: ParsedPayload, expectedPub?: Ed25519PublicKey): Promise<void> {
  const ok = await ed25519Verify(parsed.devicePub, bindingHash, parsed.sig);
  if (!ok) throw new NoiseHandshakeError('binding Ed25519 inválido', 'invalid_signature');
  if (expectedPub !== undefined && !equalBytes(parsed.devicePub, expectedPub)) {
    throw new NoiseHandshakeError('remote device key mismatch', 'wrong_key');
  }
}

function makeInbox(adapter: NetworkAdapterPort): (timeoutMs: number) => Promise<{ from: PeerId; data: Uint8Array }> {
  const queue: Array<{ from: PeerId; data: Uint8Array }> = [];
  let pending: ((m: { from: PeerId; data: Uint8Array }) => void) | null = null;
  adapter.onMessage((from, data) => {
    const msg = { from, data };
    if (pending) {
      const r = pending;
      pending = null;
      r(msg);
    } else {
      queue.push(msg);
    }
  });
  return (timeoutMs: number) => {
    const head = queue.shift();
    if (head) return Promise.resolve(head);
    return new Promise<{ from: PeerId; data: Uint8Array }>((resolve, reject) => {
      const signal = AbortSignal.timeout(timeoutMs);
      const onAbort = (): void => {
        pending = null;
        reject(new NoiseHandshakeError('handshake timeout', 'timeout'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      pending = (m): void => {
        signal.removeEventListener('abort', onAbort);
        resolve(m);
      };
    });
  };
}

function makeResult(
  adapter: NetworkAdapterPort,
  remote: PeerId,
  parsed: ParsedPayload,
  localEpochIndex: number,
  txCipher: CipherState,
  rxCipher: CipherState,
  next: (t: number) => Promise<{ from: PeerId; data: Uint8Array }>,
): NoiseHandshakeResult {
  return {
    remoteDeviceId: deriveDevicePeerId(parsed.devicePub),
    remoteEpochIndex: parsed.epochIndex,
    epochMismatch: parsed.epochIndex !== localEpochIndex,
    send: (data: Uint8Array): Promise<void> => adapter.send(remote, encryptWithAd(txCipher, new Uint8Array(0), data)),
    receive: async function* (): AsyncIterable<Uint8Array> {
      for (;;) {
        const msg = await next(Number.MAX_SAFE_INTEGER);
        yield decryptWithAd(rxCipher, new Uint8Array(0), msg.data);
      }
    },
  };
}

export async function initiateNoiseXX(
  adapter: NetworkAdapterPort,
  localKey: Ed25519Keypair,
  localEpochIndex: number,
  timeoutMs = 10_000,
  expectedRemoteDevicePub?: Ed25519PublicKey,
): Promise<NoiseHandshakeResult> {
  const next = makeInbox(adapter);
  const hs = new NoiseXX();
  await adapter.send('', hs.writeA()); // -> e
  const m2 = await next(timeoutMs); // <- e, ee, s, es
  const b = hs.readB(m2.data);
  const respPayload = parsePayload(b.payload);
  await verifyBinding(b.bindingHash, respPayload, expectedRemoteDevicePub);
  // -> s, se  (assina o h pré-payload via callback)
  const msg3 = await hs.writeC(async (bindingHash) =>
    buildPayload(localKey.publicKey, localEpochIndex, await ed25519Sign(localKey.privateKey, bindingHash)),
  );
  await adapter.send(m2.from, msg3);
  const [c1, c2] = hs.split(); // iniciador: envia em c1, recebe em c2
  return makeResult(adapter, m2.from, respPayload, localEpochIndex, c1, c2, next);
}

export async function respondNoiseXX(
  adapter: NetworkAdapterPort,
  localKey: Ed25519Keypair,
  localEpochIndex: number,
  timeoutMs = 10_000,
  expectedRemoteDevicePub?: Ed25519PublicKey,
): Promise<NoiseHandshakeResult> {
  const next = makeInbox(adapter);
  const hs = new NoiseXX();
  const m1 = await next(timeoutMs); // <- e
  hs.readA(m1.data);
  // -> e, ee, s, es  (assina o h pré-payload via callback)
  const msg2 = await hs.writeB(async (bindingHash) =>
    buildPayload(localKey.publicKey, localEpochIndex, await ed25519Sign(localKey.privateKey, bindingHash)),
  );
  await adapter.send(m1.from, msg2);
  const m3 = await next(timeoutMs); // <- s, se
  const c = hs.readC(m3.data);
  const initPayload = parsePayload(c.payload);
  await verifyBinding(c.bindingHash, initPayload, expectedRemoteDevicePub);
  const [c1, c2] = hs.split(); // respondedor: recebe em c1, envia em c2
  return makeResult(adapter, m1.from, initPayload, localEpochIndex, c2, c1, next);
}
