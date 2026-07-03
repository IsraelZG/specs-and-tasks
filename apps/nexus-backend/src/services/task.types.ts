/**
 * Tipos e máquina de estados do ciclo de vida MGTIA de tarefas.
 * Fonte da verdade do fluxo: docs/conceitos/mgtia-workflow.md
 */

export type TaskStatus =
  | 'draft'                    // LEGACY: alias of draft:placeholder (tolerated until T-1030 migration runs)
  | 'draft:placeholder'
  | 'draft:triaged'
  | 'draft:pending_decision'
  | 'draft:hardened'
  | 'draft:decomposed'
  | 'ready'
  | 'in_progress'
  | 'review'
  | 'in_review'
  | 'rework'
  | 'done'
  | 'blocked';

export type TaskAction =
  | 'triage' | 'harden' | 'decide' | 'block_decision' | 'decompose'  // endurecimento (draft ladder)
  | 'promote' | 'start' | 'pause' | 'finish'
  | 'claim' | 'approve' | 'request_changes'
  | 'block' | 'unblock'
  | 'demote';

export interface TransitionRule {
  /** Estados de origem permitidos, ou '*' para qualquer estado. */
  from: TaskStatus[] | '*';
  to: TaskStatus;
  /** Rótulo gravado no Log de Execução (inclui colchetes, como no manage-task.mjs). */
  logLabel: string;
}

/** Máquina de estados MGTIA: draft → ready → in_progress → review → in_review → done (+ rework, blocked). */
export const TRANSITIONS: Record<TaskAction, TransitionRule> = {
  // --- endurecimento (draft ladder) ---
  triage:         { from: ['draft', 'draft:placeholder'],                        to: 'draft:triaged',          logLabel: '[Triado]' },
  harden:         { from: ['draft:triaged'],                                     to: 'draft:hardened',         logLabel: '[Endurecido]' },
  decide:         { from: ['draft:pending_decision'],                            to: 'draft:hardened',         logLabel: '[Decidido]' },
  block_decision: { from: ['draft', 'draft:placeholder', 'draft:triaged'],       to: 'draft:pending_decision', logLabel: '[Decisão pendente]' },
  decompose:      { from: '*',                                                   to: 'draft:decomposed',       logLabel: '[Decomposto]' },
  // --- lifecycle ---
  start:          { from: ['ready', 'rework'],                                   to: 'in_progress',            logLabel: '[Iniciado]' },
  promote:        { from: ['draft', 'draft:placeholder', 'draft:triaged', 'draft:hardened'], to: 'ready',      logLabel: '[Promovida p/ ready]' },
  pause:          { from: ['in_progress'],                                       to: 'in_progress',            logLabel: '[Pausado/Handoff]' },
  finish:         { from: ['in_progress'],                                       to: 'review',                 logLabel: '[Finalizado]' },
  claim:          { from: ['review'],                                            to: 'in_review',              logLabel: '[Em revisão]' },
  approve:        { from: ['review', 'in_review'],                               to: 'done',                   logLabel: '[Aprovado]' },
  request_changes:{ from: ['review', 'in_review'],                               to: 'rework',                 logLabel: '[Requer Refatoração]' },
  block:          { from: '*',                                                   to: 'blocked',                logLabel: '[Bloqueado]' },
  unblock:        { from: ['blocked'],                                           to: 'ready',                  logLabel: '[Desbloqueado]' },
  demote:         { from: ['ready'],                                              to: 'draft:placeholder',       logLabel: '[Demovido]' },
};

/** Rótulo usado por logProgress (registro sem mudança de status). */
export const PROGRESS_LABEL = '[Progresso]';

/** Base do status: 'draft:hardened' → 'draft'. Usado pelos consumidores (T-1030) p/ agrupar draft:*. */
export function baseStatus(s: TaskStatus | string): string {
  return s.includes(':') ? s.split(':')[0] : s;
}

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
  /** IDs das tarefas filhas (pai decomposto). */
  subtasks?: string[];
  /** ID da tarefa pai (se for filha). */
  parent?: string;
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

/** Start num pai decomposto (tem subtasks ou status draft:decomposed). */
export class DecomposedParentStartError extends TaskError {
  constructor(id: string) {
    super(`Task '${id}' é um pai decomposto (tem subtasks ou status draft:decomposed) e não pode ser iniciada. Trabalhe as filhas.`);
    this.name = 'DecomposedParentStartError';
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
