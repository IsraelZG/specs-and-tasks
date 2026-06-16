import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { extractWikilinks } from './wikilink.js';

export interface SelectInput {
  slugs?: string[];
  tags?: string[];
}

export interface SelectedDoc {
  slug: string;
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
}

export interface SelectOptions {
  rootDir?: string;
  depth?: number;
}

function slugFromFilePath(filePath: string): string {
  return path.basename(filePath, '.md');
}

async function walkDocsDir(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await walkDocsDir(full)));
      } else if (entry.name.endsWith('.md')) {
        results.push(full);
      }
    }
  } catch {
    // dir doesn't exist, return empty
  }
  return results;
}

async function readDoc(filePath: string, docsDir: string): Promise<SelectedDoc> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  return {
    slug: slugFromFilePath(filePath),
    path: path.relative(docsDir, filePath),
    content: content.trim(),
    frontmatter: frontmatter as Record<string, unknown>,
  };
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map((t) => String(t).toLowerCase());
  if (typeof tags === 'string') return tags.split(/[\s,]+/).map((t) => t.toLowerCase()).filter(Boolean);
  return [];
}

export async function selectScope(input: SelectInput, opts?: SelectOptions): Promise<SelectedDoc[]> {
  const rootDir = opts?.rootDir ?? process.env.NEXUS_ROOT_DIR ?? path.resolve(process.cwd());
  const depth = opts?.depth ?? 1;
  const docsDir = path.join(rootDir, 'docs');

  const allFiles = await walkDocsDir(docsDir);
  const allDocs = new Map<string, SelectedDoc>();
  for (const f of allFiles) {
    const doc = await readDoc(f, docsDir);
    allDocs.set(doc.slug, doc);
  }

  const seedSlugs = new Set(input.slugs ?? []);
  const seedTags = (input.tags ?? []).map((t) => t.toLowerCase());

  if (seedSlugs.size === 0 && seedTags.length === 0) return [];

  const selected = new Map<string, SelectedDoc>();

  const addDoc = (doc: SelectedDoc) => {
    if (!selected.has(doc.slug)) selected.set(doc.slug, doc);
  };

  const seed = new Set<string>();

  for (const doc of allDocs.values()) {
    if (seedSlugs.has(doc.slug)) {
      seed.add(doc.slug);
      addDoc(doc);
      continue;
    }
    const docTags = normalizeTags(doc.frontmatter.tags);
    if (seedTags.length > 0 && docTags.some((t) => seedTags.includes(t))) {
      seed.add(doc.slug);
      addDoc(doc);
    }
  }

  if (depth <= 0 || seed.size === 0) {
    return [...selected.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  }

  let frontier = new Set(seed);
  for (let level = 1; level <= depth; level++) {
    const nextFrontier = new Set<string>();
    for (const slug of frontier) {
      const doc = allDocs.get(slug);
      if (!doc) continue;
      const links = extractWikilinks(doc.content);
      for (const linkSlug of links) {
        const target = allDocs.get(linkSlug);
        if (target && !selected.has(linkSlug) && !seed.has(linkSlug)) {
          addDoc(target);
          nextFrontier.add(linkSlug);
        }
      }
    }
    if (nextFrontier.size === 0) break;
    frontier = nextFrontier;
  }

  return [...selected.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}
