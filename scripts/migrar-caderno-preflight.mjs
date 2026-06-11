#!/usr/bin/env node
/**
 * migrar-caderno-preflight.mjs — Pré-voo de migração de cadernos.
 * Identifica quais conceitos do _moc.md estão presentes no caderno.
 *
 * Uso:
 *   node scripts/migrar-caderno-preflight.mjs <caminho-do-caderno> [--json]
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { argv, exit } from "node:process";

const args = argv.slice(2);
const targetFile = args.find(a => !a.startsWith("-"));
const JSON_MODE = args.includes("--json");

if (!targetFile) {
  console.error("Uso: node scripts/migrar-caderno-preflight.mjs <caminho-do-caderno> [--json]");
  exit(1);
}

const ROOT = ".";
const MOC_FILE = join(ROOT, "docs", "conceitos", "_moc.md");
const CONCEITOS_DIR = join(ROOT, "docs", "conceitos");

if (!existsSync(targetFile)) {
  console.error(`Erro: Arquivo do caderno não encontrado em ${targetFile}`);
  exit(1);
}

if (!existsSync(MOC_FILE)) {
  console.error(`Erro: Arquivo _moc.md não encontrado em ${MOC_FILE}`);
  exit(1);
}

// ─── helpers ───────────────────────────────────────────────────────────────

const FRONTMATTER_RE  = /^---\n([\s\S]*?)\n---/;
const ALIASES_FM_RE   = /^aliases:\s*[\[\n]([\s\S]*?)(?:\]|\n[^\s])/m;

function readIdentity(text) {
  const fm = text.match(FRONTMATTER_RE)?.[1] ?? "";
  const title  = (fm.match(/^title:\s*(.+)$/m)?.[1] ?? "").trim().replace(/['"]/g, "");
  const aliasRaw = fm.match(ALIASES_FM_RE)?.[1] ?? "";
  const aliases = aliasRaw
    .split(/[\n,]+/)
    .map(a => a.replace(/^[-*\s]+/, "").replace(/['"[\]]/g, "").trim())
    .filter(Boolean);
  return { title, aliases };
}

// ─── processamento ─────────────────────────────────────────────────────────

const mocContent = readFileSync(MOC_FILE, "utf8");
const targetContent = readFileSync(targetFile, "utf8");

// Extrair slugs do _moc.md
const wlinkRe = /\[\[([^\]]+?)\]\]/g;
const potentialSlugs = new Set();
let match;
while ((match = wlinkRe.exec(mocContent)) !== null) {
  const raw = match[1].split("|")[0].split("#")[0].trim();
  if (raw && !raw.startsWith("_") && existsSync(join(CONCEITOS_DIR, `${raw}.md`))) {
    potentialSlugs.add(raw);
  }
}

const presentSlugs = [];

for (const slug of potentialSlugs) {
  // Ler aliases se o arquivo existir para refinar a busca
  let aliases = [];
  let title = "";
  const conceptPath = join(CONCEITOS_DIR, `${slug}.md`);
  if (existsSync(conceptPath)) {
    const conceptText = readFileSync(conceptPath, "utf8");
    const identity = readIdentity(conceptText);
    title = identity.title;
    aliases = identity.aliases;
  }

  // Padrão A: wikilink [[slug]] ou [[slug#âncora]] ou [[slug|alias]]
  const wikilinkPattern = new RegExp(`\\[\\[${slug}(?:#[^\\]|]+)?(?:\\|[^\\]]+)?\\]\\]`, "i");
  
  // Padrão B: Menção literal do slug ou aliases (com word boundary)
  const escapedAliases = [slug, title, ...aliases]
    .filter(Boolean)
    .map(a => a.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
  
  const wordPattern = new RegExp(`\\b(${escapedAliases.join("|")})\\b`, "i");

  if (wikilinkPattern.test(targetContent) || wordPattern.test(targetContent)) {
    presentSlugs.push(slug);
  }
}

// Ordenar alfabeticamente
presentSlugs.sort();

// ─── saída ─────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  console.log(JSON.stringify(presentSlugs));
  exit(0);
} else {
  console.log(`=== PRÉ-VOO DE MIGRAÇÃO PARA CADERNO: ${targetFile} ===`);
  console.log(`Conceitos do MOC presentes no caderno [${presentSlugs.length}]:`);
  if (presentSlugs.length === 0) {
    console.log("  (nenhum)");
  } else {
    console.log("  " + presentSlugs.map(s => `[[${s}]]`).join(", "));
  }
  exit(0);
}
