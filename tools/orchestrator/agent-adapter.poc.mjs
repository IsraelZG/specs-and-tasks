#!/usr/bin/env node
// ORQ-08 · PoC do AgentAdapter in-process (Vercel AI SDK).
// `run()` roda o loop do agente DENTRO deste processo (sem spawn('crush'), sem janela),
// com tools JS gated (tools.poc.mjs), provider DIRETO (Decisão C), stream de eventos
// (Decisão D) e cancelamento/timeout via AbortController (Decisão E). Devolve o mesmo
// shape AgentRunResult de T-1022 (`{exit, timedOut, tail}`).
//
// Rodar o selftest end-to-end:  node --env-file=../../.env agent-adapter.poc.mjs --selftest

import { generateText, stepCountIs } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeTools } from './tools.poc.mjs';
import { assemblePrompt } from '../scripts/orquestrar.mjs';

// ── Decisão C — registry de provider (multi-modelo DIRETO, sem Headroom) ──────────────
// Nome do roster = "prefixo/modelo". O prefixo mapeia p/ baseURL + env da chave.
// (O mapeamento completo — deepinfra, openrouter, opencode, anthropic — é da ORQ-09; o
//  PoC prova o padrão com deepseek direto.)
const PROVIDERS = {
  deepseek:   { baseURL: 'https://api.deepseek.com/v1',    apiKeyEnv: 'DEEPSEEK_API_KEY' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', apiKeyEnv: 'OPENROUTER_API_KEY' },
};

export function resolveModel(rosterName) {
  const slash = rosterName.indexOf('/');
  const prefix = slash === -1 ? rosterName : rosterName.slice(0, slash);
  const modelId = slash === -1 ? rosterName : rosterName.slice(slash + 1);
  const cfg = PROVIDERS[prefix];
  if (!cfg) throw new Error(`provider '${prefix}' não registrado (PoC suporta: ${Object.keys(PROVIDERS).join(', ')})`);
  const apiKey = process.env[cfg.apiKeyEnv];
  if (!apiKey) throw new Error(`${cfg.apiKeyEnv} ausente no ambiente (use --env-file)`);
  const provider = createOpenAICompatible({ name: prefix, baseURL: cfg.baseURL, apiKey });
  return provider(modelId);
}

/**
 * Roda um agente in-process. Substituto do spawnAgent (Crush) de T-1022/ORQ-04.
 * @param {{taskId:string, model:string, cwd:string, prompt:string, timeoutMs?:number,
 *          onEvent?:(e:object)=>void, signal?:AbortSignal, maxSteps?:number}} opts
 * @returns {Promise<{exit:number|null, timedOut:boolean, tail:string}>}
 */
export async function run(opts) {
  const { taskId, model, cwd, prompt, timeoutMs = 1_800_000, onEvent, signal: extSignal, maxSteps = 40 } = opts;

  const transcript = [];
  const log = (s) => { transcript.push(s); };
  const emit = (e) => { try { onEvent?.({ taskId, ...e }); } catch { /* noop */ } };

  // Decisão E — cancelamento/timeout: um AbortController que combina timeout + sinal externo.
  const ac = new AbortController();
  const onExtAbort = () => ac.abort();
  if (extSignal) extSignal.addEventListener('abort', onExtAbort, { once: true });
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let timedOut = false;

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
      prompt,
      onStepFinish: (step) => {
        const calls = (step.toolCalls ?? []).map((c) => c.toolName).join(',') || '—';
        log(`[step] tools=${calls} finish=${step.finishReason}`);
        emit({ type: 'step', tools: calls, finishReason: step.finishReason, ts: Date.now() });
      },
    });
    // "Done" (Decisão E): o loop termina quando o modelo para de chamar tools (finishReason
    // 'stop'), igual ao Crush encerrando quando o agente conclui. res.text = resposta final.
    log(`[done] ${res.text}`);
    emit({ type: 'done', text: res.text, steps: res.steps.length, ts: Date.now() });
  } catch (err) {
    if (ac.signal.aborted) {
      timedOut = true; exit = null;
      log(`[aborted] ${extSignal?.aborted ? 'cancelado externamente' : 'timeout'}`);
      emit({ type: 'aborted', reason: extSignal?.aborted ? 'cancel' : 'timeout', ts: Date.now() });
    } else {
      exit = 1;
      log(`[error] ${err.message}`);
      emit({ type: 'error', message: err.message, ts: Date.now() });
    }
  } finally {
    clearTimeout(timer);
    if (extSignal) extSignal.removeEventListener('abort', onExtAbort);
  }

  const tail = transcript.slice(-40).join('\n');
  return { exit, timedOut, tail };
}

// ── selftest — roda 1 task REAL end-to-end, in-process, sem janela ────────────────────
async function selftest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orq08-poc-'));
  console.log('=== SELFTEST ORQ-08 — 1 task end-to-end in-process (cwd descartável) ===');
  console.log('  cwd:', dir);

  const events = [];
  const result = await run({
    taskId: 'POC-SELFTEST',
    model: 'deepseek/deepseek-v4-flash',
    cwd: dir,
    timeoutMs: 120_000,
    onEvent: (e) => {
      events.push(e);
      // stream AO VIVO — cada passo aparece na hora (o que ORQ-10 vai levar pro painel).
      const d = e.tool ? ` ${e.tool}` : e.text ? ` "${String(e.text).slice(0, 60)}"` : '';
      console.log(`  → [${e.type}]${d}`);
    },
    prompt: assemblePrompt('work', 'POC-SELFTEST', 'deepseek/deepseek-v4-flash') + '\n\n' + [
      '---',
      '[INSTRUÇÃO OVERRIDE PARA O SELFTEST]',
      'Você é um agente de teste rodando tarefas de código. Ignore a skill acima. No diretório de trabalho atual:',
      '1) Use writeFile para criar um arquivo `resultado.txt` com o conteúdo EXATO: ORQ-08 PoC OK',
      '2) Use readFile para ler `resultado.txt` de volta e confirmar.',
      '3) Use bash para rodar o gate: node -e "console.log(\'gate:\', require(\'fs\').readFileSync(\'resultado.txt\',\'utf8\'))"',
      'Ao terminar, responda apenas: concluído.'
    ].join('\n'),
  });

  // Gate do selftest: a task foi executada de verdade (arquivo existe com o conteúdo certo).
  const created = path.join(dir, 'resultado.txt');
  const fileOk = fs.existsSync(created) && fs.readFileSync(created, 'utf8').includes('ORQ-08 PoC OK');
  const sawBash = events.some((e) => e.type === 'tool-call' && e.tool === 'bash');
  const sawWrite = events.some((e) => e.type === 'tool-call' && e.tool === 'writeFile');

  console.log('--- resultado ---');
  console.log('  AgentRunResult:', JSON.stringify(result));
  console.log('  arquivo criado in-process :', fileOk);
  console.log('  usou writeFile + bash     :', sawWrite && sawBash);
  console.log('  eventos emitidos (stream) :', events.length);

  const ok = result.exit === 0 && fileOk && sawWrite && sawBash;
  console.log(ok
    ? '\n✅ SELFTEST OK — 1 task real rodou end-to-end in-process, sem janela, com stream de eventos.'
    : '\n✖ SELFTEST FALHOU.');
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  return ok;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('agent-adapter.poc.mjs');
if (isMain && process.argv.includes('--selftest')) {
  selftest().then((ok) => process.exit(ok ? 0 : 1)).catch((e) => { console.error(e); process.exit(1); });
}
