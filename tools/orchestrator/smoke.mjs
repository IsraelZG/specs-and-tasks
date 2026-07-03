#!/usr/bin/env node
// ORQ-08 · Passo 1 — SMOKE da premissa.
// Prova que o loop de agente do Vercel AI SDK roda IN-PROCESS: o modelo chama uma
// tool JS (executada AQUI, dentro deste processo Node — sem subprocesso, sem janela de
// terminal), com provider DIRETO (DeepSeek, sem Headroom). Se isto funciona, a premissa
// de trocar o spawn('crush') por um loop in-process está provada.
//
// Rodar: (após `npm install` neste dir)
//   node --env-file=../../.env smoke.mjs      (ou: npm run smoke)
//
// Requer DEEPSEEK_API_KEY no ../../.env (Docs root).

import { generateText, tool, stepCountIs } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error('✖ DEEPSEEK_API_KEY ausente (use --env-file=../../.env). BLOCKER de ambiente.');
  process.exit(2);
}

// Provider DIRETO — OpenAI-compatible, sem proxy/Headroom.
const deepseek = createOpenAICompatible({
  name: 'deepseek',
  baseURL: 'https://api.deepseek.com',
  apiKey,
});

let toolRan = false; // prova de que a função JS executou DENTRO do processo, no meio do loop.

const soma = tool({
  description: 'Soma dois números inteiros e devolve o resultado.',
  inputSchema: z.object({ a: z.number(), b: z.number() }),
  execute: async ({ a, b }) => {
    toolRan = true;
    console.log(`  [tool soma] executando IN-PROCESS: ${a} + ${b}`);
    return { result: a + b };
  },
});

console.log('=== SMOKE ORQ-08 — loop AI SDK in-process, provider direto (DeepSeek) ===');
const t0 = Date.now();

const res = await generateText({
  model: deepseek('deepseek-chat'),
  tools: { soma },
  stopWhen: stepCountIs(5),
  prompt: 'Quanto é 21 + 21? Você DEVE usar a ferramenta "soma" para calcular, depois responda o número.',
  onStepFinish: (step) => {
    const calls = (step.toolCalls ?? []).map((c) => c.toolName).join(',') || '—';
    console.log(`  [step] tool_calls=${calls}  finish=${step.finishReason}`);
  },
});

const ms = Date.now() - t0;
console.log('--- resultado ---');
console.log('  texto final :', JSON.stringify(res.text));
console.log('  steps       :', res.steps.length);
console.log('  tool rodou  :', toolRan);
console.log(`  tempo       : ${ms}ms`);

// Gate do smoke: a tool JS foi executada in-process E a resposta contém 42.
const ok = toolRan && /42/.test(res.text);
console.log(ok ? '\n✅ SMOKE OK — loop in-process + tool JS + provider direto provados.' : '\n✖ SMOKE FALHOU.');
process.exit(ok ? 0 : 1);
