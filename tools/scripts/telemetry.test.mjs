/**
 * telemetry.test.mjs — functional tests for lib/telemetry.mjs + relatorio.mjs.
 *
 * Strategy:
 * - BLOCKER-1: test via subprocess (helper) to catch path bugs in lib/telemetry.mjs
 * - Other behavior: test relatorio.mjs directly from raw JSONL fixtures
 * - MAJOR-2: verify _system.jsonl for events without task ID
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const telemetryDir = path.join(root, 'tasks', '.telemetry');
const helperScript = path.join(__dirname, 'lib', 'telemetry-test-helper.mjs');
const relatorioScript = path.join(__dirname, 'relatorio.mjs');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
}

function run(name, fn) {
  console.log(`\n${name}`);
  try { fn(); } catch (err) { failed++; console.error(`  ❌ EXCEÇÃO: ${err.message}`); }
}

function cleanup(taskIds) {
  for (const id of taskIds) {
    const f = path.join(telemetryDir, `${id}.jsonl`);
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
}

/** Write raw JSONL events to a task file (for controlled-timestamp tests). */
function writeEvents(taskId, events) {
  const file = path.join(telemetryDir, `${taskId}.jsonl`);
  fs.mkdirSync(telemetryDir, { recursive: true });
  const lines = events.map(e => JSON.stringify({ task: taskId, host: 'test', os: 'test', node: 'v20', exitCode: 0, actor: 'test', ...e }) + '\n').join('');
  fs.writeFileSync(file, lines, 'utf8');
  return file;
}

/** Run relatorio.mjs --json and return parsed result, or null on failure. */
function relatorioJson(taskId) {
  try {
    const out = execFileSync('node', [relatorioScript, taskId, '--json'], { encoding: 'utf8', cwd: root });
    return JSON.parse(out.trim());
  } catch (e) {
    console.error(`  ⚠ relatorio --json ${taskId} failed: ${e.message}`);
    return null;
  }
}

/** Emit via the ACTUAL lib in a subprocess — catches BLOCKER-1 path bugs. */
function emitViaLib(events) {
  execFileSync('node', [helperScript, JSON.stringify(events)], { cwd: root, encoding: 'utf8' });
}

// ---- Case 1: BLOCKER-1 — emit() grava no path correto ----------------------
run('Caso 1 — emit() via lib real grava em tasks/.telemetry/ (BLOCKER-1 fix)', () => {
  const TEST_ID = 'P02-RW-B1';
  cleanup([TEST_ID]);

  emitViaLib([
    { task: TEST_ID, phase: 'gate.build', cmd: 'pnpm gate', wallMs: 5000, exitCode: 0, actor: 'gate' },
    { task: TEST_ID, phase: 'gate.test', cmd: 'pnpm test', wallMs: 8000, exitCode: 0, actor: 'gate' },
    { task: TEST_ID, phase: 'manage-task.finish', cmd: 'manage-task finish', wallMs: 200, exitCode: 0, actor: 'deepseek' },
  ]);

  const file = path.join(telemetryDir, `${TEST_ID}.jsonl`);
  assert(fs.existsSync(file), `File exists: ${file}`);

  // BLOCKER-1 verification: must NOT exist in tools/tasks/
  const wrongPath = path.join(root, 'tools', 'tasks', '.telemetry', `${TEST_ID}.jsonl`);
  assert(!fs.existsSync(wrongPath), `NOT at wrong path: ${wrongPath}`);

  const content = fs.readFileSync(file, 'utf8').trim();
  const lines = content ? content.split('\n') : [];
  assert(lines.length === 3, `3 events (got ${lines.length})`);

  for (let i = 0; i < lines.length; i++) {
    const evt = JSON.parse(lines[i]);
    assert(evt.task === TEST_ID, `Event ${i + 1}: task=${evt.task}`);
    assert(typeof evt.ts === 'string', `Event ${i + 1}: has ts`);
  }

  // relatorio.mjs can read these events
  const out = execFileSync('node', [relatorioScript, TEST_ID], { encoding: 'utf8', cwd: root });
  assert(out.includes('Fases'), 'relatorio shows phases from real lib events');

  cleanup([TEST_ID]);
});

