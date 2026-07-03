#!/usr/bin/env node
// ORQ-12 · Bancada de medição de otimização de contexto (spike).
// Mede 3 vias de encolher tool-outputs ANTES de entrarem no contexto do agente:
//   (1) headroom-ai  — SDK oficial. ACHADO: é cliente HTTP p/ o proxy Headroom
//        (DEFAULT_BASE_URL http://localhost:8787). NÃO comprime in-process; precisa do
//        serviço no ar. A bancada tenta e reporta se o proxy responde ou não.
//   (2) crusher nativo — ~40 linhas in-process, ZERO dep, ZERO serviço. É o mecanismo
//        que a gente EXTRAIRIA do ToolCrusher/SmartCrusher do Headroom p/ um plugin próprio:
//        colapsa linhas de mesma "forma" (listagens/logs) preservando 1 exemplo + contagem.
//   (3) nano-preprocess — modelo barato do roster (deepseek-v4-flash) resume o output.
//        Mede tokens in/out + latência + custo do próprio nano.
//
// Rodar:  cd tools/orchestrator && node --env-file=../../.env context-bench.poc.mjs
//
// Token count: estimativa chars/4 (padrão OpenAI). ponytail: aproximação; ratios são o que
// importa, não o absoluto. O headroom-ai (via 1) devolve contagem real quando o proxy responde.

import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(HERE, '../..');
const tokEst = (s) => Math.ceil(s.length / 4); // ponytail: chars/4; upgrade p/ tiktoken se o absoluto importar

// ── payloads reais do repo (os 3 tipos que enchem a janela de um agente de código) ────────
function walk(dir, acc, cap) {
  if (acc.length >= cap) return acc;
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    if (acc.length >= cap) break;
    const full = path.join(dir, e.name);
    acc.push(full);
    if (e.isDirectory()) walk(full, acc, cap);
  }
  return acc;
}
function loadPayloads() {
  const p = [];
  // (a) código — output de readFile de um .mjs real
  const code = path.join(DOCS, 'tools/scripts/orquestrar.mjs');
  if (fs.existsSync(code)) p.push({ name: 'código (.mjs)', kind: 'code', text: fs.readFileSync(code, 'utf8') });
  // (b) prosa densa — output de readFile de um caderno
  const prose = path.join(DOCS, 'docs/caderno-3-sdk/28-shell-e-composicao.md');
  const proseAlt = path.join(DOCS, 'docs/caderno-3-sdk/14-ia-rag-e-agentes.md');
  const proseFile = fs.existsSync(prose) ? prose : proseAlt;
  if (fs.existsSync(proseFile)) p.push({ name: 'prosa (.md)', kind: 'text', text: fs.readFileSync(proseFile, 'utf8') });
  // (c) listagem — output de ls -R / glob, altamente repetitivo
  const listing = walk(path.join(DOCS, 'node_modules/.pnpm'), [], 4000).join('\n');
  if (listing.length > 100) p.push({ name: 'listagem (ls -R)', kind: 'search', text: listing });
  return p;
}

// ── VIA 2: crusher nativo in-process (o mecanismo que viraria plugin) ──────────────────────
// Colapsa linhas de mesma "forma" (dígitos/hashes → #) preservando 1 exemplo + contagem.
// É o núcleo do ToolCrusher: listagens e logs comprimem muito; código/prosa quase nada
// (formas quase todas únicas) — exatamente o comportamento que queremos (não destruir código).
function nativeCrush(text) {
  const lines = text.split('\n');
  const shape = (l) => l.replace(/[0-9a-f]{8,}/gi, '#').replace(/\d+/g, '#');
  const groups = new Map(); // shape -> { first, count }
  const order = [];
  for (const l of lines) {
    const s = shape(l);
    if (!groups.has(s)) { groups.set(s, { first: l, count: 0 }); order.push(s); }
    groups.get(s).count++;
  }
  const out = [];
  for (const s of order) {
    const g = groups.get(s);
    out.push(g.count > 1 ? `${g.first}   ⟨×${g.count} linhas de mesma forma⟩` : g.first);
  }
  return out.join('\n');
}

