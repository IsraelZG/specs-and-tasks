import type { RandomPort } from '@plataforma/protocol';

/**
 * Implementação xoshiro128**.
 * Gera double em [0, 1) via deslocamento de 64 bits.
 */
function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

function splitmix32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x9e3779b9) | 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    z = (z ^ (z >>> 16)) >>> 0;
    return z;
  };
}

/** PRNG determinístico com semente (xoshiro128**). */
export class SeededRandom implements RandomPort {
  private s: [number, number, number, number];

  constructor(seed: string) {
    // Converte string seed em 4 sementes de 32 bits via splitmix32
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    const sm = splitmix32(h);
    this.s = [sm(), sm(), sm(), sm()];
  }

  /** Próximo double em [0, 1). */
  nextDouble(): number {
    const result = this.nextU32();
    // Converte para double em [0, 1) mantendo 53 bits de precisão
    return (result >>> 11) * 2 ** -53 + ((this.nextU32() >>> 12) * 2 ** -53);
  }

  private nextU32(): number {
    const [a, b, c, d] = this.s;
    const result = Math.imul(d, 0x9e3779b9) >>> 0;
    let t = (b << 9) >>> 0;
    this.s[1] = (a ^ b) >>> 0;
    this.s[2] = ((b ^ c) >>> 0) << 11;
    this.s[3] = (c ^ d) >>> 0;
    // Rola a pra esquerda
    const a2 = ((a << 23) | (a >>> 9)) >>> 0;
    this.s[0] = a2 ^ t ^ (a2 >>> 18);
    return result;
  }

  bytes(length: number): Uint8Array {
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      out[i] = this.nextU32() & 0xff;
    }
    return out;
  }
}
