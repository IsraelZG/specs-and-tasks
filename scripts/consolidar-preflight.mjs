#!/usr/bin/env node
/**
 * consolidar-preflight.mjs — Pré-voo de consolidação de arquivos.
 * Identifica KEEPERS (Caso A) e slugs de conceitos presentes no arquivo.
 *
 * Uso:
 *   node scripts/consolidar-preflight.mjs <caminho-do-arquivo> [--json]
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { argv, exit } from "node:process";

const args = argv.slice(2);
const targetFile = args.find(a => !a.startsWith("-"));
const JSON_MODE = args.includes("--json");

if (!targetFile) {
  console.error("Uso: node scripts/consolidar-preflight.mjs <caminho-do-arquivo> [--json]");
  exit(1);
}

const ROOT = ".";
const CONCEITOS = join(ROOT, "docs", "conceitos");

if (!existsSync(targetFile)) {
  console.error(`Erro: Arquivo alvo não encontrado em ${targetFile}`);
  exit(1);
}

// ─── helpers ───────────────────────────────────────────────────────────────

const FRONTMATTER_RE  = /^---\n([\s\S]*?)\n---/;
const ALIASES_FM_RE   = /^aliases:\s*[\[\n]([\s\S]*?)(?:\]|\n[^\s])/m;
const MODO_FM_RE      = /^modo:\s*(\S+)/im;

function collectMd(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMd(full));
    } else if (entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

const toSlug = (p) => basename(p, ".md");

function readModo(text) {
  const fm = text.match(FRONTMATTER_RE)?.[1] ?? "";
  const match = text.match(MODO_FM_RE) || fm.match(MODO_FM_RE);
  return match?.[1]?.toLowerCase() ?? "indefinido";
}

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

const targetContent = readFileSync(targetFile, "utf8");
const targetPathNorm = targetFile.replace(/\\/g, "/");
const targetBase = basename(targetPathNorm);
const targetNameNoExt = basename(targetPathNorm, ".md");

// Identificar se o arquivo é um caderno (ex: caderno-2-protocol/02-cryptographic...)
// Queremos extrair partes do caminho para bater referências como "caderno-2/02" ou "caderno-2-protocol/02"
let targetShortRefs = [targetBase, targetNameNoExt];
const pathParts = targetPathNorm.split("/");
const cadernoIndex = pathParts.findIndex(p => p.startsWith("caderno-"));
if (cadernoIndex !== -1 && pathParts[cadernoIndex + 1]) {
  const cadernoName = pathParts[cadernoIndex]; // e.g. "caderno-2-protocol"
  const filePart = pathParts[cadernoIndex + 1]; // e.g. "02-cryptographic-lineage-and-auth.md"
  const fileNumMatch = filePart.match(/^(\d+)/);
  if (fileNumMatch) {
    const fileNum = fileNumMatch[1];
    // Ex: "caderno-2-protocol/02"
    targetShortRefs.push(`${cadernoName}/${fileNum}`);
    // Ex: "caderno-2/02"
    const simplifiedCaderno = cadernoName.replace(/-[a-z]+$/, ""); // e.g. "caderno-2"
    targetShortRefs.push(`${simplifiedCaderno}/${fileNum}`);
    targetShortRefs.push(`${simplifiedCaderno}/${filePart}`);
  }
}

const keepers = [];
const presentSlugs = [];

const conceptFiles = collectMd(CONCEITOS);

for (const filePath of conceptFiles) {
  const slug = toSlug(filePath);
  const text = readFileSync(filePath, "utf8");
  const modo = readModo(text);
  const { title, aliases } = readIdentity(text);

  // 1. Verificar se é KEEPER (modo hub + aponta para este arquivo)
  if (modo === "hub") {
    let isKeeper = false;
    for (const ref of targetShortRefs) {
      if (text.includes(ref)) {
        isKeeper = true;
        break;
      }
    }
    if (isKeeper) {
      keepers.push(slug);
    }
  }

  // 2. Verificar se está presente no arquivo alvo
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

// ─── saída ─────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  console.log(JSON.stringify({ keepers, presentSlugs }));
  exit(0);
} else {
  console.log(`=== PRÉ-VOO DE CONSOLIDAÇÃO PARA: ${targetFile} ===`);
  console.log(`KEEPERS conhecidos (Caso A garantido) [${keepers.length}]:`);
  if (keepers.length === 0) {
    console.log("  (nenhum)");
  } else {
    for (const k of keepers) {
      console.log(`  - [[${k}]]`);
    }
  }
  console.log(`\nSlugs presentes no arquivo [${presentSlugs.length}]:`);
  if (presentSlugs.length === 0) {
    console.log("  (nenhum)");
  } else {
    // Dividir em colunas ou exibir em lista
    console.log("  " + presentSlugs.map(s => `[[${s}]]`).join(", "));
  }
  exit(0);
}
