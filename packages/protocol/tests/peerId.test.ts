import { describe, it, expect } from 'vitest';
import { blake2s } from '@noble/hashes/blake2s';
import {
  deriveDevicePeerId,
  derivePersonaPeerId,
  encodeMultiaddr,
  parseMultiaddr,
} from '../src/peerId.js';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

describe('PeerId', () => {
  const key1 = new Uint8Array(32).fill(0x01);
  const key2 = new Uint8Array(32).fill(0x02);

  it('1. derivação determinística DevicePeerId', () => {
    const a = deriveDevicePeerId(key1);
    const b = deriveDevicePeerId(key1);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('2. derivação determinística PersonaPeerId', () => {
    const a = derivePersonaPeerId(key1);
    const b = derivePersonaPeerId(key1);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('3. DevicePeerId ≠ PersonaPeerId (mesma chave)', () => {
    const device = deriveDevicePeerId(key1);
    const persona = derivePersonaPeerId(key1);
    expect(device).not.toBe(persona);
  });

  it('4. vetor blake2s conhecido', () => {
    const input = new Uint8Array(32).fill(0x01);
    const expected = bytesToHex(blake2s(input, { dkLen: 32 }));
    expect(deriveDevicePeerId(input)).toBe(expected);
  });

  it('5a. DevicePeerId chaves diferentes produzem hashes diferentes', () => {
    const id1 = deriveDevicePeerId(key1);
    const id2 = deriveDevicePeerId(key2);
    expect(id1).not.toBe(id2);
  });
});

describe('Multiaddr', () => {
  it('6. encode + parse round-trip dns4', () => {
    const addr = { protocol: 'dns4' as const, host: 'relay.example.com', port: 443, transport: 'wss' as const };
    expect(parseMultiaddr(encodeMultiaddr(addr))).toEqual(addr);
  });

  it('7. encode + parse round-trip ip4', () => {
    const addr = { protocol: 'ip4' as const, host: '192.168.1.1', port: 8080, transport: 'wss' as const };
    expect(parseMultiaddr(encodeMultiaddr(addr))).toEqual(addr);
  });

  it('8. fragment', () => {
    const result = parseMultiaddr('/dns4/relay.example.com/tcp/443/wss#abc123');
    expect(result?.fragment).toBe('abc123');
  });

  it('9. formato inválido (ws não suportado)', () => {
    expect(parseMultiaddr('/dns4/host/tcp/443/ws')).toBeNull();
  });

  it('10. string vazia / garbage', () => {
    expect(parseMultiaddr('')).toBeNull();
    expect(parseMultiaddr('garbage')).toBeNull();
  });

  it('11. porta fora de range', () => {
    expect(parseMultiaddr('/ip4/1.2.3.4/tcp/99999/wss')).toBeNull();
  });

  it('12. round-trip com fragment', () => {
    const addr = { protocol: 'ip4' as const, host: '10.0.0.1', port: 9000, transport: 'wss' as const, fragment: 'sessao1' };
    expect(parseMultiaddr(encodeMultiaddr(addr))).toEqual(addr);
  });
});
