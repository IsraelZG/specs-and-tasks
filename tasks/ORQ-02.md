---
id: ORQ-02
title: "orquestrar.mjs --dry-run + orquestrador.config.json — núcleo de decisão (sem spawn)"
status: done
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-01"] # consome ledger.mjs --json
blocks: ["ORQ-04"] # o spawn real reusa as funções de decisão daqui
spec_status: hardened
capacity_target: sonnet
hardened_at: "2026-06-30"
hardened_by: claude-opus
---

# ORQ-02 · orquestrar.mjs --dry-run + config — núcleo de decisão

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. Sem dependências externas.
- **Tarefa de TOOLING do CONTROLE (Docs).** Implemente direto no Docs. Persista via
  `node tools/scripts/fila.mjs add ORQ-02 "<msg>" tools/scripts/orquestrar.mjs tasks/orquestrador.config.json`.
  Identidade = modelo real.
- **Gate adaptado:** evidência = saída literal dos comandos da §7. **Esta task NÃO spawna nada** (só
  `--dry-run`); o spawn real é ORQ-04.

## 1. Objetivo
Criar o **núcleo de decisão determinístico** do orquestrador: dado o estado (via `ledger.mjs --json`)
e a policy (`orquestrador.config.json`), computar **qual task despachar, com qual papel e qual modelo**,
respeitando o teto de concorrência — e **imprimir o plano** (`--dry-run`), sem efeito colateral. As
funções de decisão ficam **exportadas** para a ORQ-04 reusar no spawn real.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] [ORQ-01](./ORQ-01.md) — `node tools/scripts/ledger.mjs --json --idle` é a entrada (array de tasks
      com `next_action`, `capacity_target`, `ui`, `worker_model`, `deps_ok`, `busy`).
- [ ] `crush models` — universo de modelos `provider/model`; o roster da config aponta para subconjuntos.
- [ ] [ORQ-03](./ORQ-03.md) — `saldo.mjs --json` (opcional): se presente, provedores abaixo do limite
      saem do pool. Se o saldo não rodar, trate como "todos disponíveis" (não bloqueie).
- [ ] CLAUDE.md §"Dimensionamento" e §"Identidade do agente" — `capacity_target` ∈ {haiku,sonnet,opus-spike};
      reviewer deve ser de **modelo diferente** do worker (anti-correlação).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `tasks/orquestrador.config.json` — policy versionada (shape na §5).
- **[CREATE]** `tools/scripts/orquestrar.mjs` com:
  - `loadConfig()` — lê e valida `tasks/orquestrador.config.json` (erra claro se faltar campo).
  - `fetchLedger(filters)` — `execFileSync('node',['tools/scripts/ledger.mjs','--json','--idle'])` →
    `JSON.parse`. (Reusa ORQ-01; NÃO reimplementa o parse.)
  - `fetchBalances()` — tenta `saldo.mjs --json`; em erro retorna `[]` (degradação).
  - `selectModel(task, config, brokeProviders)` — ver algoritmo §5. Retorna `{model, reason}` ou
    `{model:null, reason}` (skip).
  - `planDispatch(ledger, config, balances)` — ordena por prioridade, respeita `max_concurrent` menos
    `runningCount` (em ORQ-02, `runningCount = ledger.filter(t=>t.busy).length`), retorna lista de
    `{id, action, role, model, cwd, reason}` (+ os pulados com motivo).
  - `main`: flag `--dry-run` → imprime o plano (tabela) e sai. `--once`/`--on-finish` → **stub** que
    imprime "não implementado (ORQ-04)" e sai 0 (placeholders para a ORQ-04 preencher).
  - **Exporte** `selectModel`, `planDispatch`, `loadConfig`, `fetchLedger` (named exports) p/ ORQ-04.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Self-check por CLI** (§7) + um **fixture** de ledger injetável: aceite
  `--ledger-file <path>` (lê um JSON de teste em vez de chamar o ledger real) para tornar a decisão
  testável sem depender do estado vivo. (a) review escolhe modelo ≠ worker_model; (b) respeita
  `max_concurrent`; (c) `ui:true`/`frontend_qa` exige pool de `vision`, pula se interseção vazia;
  (d) provedor "quebrado" sai do pool; (e) ordem de prioridade review>rework>work>harden>promote.
- [x] **Fora de escopo:** spawn, registry, lock, prompt assembly (tudo ORQ-04).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - NÃO spawne `crush` aqui (só `--dry-run`). NÃO reimplemente o parse do ledger (chame ORQ-01).
> - NÃO falhe se `saldo.mjs` não existir/erro — degrade para "todos disponíveis".
> - NÃO rode git no Docs — enfileire.

