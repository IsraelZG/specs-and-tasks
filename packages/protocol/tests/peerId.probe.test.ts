import { describe, it, expect } from 'vitest';
import { blake2s } from '@noble/hashes/blake2s';
import {
  derivePersonaPeerId,
  deriveDevicePeerId,
  parseMultiaddr,
  encodeMultiaddr
} from '../src/peerId.js';

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

describe('Sondas Adversariais - PeerId & Multiaddr', () => {
  it('Sonda 1: Validação exata da fórmula de PersonaPeerId (blake2s256("PROFILE:" + key))', () => {
    const key = new Uint8Array(32).fill(0xAA);
    const prefix = new TextEncoder().encode('PROFILE:');
    const combined = new Uint8Array(prefix.length + key.length);
    combined.set(prefix);
    combined.set(key, prefix.length);
    const expectedHash = bytesToHex(blake2s(combined, { dkLen: 32 }));
    
    const derived = derivePersonaPeerId(key);
    expect(derived).toBe(expectedHash);
  });

  it('Sonda 2: Casos de borda extremos de parseMultiaddr', () => {
    // Porta 0 (inválida)
    expect(parseMultiaddr('/dns4/host/tcp/0/wss')).toBeNull();
    // Porta 65536 (fora de range)
    expect(parseMultiaddr('/dns4/host/tcp/65536/wss')).toBeNull();
    // Espaços em branco
    expect(parseMultiaddr(' /dns4/host/tcp/80/wss ')).toBeNull();
    // Caractere de barra no host
    expect(parseMultiaddr('/dns4/host/sub/tcp/80/wss')).toBeNull();
    // Porta com zeros à esquerda
    const parsedZeroPad = parseMultiaddr('/dns4/host/tcp/0080/wss');
    expect(parsedZeroPad).toEqual({
      protocol: 'dns4',
      host: 'host',
      port: 80,
      transport: 'wss'
    });
  });

  it('Sonda 3: Fragmentos esquisitos e round-trip', () => {
    const complexAddr = {
      protocol: 'dns4' as const,
      host: 'relay',
      port: 443,
      transport: 'wss' as const,
      fragment: 'abc/123#def?g=1'
    };
    const encoded = encodeMultiaddr(complexAddr);
    expect(encoded).toBe('/dns4/relay/tcp/443/wss#abc/123#def?g=1');
    const parsed = parseMultiaddr(encoded);
    expect(parsed).toEqual(complexAddr);
  });
});
