#!/usr/bin/env node
/**
 * scripts/audit-portfolio.mjs
 *
 * Validador automático de alinhamento do portfólio de agentes/skills.
 * Verifica:
 *  1. Se todos os comandos em formato `/nome-da-skill` citados no CLAUDE.md existem no diretório `.claude/skills/`.
 *  2. Se os agentes/revisores citados no CLAUDE.md (como subagents ou agentes de papel) existem em `.claude/agents/`.
 *  3. Se todas as skills e agentes existentes em `.claude/` estão documentados ou citados no CLAUDE.md.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { argv, cwd } from 'node:process';

const ROOT = process.cwd();
const CLAUDE_MD_PATH = join(ROOT, 'CLAUDE.md');
const CLAUDE_DIR = join(ROOT, '.claude');
const AGENTS_DIR = join(CLAUDE_DIR, 'agents');
const SKILLS_DIR = join(CLAUDE_DIR, 'skills');

if (!existsSync(CLAUDE_MD_PATH)) {
  console.error('❌ CLAUDE.md não encontrado na raiz.');
  process.exit(1);
}

// 1. Carregar agentes reais do diretório .claude/agents
const actualAgents = new Set();
const agentFiles = {};
if (existsSync(AGENTS_DIR)) {
  const files = readdirSync(AGENTS_DIR);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const name = basename(file, '.md');
      actualAgents.add(name);
      agentFiles[name] = file;
    }
  }
}

// 2. Carregar skills reais do diretório .claude/skills
const actualSkills = new Set();
if (existsSync(SKILLS_DIR)) {
  const subdirs = readdirSync(SKILLS_DIR);
  for (const subdir of subdirs) {
    const skillPath = join(SKILLS_DIR, subdir, 'SKILL.md');
    if (existsSync(skillPath)) {
      actualSkills.add(subdir);
    }
  }
}

// 3. Ler CLAUDE.md
const claudeContent = readFileSync(CLAUDE_MD_PATH, 'utf8');

let errorsCount = 0;
let warningsCount = 0;

console.log('🔍 Iniciando auditoria do portfólio de Skills e Agentes...\n');

// --- Validação 1: Referências a Skills (/command) no CLAUDE.md ---
// Regex para encontrar `/command` mas ignorar caminhos
const skillMatches = claudeContent.matchAll(/(?:\s|^)\/([a-zA-Z0-9_-]+)(?:\b)/g);
const skillsReferenced = new Set();

for (const match of skillMatches) {
  const command = match[1];
  // Ignorar falsos positivos óbvios que não são comandos
  if (['tasks', 'meta-tasks', 'status', 'ver', 'NNN', 'action', 'taskId', 'SeuNome', 'mensagem'].includes(command)) {
    continue;
  }
  skillsReferenced.add(command);
}

console.log('Checking referenced skills in CLAUDE.md:');
for (const skill of skillsReferenced) {
  if (!actualSkills.has(skill)) {
    console.error(`❌ ERRO: Skill /${skill} referenciado em CLAUDE.md não existe em .claude/skills/`);
    errorsCount++;
  } else {
    console.log(`  ✓ Skill /${skill} encontrado em .claude/skills/`);
  }
}

// --- Validação 2: Referências a Agentes em CLAUDE.md ---
// Em vez de regex solto para a palavra "agente" (que causa falsos positivos em português),
// checaremos se os nomes dos agentes reais (ou com underscores) aparecem no CLAUDE.md,
// e se há referências a subagents que não existem.
const subagentMatches = claudeContent.matchAll(/subagent\s+([a-zA-Z0-9_-]+)/gi);
const subagentsReferenced = new Set();
for (const match of subagentMatches) {
  subagentsReferenced.add(match[1].toLowerCase());
}

console.log('\nChecking referenced subagents in CLAUDE.md:');
for (const subagent of subagentsReferenced) {
  const possibleNames = [subagent, subagent.replace(/_/g, '-')];
  const found = possibleNames.find(n => actualAgents.has(n));
  
  if (!found) {
    console.error(`❌ ERRO: Subagent "${subagent}" referenciado em CLAUDE.md não existe em .claude/agents/`);
    errorsCount++;
  } else {
    console.log(`  ✓ Subagent "${subagent}" mapeia para .claude/agents/${agentFiles[found]}`);
  }
}

// --- Validação 3: Cobertura mútua (Avisos de Skills e Agentes não referenciados) ---
console.log('\nChecking for undocumented/unreferenced skills:');
for (const skill of actualSkills) {
  // Checar se a skill é citada em CLAUDE.md (como /skill ou skill)
  const isCited = claudeContent.includes(`/${skill}`) || claudeContent.includes(skill);
  if (!isCited) {
    console.warn(`⚠️ AVISO: Skill "${skill}" existe em .claude/skills/ mas não é citado/referenciado em CLAUDE.md`);
    warningsCount++;
  } else {
    console.log(`  ✓ Skill "${skill}" está documentada/citada no CLAUDE.md`);
  }
}

console.log('\nChecking for undocumented/unreferenced agents:');
for (const agent of actualAgents) {
  const nameWithUnderscore = agent.replace(/-/g, '_');
  const isCited = claudeContent.includes(agent) || claudeContent.includes(nameWithUnderscore);
  
  if (!isCited) {
    console.warn(`⚠️ AVISO: Agente "${agent}" existe em .claude/agents/ mas não é citado/referenciado em CLAUDE.md`);
    warningsCount++;
  } else {
    console.log(`  ✓ Agente "${agent}" está documentado/citado no CLAUDE.md`);
  }
}

console.log('\n' + '='.repeat(40));
console.log(`Auditoria concluída com: ${errorsCount} erro(s) e ${warningsCount} aviso(s).`);
console.log('='.repeat(40));

if (errorsCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
