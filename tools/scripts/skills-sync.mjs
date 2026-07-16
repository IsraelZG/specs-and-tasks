#!/usr/bin/env node
// skills-sync — fonte canônica de skills é .claude/skills/; .agents/skills/ é ESPELHO gerado.
//
// PROBLEMA (auditoria 2026-07-14): as duas superfícies divergiram em silêncio — o executar-task
// do .agents ainda mandava `git commit` direto no Docs (regra de paralelismo violada) e tinha
// identidade hardcoded "Antigravity"; o gate 2c do qa-review nasceu no .agents e não existia no
// .claude. Cópia manual não se sustenta.
//
// REGRA: edite skills SEMPRE em .claude/skills/<nome>/SKILL.md (canon). Depois:
//   node tools/scripts/skills-sync.mjs --check            # lista divergências (exit 1 se houver)
//   node tools/scripts/skills-sync.mjs --write <nome...>  # regrava o espelho a partir do canon
//   node tools/scripts/skills-sync.mjs --write --all      # regrava todos os compartilhados
//
// O espelho recebe o texto do canon com o swap de termos por superfície (CLAUDE.md → AGENTS.md),
// e o --check compara após normalizar (mesmo swap + CRLF), então diferenças intencionais de
// superfície não acusam drift. Skills exclusivas de uma superfície são só informadas.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CANON = path.join(root, '.claude', 'skills');
const MIRROR = path.join(root, '.agents', 'skills');

const swap = (s) => s.replace(/CLAUDE\.md/g, 'AGENTS.md');
const norm = (s) => s.replace(/\r\n/g, '\n').trimEnd();

const listSkills = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'SKILL.md')))
    .map((d) => d.name);

const canonSkills = new Set(listSkills(CANON));
const mirrorSkills = new Set(listSkills(MIRROR));
const shared = [...canonSkills].filter((s) => mirrorSkills.has(s)).sort();

const args = process.argv.slice(2);
if (args[0] === '--check' || args.length === 0) {
  const diverged = [];
  for (const s of shared) {
    const c = norm(swap(fs.readFileSync(path.join(CANON, s, 'SKILL.md'), 'utf8')));
    const m = norm(fs.readFileSync(path.join(MIRROR, s, 'SKILL.md'), 'utf8'));
    if (c !== m) diverged.push(s);
  }
  const onlyCanon = [...canonSkills].filter((s) => !mirrorSkills.has(s)).sort();
  const onlyMirror = [...mirrorSkills].filter((s) => !canonSkills.has(s)).sort();
  if (onlyCanon.length) console.log(`só no canon (.claude): ${onlyCanon.join(', ')}`);
  if (onlyMirror.length) console.log(`só no espelho (.agents): ${onlyMirror.join(', ')}`);
  if (diverged.length) {
    console.error(`❌ DRIFT em ${diverged.length} skill(s): ${diverged.join(', ')}`);
    console.error(`   Corrija no canon e rode: node tools/scripts/skills-sync.mjs --write ${diverged.join(' ')}`);
    process.exit(1);
  }
  console.log(`✅ ${shared.length} skills compartilhadas em sincronia`);
} else if (args[0] === '--write') {
  const targets = args.includes('--all') ? shared : args.slice(1).filter((a) => a !== '--all');
  if (!targets.length) { console.error('uso: skills-sync.mjs --write <nome...> | --write --all'); process.exit(1); }
  for (const s of targets) {
    if (!canonSkills.has(s)) { console.error(`❌ ${s} não existe no canon`); process.exit(1); }
    const out = swap(fs.readFileSync(path.join(CANON, s, 'SKILL.md'), 'utf8'));
    fs.mkdirSync(path.join(MIRROR, s), { recursive: true });
    fs.writeFileSync(path.join(MIRROR, s, 'SKILL.md'), out, 'utf8');
    console.log(`• espelhado: ${s}`);
  }
} else {
  console.error('uso: skills-sync.mjs [--check] | --write <nome...> | --write --all');
  process.exit(1);
}