// ---- Case 2: fail-silent — emit never throws -------------------------------
run('Caso 2 — emit() fail-silent (null, empty, {})', () => {
  const TEST_ID = 'P02-RW-FS';
  cleanup([TEST_ID, '_system']);

  // emit(null) via helper — should not crash the subprocess
  let threw = false;
  try { execFileSync('node', [helperScript, '[null]'], { cwd: root, encoding: 'utf8' }); }
  catch { threw = true; }
  assert(!threw, 'emit(null) does not crash subprocess');

  // emit({}) via helper
  threw = false;
  try { execFileSync('node', [helperScript, '[{}]'], { cwd: root, encoding: 'utf8' }); }
  catch { threw = true; }
  assert(!threw, 'emit({}) does not crash subprocess');

  // emit({}) should go to _system.jsonl (no task)
  const sysFile = path.join(telemetryDir, '_system.jsonl');
  assert(fs.existsSync(sysFile), '_system.jsonl created for emits without task');

  cleanup(['_system']);
});

// ---- Case 3: relatorio.mjs generates complete report ------------------------
run('Caso 3 — relatorio.mjs gera esqueleto completo', () => {
  const TEST_ID = 'P02-RW-R3';
  cleanup([TEST_ID]);

  const base = new Date('2026-07-17T10:00:00Z').getTime();
  writeEvents(TEST_ID, [
    { ts: new Date(base).toISOString(), phase: 'gate.build', wallMs: 5000, cmd: 'pnpm gate' },
    { ts: new Date(base + 15000).toISOString(), phase: 'gate.test', wallMs: 8000, cmd: 'pnpm test' },
    { ts: new Date(base + 35000).toISOString(), phase: 'gate.lint', wallMs: 3000, cmd: 'pnpm lint' },
    { ts: new Date(base + 50000).toISOString(), phase: 'manage-task.finish', wallMs: 200, cmd: 'finish' },
  ]);

  const out = execFileSync('node', [relatorioScript, TEST_ID], { encoding: 'utf8', cwd: root });
  assert(out.includes('# Relatório de Execução'), 'Report header');
  assert(out.includes('Fases'), 'Fases section');
  assert(out.includes('Totais por Camada'), 'Totais section');
  assert(out.includes('Gaps'), 'Gaps section');
  assert(out.includes('gate'), 'Gate layer appears');
  assert(out.includes('transição'), 'Transição layer appears');

  const outT = execFileSync('node', [relatorioScript, TEST_ID, '--tabela'], { encoding: 'utf8', cwd: root });
  assert(outT.includes('Fases'), '--tabela Fases');
  assert(!outT.includes('Totais'), '--tabela omits Totais');

  const parsed = relatorioJson(TEST_ID);
  assert(parsed !== null, '--json parses');
  if (parsed) {
    assert(parsed.id === TEST_ID, `--json id=${parsed.id}`);
    assert(parsed.events.length === 4, `--json 4 events (got ${parsed.events.length})`);
    assert(parsed.gaps.length === 3, `--json 3 gaps (got ${parsed.gaps.length})`);
    assert(parsed.totals.gate, 'Gate totals present');
    assert(parsed.totals.gate.count === 3, `Gate count=3 (got ${parsed.totals.gate.count})`);
  }

  cleanup([TEST_ID]);
});

// ---- Case 4: relatorio without JSONL ----------------------------------------
run('Caso 4 — relatorio.mjs sem JSONL → mensagem clara', () => {
  const out = execFileSync('node', [relatorioScript, 'NONEXISTENT-99'], { encoding: 'utf8', cwd: root });
  assert(out.includes('Sem dados de telemetria'), 'Clear message for missing data');

  const parsed = relatorioJson('NONEXISTENT-99');
  assert(parsed !== null && parsed.empty === true, '--json empty flag');
  assert(parsed !== null && parsed.events.length === 0, '--json empty events');
});

