#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

const REGISTRY_DIR = path.join(root, 'tasks', '.orchestrator');
const LOCK_DIR = path.join(REGISTRY_DIR, '.lock');
const DATA_DIR = path.join(REGISTRY_DIR, 'data');
const LOCK_MAX_AGE_MS = 120_000;

function displayActor(actor) {
  if (!actor) return null;
  const i = actor.indexOf(':');
  return i === -1 ? actor : actor.slice(i + 1).trim() || actor;
}

export function loadConfig(configPath) {
  const p = configPath || path.join(root, 'tasks', 'orquestrador.config.json');
  if (!fs.existsSync(p)) throw new Error(`Config não encontrado: ${p}`);
  const raw = fs.readFileSync(p, 'utf8');
  const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const config = JSON.parse(stripped);
  const required = ['max_concurrent', 'roster', 'priority'];
  for (const key of required) {
    if (config[key] === undefined) throw new Error(`Campo obrigatório ausente: ${key}`);
  }
  if (!config.roster?.by_level) throw new Error('roster.by_level ausente');
  if (!Array.isArray(config.priority)) throw new Error('priority deve ser array');
  return config;
}

export function fetchLedger(ledgerFile) {
  if (ledgerFile) {
    if (!fs.existsSync(ledgerFile)) throw new Error(`Ledger file não encontrado: ${ledgerFile}`);
    return JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
  }
  const ledgerPath = path.join(root, 'tools', 'scripts', 'ledger.mjs');
  const out = execFileSync('node', [ledgerPath, '--json', '--idle'], { encoding: 'utf8', cwd: root });
  return JSON.parse(out.trim());
}

export function fetchBalances() {
  try {
    const saldoPath = path.join(root, 'tools', 'scripts', 'saldo.mjs');
    const out = execFileSync('node', [saldoPath, '--json'], { encoding: 'utf8', cwd: root, timeout: 15000 });
    return JSON.parse(out.trim());
  } catch {
    return [];
  }
}

function modelName(full) {
  const i = full.lastIndexOf('/');
  return i === -1 ? full : full.slice(i + 1);
}

export function selectModel(task, config, brokeProviders) {
  const level = task.capacity_target || 'sonnet';
  let pool = [...(config.roster.by_level?.[level] || [])];
  if (pool.length === 0) return { model: null, reason: `sem modelo para nível ${level}` };

  if (task.ui === true) {
    const rule = config.routing?.frontend_qa;
    if (rule) {
      for (const cap of (rule.requires || [])) {
        const capPool = config.roster.by_capability?.[cap] || [];
        if (capPool.length === 0) return { model: null, reason: `sem modelo p/ capacidade ${cap}` };
        pool = pool.filter(m => capPool.includes(m));
        if (pool.length === 0) return { model: null, reason: `sem modelo p/ capacidade ${cap}` };
      }
    }
  }

  if (task.next_action === 'review' && task.worker_model) {
    const workerName = modelName(task.worker_model);
    const workerDisplay = displayActor(task.worker_model);
    const antiPool = pool.filter(m => {
      const mn = modelName(m);
      return mn !== workerName && mn !== workerDisplay;
    });
    if (antiPool.length > 0) pool = antiPool;
  }

  if (brokeProviders && brokeProviders.length > 0) {
    const providerAccounts = config.provider_accounts || {};
    const filtered = pool.filter(m => {
      const prefix = m.split('/')[0];
      const account = providerAccounts[prefix] || prefix;
      return !brokeProviders.includes(account);
    });
    if (filtered.length === 0) return { model: null, reason: 'todos provedores sem saldo' };
    pool = filtered;
  }

  const chosen = pool[0];
  return { model: chosen, reason: `${level} / ${chosen.split('/')[0]}` };
}

