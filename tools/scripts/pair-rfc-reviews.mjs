import fs from 'fs';
import path from 'path';

/**
 * pair-rfc-reviews.mjs — casa cada RFC em docs/rfcs/ com seu review em
 * docs/rfc_reviews/, sinaliza divergências (RFC sem review, review órfão, RFC
 * fora do _TEMPLATE.md) e semeia/atualiza docs/rfc_reviews/_revisao-status.md.
 *
 * Determinístico, somente-leitura sobre as RFCs/reviews. A única escrita é o
 * tracker _revisao-status.md (preserva status já registrados; semeia "pendente"
 * para pares novos). Use --dry para não escrever o tracker.
 *
 * Uso: node tools/scripts/pair-rfc-reviews.mjs [--dry]
 */

const ROOT = process.cwd();
const RFC_DIR = path.join(ROOT, 'docs', 'rfcs');
const REVIEW_DIR = path.join(ROOT, 'docs', 'rfc_reviews');
const TRACKER = path.join(REVIEW_DIR, '_revisao-status.md');
const DRY = process.argv.includes('--dry');

// Estados válidos do ciclo de revisão (espelha docs/rfcs/_status.md em espírito).
const ESTADOS = ['pendente', 'sem-review', 'triada', 'emendada', 'concluida'];

const isRfc = (f) => /^rfc-\d{3}-.*\.md$/.test(f);
const isSupport = (f) =>
  ['ordem-de-absorcao.md', 'plano-de-modulos.md', 'diff-preparativos-plano.md',
    'inventario-componentes-layouts.md', 'design-system-proposal.md'].includes(f);

/** Chave de casamento: "rfc-NNN" para RFCs; o slug puro para docs de apoio. */
function rfcKey(file) {
  const m = file.match(/^(rfc-\d{3})-/);
  if (m) return m[1];
  return file.replace(/\.md$/, '');
}
function reviewKey(file) {
  return file.replace(/^review_/, '').replace(/\.md$/, '');
}

/** Heurística de aderência ao _TEMPLATE.md: precisa de seção A.N e Texto normativo. */
function checkTemplate(absPath) {
  const txt = fs.readFileSync(absPath, 'utf8');
  const hasSection = /^##\s+A\.\d+\s+—/m.test(txt);
  const hasNormative = /\*\*Texto normativo:?\*\*/.test(txt);
  const hasOnde = /\*\*Onde integrar:?\*\*/.test(txt);
  return { hasSection, hasNormative, hasOnde, ok: hasSection && hasNormative && hasOnde };
}

const rfcFiles = fs.readdirSync(RFC_DIR).filter((f) => isRfc(f) || isSupport(f));
const reviewFiles = fs.readdirSync(REVIEW_DIR).filter((f) => /^review_.*\.md$/.test(f));

const reviewByKey = new Map(reviewFiles.map((f) => [reviewKey(f), f]));
const usedReviews = new Set();

const rows = [];
const orphanRfcs = [];
const templateWarnings = [];

for (const f of rfcFiles.sort()) {
  const key = rfcKey(f);
  const review = reviewByKey.get(key);
  if (review) usedReviews.add(key);
  const kind = isRfc(f) ? 'rfc' : 'apoio';
  let tmpl = '—';
  if (isRfc(f)) {
    const c = checkTemplate(path.join(RFC_DIR, f));
    tmpl = c.ok ? 'ok' : `FALTA:${[!c.hasSection && 'A.N', !c.hasOnde && 'Onde', !c.hasNormative && 'Norm'].filter(Boolean).join(',')}`;
    if (!c.ok) templateWarnings.push(`${f} → ${tmpl}`);
  }
  if (!review) orphanRfcs.push(f);
  rows.push({ key, kind, rfc: f, review: review || '— (SEM REVIEW)', tmpl });
}

const orphanReviews = reviewFiles.filter((f) => !usedReviews.has(reviewKey(f)));

// --- Relatório no stdout ---
const pad = (s, n) => String(s).padEnd(n);
console.log('\n# Pareamento RFC × Review\n');
console.log(pad('chave', 12), pad('tipo', 7), pad('rfc', 36), pad('review', 30), 'template');
console.log('-'.repeat(100));
for (const r of rows) {
  console.log(pad(r.key, 12), pad(r.kind, 7), pad(r.rfc, 36), pad(r.review, 30), r.tmpl);
}
console.log(`\nTotal RFCs/apoio: ${rows.length} · com review: ${rows.length - orphanRfcs.length} · sem review: ${orphanRfcs.length}`);
if (orphanRfcs.length) console.log(`RFCs/apoio SEM review: ${orphanRfcs.join(', ')}`);
if (orphanReviews.length) console.log(`Reviews ÓRFÃOS (sem RFC): ${orphanReviews.join(', ')}`);
if (templateWarnings.length) console.log(`RFCs fora do _TEMPLATE.md:\n  - ${templateWarnings.join('\n  - ')}`);
else console.log('Todas as RFCs aderem ao _TEMPLATE.md.');

// --- Tracker: preserva status existentes, semeia novos ---
const prevStatus = new Map();
if (fs.existsSync(TRACKER)) {
  const prev = fs.readFileSync(TRACKER, 'utf8');
  for (const line of prev.split('\n')) {
    const m = line.match(/^\|\s*`?([\w-]+)`?\s*\|.*\|\s*(pendente|sem-review|triada|emendada|concluida)\s*\|/);
    if (m) prevStatus.set(m[1], m[2]);
  }
}

const trackerLines = [
  '# Status de Revisão das RFCs',
  '',
  'Gerado/atualizado por `node tools/scripts/pair-rfc-reviews.mjs`.',
  `Estados: ${ESTADOS.join(' → ')}.`,
  '',
  '| chave | rfc | review | template | status |',
  '| :--- | :--- | :--- | :--- | :--- |',
];
for (const r of rows) {
  const seeded = r.review.startsWith('—') ? 'sem-review' : 'pendente';
  const status = prevStatus.get(r.key) || seeded;
  trackerLines.push(`| \`${r.key}\` | ${r.rfc} | ${r.review} | ${r.tmpl} | ${status} |`);
}
trackerLines.push('');
if (orphanReviews.length) {
  trackerLines.push(`> Reviews órfãos (sem RFC correspondente): ${orphanReviews.join(', ')}`);
  trackerLines.push('');
}

const out = trackerLines.join('\n');
if (DRY) {
  console.log('\n[--dry] tracker NÃO escrito. Prévia:\n');
  console.log(out);
} else {
  fs.writeFileSync(TRACKER, out, 'utf8');
  console.log(`\nTracker atualizado: ${path.relative(ROOT, TRACKER)}`);
}