// ── VIA 3: nano-preprocess (deepseek-v4-flash resume o output) ─────────────────────────────
function nanoModel() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const prov = createOpenAICompatible({ name: 'deepseek', baseURL: 'https://api.deepseek.com/v1', apiKey: key });
  return prov('deepseek-chat'); // v4-flash aponta p/ deepseek-chat no endpoint público
}
const NANO_CAP = 24000; // chars enviados ao nano (~6k tok) — evita estourar/gastar; ratio é medido contra ISTO
async function nanoPreprocess(model, payload) {
  const sent = payload.text.slice(0, NANO_CAP);
  const t0 = Date.now();
  const { text, usage } = await generateText({
    model,
    prompt: `Você é um filtro de contexto barato. Condense o OUTPUT DE TOOL abaixo para o mínimo que ` +
      `um agente de código precisaria para responder "isto contém X?" sem perder itens distintos. ` +
      `Para listagens: agrupe por pacote/prefixo e dê contagens. Para logs: só linhas únicas/erros. ` +
      `Responda só o condensado, sem preâmbulo.\n\n<<<\n${sent}\n>>>`,
  });
  return { text, ms: Date.now() - t0, usage, sentTok: tokEst(sent) };
}

// ── VIA 1: headroom-ai (tenta o proxy; reporta se está no ar) ──────────────────────────────
// O router do Headroom PROTEGE código e a mensagem-user corrente; só comprime tool_result/rag/
// turnos velhos. Então apresentamos o payload como RESULTADO DE TOOL (o caso real de um agente),
// dentro de um mini-transcript, senão a medição é enganosa (protege → 0%).
async function headroomVia(payload) {
  try {
    const { compress } = await import('headroom-ai');
    const msgs = [
      { role: 'system', content: 'Você é um agente de código.' },
      { role: 'user', content: 'Liste os arquivos / leia o output.' },
      { role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'bash', arguments: '{}' } }] },
      { role: 'tool', tool_call_id: 'c1', content: payload.text },
    ];
    const r = await compress(msgs, { model: 'gpt-4o', fallback: false });
    return { ok: true, before: r.tokensBefore, after: r.tokensAfter, saved: r.tokensSaved, transforms: r.transformsApplied, ccr: r.ccrHashes };
  } catch (e) {
    return { ok: false, error: String(e.message || e).split('\n')[0] };
  }
}

// ── CCR store local (o primitivo de reversibilidade que viraria plugin — NÃO precisa do proxy) ─
// Grava o original por hash em disco; o agente recebe só o resumo/crush + o hash, e chama
// retrieve(hash) pra re-hidratar sob demanda. É o mecanismo do Headroom CCR, in-process, ~12 linhas.
function makeCCRStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orq12-ccr-'));
  return {
    stash(content) {
      const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
      fs.writeFileSync(path.join(dir, hash), content, 'utf8');
      return hash;
    },
    retrieve(hash) { return fs.readFileSync(path.join(dir, hash), 'utf8'); },
    dispose() { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ } },
  };
}