export function planDispatch(ledger, config, balances, _runningCount) {
  const { max_concurrent = 5, circuit_breaker = {}, providers_balance = {} } = config;
  const rc = _runningCount !== undefined ? _runningCount : ledger.filter(t => t.busy).length;
  const slots = Math.max(0, max_concurrent - rc);

  const skipBelow = providers_balance.skip_below_usd ?? 0;
  const brokeProviders = balances
    .filter(b => b.ok === false || (b.available_usd != null && b.available_usd < skipBelow))
    .map(b => b.provider);

  const idleActions = new Set(config.priority || ['review', 'rework', 'work', 'harden', 'promote']);
  const candidates = ledger
    .filter(t => !t.busy && idleActions.has(t.next_action) && t.deps_ok !== false)
    .map(t => ({ ...t }));

  const prioIndex = Object.fromEntries((config.priority || []).map((a, i) => [a, i]));
  candidates.sort((a, b) => {
    const pa = prioIndex[a.next_action] ?? 99;
    const pb = prioIndex[b.next_action] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });

  const result = { planned: [], skipped: [], slots, running: rc };

  for (const task of candidates) {
    if (result.planned.length >= slots) {
      result.skipped.push({ id: task.id, reason: `teto de concorrência (${slots} slots)` });
      continue;
    }

    const maxCycles = circuit_breaker.max_review_cycles ?? 3;
    const reworkActions = ['review', 'rework'];
    if (reworkActions.includes(task.next_action) && (task.rework_count || 0) >= maxCycles) {
      result.skipped.push({ id: task.id, reason: `circuit breaker (${task.rework_count} ciclos)` });
      continue;
    }

    const sel = selectModel(task, config, brokeProviders);
    if (sel.model === null) {
      result.skipped.push({ id: task.id, reason: sel.reason });
      continue;
    }

    const cwd = (task.next_action === 'work' || task.next_action === 'rework')
      ? 'C:\\Dev2026\\superapp'
      : root;

    result.planned.push({
      id: task.id,
      action: task.next_action,
      role: task.next_action,
      model: sel.model,
      cwd,
      reason: sel.reason,
      rework_count: task.rework_count || 0,
    });
  }

  return result;
}

function renderTable(plan) {
  const lines = [];
  lines.push(`Slots disponíveis: ${plan.slots} (max_concurrent - ${plan.running} em execução)`);
  lines.push('');
  if (plan.planned.length === 0) {
    lines.push('Plano de despacho: (nenhuma task a despachar)');
  } else {
    lines.push('Plano de despacho:');
    const hId = 'ID', hAction = 'Ação', hModel = 'Modelo', hReason = 'Motivo';
    const maxId = Math.max(hId.length, ...plan.planned.map(p => p.id.length));
    const maxAction = Math.max(hAction.length, ...plan.planned.map(p => p.action.length));
    const maxModel = Math.max(hModel.length, ...plan.planned.map(p => p.model.length));
    const maxReason = Math.max(hReason.length, ...plan.planned.map(p => p.reason.length));
    const fmt = `  ${hId.padEnd(maxId)}  ${hAction.padEnd(maxAction)}  ${hModel.padEnd(maxModel)}  ${hReason.padEnd(maxReason)}`;
    lines.push(fmt);
    const sep = `  ${'-'.repeat(maxId)}  ${'-'.repeat(maxAction)}  ${'-'.repeat(maxModel)}  ${'-'.repeat(maxReason)}`;
    lines.push(sep);
    for (const p of plan.planned) {
      lines.push(`  ${p.id.padEnd(maxId)}  ${p.action.padEnd(maxAction)}  ${p.model.padEnd(maxModel)}  ${p.reason.padEnd(maxReason)}`);
    }
  }
  if (plan.skipped.length > 0) {
    lines.push('');
    lines.push('Pulados:');
    for (const s of plan.skipped) {
      lines.push(`  ${s.id}: ${s.reason}`);
    }
  }
  return lines.join('\n');
}

export function pruneRegistry() {
  fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  const files = fs.readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.json'));
  const alive = [];
  for (const file of files) {
    const filePath = path.join(REGISTRY_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (typeof data.pid !== 'number') continue; // not a pidfile — skip
      if (processAlive(data.pid)) {
        alive.push(data);
      } else {
        fs.unlinkSync(filePath);
      }
    } catch {
      fs.unlinkSync(filePath);
    }
  }
  return alive;
}

function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function runningCount() {
  return pruneRegistry().length;
}

