#!/usr/bin/env node
/**
 * saude.mjs — Manifesto de saúde da master
 *
 * Roda `turbo run build lint test` no superapp e gera:
 *   - tasks/.saude.json  — JSON por pacote×dimensão
 *   - tasks/SAUDE.md      — tabela markdown legível
 *   - --preflight <pkg>  — exit ≠ 0 se pacote tem dívida basal
 *
 * Tooling-do-controle: vive em tools/scripts/ (Docs), roda contra C:\Dev2026\superapp.
 * Uso:  node tools/scripts/saude.mjs
 *       node tools/scripts/saude.mjs --preflight @plataforma/core
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Strip ANSI escape codes from turbo output
const stripAnsi = s => s.replace(/\u001b\[[0-9;]*m/g, '');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const tasksDir = path.join(root, 'tasks');
const superappDir = 'C:\\Dev2026\\superapp';
const jsonPath = path.join(tasksDir, '.saude.json');
const mdPath = path.join(tasksDir, 'SAUDE.md');

const DIMS = ['build', 'lint', 'test'];
// Matches turbo output line: @scope/pkg:task: content
const PKG_DIM_RE = /^(@[a-z0-9_-]+\/[a-z0-9_-]+):(build|lint|test):/im;
// Matches turbo summary: @scope/pkg#task  (Failed: line & ERROR lines)
const PKG_DIM_HASH_RE = /(@[a-z0-9_-]+\/[a-z0-9_-]+)#(build|lint|test)/g;

// ---- helpers -----------------------------------------------------------------
function resolveTurbo() {
  // On Windows, use the .cmd wrapper (Node's execSync can't run Unix #! scripts)
  const cmdPath = path.join(superappDir, 'node_modules', '.bin', 'turbo.cmd');
  if (fs.existsSync(cmdPath)) return cmdPath;
  const binPath = path.join(superappDir, 'node_modules', '.bin', 'turbo');
  if (fs.existsSync(binPath)) return binPath;
  return 'npx.cmd --yes turbo';
}

const TURBO_CMD = resolveTurbo();

function getPackages() {
  const raw = execSync('pnpm ls -r --depth=-1 --json', { cwd: superappDir, encoding: 'utf8', stdio: 'pipe' });
  const list = JSON.parse(raw);
  return list.filter(p => p.name !== 'superapp').map(p => p.name);
}

function runTurbo() {
  const cmd = `"${TURBO_CMD}" run build lint test --output-logs=errors-only`;
  let stdout = '', stderr = '';
  try {
    stdout = execSync(cmd, {
      cwd: superappDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 50 * 1024 * 1024,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', exitCode: err.status || 1 };
  }
}

function parseTurboOutput(stdout, stderr) {
  const combined = stripAnsi(stdout + '\n' + stderr);
  const lines = combined.split('\n');
  const red = new Set();     // "pkg|dim"
  const errors = {};         // "pkg|dim" → first meaningful error line

  // Parse individual task output lines: @scope/pkg:build: content
  for (const line of lines) {
    const m = line.match(PKG_DIM_RE);
    if (!m) continue;
    const pkg = m[1];
    const dim = m[2];
    if (!DIMS.includes(dim)) continue;

    const key = `${pkg}|${dim}`;
    red.add(key);

    if (!errors[key]) {
      // Capture first non-boilerplate content after the prefix
      const content = line.replace(/^@?[a-z0-9_\/-]+:(build|lint|test):\s*/, '').trim();
      if (content && !content.startsWith('>') && !content.startsWith('$ ') && !/^cache (hit|miss)/.test(content) && !/^\.\.\.$/.test(content)) {
        errors[key] = content;
      }
    }
  }

  // Also parse ERROR/Failed lines with # separator: @scope/pkg#task
  for (const line of lines) {
    const matches = [...line.matchAll(PKG_DIM_HASH_RE)];
    for (const m of matches) {
      const pkg = m[1];
      const dim = m[2];
      if (!DIMS.includes(dim)) continue;
      const key = `${pkg}|${dim}`;
      red.add(key);
      if (!errors[key]) {
        errors[key] = line.replace(/.*@[a-z0-9_\/-]+#[a-z]+\s*:\s*/i, '').trim().substring(0, 200) || '(comando falhou)';
      }
    }
  }

  return { red, errors };
}

function buildManifest(packages, red, errors, sha) {
  const pkgs = {};
  for (const pkg of packages) {
    const entry = {};
    for (const dim of DIMS) {
      const key = `${pkg}|${dim}`;
      entry[dim] = red.has(key) ? 'red' : 'green';
    }
    const redDims = DIMS.filter(d => entry[d] === 'red');
    if (redDims.length > 0) {
      entry.errors = Object.fromEntries(
        redDims.map(d => [d, errors[`${pkg}|${d}`] || '(erro — veja saída completa)'])
      );
    }
    pkgs[pkg] = entry;
  }
  return { sha, generatedAt: new Date().toISOString(), packages: pkgs };
}

