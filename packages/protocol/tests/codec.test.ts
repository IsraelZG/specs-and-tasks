import { describe, it, expect } from 'vitest';
import { encode, decode, CodecError } from '../src/codec.js';

describe('Codec (MessagePack)', () => {
  it('1: roundtrip de primitivos', () => {
    const cases: unknown[] = [
      null,
      true,
      false,
      0,
      1,
      -1,
      3.14,
      'hello',
      '',
      [],
      [1, 2, 3],
      { a: 1, b: 'x', c: true, d: null },
      { a: { b: { c: [1, 2, 3] } } },
    ];
    for (const v of cases) {
      const buf = encode(v);
      const back = decode(buf);
      expect(back).toEqual(v);
    }
  });

  it('2: bigint roundtrip preserva precisão (int64 HLC)', () => {
    const hlcTimestamp = (BigInt(1700000000000) << 16n) | BigInt(12345);
    expect(hlcTimestamp > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);

    const v1 = 123n;
    const v2 = { createdAt: 9007199254740993n, counter: 1n };
    const v3 = [1n, 2n, 9007199254740993n];

    expect(decode(encode(v1))).toBe(v1);
    expect(decode(encode(v2))).toEqual(v2);
    expect(decode(encode(v3))).toEqual(v3);
    // bigint não deve virar number
    const back = decode(encode(hlcTimestamp)) as bigint;
    expect(typeof back).toBe('bigint');
    expect(back).toBe(hlcTimestamp);
  });

  it('3: Uint8Array preservado como binário (não array de números)', () => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < 64; i++) sig[i] = i;
    const buf = encode(sig);
    const back = decode(buf) as Uint8Array;
    // O decode pode retornar Buffer (subclasse de Uint8Array) no Node — mas deve
    // ter os mesmos bytes e o mesmo length.
    expect(back).toBeInstanceOf(Uint8Array);
    expect(back.length).toBe(64);
    expect(back.length).toBe(sig.length);
    for (let i = 0; i < 64; i++) {
      expect(back[i]).toBe(sig[i]);
    }
  });

  it('4: determinismo — encode(x) chamado 100× produz mesmo Uint8Array', () => {
    const v = { a: 1, b: 'x', c: [1, 2, 3] };
    const first = encode(v);
    for (let i = 0; i < 100; i++) {
      const b = encode(v);
      expect(b).toEqual(first);
    }
  });

  it('5: determinismo para entrada idêntica (mesma construção → mesmo buffer)', () => {
    const a = { a: 1, b: 2, c: 3 };
    const b = { a: 1, b: 2, c: 3 };
    expect(encode(a)).toEqual(encode(b));
  });

  it('6: useRecords desligado — primeiro byte é map header MessagePack padrão', () => {
    const v = { foo: 1, bar: 2 };
    const buf = encode(v);
    const firstByte = buf[0]!;
    // MessagePack map headers: fixmap 0x80-0x8f, map16 0xde, map32 0xdf
    // NUNCA deve ser ext/ext8/ext16/ext32 (0xc7-0xc9) que records do msgpackr usam
    const isMap = (firstByte >= 0x80 && firstByte <= 0x8f) || firstByte === 0xde || firstByte === 0xdf;
    const isExt = (firstByte >= 0xc7 && firstByte <= 0xc9) || firstByte === 0xd4 || firstByte === 0xd5 ||
                  firstByte === 0xd6 || firstByte === 0xd7 || firstByte === 0xd8;
    expect(isMap).toBe(true);
    expect(isExt).toBe(false);
  });

  it('7: decode de bytes inválidos lança CodecError', () => {
    // Map16 (0xde) com tamanho 0x0010 (16 elementos) mas sem conteúdo — truncado.
    // msgpackr lança "Offset is outside the bounds of the DataView" — CodecError captura.
    expect(() => decode(new Uint8Array([0xde, 0x00, 0x10]))).toThrow(CodecError);
    // Array16 (0xdc) com length 0x0001 mas sem elementos — truncado.
    expect(() => decode(new Uint8Array([0xdc, 0x00, 0x01]))).toThrow(CodecError);
  });
});
