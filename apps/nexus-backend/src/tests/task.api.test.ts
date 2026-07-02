import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Server } from 'http';
import { AddressInfo } from 'net';
import { TaskService } from '../services/task.service.js';
import { TaskController } from '../services/task.controller.js';
import { createApp } from '../index.js';
import { StatusDriftError } from '../services/task.types.js';

// Evita importar/baixar o modelo via router.ts (importado transitivamente por index.ts).
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(async () => async () => [{ generated_text: 'a, b, c' }]),
}));

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
> Registrem aqui.
`;
}

describe('Tasks REST API (createApp)', () => {
  let rootDir: string;
  let tasksDir: string;
  let server: Server;
  let base: string;

  beforeAll(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-api-'));
    tasksDir = path.join(rootDir, 'tasks');
    fs.mkdirSync(tasksDir);
    const controller = new TaskController(new TaskService({ rootDir }));
    server = createApp(controller).listen(0);
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(() => {
    server.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    for (const f of fs.readdirSync(tasksDir)) fs.rmSync(path.join(tasksDir, f));
  });

  function write(id: string, status: string): void {
    fs.writeFileSync(path.join(tasksDir, `${id}.md`), makeTask(id, status), 'utf8');
  }

  const post = (url: string, body: unknown) =>
    fetch(base + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('GET /api/tasks lista DTOs leves (sem body)', async () => {
    write('T-800', 'draft');
    write('T-801', 'done');
    const res = await fetch(`${base}/api/tasks`);
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list).toHaveLength(2);
    expect(list[0]).toHaveProperty('id');
    expect(list[0]).toHaveProperty('status');
    expect(list[0]).not.toHaveProperty('body');
  });

  it('GET /api/tasks?status filtra', async () => {
    write('T-800', 'draft');
    write('T-801', 'done');
    const res = await fetch(`${base}/api/tasks?status=done`);
    const list = await res.json();
    expect(list.map((t: { id: string }) => t.id)).toEqual(['T-801']);
  });

  it('GET /api/tasks/:id retorna detalhe com body e log', async () => {
    write('T-802', 'in_progress');
    const res = await fetch(`${base}/api/tasks/T-802`);
    expect(res.status).toBe(200);
    const dto = await res.json();
    expect(dto.id).toBe('T-802');
    expect(dto).toHaveProperty('body');
    expect(Array.isArray(dto.log)).toBe(true);
  });

  it('GET /api/tasks/:id inexistente → 404', async () => {
    const res = await fetch(`${base}/api/tasks/T-999`);
    expect(res.status).toBe(404);
  });

  it('POST /api/tasks cria draft → 201', async () => {
    const res = await post('/api/tasks', { id: 'T-803', title: 'Nova', complexity: 4, target_agent: 'devops_agent' });
    expect(res.status).toBe(201);
    const dto = await res.json();
    expect(dto.status).toBe('draft');
    expect(dto.target_agent).toBe('devops_agent');
  });

  it('POST /api/tasks sem title → 400', async () => {
    const res = await post('/api/tasks', { id: 'T-804' });
    expect(res.status).toBe(400);
  });

  it('POST /api/tasks com campos inválidos (complexidade ou array) → 400', async () => {
    const r1 = await post('/api/tasks', { id: 'T-811', title: 'X', complexity: 'invalid' });
    expect(r1.status).toBe(400);
    const r2 = await post('/api/tasks', { id: 'T-812', title: 'X', dependencies: 'not-an-array' });
    expect(r2.status).toBe(400);
    const r3 = await post('/api/tasks', { id: 'T-813', title: 'X', complexity: -5 });
    expect(r3.status).toBe(400);
  });

  it('POST transition start: ready → in_progress', async () => {
    write('T-805', 'ready');
    const res = await post('/api/tasks/T-805/transition', { action: 'start', agent: 'claude', message: 'go' });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('in_progress');
  });

  it('transition sem agent → 400; ação inválida → 400', async () => {
    write('T-806', 'draft');
    expect((await post('/api/tasks/T-806/transition', { action: 'start' })).status).toBe(400);
    expect((await post('/api/tasks/T-806/transition', { action: 'nope', agent: 'x' })).status).toBe(400);
  });

  it('transition inválida pela máquina de estados → 409', async () => {
    write('T-807', 'draft');
    const res = await post('/api/tasks/T-807/transition', { action: 'approve', agent: 'qa' });
    expect(res.status).toBe(409);
  });

  it('concorrência: dois start na mesma task → 2º retorna 409', async () => {
    write('T-808', 'ready');
    const first = await post('/api/tasks/T-808/transition', { action: 'start', agent: 'dev1' });
    const second = await post('/api/tasks/T-808/transition', { action: 'start', agent: 'dev2' });
    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
  });

  it('POST assign troca o target_agent', async () => {
    write('T-809', 'draft');
    const res = await post('/api/tasks/T-809/assign', { target_agent: 'frontend_agent' });
    expect(res.status).toBe(200);
    expect((await res.json()).target_agent).toBe('frontend_agent');
  });

  it('POST log adiciona progresso sem mudar status', async () => {
    write('T-810', 'in_progress');
    const res = await post('/api/tasks/T-810/log', { agent: 'dev', message: 'checkpoint' });
    expect(res.status).toBe(200);
    const dto = await res.json();
    expect(dto.status).toBe('in_progress');
    expect(dto.log.at(-1).label).toBe('[Progresso]');
  });

  it('POST transition approve com agent != reviewer_agent → 403', async () => {
    write('T-811', 'review');
    const res = await post('/api/tasks/T-811/transition', { action: 'approve', agent: 'dev', message: 'ok' });
    expect(res.status).toBe(403);
  });

  it('POST transition approve com agent "agile_reviewer:<modelo>" → 200 (papel autorizado, modelo registrado)', async () => {
    write('T-811b', 'review');
    const res = await post('/api/tasks/T-811b/transition', {
      action: 'approve',
      agent: 'agile_reviewer:gemini',
      message: 'ok',
    });
    expect(res.status).toBe(200);
    const dto = await res.json();
    expect(dto.status).toBe('done');
    expect(dto.log.at(-1).agent).toBe('agile_reviewer:gemini');
  });

  it('POST transition approve com agent "outropapel:modelo" → 403 (prefixo de papel ainda é checado)', async () => {
    write('T-811c', 'review');
    const res = await post('/api/tasks/T-811c/transition', {
      action: 'approve',
      agent: 'dev:gemini',
      message: 'ok',
    });
    expect(res.status).toBe(403);
  });

  it('POST transition sob drift (status adulterado) → 409', async () => {
    write('T-812', 'ready');
    // Semeia o ledger com start
    await post('/api/tasks/T-812/transition', { action: 'start', agent: 'dev' });
    // Finaliza normalmente → ledger head = review
    await post('/api/tasks/T-812/transition', { action: 'finish', agent: 'dev' });

    // Edita o .md na mão simulando bypass (muda review → done)
    const filePath = path.join(tasksDir, 'T-812.md');
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/^status:.*$/m, 'status: done');
    fs.writeFileSync(filePath, content, 'utf8');

    // Agora tenta approve → deve dar 409 (drift)
    const res = await post('/api/tasks/T-812/transition', { action: 'approve', agent: 'agile_reviewer', message: 'ok' });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('Drift de status');
  });

  // ── T-1028: claim via HTTP ──

  it('POST transition claim com agile_reviewer:gemini → 200, status in_review', async () => {
    write('T-2001', 'review');
    const res = await post('/api/tasks/T-2001/transition', {
      action: 'claim',
      agent: 'agile_reviewer:gemini',
      message: 'reivindicando',
    });
    expect(res.status).toBe(200);
    const dto = await res.json();
    expect(dto.status).toBe('in_review');
  });

  it('POST transition claim com dev:gemini (papel errado) → 403', async () => {
    write('T-2002', 'review');
    const res = await post('/api/tasks/T-2002/transition', {
      action: 'claim',
      agent: 'dev:gemini',
      message: 'quero revisar',
    });
    expect(res.status).toBe(403);
  });
});
