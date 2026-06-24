import { describe, test, expect } from "vitest";
import { MerkleTree } from "../../src/blob/MerkleTree.js";
import { Chunker } from "../../src/blob/Chunker.js";
import { sha256, type Sha256Digest } from "@plataforma/crypto";

const key = new Uint8Array(32).fill(0x42);

async function leaf(data: string): Promise<Sha256Digest> {
  return sha256(new TextEncoder().encode(data));
}

describe("MerkleTree", () => {
  test("8: build com 1 leaf → raiz = hash do leaf", async () => {
    const l = await leaf("chunk0");
    const tree = await MerkleTree.build([l]);
    expect(tree.root).toEqual(l);
  });

  test("9: build com 4 leaves → getProof(0) retorna 2 hashes", async () => {
    const leaves = [
      await leaf("a"),
      await leaf("b"),
      await leaf("c"),
      await leaf("d"),
    ];
    const tree = await MerkleTree.build(leaves);
    const proof = tree.getProof(0);
    expect(proof).toHaveLength(2);
  });

  test("10: verifyProof com prova válida → true", async () => {
    const leaves = [
      await leaf("a"),
      await leaf("b"),
      await leaf("c"),
      await leaf("d"),
    ];
    const tree = await MerkleTree.build(leaves);
    const proof = tree.getProof(0);
    const valid = await MerkleTree.verifyProof(tree.root, leaves[0]!, 0, proof);
    expect(valid).toBe(true);
  });

  test("11: verifyProof com prova adulterada → false", async () => {
    const leaves = [
      await leaf("a"),
      await leaf("b"),
      await leaf("c"),
      await leaf("d"),
    ];
    const tree = await MerkleTree.build(leaves);
    const proof = tree.getProof(0);

    const tamperedProof = proof.map((h) => {
      const copy = new Uint8Array(h);
      copy[0] = (copy[0]! + 1) % 256;
      return copy;
    });

    const valid = await MerkleTree.verifyProof(tree.root, leaves[0]!, 0, tamperedProof);
    expect(valid).toBe(false);
  });

  test("12: build com 3 leaves (ímpar) → árvore balanceada com duplicação", async () => {
    const leaves = [
      await leaf("a"),
      await leaf("b"),
      await leaf("c"),
    ];
    const tree = await MerkleTree.build(leaves);

    const proof0 = tree.getProof(0);
    const proof2 = tree.getProof(2);

    expect(await MerkleTree.verifyProof(tree.root, leaves[0]!, 0, proof0)).toBe(true);
    expect(await MerkleTree.verifyProof(tree.root, leaves[2]!, 2, proof2)).toBe(true);

    // Falso positivo: verificar leaf 0 com proof do leaf 2 deve falhar
    expect(await MerkleTree.verifyProof(tree.root, leaves[0]!, 1, proof2)).toBe(false);
  });

  test("13: InfoHash sobre ciphertext — com saída REAL de process()", async () => {
    const chunker = new Chunker(64);
    const data = new Uint8Array(200).map((_, i) => (i * 3 + 1) % 256);
    const chunks = await chunker.process(data, key);
    expect(chunks.length).toBeGreaterThan(1);

    const cipherTree = await MerkleTree.build(chunks.map((c) => c.ciphertextHash));
    const plainTree = await MerkleTree.build(chunks.map((c) => c.plaintextHash));

    // A raiz sobre ciphertextHash DEVE diferir da raiz sobre plaintextHash
    // (comprova que a árvore consome o ciphertext real produzido por process()).
    expect(cipherTree.root).not.toEqual(plainTree.root);

    // Reconstruir a raiz a partir de sha256(ciphertext) de cada chunk deve bater com cipherTree.
    const reconstructed = await MerkleTree.build(
      await Promise.all(chunks.map((c) => sha256(c.ciphertext))),
    );
    expect(reconstructed.root).toEqual(cipherTree.root);
  });
});
