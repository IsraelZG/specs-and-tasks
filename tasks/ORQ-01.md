---
id: ORQ-01
title: "ledger.mjs --json — API de leitura do estado (transitions.jsonl + frontmatter)"
status: done
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [] # fundação — sem deps
blocks: ["ORQ-02", "ORQ-06"] # dispatcher e dashboard consomem este JSON
spec_status: hardened
capacity_target: sonnet
hardened_at: "2026-06-30"
hardened_by: claude-opus
---

# ORQ-01 · ledger.mjs --json — API de leitura do estado

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Sem dependências externas** — só `node:fs`/`node:path` (stdlib).
- **Tarefa de TOOLING do CONTROLE (Docs).** NÃO há worktree do superapp. Implemente **direto no Docs**
  (edita `tools/scripts/ledger.mjs`). Persista via **`node tools/scripts/fila.mjs add ORQ-01 "<msg>"
  tools/scripts/ledger.mjs`** (a fila commita; você NÃO roda git no Docs). Identidade `<EU>` = seu
  **modelo real** (ver "Identidade do agente" no CLAUDE.md).
- **Gate adaptado:** não é pacote pnpm — a evidência é a **saída literal** dos comandos da §7.

## 1. Objetivo
Adicionar um modo **`--json`** ao `tools/scripts/ledger.mjs` existente (hoje só gera `LEDGER.md`
markdown). O `--json` é a **API única de leitura de estado** que o orquestrador (ORQ-02/04) e o
dashboard (ORQ-06) consomem — emite um **array JSON** no stdout, **um objeto por task**, juntando o
event-log estruturado `.nexus/transitions.jsonl` com o frontmatter de cada `tasks/*.md`. **Sem parsear
markdown** (o §9 markdown continua só para humano; aqui a fonte é o JSONL).

> **Por que `.nexus/transitions.jsonl` e não o §9:** o `TaskService` já grava cada transição como
> `{ts,id,from,to,action,agent}` (JSON nativo). É local/gitignored — perfeito, porque a ferramenta
> roda na máquina de despacho onde o arquivo está sempre fresco. Atribuição de papel fica trivial
> (tem `from`/`to`/`action` explícitos), sem o regex frágil do §9.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `tools/scripts/ledger.mjs` — script existente (gera `LEDGER.md`); você ADICIONA `--json` sem
      quebrar o modo markdown. Já tem `parseLog`, `displayActor`, parser de frontmatter `fm()`.
- [ ] `.nexus/transitions.jsonl` — fonte de eventos. Cada linha: `{"ts","id","from","to","action","agent"}`.
      `action` ∈ {seed,start,promote,pause,finish,approve,request_changes,block,unblock,reconcile}.
- [ ] `tools/scripts/hardening.mjs` — referência do parser de frontmatter flat (campos `status`,
      `spec_status`, `capacity_target`, `dependencies`, `hardened_by`, `ui`).
- [ ] CLAUDE.md §"Identidade do agente" — `agent` pode vir `papel:modelo` (ex.: `agile_reviewer:gemini`);
      use o `displayActor()` já existente para exibir só o modelo.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `tools/scripts/ledger.mjs` — adiciona:
  - parse de `.nexus/transitions.jsonl` (split por linha, `JSON.parse` por linha, ignora linha vazia).
  - função `rolesFromTransitions(events)` → `{ worker_model, reviewer_models[], rework_count, last_event }`
    a partir dos eventos do id (atribuição: `worker`=agent do 1º `start` com `from`∈{ready,draft};
    `reviewer_models`=agents de `approve`/`request_changes` (via `displayActor`, distintos);
    `rework_count`=nº de `start` com `from==rework`).
  - função `nextAction(task)` (máquina de estados, ver §5).
  - função `depsOk(task, allById)` → `true` se TODA dep tem `status==done`.
  - modo `--json`: monta o array e faz `process.stdout.write(JSON.stringify(arr))`.
  - filtros: `--status <s>`, `--action <a>`, `--id <T-XXX>`, `--capacity <c>`, `--idle`.
