/**
 * Definições e dispatch das tools MCP de tasks, isolados do transporte stdio
 * para serem testáveis diretamente (sem subprocesso). O server.ts apenas registra
 * TASK_TOOL_DEFS e delega a handleTaskTool — que chama o MESMO TaskController do REST.
 */
import { TaskController } from '../services/task.controller.js';
import { TaskStatus } from '../services/task.types.js';

export interface McpToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export const TASK_TOOL_DEFS = [
  {
    name: 'nexus_list_tasks',
    description: 'Lists MGTIA tasks (the project board). Optional filters by status and target agent.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'draft|ready|in_progress|review|rework|done|blocked' },
        target_agent: { type: 'string' },
      },
    },
  },
  {
    name: 'nexus_get_task',
    description: 'Returns a single task: frontmatter, body and the full execution log.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'nexus_create_task',
    description: 'Creates a new MGTIA task (status draft) and rebuilds the INDEX.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        complexity: { type: 'number' },
        target_agent: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'string' } },
        blocks: { type: 'array', items: { type: 'string' } },
      },
      required: ['id', 'title'],
    },
  },
  {
    name: 'nexus_transition_task',
    description:
      'Applies an MGTIA state transition (triage|harden|decide|block_decision|decompose|promote|start|pause|finish|claim|approve|request_changes|block|unblock), appends the execution log and rebuilds the INDEX.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        action: { type: 'string' },
        agent: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['id', 'action', 'agent'],
    },
  },
  {
    name: 'nexus_assign_task',
    description: 'Assigns/reassigns the responsible agent (target_agent) of a task.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, target_agent: { type: 'string' } },
      required: ['id', 'target_agent'],
    },
  },
  {
    name: 'nexus_log_progress',
    description: 'Appends a durable progress/handoff note to the task execution log WITHOUT changing status.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, agent: { type: 'string' }, message: { type: 'string' } },
      required: ['id', 'agent', 'message'],
    },
  },
] as const;

export const TASK_TOOL_NAMES = new Set<string>(TASK_TOOL_DEFS.map((t) => t.name));

/** Executa uma tool de task. Erros (validação/transição/não-encontrada) viram isError. */
export async function handleTaskTool(
  controller: TaskController,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  try {
    let result: unknown;
    switch (name) {
      case 'nexus_list_tasks':
        result = controller.list({
          status: args.status as TaskStatus | undefined,
          targetAgent: args.target_agent as string | undefined,
        });
        break;
      case 'nexus_get_task':
        result = controller.get(String(args.id));
        break;
      case 'nexus_create_task':
        result = controller.create({
          id: args.id as string,
          title: args.title as string,
          complexity: args.complexity as number | undefined,
          targetAgent: args.target_agent as string | undefined,
          dependencies: args.dependencies as string[] | undefined,
          blocks: args.blocks as string[] | undefined,
        });
        break;
      case 'nexus_transition_task':
        result = await controller.transition(
          String(args.id),
          String(args.action),
          String(args.agent),
          args.message ? String(args.message) : '',
        );
        break;
      case 'nexus_assign_task':
        result = controller.assign(String(args.id), String(args.target_agent));
        break;
      case 'nexus_log_progress':
        result = controller.logProgress(String(args.id), String(args.agent), String(args.message));
        break;
      default:
        throw new Error(`Tool de task desconhecida: ${name}`);
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}
