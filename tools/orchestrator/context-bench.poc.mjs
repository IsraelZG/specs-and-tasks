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
// Token count: chars/4 (padrão OpenAI) em TODAS as colunas — consistente (fix M1).
// Headroom-ai (via 1) reporta contagem REAL do SDK próprio: a Δhr usa SDK.before como
// denominador (não mistura chars/4 com contagem real como antes).

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
const FIXTURES = path.join(HERE);
function loadPayloads() {
  const p = [];
  // (a) código — output de readFile de um .mjs real
  const code = path.join(DOCS, 'tools/scripts/orquestrar.mjs');
  if (fs.existsSync(code)) p.push({ name: 'código (.mjs)', kind: 'code', text: fs.readFileSync(code, 'utf8') });
  // (b) prosa densa — output de readFile de um caderno ~30KB (real, não sintético)
  const prose = path.join(DOCS, 'docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md');
  const proseAlt = path.join(DOCS, 'docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md');
  const proseFile = fs.existsSync(prose) ? prose : proseAlt;
  if (fs.existsSync(proseFile)) p.push({ name: 'prosa (.md)', kind: 'text', text: fs.readFileSync(proseFile, 'utf8') });
  // (c) listagem — fixture versionada (determinística, não walk(node_modules))
  const listFix = path.join(FIXTURES, 'fixtures', 'listing-fixture.txt');
  if (fs.existsSync(listFix)) {
    const listing = fs.readFileSync(listFix, 'utf8');
    if (listing.length > 100) p.push({ name: 'listagem (ls -R)', kind: 'search', text: listing });
  }
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
const NANO_CAP = 24000; // chars enviados ao nano (~6k tok) — cap p/ evitar estourar/gastar
// Pipeline end-to-end (fix M2): stash full → slice cap → nano → summary + marker → ratio vs full input
async function nanoPreprocess(model, payload, store) {
  const fullText = payload.text;
  const fullTok = tokEst(fullText);
  // stash full original no CCR store local (recuperável por retrieve) e registra o hash
  const hash = store.stash(fullText);
  const sent = fullText.slice(0, NANO_CAP);
  const t0 = Date.now();
  const { text, usage } = await generateText({
    model,
    prompt: `Você é um filtro de contexto barato. Condense o OUTPUT DE TOOL abaixo para o mínimo que ` +
      `um agente de código precisaria para responder "isto contém X?" sem perder itens distintos. ` +
      `Para listagens: agrupe por pacote/prefixo e dê contagens. Para logs: só linhas únicas/erros. ` +
      `Responda só o condensado, sem preâmbulo.\n\n<<<\n${sent}\n>>>`,
  });
  const marker = `\n[+ material completo (${fullTok} tok) stashed em hash=${hash}; retrieve() p/ re-hidratar]`;
  const pipelineOut = text + marker;
  return { text: pipelineOut, ms: Date.now() - t0, usage, fullTok, sentTok: tokEst(sent), hash };
}

// ── VIA 4 (ORQ-14, gated): kompress-v2-base ML in-process via ONNX Runtime (sem proxy/Python) ─
// ModernBERT token-classification: score P(keep)∈[0,1] por token → threshold → dropa filler.
// Extractivo (preserva tokens originais). Ativa só com ORQ14_ONNX=1 + modelo em cache (274MB).
// ORQ-15: multi-modelo + EP selecionável (ORQ14_EP=dml → DirectML/Adreno; default cpu).
// Modelos: kompress (ModernBERT, score direto [1,seq], janela 2048) e llmlingua2 (mBERT
// multilíngue, logits [1,seq,2] → softmax idx1 = P(keep), janela 512, agregação por PALAVRA
// via vocab.txt '##' — a receita do LLMLingua-2 que evita corromper subwords).
const ONNX_EP = (process.env.ORQ14_EP || 'cpu').split(',');
const ONNX_MODELS = {
  kompress: {
    path: path.join(os.homedir(), '.cache', 'orq14-kompress', 'kompress-int8-wo.onnx'),
    tok: 'chopratejas/kompress-v2-base', window: 2048, kind: 'prob-direct',
  },
  llmlingua2: {
    path: path.join(os.homedir(), '.cache', 'orq15-llmlingua2', 'model.onnx'),
    tok: 'KatawaDead/llmlingua-2-bert-base-multilingual-cased-meetingbank-onnx-int8',
    vocab: path.join(os.homedir(), '.cache', 'orq15-llmlingua2', 'vocab.txt'),
    window: 510, kind: 'logits-2class', wordAgg: true,
  },
};
let _ort = null;
const _sessions = new Map(); // name -> {session, tokenizer, vocab?}
async function onnxInit(name) {
  if (_sessions.has(name)) return _sessions.get(name);
  const cfg = ONNX_MODELS[name];
  if (!cfg || !fs.existsSync(cfg.path)) return null;
  if (!_ort) _ort = await import('onnxruntime-node');
  const { env, AutoTokenizer } = await import('@huggingface/transformers');
  env.cacheDir = path.join(os.homedir(), '.cache', 'orq15-hf');
  env.allowLocalModels = false;
  const tokenizer = await AutoTokenizer.from_pretrained(cfg.tok);
  let session;
  try {
    session = await _ort.InferenceSession.create(cfg.path, { executionProviders: ONNX_EP });
  } catch (e) {
    console.log(`  [${name}] EP ${ONNX_EP} FALHOU: ${String(e.message).split('\n')[0].slice(0, 140)}`);
    return null;
  }
  const vocab = cfg.vocab ? fs.readFileSync(cfg.vocab, 'utf8').split('\n') : null;
  const entry = { session, tokenizer, vocab, cfg };
  _sessions.set(name, entry);
  return entry;
}
async function onnxVia(name, text, threshold) {
  const { session, tokenizer, vocab, cfg } = await onnxInit(name);
  const enc = await tokenizer(text);
  let ids = Array.from(enc.input_ids.data).map(Number);
  const windowed = ids.length > cfg.window;
  if (windowed) ids = ids.slice(0, cfg.window);
  const seq = ids.length;
  const feeds = {};
  for (const inp of session.inputNames) {
    if (inp.includes('mask')) feeds[inp] = new _ort.Tensor('int64', BigInt64Array.from(ids.map(() => 1n)), [1, seq]);
    else if (inp.includes('type')) feeds[inp] = new _ort.Tensor('int64', new BigInt64Array(seq), [1, seq]);
    else feeds[inp] = new _ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, seq]);
  }
  const t0 = Date.now();
  const res = await session.run(feeds);
  const ms = Date.now() - t0;
  const out0 = res[session.outputNames[0]];
  const data = out0.data;
  // P(keep) por token
  const probs = new Array(seq);
  if (cfg.kind === 'prob-direct') {
    for (let i = 0; i < seq; i++) probs[i] = Number(data[i]);
  } else { // logits [1,seq,2] → softmax, idx1 = preserve (convenção LLMLingua-2)
    for (let i = 0; i < seq; i++) {
      const a = Number(data[i * 2]), b = Number(data[i * 2 + 1]);
      const m = Math.max(a, b);
      probs[i] = Math.exp(b - m) / (Math.exp(a - m) + Math.exp(b - m));
    }
  }
  // seleção: por palavra (agrega prob média das subwords '##') ou por token
  let kept = [];
  if (cfg.wordAgg && vocab) {
    const words = [];
    for (let i = 0; i < seq; i++) {
      const t = vocab[ids[i]] ?? '';
      if (t.startsWith('##') && words.length) words[words.length - 1].push(i);
      else words.push([i]);
    }
    for (const w of words) {
      const p = w.reduce((s, i) => s + probs[i], 0) / w.length;
      if (p >= threshold) kept.push(...w.map((i) => ids[i]));
    }
  } else {
    for (let i = 0; i < seq; i++) if (probs[i] >= threshold) kept.push(ids[i]);
  }
  const out = tokenizer.decode(kept, { skip_special_tokens: true }).replace(/\s+/g, ' ').trim();
  return { outTok: tokEst(out), keptPct: Math.round(100 * kept.length / seq), ms, windowed, seq, sample: out.slice(0, 200) };
}

