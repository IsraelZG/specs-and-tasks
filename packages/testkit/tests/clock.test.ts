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

  it('ordenacao: timers disparam em ordem cronológica (fireAt)', () => {
    const clock = new VirtualClock(0);
    const order: number[] = [];
    clock.setTimeout(() => { order.push(2); }, 200);
    clock.setTimeout(() => { order.push(1); }, 100);
    clock.advance(200);
    expect(order).toEqual([1, 2]);
  });

  it('nested: timer agenda outro timer dentro do mesmo advance', () => {
    const clock = new VirtualClock(0);
    const order: number[] = [];
    clock.setTimeout(() => {
      order.push(1);
      clock.setTimeout(() => { order.push(2); }, 50);
    }, 50);
    clock.advance(150);
    expect(order).toEqual([1, 2]);
  });

  it('nested: now() dentro do callback retorna fireAt exato', () => {
    const clock = new VirtualClock(0);
    let capturedNow = 0;
    clock.setTimeout(() => { capturedNow = clock.now(); }, 75);
    clock.advance(100);
    expect(capturedNow).toBe(75);
  });

  it('sonda B2: nested timer com fireAt anterior a outro timer pendente', () => {
    const clock = new VirtualClock(0);
    const order: number[] = [];
    // Timer A: 200ms
    clock.setTimeout(() => { order.push('A'); }, 200);
    // Timer B: 100ms → agenda Timer C com 80ms (fireAt=180, anterior a A)
    clock.setTimeout(() => {
      order.push('B');
      clock.setTimeout(() => { order.push('C'); }, 80);
    }, 100);
    clock.advance(200);
    expect(order).toEqual(['B', 'C', 'A']);
  });

  it('sonda B3: clearTimeout de dentro de callback cancela timer futuro', () => {
    const clock = new VirtualClock(0);
    const fired: string[] = [];
    let futureId: number;
    // Timer em 50ms → cancela o timer de 100ms
    clock.setTimeout(() => {
      fired.push('early');
      clock.clearTimeout(futureId);
    }, 50);
    // Timer em 100ms → não deve disparar
    futureId = clock.setTimeout(() => { fired.push('late'); }, 100);
    clock.advance(100);
    expect(fired).toEqual(['early']);
  });
});
