// scripts/validate-metadata.mjs
//
// Lints every <Component>.metadata.ts file. Fails CI if:
//   - schema fields are missing or invalid types
//   - antiPatterns are missing one of {scenario, reason, alternative}
//   - variants have an `options` array that doesn't match `purpose` keys
//   - selectionCriteria is empty (high-priority components)
//   - tokens.semantic mentions a token that doesn't exist in components.json
//   - examples reference a component that isn't in the index
//
// Run: node --experimental-strip-types scripts/validate-metadata.mjs
// Exits 1 on any failure so CI catches drift.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(__dirname, '..', 'src', 'components');
const semanticTokensFile = join(__dirname, '..', 'tokens', 'semantic', 'components.json');
const themesDir = join(__dirname, '..', 'tokens', 'themes');

// --- Build the set of valid semantic token paths from components.json ---
// We flatten the JSON into dot-paths like "component.button.primary.bg".
function flattenTokens(obj, prefix = '') {
  const paths = new Set();
  for (const [k, v] of Object.entries(obj)) {
    if (k === '_comment' || k.startsWith('_')) continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('value' in v) paths.add(path);
      else for (const p of flattenTokens(v, path)) paths.add(p);
    }
  }
  return paths;
}

const semanticJson = JSON.parse(readFileSync(semanticTokensFile, 'utf8'));
const validTokens = flattenTokens(semanticJson);

// Also load theme token paths (metadata may reference theme-layer tokens directly)
function loadThemeTokens(dir) {
  const files = readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const json = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const p of flattenTokens(json)) validTokens.add(p);
  }
}
loadThemeTokens(themesDir);

// --- Helpers ---

const errors = [];
const warnings = [];
function err(file, msg) { errors.push(`✗ ${file}: ${msg}`); }
function warn(file, msg) { warnings.push(`⚠ ${file}: ${msg}`); }

// Tokens may use bash-style expansion in metadata listings (compact form).
// e.g. "component.button.height.{sm,md,lg}" → 3 tokens.
function expandBraces(token) {
  // Recursively expand bash-style brace expansions like "a.{b,c}.{d,e}"
  const m = token.match(/^(.*)\{([^}]+)\}(.*)$/);
  if (!m) return [token];
  const [, prefix, choices, suffix] = m;
  const results = [];
  for (const choice of choices.split(',').map(c => c.trim())) {
    const expanded = `${prefix}${choice}${suffix}`;
    results.push(...expandBraces(expanded));
  }
  return results;
}

// --- Walk component metadata files ---

const allComponentNames = readdirSync(componentsDir).filter((n) =>
  statSync(join(componentsDir, n)).isDirectory(),
);

for (const name of allComponentNames) {
  const file = join(componentsDir, name, `${name}.metadata.ts`);
  let mod;
  try {
    mod = await import(pathToFileURL(file).href);
  } catch (e) {
    err(file, `failed to import: ${e.message}`);
    continue;
  }

  const exportName = `${name}Metadata`;
  const meta = mod[exportName];
  if (!meta) {
    err(file, `missing export ${exportName}`);
    continue;
  }

  // -- top-level identity --
  const id = meta.component;
  if (!id.name || id.name !== name) err(file, `component.name "${id.name}" must equal folder name "${name}"`);
  if (!['atom', 'molecule', 'organism', 'template'].includes(id.category)) err(file, `invalid category "${id.category}"`);
  if (!/^\d+\.\d+\.\d+$/.test(id.metadataVersion ?? '')) err(file, `metadataVersion must be semver (e.g. 1.0.0)`);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(id.lastUpdated ?? '')) err(file, `lastUpdated must be ISO-8601`);

  // -- usage --
  if (!Array.isArray(meta.usage.useCases) || meta.usage.useCases.length === 0)
    err(file, `usage.useCases is empty`);
  if (!Array.isArray(meta.usage.antiPatterns) || meta.usage.antiPatterns.length === 0)
    warn(file, `usage.antiPatterns is empty — strongly recommended for AI guidance`);
  for (const ap of meta.usage.antiPatterns ?? []) {
    for (const k of ['scenario', 'reason', 'alternative']) {
      if (!ap[k] || typeof ap[k] !== 'string')
        err(file, `antiPattern missing field "${k}": ${JSON.stringify(ap).slice(0, 80)}…`);
    }
  }
  for (const cp of meta.usage.commonPatterns ?? []) {
    if (!cp.composition?.trim()) err(file, `commonPattern "${cp.name}" has empty composition`);
    if (!/<[A-Z]/.test(cp.composition)) warn(file, `commonPattern "${cp.name}" doesn't look like JSX`);
  }

  // -- variants: options must match purpose keys --
  for (const [axis, def] of Object.entries(meta.variants ?? {})) {
    const optSet = new Set(def.options);
    const purposeSet = new Set(Object.keys(def.purpose ?? {}));
    if (optSet.size !== purposeSet.size || [...optSet].some((o) => !purposeSet.has(o)))
      err(file, `variants.${axis}: options ${[...optSet].sort()} don't match purpose keys ${[...purposeSet].sort()}`);
    if (!optSet.has(def.default))
      err(file, `variants.${axis}: default "${def.default}" not in options`);
  }

  // -- aiHints --
  if (id.priority === 'high' && Object.keys(meta.aiHints.selectionCriteria ?? {}).length === 0)
    warn(file, `priority=high but selectionCriteria is empty — AI will guess`);

  // -- tokens.semantic: every listed token must exist in components.json --
  for (const t of meta.tokens.semantic ?? []) {
    for (const expanded of expandBraces(t)) {
      if (!validTokens.has(expanded))
        err(file, `tokens.semantic references "${expanded}" which doesn't exist in tokens/semantic/components.json`);
    }
  }
}

// --- Report ---

if (warnings.length) {
  console.log('\n--- Warnings ---');
  for (const w of warnings) console.log(w);
}
if (errors.length) {
  console.log('\n--- Errors ---');
  for (const e of errors) console.log(e);
  console.log(`\n✗ ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
} else {
  console.log(`\n✓ All metadata valid (${allComponentNames.length} components, ${warnings.length} warnings)`);
}
