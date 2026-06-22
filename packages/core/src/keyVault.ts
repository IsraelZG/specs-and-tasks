import type { ClockPort } from '@plataforma/protocol';

/** Entrada interna do vault — nunca serializada. */
interface VaultEntry {
  key: Uint8Array;
  expiresAt: number;
}

/** Resultado de requestKey / requestEpochKey. */
export type KeyResult =
  | { ok: true; key: Uint8Array }
  | { ok: false; reason: 'not_found' | 'expired' | 'denied' };

/** Payload de prova de delegação — stub para M1. */
export interface DelegationProof {
  ucan: string;
  delegatedTo: string;
}

/** Key Vault in-memory. Custódia temporária de chaves de época com TTL. */
export class KeyVault {
  static readonly DEFAULT_TTL_MS = 4 * 60 * 60 * 1000; // 14_400_000 = 4 horas

  private clock: ClockPort;
  private entries: Map<string, VaultEntry> = new Map();

  constructor(clock: ClockPort) {
    this.clock = clock;
  }

  /** Armazena uma chave de época para um escopo. */
  store(scope: string, key: Uint8Array, ttlMs?: number): void {
    this.entries.set(scope, {
      key: new Uint8Array(key), // cópia defensiva
      expiresAt: this.clock.now() + (ttlMs ?? KeyVault.DEFAULT_TTL_MS),
    });
  }

  /** API LOCAL — consumo do Sync Worker. */
  requestKey(scope: string): KeyResult {
    const entry = this.entries.get(scope);
    if (!entry) return { ok: false, reason: 'not_found' };
    if (this.clock.now() >= entry.expiresAt) return { ok: false, reason: 'expired' };
    return { ok: true, key: entry.key };
  }

  /** API DE REDE — servida a peers remotos. Stub M1. */
  requestEpochKey(scope: string, proof: DelegationProof): KeyResult {
    if (!proof.ucan || !proof.delegatedTo) {
      return { ok: false, reason: 'denied' };
    }
    return this.requestKey(scope);
  }

  /** Remove entradas expiradas. Retorna quantidade removida. */
  purgeExpired(): number {
    const now = this.clock.now();
    let removed = 0;
    for (const [scope, entry] of this.entries) {
      if (now >= entry.expiresAt) {
        this.entries.delete(scope);
        removed++;
      }
    }
    return removed;
  }

  /** Retorna o número de entradas ativas. */
  size(): number {
    return this.entries.size;
  }
}
