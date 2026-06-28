import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { TaskService } from '../services/task.service.js';
import { WaveRunner, type EscalationReason, type TaskOutcome } from '../runner/runner.js';
import type { AgentAdapter, AgentRunOptions, AgentRunResult } from '../runner/agent-adapter.js';

let tasksDir: string;
let taskService: TaskService;
let verifyLog: Array<{ ok: boolean }> = [];
let verifyCalls = 0;
let confirmLog: Array<{ action: string; taskId: string; result: boolean }> = [];
let escalateLog: Array<{ taskId: string; reason: EscalationReason; detail: string }> = [];
let logLines: string[] = [];

function makeFakeAdapter(
  handler: (opts: AgentRunOptions) => Promise<AgentRunResult>,
): AgentAdapter {
  return {
    run: (opts: AgentRunOptions) => handler(opts),
  };
}

function workerAdapter(behavior: 'normal' | 'noop' | 'timeout' | 'crash' = 'normal') {
  return async (opts: AgentRunOptions): Promise<AgentRunResult> => {
    if (behavior === 'noop') return { exit: 0, timedOut: false, tail: '' };
    if (behavior === 'timeout') return { exit: null, timedOut: true, tail: '' };
    if (behavior === 'crash') return { exit: 1, timedOut: false, tail: 'worker crashed' };
    // normal: simula worker que faz start → finish
    await taskService.transition(opts.taskId, 'start', 'worker-agent');
    await taskService.transition(opts.taskId, 'finish', 'worker-agent', 'trabalho concluído');
    return { exit: 0, timedOut: false, tail: 'worker ok' };
  };
}

function reviewerAdapter(behavior: 'approve' | 'request_changes' | 'timeout' | 'crash' = 'approve') {
  return async (opts: AgentRunOptions): Promise<AgentRunResult> => {
    if (behavior === 'timeout') return { exit: null, timedOut: true, tail: '' };
    if (behavior === 'crash') return { exit: 1, timedOut: false, tail: 'reviewer crashed' };
    if (behavior === 'request_changes') {
      await taskService.transition(opts.taskId, 'request_changes', 'agile_reviewer', 'precisa melhorar cobertura');
      return { exit: 0, timedOut: false, tail: 'changes requested' };
    }
    // approve
    await taskService.transition(opts.taskId, 'approve', 'agile_reviewer', 'LGTM');
    return { exit: 0, timedOut: false, tail: 'approved' };
  };
}

function routeAdapter(role: 'worker' | 'reviewer', workerBehavior: string, reviewerBehavior: string) {
  return async (opts: AgentRunOptions): Promise<AgentRunResult> => {
    if (opts.role === 'worker') {
      const fn = workerAdapter(workerBehavior as 'normal' | 'noop' | 'timeout' | 'crash');
      return fn(opts);
    }
    if (opts.role === 'reviewer') {
      const fn = reviewerAdapter(reviewerBehavior as 'approve' | 'request_changes' | 'timeout' | 'crash');
      return fn(opts);
    }
    return { exit: 0, timedOut: false, tail: '' };
  };
}

function verifyFn(sequence: boolean[]) {
  return async (_cwd: string, _taskId: string) => {
    const ok = sequence[verifyCalls] ?? true;
    verifyLog.push({ ok });
    verifyCalls++;
    return { ok, output: ok ? 'all green' : 'tests failed' };
  };
}

function makeRunner(opts: {
  adapter: AgentAdapter;
  verifySequence?: boolean[];
  maxRework?: number;
  supervised?: boolean;
  confirm?: (action: string, taskId: string) => Promise<boolean>;
  worktreeDir?: string;
}) {
  escalateLog = [];
  logLines = [];
  verifyLog = [];
  verifyCalls = 0;
  confirmLog = [];

  return new WaveRunner({
    taskService,
    adapter: opts.adapter,
    worktreeFor: () => opts.worktreeDir ?? os.tmpdir(),
    verify: verifyFn(opts.verifySequence ?? [true, true, true, true]),
    maxRework: opts.maxRework,
    supervised: opts.supervised,
    confirm: opts.confirm,
    onEscalate: (taskId, reason, detail) => {
      escalateLog.push({ taskId, reason, detail });
    },
    log: (line) => {
      logLines.push(line);
    },
  });
}

async function createTask(id: string, opts?: { body?: string }) {
  return taskService.createTask({
    id,
    title: `Test Task ${id}`,
    complexity: 2,
  });
}

beforeEach(() => {
  tasksDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-test-tasks-'));
  taskService = new TaskService({ rootDir: tasksDir });

  // criar diretório tasks/
  const taskSubDir = path.join(tasksDir, 'tasks');
  fs.mkdirSync(taskSubDir, { recursive: true });
});

afterEach(() => {
  if (tasksDir && fs.existsSync(tasksDir)) {
    fs.rmSync(tasksDir, { recursive: true, force: true });
  }
});

