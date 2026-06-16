import type { TaskStatus } from '../services/task.types.js';

export interface SchedulableTask {
  id: string;
  status: TaskStatus;
  dependencies: string[];
  blocks: string[];
  targetAgent?: string;
  capacity?: 'haiku' | 'sonnet' | 'opus-spike';
}

const RUNNABLE_STATUSES: Set<TaskStatus> = new Set(['draft', 'ready', 'rework']);

/**
 * PRONTA p/ worker se TODAS as condições valerem:
 *   - status ∈ {'draft','ready','rework'}
 *   - toda id em `dependencies` existe no conjunto E está 'done'
 *   - nenhum "blocker de entrada" incompleto: para todo Y no conjunto cujo
 *     `Y.blocks` inclui esta task, Y.status === 'done'
 * Tasks com id de dependência ausente do conjunto → NÃO prontas (conservador).
 */
export function computeReadySet(tasks: SchedulableTask[]): SchedulableTask[] {
  const doneSet = new Set(tasks.filter((t) => t.status === 'done').map((t) => t.id));
  const idSet = new Set(tasks.map((t) => t.id));

  return tasks.filter((task) => {
    if (!RUNNABLE_STATUSES.has(task.status)) return false;

    for (const dep of task.dependencies) {
      if (!idSet.has(dep) || !doneSet.has(dep)) return false;
    }

    for (const other of tasks) {
      if (other.blocks.includes(task.id) && other.status !== 'done') return false;
    }

    return true;
  });
}

/** Tasks em status 'review' (aguardando QA). */
export function computeReviewSet(tasks: SchedulableTask[]): SchedulableTask[] {
  return tasks.filter((t) => t.status === 'review');
}

/**
 * Escolhe até `k` tasks do ready-set, em ordem ESTÁVEL por `id` (localeCompare),
 * excluindo as cujos ids estão em `inFlightIds`. k<=0 → [].
 */
export function pickBatch(
  ready: SchedulableTask[],
  k: number,
  inFlightIds: string[],
): SchedulableTask[] {
  if (k <= 0) return [];
  const exclude = new Set(inFlightIds);
  return [...ready]
    .filter((t) => !exclude.has(t.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, k);
}

const CAPACITY_RE = /^Capacidade-alvo:\s*(haiku|sonnet|opus-spike)\s*$/im;

/** Mapeia um TaskRecord (frontmatter) para SchedulableTask. `capacity` é best-effort:
 *  procurar no corpo a linha "Capacidade-alvo: <x>" via regex; ausente → undefined. */
export function toSchedulable(record: {
  frontmatter: {
    id: string;
    status: TaskStatus;
    dependencies?: string[];
    blocks?: string[];
    target_agent?: string;
  };
  body?: string;
}): SchedulableTask {
  let capacity: 'haiku' | 'sonnet' | 'opus-spike' | undefined;
  if (record.body) {
    const m = CAPACITY_RE.exec(record.body);
    if (m) {
      capacity = m[1] as 'haiku' | 'sonnet' | 'opus-spike';
    }
  }
  return {
    id: record.frontmatter.id,
    status: record.frontmatter.status,
    dependencies: record.frontmatter.dependencies ?? [],
    blocks: record.frontmatter.blocks ?? [],
    targetAgent: record.frontmatter.target_agent,
    capacity,
  };
}
