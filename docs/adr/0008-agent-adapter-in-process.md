# ADR-0008 — AgentAdapter in-process (Vercel AI SDK): substituindo o spawn de Crush

- **Data:** 2026-07-03
- **Status:** Accepted
- **Autor:** claude-opus (spike ORQ-08)
- **Decisores:** arquiteto da plataforma (Israel) — engine (Vercel AI SDK) decidida em 2026-07-02
- **Versões fixadas (verificadas no smoke/PoC):** `ai@7.0.14` · `@ai-sdk/openai-compatible@3.0.5` · `zod@4.4.3` · Node ≥22 (testado 22.20.0)

---

## Contexto

O orquestrador vivo é [`tools/scripts/orquestrar.mjs`](../../tools/scripts/orquestrar.mjs). Seu núcleo de decisão (`planDispatch`/`selectModel`/registry/lock/`--on-finish`) funciona. O problema está **só** em `spawnAgent` (linhas ~281–316): ele faz `spawn('crush', …)` detached de um agente headless. Consequências que pararam o uso (kill-switch `EMERGENCY_DISABLE_SPAWN=true`):

1. Cada tool-use do Crush abre uma **janela de terminal** no Windows → rouba foco → trava a máquina.
2. A interface só devolve no fim (`{exit,timedOut,tail}` post-mortem) → instâncias travam em silêncio, sem observabilidade (1 task em 2h sem ninguém ver).

**Decisão de engine (2026-07-02):** substituir o spawn por um **loop de agente in-process** com **Vercel AI SDK** — as tool calls do LLM rodam como funções JS neste processo Node. Ver `[[project_orchestration_vercel_adapter]]`. Este ADR fecha o **como** (5 decisões), validado por um PoC executável.

### Premissa provada (smoke)
`tools/orchestrator/smoke.mjs` — `generateText` com 1 tool JS trivial, provider DeepSeek **direto** (sem Headroom): o modelo chamou a tool, a função rodou **in-process** (`[tool soma] executando IN-PROCESS`), e respondeu `42` em 2.5s. O loop in-process + tool JS + provider direto **funcionam**.

---

## Decisão

Adota-se um `AgentAdapter` in-process. O contrato público de T-1022 (`run(opts): Promise<AgentRunResult>` com `AgentRunResult = {exit, timedOut, tail}`) **não muda** — só o mecanismo interno (loop AI SDK no lugar de `spawn`). PoC de referência: `tools/orchestrator/agent-adapter.poc.mjs` (`run()` + `resolveModel()`), tools em `tools.poc.mjs`.

### Decisão A — Tool harness
Tools são funções JS tipadas por Zod (`tool({ description, inputSchema, execute })` do `ai@7`). Conjunto mínimo do agente de código:

| Tool | inputSchema | Escopo |
|---|---|---|
| `readFile` | `{ path: string }` | provado no PoC |
| `writeFile` | `{ path: string, content: string }` | provado no PoC |
| `bash` | `{ command: string }` | provado no PoC (gated — Decisão B) |
| `editFile`, `glob`, `grep` | — | **ORQ-09** (não no spike) |

Caminhos relativos ao `cwd` do run. `execute` emite eventos (Decisão D) e checa o `AbortSignal` (Decisão E).

### Decisão B — Sandbox/gating do bash
`bash` roda via `spawnSync(command, { cwd, shell:true, timeout, windowsHide:true })`. **`windowsHide:true` é o que mata a janela** — o comando roda sem console visível (o oposto do Crush). Gates:
1. **Allowlist** do primeiro token: `pnpm npm node git ls cat echo type dir mkdir rm bash sh` (config confiável, não input do usuário).
2. **Timeout** por comando (120s no PoC; configurável).
3. **cwd travado** no worktree passado ao run.
4. **Guarda anti-git-no-Docs (regra inviolável):** se o `cwd` está sob o repo de controle (Docs) e o comando é `git commit|push|add`, é **negado** com instrução de enfileirar via `fila.mjs`. No superapp, git é liberado normalmente.

### Decisão C — Registry de provider (multi-modelo direto)
Nome do roster = `"prefixo/modelo"`. `resolveModel()` mapeia o prefixo → `{ baseURL, apiKeyEnv }` e monta `createOpenAICompatible({ name, baseURL, apiKey })`, retornando `provider(modelId)`. **Direto, sem Headroom** — elimina a instância-Headroom-por-provedor (`[[project_headroom_integration]]`). Registry do PoC:

```js
const PROVIDERS = {
  deepseek:   { baseURL: 'https://api.deepseek.com/v1',     apiKeyEnv: 'DEEPSEEK_API_KEY' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', apiKeyEnv: 'OPENROUTER_API_KEY' },
};
```
Chaves vêm do `.env` do Docs (`--env-file`). **Mapeamento completo** (deepinfra, opencode-ent, aihubmix, anthropic via `@ai-sdk/anthropic`) e o casamento com `orquestrador.config.json` (`roster.by_level`, `provider_accounts`) são **ORQ-09**. Anthropic direto exige key própria (não há `ANTHROPIC_API_KEY` no `.env` — Claude não é proxiável sob assinatura; se entrar no roster, precisa de key dedicada).

