import type { ClockPort, RandomPort } from '@plataforma/protocol';

/** Alfabeto Crockford Base32 — exclui I, L, O, U para evitar confusão visual. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Codificador/decodificador Base32 Crockford.
 *  Alfabeto: 0123456789ABCDEFGHJKMNPQRSTVWXYZ (32 chars, sem I L O U).
 *  Derivado de docs/conceitos/ulid.md §Definição. */
export const CrockfordBase32 = {
  /** Codifica bytes arbitrários para string Crockford Base32. */
  encode(bytes: Uint8Array): string {
    let bits = 0;
    let bitCount = 0;
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i] ?? 0;
      bits = (bits << 8) | byte;
      bitCount += 8;
      while (bitCount >= 5) {
        bitCount -= 5;
        const char = ALPHABET[(bits >>> bitCount) & 0x1f];
        if (char !== undefined) {
          result += char;
        }
      }
    }
    if (bitCount > 0) {
      const char = ALPHABET[(bits << (5 - bitCount)) & 0x1f];
      if (char !== undefined) {
        result += char;
      }
    }
    return result;
  },

  /** Decodifica string Crockford Base32 de volta para bytes. */
  decode(str: string): Uint8Array {
    const bits: number[] = [];
    for (const ch of str) {
      const idx = ALPHABET.indexOf(ch.toUpperCase());
      if (idx === -1) {
        throw new Error(`Invalid Crockford Base32 character: ${ch}`);
      }
      for (let i = 4; i >= 0; i--) {
        bits.push((idx >> i) & 1);
      }
    }
    const byteLen = Math.floor(bits.length / 8);
    const bytes = new Uint8Array(byteLen);
    for (let i = 0; i < byteLen; i++) {
      let byte = 0;
      for (let j = 0; j < 8; j++) {
        byte = (byte << 1) | (bits[i * 8 + j] ?? 0);
      }
      bytes[i] = byte;
    }
    return bytes;
  },
};

/** ULID como string Base32 Crockford (26 caracteres). Especificação: github.com/ulid/spec.
 *  Estrutura: [48 bits timestamp ms][80 bits random] → 26 chars Crockford Base32.
 *  Derivado de docs/conceitos/ulid.md §Contrato. */
export type ULID = string;

/** EntityId = ULID do nó-raiz da linhagem. Sempre igual ao id do primeiro nó da entidade.
 *  Derivado de docs/conceitos/entity-id.md §Definição e §Contrato. */
export type EntityId = ULID;

/** Conjunto de portas injetáveis para ULIDFactory.
 *  Derivado de plano §0.1 item 4 "Portas antes de adapters". */
export interface ULIDFactoryOptions {
  clock: ClockPort;
  random: RandomPort;
}

/** Fábrica de ULIDs determinística (via portas injetadas).
 *  NÃO usa Date.now() nem Math.random() — apenas ClockPort e RandomPort. */
export class ULIDFactory {
  private readonly clock: ClockPort;
  private readonly random: RandomPort;

  constructor(opts: ULIDFactoryOptions) {
    this.clock = opts.clock;
    this.random = opts.random;
  }

  /** Gera novo ULID. Timestamp de clock.now() (48 bits) + random.bytes(10) (80 bits).
   *  Resultado: string de 26 chars Crockford Base32 ordenável lexicograficamente por timestamp.
   *  O 11º caractere (index 10) reflete os bits iniciais do random (VFK — docs/conceitos/ulid.md §Contrato). */
  generate(): ULID {
    const timestamp = this.clock.now() & 0xffff_ffff_ffff; // 48 bits
    const randomBytes = this.random.bytes(10);

    // Monta 6 bytes timestamp (48 bits) big-endian
    const tsBytes = new Uint8Array(6);
    tsBytes[0] = (timestamp / 0x100_0000_0000) & 0xff;
    tsBytes[1] = (timestamp / 0x1_0000_0000) & 0xff;
    tsBytes[2] = (timestamp / 0x100_0000) & 0xff;
    tsBytes[3] = (timestamp / 0x1_0000) & 0xff;
    tsBytes[4] = (timestamp / 0x100) & 0xff;
    tsBytes[5] = timestamp & 0xff;

    // ULID spec: timestamp e random encodados separadamente → 10 + 16 = 26 chars
    return CrockfordBase32.encode(tsBytes) + CrockfordBase32.encode(randomBytes);
  }

  /** Decodifica ULID string → { timestamp: number (ms desde epoch), random: Uint8Array (10 bytes) }. */
  static decode(ulid: ULID): { timestamp: number; random: Uint8Array } {
    const tsBytes = CrockfordBase32.decode(ulid.slice(0, 10));
    const random = CrockfordBase32.decode(ulid.slice(10));
    if (tsBytes.length < 6) {
      throw new Error('Invalid timestamp bytes length');
    }
    const timestamp =
      (tsBytes[0] ?? 0) * 0x100_0000_0000 +
      (tsBytes[1] ?? 0) * 0x1_0000_0000 +
      (tsBytes[2] ?? 0) * 0x100_0000 +
      (tsBytes[3] ?? 0) * 0x1_0000 +
      (tsBytes[4] ?? 0) * 0x100 +
      (tsBytes[5] ?? 0);
    return { timestamp, random };
  }

  /** Valida se string é ULID sintaticamente válido (26 chars, alfabeto Crockford). */
  static isValid(candidate: string): candidate is ULID {
    if (candidate.length !== 26) return false;
    for (let i = 0; i < 26; i++) {
      const char = candidate[i];
      if (char === undefined || !ALPHABET.includes(char.toUpperCase())) return false;
    }
    return true;
  }
}
