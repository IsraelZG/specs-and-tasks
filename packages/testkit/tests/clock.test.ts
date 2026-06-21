import { describe, it, expect } from 'vitest';
import { VirtualClock } from '../src/clock';

describe('VirtualClock', () => {
  it('1: new VirtualClock(1000).now() retorna 1000', () => {
    const clock = new VirtualClock(1000);
    expect(clock.now()).toBe(1000);
  });

  it('2: clock.advance(50) → clock.now() retorna 1050', () => {
    const clock = new VirtualClock(1000);
    clock.advance(50);
    expect(clock.now()).toBe(1050);
  });

  it('3: clock.advance(0) é no-op', () => {
    const clock = new VirtualClock(500);
    clock.advance(0);
    expect(clock.now()).toBe(500);
  });

  it('4: setTimeout(cb, 100) + advance(50) → callback NÃO chamado ainda', () => {
    const clock = new VirtualClock(0);
    const called: number[] = [];
    clock.setTimeout(() => { called.push(1); }, 100);
    clock.advance(50);
    expect(called).toEqual([]);
  });

  it('5: setTimeout(cb, 100) + advance(100) → callback chamado exatamente 1×', () => {
    const clock = new VirtualClock(0);
    let count = 0;
    clock.setTimeout(() => { count++; }, 100);
    clock.advance(100);
    expect(count).toBe(1);
  });

  it('6: clearTimeout cancela callback pendente', () => {
    const clock = new VirtualClock(0);
    let count = 0;
    const id = clock.setTimeout(() => { count++; }, 100);
    clock.clearTimeout(id);
    clock.advance(100);
    expect(count).toBe(0);
  });
});
