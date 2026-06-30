#!/usr/bin/env node
/**
 * saldo — consulta saldo dos provedores upstream (DeepSeek, OpenRouter etc.).
 *
 * Uso:
 *   node tools/scripts/saldo.mjs [--json]
 *
 * --json:   emite array JSON no stdout
 * default:  tabela "provider | saldo | ok"
 *
 * Lê chaves do .env (mesmo loader do headroom-proxies.mjs).
 * Provedores sem endpoint retornam available_usd: null.
 * Erro/timeout/chave ausente → ok:false (nunca lança).
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

// ---- .env loader (adaptado do headroom-proxies.mjs) --------------------------
function loadEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// ---- adaptadores -------------------------------------------------------------
const ADAPTERS = {
  deepseek: {
    keyEnv: 'DEEPSEEK_API_KEY',
    async fetch(key) {
      const res = await fetch('https://api.deepseek.com/user/balance', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const usd = body.balance_infos?.find(b => b.currency === 'USD');
      return { available_usd: usd ? parseFloat(usd.total_balance) : null, currency: 'USD' };
    },
  },
  openrouter: {
    keyEnv: 'OPENROUTER_API_KEY',
    async fetch(key) {
      const res = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const c = body.data;
      const available = c.total_credits - (c.total_usage || 0);
      return { available_usd: parseFloat(available.toFixed(4)), currency: 'USD' };
    },
  },
  opencode: {
    keyEnv: 'OPENCODE_API_KEY',
    async fetch() {
      return { available_usd: null, currency: 'USD' };
    },
    note: 'sem endpoint público de saldo',
  },
  'opencode-ent': {
    keyEnv: 'OPENCODE_ENT_API_KEY',
    async fetch() {
      return { available_usd: null, currency: 'USD' };
    },
    note: 'sem endpoint público de saldo',
  },
};

// ---- fetch balance -----------------------------------------------------------
async function fetchBalance(name) {
  const adapter = ADAPTERS[name];
  if (!adapter) return { provider: name, key_env: null, available_usd: null, currency: null, ok: false, note: 'adaptador desconhecido' };

  const key = process.env[adapter.keyEnv];
  if (!key) {
    return { provider: name, key_env: adapter.keyEnv, available_usd: null, currency: null, ok: false, note: `chave ${adapter.keyEnv} ausente (.env)` };
  }

  try {
    const result = await adapter.fetch(key);
    return {
      provider: name,
      key_env: adapter.keyEnv,
      available_usd: result.available_usd,
      currency: result.currency || null,
      ok: true,
      note: adapter.note || null,
    };
  } catch (err) {
    return {
      provider: name,
      key_env: adapter.keyEnv,
      available_usd: null,
      currency: null,
      ok: false,
      note: err.message || 'erro desconhecido',
    };
  }
}

// ---- main --------------------------------------------------------------------
const jsonMode = process.argv.includes('--json');

loadEnv();

const results = await Promise.all(Object.keys(ADAPTERS).map(fetchBalance));

if (jsonMode) {
  process.stdout.write(JSON.stringify(results) + '\n');
} else {
  console.log('provider        | saldo (USD) | ok');
  console.log('----------------|-------------|----');
  for (const r of results) {
    const saldo = r.available_usd != null ? r.available_usd.toFixed(2) : 'n/d';
    console.log(`${r.provider.padEnd(16)}| ${saldo.padStart(11)} | ${r.ok ? '✓' : '✗'}`);
  }
}