**`tasks/orquestrador.config.json` (shape):**
```jsonc
{
  "max_concurrent": 5,
  "roster": {
    "by_level": {
      "haiku":  ["deepinfra/deepseek-v4-flash", "minimax/minimax-m2.5"],
      "sonnet": ["aihubmix/deepseek-v4-pro", "minimax/minimax-m3"],
      "opus":   ["anthropic/claude-opus-4-8"]
    },
    "by_capability": { "vision": ["aihubmix/qwen-vl-max", "gemini/gemini-3-pro"] }
  },
  "routing": { "frontend_qa": { "requires": ["vision"], "min_level": "sonnet" } },
  "action_skill": {                         // action (do ledger) → skill a montar (ORQ-04 usa)
    "work": "executar-task", "rework": "rework-task", "review": "qa-review",
    "harden": "endurecer-task", "promote": "arquiteto-promover"
  },
  "priority": ["review","rework","work","harden","promote"],
  "circuit_breaker": { "max_review_cycles": 3 },
  "provider_accounts": { "deepinfra":"deepseek", "aihubmix":"deepseek", "openrouter":"openrouter" },
  "providers_balance": { "skip_below_usd": 0.50 }
}
```

**`selectModel(task, config, brokeProviders)`** (determinístico):
1. `level = task.capacity_target || 'sonnet'`. `pool = roster.by_level[level]` (se vazio → skip "sem nível").
2. Se a task casa uma regra de `routing` (ex.: `task.ui===true` → `frontend_qa`): para cada cap em
   `requires`, `pool = pool ∩ roster.by_capability[cap]`. Vazio → skip "sem modelo p/ capacidade <cap>".
3. Se `action==='review'`: remova do pool o `task.worker_model` (compara pelo nome após `/`, e via
   `displayActor`). Pool vazio → **não pule**: registre warning e use o pool original (melhor revisar
   com mesmo modelo do que não revisar).
4. Remova modelos cujo provedor (parte antes de `/`, mapeada por `provider_accounts`) esteja em
   `brokeProviders`. Pool vazio → skip "todos provedores sem saldo".
5. Retorne o **1º** do pool resultante + `reason`.

**`planDispatch`:** `slots = max_concurrent - runningCount`; ordene candidatos idle por `priority`;
para os `slots` primeiros com `selectModel.model != null`, monte `{id,action,role,model,cwd,reason}`.
`cwd`: `work`/`rework` → `C:\Dev2026\superapp`; demais → repo Docs (`.`). `role` = a action.
Circuit breaker: se `task.rework_count >= circuit_breaker.max_review_cycles` e action∈{review,rework},
**pule** com motivo "circuit breaker (N ciclos)".

## 6. Feedback de Especificação (Spec Feedback Loop)
Sem decisões em aberto. Algoritmo de seleção, shape da config e degradação (saldo ausente) fixados.
Valores concretos do roster são **placeholders plausíveis** — o humano ajusta a config depois (é dado,
não código); valide só que os modelos existem em `crush models` antes de usar de verdade.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `--dry-run` imprime um plano coerente; reviewer recebe modelo ≠ worker; teto respeitado.
- [ ] Funções de decisão exportadas (importáveis pela ORQ-04).
- [ ] Degrada sem `saldo.mjs`.

### Verificação automática *(colar saída na §8 — use um fixture de ledger)*
```bash
# fixture mínimo: 1 review (worker=deepseek) + 2 ready
cat > /tmp/led.json <<'EOF'
[{"id":"T-A","status":"review","next_action":"review","capacity_target":"sonnet","ui":false,"worker_model":"deepseek-v4-pro","reviewer_models":[],"rework_count":0,"deps_ok":true,"busy":false},
 {"id":"T-B","status":"ready","next_action":"work","capacity_target":"haiku","ui":false,"worker_model":null,"deps_ok":true,"busy":false},
 {"id":"T-C","status":"ready","next_action":"work","capacity_target":"sonnet","ui":true,"worker_model":null,"deps_ok":true,"busy":false}]
EOF
node tools/scripts/orquestrar.mjs --dry-run --ledger-file /tmp/led.json
# Esperado: T-A→review com modelo do pool sonnet ≠ deepseek-v4-pro; T-C→work exige pool vision;
#           total despachado ≤ max_concurrent.
```
> **GATE:** sem a saída literal do `--dry-run` colada na §8, `finish` não vale.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- `tools/scripts/orquestrar.mjs` criado com todas as funções exportadas: `loadConfig`, `fetchLedger`, `fetchBalances`, `selectModel`, `planDispatch`.
- `tasks/orquestrador.config.json` já existia (criado por deepseek na sessão anterior). Config validada no `loadConfig()`.
- `--dry-run` funcional com fixture e ledger real.
- `--once`/`--on-finish` são stubs (ORQ-04).
- Degradação de `saldo.mjs` testada: fetchBalances retorna `[]` em erro.

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência:**
```
Slots disponíveis: 5 (max_concurrent - 0 em execução)

Plano de despacho:
  ID   Ação    Modelo                       Motivo
  ---  ------  ---------------------------  -----------------
  T-A  review  minimax/minimax-m3           sonnet / minimax
  T-B  work    deepinfra/deepseek-v4-flash  haiku / deepinfra

Pulados:
  T-C: sem modelo p/ capacidade vision
```
- [ ] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência:**
```
(cole aqui)
```

