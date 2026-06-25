import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';
import { WebSocket } from 'ws';
import { createApp } from '../src/server.js';

let app: ReturnType<typeof createApp>;
let server: Server;
let port: number;
let adminToken: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ADMIN_TOKEN = 'test-admin-token';
  adminToken = process.env.ADMIN_TOKEN!;
  ({ app, server } = createApp({ adminToken }));
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const addr = server.address();
  if (addr && typeof addr === 'object') {
    port = addr.port;
  } else {
    throw new Error('Failed to get server port');
  }
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('HTTP routes', () => {
  it('1: GET /health → 200 { ok: true }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('2: POST /admin/reset sem token → 403', async () => {
    const res = await request(app).post('/admin/reset');
    expect(res.status).toBe(403);
  });

  it('3: POST /admin/reset com token errado → 403', async () => {
    const res = await request(app)
      .post('/admin/reset')
      .set('Authorization', 'Bearer wrong-token');
    expect(res.status).toBe(403);
  });

  it('4: POST /admin/reset com token correto + NODE_ENV=test → 200 { ok: true }', async () => {
    const res = await request(app)
      .post('/admin/reset')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('5: POST /admin/reset com NODE_ENV=production → 403', async () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = await request(app)
      .post('/admin/reset')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
    process.env.NODE_ENV = oldEnv;
  });

  it('6: POST /control/relay/:clientId/execute sem ADMIN_TOKEN → 403', async () => {
    const res = await request(app)
      .post('/control/relay/qualquer/execute')
      .send({ cmd: 'ping', payload: {} });
    expect(res.status).toBe(403);
  });

  it('7: POST /control/relay/nao-existe/execute com ADMIN_TOKEN → 404', async () => {
    const res = await request(app)
      .post('/control/relay/nao-existe/execute')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cmd: 'ping', payload: {} });
    expect(res.status).toBe(404);
  });
});

describe('WebSocket relay', () => {
  it('8+9: cliente conecta e responde a relayCommand', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/control`, {
      headers: { Authorization: 'Bearer session-token-123' },
    });

    let clientId = '';
    await new Promise<void>((resolve) => {
      ws.on('open', () => resolve());
    });

    // Aguarda o servidor registrar e enviar clientId (opcionalmente via evento)
    // O spec só exige que o cliente entre no registry, então inferimos do relay:
    // disparamos relay com um clientId novo via stub e capturamos via interceptor
    const wsMessages: unknown[] = [];
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString()) as { corr_id?: string; cmd?: string; payload?: unknown };
      wsMessages.push(msg);
      if (msg.cmd === 'ping') {
        // responde com mesmo corr_id
        ws.send(JSON.stringify({ corr_id: msg.corr_id, result: 'ok' }));
      }
    });

    // Precisamos saber o clientId atribuído. Como o server não envia nada no open,
    // expomos via endpoint /control/registry (test-only) OU recebemos o id por algum evento.
    // Solução: usamos o endpoint /control/registry em NODE_ENV=test para inspecionar.
    const regRes = await request(app)
      .get('/control/registry')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(regRes.status).toBe(200);
    expect(Array.isArray(regRes.body.clients)).toBe(true);
    clientId = regRes.body.clients[0] as string;
    expect(typeof clientId).toBe('string');
    expect(clientId.length).toBeGreaterThan(0);

    const relayRes = await request(app)
      .post(`/control/relay/${clientId}/execute`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cmd: 'ping', payload: { hello: 'world' } });
    expect(relayRes.status).toBe(200);
    expect(relayRes.body.result).toBe('ok');
    expect(typeof relayRes.body.corr_id).toBe('string');
    expect((relayRes.body.corr_id as string).length).toBeGreaterThan(0);

    ws.close();
    await new Promise<void>((resolve) => ws.on('close', () => resolve()));
  });

  it('10: timeout — cliente não responde em 5s → 504', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/control`, {
      headers: { Authorization: 'Bearer session-token-timeout' },
    });
    await new Promise<void>((resolve) => ws.on('open', () => resolve()));

    // NÃO instala listener de message — cliente ignora os comandos

    const regRes = await request(app)
      .get('/control/registry')
      .set('Authorization', `Bearer ${adminToken}`);
    const clientId = regRes.body.clients[0] as string;

    const start = Date.now();
    const relayRes = await request(app)
      .post(`/control/relay/${clientId}/execute`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cmd: 'no-response', payload: {} });
    const elapsed = Date.now() - start;

    expect(relayRes.status).toBe(504);
    // sanity: deve ter esperado próximo de 5s (aceita variação)
    expect(elapsed).toBeGreaterThanOrEqual(4900);
    expect(elapsed).toBeLessThan(6000);

    ws.close();
    await new Promise<void>((resolve) => ws.on('close', () => resolve()));
  }, 10_000);
});

describe('Seed route', () => {
  it('11: POST /admin/seed/empty com token + NODE_ENV=test → 200 { ok: true, seed: "empty" }', async () => {
    const res = await request(app)
      .post('/admin/seed/empty')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, seed: 'empty' });
  });

  it('12: POST /admin/seed/empty sem token → 403', async () => {
    const res = await request(app).post('/admin/seed/empty');
    expect(res.status).toBe(403);
  });

  it('13: POST /admin/seed/empty + NODE_ENV=production → 403', async () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = await request(app)
      .post('/admin/seed/empty')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
    process.env.NODE_ENV = oldEnv;
  });
});