function renderMd(manifest) {
  const { packages, sha, generatedAt } = manifest;
  const pkgs = Object.keys(packages).sort();
  let md = `# Manifesto de Saúde da Master\n\n`;
  md += `> Gerado em: ${generatedAt}  ·  SHA: \`${sha}\`\n\n`;
  md += `| Pacote | ${DIMS.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(' | ')} |\n`;
  md += `|${DIMS.map(() => '---|').join('')}\n`;

  for (const pkg of pkgs) {
    const entry = packages[pkg];
    const cells = DIMS.map(d => entry[d] === 'red' ? '🔴' : '🟢');
    md += `| ${pkg} | ${cells.join(' | ')} |\n`;
  }

  const hasRed = pkgs.some(p => DIMS.some(d => packages[p][d] === 'red'));
  if (hasRed) {
    md += `\n## Falhas\n\n`;
    for (const pkg of pkgs) {
      for (const dim of DIMS) {
        if (packages[pkg][dim] === 'red') {
          const err = packages[pkg].errors?.[dim] || '(sem detalhes)';
          md += `- **${pkg} — ${dim}:** ${err}\n`;
        }
      }
    }
  }

  md += `\n## Sumário\n\n`;
  const total = pkgs.length;
  const redCount = pkgs.filter(p => DIMS.some(d => packages[p][d] === 'red')).length;
  md += `- 🟢 Verde: ${total - redCount}  ·  🔴 Vermelho: ${redCount}  ·  Total: ${total}\n`;
  return md;
}

// ---- CLI ---------------------------------------------------------------------
const args = process.argv.slice(2);

// --preflight
const preflightIdx = args.indexOf('--preflight');
if (preflightIdx !== -1 && args.length > preflightIdx + 1) {
  const pkg = args[preflightIdx + 1];
  if (!fs.existsSync(jsonPath)) {
    console.error(`[saude] manifesto não encontrado. Rode sem --preflight primeiro.`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const entry = manifest.packages[pkg];
  if (!entry) {
    console.error(`[saude] pacote '${pkg}' não encontrado no manifesto.`);
    process.exit(1);
  }
  const redDims = DIMS.filter(d => entry[d] === 'red');
  if (redDims.length > 0) {
    console.error(`[saude] ⛔ não comece sem decidir — dívida basal em ${redDims.join(', ')}\n   ${pkg}: ${redDims.map(d => `${d}=${entry.errors?.[d] || 'red'}`).join(', ')}`);
    process.exit(2);
  }
  console.log(`[saude] ✅ ${pkg} — tudo verde`);
  process.exit(0);
}

// Normal mode
async function main() {
  console.log(`[saude] turbo: ${TURBO_CMD}`);
  console.log(`[saude] SHA: ...`);
  console.log(`[saude] Obtendo lista de pacotes...`);

  const sha = execSync('git rev-parse HEAD', { cwd: superappDir, encoding: 'utf8', stdio: 'pipe' }).trim();
  const packages = getPackages();

  console.log(`[saude] SHA: ${sha}`);
  console.log(`[saude] Pacotes: ${packages.length}`);
  console.log(`[saude] Rodando turbo run build lint test...`);

  const { stdout, stderr } = runTurbo();
  const { red, errors } = parseTurboOutput(stdout, stderr);
  const manifest = buildManifest(packages, red, errors, sha);

  // Write JSON
  fs.mkdirSync(tasksDir, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`[saude] ✅ .saude.json escrito`);

  // Write MD
  const md = renderMd(manifest);
  fs.writeFileSync(mdPath, md, 'utf-8');
  console.log(`[saude] ✅ SAUDE.md escrito`);

  // Print summary
  const redCount = packages.filter(p => DIMS.some(d => manifest.packages[p][d] === 'red')).length;
  const greenCount = packages.length - redCount;
  console.log(`\n[saude] Resumo: 🟢 ${greenCount}  🔴 ${redCount}  ·  ${packages.length} pacotes`);

  if (redCount > 0) {
    for (const pkg of packages) {
      for (const dim of DIMS) {
        if (manifest.packages[pkg][dim] === 'red') {
          const err = manifest.packages[pkg].errors?.[dim] || '(sem detalhes)';
          console.error(`[saude] 🔴 ${pkg}:${dim} → ${err}`);
        }
      }
    }
  }

  // Exit code reflects actual health, not just turbo I/O exit
  process.exit(redCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[saude] ERRO:', err.message);
  process.exit(1);
});
