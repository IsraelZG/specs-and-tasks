/**
 * Tipos e máquina de estados do ciclo de vida MGTIA de tarefas.
 * Fonte da verdade do fluxo: docs/conceitos/mgtia-workflow.md
 */

export type TaskStatus =
  | 'draft'
  | 'ready'
  | 'in_progress'
  | 'review'
  | 'rework'
  | 'done'
  | 'blocked';

export type TaskAction =
  | 'start'
  | 'pause'
  | 'finish'
  | 'approve'
  | 'request_changes'
  | 'block'
  | 'unblock';

export interface TransitionRule {
  /** Estados de origem permitidos, ou '*' para qualquer estado. */
  from: TaskStatus[] | '*';
  to: TaskStatus;
  /** Rótulo gravado no Log de Execução (inclui colchetes, como no manage-task.mjs). */
  logLabel: string;
}

/** Máquina de estados MGTIA: draft → ready → in_progress → review → rework → done (+ blocked). */
export const TRANSITIONS: Record<TaskAction, TransitionRule> = {
  start: { from: ['draft', 'ready', 'rework'], to: 'in_progress', logLabel: '[Iniciado]' },
  pause: { from: ['in_progress'], to: 'in_progress', logLabel: '[Pausado/Handoff]' },
  finish: { from: ['in_progress'], to: 'review', logLabel: '[Finalizado]' },
  approve: { from: ['review'], to: 'done', logLabel: '[Aprovado]' },
  request_changes: { from: ['review'], to: 'rework', logLabel: '[Requer Refatoração]' },
  block: { from: '*', to: 'blocked', logLabel: '[Bloqueado]' },
  unblock: { from: ['blocked'], to: 'ready', logLabel: '[Desbloqueado]' },
};

/** Rótulo usado por logProgress (registro sem mudança de status). */
export const PROGRESS_LABEL = '[Progresso]';

export interface LogEntry {
  timestamp: string;
  agent: string;
  /** Rótulo entre colchetes, ex.: "[Iniciado]". */
  label: string;
  message: string;
  /** Linha original do markdown. */
  raw: string;
}

export interface TaskFrontmatter {
  id: string;
  title: string;
  status: TaskStatus;
  complexity?: number;
  target_agent?: string;
  reviewer_agent?: string;
  execution_mode?: string;
  dependencies?: string[];
  blocks?: string[];
  /** Branch git de isolamento (preenchida pela T-1012). */
  branch?: string;
  worktreePath?: string;
  [key: string]: unknown;
}

export interface TaskRecord {
  id: string;
  frontmatter: TaskFrontmatter;
  /** Corpo do markdown (após o frontmatter). */
  body: string;
  log: LogEntry[];
  /** Caminho absoluto do arquivo. */
  path: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  targetAgent?: string;
}

export interface CreateTaskInput {
  id: string;
  title: string;
  complexity?: number;
  targetAgent?: string;
  dependencies?: string[];
  blocks?: string[];
}

export class TaskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskError';
  }
}

/** Task inexistente (mapeada para HTTP 404). */
export class TaskNotFoundError extends TaskError {
  constructor(message: string) {
    super(message);
    this.name = 'TaskNotFoundError';
  }
}

/** Transição não permitida pela máquina de estados (mapeada para HTTP 409). */
export class InvalidTransitionError extends TaskError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

/** Entrada inválida do chamador (mapeada para HTTP 400). */
export class ValidationError extends TaskError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Ação restrita ao Reviewer chamada por outro agente (mapeada para HTTP 403). */
export class ForbiddenRoleError extends TaskError {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenRoleError';
  }
}

/** Status do arquivo divergiu do ledger — edição manual (bypass) detectada (HTTP 409). */
export class StatusDriftError extends Error {
  constructor(
    public readonly id: string,
    public readonly ledgerStatus: string,
    public readonly fileStatus: string,
  ) {
    super(
      `Drift de status em ${id}: o ledger registra '${ledgerStatus}' mas o arquivo está '${fileStatus}'. ` +
        `O status foi editado fora do serviço (bypass). Rode 'reconcile ${id}' para restaurar o valor do ledger antes de qualquer transição.`,
    );
    this.name = 'StatusDriftError';
  }
}

export interface LedgerEntry {
  ts: string;
  id: string;
  from: string | null;
  to: TaskStatus;
  action: string;
  agent: string;
}
