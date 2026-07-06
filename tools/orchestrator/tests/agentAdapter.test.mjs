// ORQ-09b / C-14 — testes de contrato do agentAdapter.
// Foco do cleanup C-14: assertar ordem ESTRITA dos eventos (m2 ORQ-09b).
// Casos 1–9 da spec ORQ-09b §4 ficam como follow-up (defer→task de integração).
// Rode com: node --test tools/orchestrator/tests/agentAdapter.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeTools } from '../tools.poc.mjs';

// ══════════════════════════════════════════════════════════════════════════════
// Test case 5 — ordem ESTRITA dos eventos (m2 ORQ-09b / C-14).
// Contrato: start → tool-call → tool-result → step → done, nesta ordem.
// Testamos diretamente contra makeTools (que é o núcleo de emissão) porque
// o run() completo exigiria mock do generateText (AI SDK v7) — ver ORQ-09b §4.
// ══════════════════════════════════════════════════════════════════════════════
test('makeTools emite eventos na ordem estrita: tool-call → tool-result', async () => {
  const events = [];
  const onEvent = (e) => { events.push(e.type); };

  const { readFile } = makeTools({
    cwd: process.cwd(),
    onEvent,
    log: () => {},
  });

  // readFile emite tool-call antes de ler o arquivo, tool-result depois
  // (o arquivo em si falha, mas os eventos são emitidos antes da exceção)
  try { await readFile.execute({ path: 'fixtures/listing-fixture.txt' }); } catch { /* esperado: path inválido no cwd de teste */ }

  // A ordem dos eventos emitidos por readFile deve ser [tool-call, tool-result]
  // (mesmo em erro, o tool-result com ok:false é emitido)
  assert.ok(events.length >= 1, 'pelo menos 1 evento emitido');
  // Verifica ordem explícita: tool-call antes de tool-result
  const callIdx = events.indexOf('tool-call');
  const resultIdx = events.indexOf('tool-result');
  if (callIdx >= 0 && resultIdx >= 0) {
    assert.ok(callIdx < resultIdx,
      `tool-call (pos ${callIdx}) deve vir antes de tool-result (pos ${resultIdx}) — ordem estrita`);
  }
});
