import { generateMnemonic as bip39Generate, validateMnemonic as bip39Validate, mnemonicToSeed as bip39Seed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { ed25519 } from '@noble/curves/ed25519';
import { gcm } from '@noble/ciphers/aes.js';

// ===================== BIP39 Mnemonic =====================

/**
 * Gera um mnemônico BIP39 aleatório.
 * strength: 128 → 12 palavras | 256 → 24 palavras
 */
export function generateMnemonic(strength: 128 | 256): string {
  return bip39Generate(wordlist, strength);
}

/**
 * Valida se um mnemônico é válido (checksum BIP39).
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39Validate(mnemonic, wordlist);
}

/**
 * Converte mnemônico em seed de 64 bytes (BIP39 PBKDF2-HMAC-SHA512, 2048 rounds).
 * passphrase: "" por default (BIP39 standard).
 */
export function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Promise<Uint8Array> {
  return bip39Seed(mnemonic, passphrase);
}

// ===================== Derivação de Chave Mestra =====================

/**
 * Deriva o par de chaves Ed25519 mestre a partir do seed BIP39.
 * seed: 64 bytes → 32 bytes via HKDF-SHA256 com info "plataforma-master-key"
 */
export function deriveMasterKeyPair(
  seed: Uint8Array
): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const privateKey = hkdf(sha256, seed, new Uint8Array(0), 'plataforma-master-key', 32);
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

// ===================== Desbloqueio de Dispositivo =====================

/**
 * Deriva a chave de desbloqueio do dispositivo via PBKDF2-SHA256.
 * 210 000 iterações, salt = UTF8("plataforma-device-unlock:" + deviceId), keylen = 32 bytes.
 */
export async function deriveDeviceUnlockKey(
  password: string,
  deviceId: string
): Promise<Uint8Array> {
  const salt = `plataforma-device-unlock:${deviceId}`;
  const key = await pbkdf2Async(sha256, password, salt, { c: 210000, dkLen: 32 });
  return key;
}

/**
 * Verifica se uma senha está correta ao tentar decifrar o material cifrado.
 * O material cifrado é nonce (12 bytes) + ciphertext (AES-256-GCM).
 * Retorna true se a tag GCM é válida, false caso contrário (nunca lança).
 */
export async function verifyPassword(
  password: string,
  deviceId: string,
  encryptedMaterial: Uint8Array
): Promise<boolean> {
  try {
    const unlockKey = await deriveDeviceUnlockKey(password, deviceId);
    const nonce = encryptedMaterial.slice(0, 12);
    const ciphertext = encryptedMaterial.slice(12);

    const decipher = gcm(unlockKey, nonce, new Uint8Array(0));
    const plaintext = decipher.decrypt(ciphertext);
    return plaintext.length >= 0;
  } catch {
    return false;
  }
}
