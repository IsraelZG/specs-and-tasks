import { describe, it, expect } from 'vitest';
import { getRandomValues } from 'node:crypto';
import {
  encodeFrame,
  decodeFrame,
  tryReadFrame,
  FrameType,
  WIRE_VERSION,
  MAX_FRAME_LENGTH,
} from '../src/wireFormat.js';

describe('Wire format v1', () => {
  it('1: encodeFrame + decodeFrame roundtrip preserva frameType e payload', () => {
    const payload = { key: 'val', n: 42, list: [1, 2, 3] };
    const buf = encodeFrame(FrameType.RBSR_ROOT, payload);
    const res = decodeFrame(buf);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.frame.version).toBe(WIRE_VERSION);
      expect(res.frame.frameType).toBe(FrameType.RBSR_ROOT);
      expect(res.frame.payload).toEqual(payload);
    }
  });

  it('2: frame vazio → bad_length', () => {
    const res = decodeFrame(new Uint8Array(0));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('bad_length');
  });

  it('3: LENGTH > MAX_FRAME_LENGTH → too_large', () => {
    // Monta um frame: LENGTH=MAX+1 (5 bytes) + VERSION + TYPE + payload
    const lenBytes = new Uint8Array(4);
    const dv = new DataView(lenBytes.buffer);
    dv.setUint32(0, MAX_FRAME_LENGTH + 1, false);
    const buf = new Uint8Array(4 + 1 + 1);
    buf.set(lenBytes, 0);
    buf[4] = WIRE_VERSION;
    buf[5] = FrameType.RBSR_NODES;
    const res = decodeFrame(buf);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('too_large');
  });

  it('4: versão 0x00 → unknown_version', () => {
    const payload = encodeFrame(FrameType.RBSR_NODES, { a: 1 });
    // byte VERSION está em offset 4
    const buf = new Uint8Array(payload);
    buf[4] = 0x00;
    const res = decodeFrame(buf);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('unknown_version');
  });

  it('5: versão 0xFF + RBSR_NODES (auditável) → unknown_version + retentionState=3', () => {
    const payload = encodeFrame(FrameType.RBSR_NODES, { a: 1 });
    const buf = new Uint8Array(payload);
    buf[4] = 0xff;
    const res = decodeFrame(buf);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe('unknown_version');
      expect(res.retentionState).toBe(3);
      expect(res.raw).toBeInstanceOf(Uint8Array);
    }
  });

  it('6: versão 0xFF + HEARTBEAT_PING (volátil) → unknown_version sem retentionState', () => {
    const payload = encodeFrame(FrameType.HEARTBEAT_PING, { ts: 1 });
    const buf = new Uint8Array(payload);
    buf[4] = 0xff;
    const res = decodeFrame(buf);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe('unknown_version');
      expect(res.retentionState).toBeUndefined();
      expect(res.raw).toBeUndefined();
    }
  });

  it('7: payload MessagePack inválido → parse_error', () => {
    // Constrói um frame válido pelo header mas com payload truncado
    const lenBytes = new Uint8Array(4);
    const dv = new DataView(lenBytes.buffer);
    dv.setUint32(0, 2, false); // LENGTH = 2 (1 byte VERSION + 1 byte FRAME_TYPE)
    const buf = new Uint8Array(4 + 2);
    buf.set(lenBytes, 0);
    buf[4] = WIRE_VERSION;
    buf[5] = FrameType.RBSR_NODES;
    // sem payload — o codec.decode falhará
    const res = decodeFrame(buf);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('parse_error');
  });

  it('8: tryReadFrame com buffer parcial → null; completa → frame', () => {
    const full = encodeFrame(FrameType.RBSR_NODES, { a: 1, b: [1, 2, 3] });
    const partial = full.subarray(0, 3);
    const nullResult = tryReadFrame(partial);
    expect(nullResult).toBeNull();

    const ok = tryReadFrame(full);
    expect(ok).not.toBeNull();
    expect(ok?.frame.ok).toBe(true);
    expect(ok?.consumed).toBe(full.length);
  });

  it('9: tryReadFrame com 2 frames concatenados — primeiro decode + consumed correto', () => {
    const f1 = encodeFrame(FrameType.RBSR_ROOT, { id: 1 });
    const f2 = encodeFrame(FrameType.HEARTBEAT_PING, { ts: 2 });
    const concat = new Uint8Array(f1.length + f2.length);
    concat.set(f1, 0);
    concat.set(f2, f1.length);
    const r = tryReadFrame(concat);
    expect(r).not.toBeNull();
    expect(r!.consumed).toBe(f1.length);
    expect(r!.frame.ok).toBe(true);
    if (r!.frame.ok) {
      expect(r!.frame.frame.frameType).toBe(FrameType.RBSR_ROOT);
      expect(r!.frame.frame.payload).toEqual({ id: 1 });
    }
    // segundo frame
    const r2 = tryReadFrame(concat.subarray(f1.length));
    expect(r2).not.toBeNull();
    expect(r2!.frame.ok).toBe(true);
    if (r2!.frame.ok) {
      expect(r2!.frame.frame.frameType).toBe(FrameType.HEARTBEAT_PING);
    }
  });

  it('10: fuzz — 1000 frames aleatórios nunca lançam', () => {
    const random = new Uint8Array(4096);
    getRandomValues(random);
    for (let i = 0; i < 1000; i++) {
      const len = 1 + Math.floor(Math.random() * 64);
      const buf = new Uint8Array(len);
      for (let j = 0; j < len; j++) buf[j] = random[(i + j) % random.length] ?? 0;
      expect(() => decodeFrame(buf)).not.toThrow();
      const r = decodeFrame(buf);
      if (r.ok) {
        expect(typeof r.frame.version).toBe('number');
      } else {
        expect(['too_large', 'bad_length', 'unknown_version', 'parse_error']).toContain(r.reason);
      }
    }
  });

  it('11: tryReadFrame com frame too_large + frame válido seguinte — não consome o próximo', () => {
    // Frame 1: LENGTH = MAX+1 (rejeitado) → consume 4 bytes
    // Frame 2: válido → deve decodificar normalmente
    const tooLargeLen = new Uint8Array(4);
    const dv = new DataView(tooLargeLen.buffer);
    dv.setUint32(0, MAX_FRAME_LENGTH + 1, false);
    const frame2 = encodeFrame(FrameType.RBSR_NODES, { ok: 1 });
    const buf = new Uint8Array(4 + frame2.length);
    buf.set(tooLargeLen, 0);
    buf.set(frame2, 4);

    const r1 = tryReadFrame(buf);
    expect(r1).not.toBeNull();
    expect(r1!.frame.ok).toBe(false);
    if (!r1!.frame.ok) expect(r1!.frame.reason).toBe('too_large');
    expect(r1!.consumed).toBe(4);

    // O frame seguinte está em buf.subarray(4) — deve decodificar
    const r2 = tryReadFrame(buf.subarray(r1!.consumed));
    expect(r2).not.toBeNull();
    expect(r2!.frame.ok).toBe(true);
    if (r2!.frame.ok) expect(r2!.frame.frame.frameType).toBe(FrameType.RBSR_NODES);
  });
});
