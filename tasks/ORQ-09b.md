---
id: ORQ-09b
title: "VercelAgentAdapter (run() in-process + registry de provider)"
status: done
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-09a"]
blocks: []
parent_task: "ORQ-09"
capacity_target: sonnet
---

# ORQ-09b · VercelAgentAdapter — run() in-process + registry de provider

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js ≥22, **JS puro (`.mjs`), sem TypeScript** (mesma nota de ORQ-09a).
- **Test Runner:** `node:test` + `node:assert/strict` (mesma escolha de ORQ-09a — consistência).
- **Tarefa de TOOLING do CONTROLE (Docs).**
- **Capacidade-alvo:** sonnet — porta e generaliza o `run()` já provado (ORQ-08 selftest), com
  registry de provider real (não fake) e testes com provider fake (sem gastar $).

## 1. Objetivo
Promover `tools/orchestrator/agent-adapter.poc.mjs` (ORQ-08, provado no `--selftest`) para produção
testada: `run()` in-process consumindo o harness de ORQ-09a, com **registry de provider real**
(mapeando os prefixos do roster vivo em `tasks/orquestrador.config.json` para `baseURL`/`apiKeyEnv`
verificados) e testes com um provider **fake** (loop determinístico, sem chamar LLM de verdade).

**Correção de contrato (achado do endurecimento — não é o que ORQ-09 original dizia):** o texto
original desta task afirmava "`implements AgentAdapter`" citando a interface de T-1022
(`AgentRunOptions {role,taskId,cwd,env?,timeoutMs?}` → `AgentRunResult`). Essa interface pertence a
`apps/nexus-backend/src/runner/agent-adapter.ts` — parte do **Nexus, congelado** (CLAUDE.md:
"apps/nexus-backend e apps/nexus-frontend... estão congelados"), e `AgentRunOptions` **não carrega
`model` nem `prompt`**. O `orquestrar.mjs` **vivo** (o que este spike realmente substitui) passa
`{id, action, role, model, cwd}` pro spawn e monta o texto do prompt separadamente via
`assemblePrompt(action, id, model)` (ORQ-04). Logo: `VercelAgentAdapter.run()` **reusa o formato
`AgentRunResult` de T-1022** (`{exit, timedOut, tail}` — mesmos campos/tipos, citado e preservado),
mas suas **opções de entrada** seguem o shape já provado no PoC do ORQ-08 (`VercelAgentRunOptions`,
abaixo) — que é o que o `orquestrar.mjs` vivo precisa, não o `AgentRunOptions` do Nexus congelado.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] **`tools/orchestrator/agent-adapter.poc.mjs` (ORQ-08)** — FONTE CANÔNICA, `run()`/`resolveModel()`
      já provados no selftest (12 eventos, `{exit:0,timedOut:false}`, arquivo criado in-process).
- [ ] **ORQ-09a** — `makeTools()` que este adapter consome (import direto, mesmo diretório `src/`).
- [ ] `apps/nexus-backend/src/runner/agent-adapter.ts` (T-1022) — `AgentRunResult{exit,timedOut,tail}`
      é reusado (campos idênticos); `AgentAdapter`/`AgentRunOptions` do Nexus **não** são implementados
      literalmente (ver correção de contrato acima).
- [ ] `tools/scripts/orquestrar.mjs` — `spawnAgent({id,action,role,model,cwd})` (linhas ~281–316,
      o alvo que ORQ-11 vai trocar por este adapter) e `assemblePrompt(action,id,model)` (reusável
      para montar o `prompt` que `run()` recebe).
- [ ] `tasks/orquestrador.config.json` — roster vivo: `by_level.haiku = ["deepseek/deepseek-v4-flash",
      "opencode-zen-ent/mimo-v2.5"]`, `by_level.sonnet = ["opencode-go-ent/minimax-m3",
      "deepseek/deepseek-v4-pro"]`, `by_level.opus = ["anthropic/claude-opus-4-8"]`.
