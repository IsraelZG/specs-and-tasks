const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

export function parseWikilink(raw: string): { slug: string; anchor?: string } {
  const noAlias = raw.split('|')[0].trim();
  const [slug, anchor] = noAlias.split('#');
  return { slug: slug.trim(), anchor: anchor?.trim() || undefined };
}

export function extractWikilinks(content: string): string[] {
  const slugs = new Set<string>();
  for (const m of content.matchAll(WIKILINK_RE)) {
    const { slug } = parseWikilink(m[1]);
    slugs.add(slug);
  }
  return [...slugs];
}
