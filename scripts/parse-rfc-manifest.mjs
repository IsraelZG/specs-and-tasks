#!/usr/bin/env node
/**
 * parse-rfc-manifest.mjs — Roteador determinístico para "caminho rápido" de RFCs.
 * Lê uma RFC, parseia as tabelas "Onde integrar", resolve remapeamentos,
 * determina executores e grava docs/rfcs/_absorcao-<nome>.md.
 *
 * Uso:
 *   node scripts/parse-rfc-manifest.mjs <caminho-da-rfc>
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { argv, exit } from "node:process";

const args = argv.slice(2);
const rfcPath = args.find(a => !a.startsWith("-"));

if (!rfcPath) {
  console.error("Uso: node scripts/parse-rfc-manifest.mjs <caminho-da-rfc>");
  exit(2);
}

const ROOT = ".";
const STATUS_FILE = join(ROOT, "docs", "rfcs", "_status.md");

if (!existsSync(rfcPath)) {
  console.error(`Erro: RFC não encontrada em ${rfcPath}`);
  exit(2);
}

const rfcContent = readFileSync(rfcPath, "utf8");
const rfcName = basename(rfcPath, ".md");

// ─── 1. Carregar remapeamentos do _status.md ────────────────────────────────
const remaps = new Map();
if (existsSync(STATUS_FILE)) {
  const statusText = readFileSync(STATUS_FILE, "utf8");
  const lines = statusText.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith("|") && !line.includes("status") && !line.includes("---")) {
      const cols = line.split("|").map(c => c.trim()).filter(Boolean);
      if (cols.length >= 3) {
        const rfcFile = cols[0]; // e.g., rfc-transporte-p2p-v3.1.md
        const dest = cols[2]; // e.g., git mv → caderno-5-transport/
        if (dest.includes("→")) {
          const targetPath = dest.split("→")[1].trim().replace(/\/$/, "");
          remaps.set(rfcFile, targetPath);
        }
      }
    }
  }
}

// ─── 2. Extrair Precedências / Supersessões ─────────────────────────────────
let precedencia = "Nenhuma declarada";
const firstLines = rfcContent.split("\n").slice(0, 30);
for (const line of firstLines) {
  if (line.toLowerCase().includes("precedência:") || line.toLowerCase().includes("precedencia:")) {
    precedencia = line.replace(/^>\s*\*\*Precedên?cia:\*\*/i, "").trim();
    break;
  }
}

// ─── 3. Parsear seções e tabelas ────────────────────────────────────────────
// Identificar blocos de seções e suas tabelas
const sections = [];
const headingRegex = /^##\s+(A\.\d+\s+—\s+.+)$/gm;
let headingMatch;
const headings = [];

while ((headingMatch = headingRegex.exec(rfcContent)) !== null) {
  headings.push({
    title: headingMatch[1],
    index: headingMatch.index,
  });
}

// Adicionar um marcador de fim
headings.push({ title: "FIM", index: rfcContent.length });

const subtasks = [];
let subtaskIdSeq = 1;

for (let i = 0; i < headings.length - 1; i++) {
  const current = headings[i];
  const next = headings[i+1];
  const sectionText = rfcContent.substring(current.index, next.index);

  // Extrair ID da seção (ex: A.1 -> a1)
  const sectionIdMatch = current.title.match(/^A\.(\d+)/i);
  const sectionId = sectionIdMatch ? `a${sectionIdMatch[1]}` : `s${i+1}`;

  // Localizar a tabela "Onde integrar" nesta seção
  const lines = sectionText.split("\n");
  let inTable = false;
  const tableRows = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|")) {
      if (trimmed.toLowerCase().includes("arquivo") || trimmed.includes(":---") || trimmed.includes("---:")) {
        continue;
      }
      tableRows.push(trimmed);
    }
  }

  if (tableRows.length === 0) continue;

  // Processar cada linha da tabela
  let rowIdx = 1;
  for (const row of tableRows) {
    const cols = row.split("|").map(c => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;

    const rawFile = cols[0].replace(/[`]/g, "").trim();
    const rawSec = cols[1].replace(/[`]/g, "").trim();
    const rawAction = cols[2].trim();

    const baseSource = `${rfcName}.md §${sectionId}`;

    // Caso 1: Conceitos
    if (rawFile.includes("conceitos") || rawFile === "docs/conceitos") {
      // Pode conter múltiplos arquivos em Seção (ex: "novo epoca-de-identidade.md; editar chave-de-epoca.md")
      const targets = rawSec.split(/[;,\n]+/).map(t => t.trim()).filter(Boolean);
      for (const target of targets) {
        let type = "EDITA-CONCEITO";
        let slug = target;
        
        if (target.toLowerCase().startsWith("novo ")) {
          type = "NOVO-CONCEITO";
          slug = target.substring(5).replace(/\.md$/i, "").trim();
        } else if (target.toLowerCase().startsWith("editar ")) {
          type = "EDITA-CONCEITO";
          slug = target.substring(7).replace(/\.md$/i, "").trim();
        } else {
          // Fallback se for apenas o slug
          slug = target.replace(/\.md$/i, "").trim();
        }

        subtasks.push({
          id: `${sectionId}_${rowIdx}_${subtaskIdSeq++}`,
          fonte: baseSource,
          tipo: type,
          destino: `docs/conceitos/${slug}.md`,
          acao: rawAction,
          rawFile,
          rawSec: target,
        });
      }
    }
    // Caso 2: ADRs
    else if (rawFile === "docs/" && rawSec.toLowerCase().includes("adr/")) {
      const adrPath = rawSec.replace(/^novo\s+/i, "").trim();
      subtasks.push({
        id: `${sectionId}_${rowIdx}_${subtaskIdSeq++}`,
        fonte: baseSource,
        tipo: "ADR",
        destino: `docs/${adrPath}`,
        acao: rawAction,
        rawFile,
        rawSec,
      });
    }
    // Caso 3: Cadernos e outros arquivos normais
    else {
      let finalDest = rawFile;
      let type = "EDITA-CADERNO";
      let status = "[ ]";
      // Flag: sinaliza que o arquivo destino precisa ser CRIADO DO ZERO.
      // Ativada quando rawSec (coluna "Seção") contém a palavra "novo" (case-insensitive).
      const criar_do_zero = /\bnovo\b/i.test(rawSec);

      // Verificar descarte
      if (rawFile === "backlog-geral.md") {
        type = "DESCARTE";
        status = "[DESCARTADA: legado]";
        finalDest = `docs/${rawFile}`;
      } else {
        // Verificar remapeamento
        if (remaps.has(rawFile)) {
          finalDest = remaps.get(rawFile);
          // Se o destino é uma pasta e não um arquivo específico, tentamos manter o subcaminho se houver
          if (!finalDest.endsWith(".md") && rawSec.endsWith(".md")) {
            finalDest = join(finalDest, rawSec);
          }
        }
        
        if (!finalDest.startsWith("docs/")) {
          finalDest = `docs/${finalDest}`;
        }

        if (rawAction.toLowerCase().includes("adicionar") || rawAction.toLowerCase().includes("nova")) {
          type = "NOVA-SECAO-CADERNO";
        }
      }

      subtasks.push({
        id: `${sectionId}_${rowIdx}_${subtaskIdSeq++}`,
        fonte: baseSource,
        tipo: type,
        destino: finalDest,
        acao: `${rawSec} — ${rawAction}`,
        rawFile,
        rawSec,
        status,
        criar_do_zero,
      });
    }
    rowIdx++;
  }
}