- **NÃO** altere o modo markdown (`LEDGER.md`) nem a assinatura sem-flag (default segue gerando o .md).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** sem framework — **self-check por CLI** (a §7). É script stdlib.
- [x] **Cobertura:** (a) `--json` produz JSON válido e parseável; (b) cada objeto tem TODOS os campos
  da §5; (c) `--status review` retorna só review; (d) `--idle` exclui `done`/`in_progress`;
  (e) `next_action` correto p/ ≥1 task de cada estado; (f) `deps_ok=false` quando uma dep não é `done`.
- [x] **Fora de escopo:** registry de instâncias (`busy` por instância viva é da ORQ-04 — aqui
  `busy = status==='in_progress'`); spawn; saldo.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - NÃO quebre o modo markdown existente (rodar sem flag deve seguir gerando `LEDGER.md`).
> - NÃO adicione dependência npm. NÃO parseie o §9 markdown para os dados de papel — use o JSONL.
> - NÃO rode git no Docs — enfileire.

**Shape de cada objeto do array `--json`:**
```jsonc
{
  "id": "T-304",
  "status": "ready",                 // frontmatter
  "spec_status": "hardened",         // frontmatter
  "capacity_target": "sonnet",       // frontmatter (null se ausente)
  "ui": false,                       // frontmatter ui:true → true
  "dependencies": ["T-302a","T-106"],
  "deps_ok": true,                   // todas as deps com status==done
  "worker_model": "deepseek",        // de transitions.jsonl (displayActor)
  "reviewer_models": ["gemini"],
  "rework_count": 0,
  "hardened_by": "claude-opus",      // frontmatter (null se ausente)
  "last_event": {"ts":"...","action":"promote","agent":"haiku"},
  "next_action": "work",             // ver máquina abaixo
  "busy": false                      // status==='in_progress'
}
```

**Máquina `nextAction(task)`** (primeira que casar):
1. `status==='in_progress'` → `"busy"`
2. `status==='review'` → `"review"`
3. `status==='rework'` → `"rework"`
4. `status==='ready'` → `"work"`
5. `status==='draft'` && `spec_status==='hardened'` → `"promote"`
6. `status==='draft'` && `spec_status∈{draft,triaged}` && `deps_ok` → `"harden"`
7. `spec_status==='blocked-decision'` → `"decide"`  (humano — não despachável)
8. senão (`done`/`blocked`/sem deps) → `null`

**`--idle`** = filtra `next_action ∈ {work, review, rework, harden, promote}` E `busy===false`.

1. Leia `.nexus/transitions.jsonl`; agrupe eventos por `id`.
2. Para cada `tasks/*.md` (pula `_*`, `INDEX.md`, `LEDGER.md`): parse frontmatter + `rolesFromTransitions`.
3. Compute `deps_ok`, `next_action`, `busy`. Aplique filtros de CLI. Emita `JSON.stringify(arr)`.
4. Rode o Gate (§7), cole a saída na §8, enfileire.

## 6. Feedback de Especificação (Spec Feedback Loop)
Sem decisões em aberto. Fonte (`transitions.jsonl`), shape e máquina de estados fixados acima.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `--json` emite JSON válido; modo markdown intacto (rodar sem flag ainda gera `LEDGER.md`).
- [ ] Todos os campos da §5 presentes; `next_action`/`deps_ok` corretos.
- [ ] Filtros funcionam e compõem.