// ── VIA 1: headroom-ai (tenta o proxy; reporta se está no ar) ──────────────────────────────
// O router do Headroom PROTEGE código e a mensagem-user corrente; só comprime tool_result/rag/
// turnos velhos. Então apresentamos o payload como RESULTADO DE TOOL (o caso real de um agente),
// dentro de um mini-transcript, senão a medição é enganosa (protege → 0%).
async function headroomVia(payload) {
  // verifica se o proxy responde antes de tentar compress — evita timeout longo (B2)
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 3000);
    await fetch('http://localhost:8787/', { signal: ctrl.signal });
    clearTimeout(tid);
  } catch {
    return { ok: false, proxyDown: true, error: 'proxy Headroom não respondeu em localhost:8787' };
  }
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
// NOTA: CCR coberto aqui é local (próprio, in-process) — NÃO headroom-ai proxy.
function localStore() {
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

  const ccrStore = localStore(); // store CCR local compartilhado entre nano pipeline e reversibilidade check

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
      try { nanoRes = await nanoPreprocess(nano, pl, ccrStore); } catch (e) { nanoRes = { err: String(e.message || e).split('\n')[0] }; }
    }

    rows.push({ pl, base, crushTok, crushed, hr, nanoRes });
  }

  // tabela
  const pct = (a, b) => (b === 0 ? '—' : `${Math.round((1 - a / b) * 100)}%`);
  console.log('payload'.padEnd(20), 'base'.padStart(7), 'nativo'.padStart(9), '  Δnat', 'headroom'.padStart(10), 'nano-out'.padStart(9), '  Δnano  nano-ms');
  console.log('-'.repeat(92));
  for (const r of rows) {
    const hrCell = r.hr.ok ? `${r.hr.after}(${pct(r.hr.after, r.hr.before)})` : `proxy✗`;
    const nanoTok = r.nanoRes && r.nanoRes.text ? tokEst(r.nanoRes.text) : null;
    const nanoCell = nanoTok != null ? String(nanoTok) : (r.nanoRes?.err ? 'err' : '—');
    // Δnano contra o INPUT INTEIRO (fullTok = base), não só contra o cap enviado (fix M2)
    const nanoPct = nanoTok != null ? pct(nanoTok, r.base) : '—';
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
  const hrOk = rows[0].hr.ok;
  const hrDown = rows[0].hr.proxyDown;
  const hrStatus = hrOk
    ? `✓ proxy respondeu — transforms=${rows[0].hr.transforms?.join(',') || '—'}`
    : hrDown
    ? `✗ proxy não disponível (${rows[0].hr.error}) — SDK TS é cliente HTTP, requer serviço em :8787`
    : `✗ erro na compressão (${rows[0].hr.error})`;
  console.log('headroom-ai:', hrStatus);

  // nano custo (deepseek-chat: US$0.27/M in, US$0.28/M out — ordem de grandeza, verificar pricing atual)
  const nanoRows = rows.filter((r) => r.nanoRes?.usage);
  if (nanoRows.length) {
    const inTok = nanoRows.reduce((s, r) => s + (r.nanoRes.usage.inputTokens || r.nanoRes.usage.promptTokens || 0), 0);
    const outTok = nanoRows.reduce((s, r) => s + (r.nanoRes.usage.outputTokens || r.nanoRes.usage.completionTokens || 0), 0);
    console.log(`nano custo: in=${inTok} out=${outTok} tok · ~US$${((inTok * 0.27 + outTok * 0.28) / 1e6).toFixed(6)} (ordem de grandeza)`);
    // mostra o quanto o nano viu do total por payload
    for (const r of nanoRows) {
      const seen = r.nanoRes.sentTok;
      const full = r.nanoRes.fullTok || r.base;
      console.log(`  nano pipeline: ${r.pl.name}: viu ${seen} tok de ${full} total (${Math.round(seen/full*100)}%) — ${r.nanoRes.hash ? `hash=${r.nanoRes.hash}` : ''}`);
    }
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

  // ── VIA 4/5 (ORQ-14/15, gated): modelos ML ONNX in-process — kompress + llmlingua2 ───────
  if (process.env.ORQ14_ONNX) {
    console.log(`\n=== VIA 4/5 · ONNX in-process (EP=${ONNX_EP.join(',')}) — kompress (token) vs llmlingua2 (palavra, multilíngue) ===`);
    console.log('modelo'.padEnd(12), 'payload'.padEnd(18), 'base'.padStart(7), ' thr', 'keep%'.padStart(6), 'out-tok'.padStart(8), '   Δ', 'ms'.padStart(6));
    console.log('-'.repeat(76));
    for (const name of Object.keys(ONNX_MODELS)) {
      if (!(await onnxInit(name))) { console.log(`(${name}: modelo ausente ou EP falhou — pulado)`); continue; }
      for (const r of rows) {
        for (const thr of [0.5, 0.7, 0.85]) { // 0.85 mantém comparabilidade com o gate do ORQ-14
          try {
            const o = await onnxVia(name, r.pl.text, thr);
            console.log(
              name.padEnd(12), r.pl.name.padEnd(18), String(r.base).padStart(7), thr.toFixed(2),
              `${o.keptPct}%`.padStart(6), String(o.outTok).padStart(8),
              pct(o.outTok, r.base).padStart(5), String(o.ms).padStart(6),
              o.windowed ? `(janela ${o.seq})` : '',
            );
          } catch (e) { console.log(name.padEnd(12), r.pl.name.padEnd(18), `thr=${thr} err: ${String(e.message).slice(0, 60)}`); }
        }
      }
    }
    console.log('-'.repeat(76));
    // amostra de qualidade (corrupção de subword): prosa @0.7 nos dois modelos
    const prose = rows.find((r) => r.pl.kind === 'text');
    if (prose) {
      for (const name of Object.keys(ONNX_MODELS)) {
        if (!_sessions.has(name)) continue;
        const o = await onnxVia(name, prose.pl.text, 0.7);
        console.log(`\n[amostra ${name} @0.7] ${o.sample}…`);
      }
    }
  } else {
    console.log('\n(vias ONNX desativadas — rode com ORQ14_ONNX=1; EP via ORQ14_EP=dml|cpu; ver ORQ-14/15)');
  }

  // reversibilidade (DoD): store CCR local — resumo no contexto, original recuperável por hash
  const big = listing?.pl.text ?? payloads[0].text;
  const hash = ccrStore.stash(big);
  const back = ccrStore.retrieve(hash);
  const reversible = back === big;
  console.assert(reversible, 'retrieve deve devolver o original byte-a-byte');
  console.log(`\nlocalRetrieve(hash): original ${tokEst(big)} tok → stash(hash=${hash}) → retrieve → idêntico=${reversible} ✓`);
  console.log(`   (CCR coberto: local (próprio, in-process) — não headroom-ai proxy)`);
  console.log(`   (NOTA: reversibilidade do headroom-ai proxy via r.ccrHashes[] server-side não foi testada — ver Decisão E no ADR)`);
  ccrStore.dispose();
}

main().catch((e) => { console.error(e); process.exit(1); });
