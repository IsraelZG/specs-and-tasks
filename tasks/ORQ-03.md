---
id: ORQ-03
title: "saldo.mjs — saldo dos provedores (DeepSeek, OpenRouter) p/ alimentar o dispatcher"
status: ready
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [] # independente — pode rodar em paralelo com ORQ-01
blocks: ["ORQ-06"] # dashboard exibe saldos; ORQ-02 consome se presente (opcional)
spec_status: hardened
capacity_target: sonnet
hardened_at: "2026-06-30"
hardened_by: claude-opus
---

# ORQ-03 · saldo.mjs — saldo dos provedores

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+ (`fetch` global nativo). Sem dependências externas.
- **Tarefa de TOOLING do CONTROLE (Docs).** Implemente direto no Docs. Persista via
  `node tools/scripts/fila.mjs add ORQ-03 "<msg>" tools/scripts/saldo.mjs`. Identidade = modelo real.
- **Gate adaptado:** evidência = saída literal dos comandos da §7.

## 1. Objetivo
Criar `tools/scripts/saldo.mjs`: consulta o **saldo disponível** das contas-upstream que têm endpoint
público, lendo as chaves do `.env` (mesma fonte que o `headroom-proxies.mjs` usa). Emite `--json` que
o dispatcher (ORQ-02) consome para **pular provedores zerados** e o dashboard (ORQ-06) exibe. Cobertura
é por **adaptador**: DeepSeek e OpenRouter têm endpoint; os demais retornam `available_usd: null` +
nota "sem endpoint" (best-effort, nunca lança).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `scripts/headroom-proxies.mjs` — **reuse o loader de `.env`** (lê `../.env` relativo ao script,
      regex `^([A-Z_]+)=(.*)$`, `process.env[k]=v`). Vars: `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`,
      `OPENCODE_API_KEY`, `OPENCODE_ENT_API_KEY`.
- [ ] DeepSeek API: `GET https://api.deepseek.com/user/balance`, header `Authorization: Bearer <key>` →
      `{ "is_available": true, "balance_infos": [ { "currency":"USD", "total_balance":"4.20" } ] }`.
- [ ] OpenRouter API: `GET https://openrouter.ai/api/v1/credits`, `Authorization: Bearer <key>` →
      `{ "data": { "total_credits": 10.0, "total_usage": 3.5 } }` → disponível = `total_credits - total_usage`.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `tools/scripts/saldo.mjs`:
  - `loadEnv()` (copiado/adaptado do headroom-proxies).
  - registry de adaptadores: `const ADAPTERS = { deepseek, openrouter, ... }` onde cada um é
    `async (key) => ({ available_usd, currency }) | throws`.
  - `async fetchBalance(name)` → `{ provider, key_env, available_usd, currency, ok, note }` — captura
    erro/timeout (`AbortSignal.timeout(5000)`) e devolve `ok:false`+`note` em vez de lançar.
  - `main`: `--json` → `process.stdout.write(JSON.stringify(await Promise.all(...)))`; default → tabela.
- **[READ]** `.env` (chaves) — não commite, não imprima a chave.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Self-check por CLI** (§7). (a) `--json` retorna array com entradas deepseek+openrouter;
  (b) chave ausente → `ok:false`+nota, **não** lança; (c) saída nunca contém a chave em texto.
- [x] **Fora de escopo:** adaptadores além de deepseek/openrouter (stubs `null`); a integração no
  dispatcher (é da ORQ-02, que lê este `--json`).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - NÃO imprima nem logue a API key. NÃO lance se um provedor falhar — degrade para `ok:false`.
> - NÃO adicione dependência (use `fetch` global do Node 22).
> - NÃO rode git no Docs — enfileire.

**Shape de cada entrada `--json`:**
```jsonc
{ "provider":"deepseek", "key_env":"DEEPSEEK_API_KEY", "available_usd": 4.2,
  "currency":"USD", "ok": true, "note": null }
```

1. `loadEnv()`. 2. Para cada adaptador, `fetchBalance` com timeout 5s, captura erro → `ok:false`.
3. `--json` emite o array; default imprime tabela `provider | saldo | ok`. 4. Gate (§7) → §8 → enfileira.

## 6. Feedback de Especificação (Spec Feedback Loop)
Sem decisões em aberto. Endpoints e shapes fixados na §2. Provedores sem endpoint público = stub `null`
(decisão registrada: best-effort, não bloqueia).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `--json` válido; deepseek+openrouter consultados; chave ausente não derruba.
- [ ] A chave nunca aparece no stdout/stderr.

### Verificação automática *(colar saída na §8)*
```bash
node tools/scripts/saldo.mjs --json | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('provedores:',a.map(x=>x.provider+':'+(x.ok?x.available_usd:'n/d')).join(' | '))"
node tools/scripts/saldo.mjs --json | grep -iE "sk-|bearer|[A-Za-z0-9]{32}" && echo "VAZOU CHAVE — FALHA" || echo "ok: sem chave no output"
DEEPSEEK_API_KEY= node tools/scripts/saldo.mjs --json | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('sem-chave-nao-lanca:', a.find(x=>x.provider==='deepseek').ok===false)"
```
> **GATE:** sem saída literal na §8, `finish` não vale.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência:**
```
(cole aqui)
```

## 9. Log de Execução (Agent Execution Log)
> Registrem via `manage-task.mjs`. Identidade = modelo real.
- **[2026-06-30T17:45]** - *claude-opus* - `[Promovida p/ ready]`: hardened, sem deps — independente