describe('WaveRunner.runTask', () => {
  it('happy path: worker→review, gate ok, reviewer→done → final:done rounds:1', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'approve'));
    await createTask('T-100');
    // Bypass draft→ready: set status diretamente para 'ready' sem passar pela máquina
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    // Também adiciona um corpo com Capacidade-alvo: sonnet para não ser opus-spike
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({ adapter });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('done');
    expect(outcome.rounds).toBe(1);
    expect(escalateLog).toEqual([]);
    expect(verifyCalls).toBe(2); // gate before reviewer + gate final
  });

  it('gate vermelho na 1ª, verde na 2ª → done com rounds:2', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'approve'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({
      adapter,
      verifySequence: [false, true, true], // gate1 fails, gate2 ok (rework), gate final ok
    });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('done');
    expect(outcome.rounds).toBe(2);
    expect(escalateLog).toEqual([]);
  });

  it('rework excedido: gate sempre vermelho → escalated rework_exceeded', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'approve'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({
      adapter,
      verifySequence: [false, false, false, false],
      maxRework: 2,
    });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('escalated');
    expect(outcome.reason).toBe('rework_exceeded');
    expect(escalateLog).toHaveLength(1);
    expect(escalateLog[0].reason).toBe('rework_exceeded');
  });

  it('rework excedido via reviewer: sempre request_changes → escalated', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'request_changes'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({
      adapter,
      maxRework: 2,
    });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('escalated');
    expect(outcome.reason).toBe('rework_exceeded');
    expect(escalateLog[0].reason).toBe('rework_exceeded');
  });

  it('opus-spike → escalated opus_spike sem spawnar', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'approve'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    // Insere Capacidade-alvo: opus-spike no corpo
    content += '\nCapacidade-alvo: opus-spike\n';
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({ adapter });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('escalated');
    expect(outcome.reason).toBe('opus_spike');
    expect(verifyCalls).toBe(0); // nunca chegou ao gate
  });

  it('worker não moveu para review (no-op) → escalated malformed_run', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'noop', 'approve'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({ adapter });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('escalated');
    expect(outcome.reason).toBe('malformed_run');
  });

  it('agent timeout → escalated agent_crash_or_timeout', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'timeout', 'approve'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({ adapter });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('escalated');
    expect(outcome.reason).toBe('agent_crash_or_timeout');
  });

  it('gate_verdict_mismatch: reviewer aprova mas gate final falha', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'approve'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({
      adapter,
      verifySequence: [true, false], // gate1 ok, gate final FAILS
    });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('escalated');
    expect(outcome.reason).toBe('gate_verdict_mismatch');
  });

  it('supervised: confirm retornando false impede o spawn', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'approve'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({
      adapter,
      supervised: true,
      confirm: async (action: string, _taskId: string) => {
        confirmLog.push({ action, taskId: _taskId, result: false });
        return false;
      },
    });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('escalated');
    expect(outcome.reason).toBe('malformed_run');
    expect(confirmLog).toHaveLength(1);
    expect(confirmLog[0].action).toBe('worker');
  });

  it('worker crash (exit!=0) → escalated agent_crash_or_timeout', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'crash', 'approve'));
    await createTask('T-100');
    const taskPath = path.join(tasksDir, 'tasks', 'T-100.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({ adapter });
    const outcome = await runner.runTask('T-100');

    expect(outcome.final).toBe('escalated');
    expect(outcome.reason).toBe('agent_crash_or_timeout');
  });
});

describe('WaveRunner.runWave', () => {
  it('processa múltiplas tasks em série', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'approve'));

    // Cria 2 tasks sem dependências
    await createTask('T-1');
    await createTask('T-2');
    for (const id of ['T-1', 'T-2']) {
      const taskPath = path.join(tasksDir, 'tasks', `${id}.md`);
      let content = fs.readFileSync(taskPath, 'utf8');
      content = content.replace(/^status:.*$/m, 'status: ready');
      fs.writeFileSync(taskPath, content, 'utf8');
    }

    const runner = makeRunner({ adapter });
    const outcomes = await runner.runWave();

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0].final).toBe('done');
    expect(outcomes[1].final).toBe('done');
  });

  it('não inclui task com dependência não-concluída', async () => {
    const adapter = makeFakeAdapter(routeAdapter('worker', 'normal', 'approve'));

    // T-3 depende de T-4 (não existe no conjunto → não ready)
    await createTask('T-3');
    const taskPath = path.join(tasksDir, 'tasks', 'T-3.md');
    let content = fs.readFileSync(taskPath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: ready');
    content = content.replace(/^dependencies:.*$/m, 'dependencies: [T-4]');
    fs.writeFileSync(taskPath, content, 'utf8');

    const runner = makeRunner({ adapter });
    const outcomes = await runner.runWave();

    expect(outcomes).toHaveLength(0); // nenhuma pronta
  });
});
