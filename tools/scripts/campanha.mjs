#!/usr/bin/env node
/**
 * campanha.mjs — guardas determinísticos para campanhas branch-stack (ADR 0017).
 *
 * Comandos:
 *   validate <manifesto>
 *   state <manifesto>
 *   can-start <manifesto> <task-id>
 *   check-base <manifesto> <task-id>
 *   register-stack-base <manifesto> <task-id> [ref-ou-sha]
 *   register-review-base <manifesto> <task-id> [ref-ou-sha]
 *   check-review-base <manifesto> <task-id>
 *   can-finish <manifesto> <task-id>
 *
 * DOCS_ROOT e SUPERAPP_DIR existem para testes em repositórios descartáveis.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(process.env.DOCS_ROOT || path.join(__dirname, '..', '..'));
const codeRepo = path.resolve(process.env.SUPERAPP_DIR || path.join(docsRoot, '..', 'superapp'));
const SHA_RE = /^[0-9a-f]{40}$/i;
const PENDING = 'pending';

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
  return false;
};

const git = (args) => spawnSync('git', args, { cwd: codeRepo, encoding: 'utf8' });

function gitValue(args) {
  const result = git(args);
  return result.status === 0 ? result.stdout.trim() : null;
}

function branchExists(branch) {
  return git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).status === 0;
}

function resolveSha(ref) {
  if (!ref) return null;
  return gitValue(['rev-parse', ref]);
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === '' || value === 'null' || value === '~') return null;
  if (/^['"].*['"]$/.test(value)) return value.slice(1, -1);
  if (/^\d+$/.test(value)) return Number(value);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/** Parser intencionalmente pequeno para o schema fixo do manifesto; aceita LF/CRLF e BOM. */
