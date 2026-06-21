// scripts/build-component-index.mjs
//
// Walks src/components/*/*.metadata.ts, imports each, and emits a single
// components.index.json with only the "header" fields agents need to
// discover candidates (~100 tokens per component). Agents load the full
// metadata file lazily once they know which component to read.
//
// Run: node scripts/build-component-index.mjs

import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { register } from 'node:module';

// Allow importing .ts on the fly without a build step.
// Requires Node 22+ with --experimental-strip-types (default since 22.6).
const __dirname = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(__dirname, '..', 'src', 'components');
const outFile = join(__dirname, '..', 'src', 'metadata', 'components.index.json');

const entries = [];

for (const name of readdirSync(componentsDir)) {
  const dir = join(componentsDir, name);
  if (!statSync(dir).isDirectory()) continue;

  const file = join(dir, `${name}.metadata.ts`);
  let mod;
  try {
    mod = await import(pathToFileURL(file).href);
  } catch (err) {
    console.error(`✗ Failed to import ${file}:`, err.message);
    continue;
  }

  const exportName = `${name}Metadata`;
  const meta = mod[exportName];
  if (!meta) {
    console.warn(`⚠ ${file} did not export ${exportName} — skipping.`);
    continue;
  }

  // Header = only what an agent needs to DECIDE if the component is relevant.
  entries.push({
    name:            meta.component.name,
    category:        meta.component.category,
    type:            meta.component.type,
    description:     meta.component.description,
    path:            meta.component.path,
    metadataPath:    file.replace(join(__dirname, '..') + '/', ''),
    priority:        meta.aiHints.priority,
    keywords:        meta.aiHints.keywords,
    useCases:        meta.usage.useCases,
    variants:        meta.variants ? Object.keys(meta.variants) : [],
    requiredProps:   meta.usage.requiredProps,
    parentConstraints: meta.composition?.parentConstraints ?? [],
    forbiddenParents:  meta.composition?.forbiddenParents ?? [],
    lastUpdated:     meta.component.lastUpdated,
    metadataVersion: meta.component.metadataVersion,
  });
}

// Sort: priority high first, then alphabetical. Agents read top-down.
const priorityRank = { high: 0, medium: 1, low: 2 };
entries.sort((a, b) =>
  priorityRank[a.priority] - priorityRank[b.priority] ||
  a.name.localeCompare(b.name)
);

const index = {
  $schema: 'https://your-app.dev/schemas/components.index.v1.json',
  generatedAt: new Date().toISOString(),
  count: entries.length,
  components: entries,
};

writeFileSync(outFile, JSON.stringify(index, null, 2) + '\n');
console.log(`✓ Wrote ${entries.length} components → ${outFile}`);
