/**
 * Compressor — interface estável de compressão de TEXTO para o Nexus.
 *
 * Contrato FIXADO pelo spike T-1018 (ver docs/adr/ADR-headroom.md):
 * - O SDK `headroom-ai` é um CLIENTE HTTP do proxy Headroom (Python). Não comprime
 *   localmente. `compress(messages, opts)` chama o proxy em `baseUrl`.
 * - `compress()` aceita um ARRAY de mensagens (formato OpenAI) e devolve
 *   `CompressResult { messages, tokensBefore, tokensAfter, compressed, ... }`.
 * - Reversibilidade (recuperar o original) NÃO fica aqui: o CCR do Headroom é
 *   server-side e inútil para uma IA externa sem rede. Quem precisa recuperar o
 *   original mantém os trechos originais por conta própria (ex.: export.service).
 *
 * Esta interface esconde tudo isso: recebe uma string e devolve a string comprimida
 * + estatísticas. Há sempre um fallback (passthrough) para o pipeline nunca quebrar.
 */
import { compress } from 'headroom-ai';

export interface CompressionStats {
  originalChars: number;
  compressedChars: number;
  /** compressedChars / originalChars (1 = sem compressão). */
  ratio: number;
  engine: 'headroom' | 'passthrough';
}

export interface CompressionResult {
  compressed: string;
  stats: CompressionStats;
}

export interface Compressor {
  compress(text: string): Promise<CompressionResult>;
}

function stats(original: string, compressed: string, engine: CompressionStats['engine']): CompressionStats {
  return {
    originalChars: original.length,
    compressedChars: compressed.length,
    ratio: original.length === 0 ? 1 : compressed.length / original.length,
    engine,
  };
}

/** Compressor no-op: devolve o texto inalterado. Offline, sempre disponível. */
export class PassthroughCompressor implements Compressor {
  async compress(text: string): Promise<CompressionResult> {
    return { compressed: text, stats: stats(text, text, 'passthrough') };
  }
}

export interface HeadroomCompressorOptions {
  /** URL do proxy Headroom. Default: env HEADROOM_URL ou http://127.0.0.1:8787. */
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

/**
 * Compressor via proxy Headroom. Se o proxy estiver indisponível, faz fallback
 * para passthrough (nunca lança), de modo que o pipeline degrade graciosamente.
 */
export class HeadroomCompressor implements Compressor {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(opts: HeadroomCompressorOptions = {}) {
    this.baseUrl = opts.baseUrl ?? process.env.HEADROOM_URL ?? 'http://127.0.0.1:8787';
    this.model = opts.model ?? 'gpt-4o';
    this.timeoutMs = opts.timeoutMs ?? 5000;
  }

  async compress(text: string): Promise<CompressionResult> {
    try {
      const result = await compress([{ role: 'user', content: text }], {
        baseUrl: this.baseUrl,
        model: this.model,
        timeout: this.timeoutMs,
        fallback: true,
        stack: 'nexus',
      });
      const content = result.messages?.[0]?.content;
      const compressed = typeof content === 'string' ? content : text;
      // result.compressed = false quando o proxy caiu e o SDK devolveu o original.
      const engine: CompressionStats['engine'] = result.compressed ? 'headroom' : 'passthrough';
      return { compressed, stats: stats(text, compressed, engine) };
    } catch {
      return { compressed: text, stats: stats(text, text, 'passthrough') };
    }
  }
}

/**
 * Fábrica: por padrão usa Headroom (com fallback embutido); force passthrough com
 * NEXUS_COMPRESSOR=passthrough. Aponte o proxy com HEADROOM_URL.
 */
export function getCompressor(): Compressor {
  if (process.env.NEXUS_COMPRESSOR === 'passthrough') return new PassthroughCompressor();
  return new HeadroomCompressor();
}
