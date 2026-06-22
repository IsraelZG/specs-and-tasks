import { describe, test, expect } from "vitest";
import { Chunker } from "../../src/blob/Chunker.js";
import { sha256 } from "@plataforma/crypto";

describe("Chunker", () => {
  const key = new Uint8Array(32).fill(0x42); // 32 bytes AES-256 key

  test("1: slice 1024 bytes chunkSize=256 → 4 chunks of 256", () => {
    const chunker = new Chunker(256);
    const data = new Uint8Array(1024).fill(0xaa);
    const chunks = chunker.slice(data);
    expect(chunks).toHaveLength(4);
    expect(chunks[0]).toHaveLength(256);
    expect(chunks[1]).toHaveLength(256);
    expect(chunks[2]).toHaveLength(256);
    expect(chunks[3]).toHaveLength(256);
  });

  test("2: slice 1000 bytes chunkSize=256 → 3×256 + 1×232", () => {
    const chunker = new Chunker(256);
    const data = new Uint8Array(1000).fill(0xbb);
    const chunks = chunker.slice(data);
    expect(chunks).toHaveLength(4);
    expect(chunks[0]).toHaveLength(256);
    expect(chunks[1]).toHaveLength(256);
    expect(chunks[2]).toHaveLength(256);
    expect(chunks[3]).toHaveLength(232); // 1000 - 768
  });

  test("3: process 512 bytes → EncryptedChunk preenchidos, ciphertextHash = sha256(ciphertext)", async () => {
    const chunker = new Chunker(200);
    const data = new Uint8Array(512).fill(0xcc);
    const result = await chunker.process(data, key);

    expect(result).toHaveLength(3); // 200 + 200 + 112
    for (let i = 0; i < result.length; i++) {
      const chunk = result[i]!;
      expect(chunk.index).toBe(i);
      expect(typeof chunk.offset).toBe("number");
      expect(chunk.ciphertext).toBeInstanceOf(Uint8Array);
      expect(chunk.nonce).toHaveLength(12);
      expect(chunk.authTag).toHaveLength(16);
      expect(chunk.ciphertextHash).toBeInstanceOf(Uint8Array);
      expect(chunk.plaintextHash).toBeInstanceOf(Uint8Array);

      // ciphertextHash deve ser sha256(ciphertext)
      const expectedCipherHash = await sha256(chunk.ciphertext);
      expect(chunk.ciphertextHash).toEqual(expectedCipherHash);

      // plaintextHash deve ser sha256 do plaintext do chunk
      const expectedPlainHash = await sha256(data.subarray(chunk.offset, chunk.offset + (i < 2 ? 200 : 112)));
      expect(chunk.plaintextHash).toEqual(expectedPlainHash);
    }
  });

  test("4: roundtrip process → reassemble → bytes idênticos", async () => {
    const chunker = new Chunker(1_048_576); // 1 MiB default
    const original = new Uint8Array(256).map((_, i) => i % 256);
    const encrypted = await chunker.process(original, key);
    const reassembled = await chunker.reassemble(encrypted, key);
    expect(reassembled).toEqual(original);
  });

  test("5: reassemble com chunks em ordem trocada → falha", async () => {
    const chunker = new Chunker(256);
    const original = new Uint8Array(500).fill(0xdd);
    const encrypted = await chunker.process(original, key);

    // Swap nonces entre chunks 0 e 1 (ciphertext fica com nonce errado)
    const swapped = [
      { ...encrypted[0]!, nonce: encrypted[1]!.nonce },
      { ...encrypted[1]!, nonce: encrypted[0]!.nonce },
    ];

    await expect(chunker.reassemble(swapped, key)).rejects.toThrow();
  });

  test("6: arquivo 5 MiB dividido em chunks de 1 MiB → roundtrip com SHA-256 igual", async () => {
    const chunker = new Chunker(1_048_576); // 1 MiB
    const original = new Uint8Array(5_242_880); // 5 MiB
    for (let i = 0; i < original.length; i++) {
      original[i] = (i * 7 + 13) % 256;
    }

    const encrypted = await chunker.process(original, key);
    expect(encrypted).toHaveLength(5);

    const originalHash = await sha256(original);
    const reassembled = await chunker.reassemble(encrypted, key);
    const reassembledHash = await sha256(reassembled);
    expect(reassembledHash).toEqual(originalHash);
  });

  test("7: dois chunks idênticos cifrados com mesma chave → ciphertexts diferentes", async () => {
    const chunker = new Chunker(128);
    // 256 bytes = 2 chunks of 128 identical bytes
    const data = new Uint8Array(256).fill(0xef);
    const result = await chunker.process(data, key);

    expect(result).toHaveLength(2);
    expect(result[0]!.ciphertext).not.toEqual(result[1]!.ciphertext);
  });
});
