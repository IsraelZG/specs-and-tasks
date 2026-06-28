#!/usr/bin/env node
/**
 * get-wave-queue.mjs — Retorna a fila de verbetes pendentes para uma dada onda.
 *
 * Uso:
 *   node scripts/get-wave-queue.mjs <numero-da-onda> [--json]
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { argv, exit } from "node:process";

const args = argv.slice(2);
const waveArg = args.find(a => !a.startsWith("-"));
const JSON_MODE = args.includes("--json");

if (!waveArg || args.includes("--help") || args.includes("-h")) {
  console.error("Uso: node scripts/get-wave-queue.mjs <numero-da-onda> [--json]");
  exit(1);
}

const ROOT = ".";
const PLAN = join(ROOT, "docs", "conceitos", "_plano-de-ondas.md");
const CONCEITOS_DIR = join(ROOT, "docs", "conceitos");

if (!existsSync(PLAN)) {
  console.error(`Erro: Arquivo do plano de ondas não encontrado em ${PLAN}`);
  exit(1);
}

const planContent = readFileSync(PLAN, "utf8");

// Encontrar a seção correspondente à onda
const lines = planContent.split("\n");
let inWaveSection = false;
let waveSectionLines = [];

const waveNumStr = waveArg.trim();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith("## Onda ")) {
    // Ex: "## Onda 1.5 — Fundações..." ou "## Onda 2 — Acesso..."
    const match = line.match(/^## Onda\s+([0-9.]+)/i);
    if (match && match[1] === waveNumStr) {
      inWaveSection = true;
      continue;
    } else if (inWaveSection) {
      // Começou outra onda, terminar a coleta
      break;
    }
  }
  
  if (inWaveSection) {
    waveSectionLines.push(line);
  }
}

if (waveSectionLines.length === 0) {
  console.error(`Erro: Onda ${waveNumStr} não encontrada no plano de ondas.`);
  exit(1);
}

// Extrair slugs
const slugs = [];

for (const line of waveSectionLines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  
  if (trimmed.startsWith("|")) {
    // É uma linha de tabela
    // Ex: | `substantivo-verbo-principio` | ★ | canonical | ...
    if (trimmed.toLowerCase().includes("slug") || trimmed.includes(":---") || trimmed.includes("---:")) {
      continue;
    }
    const cols = trimmed.split("|").map(c => c.trim()).filter(Boolean);
    if (cols.length > 0) {
      // Limpar o slug de backticks e tags
      const slug = cols[0].replace(/[`]/g, "").trim();
      if (slug && !slug.startsWith("slug")) {
        slugs.push(slug);
      }
    }
  } else if (trimmed.includes(" · ")) {
    // É uma lista inline separada por pontos centrados
    // Ex: `hlc` (piloto) · `ulid` · `id`
    const parts = trimmed.split("·").map(p => p.trim());
    for (const part of parts) {
      const cleanPart = part.replace(/[`]/g, "").trim();
      const slugMatch = cleanPart.match(/^([a-z0-9-]+)/i);
      if (slugMatch) {
        slugs.push(slugMatch[1]);
      }
    }
  }
}

// Filtrar existentes
const queue = [];
for (const slug of slugs) {
  const fileExists = existsSync(join(CONCEITOS_DIR, `${slug}.md`));
  if (!fileExists) {
    queue.push(slug);
  }
}

if (JSON_MODE) {
  console.log(JSON.stringify(queue));
  exit(0);
} else {
  if (queue.length === 0) {
    console.log(`Onda ${waveNumStr} já concluída (todos os ${slugs.length} verbetes existem).`);
  } else {
    console.log(`Fila de conceitos pendentes para Onda ${waveNumStr} (${queue.length}/${slugs.length} restantes):`);
    for (const slug of queue) {
      console.log(`  - ${slug}`);
    }
  }
  exit(0);
}
