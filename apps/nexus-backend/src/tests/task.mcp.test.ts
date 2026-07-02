import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { TaskService } from '../services/task.service.js';
import { TaskController } from '../services/task.controller.js';
import { TASK_TOOL_DEFS, TASK_TOOL_NAMES, handleTaskTool } from '../mcp/task-tools.js';

/**
 * Testa o dispatch das tools MCP de tasks diretamente (mesmo código que o
 * servidor stdio executa). Paridade com o REST é estrutural: ambos chamam o
 * mesmo TaskController.
 */
describe('MCP task tools (handleTaskTool)', () => {
  let rootDir: string;
  let controller: TaskController;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-mcptools-'));
    fs.mkdirSync(path.join(rootDir, 'tasks'));
    controller = new TaskController(new TaskService({ rootDir }));
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('expõe as 6 tools de tasks', () => {
    const names = TASK_TOOL_DEFS.map((t) => t.name);
    expect(names).toEqual([
      'nexus_list_tasks',
      'nexus_get_task',
      'nexus_create_task',
      'nexus_transition_task',
      'nexus_assign_task',
      'nexus_log_progress',
    ]);
    expect(TASK_TOOL_NAMES.has('nexus_create_task')).toBe(true);
  });

  it('create + list operam no rootDir do controller', async () => {
    const created = await handleTaskTool(controller, 'nexus_create_task', {
      id: 'T-700',
      title: 'Via MCP',
      complexity: 2,
      target_agent: 'devops_agent',
    });
    expect(created.isError).toBeUndefined();
    expect(created.content[0].text).toContain('"id": "T-700"');
    expect(fs.existsSync(path.join(rootDir, 'tasks', 'T-700.md'))).toBe(true);

    const listed = await handleTaskTool(controller, 'nexus_list_tasks', {});
    expect(listed.content[0].text).toContain('T-700');
  });

  it('fluxo de transição start via MCP', async () => {
    await handleTaskTool(controller, 'nexus_create_task', { id: 'T-701', title: 'X' });
    await handleTaskTool(controller, 'nexus_transition_task', {
      id: 'T-701',
      action: 'promote',
      agent: 'architect',
    });
    const started = await handleTaskTool(controller, 'nexus_transition_task', {
      id: 'T-701',
      action: 'start',
      agent: 'dev',
    });
    expect(started.content[0].text).toContain('"status": "in_progress"');
  });

  it('transição inválida vira isError com mensagem', async () => {
    await handleTaskTool(controller, 'nexus_create_task', { id: 'T-702', title: 'X' });
    const res = await handleTaskTool(controller, 'nexus_transition_task', {
      id: 'T-702',
      action: 'approve',
      agent: 'qa',
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Transição inválida');
  });

  it('get inexistente vira isError', async () => {
    const res = await handleTaskTool(controller, 'nexus_get_task', { id: 'T-404' });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('não encontrada');
  });
});
