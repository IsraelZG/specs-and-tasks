#!/usr/bin/env node
/**
 * audit-links.mjs — Auditor determinístico de links do wiki
 *
 * Verifica três coisas:
 *   1. Links quebrados   — [[slug]] ou [[slug#âncora]] sem arquivo-alvo em docs/
 *   2. Órfãos            — verbetes em docs/conceitos/ sem nenhum backlink
 *   3. Candidatos de definição concorrente — mesmo título/slug definido em >1 lugar
 *      (apenas candidatos; julgamento hub-vs-violação fica para o LLM)
 *
 * Uso:
 *   node scripts/audit-links.mjs [--json] [--root <pasta-raiz>]
 *
 * Flags:
 *   --json          Saída em JSON (para consumo pelo auditor-wiki)
 *   --root <path>   Raiz do projeto (default: cwd)
 *   --no-orphans    Pula checagem de órfãos
 *
 * Saída (texto, default):
 *   CRÍTICO — Links quebrados
 *   AVISO   — Verbetes órfãos
 *   INFO    — Candidatos a definição concorrente (para o LLM julgar)
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { argv, cwd } from "node:process";

// ─── configuração ──────────────────────────────────────────────────────────

const args        = argv.slice(2);
const JSON_MODE   = args.includes("--json");
const NO_ORPHANS  = args.includes("--no-orphans");
const rootIdx     = args.indexOf("--root");
const ROOT        = rootIdx !== -1 ? args[rootIdx + 1] : cwd();
const DOCS        = join(ROOT, "docs");
const CONCEITOS   = join(DOCS, "conceitos");

/**
 * Slugs que são Foam placeholders intencionais — links para eles NÃO
 * são quebrados, apenas "pendentes de criação". Reportamos separado.
 * Fonte: docs/conceitos/_plano-de-ondas.md § "Não são alvos de verbete"
 */
const KNOWN_PLACEHOLDERS = new Set([
  // projeções SQL sem verbete intencional
  "entity-heads", "active-edges", "asset-balances", "local-permissions",
  "validator-serialization-log", "peer-reputation-table",
  // conceitos sem verbete por decisão
  "ciclo-de-commit", "eleicao-de-committer", "pending-changes",
  "sqlite-wasm", "opfs", "fts5", "rtree", "crdt",
  // bootstrap / topologia
  "bootstrap-frio-absoluto", "bootstrap-morno", "dht-descartada",
  "link-multiaddr",
  // UI / design
  "tokens-css-hsl",
  // subtipos sem ★
  "profile-organization", "content-document", "content-personal-data",
  "asset-balance-state", "asset-inventory",
  // engines de UI (Onda 8 do inventário)
  "timeline-engine", "supercard-engine", "smartform-engine",
  "notification-engine", "search-engine", "media-engine",
  "audittrail-engine",
  // ondas futuras / verbetes ainda não criados
  "rotacao-de-epocas", "retention-state", "serves-aresta",
  "bond-caucao", "defesa-sybil", "asset-reputation",
  "minimalismo-ontologico", "local-first",
  "credits", "transfers-aresta", "sucessao-por-quorum",
  "stale-epoch", "snapshot-de-bootstrap", "rede-p2p-pura",
  "delegacao-persona-corporativa", "peer",
  // aliases de verbetes pai (CAT-3 do glossário)
  "webtorrent-blobs",
]);

/**
 * Pastas a varrer para coletar definições e links.
 * Ajuste se sua estrutura de pastas for diferente.
 */
const SCAN_DIRS = [
  join(DOCS, "conceitos"),
  join(DOCS, "caderno-1-vision"),
  join(DOCS, "caderno-2-protocol"),
  join(DOCS, "caderno-3-sdk"),
  join(DOCS, "caderno-4-governance"),
  join(DOCS, "caderno-5-transport"),   // RFC de transporte pós git-mv
  join(DOCS, "rfcs"),
  join(DOCS, "adr"),
];

/**
 * Arquivos .md soltos na raiz de docs/ (ex: rfc-transporte-p2p-v3.1.md
 * antes do git-mv para caderno-5-transport/).
 */
const ROOT_MD_FILES = existsSync(DOCS)
  ? readdirSync(DOCS, { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith(".md") && !e.name.startsWith("_"))
      .map(e => join(DOCS, e.name))
  : [];

// regex
const WIKILINK_RE     = /\[\[([^\]]+?)\]\]/g;   // [[slug]], [[slug#ancora]], [[slug|alias]]
const HEADING_RE      = /^#{1,4}\s+(.+)$/gm;
const FRONTMATTER_RE  = /^---\n([\s\S]*?)\n---/;
const TITLE_FM_RE     = /^title:\s*(.+)$/m;
const ALIASES_FM_RE   = /^aliases:\s*[\[\n]([\s\S]*?)(?:\]|\n[^\s])/m;
const MODO_FM_RE      = /^modo:\s*(\S+)/im;

