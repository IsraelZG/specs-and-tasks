import { TaskService } from '../services/task.service.js';
import type { AgentAdapter } from './agent-adapter.js';
import { computeReadySet, toSchedulable } from './scheduler.js';

export type EscalationReason =
  | 'rework_exceeded'
  | 'paused_or_blocked'
  | 'agent_crash_or_timeout'
  | 'malformed_run'
  | 'opus_spike'
  | 'gate_verdict_mismatch';

export interface RunnerOptions {
  taskService: TaskService;
  adapter: AgentAdapter;
  worktreeFor: (taskId: string) => string;
  verify: (cwd: string, taskId: string) => Promise<{ ok: boolean; output: string }>;
  maxRework?: number;
  supervised?: boolean;
  confirm?: (action: string, taskId: string) => Promise<boolean>;
  onEscalate: (taskId: string, reason: EscalationReason, detail: string) => void;
  log?: (line: string) => void;
}

export interface TaskOutcome {
  taskId: string;
  final: 'done' | 'escalated';
  rounds: number;
  reason?: EscalationReason;
}

function tailLines(text: string, lines: number): string {
  if (!text) return '';
  const all = text.split('\n');
  return all.slice(-lines).join('\n');
}

export class WaveRunner {
  private opts: RunnerOptions;

  constructor(opts: RunnerOptions) {
    this.opts = opts;
  }

  private log(line: string): void {
    this.opts.log?.(line);
  }