export function parseManifest(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return null;

  const manifest = { tasks: [] };
  let inTasks = false;
  let currentTask = null;
  let inGates = false;

  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    const top = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (top) {
      inTasks = top[1] === 'tasks';
      currentTask = null;
      inGates = false;
      if (!inTasks) manifest[top[1]] = parseScalar(top[2]);
      continue;
    }

    if (!inTasks) continue;

    const taskStart = line.match(/^\s{2}-\s+id:\s*(.+)$/);
    if (taskStart) {
      currentTask = { id: parseScalar(taskStart[1]), gates: [] };
      manifest.tasks.push(currentTask);
      inGates = false;
      continue;
    }

    const field = line.match(/^\s{4}([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (currentTask && field) {
      inGates = field[1] === 'gates';
      if (!inGates) currentTask[field[1]] = parseScalar(field[2]);
      continue;
    }

    const gate = line.match(/^\s{6}-\s+(.+)$/);
    if (currentTask && inGates && gate) currentTask.gates.push(parseScalar(gate[1]));
  }

  return manifest;
}

function manifestPath(relativePath) {
  if (!relativePath) throw new Error('manifesto ausente');
  return path.resolve(docsRoot, relativePath);
}

function loadManifest(relativePath) {
  const absolute = manifestPath(relativePath);
  if (!fs.existsSync(absolute)) throw new Error(`manifesto não encontrado: ${absolute}`);
  const manifest = parseManifest(fs.readFileSync(absolute, 'utf8'));
  if (!manifest) throw new Error('frontmatter YAML não encontrado ou inválido');
  return { absolute, manifest };
}

function taskPath(taskId) {
  return path.join(docsRoot, 'tasks', `${taskId}.md`);
}

function taskFrontmatter(taskId) {
  const file = taskPath(taskId);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (field) fields[field[1]] = parseScalar(field[2].replace(/\s+#.*$/, ''));
  }
  return fields;
}

function taskStatus(taskId) {
  return taskFrontmatter(taskId)?.status ?? null;
}

function taskDependencies(taskId) {
  const raw = taskFrontmatter(taskId)?.dependencies;
  if (typeof raw !== 'string') return [];
  const json = raw.replace(/\s+#.*$/, '');
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return json.replace(/[\[\]"'\s]/g, '').split(',').filter(Boolean);
  }
}

function isShaOrPending(value) {
  return value === PENDING || (typeof value === 'string' && SHA_RE.test(value));
}

function validateManifest(manifest) {
  const errors = [];
  if (!manifest.campaign_id) errors.push('campaign_id ausente');
  if (!manifest.status) errors.push('status ausente');
  if (!Array.isArray(manifest.tasks) || manifest.tasks.length === 0) return [...errors, 'tasks vazio ou ausente'];

  const ids = new Set();
  const positions = new Map();
  for (const task of manifest.tasks) {
    if (!task.id) { errors.push('task sem id'); continue; }
    if (ids.has(task.id)) errors.push(`id duplicado: ${task.id}`);
    ids.add(task.id);
    if (!taskFrontmatter(task.id)) errors.push(`${task.id}: task inexistente ou sem frontmatter`);
    if (!task.base_ref) errors.push(`${task.id}: base_ref ausente`);
    if (!Number.isInteger(task.position)) errors.push(`${task.id}: position deve ser inteiro`);
    else if ([...positions.values()].includes(task.position)) errors.push(`${task.id}: position duplicada ${task.position}`);
    else positions.set(task.id, task.position);
    if (!Array.isArray(task.gates) || task.gates.length === 0) errors.push(`${task.id}: gates vazio`);

    if (task.predecessor) {
      if (!isShaOrPending(task.stack_base_sha)) errors.push(`${task.id}: stack_base_sha deve ser SHA ou pending`);
      if (!isShaOrPending(task.review_base_sha)) errors.push(`${task.id}: review_base_sha deve ser SHA ou pending`);
    } else {
      if (task.stack_base_sha !== null) errors.push(`${task.id}: task trunk deve ter stack_base_sha: null`);
      if (!isShaOrPending(task.review_base_sha)) errors.push(`${task.id}: review_base_sha deve ser SHA ou pending`);
      if (manifest.status === 'PRONTA' && task.review_base_sha === PENDING) {
        errors.push(`${task.id}: campanha PRONTA exige review_base_sha concreto para elo trunk`);
      }
    }
  }

  for (const task of manifest.tasks) {
    if (!task.predecessor) continue;
    if (!ids.has(task.predecessor)) errors.push(`${task.id}: predecessor ${task.predecessor} fora do manifesto`);
    if ((positions.get(task.predecessor) ?? Infinity) >= (positions.get(task.id) ?? -Infinity)) {
      errors.push(`${task.id}: position deve vir depois de ${task.predecessor}`);
    }
    if (!taskDependencies(task.id).includes(task.predecessor)) {
      errors.push(`${task.id}: dependencies não inclui predecessor ${task.predecessor}`);
    }
  }
  return errors;
}

function requireValid(relativePath) {
  const loaded = loadManifest(relativePath);
  const errors = validateManifest(loaded.manifest);
  if (errors.length) throw new Error(`manifesto inválido:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  return loaded;
}

function findTask(manifest, taskId) {
  const task = manifest.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error(`task ${taskId} não pertence à campanha ${manifest.campaign_id}`);
  return task;
}

function concreteSha(value, label) {
  if (!SHA_RE.test(value ?? '')) throw new Error(`${label} ainda está pending`);
  return value;
}

function updateTaskField(absolutePath, taskId, fieldName, value) {
  const original = fs.readFileSync(absolutePath, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const lines = original.replace(/\r\n/g, '\n').split('\n');
  let inFrontmatter = false;
  let currentTask = null;
  let updated = false;

  for (let index = 0; index < lines.length; index++) {
    if (lines[index] === '---') {
      if (!inFrontmatter) { inFrontmatter = true; continue; }
      break;
    }
    if (!inFrontmatter) continue;
    const taskStart = lines[index].match(/^\s{2}-\s+id:\s*(.+)$/);
    if (taskStart) currentTask = String(parseScalar(taskStart[1]));
    if (currentTask === taskId && new RegExp(`^\\s{4}${fieldName}:`).test(lines[index])) {
      lines[index] = `    ${fieldName}: ${value}`;
      updated = true;
      break;
    }
  }
  if (!updated) throw new Error(`${taskId}: campo ${fieldName} ausente no manifesto`);
  fs.writeFileSync(absolutePath, lines.join(eol), 'utf8');
}

function checkBranchBasedOn(branch, baseSha) {
  if (!branchExists(branch)) return fail(`branch ${branch} não existe`);
  const mergeBase = gitValue(['merge-base', baseSha, branch]);
  if (mergeBase !== baseSha) return fail(`${branch} não contém a base registrada ${baseSha.slice(0, 8)}`);
  return true;
}

function checkReviewBase(task) {
  const reviewBase = concreteSha(task.review_base_sha, `${task.id}.review_base_sha`);
  return checkBranchBasedOn(`task/${task.id}`, reviewBase);
}

function cmdValidate(relativePath) {
  const { manifest } = loadManifest(relativePath);
  const errors = validateManifest(manifest);
  if (errors.length) return fail(`validação falhou (${errors.length}):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  console.log(`✅ Manifesto válido: ${manifest.campaign_id} (${manifest.tasks.length} tasks)`);
  for (const task of [...manifest.tasks].sort((a, b) => a.position - b.position)) {
    console.log(`  ${task.position}. ${task.id} [${taskStatus(task.id)}] pred=${task.predecessor ?? 'none'}`);
  }
  return true;
}

function cmdState(relativePath) {
  const { manifest } = requireValid(relativePath);
  console.log(`Campanha: ${manifest.campaign_id} · ${manifest.status}`);
  for (const task of [...manifest.tasks].sort((a, b) => a.position - b.position)) {
    const status = taskStatus(task.id);
    const pred = task.predecessor ? `${task.predecessor}:${taskStatus(task.predecessor)}` : 'trunk';
    const branch = branchExists(`task/${task.id}`) ? resolveSha(`task/${task.id}`).slice(0, 8) : 'none';
    const stack = task.stack_base_sha === PENDING ? 'pending' : task.stack_base_sha?.slice(0, 8) ?? '-';
    const review = task.review_base_sha === PENDING ? 'pending' : task.review_base_sha?.slice(0, 8) ?? '-';
    console.log(`  ${task.position}. ${task.id} [${status}] pred=${pred} branch=${branch} stack=${stack} review=${review}`);
  }
}

function cmdRegisterBase(relativePath, taskId, kind, ref) {
  const { absolute, manifest } = requireValid(relativePath);
  const task = findTask(manifest, taskId);
  const field = kind === 'stack' ? 'stack_base_sha' : 'review_base_sha';
  const defaultRef = kind === 'stack' ? `task/${task.predecessor}` : (branchExists(`task/${taskId}`) ? gitValue(['merge-base', 'master', `task/${taskId}`]) : 'master');
  if (kind === 'stack' && !task.predecessor) throw new Error(`${taskId} não tem predecessor`);
  const sha = resolveSha(ref || defaultRef);
  if (!sha || !SHA_RE.test(sha)) throw new Error(`não foi possível resolver ${ref || defaultRef}`);
  updateTaskField(absolute, taskId, field, sha);
  console.log(`✅ ${taskId}.${field} = ${sha}`);
}

function cmdCheckBase(relativePath, taskId) {
  const { manifest } = requireValid(relativePath);
  const task = findTask(manifest, taskId);
  if (!task.predecessor) return checkReviewBase(task) && console.log(`✅ ${taskId}: base trunk válida`);
  const stackBase = concreteSha(task.stack_base_sha, `${taskId}.stack_base_sha`);
  const predecessorRef = `task/${task.predecessor}`;
  if (!branchExists(predecessorRef)) return fail(`branch ${predecessorRef} não existe`);
  const predecessorHead = resolveSha(predecessorRef);
  if (predecessorHead !== stackBase) {
    return fail(`${taskId}: base stale; registrado=${stackBase.slice(0, 8)} ${predecessorRef}=${predecessorHead.slice(0, 8)}`);
  }
  if (!checkBranchBasedOn(`task/${taskId}`, stackBase)) return false;
  console.log(`✅ ${taskId}: stack base coincide com ${predecessorRef}`);
  return true;
}

function cmdCanStart(relativePath, taskId) {
  const { manifest } = requireValid(relativePath);
  const task = findTask(manifest, taskId);
  const status = taskStatus(taskId);
  if (!['ready', 'draft:hardened', 'in_progress'].includes(status)) {
    return fail(`${taskId}: status ${status} não admite início de campanha`);
  }

  for (const dependency of taskDependencies(taskId)) {
    if (dependency === task.predecessor) continue;
    if (taskStatus(dependency) !== 'done') return fail(`${taskId}: dependência externa ${dependency} está ${taskStatus(dependency)}`);
  }

  if (task.predecessor) {
    const predecessorStatus = taskStatus(task.predecessor);
    if (!['review', 'in_review', 'done'].includes(predecessorStatus)) {
      return fail(`${taskId}: predecessor ${task.predecessor} deve estar review|in_review|done, está ${predecessorStatus}`);
    }
    if (!cmdCheckBase(relativePath, taskId)) return false;
    console.log(`✅ ${taskId} pode iniciar em modo staged${status === 'draft:hardened' ? '; promova para ready antes de start' : ''}`);
    return true;
  }

  if (!checkReviewBase(task)) return false;
  console.log(`✅ ${taskId} pode iniciar sobre trunk`);
  return true;
}

function cmdCheckReviewBase(relativePath, taskId) {
  const { manifest } = requireValid(relativePath);
  const task = findTask(manifest, taskId);
  if (!checkReviewBase(task)) return false;
  console.log(`✅ ${taskId}: review_base_sha é ancestral da branch; diff: git diff ${task.review_base_sha}..task/${taskId}`);
  return true;
}

function cmdCanFinish(relativePath, taskId) {
  const { manifest } = requireValid(relativePath);
  const task = findTask(manifest, taskId);
  if (taskStatus(taskId) !== 'in_progress') return fail(`${taskId}: finish exige in_progress`);
  for (const dependency of taskDependencies(taskId)) {
    if (taskStatus(dependency) !== 'done') return fail(`${taskId}: dependência ${dependency} está ${taskStatus(dependency)}, não done`);
  }
  if (!checkReviewBase(task)) return false;
  console.log(`✅ ${taskId} pode finish: deps done, branch transplantada e review base válida`);
  return true;
}

function main() {
  const [command, relativePath, taskId, ref] = process.argv.slice(2);
  try {
    switch (command) {
      case 'validate': return cmdValidate(relativePath);
      case 'state': return cmdState(relativePath);
      case 'can-start': return cmdCanStart(relativePath, taskId);
      case 'check-base': return cmdCheckBase(relativePath, taskId);
      case 'register-stack-base': return cmdRegisterBase(relativePath, taskId, 'stack', ref);
      case 'register-review-base': return cmdRegisterBase(relativePath, taskId, 'review', ref);
      case 'check-review-base': return cmdCheckReviewBase(relativePath, taskId);
      case 'can-finish': return cmdCanFinish(relativePath, taskId);
      default:
        return fail('uso: campanha.mjs <validate|state|can-start|check-base|register-stack-base|register-review-base|check-review-base|can-finish> <manifesto> [task-id] [ref-ou-sha]');
    }
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

main();