// ─── helpers ───────────────────────────────────────────────────────────────

/** Coleta todos os .md de uma pasta recursivamente, excluindo _* */
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

/** Extrai slug de um caminho (nome do arquivo sem .md) */
const toSlug = (p) => basename(p, ".md");

/** Normaliza um wikilink para slug + âncora opcionais */
function parseWikilink(raw) {
  // [[slug#ancora|alias]] → { slug, anchor }
  const noAlias = raw.split("|")[0].trim();
  const [slug, anchor] = noAlias.split("#");
  return { slug: slug.trim(), anchor: anchor?.trim() };
}

/** Extrai anchors HTML e headings de um arquivo como Set<string> */
function extractAnchors(text) {
  const anchors = new Set();

  // <a id="foo"></a>  ou  <a name="foo">
  for (const m of text.matchAll(/<a\s+(?:id|name)="([^"]+)"/gi)) {
    anchors.add(m[1]);
  }

  // headings → slug de âncora estilo GitHub
  // Algoritmo: lowercase → remove tudo exceto letras Unicode, dígitos, espaço, hífen → espaços→hífens
  // Mantém acentos (ã, é, ç…) porque o GitHub os preserva nos slugs.
  // Referência: https://github.com/jch/html-pipeline/blob/master/lib/html/pipeline/toc_filter.rb
  for (const m of text.matchAll(HEADING_RE)) {
    // remove o marcador de heading do início se sobrou (## §1)
    const raw = m[1].replace(/^#+\s*/, "");
    const anchor = raw
      .toLowerCase()
      // remove formatação markdown inline: **bold**, _italic_, `code`
      .replace(/[*_`]/g, "")
      // remove parênteses e seu conteúdo? não — GitHub mantém os parênteses como hífen
      // remove caracteres que GitHub descarta: pontuação exceto hífen
      // GitHub mantém: letras (incluindo Unicode), dígitos, espaço, hífen
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      // espaços → hífens
      .replace(/\s+/g, "-")
      // colapsa hífens múltiplos
      .replace(/-+/g, "-")
      // remove hífens no início/fim
      .replace(/^-+|-+$/g, "");
    anchors.add(anchor);
  }
  return anchors;
}

/** Lê modo: do frontmatter de um verbete (canonical | hub | indefinido) */
function readModo(text) {
  const fm = text.match(FRONTMATTER_RE)?.[1] ?? "";
  return text.match(MODO_FM_RE)?.[1]?.toLowerCase()
    ?? fm.match(MODO_FM_RE)?.[1]?.toLowerCase()
    ?? "indefinido";
}

/** Extrai título e aliases do frontmatter */
function readIdentity(text) {
  const fm = text.match(FRONTMATTER_RE)?.[1] ?? "";
  const title  = (fm.match(TITLE_FM_RE)?.[1] ?? "").trim().toLowerCase();
  const aliasRaw = fm.match(ALIASES_FM_RE)?.[1] ?? "";
  const aliases = aliasRaw
    .split(/[\n,]+/)
    .map(a => a.replace(/^[-*\s]+/, "").replace(/['"[\]]/g, "").trim().toLowerCase())
    .filter(Boolean);
  return { title, aliases };
}

// ─── coleta de dados ────────────────────────────────────────────────────────

/**
 * Map de TODOS os alvos válidos de wikilink no repo:
 *   - verbetes: slug → { path, anchors, modo, title, aliases, isVerbete: true }
 *   - cadernos/rfcs/adr: caminho-relativo-sem-.md → { path, anchors, isVerbete: false }
 *
 * Wikilinks no Foam podem apontar para:
 *   [[slug]]                       → conceitos/<slug>.md
 *   [[caderno-2-protocol/02-file]] → caderno-2-protocol/02-file.md
 *   [[caderno-2-protocol/02-file#ancora]] → idem, com âncora
 *   [[vision]] [[protocol]] [[sdk]] [[governance]] → atalhos de caderno
 */
const targets = new Map();   // chave-de-resolução → { path, anchors, isVerbete }
const verbetes = new Map();  // só verbetes (para backlinks e candidatos)

// 1. Verbetes em docs/conceitos/
for (const p of collectMd(CONCEITOS)) {
  const slug = toSlug(p);
  if (slug.startsWith("_")) continue;
  const text = readFileSync(p, "utf8");
  const entry = {
    path: p, text,
    anchors: extractAnchors(text),
    modo: readModo(text),
    ...readIdentity(text),
    isVerbete: true,
  };
  verbetes.set(slug, entry);
  targets.set(slug, entry);
}

// 2. Todos os outros .md do repo (cadernos, rfcs, adr + soltos na raiz de docs/)
//    Registrados com a chave = caminho relativo a DOCS sem .md
//    Ex: "caderno-2-protocol/02-cryptographic-lineage-and-auth"
const nonVerbeteFiles = [...SCAN_DIRS.flatMap(collectMd), ...ROOT_MD_FILES]
  .filter(p => !p.startsWith(CONCEITOS));

for (const filePath of nonVerbeteFiles) {
  const text = readFileSync(filePath, "utf8");
  const relToDocs = relative(DOCS, filePath).replace(/\\/g, "/").replace(/\.md$/, "");
  const slug      = toSlug(filePath);
  const anchors   = extractAnchors(text);
  const entry     = { path: filePath, text, anchors, isVerbete: false };

  // chave longa: "caderno-2-protocol/02-cryptographic-lineage-and-auth"
  targets.set(relToDocs, entry);
  // chave longa com .md (alguns verbetes foram gerados assim): "caderno-1-vision/01-vision-and-positioning.md"
  targets.set(relToDocs + ".md", entry);
  // chave curta (só o nome do arquivo sem pasta): "02-cryptographic-lineage-and-auth"
  targets.set(slug, entry);
  // chave curta com .md
  targets.set(slug + ".md", entry);
}

// 3. Atalhos de caderno e aliases especiais
//    [[caderno-1-vision]] (pasta) → entrada sintética válida (sem âncoras)
//    [[vision]] / [[protocol]] / [[sdk]] / [[governance]] → idem
//    O Foam aceita links para pasta como "qualquer arquivo dentro dela"; aqui
//    só precisamos que não sejam "alvo ausente" — âncoras não são verificadas
//    neste nível.
const CADERNO_FOLDER_ALIASES = {
  // atalhos curtos usados nos verbetes
  "vision":              "caderno-1-vision",
  "protocol":            "caderno-2-protocol",
  "sdk":                 "caderno-3-sdk",
  "governance":          "caderno-4-governance",
  // pastas completas usadas como [[caderno-X-name]]
  "caderno-1-vision":    "caderno-1-vision",
  "caderno-2-protocol":  "caderno-2-protocol",
  "caderno-3-sdk":       "caderno-3-sdk",
  "caderno-4-governance":"caderno-4-governance",
  "caderno-5-transport": "caderno-5-transport",
  // alias de verbete
  "automerge":           "automerge-repo",
};

const SYNTHETIC = { path: "", anchors: new Set(), isVerbete: false };

for (const [alias, target] of Object.entries(CADERNO_FOLDER_ALIASES)) {
  if (!targets.has(alias)) {
    targets.set(alias, targets.get(target) ?? SYNTHETIC);
  }
}

/** Todos os arquivos .md do repo a varrer por links */
const allFiles = [...SCAN_DIRS.flatMap(collectMd), ...ROOT_MD_FILES];

/**
 * Para cada arquivo: coleta links emitidos e definições encontradas.
 */
const allLinks  = [];
const backlinks = new Map([...verbetes.keys()].map(s => [s, []]));
const defs      = new Map();

const DEF_RE = /^\*\*([^*]+)\*\*\s*[—-]/m;

for (const filePath of allFiles) {
  const rel  = relative(ROOT, filePath);
  const text = readFileSync(filePath, "utf8");

  // ── links emitidos ────────────────────────────────────────────
  let lineNum = 0;
  for (const rawLine of text.split("\n")) {
    lineNum++;
    for (const m of rawLine.matchAll(WIKILINK_RE)) {
      const { slug, anchor } = parseWikilink(m[1]);
      allLinks.push({ from: rel, slug, anchor, line: lineNum });
      if (backlinks.has(slug)) backlinks.get(slug).push(rel);
    }
  }

  // ── definições encontradas (candidatos a concorrência) ────────
  if (!filePath.startsWith(CONCEITOS)) {
    for (const m of text.matchAll(HEADING_RE)) {
      const norm = m[1].trim().toLowerCase().replace(/[^a-z0-9 -]/g, "");
      if (!defs.has(norm)) defs.set(norm, []);
      defs.get(norm).push({ file: rel, section: m[1] });
    }
    for (const m of text.matchAll(/^\*\*([^*]{3,60})\*\*\s*[—\-–]/gm)) {
      const norm = m[1].trim().toLowerCase().replace(/[^a-z0-9 -]/g, "");
      if (!defs.has(norm)) defs.set(norm, []);
      defs.get(norm).push({ file: rel, section: m[1] });
    }
  }
}

// Registra definições dos verbetes no mapa de defs
for (const [slug, v] of verbetes) {
  const norm = (v.title || slug).toLowerCase().replace(/[^a-z0-9 -]/g, "");
  if (!defs.has(norm)) defs.set(norm, []);
  defs.get(norm).push({ file: relative(ROOT, v.path), section: v.title || slug, slug });
  for (const alias of v.aliases) {
    const an = alias.replace(/[^a-z0-9 -]/g, "");
    if (!defs.has(an)) defs.set(an, []);
    defs.get(an).push({ file: relative(ROOT, v.path), section: alias, slug });
  }
}

// ─── resultados ────────────────────────────────────────────────────────────

/** 1. Links quebrados */
const broken      = [];
const placeholders = [];

for (const { from, slug, anchor, line } of allLinks) {
  // Resolve: tenta slug direto, depois caminho relativo a docs/
  const target = targets.get(slug);

  if (target) {
    // alvo existe — verificar âncora se houver
    if (anchor && target.anchors && !target.anchors.has(anchor)) {
      // só reporta âncora quebrada se o arquivo tiver âncoras indexadas
      // (arquivos vazios de âncora = não foram lidos com extractAnchors)
      if (target.anchors.size > 0 || target.isVerbete) {
        broken.push({ from, slug, anchor, line, reason: "âncora ausente" });
      }
    }
    continue;
  }

  if (KNOWN_PLACEHOLDERS.has(slug)) {
    placeholders.push({ from, slug, line });
    continue;
  }

  // Tenta resolver como caminho relativo ao arquivo de origem
  // Ex: em conceitos/hlc.md, [[caderno-2-protocol/02-file#anchor]]
  // já está no targets como "caderno-2-protocol/02-file"
  // (já tratado acima pelo targets.get(slug))

  // broken por slug/caminho ausente
  broken.push({ from, slug, anchor: anchor ?? null, line, reason: "alvo ausente" });
}

/** 2. Órfãos */
const orphans = NO_ORPHANS
  ? []
  : [...backlinks.entries()]
      .filter(([, refs]) => refs.length === 0)
      .map(([slug]) => ({ slug, path: relative(ROOT, verbetes.get(slug).path) }));

/** 3. Candidatos a definição concorrente */
const candidates = [];

for (const [norm, locs] of defs) {
  // filtra: precisa ter pelo menos 1 verbete E 1 não-verbete, OU 2 verbetes
  const hasVerbete    = locs.some(l => l.slug);
  const nonVerbetes   = locs.filter(l => !l.slug);
  if (!hasVerbete || nonVerbetes.length === 0) continue;

  // exclui: verbetes hub cujo não-verbete é provavelmente o canônico legítimo
  // (não descartamos, mas marcamos para o LLM distinguir)
  const verbeteLoc = locs.find(l => l.slug);
  const modo = verbeteLoc ? verbetes.get(verbeteLoc.slug)?.modo ?? "indefinido" : "indefinido";

  candidates.push({
    norm,
    slug: verbeteLoc?.slug ?? null,
    modo,
    verbete: verbeteLoc?.file ?? null,
    outros: nonVerbetes.map(l => ({ file: l.file, section: l.section })),
  });
}

// ─── saída ─────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  console.log(JSON.stringify({ broken, orphans, placeholders, candidates }, null, 2));
  process.exit(broken.length > 0 || orphans.length > 0 ? 1 : 0);
}

// saída legível por humano / LLM
const hr = "─".repeat(60);

if (broken.length > 0) {
  console.log(`\n${hr}\nCRÍTICO — ${broken.length} link(s) quebrado(s)\n${hr}`);
  for (const b of broken) {
    const anchor = b.anchor ? `#${b.anchor}` : "";
    console.log(`  [[${b.slug}${anchor}]] em ${b.from}:${b.line} (${b.reason})`);
  }
} else {
  console.log("\n✓ Nenhum link quebrado.");
}

if (!NO_ORPHANS) {
  if (orphans.length > 0) {
    console.log(`\n${hr}\nAVISO — ${orphans.length} verbete(s) órfão(s) (sem backlink)\n${hr}`);
    for (const o of orphans) console.log(`  [[${o.slug}]]  ${o.path}`);
  } else {
    console.log("✓ Nenhum verbete órfão.");
  }
}

if (placeholders.length > 0) {
  console.log(`\n${hr}\nINFO — ${placeholders.length} link(s) para placeholder(s) intencional(is)\n${hr}`);
  for (const p of placeholders) {
    console.log(`  [[${p.slug}]] em ${p.from}:${p.line}`);
  }
}

if (candidates.length > 0) {
  console.log(`\n${hr}\nINFO — ${candidates.length} candidato(s) a definição concorrente (julgamento LLM)\n${hr}`);
  for (const c of candidates) {
    console.log(`  slug: ${c.slug ?? "(sem verbete)"} | modo: ${c.modo}`);
    console.log(`    verbete: ${c.verbete}`);
    for (const o of c.outros) console.log(`    outro:   ${o.file} §"${o.section}"`);
  }
} else {
  console.log("✓ Nenhum candidato a definição concorrente.");
}

const exitCode = broken.length > 0 ? 1 : 0;
process.exit(exitCode);