### Verificação automática *(comandos exatos — colar saída na §8)*
```bash
node tools/scripts/ledger.mjs --json | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('itens:',a.length,'| chaves[0]:',Object.keys(a[0]).join(','))"
node tools/scripts/ledger.mjs --json --status review | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('review-only:',a.every(t=>t.status==='review'),a.length)"
node tools/scripts/ledger.mjs --json --idle | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('idle sem done/busy:',a.every(t=>t.next_action&&!t.busy))"
node tools/scripts/ledger.mjs            | head -3   # markdown ainda funciona
```
> **GATE:** sem a saída literal colada na §8, o `finish` não vale.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **[2026-06-30 rework deepseek]** — [M1] corrigido: `allById` construído ANTES dos filtros (array `all` completo), depois filtra `tasks`. Probes 1-4 agora retornam deps_ok correto (ORQ-02 deps_ok:false pq ORQ-01 está review, não por ausência no Map). [m1] mantido (housekeeping — assinatura divergente inofensiva).
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência (colar saída dos 4 comandos da §7):**
```
=== GATE 1 ===
itens: 297 | chaves[0]: id,status,spec_status,capacity_target,ui,dependencies,deps_ok,worker_model,reviewer_models,rework_count,hardened_by,last_event,next_action,busy
=== GATE 2 ===
review-only: true 4
=== GATE 3 ===
idle sem done/busy: true
=== GATE 4 ===
✅ tasks/LEDGER.md regenerado — 297 tasks
   in_progress: 1 · review: 4 · rework: 1 · ready: 13 · draft: 180 · done: 98
```

### Parecer do Reviewer 1 (Crush, independente):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Data:** 2026-06-30  ·  **Spec consultada:** §1–7  ·  **Arquivos auditados:** `tools/scripts/ledger.mjs` (UPDATE)
- **Evidência de Execução (re-rodada nesta review):**
```
$ node tools/scripts/ledger.mjs --json | node -e "<parse>"
itens: 297 | chaves[0]: id,status,spec_status,capacity_target,ui,dependencies,deps_ok,worker_model,reviewer_models,rework_count,hardened_by,last_event,next_action,busy   ✅
$ node tools/scripts/ledger.mjs --json --status review | node -e "<parse>"
review-only: true 6   ✅   (worker viu 4; diferença é drift natural entre transições concorrentes)
$ node tools/scripts/ledger.mjs --json --idle | node -e "<parse>"
idle sem done/busy: true   ✅
$ node tools/scripts/ledger.mjs   # markdown mode
✅ tasks/LEDGER.md regenerado — 297 tasks
   review: 6 · rework: 1 · ready: 12 · draft: 180 · done: 98   ✅
```
- **Sondas adversariais (4 probes — `cli` direto, sem framework):**
```
=== Probe 1: --id quebra deps_ok ===
$ node tools/scripts/ledger.mjs --json --id ORQ-02
ORQ-02 deps_ok: false   deps: [ 'ORQ-01' ]   ← BUG: ORQ-01 está em review (não done),
                                                não deveria ser avaliado; ORQ-02 deveria
                                                ser deps_ok=true se ORQ-01 está review?

=== Probe 2: --status draft quebra deps_ok ===
$ node tools/scripts/ledger.mjs --json --status draft
ORQ-02 deps_ok: false   deps: [ 'ORQ-01' ]   ← BUG: mesmo problema

=== Probe 3: --capacity quebra deps_ok ===
$ node tools/scripts/ledger.mjs --json --capacity haiku
count: 21  first deps_ok: false  deps: [ 'ORQ-04' ]   ← BUG

=== Probe 4: --idle quebra deps_ok ===
$ node tools/scripts/ledger.mjs --json --idle
idle com deps: 46  exemplo: ORQ-02 deps_ok: false  deps: [ 'ORQ-01' ]   ← BUG

=== Probe 5: sem filtro, deps_ok está correto ===
$ node tools/scripts/ledger.mjs --json
T-006a deps_ok: true  dependencies: [ 'T-005', 'T-003' ]   ✅
ORQ-02 deps_ok: false  deps: [ 'ORQ-01' (review) ]         ✅
```

- **Achados:**