if (subtasks.length === 0) {
  console.log("Aviso: Nenhuma tabela 'Onde integrar' válida foi encontrada. Usar o caminho lento.");
  exit(1);
}

// ─── 4. Determinar Executores e Pendências ──────────────────────────────────
let nHaiku = 0;
let nRevisar = 0;
let nDescartadas = 0;

for (const task of subtasks) {
  if (task.status && task.status.includes("DESCARTADA")) {
    task.executor = "haiku"; // Descartadas são marcadas haiku apenas para conformidade
    nDescartadas++;
    continue;
  }

  let executor = "haiku";
  let isRevisar = false;

  // Critério A: Contradição ou substituição
  const actionLower = task.acao.toLowerCase();
  const supersedeKeywords = ["supersede", "substitui", "corrige", "redefine", "deprecia", "contradiz", "remover", "remove"];
  for (const kw of supersedeKeywords) {
    if (actionLower.includes(kw)) {
      isRevisar = true;
      break;
    }
  }

  // Critério B: Conflito de remapeamento (destino inexistente)
  // Se o destino é uma pasta remapeada que não existe
  if (task.tipo === "EDITA-CADERNO" || task.tipo === "NOVA-SECAO-CADERNO") {
    const destDir = dirname(task.destino);
    if (!existsSync(destDir)) {
      task.tipo = "CONFLITO-REVISAR";
      isRevisar = true;
    }
  }

  // Critério C: Novo caderno (decisão estrutural)
  if (task.destino.startsWith("docs/caderno-") && !existsSync(task.destino) && task.tipo === "NOVA-SECAO-CADERNO") {
    // Se o arquivo do caderno em si não existe, exige criação estrutural
    task.tipo = "NOVO-CADERNO";
    isRevisar = true;
  }

  if (isRevisar) {
    executor = "revisar-humano";
    nRevisar++;
  } else {
    nHaiku++;
  }

  task.executor = executor;
  task.status = "[ ]";
}

// ─── 5. Gravar Manifesto ──────────────────────────────────────────────────
const outPath = join(ROOT, "docs", "rfcs", `_absorcao-${rfcName}.md`);
const total = subtasks.length;

let outContent = `# Absorção ${rfcName}.md

> **Resumo:** ${total} subtasks · ${nHaiku} haiku · ${nRevisar} revisar-humano · ${nDescartadas} descartadas

## LISTA DE SUPERSESSÕES
- ${precedencia}

## Tabela de Subtasks

| id | fonte | tipo | destino | acao | executor | status | criar_do_zero |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

for (const task of subtasks) {
  // Limpar links e caracteres
  const destClean = task.destino.replace(/\\/g, "/");
  // criar_do_zero: flag que sinaliza que o arquivo destino NÃO existe e deve ser CRIADO DO ZERO.
  // Presente nos tipos de caderno (Caso 3). Para NOVO-CONCEITO/ADR/DESCARTE a coluna exibe "N/A".
  const criarFlag = task.criar_do_zero === true ? "✅ CRIAR" : (task.criar_do_zero === false ? "—" : "N/A");
  outContent += `| ${task.id} | ${task.fonte} | ${task.tipo} | \`${destClean}\` | ${task.acao.replace(/\|/g, "\\|")} | ${task.executor} | ${task.status} | ${criarFlag} |\n`;
}

writeFileSync(outPath, outContent, "utf8");
console.log(`Manifesto gerado com sucesso em ${outPath}`);
console.log(`Resumo: ${total} subtasks (${nHaiku} haiku, ${nRevisar} revisar-humano, ${nDescartadas} descartadas).`);
exit(0);