export function withLock(fn) {
  fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  try {
    fs.mkdirSync(LOCK_DIR);
  } catch (err) {
    if (err.code === 'EEXIST') {
      const stat = fs.statSync(LOCK_DIR);
      const age = Date.now() - stat.mtimeMs;
      if (age < LOCK_MAX_AGE_MS) {
        console.log('dispatch em andamento (lock ativo)');
        return;
      }
      fs.rmSync(LOCK_DIR, { recursive: true, force: true });
      fs.mkdirSync(LOCK_DIR);
    } else {
      throw err;
    }
  }
  try {
    fn();
  } finally {
    try { fs.rmSync(LOCK_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

export function assemblePrompt(action, id, model) {
  const config = loadConfig();
  const skillName = config.action_skill?.[action];
  if (!skillName) throw new Error(`ação desconhecida: ${action}`);

  const skillPath = path.join(root, '.claude', 'skills', skillName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) throw new Error(`skill não encontrada: ${skillPath}`);

  let content = fs.readFileSync(skillPath, 'utf8');
  content = content.replace(/\$ARGUMENTS/g, id);

  const preambulo = [
    `Você é um agente rodando o modelo "${model}". Em TODO comando manage-task.mjs/fila.mjs use`,
    `"${model}" como sua identidade (<EU>/<SeuNome>) — para review use "agile_reviewer:${model}".`,
    `Execute a tarefa abaixo seguindo estas instruções à risca:`,
    `---`,
  ].join('\n');

  return `${preambulo}\n${content}`;
}

export function spawnAgent({ id, action, role, model, cwd }) {
  const dataDir = path.join(DATA_DIR, id);
  fs.mkdirSync(dataDir, { recursive: true });

  const prompt = assemblePrompt(action, id, model);
  const proc = spawn('crush', [
    'run',
    '-m', model,
    '--quiet',
    '--cwd', cwd,
    '--data-dir', dataDir,
    prompt,
  ], {
    detached: true,
    stdio: 'ignore',
    cwd: root,
  });
  proc.unref();

  const pidfile = {
    pid: proc.pid,
    model,
    role,
    started: new Date().toISOString(),
    cwd,
  };
  fs.writeFileSync(path.join(REGISTRY_DIR, `${id}.json`), JSON.stringify(pidfile));

  console.log(`spawned ${id}: action=${action} model=${model} pid=${proc.pid}`);
  return proc.pid;
}

export function removePidfile(id) {
  const p = path.join(REGISTRY_DIR, `${id}.json`);
  try { fs.unlinkSync(p); } catch { /* ignore */ }
}

export function dispatchOnce(ledgerFile) {
  const config = loadConfig();
  const ledger = fetchLedger(ledgerFile);
  const balances = fetchBalances();
  const alive = pruneRegistry();
  const rc = alive.length;

  const plan = planDispatch(ledger, config, balances, rc);
  console.log(renderTable(plan));

  for (const item of plan.planned) {
    spawnAgent(item);
  }

  if (plan.planned.length === 0 && plan.skipped.length > 0) {
    console.log('nenhum agente spawnado');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const once = args.includes('--once');
  const onFinishIdx = args.indexOf('--on-finish');
  const onFinish = onFinishIdx !== -1;
  const onFinishId = onFinish ? args[onFinishIdx + 1] || null : null;

  let ledgerFile = null;
  const lfIdx = args.indexOf('--ledger-file');
  if (lfIdx !== -1 && lfIdx + 1 < args.length) ledgerFile = args[lfIdx + 1];

  if (once) {
    withLock(() => dispatchOnce(ledgerFile));
    return;
  }

  if (onFinish) {
    if (!onFinishId) {
      console.error('--on-finish requer <id>');
      process.exit(1);
    }
    removePidfile(onFinishId);
    console.log(`slot liberado: ${onFinishId}`);
    withLock(() => dispatchOnce(ledgerFile));
    return;
  }

  if (dryRun) {
    const config = loadConfig();
    const ledger = fetchLedger(ledgerFile);
    const balances = fetchBalances();
    const alive = pruneRegistry();
    const plan = planDispatch(ledger, config, balances, alive.length);
    console.log(renderTable(plan));
    return;
  }

  console.log('Uso: node tools/scripts/orquestrar.mjs [--dry-run] [--ledger-file <path>] [--once] [--on-finish <id>]');
  console.log('  --dry-run        Imprime o plano de despacho (sem efeito colateral)');
  console.log('  --ledger-file    Usa arquivo JSON como fixture de ledger (testes)');
  console.log('  --once           Despacha agentes respeitando max_concurrent');
  console.log('  --on-finish <id> Remove pidfile e re-despacha');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  main().catch(err => {
    console.error('Erro:', err.message);
    process.exit(1);
  });
}