**[M1] `deps_ok` é calculado a partir do `allById` construído DEPOIS dos filtros — bug que afeta todas as combinações de filtro (`--id`, `--status`, `--capacity`, `--idle`)** — `tools/scripts/ledger.mjs:209`
  - **Evidência:** Probes 1–4 acima. Quando o filtro exclui o ID da dep, `allById.get(depId)` retorna `undefined`, e `dep && dep.status === 'done'` é `false`. O campo reportado é `deps_ok: false` mesmo quando a dep ESTÁ done.
  - **Root cause:** o `Map` é construído do array `tasks` que já foi filtrado (linhas 195-196 aplicam `filterStatus` e 199 aplica `filterCapacity` antes do push; linha 194 aplica `filterId`).
  - **Spec violada:** §3 declara "função `depsOk(task, allById)` → `true` se TODA dep tem `status==done`" e §4(f) exige "deps_ok=false quando uma dep não é `done`". Comportamento real: deps_ok=false também quando a dep não está no set filtrado.
  - **Impacto real:** o consumidor (ORQ-02 dispatcher) usa `deps_ok` para decidir se promove. Se o dispatcher filtrar com `--idle` (provável), todos os tasks em `idle` com deps são incorretamente marcados deps_ok=false → não promovem até alguém rodar sem filtro. Inconsistência silenciosa.
  - **Ação corretiva:** construir `allById` ANTES dos filtros (linha 181-185 já tem o loop separado de leitura do diretório — basta carregar tudo no `Map` primeiro, depois filtrar o `result`). 5 linhas de fix.
  ```js
  // Antes (linhas 187-209):
  const tasks = [];
  for (const file of fs.readdirSync(tasksDir)) { ... tasks.push(...); }
  const allById = new Map(tasks.map(t => [t.id, { status: t.status }]));  // ← usa tasks JÁ filtrado

  // Depois:
  const all = [];
  for (const file of fs.readdirSync(tasksDir)) { if (skip) continue; all.push(readFrontmatter(file)); }
  const allById = new Map(all.map(t => [t.id, { status: t.status }]));  // ← todos
  const tasks = all.filter(t => filterStatus ? t.status === filterStatus : true
                              && filterId ? t.id === filterId : true
                              && filterCapacity ? t.cap === filterCapacity : true);
  ```

**[m1] Divergência menor de assinatura: spec §3 pede `depsOk(task, allById)`, impl tem `depsOk(depIds, allById)`** — `tools/scripts/ledger.mjs:171`
  - Spec diz literalmente "função `depsOk(task, allById)`", mas a impl recebe `depIds` (array) e desestrutura no call site. Comportamento equivalente; a spec precisa ser ajustada ou a impl renomeada para `depsOkFor(depIds, allById)`. Housekeeping.

**[i1] Sondas adversariais não são persistidas** — spec §4 da task só menciona self-check por CLI. Como o sistema não tem framework de teste para scripts de tooling, os probes ficam no parecer; fica como evidência de cobertura.

- **Conformidade com §3 (escopo):**
  - `[UPDATE] tools/scripts/ledger.mjs` ✅
  - parse de `.nexus/transitions.jsonl` ✅
  - `rolesFromTransitions(events)` ✅
  - `nextAction(task)` ✅ (8 casos verificados via dist de estados — 11 decide, 51 harden, 114 null, 4 promote, 12 work, 6 review, 1 rework, 98 done/null)
  - `depsOk(depIds, allById)` ✅ (assinatura divergente, ver [m1])
  - `--json` mode ✅
  - filtros: `--status`, `--action`, `--id`, `--capacity`, `--idle` ✅
  - modo markdown intacto (Gate 4) ✅
  - sem `git` no Docs ✅ (não rodou nada git)
  - sem dependência externa ✅ (só `node:fs`/`node:path`)

- **Conformidade com §7 (DoD):**
  - `--json` válido, 14 chaves ✅
  - markdown intacto ✅
  - todos os campos §5 presentes ✅
  - filtros funcionam e compõem ✅ (mas com o bug [M1])

- **Veredito:** **REFATORAÇÃO NECESSÁRIA** — 1 achado MAJOR ([M1] deps_ok quebrado com filtros) + 1 MINOR ([m1] assinatura de `depsOk`). Gates 1–4 passam, mas [M1] precisa ser corrigido antes de aprovar.

- **Status pós-parecer:** `review` (sem transição — decisão é do `integrar-task`).

