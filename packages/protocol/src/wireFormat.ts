import { encode as codecEncode, decode as codecDecode, CodecError } from './codec.js';

/** Versão corrente do protocolo. Derivado de caderno-2-protocol/05 §1. */
export const WIRE_VERSION = 0x01;

/** Tipos de frame — caderno-2-protocol/05 §1. */
export enum FrameType {
  RBSR_ROOT          = 0x01,
  RBSR_RANGE         = 0x02,
  RBSR_REQUEST_NODES = 0x03,
  RBSR_NODES         = 0x04,
  EPHEMERAL          = 0x05,
  HEARTBEAT_PING     = 0x06,
  HEARTBEAT_PONG     = 0x07,
  IDENTITY_CATCHUP   = 0x08,
  KEY_REQUEST        = 0x09,
  KEY_RESPONSE       = 0x0A,
  CONTROL            = 0x0B,
}

/** Teto de tamanho de frame (1 MiB). */
export const MAX_FRAME_LENGTH = 1_048_576;

/** Tipos de frame que são "voláteis" — descartáveis em versão futura (caderno §3). */
const VOLATILE_FRAME_TYPES: ReadonlySet<number> = new Set<number>([
  FrameType.EPHEMERAL,
  FrameType.HEARTBEAT_PING,
  FrameType.HEARTBEAT_PONG,
  FrameType.CONTROL,
]);

/** Frame decodificado. */
export interface WireFrame {
  version: number;
  frameType: FrameType;
  payload: unknown;
}

/** Resultado de decode: frame válido ou rejeição/quarentena. */
export type DecodeResult =
  | { ok: true; frame: WireFrame }
  | {
      ok: false;
      reason: 'too_large' | 'bad_length' | 'unknown_version' | 'parse_error';
      retentionState?: number;
      raw?: Uint8Array;
    };

/** Tamanho do header: LENGTH(uint32 BE) + VERSION(uint8) + FRAME_TYPE(uint8) = 6 bytes. */
const HEADER_LENGTH = 6;
const LENGTH_BYTES = 4;
const VERSION_OFFSET = 4;
const FRAME_TYPE_OFFSET = 5;
const PAYLOAD_OFFSET = 6;

/**
 * Codifica um frame no formato:
 *   [LENGTH: uint32 BE] [VERSION: uint8] [FRAME_TYPE: uint8] [PAYLOAD: MessagePack]
 *
 * LENGTH exclui o próprio campo (cobre VERSION + FRAME_TYPE + PAYLOAD).
 */
export function encodeFrame(frameType: FrameType, payload: unknown): Uint8Array {
  const payloadBytes = codecEncode(payload);
  const contentLength = 2 + payloadBytes.length; // VERSION + FRAME_TYPE + payload
  if (contentLength > MAX_FRAME_LENGTH) {
    throw new Error(
      `Frame content length ${String(contentLength)} exceeds MAX_FRAME_LENGTH ${String(MAX_FRAME_LENGTH)}`,
    );
  }

  const out = new Uint8Array(LENGTH_BYTES + contentLength);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, contentLength, false); // BE
  out[VERSION_OFFSET] = WIRE_VERSION;
  out[FRAME_TYPE_OFFSET] = frameType;
  out.set(payloadBytes, PAYLOAD_OFFSET);
  return out;
}

/**
 * Decodifica um frame binário. Nunca lança — versão futura vai para quarentena
 * (retentionState=3 para auditáveis) ou é descartado (voláteis).
 */