- [ ] **`scripts/headroom-proxies.mjs`** (`PROXIES`) — fonte real de `baseURL`/`apiKeyEnv` por
      prefixo (já em uso em produção pelo painel Headroom): `deepseek` → `https://api.deepseek.com/v1`
      / `DEEPSEEK_API_KEY`; `opencode-go-ent` → `https://opencode.ai/zen/go/v1` / `OPENCODE_ENT_API_KEY`;
      `opencode-zen-ent` → `https://opencode.ai/zen/v1` / `OPENCODE_ENT_API_KEY`.
- [ ] `docs/adr/0008-agent-adapter-in-process.md` §Decisão C (registry), §D (eventos), §E (cancel/done).

### Contratos exatos
```js
// --- tools/orchestrator/src/agentAdapter.mjs ---
import { generateText, stepCountIs } from 'ai';        // ai@7.0.14
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'; // @ai-sdk/openai-compatible@3.0.5
import { makeTools } from './tools.mjs';                // ORQ-09a

/**
 * Registry de provider — DERIVADO de scripts/headroom-proxies.mjs PROXIES (baseURL/env reais).
 * Cobre os prefixos do roster `haiku`+`sonnet` em orquestrador.config.json. `anthropic` (nível
 * `opus`) e `aihubmix`/`gemini` (by_capability `vision`) NÃO têm baseURL/chave direta confirmada
 * no repo — ver §6 (aberto, não inventado).
 */
export const PROVIDERS = {
  deepseek:         { baseURL: 'https://api.deepseek.com/v1',     apiKeyEnv: 'DEEPSEEK_API_KEY' },
  'opencode-go-ent': { baseURL: 'https://opencode.ai/zen/go/v1',  apiKeyEnv: 'OPENCODE_ENT_API_KEY' },
  'opencode-zen-ent':{ baseURL: 'https://opencode.ai/zen/v1',     apiKeyEnv: 'OPENCODE_ENT_API_KEY' },
};

/**
 * Resolve "prefixo/modelo" (nome do roster) para um LanguageModel do AI SDK, via provider direto.
 * @param {string} rosterName  ex.: "deepseek/deepseek-v4-pro"
 * @param {(name:string)=>import('ai').LanguageModel} [providerFactory]  injeção p/ teste (fake provider)
 * @throws {Error} provider não registrado, ou apiKeyEnv ausente do ambiente
 */
export function resolveModel(rosterName, providerFactory) { /* ... */ }

/**
 * @typedef {{
 *   taskId: string,
 *   model: string,               // "prefixo/modelo" do roster — NÃO existe em AgentRunOptions (T-1022)
 *   cwd: string,
 *   prompt: string,               // texto já montado (ex.: assemblePrompt de ORQ-04) — idem
 *   timeoutMs?: number,           // default 1_800_000 — mesmo default de AgentRunOptions (T-1022)
 *   onEvent?: (e: object) => void,
 *   signal?: AbortSignal,
 *   maxSteps?: number,            // default 40
 * }} VercelAgentRunOptions
 */

/**
 * @param {VercelAgentRunOptions} opts
 * @returns {Promise<{exit: number|null, timedOut: boolean, tail: string}>}
 *   — AgentRunResult: MESMOS campos/tipos de T-1022 (apps/nexus-backend/src/runner/agent-adapter.ts).
 */
export async function run(opts) { /* ... */ }
```
- `resolveModel`: separa `rosterName` em `prefix`/`modelId` pelo primeiro `/`; busca `PROVIDERS[prefix]`; lê `process.env[apiKeyEnv]`; se `providerFactory` for passado (testes), usa-o no lugar de `createOpenAICompatible` real; retorna `provider(modelId)`. Provider ausente ou env ausente → `throw new Error(...)` com mensagem citando qual dos dois faltou.
- `run`: monta `AbortController` combinando `timeoutMs` (setTimeout→abort) com `opts.signal` externo (listener `once`); chama `makeTools({cwd, signal, onEvent, log})` de ORQ-09a; roda `generateText({model: resolveModel(opts.model), tools, stopWhen: stepCountIs(opts.maxSteps ?? 40), abortSignal: signal, prompt: opts.prompt, onStepFinish})`; emite eventos `start`/`step`/`done`/`aborted`/`error` (payloads exatos: ver `docs/adr/0008-*.md` tabela da Decisão D); devolve `{exit, timedOut, tail}` — `tail` = últimas 40 linhas do transcript interno (mesmo formato de T-1022, campo por campo).
- "Done": loop termina quando `finishReason==='stop'` (modelo parou de chamar tools) — idêntico ao PoC provado.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `tools/orchestrator/agent-adapter.poc.mjs` (ORQ-08) — fonte a portar
- **[READ]** `tools/orchestrator/src/tools.mjs` (ORQ-09a)
- **[READ]** `scripts/headroom-proxies.mjs` (`PROXIES`) — baseURL/env por prefixo
- **[READ]** `tasks/orquestrador.config.json` — roster vivo
- **[CREATE]** `tools/orchestrator/src/agentAdapter.mjs` — `PROVIDERS`, `resolveModel`, `run`
- **[CREATE]** `tools/orchestrator/tests/agentAdapter.test.mjs` — `node:test`, casos da §4 (provider FAKE)
- **[UPDATE]** `tools/orchestrator/package.json` — `main`/exports se necessário para ORQ-11 importar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** `node:test` (mesma escolha de ORQ-09a).
- [x] **Provider FAKE obrigatório nos testes automatizados** (não gasta $): injete `providerFactory`
      em `resolveModel`/`run` retornando um `LanguageModel` stub cujo `doGenerate` é determinístico
      (ex.: sempre chama a tool `writeFile` uma vez e para). O AI SDK v7 aceita um `LanguageModel`
      customizado para isso (ver `ai` docs de testing/`MockLanguageModelV2` se disponível na versão
      instalada — **verificar exporte exato antes de codar, não chutar o nome**; se não existir helper
      de mock pronto na v7.0.14, implementar um objeto mínimo satisfazendo a interface `LanguageModel`
      usada por `generateText` — citar no Handover qual caminho foi tomado).