### Parecer do Reviewer 2 (Crush, segunda passagem — *mesmo modelo do R1; ideal seria outro conforme §2b do qa-review*):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Data:** 2026-06-30  ·  **Spec consultada:** §1–7  ·  **Arquivos auditados:** `tools/scripts/ledger.mjs:188-214` (UPDATE no rework)
- **Evidência de Execução (re-rodada nesta review):**
```
=== Gate 1 (--json shape) ===
$ node tools/scripts/ledger.mjs --json | node -e "<parse>"
itens: 297 | chaves[0]: id,status,spec_status,capacity_target,ui,dependencies,deps_ok,worker_model,reviewer_models,rework_count,hardened_by,last_event,next_action,busy   ✅
=== Gate 2 (--status review) ===
$ node tools/scripts/ledger.mjs --json --status review | node -e "<parse>"
review-only: true 5                                                                                                                          ✅
=== Gate 3 (--idle) ===
$ node tools/scripts/ledger.mjs --json --idle | node -e "<parse>"
idle sem done/busy: true                                                                                                                      ✅
=== Gate 4 (markdown mode) ===
$ node tools/scripts/ledger.mjs
✅ tasks/LEDGER.md regenerado — 297 tasks
   review: 5 · rework: 1 · ready: 12 · draft: 180 · done: 99                                                                                  ✅
```

- **Sondas adversariais (5 probes — re-rodadas para verificar [M1]):**
```
=== Probe 1: --id com dep não-feita (ORQ-01 em review) ===
$ node tools/scripts/ledger.mjs --json --id ORQ-02
ORQ-02 deps_ok: false   deps: [ 'ORQ-01' ]   ✅  (correto: ORQ-01 está review, não done)

=== Probe 2: --status draft ===
$ node tools/scripts/ledger.mjs --json --status draft
ORQ-02 deps_ok: false   deps: [ 'ORQ-01' ]   ✅  (mesma lógica, valor consistente)

=== Probe 3: --capacity haiku (filtra por cap, ORQ-04 é sonnet) ===
$ node tools/scripts/ledger.mjs --json --capacity haiku
count: 21  first deps_ok: false  deps: [ 'ORQ-04' ]   ✅

=== Probe 4: --idle ===
$ node tools/scripts/ledger.mjs --json --idle | jq '.[]|select(.id=="ORQ-02")'
ORQ-02 deps_ok: false   deps: [ 'ORQ-01' ]   ✅

=== Probe 5 (novo): T-006b (draft, dep T-006a done) com --id ===
$ node tools/scripts/ledger.mjs --json --id T-006b
T-006b deps_ok: true    deps: [ 'T-006a' ]   ✅  (CRÍTICO: era o caso onde o bug mascarava o resultado correto)

=== Probe 6 (novo): T-009a (draft, dep T-004 done) com --id ===
$ node tools/scripts/ledger.mjs --json --id T-009a
T-009a deps_ok: true    deps: [ 'T-004' ]    ✅
```

- **Verificação do fix em código** (`tools/scripts/ledger.mjs:188-214`):
  - Linha 188: `const all = [];` carrega TODOS os tasks (pré-filtro). ✅
  - Linha 207: `const allById = new Map(all.map(...))` — construído do `all` completo, não do `tasks` filtrado. ✅
  - Linhas 210-214: `tasks = all.filter(...)` aplica filtros DEPOIS. ✅
  - Loop de leitura (188-204) só pula `_*`/`INDEX.md`/`LEDGER.md` e aplica `prefix` (que é o filtro do CLI, não os filtros `--id`/`--status`/`--capacity`); filtros individuais são aplicados em 210-214. ✅
  - O `Map allById` agora é a fonte de verdade para `depsOk` e não muda com filtros. ✅

- **Achados pós-rework:**

**[M1] (rework) — RESOLVIDO.** O fix do `deepseek` reposiciona `allById` para antes dos filtros. Confirmado pelos 6 probes: `deps_ok` agora é logicamente correto independentemente de `--id`/`--status`/`--capacity`/`--idle`. Probes 5 e 6 (casos onde o bug mascarava `deps_ok=true`) agora retornam o valor correto. ✅

