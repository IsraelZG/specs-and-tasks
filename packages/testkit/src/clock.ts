import type { ClockPort } from '@plataforma/protocol';

interface Timer {
  id: number;
  callback: () => void;
  fireAt: number;
}

let nextTimerId = 1;

/** Relógio virtual determinístico. Tempo inicial configurável; avança via advance(). */
export class VirtualClock implements ClockPort {
  private _now: number;
  private timers: Timer[] = [];

  constructor(initialTime = 0) {
    this._now = initialTime;
  }

  now(): number {
    return this._now;
  }

  /** Avança o relógio em `ms` milissegundos. */
  advance(ms: number): void {
    if (ms <= 0) return;
    const target = this._now + ms;

    // Dispara timers cujo fireAt está entre now e target
    const ready = this.timers.filter(t => t.fireAt > this._now && t.fireAt <= target);
    this._now = target;
    for (const t of ready) {
      t.callback();
    }
    // Remove timers já disparados
    this.timers = this.timers.filter(t => t.fireAt > this._now);
  }

  /** Agenda callback para daqui a `ms` milissegundos (tempo virtual). Retorna timerId. */
  setTimeout(callback: () => void, ms: number): number {
    const id = nextTimerId++;
    this.timers.push({ id, callback, fireAt: this._now + ms });
    return id;
  }

  /** Cancela timer agendado. */
  clearTimeout(timerId: number): void {
    this.timers = this.timers.filter(t => t.id !== timerId);
  }
}
