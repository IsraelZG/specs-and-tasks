import { ed25519 } from '@noble/curves/ed25519';
import { sha256 as sha2 } from '@noble/hashes/sha2';
import { blake2s } from '@noble/hashes/blake2';
import { hkdf } from '@noble/hashes/hkdf';

// === Ed25519 (assinatura/verificação) ===

/** Chave privada Ed25519 — 32 bytes. Derivado de `docs/visao-arquitetural.md` §1 camada 2. */
export type Ed25519PrivateKey = Uint8Array;
/** Chave pública Ed25519 — 32 bytes. */
export type Ed25519PublicKey = Uint8Array;
/** Assinatura Ed25519 — 64 bytes. */
export type Ed25519Signature = Uint8Array;

/** Gera par de chaves Ed25519. Backend: @noble/curves ou WebCrypto conforme ambiente. */
export function ed25519GenerateKeyPair(): {
  publicKey: Ed25519PublicKey;
  privateKey: Ed25519PrivateKey;
} {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

/** Assina `message` com chave privada. */
export function ed25519Sign(
  privateKey: Ed25519PrivateKey,
  message: Uint8Array,
): Ed25519Signature {
  return ed25519.sign(message, privateKey);
}

/** Verifica assinatura. */
export function ed25519Verify(
  publicKey: Ed25519PublicKey,
  message: Uint8Array,
  signature: Ed25519Signature,
): boolean {
  return ed25519.verify(signature, message, publicKey);
}

// === AES-256-GCM (cifra simétrica autenticada) ===

/** Chave AES-256 — 32 bytes. */
export type AesKey = Uint8Array;
/** Nonce/IV AES-GCM — 12 bytes (recomendado NIST). */
export type AesNonce = Uint8Array;
/** Resultado de cifra AES-GCM: { ciphertext, authTag }. */
export interface AesGcmResult {
  ciphertext: Uint8Array;
  authTag: Uint8Array;
}

// --- adaptador WebCrypto isomórfico (browser + Node ≥20) ---
// Tipos mínimos para evitar dependência de lib DOM no tsconfig.
interface WebCryptoSubtle {
  importKey(
    format: 'raw',
    keyData: Uint8Array,
    algorithm: 'AES-GCM',
    extractable: boolean,
    keyUsages: string[],
  ): Promise<{ _brand: 'CryptoKey' }>;
  encrypt(
    algorithm: { name: 'AES-GCM'; iv: Uint8Array; tagLength: number },
    key: { _brand: 'CryptoKey' },
    data: Uint8Array,
  ): Promise<ArrayBuffer>;
  decrypt(
    algorithm: { name: 'AES-GCM'; iv: Uint8Array; tagLength: number },
    key: { _brand: 'CryptoKey' },
    data: Uint8Array,
  ): Promise<ArrayBuffer>;
}

interface WebCrypto {
  subtle: WebCryptoSubtle;
  getRandomValues<T extends Uint8Array>(array: T): T;
}

function getCrypto(): WebCrypto {
  // isomórfico: browser e Node ≥20 expõem crypto como global
  return (globalThis as unknown as { crypto: WebCrypto }).crypto;
}

/** Cifra `plaintext` com AES-256-GCM. Gera nonce internamente (12 bytes) e o retorna. */
export async function aesGcmEncrypt(
  key: AesKey,
  plaintext: Uint8Array,
): Promise<{ nonce: AesNonce; ciphertext: Uint8Array; authTag: Uint8Array }> {
  if (key.length !== 32) {
    throw new Error(`AES-256-GCM requires a 32-byte key, got ${String(key.length)} bytes`);
  }
  const c = getCrypto();
  const cryptoKey = await c.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  const nonce = c.getRandomValues(new Uint8Array(12));
  const encrypted = await c.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    cryptoKey,
    plaintext,
  );
  const result = new Uint8Array(encrypted);
  // WebCrypto concatena ciphertext || authTag (últimos 16 bytes)
  const ciphertext = result.subarray(0, result.length - 16);
  const authTag = result.subarray(result.length - 16);
  return { nonce, ciphertext, authTag };
}

/** Decifra `ciphertext` com AES-256-GCM. Lança se authTag não confere. */
export async function aesGcmDecrypt(
  key: AesKey,
  nonce: AesNonce,
  ciphertext: Uint8Array,
  authTag: Uint8Array,
): Promise<Uint8Array> {
  if (key.length !== 32) {
    throw new Error(`AES-256-GCM requires a 32-byte key, got ${String(key.length)} bytes`);
  }
  const c = getCrypto();
  const cryptoKey = await c.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
  // WebCrypto espera ciphertext || authTag concatenados
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);
  const decrypted = await c.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    cryptoKey,
    combined,
  );
  return new Uint8Array(decrypted);
}

// === SHA-256 ===

/** Digest SHA-256 — 32 bytes. */
export type Sha256Digest = Uint8Array;

export function sha256(data: Uint8Array): Sha256Digest {
  return sha2(data);
}

// === Blake2s-256 ===

export function blake2s256(data: Uint8Array): Uint8Array {
  return blake2s(data);
}

// === HKDF (SHA-256) ===

export function hkdfSha256(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number,
): Uint8Array {
  return hkdf(sha2, ikm, salt, info, length);
}
