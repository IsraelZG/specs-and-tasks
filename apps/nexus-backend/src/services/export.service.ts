import type { Compressor } from './compressor.js';
import { getCompressor } from './compressor.js';
import { selectScope } from './selector.js';
import type { SelectInput, SelectOptions } from './selector.js';

export interface ExportSection {
  slug: string;
  original: string;
}

export interface ExportResult {
  artifact: string;
  sections: ExportSection[];
  stats: {
    docs: number;
    originalChars: number;
    compressedChars: number;
    ratio: number;
    engine: string;
  };
}

export interface ExportOptions extends SelectOptions {
  compressor?: Compressor;
}

export async function buildExport(input: SelectInput, opts?: ExportOptions): Promise<ExportResult> {
  const compressor = opts?.compressor ?? getCompressor();
  const docs = await selectScope(input, opts);

  const sections: ExportSection[] = docs.map((d) => ({
    slug: d.slug,
    original: d.content,
  }));

  let assembled = '';
  for (const doc of docs) {
    assembled += `\n\n## [[${doc.slug}]]\n${doc.content}`;
  }
  assembled = assembled.trimStart();

  const originalChars = assembled.length;
  const { compressed, stats: compStats } = await compressor.compress(assembled);

  return {
    artifact: compressed,
    sections,
    stats: {
      docs: docs.length,
      originalChars,
      compressedChars: compressed.length,
      ratio: compStats.ratio,
      engine: compStats.engine,
    },
  };
}