// ---- Case 5: gap computation correctness ------------------------------------
run('Caso 5 — gaps são corretamente computados', () => {
  const TEST_ID = 'P02-RW-G5';
  cleanup([TEST_ID]);

  const base = new Date('2026-07-17T10:00:00Z').getTime();
  writeEvents(TEST_ID, [
    { ts: new Date(base).toISOString(), phase: 'gate.build', wallMs: 5000 },
    { ts: new Date(base + 15000).toISOString(), phase: 'gate.test', wallMs: 8000 },
    { ts: new Date(base + 35000).toISOString(), phase: 'gate.lint', wallMs: 6000 },
  ]);

  const parsed = relatorioJson(TEST_ID);
  assert(parsed !== null, '--json parses');
  if (parsed) {
    assert(parsed.events.length === 3, '3 events');
    assert(parsed.gaps.length === 2, '2 gaps');
    assert(Math.abs(parsed.gaps[0].gapMs - 15000) < 100, `Gap 1 ~15000ms (${parsed.gaps[0].gapMs})`);
    assert(Math.abs(parsed.gaps[1].gapMs - 20000) < 100, `Gap 2 ~20000ms (${parsed.gaps[1].gapMs})`);
  }

  cleanup([TEST_ID]);
});

// ---- Case 6: events without task ID → _system.jsonl (MAJOR-2) ---------------
run('Caso 6 — eventos sem task ID vão para _system.jsonl (MAJOR-2 fix)', () => {
  cleanup(['_system']);

  emitViaLib([
    { phase: 'fila.flush', cmd: 'fila flush', wallMs: 250, exitCode: 0, actor: 'fila' },
    { phase: 'orquestrar.dispatch', cmd: 'orquestrar --once', wallMs: 500, exitCode: 0, actor: 'system' },
  ]);

  const sysFile = path.join(telemetryDir, '_system.jsonl');
  assert(fs.existsSync(sysFile), '_system.jsonl exists');

  const content = fs.readFileSync(sysFile, 'utf8').trim();
  const lines = content.split('\n').filter(Boolean);
  assert(lines.length >= 2, `At least 2 events in _system (got ${lines.length})`);

  // relatorio can read _system
  const out = execFileSync('node', [relatorioScript, '_system'], { encoding: 'utf8', cwd: root });
  assert(out.includes('Relatório de Execução'), 'relatorio handles _system');

  cleanup(['_system']);
});

// ---- Case 7: full pipeline simulation ---------------------------------------
run('Caso 7 — simulação completa (gate + manage-task + fila)', () => {
  const TEST_ID = 'P02-RW-F7';
  cleanup([TEST_ID]);

  const base = new Date('2026-07-17T10:00:00Z').getTime();
  writeEvents(TEST_ID, [
    { ts: new Date(base + 0).toISOString(), phase: 'manage-task.start', wallMs: 150, actor: 'deepseek' },
    { ts: new Date(base + 5000).toISOString(), phase: 'worktree.claim', wallMs: 2000, actor: 'system' },
    { ts: new Date(base + 15000).toISOString(), phase: 'gate.build', wallMs: 5000, exitCode: 0, actor: 'gate' },
    { ts: new Date(base + 25000).toISOString(), phase: 'gate.test', wallMs: 8000, exitCode: 0, actor: 'gate' },
    { ts: new Date(base + 40000).toISOString(), phase: 'gate.lint', wallMs: 3000, exitCode: 0, actor: 'gate' },
    { ts: new Date(base + 52000).toISOString(), phase: 'manage-task.finish', wallMs: 180, actor: 'deepseek' },
    { ts: new Date(base + 60000).toISOString(), phase: 'fila.add', wallMs: 50, actor: 'deepseek' },
  ]);

  const out = execFileSync('node', [relatorioScript, TEST_ID], { encoding: 'utf8', cwd: root });
  assert(out.includes('Fases'), 'Has phases');
  assert(out.includes('Totais por Camada'), 'Has totals');
  assert(out.includes('Gaps'), 'Has gaps');
  assert(out.includes('setup'), 'Setup layer (worktree)');
  assert(out.includes('gate'), 'Gate layer');
  assert(out.includes('transição'), 'Transição layer');

  const parsed = relatorioJson(TEST_ID);
  assert(parsed !== null, '--json parses');
  if (parsed) {
    assert(parsed.events.length === 7, `7 events (got ${parsed.events.length})`);
    const layers = Object.keys(parsed.totals);
    assert(layers.length >= 3, `At least 3 layers: ${layers.join(', ')}`);
  }

  cleanup([TEST_ID]);
});

// ---- Results ----------------------------------------------------------------
console.log(`\n---`);
console.log(`Resultados: ${passed} passaram, ${failed} falharam`);
if (failed > 0) process.exit(1);
