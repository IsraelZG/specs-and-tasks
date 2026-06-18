import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Server } from 'http';
import { AddressInfo } from 'net';
import { buildExport } from '../services/export.service.js';
import { PassthroughCompressor } from '../services/compressor.js';
import { TaskService } from '../services/task.service.js';
import { TaskController } from '../services/task.controller.js';
import { createApp } from '../index.js';

vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(async () => async () => [{ generated_text: 'a, b, c' }]),
}));

function writeDoc(baseDir: string, name: string, frontmatter: Record<string, unknown>, body: string) {
  const fm = ['---'];
  for (const [k, v] of Object.entries(frontmatter)) {
    if (Array.isArray(v)) fm.push(`${k}: [${v.join(', ')}]`);
    else fm.push(`${k}: ${v}`);
  }
  fm.push('---');
  fs.writeFileSync(path.join(baseDir, `${name}.md`), fm.join('\n') + '\n\n' + body, 'utf8');
}

describe('buildExport', () => {
  let rootDir: string;
  let docsDir: string;

  beforeAll(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-export-'));
    docsDir = path.join(rootDir, 'docs');
    fs.mkdirSync(docsDir);

    writeDoc(docsDir, 'x', { tags: ['alpha'] }, 'Conteudo do doc X. [[y]]');
    writeDoc(docsDir, 'y', { tags: ['alpha', 'beta'] }, 'Conteudo do doc Y. [[z]]');
    writeDoc(docsDir, 'z', { tags: ['beta'] }, 'Conteudo do doc Z. fim.');
  });

  afterAll(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('com PassthroughCompressor, artifact = montagem (ratio 1)', async () => {
    const compressor = new PassthroughCompressor();
    const result = await buildExport({ slugs: ['x'] }, { rootDir, depth: 1, compressor });

    expect(result.stats.docs).toBe(2);
    expect(result.stats.engine).toBe('passthrough');
    expect(result.stats.ratio).toBe(1);
    expect(result.artifact).toContain('## [[x]]');
    expect(result.artifact).toContain('## [[y]]');
    expect(result.artifact).toContain('Conteudo do doc X');
    expect(result.artifact).toContain('Conteudo do doc Y');
    expect(result.stats.originalChars).toBe(result.stats.compressedChars);
  });

  it('sections carrega os originais', async () => {
    const compressor = new PassthroughCompressor();
    const result = await buildExport({ slugs: ['z'] }, { rootDir, depth: 0, compressor });

    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].slug).toBe('z');
    expect(result.sections[0].original).toBe('Conteudo do doc Z. fim.');
  });

  it('stats.docs correto', async () => {
    const compressor = new PassthroughCompressor();
    const result = await buildExport({ slugs: ['x'] }, { rootDir, depth: 2, compressor });

    expect(result.stats.docs).toBe(3);
    expect(result.sections).toHaveLength(3);
  });

  it('export vazio retorna stats zerados mas sem quebrar', async () => {
    const compressor = new PassthroughCompressor();
    const result = await buildExport({}, { rootDir, compressor });

    expect(result.stats.docs).toBe(0);
    expect(result.artifact).toBe('');
    expect(result.sections).toEqual([]);
  });
});

describe('POST /api/export', () => {
  let rootDir: string;
  let docsDir: string;
  let server: Server;
  let base: string;

  beforeAll(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-api-export-'));
    docsDir = path.join(rootDir, 'docs');
    fs.mkdirSync(docsDir);

    writeDoc(docsDir, 'alpha', { tags: ['tipoa'] }, 'Doc Alpha com [[beta]].');
    writeDoc(docsDir, 'beta', { tags: ['tipob'] }, 'Doc Beta.');

    const controller = new TaskController(new TaskService({ rootDir }));
    server = createApp(controller).listen(0);
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(() => {
    server.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('retorna 200 + shape ExportResult', async () => {
    const res = await fetch(`${base}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: ['alpha'], depth: 1 }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('artifact');
    expect(json).toHaveProperty('sections');
    expect(json).toHaveProperty('stats');
    expect(json.stats).toHaveProperty('docs');
    expect(json.stats).toHaveProperty('ratio');
    expect(json.stats).toHaveProperty('engine');
  });

  it('retorna 200 mesmo sem body (export vazio)', async () => {
    const res = await fetch(`${base}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.stats.docs).toBe(0);
  });
});
