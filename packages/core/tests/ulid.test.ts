import { describe, expect, it } from 'vitest';
import { CrockfordBase32, ULIDFactory } from '../src/ulid.js';
import { SeededRandom, VirtualClock } from '@plataforma/testkit';

describe('ULIDFactory', () => {
  // Caso 1: timestamp 0 → 10 primeiros chars são '0000000000'
  // Derivado: ulid.md §Contrato "48 bits timestamp ms"; timestamp=0 → 48 bits zeros
  //           → primeiros 10 chars Crockford = '0000000000'
  it('1. timestamp=0 → ULID começa com "0000000000"', () => {
    const factory = new ULIDFactory({ clock: new VirtualClock(0), random: new SeededRandom('a') });
    expect(factory.generate().slice(0, 10)).toBe('0000000000');
  });

  // Caso 2: dois ULIDs com mesmo clock → lexicograficamente crescentes (random diferente)
  // Derivado: ulid.md §Contrato "Ordenação"; plano §4 T-102 "ordenação ≡ ordem temporal"
  it('2. dois ULIDs em sequência com mesmo clock → lexicograficamente crescentes', () => {
    const factory = new ULIDFactory({ clock: new VirtualClock(1000), random: new SeededRandom('b') });
    const a = factory.generate();
    const b = factory.generate();
    expect(a < b).toBe(true);
  });

  // Caso 3: roundtrip decode
  // Derivado: ulid.md §Contrato "48 bits timestamp ms"
  it('3. decode(generate()) → timestamp e random corretos (roundtrip)', () => {
    const clock = new VirtualClock(1234567890);
    const factory = new ULIDFactory({ clock, random: new SeededRandom('c') });
    const ulid = factory.generate();
    const { timestamp, random } = ULIDFactory.decode(ulid);
    expect(timestamp).toBe(1234567890);
    expect(random).toBeInstanceOf(Uint8Array);
    expect(random.length).toBe(10);
  });

  // Caso 4: isValid com ULID válido
  // Derivado: ulid.md §Definição "26 caracteres, case-insensitive"
  it('4. isValid("01ARZ3NDEKTSV4RRFFQ69G5FAV") → true', () => {
    expect(ULIDFactory.isValid('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe(true);
  });

  // Caso 5: isValid com string curta
  it('5. isValid("invalid") → false (tamanho errado)', () => {
    expect(ULIDFactory.isValid('invalid')).toBe(false);
  });

  // Caso 6: isValid com caractere fora do alfabeto Crockford ('U' não pertence)
  // Derivado: ulid.md §Definição "Crockford Base32 (sem I L O U)"
  it('6. isValid("01ARZ3NDEKTSV4RRFFQ69G5FAU") → false (char "U" não é Crockford)', () => {
    expect(ULIDFactory.isValid('01ARZ3NDEKTSV4RRFFQ69G5FAU')).toBe(false);
  });

  // Caso 7: CrockfordBase32 encode/decode roundtrip
  // Derivado: ulid.md §Definição "Crockford Base32"
  it('7. CrockfordBase32 encode + decode roundtrip com 16 bytes', () => {
    const bytes = new Uint8Array(16).fill(0xab);
    const encoded = CrockfordBase32.encode(bytes);
    const decoded = CrockfordBase32.decode(encoded);
    expect(decoded).toEqual(bytes);
  });

  // Caso 8: seeds diferentes → ULIDs diferentes
  // Derivado: plano §2.1 "SeededRandom: cenários 100% reproduzíveis por seed"
  it('8. seeds diferentes → ULIDs diferentes', () => {
    const f1 = new ULIDFactory({ clock: new VirtualClock(0), random: new SeededRandom('seed-A') });
    const f2 = new ULIDFactory({ clock: new VirtualClock(0), random: new SeededRandom('seed-B') });
    expect(f1.generate()).not.toBe(f2.generate());
  });

  // Caso 9: mesma seed e clock fixo → ULIDs idênticos (determinismo)
  // Derivado: plano §2.1 "SeededRandom: cenários 100% reproduzíveis por seed"
  it('9. mesma seed e clock fixo → ULIDs idênticos (determinismo)', () => {
    const make = () =>
      new ULIDFactory({ clock: new VirtualClock(0), random: new SeededRandom('det-seed') });
    expect(make().generate()).toBe(make().generate());
  });

  // Caso 10: EntityId é assignable de ULID (type-level)
  // Derivado: entity-id.md §Contrato "entity_id = id do nó-raiz"; T-102 §1
  it('10. EntityId é assignable de ULID (type-level compile check)', () => {
    // Se este arquivo compilar sem erro de tipo, o caso passa
    const ulid: import('../src/ulid.js').ULID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
    const entityId: import('../src/ulid.js').EntityId = ulid;
    expect(typeof entityId).toBe('string');
  });

  // Caso 11: 11º caractere (index 10) reflete random, não timestamp (VFK)
  // Derivado: ulid.md §Contrato "11º caractere... discriminador de tabela VFK"
  //           plano §4 T-102 "convenção do 11º caractere (N/não-N) da VFK"
  // Nota: este caso documenta o contrato VFK; a factory NÃO força o 11º char — é responsabilidade
  //        do gerador de nó/aresta (T-106) garantir o discriminador correto.
  it('11. ULID gerado tem exatamente 26 chars; o 11º (index 10) é char Crockford válido', () => {
    const factory = new ULIDFactory({ clock: new VirtualClock(1000), random: new SeededRandom('vfk') });
    const ulid = factory.generate();
    expect(ulid.length).toBe(26);
    const crockfordAlphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    expect(crockfordAlphabet.includes(ulid[10]!)).toBe(true);
  });
});