### Decisão D — Protocolo de evento (stream)
`run()` aceita `onEvent(evt)` além de devolver o `AgentRunResult` final. Evento: `{ taskId, type, ts, ...payload }`. Tipos emitidos pelo PoC:

| type | payload | quando |
|---|---|---|
| `start` | `model, cwd` | início do run |
| `step` | `tools, finishReason` | fim de cada passo do loop (`onStepFinish`) |
| `tool-call` | `tool, args` | antes de executar uma tool |
| `tool-result` | `tool, ok, exit?, denied?` | depois de executar |
| `done` | `text, steps` | loop concluiu (modelo parou de chamar tools) |
| `aborted` | `reason: 'cancel'\|'timeout'` | cancelado/timeout |
| `error` | `message` | erro no loop |

É o stream que **ORQ-10** consome pro painel :8780 e pra **detecção de travada** (sem evento há N s → suspeita). Substitui o `tail` post-mortem de T-1022 (que permanece como resultado final, não como observabilidade).

### Decisão E — Cancelamento e "done"
- **Cancelamento/timeout:** um `AbortController` interno combina o `timeoutMs` (setTimeout → abort) com um `AbortSignal` externo opcional. `generateText({ abortSignal })` e cada tool checam. Abort → `{ exit:null, timedOut:true, tail }` (não lança). É a base do "matar instância" do ORQ-10.
- **"Done":** o loop encerra quando o modelo **para de chamar tools** (`finishReason:'stop'`), limitado por `stopWhen: stepCountIs(maxSteps)`. Igual ao Crush encerrando quando o agente conclui. No fluxo MGTIA real, o agente chama `finish` via a tool `bash` (`manage-task.mjs finish …`) antes de parar — o loop então termina naturalmente.

---

## Consequências

### Positivas
- **Sem janela** (por construção: loop in-process + `windowsHide`). Foco nunca é roubado.
- **Observável ao vivo** (stream por passo) → travadas detectáveis, instâncias inspecionáveis/canceláveis (ORQ-10).
- **Multi-provider direto** → morre a instância-Headroom-por-provedor.
- **Contrato T-1022 preservado** → `orquestrar.mjs` troca só o `spawnAgent` (ORQ-11), o scheduler não muda.

### Negativas / Trade-offs
- **Passamos a ser donos do harness de tools** (~10 funções). Custo real, mas é o "controle total" pedido (gate de bash, sandbox, log de cada chamada).
- **Deps npm** (`ai`, `@ai-sdk/*`, `zod`) num pacote isolado `tools/orchestrator/` — o `orquestrar.mjs` era dep-free; o `node_modules` fica confinado ali (gitignored), não vaza pro Docs.
- **Provider registry completo ainda por fazer** (só deepseek/openrouter provados) — ORQ-09.
- O agente roda com privilégio (bash) — o gating (Decisão B) mitiga, mas containerização por instância (à la Pi) fica como evolução possível, fora deste escopo.

### Épico de implementação derivado (não faz parte deste ADR)
- **ORQ-09** — `VercelAgentAdapter implements AgentAdapter` + harness completo de tools (editFile/glob/grep) + registry de provider completo. Assinaturas deste ADR = fonte canônica.
- **ORQ-10** — observabilidade + controle: stream (Decisão D) no painel :8780 + cancelar/matar (Decisão E) + detecção de travada.
- **ORQ-11** — religar `orquestrar.mjs`: remover `EMERGENCY_DISABLE_SPAWN` + `spawn('crush')`, `spawnAgent` chama `VercelAgentAdapter.run`, ajustar `pruneRegistry` (instância in-process, não pid de SO).

---

## Gate (evidência empírica)

**Smoke** (`node --env-file=../../.env smoke.mjs`):
```
[tool soma] executando IN-PROCESS: 21 + 21
[step] tool_calls=soma  finish=tool-calls
[step] tool_calls=—     finish=stop
texto final : "21 + 21 = **42**."  ·  ✅ SMOKE OK
```

**Selftest end-to-end** (`node --env-file=../../.env agent-adapter.poc.mjs --selftest`):
```
→ [start] → [tool-call writeFile] → [tool-result] → [step]
→ [tool-call readFile] → [tool-result] → [step]
→ [tool-call bash] → [tool-result] → [step] → [step] → [done "concluído."]
AgentRunResult: {"exit":0,"timedOut":false,"tail":"…"}
arquivo criado in-process : true   ·   usou writeFile + bash : true   ·   eventos: 12
✅ SELFTEST OK — 1 task real rodou end-to-end in-process, sem janela, com stream.
```

## Referências
- `tools/orchestrator/{smoke.mjs, tools.poc.mjs, agent-adapter.poc.mjs}` — PoC deste ADR
- `tasks/ORQ-08.md` (spike) · `tasks/ORQ-09/10/11.md` (épico derivado)
- `apps/nexus-backend/src/runner/agent-adapter.ts` (T-1022 — interface `AgentAdapter`/`AgentRunResult`)
- `tools/scripts/orquestrar.mjs` — `spawnAgent`/`EMERGENCY_DISABLE_SPAWN` a substituir (ORQ-11)
- `docs/adr/0007-painel-remoto-modelo-b.md` — ADR do painel remoto (formato)
