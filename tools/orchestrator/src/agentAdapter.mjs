// ORQ-10 · production AgentAdapter in-process (substituto do PoC ORQ-08).
// Quase igual ao `agent-adapter.poc.mjs`, com 2 acréscimos:
//   1) Default `onEvent`: se nenhum handler custom for passado, faz POST a
//      `${PANEL_BASE}/api/instances/events` — o painel :8780 (ORQ-06) agrega e
//      distribui via SSE para o console ao vivo (Decisão D do ADR 0008).
//   2) Cancel-file watcher: setInterval(1s) checa `tasks/.orchestrator/<id>.cancel`.
//      Se aparecer, aborta o loop (Decisão E) e apaga o flag.
// Mantém o shape `AgentRunResult = {exit, timedOut, tail}` de T-1022 / ADR 0008.

import { generateText, stepCountIs } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeTools } from '../tools.poc.mjs';
import { assemblePrompt } from '../../scripts/orquestrar.mjs';

// ── Decisão C — registry de provider (mesmo do PoC; ORQ-09 amplia) ────────────
const PROVIDERS = {
  deepseek:   { baseURL: 'https://api.deepseek.com/v1',    apiKeyEnv: 'DEEPSEEK_API_KEY' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1',   apiKeyEnv: 'OPENROUTER_API_KEY' },
};

export function resolveModel(rosterName) {
  const slash = rosterName.indexOf('/');
  const prefix = slash === -1 ? rosterName : rosterName.slice(0, slash);
  const modelId = slash === -1 ? rosterName : rosterName.slice(slash + 1);
  const cfg = PROVIDERS[prefix];
  if (!cfg) throw new Error(`provider '${prefix}' não registrado (suportado: ${Object.keys(PROVIDERS).join(', ')})`);
  const apiKey = process.env[cfg.apiKeyEnv];
  if (!apiKey) throw new Error(`${cfg.apiKeyEnv} ausente (use --env-file)`);
  const provider = createOpenAICompatible({ name: prefix, baseURL: cfg.baseURL, apiKey });
  return provider(modelId);
}

// ── Paths / panel wiring ─────────────────────────────────────────────────────
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(HERE, '..', '..');                  // tools/orchestrator → Docs
const ORCH_DIR = path.join(DOCS_ROOT, 'tasks', '.orchestrator');
const PANEL_BASE = process.env.ORQ10_PANEL_URL || 'http://127.0.0.1:8780';

/** POST silencioso do evento ao painel (best-effort; painel offline não bloqueia agente). */
export async function postEventToPanel(evt) {
  try {
    await fetch(`${PANEL_BASE}/api/instances/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evt),
      signal: AbortSignal.timeout(2000),
    });
  } catch { /* painel offline: ok — adapter continua */ }
}

function cancelFlagPath(taskId, dir = ORCH_DIR) {
  const safe = String(taskId).replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(dir, `${safe}.cancel`);
}

/**
 * Inicia o watcher de cancel: checa `<id>.cancel` a cada `intervalMs`.
 * Ao encontrar, chama `ac.abort()` e apaga o flag.
 * Retorna `stop()` para desligar.
 */
export function startCancelWatcher({ taskId, ac, intervalMs = 1000, fsMod = fs, dir }) {
  const flag = cancelFlagPath(taskId, dir);
  const t = setInterval(() => {
    try {
      if (fsMod.existsSync(flag)) {
        try { fsMod.unlinkSync(flag); } catch { /* best-effort */ }
        ac.abort('cancel-flag');
      }
    } catch { /* noop */ }
  }, intervalMs);
  return () => clearInterval(t);
}

/**
 * Roda um agente in-process. Substituto de produção do `agent-adapter.poc.mjs`.
 * @param {{taskId:string, model:string, cwd:string, prompt?:string, timeoutMs?:number,
 *          onEvent?:(e:object)=>void, signal?:AbortSignal, maxSteps?:number,
 *          cancelWatcher?:boolean}} opts
 * @returns {Promise<{exit:number|null, timedOut:boolean, tail:string}>}
 */
export async function run(opts) {
  const {
    taskId, model, cwd, prompt,
    timeoutMs = 1_800_000,
    onEvent: userOnEvent,
    signal: extSignal,
    maxSteps = 40,
    cancelWatcher = true,
  } = opts;

  const finalPrompt = prompt ?? assemblePrompt('work', taskId, model);

  // Fallback padrão: se nenhum onEvent custom, posta no painel.
  const onEvent = userOnEvent || postEventToPanel;

  const transcript = [];
  const log = (s) => { transcript.push(s); };
  const emit = (e) => { try { onEvent({ taskId, ...e }); } catch { /* noop */ } };

  // Decisão E — cancelamento/timeout.
  const ac = new AbortController();
  const onExtAbort = () => ac.abort();
  if (extSignal) extSignal.addEventListener('abort', onExtAbort, { once: true });
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let timedOut = false;

  // ORQ-10 · cancel-file watcher (só se houver taskId).
  const stopWatcher = cancelWatcher && taskId
    ? startCancelWatcher({ taskId, ac })
    : () => {};

  const tools = makeTools({
    cwd,
    signal: ac.signal,
    log,
    onEvent: (e) => emit(e),
  });

  emit({ type: 'start', model, cwd, ts: Date.now() });
  let exit = 0;
  try {
    const res = await generateText({
      model: resolveModel(model),
      tools,
      stopWhen: stepCountIs(maxSteps),
      abortSignal: ac.signal,
      prompt: finalPrompt,
      onStepFinish: (step) => {
        const calls = (step.toolCalls ?? []).map((c) => c.toolName).join(',') || '—';
        log(`[step] tools=${calls} finish=${step.finishReason}`);
        emit({ type: 'step', tools: calls, finishReason: step.finishReason, ts: Date.now() });
      },
    });
    log(`[done] ${res.text}`);
    emit({ type: 'done', text: res.text, steps: res.steps.length, ts: Date.now() });
  } catch (err) {
    if (ac.signal.aborted) {
      timedOut = true; exit = null;
      const reason = extSignal?.aborted ? 'cancel' : (ac.signal.reason === 'cancel-flag' ? 'cancel' : 'timeout');
      log(`[aborted] ${reason}`);
      emit({ type: 'aborted', reason, ts: Date.now() });
    } else {
      exit = 1;
      log(`[error] ${err.message}`);
      emit({ type: 'error', message: err.message, ts: Date.now() });
    }
  } finally {
    clearTimeout(timer);
    stopWatcher();
    if (extSignal) extSignal.removeEventListener('abort', onExtAbort);
  }

  const tail = transcript.slice(-40).join('\n');
  return { exit, timedOut, tail };
}
