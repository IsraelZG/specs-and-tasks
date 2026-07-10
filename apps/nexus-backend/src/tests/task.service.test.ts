import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { TaskService } from '../services/task.service.js';
import { TaskError, ForbiddenRoleError, InvalidTransitionError, DecomposedParentStartError, baseStatus } from '../services/task.types.js';

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
`;
}

// Helper: task com frontmatter customizado (subtasks, parent, dependencies, etc.)
function makeTaskWith(id: string, status: string, fields: Record<string, string>): string {
  let fm = `id: ${id}
title: "Tarefa ${id}"
status: ${status}
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential`;
  for (const [key, value] of Object.entries(fields)) {
    fm += `\n${key}: ${value}`;
  }
  return `---\n${fm}\n---\n\n# ${id} · Tarefa ${id}\n\n## 9. Log de Execução (Agent Execution Log)\n> Registrem aqui.\n`;
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

  function writeWith(id: string, status: string, fields: Record<string, string>): void {
    fs.writeFileSync(path.join(rootDir, 'tasks', `${id}.md`), makeTaskWith(id, status, fields), 'utf8');
  }

  it('start: ready → in_progress e grava log datado', async () => {
    write('T-900', 'ready');
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
    write('T-910', 'ready');
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

  // ── T-1028: novos casos (in_review + draft:sub + hardening verbs) ──

  it('claim: review → in_review com papel agile_reviewer', async () => {
    write('T-2001', 'review');
    const rec = await svc.transition('T-2001', 'claim', 'agile_reviewer:gemini', 'reivindicando');
    expect(rec.frontmatter.status).toBe('in_review');
    const last = rec.log.at(-1)!;
    expect(last.label).toBe('[Em revisão]');
    expect(last.message).toBe('reivindicando');
  });

  it('claim gate de papel: logic_agent → ForbiddenRoleError', async () => {
    write('T-2002', 'review');
    await expect(svc.transition('T-2002', 'claim', 'logic_agent:deepseek', 'quero revisar'))
      .rejects.toThrow(ForbiddenRoleError);
    expect(svc.getTask('T-2002').frontmatter.status).toBe('review');
  });

  it('approve a partir de in_review → done', async () => {
    write('T-2003', 'in_review');
    const done = await svc.transition('T-2003', 'approve', 'agile_reviewer', 'ok');
    expect(done.frontmatter.status).toBe('done');
  });

  it('approve a partir de review (sem claim) → done (retrocompat)', async () => {
    write('T-2004', 'review');
    const done = await svc.transition('T-2004', 'approve', 'agile_reviewer', 'ok');
    expect(done.frontmatter.status).toBe('done');
  });

  it('triage: draft:placeholder → draft:triaged', async () => {
    write('T-2005', 'draft:placeholder');
    const rec = await svc.transition('T-2005', 'triage', 'claude', 'triado');
    expect(rec.frontmatter.status).toBe('draft:triaged');
    expect(rec.log.at(-1)!.label).toBe('[Triado]');
  });

  it('triage a partir de draft (legado) → draft:triaged', async () => {
    write('T-2006', 'draft');
    const rec = await svc.transition('T-2006', 'triage', 'claude');
    expect(rec.frontmatter.status).toBe('draft:triaged');
  });

  it('harden: draft:triaged → draft:hardened', async () => {
    write('T-2007', 'draft:triaged');
    const rec = await svc.transition('T-2007', 'harden', 'claude', 'endurecido');
    expect(rec.frontmatter.status).toBe('draft:hardened');
    expect(rec.log.at(-1)!.label).toBe('[Endurecido]');
  });

  it('harden inválido a partir de draft:placeholder → InvalidTransitionError', async () => {
    write('T-2008', 'draft:placeholder');
    await expect(svc.transition('T-2008', 'harden', 'claude'))
      .rejects.toThrow(InvalidTransitionError);
    expect(svc.getTask('T-2008').frontmatter.status).toBe('draft:placeholder');
  });

  it('block_decision → decide: draft:triaged → draft:pending_decision → draft:hardened', async () => {
    write('T-2009', 'draft:triaged');
    let rec = await svc.transition('T-2009', 'block_decision', 'claude', 'precisa decisão');
    expect(rec.frontmatter.status).toBe('draft:pending_decision');
    expect(rec.log.at(-1)!.label).toBe('[Decisão pendente]');
    rec = await svc.transition('T-2009', 'decide', 'claude', 'decisão tomada');
    expect(rec.frontmatter.status).toBe('draft:hardened');
    expect(rec.log.at(-1)!.label).toBe('[Decidido]');
  });

  it('decompose: de qualquer status → draft:decomposed', async () => {
    write('T-2010', 'ready');
    const rec = await svc.transition('T-2010', 'decompose', 'claude', 'split em 3');
    expect(rec.frontmatter.status).toBe('draft:decomposed');
    expect(rec.log.at(-1)!.label).toBe('[Decomposto]');
  });

  it('start inválido a partir de draft:hardened → InvalidTransitionError', async () => {
    write('T-2011', 'draft:hardened');
    await expect(svc.transition('T-2011', 'start', 'claude'))
      .rejects.toThrow(InvalidTransitionError);
    expect(svc.getTask('T-2011').frontmatter.status).toBe('draft:hardened');
  });

  it('start válido a partir de ready → in_progress (retrocompat)', async () => {
    write('T-2012', 'ready');
    const rec = await svc.transition('T-2012', 'start', 'claude', 'começando');
    expect(rec.frontmatter.status).toBe('in_progress');
  });

  it('baseStatus: draft:hardened → draft e ready → ready', () => {
    expect(baseStatus('draft:hardened')).toBe('draft');
    expect(baseStatus('ready')).toBe('ready');
    expect(baseStatus('draft:pending_decision')).toBe('draft');
    expect(baseStatus('in_review')).toBe('in_review');
  });

  // ── T-1029: side-effects (trava decomposto, auto-promote, parentAutoClose) ──

  it('(1) start em pai com subtasks → DecomposedParentStartError', async () => {
    writeWith('P-1', 'ready', { subtasks: '["A","B"]' });
    await expect(svc.transition('P-1', 'start', 'dev'))
      .rejects.toThrow(DecomposedParentStartError);
    expect(svc.getTask('P-1').frontmatter.status).toBe('ready');
  });

  it('(1b) start em draft:decomposed → DecomposedParentStartError', async () => {
    write('P-2', 'draft:decomposed');
    await expect(svc.transition('P-2', 'start', 'dev'))
      .rejects.toThrow(DecomposedParentStartError);
  });

  it('(2) auto-promote on harden com deps done → ready', async () => {
    write('D-1', 'done');
    write('T-1', 'draft:triaged');
    // Inject dependency via raw content pois makeTask não expõe deps custom
    const fp = path.join(rootDir, 'tasks', 'T-1.md');
    let c = fs.readFileSync(fp, 'utf8');
    c = c.replace('dependencies: []', 'dependencies: ["D-1"]');
    fs.writeFileSync(fp, c, 'utf8');
    const rec = await svc.transition('T-1', 'harden', 'claude', 'endurecido');
    expect(rec.frontmatter.status).toBe('ready');
    // Log should contain both [Endurecido] and [Auto-promovida]
    const labels = rec.log.map((l) => l.label);
    expect(labels).toContain('[Endurecido]');
    expect(labels).toContain('[Auto-promovida]');
  });

  it('(2b) auto-promote on harden com dep pendente → fica draft:hardened', async () => {
    write('D-2', 'in_progress');
    write('T-2', 'draft:triaged');
    const fp = path.join(rootDir, 'tasks', 'T-2.md');
    let c = fs.readFileSync(fp, 'utf8');
    c = c.replace('dependencies: []', 'dependencies: ["D-2"]');
    fs.writeFileSync(fp, c, 'utf8');
    const rec = await svc.transition('T-2', 'harden', 'claude');
    expect(rec.frontmatter.status).toBe('draft:hardened');
  });

  it('(3) autoPromoteDependents: approve A desbloqueia B (dep única)', async () => {
    write('A', 'review');
    write('B', 'draft:hardened');
    const fpB = path.join(rootDir, 'tasks', 'B.md');
    let cB = fs.readFileSync(fpB, 'utf8');
    cB = cB.replace('dependencies: []', 'dependencies: ["A"]');
    fs.writeFileSync(fpB, cB, 'utf8');
    await svc.transition('A', 'approve', 'agile_reviewer', 'ok');
    expect(svc.getTask('B').frontmatter.status).toBe('ready');
  });

  it('(3b) autoPromoteDependents: dep parcial (C pendente) → B continua draft:hardened', async () => {
    write('A2', 'review');
    write('C', 'in_progress');
    write('B2', 'draft:hardened');
    const fpB2 = path.join(rootDir, 'tasks', 'B2.md');
    let cB2 = fs.readFileSync(fpB2, 'utf8');
    cB2 = cB2.replace('dependencies: []', 'dependencies: ["A2","C"]');
    fs.writeFileSync(fpB2, cB2, 'utf8');
    await svc.transition('A2', 'approve', 'agile_reviewer', 'ok');
    expect(svc.getTask('B2').frontmatter.status).toBe('draft:hardened');
  });

  it('(4) parentAutoClose: todas as filhas done → pai fecha', async () => {
    writeWith('F1', 'done', { parent: '"P"' });
    write('F2', 'review');
    const fpF2 = path.join(rootDir, 'tasks', 'F2.md');
    let cF2 = fs.readFileSync(fpF2, 'utf8');
    cF2 = cF2.replace('dependencies: []', 'dependencies: []\nparent: "P"');
    fs.writeFileSync(fpF2, cF2, 'utf8');
    writeWith('P', 'review', { subtasks: '["F1","F2"]' });
    await svc.transition('F2', 'approve', 'agile_reviewer', 'ok');
    expect(svc.getTask('P').frontmatter.status).toBe('done');
    const pLogs = svc.getTask('P').log.map((l) => l.label);
    expect(pLogs).toContain('[Auto-encerrado]');
  });

  it('(4b) parentAutoClose: filha pendente → pai NÃO fecha', async () => {
    write('F3', 'review');
    const fpF3 = path.join(rootDir, 'tasks', 'F3.md');
    let cF3 = fs.readFileSync(fpF3, 'utf8');
    cF3 = cF3.replace('dependencies: []', 'dependencies: []\nparent: "P2"');
    fs.writeFileSync(fpF3, cF3, 'utf8');
    writeWith('F4', 'review', { parent: '"P2"' });
    writeWith('P2', 'review', { subtasks: '["F3","F4"]' });
    await svc.transition('F4', 'approve', 'agile_reviewer', 'ok');
    expect(svc.getTask('P2').frontmatter.status).toBe('review');
  });

  it('(4c) parentAutoClose: pai com children: (SEM subtasks:) e filhas done → pai fecha', async () => {
    writeWith('K1', 'done', { parent: '"K0"' });
    writeWith('K2', 'review', { parent: '"K0"' });
    writeWith('K0', 'review', { children: '["K1","K2"]' }); // sem subtasks:
    await svc.transition('K2', 'approve', 'agile_reviewer', 'ok');
    expect(svc.getTask('K0').frontmatter.status).toBe('done');
    const k0Logs = svc.getTask('K0').log.map((l) => l.label);
    expect(k0Logs).toContain('[Auto-encerrado]');
  });

  it('(4d) parentAutoClose: pai com AMBOS subtasks: e children: → usa o que tiver conteúdo', async () => {
    writeWith('L1', 'review', { parent: '"L0"' });
    writeWith('L0', 'review', { subtasks: '["L1"]', children: '["X","Y","Z"]' });
    await svc.transition('L1', 'approve', 'agile_reviewer', 'ok');
    expect(svc.getTask('L0').frontmatter.status).toBe('done'); // leu subtasks: primeiro, achou L1 done
  });

  it('(4e) start: pai com children: (SEM subtasks:) em ready → DecomposedParentStartError', async () => {
    writeWith('M0', 'ready', { children: '["M1","M2"]' });
    await expect(svc.transition('M0', 'start', 'dev'))
      .rejects.toThrow(DecomposedParentStartError);
    expect(svc.getTask('M0').frontmatter.status).toBe('ready'); // não transicionou
  });

  it('(9) idempotência: approve duas vezes não duplica auto-movimentos', async () => {
    write('A3', 'review');
    write('B3', 'draft:hardened');
    const fpB3 = path.join(rootDir, 'tasks', 'B3.md');
    let cB3 = fs.readFileSync(fpB3, 'utf8');
    cB3 = cB3.replace('dependencies: []', 'dependencies: ["A3"]');
    fs.writeFileSync(fpB3, cB3, 'utf8');
    await svc.transition('A3', 'approve', 'agile_reviewer', 'ok');
    expect(svc.getTask('B3').frontmatter.status).toBe('ready');
    const logCountAfterFirst = svc.getTask('B3').log.length;
    // A3 já está done — segunda transição falha (InvalidTransitionError)
    await expect(svc.transition('A3', 'approve', 'agile_reviewer', 'ok'))
      .rejects.toThrow(InvalidTransitionError);
    // B3 não mudou
    expect(svc.getTask('B3').log.length).toBe(logCountAfterFirst);
  });
});
