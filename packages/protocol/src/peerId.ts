import { blake2s } from '@noble/hashes/blake2s';

/** Hex lowercase, 64 chars (32 bytes blake2s256). */
export type PeerId = string;

/** DevicePeerId = blake2s256(DEVICE_PUB_KEY). */
export function deriveDevicePeerId(devicePublicKey: Uint8Array): PeerId {
  const hash = blake2s(devicePublicKey, { dkLen: 32 });
  return bytesToHex(hash);
}

/** PersonaPeerId = blake2s256(PROFILE:PERSONA_PUB_KEY). */
export function derivePersonaPeerId(personaPublicKey: Uint8Array): PeerId {
  const prefix = new Uint8Array([0x50, 0x52, 0x4F, 0x46, 0x49, 0x4C, 0x45, 0x3A]); // "PROFILE:"
  const combined = new Uint8Array(prefix.length + personaPublicKey.length);
  combined.set(prefix);
  combined.set(personaPublicKey, prefix.length);
  const hash = blake2s(combined, { dkLen: 32 });
  return bytesToHex(hash);
}

function bytesToHex(bytes: Uint8Array): string {
  const hex: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      hex.push(byte.toString(16).padStart(2, '0'));
    }
  }
  return hex.join('');
}

export interface ParsedMultiaddr {
  protocol: 'dns4' | 'ip4';
  host: string;
  port: number;
  transport: 'wss';
  fragment?: string;
}

const MULTIADDR_RE = /^\/(dns4|ip4)\/([^/]+)\/tcp\/(\d+)\/wss(?:#(.+))?$/;

/** Codifica ParsedMultiaddr em string canônica. */
export function encodeMultiaddr(addr: ParsedMultiaddr): string {
  const base = `/${addr.protocol}/${addr.host}/tcp/${String(addr.port)}/wss`;
  return addr.fragment ? `${base}#${addr.fragment}` : base;
}

/** Faz parse de string Multiaddr. Retorna null se formato não suportado (não lança). */
export function parseMultiaddr(raw: string): ParsedMultiaddr | null {
  const m = MULTIADDR_RE.exec(raw);
  if (!m) return null;
  const port = Number(m[3]);
  if (port < 1 || port > 65535) return null;
  const host = m[2];
  if (!host) return null;
  const result: ParsedMultiaddr = {
    protocol: m[1] as 'dns4' | 'ip4',
    host,
    port,
    transport: 'wss',
  };
  if (m[4]) result.fragment = m[4];
  return result;
}
