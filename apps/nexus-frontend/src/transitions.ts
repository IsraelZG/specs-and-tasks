/**
 * Espelho da máquina de estados MGTIA do backend (TRANSITIONS em task.types.ts),
 * usado só para a UI saber quais ações são válidas e derivar a ação de um
 * arrastar-e-soltar entre colunas. A validação real é sempre do backend.
 */
import type { TaskStatus } from './api';

export type TaskAction =
  | 'start'
  | 'pause'
  | 'finish'
  | 'approve'
  | 'request_changes'
  | 'block'
  | 'unblock';

interface Rule {
  from: TaskStatus[] | '*';
  to: TaskStatus;
  label: string;
}

export const TRANSITIONS: Record<TaskAction, Rule> = {
  start: { from: ['draft', 'ready', 'rework'], to: 'in_progress', label: 'Iniciar' },
  pause: { from: ['in_progress'], to: 'in_progress', label: 'Pausar / Handoff' },
  finish: { from: ['in_progress'], to: 'review', label: 'Finalizar' },
  approve: { from: ['review'], to: 'done', label: 'Aprovar' },
  request_changes: { from: ['review'], to: 'rework', label: 'Pedir mudanças' },
  block: { from: '*', to: 'blocked', label: 'Bloquear' },
  unblock: { from: ['blocked'], to: 'ready', label: 'Desbloquear' },
};

export const COLUMNS: TaskStatus[] = [
  'draft',
  'ready',
  'in_progress',
  'review',
  'rework',
  'done',
  'blocked',
];

export const AGENT_PROFILES = [
  'devops_agent',
  'logic_agent',
  'crypto_agent',
  'frontend_agent',
  'protocol_agent',
  'core_agent',
  'transport_agent',
  'agile_reviewer',
];

function allows(rule: Rule, from: TaskStatus): boolean {
  return rule.from === '*' || rule.from.includes(from);
}

/** Ações disponíveis a partir de um status (para os botões do drawer). */
export function actionsFor(status: TaskStatus): TaskAction[] {
  return (Object.keys(TRANSITIONS) as TaskAction[]).filter((a) =>
    allows(TRANSITIONS[a], status),
  );
}

/** Deriva a ação ao soltar um card numa coluna de destino (ou null se inválido). */
export function actionForTarget(from: TaskStatus, to: TaskStatus): TaskAction | null {
  if (from === to) return null;
  const found = (Object.keys(TRANSITIONS) as TaskAction[]).find(
    (a) => TRANSITIONS[a].to === to && allows(TRANSITIONS[a], from),
  );
  return found ?? null;
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  in_progress: 'In Progress',
  review: 'Review',
  rework: 'Rework',
  done: 'Done',
  blocked: 'Blocked',
};
