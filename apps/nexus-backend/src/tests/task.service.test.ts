import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { TaskService } from '../services/task.service.js';
import { TaskError, ForbiddenRoleError } from '../services/task.types.js';

function makeTask(id: string, status: string, extra = ''): string {
  return `---
id: ${id}
title: "Tarefa ${id}"
status: ${status}
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
---

# ${id} · Tarefa ${id}
${extra}
## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui.
`;
}

describe('TaskService (máquina de estados MGTIA)', () => {
  let rootDir: string;
  let svc: TaskService;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-tasks-'));
    fs.mkdirSync(path.join(rootDir, 'tasks'));
    svc = new TaskService({ rootDir });
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  function write(id: string, status: string, extra = ''): void {
    fs.writeFileSync(path.join(rootDir, 'tasks', `${id}.md`), makeTask(id, status, extra), 'utf8');
  }

  it('start: draft → in_progress e grava log datado', async () => {
    write('T-900', 'draft');
    const rec = await svc.transition('T-900', 'start', 'claude', 'começando');
    expect(rec.frontmatter.status).toBe('in_progress');
    const last = rec.log.at(-1)!;
    expect(last.agent).toBe('claude');
    expect(last.label).toBe('[Iniciado]');
    expect(last.message).toBe('começando');
    expect(last.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('fluxo completo start → finish → approve', async () => {
    write('T-901', 'ready');
    await svc.transition('T-901', 'start', 'dev');
    await svc.transition('T-901', 'finish', 'dev', 'pronto p/ review');
    const reviewed = svc.getTask('T-901');
    expect(reviewed.frontmatter.status).toBe('review');
    const done = await svc.transition('T-901', 'approve', 'agile_reviewer', 'ok');
    expect(done.frontmatter.status).toBe('done');
  });

  it('transição inválida lança TaskError sem alterar o arquivo', async () => {
    write('T-902', 'draft');
    await expect(svc.transition('T-902', 'approve', 'qa')).rejects.toThrow(TaskError);
    expect(svc.getTask('T-902').frontmatter.status).toBe('draft');
  });

  it('request_changes: review → rework e recomeço via start: rework → in_progress', async () => {
    write('T-903', 'review');
    let rec = await svc.transition('T-903', 'request_changes', 'agile_reviewer', 'faltou teste');
    expect(rec.frontmatter.status).toBe('rework');
    rec = await svc.transition('T-903', 'start', 'dev', 'corrigindo');
    expect(rec.frontmatter.status).toBe('in_progress');
  });

  it('block de qualquer estado e unblock → ready', async () => {
    write('T-904', 'in_progress');
    expect((await svc.transition('T-904', 'block', 'claude', 'spec ambígua')).frontmatter.status).toBe('blocked');
    expect((await svc.transition('T-904', 'unblock', 'claude')).frontmatter.status).toBe('ready');
  });

  it('handoff: pause grava nota e getTask a expõe (status segue in_progress)', async () => {
    write('T-905', 'in_progress');
    await svc.transition('T-905', 'pause', 'dev1', 'parei na metade: falta o teste X');
    const rec = svc.getTask('T-905');
    expect(rec.frontmatter.status).toBe('in_progress');
    const handoff = rec.log.at(-1)!;
    expect(handoff.label).toBe('[Pausado/Handoff]');
    expect(handoff.message).toContain('falta o teste X');
  });

  it('logProgress adiciona entrada sem mudar status', () => {
    write('T-906', 'in_progress');
    const rec = svc.logProgress('T-906', 'dev', 'checkpoint 1');
    expect(rec.frontmatter.status).toBe('in_progress');
    expect(rec.log.at(-1)!.label).toBe('[Progresso]');
  });

  it('assign troca o target_agent', () => {
    write('T-907', 'draft');
    const rec = svc.assign('T-907', 'frontend_agent');
    expect(rec.frontmatter.target_agent).toBe('frontend_agent');
  });

  it('setMeta persiste branch e worktreePath no frontmatter', () => {
    write('T-911', 'in_progress');
    svc.setMeta('T-911', { branch: 'task/T-911', worktreePath: '/tmp/wt/T-911' });
    const rec = svc.getTask('T-911');
    expect(rec.frontmatter.branch).toBe('task/T-911');
    expect(rec.frontmatter.worktreePath).toBe('/tmp/wt/T-911');
  });

  it('createTask cria draft e listTasks/filtros funcionam', () => {
    svc.createTask({ id: 'T-908', title: 'Nova', complexity: 4, targetAgent: 'devops_agent' });
    const rec = svc.getTask('T-908');
    expect(rec.frontmatter.status).toBe('draft');
    expect(rec.frontmatter.target_agent).toBe('devops_agent');
    write('T-909', 'done');
    expect(svc.listTasks({ status: 'done' }).map((t) => t.id)).toEqual(['T-909']);
  });

  it('cada mutação regenera o INDEX.md', async () => {
    write('T-910', 'draft');
    await svc.transition('T-910', 'start', 'claude');
    const index = fs.readFileSync(path.join(rootDir, 'tasks', 'INDEX.md'), 'utf8');
    expect(index).toContain('| [T-910](./T-910.md) |');
    expect(index).toContain('`in_progress`');
  });

  it('approve com agent diferente do reviewer_agent lança ForbiddenRoleError e não altera status', async () => {
    write('T-1000', 'review');
    await expect(svc.transition('T-1000', 'approve', 'dev', 'ok')).rejects.toThrow(ForbiddenRoleError);
    expect(svc.getTask('T-1000').frontmatter.status).toBe('review');
  });

  it('approve com agent === reviewer_agent sucede, status vira done', async () => {
    write('T-1001', 'review');
    const done = await svc.transition('T-1001', 'approve', 'agile_reviewer', 'ok');
    expect(done.frontmatter.status).toBe('done');
  });

  it('comparação de agent é case-insensitive: Agile_Reviewer vs agile_reviewer sucede', async () => {
    write('T-1002', 'review');
    const done = await svc.transition('T-1002', 'approve', 'Agile_Reviewer', 'ok');
    expect(done.frontmatter.status).toBe('done');
  });

  it('request_changes com agent diferente do reviewer lança ForbiddenRoleError', async () => {
    write('T-1003', 'review');
    await expect(svc.transition('T-1003', 'request_changes', 'dev', 'faltou')).rejects.toThrow(ForbiddenRoleError);
    expect(svc.getTask('T-1003').frontmatter.status).toBe('review');
  });

  it('task sem reviewer_agent no frontmatter: approve só sucede com agent agile_reviewer (default)', async () => {
    write('T-1004', 'review');
    const filePath = path.join(rootDir, 'tasks', 'T-1004.md');
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/^reviewer_agent:.*\n/m, '');
    fs.writeFileSync(filePath, content, 'utf8');
    await expect(svc.transition('T-1004', 'approve', 'qa', 'ok')).rejects.toThrow(ForbiddenRoleError);
    const done = await svc.transition('T-1004', 'approve', 'agile_reviewer', 'ok');
    expect(done.frontmatter.status).toBe('done');
  });
});
