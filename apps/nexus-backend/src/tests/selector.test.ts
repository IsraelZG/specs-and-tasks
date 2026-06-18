import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { selectScope, SelectInput } from '../services/selector.js';

function writeDoc(baseDir: string, name: string, frontmatter: Record<string, unknown>, body: string) {
  const fm = ['---'];
  for (const [k, v] of Object.entries(frontmatter)) {
    if (Array.isArray(v)) fm.push(`${k}: [${v.join(', ')}]`);
    else fm.push(`${k}: ${v}`);
  }
  fm.push('---');
  fs.writeFileSync(path.join(baseDir, `${name}.md`), fm.join('\n') + '\n\n' + body, 'utf8');
}

describe('selectScope', () => {
  let rootDir: string;
  let docsDir: string;

  beforeAll(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-selector-'));
    docsDir = path.join(rootDir, 'docs');
    fs.mkdirSync(docsDir);

    writeDoc(docsDir, 'a', { tags: ['core'] }, 'Doc A links to [[b]].');
    writeDoc(docsDir, 'b', { tags: ['core', 'aux'] }, 'Doc B links to [[c]].');
    writeDoc(docsDir, 'c', { tags: ['aux'] }, 'Doc C links to [[d]] e [[a]].');
    writeDoc(docsDir, 'd', { tags: ['peripheral'] }, 'Doc D no links.');
    writeDoc(docsDir, 'e', { tags: ['peripheral'] }, 'Doc E links to [[d]].');
  });

  afterAll(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('semente por slug expande por wikilink até depth=1', async () => {
    const result = await selectScope({ slugs: ['a'] }, { rootDir, depth: 1 });
    const slugs = result.map((d) => d.slug);
    expect(slugs).toContain('a');
    expect(slugs).toContain('b');
    expect(slugs).not.toContain('c');
  });

  it('semente por slug expande depth=2', async () => {
    const result = await selectScope({ slugs: ['a'] }, { rootDir, depth: 2 });
    const slugs = result.map((d) => d.slug);
    expect(slugs).toContain('a');
    expect(slugs).toContain('b');
    expect(slugs).toContain('c');
    expect(slugs).not.toContain('d');
  });

  it('semente por tag', async () => {
    const result = await selectScope({ tags: ['peripheral'] }, { rootDir, depth: 0 });
    const slugs = result.map((d) => d.slug);
    expect(slugs).toEqual(['d', 'e']);
  });

  it('depth=0 retorna só sementes', async () => {
    const result = await selectScope({ slugs: ['a'], tags: ['core'] }, { rootDir, depth: 0 });
    const slugs = result.map((d) => d.slug);
    expect(slugs).toContain('a');
    expect(slugs).toContain('b');
    expect(slugs.length).toBe(2);
  });

  it('dedup por slug', async () => {
    const result = await selectScope({ slugs: ['a', 'a'] }, { rootDir, depth: 1 });
    const slugs = result.map((d) => d.slug);
    expect(slugs.filter((s) => s === 'a').length).toBe(1);
  });

  it('ordem alfabética por slug', async () => {
    const result = await selectScope({ tags: ['core'] }, { rootDir, depth: 0 });
    const slugs = result.map((d) => d.slug);
    expect(slugs).toEqual(['a', 'b']);
  });

  it('sem slugs nem tags retorna vazio', async () => {
    const result = await selectScope({}, { rootDir });
    expect(result).toEqual([]);
  });

  it('retorna frontmatter e content', async () => {
    const result = await selectScope({ slugs: ['a'] }, { rootDir, depth: 0 });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('a');
    expect(result[0].content).toBe('Doc A links to [[b]].');
    expect(result[0].frontmatter).toHaveProperty('tags');
    expect(result[0].path).toBe('a.md');
  });

  it('default rootDir usa NEXUS_ROOT_DIR ou cwd', async () => {
    const prev = process.env.NEXUS_ROOT_DIR;
    process.env.NEXUS_ROOT_DIR = rootDir;
    try {
      const result = await selectScope({ slugs: ['a'] }, { depth: 0 });
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('a');
    } finally {
      if (prev === undefined) delete process.env.NEXUS_ROOT_DIR;
      else process.env.NEXUS_ROOT_DIR = prev;
    }
  });
});
