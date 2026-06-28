import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Server } from 'http';
import { AddressInfo } from 'net';
import { TaskService } from '../services/task.service.js';
import { TaskController } from '../services/task.controller.js';
import { createApp } from '../index.js';

describe('Compress REST API (POST /api/compress)', () => {
  let rootDir: string;
  let tasksDir: string;
  let server: Server;
  let base: string;

  beforeAll(() => {
    process.env.NEXUS_COMPRESSOR = 'passthrough';
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-compress-'));
    tasksDir = path.join(rootDir, 'tasks');
    fs.mkdirSync(tasksDir);
    const controller = new TaskController(new TaskService({ rootDir }));
    server = createApp(controller).listen(0);
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(() => {
    delete process.env.NEXUS_COMPRESSOR;
    server.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    for (const f of fs.readdirSync(tasksDir)) fs.rmSync(path.join(tasksDir, f));
  });

  const post = (url: string, body: unknown) =>
    fetch(base + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('comprime texto com passthrough → 200, compressed === text', async () => {
    const res = await post('/api/compress', { text: 'hello world' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.compressed).toBe('hello world');
    expect(data.stats.originalChars).toBe(11);
    expect(data.stats.compressedChars).toBe(11);
    expect(data.stats.ratio).toBe(1);
    expect(data.stats.engine).toBe('passthrough');
  });

  it('retorna 400 quando text está ausente', async () => {
    const res = await post('/api/compress', {});
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando text não é string', async () => {
    const res = await post('/api/compress', { text: 123 });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando text é string vazia', async () => {
    const res = await post('/api/compress', { text: '' });
    expect(res.status).toBe(400);
  });
});
