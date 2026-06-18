/**
 * TaskController — camada agnóstica de framework sobre o TaskService.
 *
 * Faz validação de entrada (lança ValidationError → HTTP 400) e serializa
 * TaskRecord em DTOs JSON-safe. É consumida TANTO pelos endpoints REST
 * (index.ts) QUANTO pelas tools MCP (mcp/server.ts), garantindo paridade:
 * ambos os canais executam exatamente a mesma lógica e chamam só o TaskService.
 */
import { TaskService } from './task.service.js';
import {
  CreateTaskInput,
  LogEntry,
  TaskAction,
  TaskFilter,
  TaskRecord,
  TaskStatus,
  TRANSITIONS,
  ValidationError,
} from './task.types.js';

export interface TaskListItemDTO {
  id: string;
  title: string;
  status: TaskStatus;
  complexity?: number;
  target_agent?: string;
  dependencies: string[];
  blocks: string[];
  branch?: string;
  lastLog?: LogEntry;
}

export interface TaskDetailDTO extends TaskListItemDTO {
  body: string;
  log: LogEntry[];
}

const VALID_ACTIONS = Object.keys(TRANSITIONS) as TaskAction[];

function toListItem(rec: TaskRecord): TaskListItemDTO {
  const fm = rec.frontmatter;
  return {
    id: rec.id,
    title: fm.title,
    status: fm.status,
    complexity: fm.complexity,
    target_agent: fm.target_agent,
    dependencies: fm.dependencies ?? [],
    blocks: fm.blocks ?? [],
    branch: fm.branch,
    lastLog: rec.log.at(-1),
  };
}

function toDetail(rec: TaskRecord): TaskDetailDTO {
  return { ...toListItem(rec), body: rec.body, log: rec.log };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`Campo obrigatório ausente ou inválido: '${field}'.`);
  }
  return value;
}

function requireArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new ValidationError(`Campo '${field}' deve ser um array.`);
  }
  return value.map(String);
}

function validateComplexity(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  if (isNaN(num) || num < 1) {
    throw new ValidationError("Campo 'complexity' deve ser um número maior ou igual a 1.");
  }
  return num;
}

export class TaskController {
  constructor(private readonly svc: TaskService) {}

  list(filter: TaskFilter = {}): TaskListItemDTO[] {
    return this.svc.listTasks(filter).map(toListItem);
  }

  get(id: string): TaskDetailDTO {
    return toDetail(this.svc.getTask(requireString(id, 'id')));
  }

  create(input: Partial<CreateTaskInput>): TaskDetailDTO {
    const id = requireString(input.id, 'id');
    const title = requireString(input.title, 'title');
    const complexity = validateComplexity(input.complexity);
    const targetAgent = input.targetAgent !== undefined && input.targetAgent !== null
      ? requireString(input.targetAgent, 'target_agent')
      : undefined;
    const dependencies = requireArray(input.dependencies, 'dependencies');
    const blocks = requireArray(input.blocks, 'blocks');

    return toDetail(
      this.svc.createTask({
        id,
        title,
        complexity,
        targetAgent,
        dependencies,
        blocks,
      }),
    );
  }

  async transition(id: string, action: string, agent: string, message = ''): Promise<TaskDetailDTO> {
    requireString(id, 'id');
    requireString(agent, 'agent');
    if (!VALID_ACTIONS.includes(action as TaskAction)) {
      throw new ValidationError(
        `Ação inválida: '${action}'. Válidas: ${VALID_ACTIONS.join(', ')}.`,
      );
    }
    const msg = message !== undefined && message !== null ? String(message) : '';
    return toDetail(await this.svc.transition(id, action as TaskAction, agent, msg));
  }

  assign(id: string, targetAgent: string): TaskDetailDTO {
    requireString(id, 'id');
    requireString(targetAgent, 'targetAgent');
    return toDetail(this.svc.assign(id, targetAgent));
  }

  logProgress(id: string, agent: string, message: string): TaskDetailDTO {
    requireString(id, 'id');
    requireString(agent, 'agent');
    requireString(message, 'message');
    return toDetail(this.svc.logProgress(id, agent, message));
  }
}
