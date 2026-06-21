import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../src/random';

describe('SeededRandom', () => {
  it('7: mesma seed → mesma sequência de bytes(16) (2 chamadas)', () => {
    const rng1 = new SeededRandom('fixa');
    const a = rng1.bytes(16);
    const b = rng1.bytes(16);

    const rng2 = new SeededRandom('fixa');
    const a2 = rng2.bytes(16);
    const b2 = rng2.bytes(16);

    expect(a).toEqual(a2);
    expect(b).toEqual(b2);
  });

  it('8: seeds diferentes → sequências diferentes', () => {
    const rng1 = new SeededRandom('alpha');
    const rng2 = new SeededRandom('beta');
    const a = rng1.bytes(16);
    const b = rng2.bytes(16);
    expect(a).not.toEqual(b);
  });

  it('9: bytes(0) retorna Uint8Array vazio', () => {
    const rng = new SeededRandom('vazio');
    expect(rng.bytes(0)).toEqual(new Uint8Array(0));
  });

  it('10: nextDouble() retorna valor em [0, 1)', () => {
    const rng = new SeededRandom('double');
    for (let i = 0; i < 100; i++) {
      const v = rng.nextDouble();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