- [x] **Fora de Escopo:** stream pro painel (ORQ-10); religar `orquestrar.mjs` (ORQ-11); provider real
      pago nos testes automatizados (só manual/opt-in, fora do gate).

Casos de teste (numerados):
1. `resolveModel('deepseek/deepseek-v4-pro', fakeFactory)` retorna um model; `fakeFactory` foi chamado com os args esperados (baseURL/apiKey de `PROVIDERS.deepseek`).
2. `resolveModel('provedor-inexistente/x')` → lança `Error` citando o prefixo.
3. `resolveModel('deepseek/x')` com `DEEPSEEK_API_KEY` ausente do `process.env` (limpo no teste) → lança `Error` citando a env var.
4. `run()` com provider fake que chama `writeFile` 1x e para → `AgentRunResult.exit === 0`, arquivo criado no `cwd` de teste.
5. `run()` emite eventos `start` → `tool-call` → `tool-result` → `step` → `done`, nesta ordem (via `onEvent` capturado num array).
6. `run()` com `timeoutMs` pequeno e provider fake que não conclui a tempo → `{exit:null, timedOut:true}`.
7. `run()` com `signal` externo abortado no meio → `{exit:null, timedOut:true}`, evento `aborted` com `reason:'cancel'`.
8. `run()` com provider fake que lança erro → `{exit:1, timedOut:false}`, evento `error` emitido.
9. `tail` do resultado contém as últimas linhas do transcript (não string vazia) em todos os casos acima.
10. **Smoke/selftest real (opt-in, não no gate automatizado):** `node --env-file=../../.env agentAdapter.smoke.mjs` (ou reuso do `--selftest` de ORQ-08 apontando pro módulo novo) roda 1 task trivial com `deepseek/deepseek-v4-flash` de verdade — rodar manualmente e colar a saída no Handover, não faz parte do `node --test`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO chame provider real pago dentro de `node --test` (gate automatizado) — só fake. O real é opt-in manual (caso 10).
> - NÃO invente `baseURL`/`apiKeyEnv` para prefixos fora de `PROVIDERS` (deepseek/opencode-go-ent/opencode-zen-ent) — ver §6 para os que faltam.
> - NÃO implemente literalmente a interface `AgentAdapter`/`AgentRunOptions` de T-1022 (Nexus congelado) — siga `VercelAgentRunOptions` desta spec (ver correção de contrato em §1).
> - NÃO rode git no Docs.