**[m1] (rework) — NÃO RESOLVIDO mas aceito.** `depsOk(depIds, allById)` mantém a assinatura divergente da spec §3 (que pede `depsOk(task, allById)`). Handover do worker: "housekeeping — assinatura divergente inofensiva". Comportamento equivalente; a spec precisa ser atualizada OU a impl renomeada. Decisão do worker: manter. Como o comportamento é correto, aceito o housekeeping e proponho atualizar a spec em uma tarefa de cleanup posterior (ou via `/agrupar-cleanup` quando drenar). Mantenho como pendência, não como bloqueador.

**[i1] (rework) — já no ledger** (`tasks/_pendencias.md`). Sondas não persistidas (CLI-only). Mantido como INFO.

- **Conformidade com §3 (escopo):** todos os 9 pontos verificados, igual a R1, com [M1] agora fechado. ✅
- **Conformidade com §7 (DoD):** todos os 4 itens verdes. ✅
- **Conformidade com §4 (cobertura):**
  - (a) --json válido: ✅
  - (b) 14 chaves: ✅
  - (c) --status review: ✅
  - (d) --idle: ✅
  - (e) next_action correto p/ ≥1 task de cada estado: ✅ (já verificado em R1)
  - (f) deps_ok=false quando uma dep não é `done`: ✅ (agora consistente, era o bug do R1)

- **Veredito:** **APROVADO** — [M1] corrigido, [m1] aceito como housekeeping, [i1] no ledger. Gates 1-4 verdes. Probes adversariais confirmam correção. Decisão segue para `integrar-task`.

- **Status pós-parecer:** `review` (sem transição — decisão é do `integrar-task`).



## 9. Log de Execução (Agent Execution Log)
> Registrem via `node tools/scripts/manage-task.mjs`. Identidade = modelo real.
- **[2026-06-30T17:45]** - *claude-opus* - `[Promovida p/ ready]`: hardened, sem deps — fundação
- **[2026-06-30T17:51]** - *deepseek* - `[Iniciado]`: iniciando implementação do --json
- **[2026-06-30T17:57]** - *deepseek* - `[Finalizado]`: ledger.mjs --json implementado: 297 tasks, 4/4 gates passando, 14 campos, filtros --status/--idle/--id/--action/--capacity
- **[2026-06-30T18:18]** - *agile_reviewer:Crush* - `[Requer Refatoração]`: Rework: [M1] deps_ok=false quando filtro (--id/--status/--capacity/--idle) exclui a dep do allById (tools/scripts/ledger.mjs:209) — allById é construído DEPOIS dos filtros. Fix: construir allById do array completo pré-filtro (~5 linhas). [m1] assinatura de depsOk diverge da spec §3 (impl recebe depIds, spec pede task) — housekeeping. Não-bloqueante: [i1] sondas adversariais não persistidas (CLI-only, sem framework) → ledger _pendencias.md.
- **[2026-06-30T18:24]** - *deepseek* - `[Iniciado]`: rework: corrigindo [M1] deps_ok quebrado com filtros — allById construído pós-filtro
- **[2026-06-30T18:25]** - *deepseek* - `[Finalizado]`: rework pronto: [M1] corrigido — allById construído do array completo pré-filtro, deps_ok agora consistente com/sem filtros. Gates 1-4 passando.
- **[2026-06-30T18:33]** - *agile_reviewer:Crush* - `[Aprovado]`: Integrado: rework do [M1] aplicado (deepseek, 2026-06-30T18:25) — allById agora construído ANTES dos filtros (tools/scripts/ledger.mjs:188-214). Gate pós-rework verde: pnpm-style §7 — Gate 1 (--json, 14 chaves), Gate 2 (--status review, true 5), Gate 3 (--idle, true), Gate 4 (markdown mode, 297 tasks). Sondas adversariais (6 probes) confirmam deps_ok consistente com/sem filtros. [m1] assinatura depsOk e [i1] sondas não persistidas → ledger _pendencias.md. Sem worktree (task de tooling do Docs). Pendências não-bloqueantes anexadas.
