import type { RandomPort } from '@plataforma/protocol';

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
    const s = this.s;
    const result = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 11);
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

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}
