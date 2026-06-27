#!/usr/bin/env node
// headroom-deepseek.mjs — start Headroom proxy routing to DeepSeek via any-llm.
//
// Usage:
//   node scripts/headroom-deepseek.mjs [port]            # foreground (Ctrl+C kills it)
//   node scripts/headroom-deepseek.mjs [port] --detach   # background; prints pid, exits
//   node scripts/headroom-deepseek.mjs --stop            # kills any running headroom
//
// Loads .env from <repo>/.env. Sets DEEPSEEK_API_KEY + OPENAI_API_KEY in the
// spawned process (any-llm's `openai` provider reads OPENAI_API_KEY; we mirror
// the value so future anyllm providers / fallbacks work too).
//
// Stdlib only — no deps. Cross-platform (Win/Mac/Linux).

import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync, openSync, closeSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = resolve(__dirname, '..', '.env');
const LOG_DIR = process.env.TEMP || process.env.TMPDIR || tmpdir();
const LOG_OUT = join(LOG_DIR, 'headroom-out.log');
const LOG_ERR = join(LOG_DIR, 'headroom-err.log');

// Locate headroom.exe — prefer the known Windows path, fall back to PATH lookup.
const HEADROOM_CANDIDATES = [
  'C:\\Users\\israe\\AppData\\Roaming\\Python\\Python313\\Scripts\\headroom.exe',
  'C:/Users/israe/AppData/Roaming/Python/Python313/Scripts/headroom.exe',
  'headroom',  // PATH
];

function findHeadroom() {
  for (const c of HEADROOM_CANDIDATES) {
    if (c.includes('\\') || c.includes('/')) {
      if (existsSync(c)) return c;
    } else {
      // PATH lookup via `where` on Windows / `which` elsewhere
      try {
        const cmd = process.platform === 'win32' ? 'where' : 'which';
        const out = execFileSync(cmd, [c], { encoding: 'utf8' }).trim().split('\n')[0].trim();
        if (out) return out;
      } catch { /* not in PATH */ }
    }
  }
  return null;
}

// ---- arg parsing -----------------------------------------------------------
const argv = process.argv.slice(2);
const stop = argv.includes('--stop');
const detach = argv.includes('--detach');
const port = (argv.find((a) => /^\d{2,5}$/.test(a))) || '8787';

// ---- stop mode -------------------------------------------------------------
if (stop) {
  const cmd = process.platform === 'win32' ? 'taskkill' : 'pkill';
  const args = process.platform === 'win32' ? ['/F', '/IM', 'headroom.exe'] : ['-f', 'headroom'];
  try { execFileSync(cmd, args, { stdio: 'inherit' }); console.log('stopped headroom'); }
  catch { console.log('no headroom running'); }
  process.exit(0);
}

// ---- load .env -------------------------------------------------------------
if (!existsSync(ENV_FILE)) {
  console.error(`.env not found: ${ENV_FILE}`);
  process.exit(1);
}
const env = { ...process.env };
for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !m[1].startsWith('#')) env[m[1]] = m[2];
}
if (!env.DEEPSEEK_API_KEY) {
  console.error('DEEPSEEK_API_KEY not set in .env');
  process.exit(1);
}

// ---- locate headroom --------------------------------------------------------
const headroom = findHeadroom();
if (!headroom) {
  console.error('headroom binary not found. Tried:');
  for (const c of HEADROOM_CANDIDATES) console.error('  - ' + c);
  console.error('Install with: pip install "headroom-ai[proxy]"');
  process.exit(1);
}

// ---- spawn -----------------------------------------------------------------
const childArgs = [
  'proxy',
  '--backend', 'anyllm',
  '--anyllm-provider', 'openai',
  '--openai-api-url', 'https://api.deepseek.com/v1',
  '--host', '127.0.0.1',
  '--port', port,
];

if (detach) {
  // Detached: redirect stdout/stderr to log files so the child can write freely.
  const outFd = openSync(LOG_OUT, 'w');
  const errFd = openSync(LOG_ERR, 'w');
  const child = spawn(headroom, childArgs, {
    env,
    detached: true,
    stdio: ['ignore', outFd, errFd],
    windowsHide: true,
  });
  closeSync(outFd);
  closeSync(errFd);
  child.unref();
  console.log(`headroom started detached: pid=${child.pid} port=${port}`);
  console.log(`logs:  ${LOG_OUT}`);
  console.log(`       ${LOG_ERR}`);
  console.log(`stop:  node scripts/headroom-deepseek.mjs --stop`);
  process.exit(0);
}

// Foreground: child shares terminal; Ctrl+C cascades.
const child = spawn(headroom, childArgs, {
  env,
  stdio: 'inherit',
  windowsHide: true,
});

const shutdown = (sig) => {
  if (!child.killed) child.kill(sig);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGHUP', () => shutdown('SIGHUP'));

child.on('exit', (code, sig) => {
  if (sig) console.error(`\n[headroom-deepseek] killed by ${sig}`);
  process.exit(code ?? (sig ? 1 : 0));
});
