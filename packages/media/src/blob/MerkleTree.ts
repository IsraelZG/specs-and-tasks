import { sha256, type Sha256Digest } from "@plataforma/crypto";

export interface MerkleNode {
  hash: Sha256Digest;
  left: MerkleNode | undefined;
  right: MerkleNode | undefined;
}

export class MerkleTree {
  private _root: MerkleNode;
  private _leafCount: number;

  private constructor(root: MerkleNode, leafCount: number) {
    this._root = root;
    this._leafCount = leafCount;
  }

  static async build(leafHashes: Sha256Digest[]): Promise<MerkleTree> {
    if (leafHashes.length === 0) {
      throw new Error("MerkleTree requires at least one leaf hash");
    }

    const leafNodes: MerkleNode[] = leafHashes.map((h) => ({
      hash: h,
      left: undefined,
      right: undefined,
    }));
    const root = await MerkleTree.buildLevel(leafNodes);
    return new MerkleTree(root, leafHashes.length);
  }

  private static async buildLevel(nodes: MerkleNode[]): Promise<MerkleNode> {
    if (nodes.length === 1) {
      const rootNode = nodes[0];
      if (!rootNode) {
        throw new Error("Invalid MerkleTree state: node is undefined");
      }
      return rootNode;
    }

    const lastNode = nodes[nodes.length - 1];
    if (!lastNode) {
      throw new Error("Invalid MerkleTree state: empty nodes list");
    }

    // Balance: if odd, duplicate last
    const balanced =
      nodes.length % 2 === 0 ? nodes : [...nodes, lastNode];

    const parents = await Promise.all(
      Array.from({ length: balanced.length / 2 }, (_, i) => {
        const left = balanced[i * 2];
        const right = balanced[i * 2 + 1];
        if (!left || !right) {
          throw new Error("Invalid MerkleTree state: unbalanced child nodes");
        }
        const combined = new Uint8Array(left.hash.length + right.hash.length);
        combined.set(left.hash);
        combined.set(right.hash, left.hash.length);
        return sha256(combined);
      }),
    );

    const parentNodes: MerkleNode[] = parents.map((hash, i) => {
      const left = balanced[i * 2];
      const right = balanced[i * 2 + 1];
      if (!left || !right) {
        throw new Error("Invalid MerkleTree state: unbalanced child nodes");
      }
      return {
        hash,
        left,
        right,
      };
    });

    return MerkleTree.buildLevel(parentNodes);
  }

  get root(): Sha256Digest {
    return this._root.hash;
  }

  getProof(chunkIndex: number): Sha256Digest[] {
    if (chunkIndex < 0 || chunkIndex >= this._leafCount) {
      throw new Error(
        `chunkIndex ${String(chunkIndex)} out of range [0, ${String(this._leafCount - 1)}]`,
      );
    }

    const proof: Sha256Digest[] = [];
    const virtualCount = MerkleTree.nextPow2(this._leafCount);
    this.walkProof(this._root, chunkIndex, 0, virtualCount, proof);
    // Reverse: walkProof collects top-down, but verifyProof expects bottom-up
    return proof.reverse();
  }

  private static nextPow2(n: number): number {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
  }

  private walkProof(
    node: MerkleNode,
    targetIndex: number,
    rangeStart: number,
    rangeEnd: number,
    proof: Sha256Digest[],
  ): void {
    if (!node.left && !node.right) {
      return;
    }

    const mid = Math.floor((rangeStart + rangeEnd) / 2);

    if (targetIndex < mid) {
      if (node.right) proof.push(node.right.hash);
      if (node.left) {
        this.walkProof(node.left, targetIndex, rangeStart, mid, proof);
      }
    } else {
      if (node.left) proof.push(node.left.hash);
      if (node.right) {
        this.walkProof(node.right, targetIndex, mid, rangeEnd, proof);
      }
    }
  }

  static async verifyProof(
    root: Sha256Digest,
    leaf: Sha256Digest,
    index: number,
    proof: Sha256Digest[],
  ): Promise<boolean> {
    let currentHash = leaf;
    let currentIndex = index;

    for (const siblingHash of proof) {
      const left = currentIndex % 2 === 0 ? currentHash : siblingHash;
      const right = currentIndex % 2 === 0 ? siblingHash : currentHash;

      const combined = new Uint8Array(left.length + right.length);
      combined.set(left);
      combined.set(right, left.length);
      currentHash = await sha256(combined);
      currentIndex = Math.floor(currentIndex / 2);
    }

    if (root.length !== currentHash.length) return false;
    for (let i = 0; i < root.length; i++) {
      if (root[i] !== currentHash[i]) return false;
    }
    return true;
  }
}
