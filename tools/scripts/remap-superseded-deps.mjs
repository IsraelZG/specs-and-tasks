#!/usr/bin/env node
/**
 * remap-superseded-deps.mjs
 *
 * Idempotent script that remaps `dependencies` entries pointing to superseded
 * split-task IDs (e.g. T-301a) to their parent task (superseded_by, e.g. T-301).
 *
 * - Reads all tasks from `tasks/` directory (relative to repo root).
 * - Builds a map: splitId → superseded_by from files prefixed with `_`.
 * - For each active task (no `_` prefix), rewrites the `dependencies: [...]` line:
 *   • Replaces every split-ID found in the map with its superseded_by value.
 *   • Removes resulting duplicates while preserving order.
 *   • Preserves the line format (same quoting style, inline comments).
 * - Only writes the file if the dependencies line actually changed.
 * - Prints a report: T-xxx: [before] -> [after].
 * - Running a second time produces zero changes (idempotent).
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const TASKS_DIR = join(process.cwd(), "tasks");

// 1. Read all filenames in tasks/
const files = readdirSync(TASKS_DIR).filter((f) => f.endsWith(".md"));

// 2. Build splitId → superseded_by map from _*.md files
const supersededMap = {};
for (const file of files) {
  if (!basename(file).startsWith("_")) continue;
  const raw = readFileSync(join(TASKS_DIR, file), "utf-8").replace(/\r\n/g, "\n");
  const m = raw.match(/^superseded_by:\s*(\S+)/m);
  if (m) {
    supersededMap[m[1].trim()] = m[1].trim();
    // The key should be the id (filename without _ prefix and .md)
    const id = basename(file).replace(/^_/, "").replace(/\.md$/, "");
    supersededMap[id] = m[1].trim();
  }
}

if (Object.keys(supersededMap).length === 0) {
  console.log("Nenhum split supersedido encontrado.");
  process.exit(0);
}

console.log(`Mapa de splits supersedidos (${Object.keys(supersededMap).length} entradas):`);
for (const [k, v] of Object.entries(supersededMap).sort()) {
  console.log(`  ${k} → ${v}`);
}
console.log();

// 3. Process active tasks
const changes = [];
let altered = 0;

for (const file of files) {
  if (basename(file).startsWith("_")) continue;
  if (file === "INDEX.md") continue;

  const filePath = join(TASKS_DIR, file);
  const raw = readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");

  let modified = false;
  const newLines = lines.map((line) => {
    // Match lines like: dependencies: ["T-301a", "T-204"]
    // or:              dependencies: [] # some comment
    const match = line.match(/^(\s*dependencies:\s*\[)(.*?)(\]\s*(?:#.*)?)$/);
    if (!match) return line;

    const prefix = match[1];      // "dependencies: ["
    const arrayContent = match[2]; // content inside brackets
    const suffix = match[3];      // "] # comment" or "]"

    // Parse the array entries
    const entries = arrayContent
      ? arrayContent
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean)
      : [];

    const beforeEntries = [...entries];

    // Remap each entry
    const remapped = entries.map((id) => supersededMap[id] || id);

    // Deduplicate preserving order
    const seen = new Set();
    const deduped = remapped.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Check if anything changed
    if (JSON.stringify(beforeEntries) !== JSON.stringify(deduped)) {
      modified = true;
      const formatted = deduped.map((id) => `"${id}"`).join(", ");
      return `${prefix}${formatted}${suffix}`;
    }

    return line;
  });

  if (modified) {
    const id = basename(file).replace(/\.md$/, "");
    // Extract before/after for report
    const beforeLine = lines.find((l) =>
      l.match(/^\s*dependencies:\s*\[/)
    );
    const afterLine = newLines.find((l) =>
      l.match(/^\s*dependencies:\s*\[/)
    );
    const beforeArr = beforeLine
      ? beforeLine.match(/^\s*dependencies:\s*\[(.*?)\]/)?.[1] || ""
      : "";
    const afterArr = afterLine
      ? afterLine.match(/^\s*dependencies:\s*\[(.*?)\]/)?.[1] || ""
      : "";

    changes.push({
      id,
      before: `[${beforeArr}]`,
      after: `[${afterArr}]`,
    });

    writeFileSync(filePath, newLines.join("\n"), "utf-8");
    altered++;
  }
}

// 4. Report
console.log(`Relatório — ${altered} tasks alteradas:`);
for (const c of changes) {
  console.log(`  ${c.id}: ${c.before} -> ${c.after}`);
}
if (altered === 0) {
  console.log("  (nenhuma alteração necessária — script é idempotente ✓)");
}
