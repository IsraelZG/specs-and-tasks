import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { TaskService } from '../services/task.service.js';
import { StatusDriftError } from '../services/task.types.js';

function makeTask(id: string, status: string): string {
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

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui.
`;
}

describe('Ledger + gate anti-drift', () => {
  let rootDir: string;
  let svc: TaskService;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-ledger-'));
    fs.mkdirSync(path.join(rootDir, 'tasks'));
    svc = new TaskService({ rootDir });
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  function write(id: string, status: string): void {
    fs.writeFileSync(path.join(rootDir, 'tasks', `${id}.md`), makeTask(id, status), 'utf8');
  }

  function readLedger(): string[] {
    const p = path.join(rootDir, '.nexus', 'transitions.jsonl');
    if (!fs.existsSync(p)) return [];
    return fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean);
  }

  function editStatus(id: string, newStatus: string): void {
    const filePath = path.join(rootDir, 'tasks', `${id}.md`);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/^status:.*$/m, `status: ${newStatus}`);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  // Caso 1: transição normal cria .nexus/transitions.jsonl com seed + entrada da transição
  it('primeira transição cria ledger com seed + entrada da transição', async () => {
    write('T-001', 'ready');
    await svc.transition('T-001', 'start', 'dev', 'iniciando');

    const lines = readLedger();
    expect(lines.length).toBeGreaterThanOrEqual(2);

    const seed = JSON.parse(lines[0]);
    expect(seed.id).toBe('T-001');
    expect(seed.action).toBe('seed');
    expect(seed.from).toBeNull();
    expect(seed.to).toBe('ready');
    expect(seed.agent).toBe('system');

    const tx = JSON.parse(lines[1]);
    expect(tx.id).toBe('T-001');
    expect(tx.action).toBe('start');
    expect(tx.from).toBe('ready');
    expect(tx.to).toBe('in_progress');
    expect(tx.agent).toBe('dev');
    expect(tx.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  // Caso 2: transições legítimas em sequência acumulam entradas coerentes
  it('sequência start → finish acumula entradas coerentes', async () => {
    write('T-002', 'ready');
    await svc.transition('T-002', 'start', 'dev');
    await svc.transition('T-002', 'finish', 'dev', 'pronto');

    const lines = readLedger();
    // seed + start + finish = 3
    expect(lines.length).toBe(3);

    const finish = JSON.parse(lines[2]);
    expect(finish.action).toBe('finish');
    expect(finish.from).toBe('in_progress');
    expect(finish.to).toBe('review');
  });

  // Caso 3: drift detectado — editar status na mão → StatusDriftError
  it('drift: edição manual do status lança StatusDriftError com valores corretos', async () => {
    write('T-003', 'ready');
    await svc.transition('T-003', 'start', 'dev');
    await svc.transition('T-003', 'finish', 'dev');

    // Edita o .md na mão (bypass) — muda review → done
    editStatus('T-003', 'done');

    await expect(
      svc.transition('T-003', 'approve', 'agile_reviewer', 'ok'),
    ).rejects.toThrow(StatusDriftError);

    try {
      await svc.transition('T-003', 'approve', 'agile_reviewer', 'ok');
    } catch (err) {
      expect(err).toBeInstanceOf(StatusDriftError);
      const drift = err as StatusDriftError;
      expect(drift.id).toBe('T-003');
      expect(drift.ledgerStatus).toBe('review');
      expect(drift.fileStatus).toBe('done');
    }

    // O arquivo NÃO foi alterado pelo drift
    expect(svc.getTask('T-003').frontmatter.status).toBe('done');
  });

  // Caso 4: reconcile após drift restaura e permite transição subsequente
  it('reconcile restaura status do arquivo para o ledger e permite transição subsequente', async () => {
    write('T-004', 'ready');
    await svc.transition('T-004', 'start', 'dev');
    await svc.transition('T-004', 'finish', 'dev');

    editStatus('T-004', 'done');

    const reconciled = svc.reconcile('T-004', 'agile_reviewer');
    expect(reconciled.frontmatter.status).toBe('review');

    // Log tem [Reconciliado]
    const lastLog = reconciled.log.at(-1)!;
    expect(lastLog.label).toBe('[Reconciliado]');
    expect(lastLog.message).toContain('drift corrigido');

    // Ledger tem entrada reconcile
    const lines = readLedger();
    const lastEntry = JSON.parse(lines[lines.length - 1]);
    expect(lastEntry.action).toBe('reconcile');
    expect(lastEntry.to).toBe('review');

    // Transição subsequente funciona
    const done = await svc.transition('T-004', 'approve', 'agile_reviewer', 'ok');
    expect(done.frontmatter.status).toBe('done');
  });

  // Caso 5: reconcile sem drift → no-op
  it('reconcile sem drift é no-op (status inalterado)', async () => {
    write('T-005', 'ready');
    await svc.transition('T-005', 'start', 'dev');

    const beforeLogLen = svc.getTask('T-005').log.length;
    const before = svc.getTask('T-005').frontmatter.status;

    const reconciled = svc.reconcile('T-005', 'qa');
    expect(reconciled.frontmatter.status).toBe(before);
    // Log não deve crescer (no-op)
    expect(reconciled.log.length).toBe(beforeLogLen);
  });

  // Caso 6: task pré-existente — primeira transição semeia baseline (sem drift)
  it('task pré-existente: primeira transição semeia baseline e não lança drift', async () => {
    write('T-006', 'done');

    // block a partir de done é válido (from: '*')
    const result = await svc.transition('T-006', 'block', 'dev', 'descobri bug');
    expect(result.frontmatter.status).toBe('blocked');

    const lines = readLedger();
    const seed = JSON.parse(lines[0]);
    expect(seed.action).toBe('seed');
    expect(seed.to).toBe('done');
  });
});