export function decodeFrame(buffer: Uint8Array): DecodeResult {
  // Mínimo: 4 bytes (LENGTH) + 1 (VERSION) + 1 (TYPE) = 6 bytes
  if (buffer.length < HEADER_LENGTH) {
    return { ok: false, reason: 'bad_length' };
  }

  const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const length = dv.getUint32(0, false);

  // Teto
  if (length > MAX_FRAME_LENGTH) {
    return { ok: false, reason: 'too_large' };
  }

  // LENGTH cobre (VERSION + FRAME_TYPE + payload). Precisamos de mais 4 bytes de LENGTH
  // além do header? Não — LENGTH é o tamanho do CONTEÚDO após o próprio LENGTH.
  // O conteúdo total esperado é: LENGTH(4) + length bytes
  if (buffer.length < LENGTH_BYTES + length) {
    return { ok: false, reason: 'bad_length' };
  }

  const version = buffer[VERSION_OFFSET] ?? 0;
  const frameType = buffer[FRAME_TYPE_OFFSET] ?? 0;

  // Quarentena por versão
  if (version < WIRE_VERSION) {
    // 0x00 é explicitamente inválido (caderno §1) — quarentena direta.
    // Outras versões anteriores: tentar schema regressivo; falha → quarentena.
    if (version === 0x00) {
      return {
        ok: false,
        reason: 'unknown_version',
      };
    }
    return tryDecodeWithRetention(buffer, version, frameType, length);
  }

  if (version > WIRE_VERSION) {
    // volátil → descarta; auditável → quarentena
    if (VOLATILE_FRAME_TYPES.has(frameType)) {
      return { ok: false, reason: 'unknown_version' };
    }
    return {
      ok: false,
      reason: 'unknown_version',
      retentionState: 3,
      raw: buffer.slice(0, LENGTH_BYTES + length),
    };
  }

  // Versão atual
  const payloadBytes = buffer.subarray(PAYLOAD_OFFSET, LENGTH_BYTES + length);
  let payload: unknown;
  try {
    payload = codecDecode(payloadBytes);
  } catch (err) {
    if (err instanceof CodecError) {
      return { ok: false, reason: 'parse_error' };
    }
    throw err;
  }

  return {
    ok: true,
    frame: { version, frameType, payload },
  };
}

/** Tenta decodificar versão < WIRE_VERSION e devolve quarentena se falhar. */
function tryDecodeWithRetention(
  buffer: Uint8Array,
  version: number,
  frameType: number,
  length: number,
): DecodeResult {
  const payloadBytes = buffer.subarray(PAYLOAD_OFFSET, LENGTH_BYTES + length);
  try {
    const payload = codecDecode(payloadBytes);
    // schema regressivo "funcionou"
    return { ok: true, frame: { version, frameType, payload } };
  } catch {
    if (VOLATILE_FRAME_TYPES.has(frameType)) {
      return { ok: false, reason: 'unknown_version' };
    }
    return {
      ok: false,
      reason: 'unknown_version',
      retentionState: 3,
      raw: buffer.slice(0, LENGTH_BYTES + length),
    };
  }
}

/**
 * Lê frame de buffer incremental.
 * Retorna null se o buffer não tem bytes suficientes (LENGTH incompleto ou payload faltando).
 *
 * Em `too_large`: consome apenas os 4 bytes do LENGTH (não sabemos o tamanho real
 * do payload para descartá-lo com segurança — o caller pode decidir se descarta
 * ou fecha a conexão). O frame seguinte não é afetado: o caller deve continuar
 * chamando `tryReadFrame` com o restante.
 */
export function tryReadFrame(
  buffer: Uint8Array,
): { frame: DecodeResult; consumed: number } | null {
  if (buffer.length < LENGTH_BYTES) return null;
  const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const length = dv.getUint32(0, false);
  if (length > MAX_FRAME_LENGTH) {
    return {
      frame: { ok: false, reason: 'too_large' },
      consumed: LENGTH_BYTES,
    };
  }
  if (buffer.length < LENGTH_BYTES + length) {
    return null;
  }
  // Cópia defensiva: garante que a subarray tenha byteOffset 0 para que decodeFrame
  // construa DataView corretamente.
  const slice = new Uint8Array(buffer.subarray(0, LENGTH_BYTES + length));
  return {
    frame: decodeFrame(slice),
    consumed: LENGTH_BYTES + length,
  };
}
