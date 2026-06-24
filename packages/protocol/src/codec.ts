import { Packr } from 'msgpackr';

/** Erro lançado quando bytes não são MessagePack válido. */
export class CodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodecError';
  }
}

const packr = new Packr({
  useRecords: false,         // desliga ext tag proprietária → interop não-JS
  int64AsType: 'bigint',     // int64 → bigint (preserva precisão do HLC int64)
  bundleStrings: true,       // strings como bin quando aplicável
});

/**
 * Codifica `value` em MessagePack com as opções canônicas do projeto:
 * - `useRecords: false` (interop com peers não-JS)
 * - int64 → `bigint` (timestamps HLC)
 * - `Uint8Array` preservado como binário
 *
 * Determinístico: a MESMA entrada produz os mesmos bytes.
 */
export function encode(value: unknown): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const packed: Uint8Array = packr.pack(value);
  return packed;
}

/**
 * Decodifica bytes MessagePack. Lança `CodecError` em bytes inválidos.
 */
export function decode(bytes: Uint8Array): unknown {
  try {
    return packr.unpack(bytes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new CodecError(`Invalid MessagePack bytes: ${message}`);
  }
}