  async runTask(taskId: string): Promise<TaskOutcome> {
    const { taskService, adapter, worktreeFor, verify, onEscalate } = this.opts;
    const maxRework = this.opts.maxRework ?? 2;
    const supervised = this.opts.supervised ?? true;
    const confirm = this.opts.confirm;

    const task = taskService.getTask(taskId);
    const schedulable = toSchedulable(task);

    if (schedulable.capacity === 'opus-spike') {
      const detail = 'task marcada como opus-spike — requer intervenção humana';
      onEscalate(taskId, 'opus_spike', detail);
      this.log(`[${taskId}] opus-spike → escalada`);
      return { taskId, final: 'escalated', rounds: 1, reason: 'opus_spike' };
    }

    let rounds = 1;

    while (true) {
      this.log(`[${taskId}] round ${rounds} — iniciando worker`);

      if (supervised && confirm) {
        this.log(`[${taskId}] pedindo confirmação para worker`);
        const allowed = await confirm('worker', taskId);
        if (!allowed) {
          const detail = 'não confirmado';
          onEscalate(taskId, 'malformed_run', detail);
          this.log(`[${taskId}] confirm retornou false → escalada malformed_run`);
          return { taskId, final: 'escalated', rounds, reason: 'malformed_run' };
        }
      }

      const cwd = worktreeFor(taskId);

      const workerResult = await adapter.run({
        role: 'worker',
        taskId,
        cwd,
      });

      if (workerResult.timedOut || workerResult.exit !== 0) {
        const detail = workerResult.timedOut
          ? 'worker atingiu timeout'
          : `worker exit=${workerResult.exit}\n${workerResult.tail}`;
        onEscalate(taskId, 'agent_crash_or_timeout', detail);
        this.log(`[${taskId}] worker crash/timeout → escalada`);
        return { taskId, final: 'escalated', rounds, reason: 'agent_crash_or_timeout' };
      }

      const postWorkerStatus = taskService.getTask(taskId).frontmatter.status;

      if (postWorkerStatus !== 'review') {
        if (postWorkerStatus === 'blocked' || postWorkerStatus === 'in_progress') {
          const detail = `worker deixou task em '${postWorkerStatus}' em vez de 'review'`;
          onEscalate(taskId, 'paused_or_blocked', detail);
          this.log(`[${taskId}] status=${postWorkerStatus} → escalada paused_or_blocked`);
          return { taskId, final: 'escalated', rounds, reason: 'paused_or_blocked' };
        }
        const detail = `worker deixou task em '${postWorkerStatus}' (esperado 'review')`;
        onEscalate(taskId, 'malformed_run', detail);
        this.log(`[${taskId}] status=${postWorkerStatus} → escalada malformed_run`);
        return { taskId, final: 'escalated', rounds, reason: 'malformed_run' };
      }

      const gateResult = await verify(cwd, taskId);
      if (!gateResult.ok) {
        const truncated = tailLines(gateResult.output, 40);
        await taskService.transition(
          taskId,
          'request_changes',
          'runner',
          `gate: build/test falhou\n${truncated}`,
        );
        this.log(`[${taskId}] gate falhou → request_changes`);

        rounds++;
        if (rounds > maxRework) {
          const detail = `gate falhou após ${rounds} rounds (maxRework=${maxRework})\n${truncated}`;
          onEscalate(taskId, 'rework_exceeded', detail);
          this.log(`[${taskId}] rework excedido (gate) → escalada`);
          return { taskId, final: 'escalated', rounds, reason: 'rework_exceeded' };
        }

        this.log(`[${taskId}] voltando ao worker (round ${rounds})`);
        continue;
      }

      const reviewerResult = await adapter.run({
        role: 'reviewer',
        taskId,
        cwd,
      });

      if (reviewerResult.timedOut || reviewerResult.exit !== 0) {
        const detail = reviewerResult.timedOut
          ? 'reviewer atingiu timeout'
          : `reviewer exit=${reviewerResult.exit}\n${reviewerResult.tail}`;
        onEscalate(taskId, 'agent_crash_or_timeout', detail);
        this.log(`[${taskId}] reviewer crash/timeout → escalada`);
        return { taskId, final: 'escalated', rounds, reason: 'agent_crash_or_timeout' };
      }

      const postReviewerStatus = taskService.getTask(taskId).frontmatter.status;

      if (postReviewerStatus === 'done') {
        const gateFinal = await verify(cwd, taskId);
        if (!gateFinal.ok) {
          const detail = `gate final falhou após approve:\n${tailLines(gateFinal.output, 40)}`;
          onEscalate(taskId, 'gate_verdict_mismatch', detail);
          this.log(`[${taskId}] gate_verdict_mismatch → escalada`);
          return { taskId, final: 'escalated', rounds, reason: 'gate_verdict_mismatch' };
        }

        this.log(`[${taskId}] concluída — done (rounds=${rounds})`);
        return { taskId, final: 'done', rounds };
      }

      if (postReviewerStatus === 'rework') {
        this.log(`[${taskId}] reviewer pediu rework`);

        rounds++;
        if (rounds > maxRework) {
          const detail = `reviewer pediu rework após ${rounds} rounds (maxRework=${maxRework})`;
          onEscalate(taskId, 'rework_exceeded', detail);
          this.log(`[${taskId}] rework excedido (reviewer) → escalada`);
          return { taskId, final: 'escalated', rounds, reason: 'rework_exceeded' };
        }

        this.log(`[${taskId}] voltando ao worker (round ${rounds})`);
        continue;
      }

      const detail = `reviewer deixou task em '${postReviewerStatus}' (esperado 'done' ou 'rework')`;
      onEscalate(taskId, 'malformed_run', detail);
      this.log(`[${taskId}] status=${postReviewerStatus} pós-reviewer → escalada malformed_run`);
      return { taskId, final: 'escalated', rounds, reason: 'malformed_run' };
    }
  }

  async runWave(): Promise<TaskOutcome[]> {
    const records = this.opts.taskService.listTasks();
    const schedulable = records.map(toSchedulable);
    const ready = computeReadySet(schedulable);

    this.log(`[wave] ${ready.length} tasks no ready-set`);

    const outcomes: TaskOutcome[] = [];
    for (const task of ready) {
      const outcome = await this.runTask(task.id);
      outcomes.push(outcome);
    }

    return outcomes;
  }
}
