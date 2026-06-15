import { describe, it, expect } from 'vitest';
import {
  HeadroomCompressor,
  PassthroughCompressor,
  getCompressor,
} from '../services/compressor.js';

describe('Compressor', () => {
  const text = 'Texto de exemplo, com bastante  espaço   e repetição repetição repetição.';

  it('PassthroughCompressor devolve o texto inalterado', async () => {
    const r = await new PassthroughCompressor().compress(text);
    expect(r.compressed).toBe(text);
    expect(r.stats.engine).toBe('passthrough');
    expect(r.stats.ratio).toBe(1);
    expect(r.stats.originalChars).toBe(text.length);
  });

  it('HeadroomCompressor faz fallback p/ passthrough quando o proxy está fora', async () => {
    // Porta fechada → conexão recusada → degrada sem lançar.
    const c = new HeadroomCompressor({ baseUrl: 'http://127.0.0.1:9', timeoutMs: 1000 });
    const r = await c.compress(text);
    expect(r.compressed).toBe(text);
    expect(r.stats.engine).toBe('passthrough');
  });

  it('getCompressor respeita NEXUS_COMPRESSOR=passthrough', async () => {
    const prev = process.env.NEXUS_COMPRESSOR;
    process.env.NEXUS_COMPRESSOR = 'passthrough';
    try {
      expect(getCompressor()).toBeInstanceOf(PassthroughCompressor);
    } finally {
      if (prev === undefined) delete process.env.NEXUS_COMPRESSOR;
      else process.env.NEXUS_COMPRESSOR = prev;
    }
  });

  it('compress de string vazia não quebra (ratio 1)', async () => {
    const r = await new PassthroughCompressor().compress('');
    expect(r.stats.ratio).toBe(1);
    expect(r.compressed).toBe('');
  });
});