// ── run ────────────────────────────────────────────────────────────────────────────────────
async function main() {
  const payloads = loadPayloads();
  console.log('=== ORQ-12 · context-bench — 3 vias de encolher tool-output ===');
  console.log(`payloads reais: ${payloads.map((p) => `${p.name} (${tokEst(p.text)} tok est.)`).join(' · ')}\n`);

  const nano = nanoModel();
  if (!nano) console.log('⚠ DEEPSEEK_API_KEY ausente — via nano será pulada.\n');

  const rows = [];
  for (const pl of payloads) {
    const base = tokEst(pl.text);

    // via 2 — crusher nativo (sempre roda, in-process)
    const crushed = nativeCrush(pl.text);
    const crushTok = tokEst(crushed);

    // via 1 — headroom proxy
    const hr = await headroomVia(pl);

    // via 3 — nano (só listagem/prosa grande; código não vale gastar)
    let nanoRes = null;
    if (nano && pl.kind !== 'code' && base > 400) {
      try { nanoRes = await nanoPreprocess(nano, pl); } catch (e) { nanoRes = { err: String(e.message || e).split('\n')[0] }; }
    }

    rows.push({ pl, base, crushTok, crushed, hr, nanoRes });
  }

  // tabela
  const pct = (a, b) => (b === 0 ? '—' : `${Math.round((1 - a / b) * 100)}%`);
  console.log('payload'.padEnd(20), 'base'.padStart(7), 'nativo'.padStart(9), '  Δnat', 'headroom'.padStart(10), 'nano-out'.padStart(9), '  Δnano  nano-ms');
  console.log('-'.repeat(92));
  for (const r of rows) {
    const hrCell = r.hr.ok ? `${r.hr.after}(${pct(r.hr.after, r.base)})` : `proxy✗`;
    const nanoTok = r.nanoRes && r.nanoRes.text ? tokEst(r.nanoRes.text) : null;
    const nanoCell = nanoTok != null ? String(nanoTok) : (r.nanoRes?.err ? 'err' : '—');
    // ratio do nano é contra o que ELE VIU (sentTok, capado), não a base inteira
    const nanoPct = nanoTok != null ? pct(nanoTok, r.nanoRes.sentTok) : '—';
    const nanoMs = r.nanoRes?.ms ?? '—';
    console.log(
      r.pl.name.padEnd(20),
      String(r.base).padStart(7),
      String(r.crushTok).padStart(9),
      pct(r.crushTok, r.base).padStart(6),
      hrCell.padStart(10),
      nanoCell.padStart(9),
      nanoPct.padStart(6),
      String(nanoMs).padStart(7),
    );
  }
  console.log('-'.repeat(92));

  // headroom status (uma vez)
  const hrStatus = rows[0].hr.ok
    ? `✓ proxy respondeu — transforms=${rows[0].hr.transforms?.join(',') || '—'}`
    : `✗ proxy fora do ar (${rows[0].hr.error}) — SDK TS é cliente HTTP, não comprime in-process`;
  console.log('headroom-ai:', hrStatus);

  // nano custo (deepseek-v4-flash: ~US$0.028/M in, US$0.042/M out — ordem de grandeza, ver .env/saldo)
  const nanoRows = rows.filter((r) => r.nanoRes?.usage);
  if (nanoRows.length) {
    const inTok = nanoRows.reduce((s, r) => s + (r.nanoRes.usage.inputTokens || r.nanoRes.usage.promptTokens || 0), 0);
    const outTok = nanoRows.reduce((s, r) => s + (r.nanoRes.usage.outputTokens || r.nanoRes.usage.completionTokens || 0), 0);
    console.log(`nano custo: in=${inTok} out=${outTok} tok · ~US$${((inTok * 0.028 + outTok * 0.042) / 1e6).toFixed(6)} (ordem de grandeza)`);
  }

  // ── checks (ponytail: uma verificação runnable pro núcleo não-trivial) ────────────────────
  const listing = rows.find((r) => r.pl.kind === 'search');
  if (listing) {
    console.assert(listing.crushTok < listing.base, 'crusher deveria encolher listagem');
    console.assert(listing.crushed.includes('typescript') || listing.crushed.includes('vite'), 'crusher deve preservar 1 exemplo real');
    console.log(`\ncheck: crusher na listagem ${listing.base}→${listing.crushTok} tok (${pct(listing.crushTok, listing.base)}), exemplo preservado ✓`);
    console.log(`      (nota: ganho modesto — shape-collapse precisa de repetição; nomes de pacote distintos = formas distintas)`);
  }
  const code = rows.find((r) => r.pl.kind === 'code');
  if (code) {
    console.assert(code.crushTok > code.base * 0.85, 'crusher NÃO deve destruir código (formas únicas)');
    console.log(`check: crusher no código ${code.base}→${code.crushTok} tok (${pct(code.crushTok, code.base)}) — ~intacto, como esperado ✓`);
  }

  // reversibilidade (DoD): store CCR local — resumo no contexto, original recuperável por hash
  const store = makeCCRStore();
  const big = listing?.pl.text ?? payloads[0].text;
  const hash = store.stash(big);
  const back = store.retrieve(hash);
  const reversible = back === big;
  console.assert(reversible, 'retrieve deve devolver o original byte-a-byte');
  console.log(`\nreversibilidade: original ${tokEst(big)} tok → stash(hash=${hash}) → retrieve → idêntico=${reversible} ✓`);
  console.log(`   (contexto do agente carrega só o hash + resumo; re-hidrata sob demanda — CCR in-process, sem proxy)`);
  store.dispose();
}

main().catch((e) => { console.error(e); process.exit(1); });
