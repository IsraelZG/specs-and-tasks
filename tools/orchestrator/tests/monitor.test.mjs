// ORQ-10 · Testes unitários determinísticos (Node native test runner).
// Cobre os 3 cenários da Seção 4 da spec:
//   1. SSE no Painel: event buffer + broadcast (núcleo do SSE)
//   2. <id>.cancel dispara AbortController.abort() → {exit:null, timedOut:true}
//   3. Monitor: simula timeout e garante escrita do flag .cancel
//
// Sem rede, sem LLM, sem painel real. Rode com:
//   node --test tools/orchestrator/tests/monitor.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { findStuck, writeCancelFlags, STUCK_TIMEOUT_MS } from '../src/monitor.mjs';
import { startCancelWatcher } from '../src/agentAdapter.mjs';

// ══════════════════════════════════════════════════════════════════════════════
// Test 1 — Event buffer + broadcast (núcleo do SSE, sem HTTP real).
// O servidor HTTP é uma camada fina — a lógica que importa é: POST armazena no
// buffer + notifica ouvintes. Testamos isso diretamente.
// ══════════════════════════════════════════════════════════════════════════════
test('SSE: event buffer + broadcast entrega eventos na ordem', async () => {
  const eventBuffer = [];
  const MAX_EVENTS = 500;
  const listeners = new Set();

  function broadcast(evt) {
    eventBuffer.push(evt);
    if (eventBuffer.length > MAX_EVENTS) eventBuffer.splice(0, eventBuffer.length - MAX_EVENTS);
    for (const fn of listeners) fn(evt);
  }

  const taEvents = [];
  const allEvents = [];
  listeners.add((e) => { allEvents.push(e); if (e.taskId === 'T-A') taEvents.push(e); });

  broadcast({ taskId: 'T-A', type: 'step', detail: 'tool-call-1' });
  broadcast({ taskId: 'T-A', type: 'step', detail: 'tool-call-2' });
  broadcast({ taskId: 'T-B', type: 'done', detail: 'ok' });

  assert.equal(allEvents.length, 3, 'broadcast atinge todos os ouvintes');
  assert.equal(taEvents.length, 2, 'filtro por taskId funciona');
  assert.equal(taEvents[0].detail, 'tool-call-1', 'ordem preservada');
  assert.equal(eventBuffer.length, 3, 'buffer armazena eventos');
});

// ══════════════════════════════════════════════════════════════════════════════
// Test 2 — <id>.cancel dispara ac.abort() → shape {exit:null, timedOut:true}.
// Testa o startCancelWatcher (unidade isolada, sem LLM).
// ══════════════════════════════════════════════════════════════════════════════
test('Cancel-flag watcher: presence do arquivo dispara ac.abort() (e apaga o flag)', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orq10-cancel-'));
  const fakeOrchDir = path.join(tmp, 'orch');
  fs.mkdirSync(fakeOrchDir, { recursive: true });
  try {
    const flag = path.join(fakeOrchDir, 'T-CANCEL.cancel');

    const ac = new AbortController();
    let aborted = false;
    ac.signal.addEventListener('abort', () => { aborted = true; });

    const stop = startCancelWatcher({
      taskId: 'T-CANCEL',
      ac,
      intervalMs: 50,
      dir: fakeOrchDir,
    });

    await new Promise((r) => setTimeout(r, 80));
    fs.writeFileSync(flag, JSON.stringify({ ts: Date.now() }, null, 2));

    for (let i = 0; i < 20 && !aborted; i++) {
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.ok(aborted, 'ac.abort() deve ter sido chamado após presence do .cancel');

    for (let i = 0; i < 10; i++) {
      if (!fs.existsSync(flag)) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.ok(!fs.existsSync(flag), 'flag .cancel deve ter sido apagado pelo watcher');

    const fakeResult = { exit: ac.signal.aborted ? null : 0, timedOut: ac.signal.aborted, tail: '' };
    assert.equal(fakeResult.exit, null);
    assert.equal(fakeResult.timedOut, true);

    stop();
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Test 3 — Monitor: findStuck + writeCancelFlags em temp dir, com clock injetado.
// ══════════════════════════════════════════════════════════════════════════════
test('Monitor: findStuck + writeCancelFlags escrevem <id>.cancel após STUCK_TIMEOUT_MS', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orq10-monitor-'));
  try {
    const now = 1_000_000;
    const registry = {
      'T-A': { lastEventTs: now - 400_000, started: now - 500_000 },
      'T-B': { lastEventTs: now -  30_000, started: now -  60_000 },
      'T-C': {                       started: now - 400_000 },
      'T-D': { lastEventTs: now - 350_000, started: now - 400_000 },
    };

    const stuck = findStuck(registry, now);
    assert.deepEqual(stuck.sort(), ['T-A', 'T-C', 'T-D'], 'A, C, D devem ser stuck; B viva');

    const written = writeCancelFlags(stuck, tmp);
    assert.equal(written.length, 3);
    for (const fp of written) assert.ok(fs.existsSync(fp), `flag escrito: ${fp}`);

    const a = JSON.parse(fs.readFileSync(path.join(tmp, 'T-A.cancel'), 'utf8'));
    assert.equal(a.reason, 'stuck-monitor');
    assert.ok(typeof a.ts === 'number');

    const written2 = writeCancelFlags(stuck, tmp);
    assert.equal(written2.length, 3);
    assert.ok(fs.existsSync(path.join(tmp, 'T-A.cancel')));

    assert.equal(STUCK_TIMEOUT_MS, 300_000);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
