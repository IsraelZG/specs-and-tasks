import type { ClockPort } from '@plataforma/protocol';

/** HLC empacotado como inteiro 48+16 bits: (pt << 16) | c. */
export type HLCTimestamp = bigint;

/** Componentes desempacotados do HLC. */
export interface HLCParts {
  pt: number; // wall-clock em ms (48 bits efetivos)
  c:  number; // contador lógico (16 bits, 0–65535)
}

/** Limite de drift: se pt_remoto > wall_clock_local + MAX_DRIFT_MS, rejeita. */
export const MAX_DRIFT_MS = 300_000; // 5 minutos

/** Relógio Lógico Híbrido. Estado mutável: mantém (pt, c) corrente. */
export class HybridLogicalClock {
  private pt: number;
  private c: number;
  private clock: ClockPort;

  constructor(clock: ClockPort) {
    this.clock = clock;
    this.pt = 0;
    this.c = 0;
  }

  /** Retorna HLC corrente (sem avançar). */
  now(): HLCTimestamp {
    return HybridLogicalClock.pack(this.pt, this.c);
  }

  /** Evento local: avança pt para max(clock.now(), pt) e incrementa c (ou zera se pt avançou). */
  tick(): HLCTimestamp {
    const wall = this.clock.now();
    const prevPt = this.pt;
    this.pt = Math.max(wall, this.pt);

    if (this.pt !== prevPt) {
      this.c = 0;
    } else {
      this.c++;
      // Overflow de 16 bits: avança pt em 1ms e reseta c
      if (this.c > 65535) {
        this.pt++;
        this.c = 0;
      }
    }

    return this.now();
  }

  /** Evento de recebimento: incorpora HLC remoto. Aplica regras de monotonicidade e drift. */
  receive(remote: HLCTimestamp): HLCTimestamp {
    const { pt: remotePt, c: remoteC } = HybridLogicalClock.unpack(remote);
    const wall = this.clock.now();

    // Drift check
    if (remotePt > wall + MAX_DRIFT_MS) {
      throw new Error(
        `HLC drift: remote pt ${remotePt} exceeds wall clock ${wall} + ${MAX_DRIFT_MS}ms`
      );
    }

    const prevPt = this.pt;
    const prevC = this.c;

    this.pt = Math.max(wall, this.pt, remotePt);

    if (prevPt === this.pt && this.pt === remotePt) {
      this.c = Math.max(prevC, remoteC) + 1;
    } else if (this.pt === remotePt) {
      this.c = remoteC + 1;
    } else {
      this.c = 0;
    }

    // Overflow de 16 bits: avança pt em 1ms e reseta c
    if (this.c > 65535) {
      this.pt++;
      this.c = 0;
    }

    return this.now();
  }

  /** Desempacota HLC em (pt, c). */
  static unpack(hlc: HLCTimestamp): HLCParts {
    const n = Number(hlc);
    return {
      pt: Math.floor(n / 65536),
      c: n & 0xFFFF,
    };
  }

  /** Empacota (pt, c) em HLCTimestamp. */
  static pack(pt: number, c: number): HLCTimestamp {
    return BigInt(pt) << 16n | BigInt(c);
  }

  /** Compara dois HLCs. Retorna <0, 0, >0. */
  static compare(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
}