### Parecer do Agente Revisor (Reviewer 1 — minimax-m3, independente):
- [x] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**

```
$ node tools/scripts/orquestrar.mjs --dry-run --ledger-file tools/scripts/__probe_led.json
Slots disponíveis: 5 (max_concurrent - 0 em execução)

Plano de despacho:
  ID   Ação    Modelo                       Motivo
  ---  ------  ---------------------------  -----------------
  T-A  review  minimax/minimax-m3           sonnet / minimax
  T-B  work    deepinfra/deepseek-v4-flash  haiku / deepinfra

Pulados:
  T-C: sem modelo p/ capacidade vision
```

Sondas adicionais:
```
$ node tools/scripts/orquestrar.mjs --once        → "não implementado (ORQ-04)"  (exit 0)
$ node tools/scripts/orquestrar.mjs --on-finish   → "não implementado (ORQ-04)"  (exit 0)
$ node tools/scripts/orquestrar.mjs               → usage multi-linha            (exit 0)
$ # fixture com rework_count=3 e next_action=review:
  Pulados: T-A: circuit breaker (3 ciclos)        # circuit breaker ok
$ # saldo.mjs inexistente → fetchBalances retorna [] sem throw
```

- **Comentários de Revisão:**
  - DoD §7.1 (`--dry-run` plano coerente; reviewer ≠ worker; teto respeitado): **OK** — T-A
    recebe `minimax/minimax-m3` (≠ `deepseek-v4-pro`); T-B vai para haiku; T-C (ui=true)
    corretamente pulado por interseção vazia com vision; plano = 2 ≤ max_concurrent=5.
  - DoD §7.2 (funções de decisão exportadas): **OK** — `loadConfig`, `fetchLedger`,
    `fetchBalances`, `selectModel`, `planDispatch` são named exports (verificável por
    `node --check` + parse do módulo).
  - DoD §7.3 (degrada sem `saldo.mjs`): **OK** — `fetchBalances` envolve `execFileSync`
    em try/catch retornando `[]`; o orquestrador continua sem erro.
  - Algoritmo `selectModel` (§5): **OK** — nível → pool; routing `ui:true` → interseção
    com `by_capability`; review anti-correlação via `modelName` + `displayActor`; filtro
    de provedores quebrados via `provider_accounts`; retorna 1º do pool.
  - Algoritmo `planDispatch` (§5): **OK** — `slots = max - running`; sort por `priority`
    (review>rework>work>harden>promote); circuit breaker com `max_review_cycles=3`;
    `cwd` correto (work/rework → `C:\Dev2026\superapp`; demais → `root`).
  - `loadConfig` valida `max_concurrent`, `roster`, `priority`, `roster.by_level` —
    falha clara em campo ausente.
  - [INFO] `loadConfig` aceita JSONC (strip de `//` e `/* */`) — extensão útil, não
    contradiz a spec.
  - [INFO] `cwd` para non-work/rework é o path absoluto `root` (`C:\Dev2026\Docs`),
    spec diz "."; equivalente em runtime.

- **Veredito:** APROVADO
  Implementação atende integralmente à spec e ao DoD; output literal do `--dry-run`
  bate com o exemplo da §7; funções exportadas e degradação verificadas. Nenhum
  BLOCKER ou MAJOR.

## 9. Log de Execução (Agent Execution Log)
> Registrem via `manage-task.mjs`. Identidade = modelo real.
- **[2026-06-30T18:35]** - *claude-sonnet* - `[Promovida p/ ready]`: ORQ-01 done — JSON shape confirmado, deps_ok true — flip draft→ready
- **[2026-06-30T18:45]** - *deepseek* - `[Iniciado]`: iniciando implementação do orquestrar.mjs + config
- **[2026-07-01T10:07]** - *deepseek* - `[Finalizado]`: orquestrar.mjs implementado: loadConfig, fetchLedger, fetchBalances, selectModel, planDispatch exportados. --dry-run funcional c/ fixture. --once/--on-finish stubs. Degradação saldo.mjs ok. Testes: T-A→review modelo≠worker; T-B→haiku; T-C→skip vision; teto concorrência ok.
- **[2026-07-01T10:16]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (A-tooling): Gate verde — --dry-run com fixture (T-A→review/minimax-m3, T-B→work/haiku, T-C skip vision; plano=2 ≤ max_concurrent=5); --once/--on-finish stubs; circuit breaker (rework_count=3 → skip 'circuit breaker (3 ciclos)'); fetchBalances degrada sem saldo.mjs; 5 funções exportadas (loadConfig/fetchLedger/fetchBalances/selectModel/planDispatch). 2 INFOs não-bloqueantes → ledger de pendências.
