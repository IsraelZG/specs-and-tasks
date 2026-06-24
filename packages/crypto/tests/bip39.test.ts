import { describe, it, expect } from 'vitest';
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeed,
  deriveMasterKeyPair,
  deriveDeviceUnlockKey,
  verifyPassword,
} from '../src/bip39';
import { hexToBytes, bytesToHex, randomBytes } from '@noble/hashes/utils';
import { gcm } from '@noble/ciphers/aes.js';

function toHex(b: Uint8Array): string {
  return bytesToHex(b);
}

describe('BIP39 + Derivação + Desbloqueio', () => {
  // Caso 1: generateMnemonic(128) → 12 palavras, valida
  it('1. generateMnemonic(128) produz 12 palavras válidas', () => {
    const mnemonic = generateMnemonic(128);
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(12);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  // Caso 2: generateMnemonic(256) → 24 palavras, valida
  it('2. generateMnemonic(256) produz 24 palavras válidas', () => {
    const mnemonic = generateMnemonic(256);
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(24);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  // Caso 3: validateMnemonic com string inválida → false
  it('3. validateMnemonic("palavra inválida") → false', () => {
    expect(validateMnemonic('palavra inválida')).toBe(false);
  });

  // Caso 4: Determinismo — mesmo mnemônico → mesmo seed → mesmo par de chaves
  it('4. mesmo mnemônico produz mesmo seed e mesmo par de chaves', async () => {
    const mnemonic = generateMnemonic(128);

    const seed1 = await mnemonicToSeed(mnemonic);
    const seed2 = await mnemonicToSeed(mnemonic);

    expect(seed1).toEqual(seed2);

    const pair1 = deriveMasterKeyPair(seed1);
    const pair2 = deriveMasterKeyPair(seed2);

    expect(pair1.privateKey).toEqual(pair2.privateKey);
    expect(pair1.publicKey).toEqual(pair2.publicKey);
  });

  // Caso 5: Vetor conhecido BIP39
  it('5. vetor BIP39 oficial — mnemônico conhecido produz seed conhecido', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const seed = await mnemonicToSeed(mnemonic, '');
    const seedHex = toHex(seed);
    // Seed calculado pela implementação @scure/bip39 para este mnemônico
    expect(seedHex).toBe(
      '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4'
    );
  });

  // Caso 6: deriveDeviceUnlockKey — determinismo
  it('6. deriveDeviceUnlockKey produz 32 bytes; chamadas repetidas mesmo resultado', async () => {
    const key1 = await deriveDeviceUnlockKey('senha-certa', 'device-abc');
    const key2 = await deriveDeviceUnlockKey('senha-certa', 'device-abc');

    expect(key1).toHaveLength(32);
    expect(key1).toEqual(key2);
  });

  // Caso 7: verifyPassword com senha correta → true
  it('7. verifyPassword com senha correta → true', async () => {
    const password = 'senha-certa';
    const deviceId = 'device-abc';

    const unlockKey = await deriveDeviceUnlockKey(password, deviceId);
    const plaintext = new Uint8Array([1, 2, 3, 4]);
    const nonce = randomBytes(12);
    const cipher = gcm(unlockKey, nonce, new Uint8Array(0));
    const ciphertext = cipher.encrypt(plaintext);

    const encrypted = new Uint8Array(nonce.length + ciphertext.length);
    encrypted.set(nonce);
    encrypted.set(ciphertext, nonce.length);

    const result = await verifyPassword(password, deviceId, encrypted);
    expect(result).toBe(true);
  });

  // Caso 8: verifyPassword com senha errada → false
  it('8. verifyPassword com senha errada → false', async () => {
    const password = 'senha-certa';
    const deviceId = 'device-abc';

    const unlockKey = await deriveDeviceUnlockKey(password, deviceId);
    const plaintext = new Uint8Array([1, 2, 3, 4]);
    const nonce = randomBytes(12);
    const cipher = gcm(unlockKey, nonce, new Uint8Array(0));
    const ciphertext = cipher.encrypt(plaintext);
    const encrypted = new Uint8Array(nonce.length + ciphertext.length);
    encrypted.set(nonce);
    encrypted.set(ciphertext, nonce.length);

    const result = await verifyPassword('senha-errada', deviceId, encrypted);
    expect(result).toBe(false);
  });

  // Caso 9: Isolamento — seeds diferentes → pares de chaves diferentes
  it('9. seeds diferentes produzem pares de chaves diferentes', async () => {
    const mnemonic1 = generateMnemonic(128);
    const mnemonic2 = generateMnemonic(128);

    const seed1 = await mnemonicToSeed(mnemonic1);
    const seed2 = await mnemonicToSeed(mnemonic2);

    const pair1 = deriveMasterKeyPair(seed1);
    const pair2 = deriveMasterKeyPair(seed2);

    expect(pair1.privateKey).not.toEqual(pair2.privateKey);
    expect(pair1.publicKey).not.toEqual(pair2.publicKey);
  });

  // Caso 10: Fuzz — 50 mnemônicos gerados, todos válidos e distintos
  it('10. fuzz — 50 mnemônicos gerados validam e produzem seeds/chaves distintos', async () => {
    const mnemonics = Array.from({ length: 50 }, () => generateMnemonic(128));

    for (const m of mnemonics) {
      expect(validateMnemonic(m)).toBe(true);
    }

    const unique = new Set(mnemonics);
    expect(unique.size).toBe(50);

    const seeds = await Promise.all(mnemonics.map((m) => mnemonicToSeed(m)));
    const seedHexes = seeds.map(toHex);
    expect(new Set(seedHexes).size).toBe(50);

    const pairs = seeds.map((s) => deriveMasterKeyPair(s));
    const pubKeys = pairs.map((p) => toHex(p.publicKey));
    expect(new Set(pubKeys).size).toBe(50);
  });
});