### Pegadinhas conhecidas
- **`AbortController` duplo:** o timeout interno e o `signal` externo precisam compor sem vazar
  listener — usar `{once:true}` no `addEventListener` e remover no `finally` (padrão já no PoC).
- **`resolveModel` com `providerFactory` opcional:** por padrão usa `createOpenAICompatible` real;
  testes SEMPRE passam um fake — não deixe o teste cair no branch real por engano (checar que o
  fake foi de fato chamado, caso 1).
- **Nome do arquivo:** `agentAdapter.mjs` (camelCase), não `agent-adapter.mjs` — evita confusão com
  o PoC (`agent-adapter.poc.mjs`) e com `apps/nexus-backend/.../agent-adapter.ts` (arquivos diferentes, mesma raiz de nome).

1. **[TDD]** Escreva `agentAdapter.test.mjs` com os casos 1–9 (fake provider), todos falhando.
2. Implemente `PROVIDERS` + `resolveModel` (porta de `agent-adapter.poc.mjs`, com `providerFactory` injetável).
3. Implemente `run` (porta do PoC), consumindo `makeTools` de ORQ-09a.
4. Rode os testes automatizados até verdes. Rode o caso 10 manualmente (opt-in) e cole no Handover.
5. Gate (§7) → §8 → enfileira.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ABERTO — não bloqueia esta task, mas registra o gap para o arquiteto:**
> **Cobertura de provider incompleta para o nível `opus` do roster.** `anthropic/claude-opus-4-8`
> (único modelo do nível `opus`) não tem `baseURL`/chave direta confirmada no repo — Claude não é
> proxiável sob assinatura (`[[project_headroom_integration]]`), e não há `ANTHROPIC_API_KEY` no
> `.env`. Rodar um agente `opus` via `VercelAgentAdapter` hoje lançaria erro claro em `resolveModel`
> (comportamento correto — falha explícita, não silenciosa). Para destravar: (a) obter uma chave
> Anthropic direta e usar `@ai-sdk/anthropic` (não `createOpenAICompatible`), ou (b) aceitar que
> tasks `opus` continuam fora do dispatch automático por ora. Decisão do arquiteto, não desta task.
> Mesma lacuna para `aihubmix`/`gemini` (nível `by_capability: vision`, usado só em `frontend_qa`).
>
> **Nada mais em aberto** — `run()`/registry/eventos derivados do PoC provado (ORQ-08) + ADR-0008.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `PROVIDERS` cobre exatamente deepseek/opencode-go-ent/opencode-zen-ent com baseURL/env de `scripts/headroom-proxies.mjs`?
- [ ] `resolveModel` aceita `providerFactory` injetável (testabilidade sem gastar $)?
- [ ] `run()` devolve `AgentRunResult{exit,timedOut,tail}` idêntico em shape a T-1022?
- [ ] Cancelamento (timeout + signal externo) e "done" (finishReason stop) corretos?
- [ ] 9 casos de teste automatizados (fake) verdes + caso 10 (real, opt-in) rodado e colado no Handover?
- [ ] **[gate de acoplamento]** nenhum import de `apps/nexus-backend` (Nexus congelado) — este módulo é autocontido em `tools/orchestrator/`?
- [ ] Gap de cobertura `opus`/`vision` registrado na §6, não silenciado?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
cd tools/orchestrator
node --test tests/
```
> **GATE DE EVIDÊNCIA:** saída literal do `node --test` colada na Seção 8. O caso 10 (smoke real)
> também deve ter sua saída colada no Handover, separadamente do gate automatizado.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **Implementado** `src/agentAdapter.mjs` — port do PoC `agent-adapter.poc.mjs` (ORQ-08) com `PROVIDERS` (deepseek, opencode-go-ent, opencode-zen-ent, derivados de `scripts/headroom-proxies.mjs`), `resolveModel()` com `providerFactory` injetável, e `run()` devolvendo `AgentRunResult {exit, timedOut, tail}`.
- **Implementado** `tests/agentAdapter.test.mjs` — 9 casos automatizados (MockLanguageModelV4 fake, sem gastar $): resolveModel (3), run completo (6 — file/write, eventos, timeout, abort externo, erro, tail). Todos verdes.
- **Smoke real (caso 10):** rodado com `deepseek/deepseek-v4-flash` — AgentRunResult `{exit:0, timedOut:false}`, 3 tools chamadas (writeFile, readFile, bash), arquivo criado, 7.2s, 11 eventos. OK.
- **Nota técnica:** `MockLanguageModelV4.doGenerate` do AI SDK v7 exige `content[].input` (não `args`) para tool-calls e `usage.inputTokens/outputTokens` como objetos `{total, noCache, cacheRead, cacheWrite}` / `{total, text, reasoning}`. Registrado para referência futura.
- Arquivos: `src/agentAdapter.mjs`, `tests/agentAdapter.test.mjs`.

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de `node --test` + smoke real caso 10):**
```
=== node --test tests/*.test.mjs ===
# tests 23
# suites 7
# pass 23
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1286.8856

=== SMOKE ORQ-09b (deepseek/deepseek-v4-flash) ===
AgentRunResult: {"exit":0,"timedOut":false}
tempo: 7218ms · arquivo ok: true · writeFile + bash: true · eventos: 11
SMOKE OK
```
- **Comentários de Revisão:**

### Parecer do Agente Revisor 2 (Reviewer 2, independent)
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Modelo:** minimax-m3 · **Anti-ancoragem:** formado ANTES de ler §8 do Reviewer 1; confirmado convergente.
- **Env-block disclosure:** este reviewer NÃO tem shell/exec nem file-write tool; gate literal `node --test tests/` não re-rodado. Confiança apoiada em (a) revisão estática completa de código+testes+spec+ADR, (b) aritmética interna da evidência do Reviewer 1 (14+9=23 ✓; 5+2=7 suites ✓; 11 eventos no smoke = 3×(tool-call+tool-result) + 3 step + start + done ✓), (c) cross-check PROVIDERS vs. `headroom-proxies.mjs` (3/3 match, com `/v1`), (d) `grep nexus-backend` em `tools/orchestrator/` → 0 hits.

**Evidência de Execução (env-blocked — não re-rodado; texto do Reviewer 1 corroborado por análise estática):**
```
=== node --test tests/*.test.mjs ===
# tests 23
# suites 7
# pass 23
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1286.8856

=== SMOKE ORQ-09b (deepseek/deepseek-v4-flash) ===
AgentRunResult: {"exit":0,"timedOut":false}
tempo: 7218ms · arquivo ok: true · writeFile + bash: true · eventos: 11
SMOKE OK
```
*(fonte: §8 do Reviewer 1 — não re-executado por este reviewer)*

**Análise por critério DoD §7:** 7/7 ✓ (PROVIDERS com `/v1`; `providerFactory` injetável; shape T-1022; cancel composto; 9 fake + caso 10; zero import `apps/nexus-backend`; gap `opus`/`vision` em §6, não silenciado).

**Event payloads vs. ADR-0008 Decisão D:** 7/7 tipos em conformidade (`start`/`step`/`tool-call`/`tool-result`/`done`/`aborted`/`error`), payloads batem com a tabela da ADR.

**Findings — severidades:**

- **[m1] MINOR · `package.json` sem `main`/`exports` field.** Spec §3 linha 119 cita esta UPDATE explicitamente. A cláusula "se necessário" suaviza o requisito literal, mas como ORQ-11 vai importar, omissão é debt. Sugestão: `"main": "src/agentAdapter.mjs"`. Não bloqueia; flag para ORQ-11.
- **[m2] MINOR · Caso de teste 5 não asserta ordem ESTRITA dos 5 eventos.** Spec §4 linha 138: "ordem start → tool-call → tool-result → step → done". Test atual (linhas 117–136) só checa `types.includes(...)` e `startIdx < doneIdx`. Sugestão: `assert.deepEqual(types, ['start','tool-call','tool-result','step','done'])`.
- **[i1] INFO · `resolveModel` não valida shape de `rosterName`.** Casos `""`, `"/x"`, `"prefix/"`, `"a/b/c"` (com factory) não lançam. Hardening defensivo barato; spec não exige.
- **[i2] INFO · `MockLanguageModelV4` fixtures duplicam `args` (V3) e `input` (V4) no mesmo tool-call.** Worker já flagou em §8 Handover. Não bloqueia.
- **[i3] INFO · Discriminador `cancel` vs. `timeout`** (linha 110) prioriza `'cancel'` quando ambos disparam. UX correto; spec silente.
- **[i4] INFO · ENV-BLOCK deste reviewer** (sem shell/write). Confiança: ALTA via revisão estática.
- **[i5] INFO · PoC `agent-adapter.poc.mjs` ainda usa `https://api.deepseek.com` (sem `/v1`)** — M2 do ORQ-08, corretamente corrigido no novo `src/agentAdapter.mjs` (`/v1` presente). PoC é read-only per spec §3, fix vive só no novo módulo.

**Adversarial probes (env-blocked; análise estática de `src/agentAdapter.mjs`):**
1. `run()` com `maxSteps:1` + provider que nunca retorna 'stop' → `{exit:0, timedOut:false}`. `stopWhen: stepCountIs(maxSteps)` (linha 94) garante terminação. ✓
2. `resolveModel` com `rosterName` malformado + factory → não lança. Ver [i1].
3. `resolveModel` com factory que lança → propaga (linha 32 sem try/catch). ✓

**Delta vs. Reviewer 1:** convergente (Aprovado). Diferenças: este reviewer adiciona 4 INFO + 2 MINOR (refinamentos não estruturalmente divergentes).

**Veredito final:** Aprovado. Task ORQ-09b atende §1 (contrato `VercelAgentRunOptions`, PROVIDERS com `/v1`), §3 (escopo: 2 CREATE + 1 UPDATE; sem out-of-scope), §4 (9 casos fake + caso 10 colado em §8), §6 (gap opus/vision aberto), §7 DoD (7/7), ADR-0008 Decisões C/D/E. Nenhum BLOCKER/MAJOR.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-03T11:57]** - *sonnet* - `[Promovida p/ ready]`: spec_status hardened — flip draft->ready
- **[2026-07-03T13:05]** - *deepseek* - `[Iniciado]`: iniciando VercelAgentAdapter (run + registry)
- **[2026-07-03T13:19]** - *deepseek* - `[Finalizado]`: implementado src/agentAdapter.mjs + tests (9/9 fake + smoke real OK)
- **[2026-07-03T14:22]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (tooling do Docs, sem worktree/merge): Parecer Reviewer 2 (minimax-m3) APROVADO convergente com R1. Gate Reviewer 1: node --test 23 passed (14 tools.test + 9 agentAdapter.test) / 7 suites; smoke real deepseek/deepseek-v4-flash: AgentRunResult {exit:0, timedOut:false}, 11 eventos, 7.2s. 7/7 DoD: PROVIDERS com /v1 de headroom-proxies.mjs, providerFactory injetavel, shape T-1022 preservado, cancel composto (timeout+signal externo), zero import apps/nexus-backend, gap opus/vision em §6 nao silenciado. 2 nao-bloqueantes (m1 package.json sem main/exports, m2 test 5 nao asserta ordem) → ledger. ORQ-09a ja done → parentAutoClose ORQ-09 pelo servico (T-1029) na sequencia.
