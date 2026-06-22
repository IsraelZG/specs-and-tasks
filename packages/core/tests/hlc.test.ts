import { describe, it, expect } from 'vitest';
import { VirtualClock } from '@plataforma/testkit';
import { HybridLogicalClock, MAX_DRIFT_MS, type HLCTimestamp } from '../src/hlc';

function freshClock(initialMs = 0): { vc: VirtualClock; hlc: HybridLogicalClock } {
  const vc = new VirtualClock(initialMs);
  return { vc, hlc: new HybridLogicalClock(vc) };
}

describe('HybridLogicalClock', () => {
  it('1: tick() com clock fixo: primeiro tick pt=clock, c=0; segundo tick c=1', () => {
    const { hlc } = freshClock(1000);
    const t1 = hlc.tick();
    const p1 = HybridLogicalClock.unpack(t1);
    expect(p1.pt).toBe(1000);
    expect(p1.c).toBe(0);

    const t2 = hlc.tick();
    const p2 = HybridLogicalClock.unpack(t2);
    expect(p2.pt).toBe(1000);
    expect(p2.c).toBe(1);
  });

  it('2: tick() após clock.advance(100): pt avança, c zera', () => {
    const { vc, hlc } = freshClock(1000);
    hlc.tick(); // c=0
    hlc.tick(); // c=1

    vc.advance(100); // clock.now() = 1100
    const t = hlc.tick();
    const p = HybridLogicalClock.unpack(t);
    expect(p.pt).toBe(1100);
    expect(p.c).toBe(0);
  });

  it('3: receive(remoto) com remoto < local: HLC local não regride (monotônico)', () => {
    const { hlc } = freshClock(1000);
    hlc.tick(); // (1000, 0)
    hlc.tick(); // (1000, 1)
    hlc.tick(); // (1000, 2)

    const before = hlc.now();
    hlc.receive(HybridLogicalClock.pack(1000, 0));
    // Monotônico: receber evento passado não regride, mas avança c
    expect(HybridLogicalClock.compare(hlc.now(), before)).toBeGreaterThanOrEqual(0);
  });

  it('4: receive(remoto) com remoto > local: pt avança, c = remote_c + 1', () => {
    const { hlc } = freshClock(1000);
    hlc.tick(); // (1000, 0)

    const remote = HybridLogicalClock.pack(2000, 5);
    const result = hlc.receive(remote);
    const p = HybridLogicalClock.unpack(result);
    expect(p.pt).toBe(2000);
    expect(p.c).toBe(6); // remote_c + 1
  });

  it('5: receive(remoto) com pt além de MAX_DRIFT_MS: rejeitado', () => {
    const { hlc, vc } = freshClock(1000);
    const farFuture = vc.now() + MAX_DRIFT_MS + 1;
    const remote = HybridLogicalClock.pack(farFuture, 0);

    expect(() => hlc.receive(remote)).toThrow();
  });

  it('6: HLC.compare ordenação correta', () => {
    const a = HybridLogicalClock.pack(1000, 5);
    const b = HybridLogicalClock.pack(2000, 0);
    const c = HybridLogicalClock.pack(1000, 10);
    const d = HybridLogicalClock.pack(1000, 5);

    expect(HybridLogicalClock.compare(a, b)).toBeLessThan(0);  // pt menor
    expect(HybridLogicalClock.compare(b, a)).toBeGreaterThan(0); // pt maior
    expect(HybridLogicalClock.compare(a, c)).toBeLessThan(0);   // pt igual, c menor
    expect(HybridLogicalClock.compare(c, a)).toBeGreaterThan(0); // pt igual, c maior
    expect(HybridLogicalClock.compare(a, d)).toBe(0);            // iguais
  });

  it('7: pack + unpack roundtrip', () => {
    const packed = HybridLogicalClock.pack(1234567, 42);
    const unpacked = HybridLogicalClock.unpack(packed);
    expect(unpacked.pt).toBe(1234567);
    expect(unpacked.c).toBe(42);
  });

  it('8: 1000 tick() com clock avançando: pt monotônico, c cicla', () => {
    const { vc, hlc } = freshClock(0);
    let lastPt = -1;

    for (let i = 0; i < 1000; i++) {
      if (i % 100 === 0) vc.advance(1);
      const t = hlc.tick();
      const p = HybridLogicalClock.unpack(t);
      expect(p.pt).toBeGreaterThanOrEqual(lastPt);
      if (p.pt === lastPt) expect(p.c).toBeGreaterThan(0);
      lastPt = p.pt;
    }
  });

  it('9: 2 peers: peerA.tick() → peerB.receive(peerA.now()): peerA < peerB', () => {
    const { hlc: peerA } = freshClock(1000);
    const { hlc: peerB } = freshClock(1000);

    const aNow = peerA.tick();
    const bAfter = peerB.receive(aNow);

    expect(HybridLogicalClock.compare(aNow, bAfter)).toBeLessThan(0);
  });

  it('10: tick() overflow de c → avança pt em 1ms e reseta c', () => {
    const { hlc } = freshClock(1000);

    // tick 65537 vezes: 1º tick zera c (pt muda de 0→1000), 65536 ticks incrementam c até 65535, próximo overflow
    for (let i = 0; i < 65537; i++) hlc.tick();

    const p = HybridLogicalClock.unpack(hlc.now());
    // Após overflow, pt deve ter avançado 1ms e c resetado
    expect(p.pt).toBeGreaterThanOrEqual(1001);
    expect(p.c).toBeLessThan(65536);
  });
});
