import { aesGcmEncrypt, aesGcmDecrypt, sha256 } from "@plataforma/crypto";
import type { AesKey, AesNonce, Sha256Digest } from "@plataforma/crypto";

export const DEFAULT_CHUNK_SIZE = 1_048_576; // 1 MiB

export interface EncryptedChunk {
  index: number;
  offset: number;
  ciphertext: Uint8Array;
  nonce: AesNonce;
  authTag: Uint8Array;
  ciphertextHash: Sha256Digest;
  plaintextHash: Sha256Digest;
}

export class Chunker {
  readonly chunkSize: number;

  constructor(chunkSize?: number) {
    this.chunkSize = chunkSize ?? DEFAULT_CHUNK_SIZE;
  }

  slice(data: Uint8Array): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    for (let offset = 0; offset < data.length; offset += this.chunkSize) {
      const end = Math.min(offset + this.chunkSize, data.length);
      chunks.push(data.subarray(offset, end));
    }
    return chunks;
  }

  async encryptChunk(
    chunk: Uint8Array,
    index: number,
    offset: number,
    key: AesKey,
  ): Promise<EncryptedChunk> {
    const { nonce, ciphertext, authTag } = await aesGcmEncrypt(key, chunk);
    const ciphertextHash = await sha256(ciphertext);
    const plaintextHash = await sha256(chunk);

    return {
      index,
      offset,
      ciphertext,
      nonce,
      authTag,
      ciphertextHash,
      plaintextHash,
    };
  }

  async process(data: Uint8Array, key: AesKey): Promise<EncryptedChunk[]> {
    const chunks: EncryptedChunk[] = [];
    let offset = 0;

    for (let index = 0; offset < data.length; index++) {
      const end = Math.min(offset + this.chunkSize, data.length);
      const chunk = data.subarray(offset, end);
      chunks.push(await this.encryptChunk(chunk, index, offset, key));
      offset = end;
    }

    return chunks;
  }

  async reassemble(chunks: EncryptedChunk[], key: AesKey): Promise<Uint8Array> {
    // Sort by index to handle out-of-order delivery
    const sorted = [...chunks].sort((a, b) => a.index - b.index);

    const decrypted = await Promise.all(
      sorted.map((c) => aesGcmDecrypt(key, c.nonce, c.ciphertext, c.authTag)),
    );

    const totalLength = decrypted.reduce((sum, d) => sum + d.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const d of decrypted) {
      result.set(d, pos);
      pos += d.length;
    }
    return result;
  }
}
