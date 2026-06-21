import { describe, expect, it } from 'vitest';

import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  blake2s256,
  ed25519GenerateKeyPair,
  ed25519Sign,
  ed25519Verify,
  hkdfSha256,
  sha256,
  type AesKey,
  type AesNonce,
  type Ed25519PrivateKey,
  type Ed25519PublicKey,
  type Ed25519Signature,
} from '../src/wrappers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

// ---------------------------------------------------------------------------
// 1–4: Ed25519
// ---------------------------------------------------------------------------

describe('Ed25519', () => {
  it('1. generateKeyPair — chaves de 32 bytes, publicKey !== privateKey', async () => {
    const { publicKey, privateKey } = await ed25519GenerateKeyPair();
    expect(publicKey).toBeInstanceOf(Uint8Array);
    expect(privateKey).toBeInstanceOf(Uint8Array);
    expect(publicKey.length).toBe(32);
    expect(privateKey.length).toBe(32);
    expect(bytesToHex(publicKey)).not.toBe(bytesToHex(privateKey));
  });

  it('2. sign + verify roundtrip com vetor RFC 8032 §7.1 TEST 2', async () => {
    // RFC 8032 §7.1 TEST 2
    const privateKey = hexToBytes(
      '4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb',
    ) as Ed25519PrivateKey;
    const expectedPublic = hexToBytes('3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c') as Ed25519PublicKey;
    const message = hexToBytes('72');
    const expectedSig = hexToBytes(
      '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00',
    ) as Ed25519Signature;

    const signature = await ed25519Sign(privateKey, message);
    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64);
    expect(bytesToHex(signature)).toBe(
      '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00',
    );

    const valid = await ed25519Verify(expectedPublic, message, signature);
    expect(valid).toBe(true);
  });

  it('3. verify retorna false com assinatura corrompida (1 bit trocado)', async () => {
    const { publicKey, privateKey } = await ed25519GenerateKeyPair();
    const message = new Uint8Array([1, 2, 3, 4, 5]);
    const signature = await ed25519Sign(privateKey, message);

    // Corrompe 1 bit no último byte
    const corrupted = new Uint8Array(signature);
    corrupted[63] = corrupted[63]! ^ 1;

    const valid = await ed25519Verify(publicKey, message, corrupted as Ed25519Signature);
    expect(valid).toBe(false);
  });

  it('4. verify retorna false com chave pública errada', async () => {
    const { publicKey, privateKey } = await ed25519GenerateKeyPair();
    const { publicKey: otherPub } = await ed25519GenerateKeyPair();
    const message = new Uint8Array([1, 2, 3, 4, 5]);
    const signature = await ed25519Sign(privateKey, message);

    const valid = await ed25519Verify(otherPub, message, signature);
    expect(valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5–7: AES-256-GCM
// ---------------------------------------------------------------------------

describe('AES-256-GCM', () => {
  const key = new Uint8Array(32).fill(0x42) as AesKey; // chave fixa para testes

  it('5. encrypt + decrypt roundtrip com plaintexts variáveis', async () => {
    const cases: Uint8Array[] = [
      new Uint8Array(0), // vazio
      new Uint8Array([0x01]), // 1 byte
      new Uint8Array(1024), // 1 KB
      new Uint8Array(1024 * 1024), // 1 MB
    ];

    for (const plaintext of cases) {
      const { nonce, ciphertext, authTag } = await aesGcmEncrypt(key, plaintext);
      expect(nonce).toBeInstanceOf(Uint8Array);
      expect(nonce.length).toBe(12);
      expect(ciphertext).toBeInstanceOf(Uint8Array);
      expect(ciphertext.length).toBe(plaintext.length); // AES-GCM não adiciona padding
      expect(authTag).toBeInstanceOf(Uint8Array);
      expect(authTag.length).toBe(16);

      const decrypted = await aesGcmDecrypt(key, nonce, ciphertext, authTag);
      expect(decrypted).toEqual(plaintext);
    }
  });

  it('6. decrypt lança com authTag corrompido', async () => {
    const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
    const { nonce, ciphertext, authTag } = await aesGcmEncrypt(key, plaintext);

    const corruptedTag = new Uint8Array(authTag);
    corruptedTag[0] = corruptedTag[0]! ^ 0xff;

    await expect(
      aesGcmDecrypt(key, nonce, ciphertext, corruptedTag as import('../src/wrappers.js').AesGcmResult['authTag']),
    ).rejects.toThrow();
  });

  it('7. decrypt lança com ciphertext corrompido', async () => {
    const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
    const { nonce, ciphertext, authTag } = await aesGcmEncrypt(key, plaintext);

    const corruptedCt = new Uint8Array(ciphertext);
    corruptedCt[0] = corruptedCt[0]! ^ 0xff;

    await expect(aesGcmDecrypt(key, nonce, corruptedCt, authTag)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 8: SHA-256
// ---------------------------------------------------------------------------

describe('SHA-256', () => {
  it('8. digest do vetor vazio — RFC 6234', async () => {
    const digest = await sha256(new Uint8Array(0));
    expect(bytesToHex(digest)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

// ---------------------------------------------------------------------------
// 9: Blake2s-256
// ---------------------------------------------------------------------------

describe('Blake2s-256', () => {
  it('9. digest do vetor vazio — RFC 7693', async () => {
    const digest = await blake2s256(new Uint8Array(0));
    expect(bytesToHex(digest)).toBe(
      '69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9',
    );
  });
});

// ---------------------------------------------------------------------------
// 10: HKDF (SHA-256)
// ---------------------------------------------------------------------------

describe('HKDF-SHA-256', () => {
  it('10. roundtrip com vetor RFC 5869 §A.1 Test Case 1', async () => {
    // RFC 5869 A.1
    const ikm = new Uint8Array(22).fill(0x0b);
    const salt = hexToBytes('000102030405060708090a0b0c');
    const info = hexToBytes('f0f1f2f3f4f5f6f7f8f9');
    const expected = hexToBytes(
      '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865',
    );

    const okm = await hkdfSha256(ikm, salt, info, 42);
    expect(bytesToHex(okm)).toBe(bytesToHex(expected));
  });
});
