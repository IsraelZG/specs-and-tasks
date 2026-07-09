---
id: DMM-03
title: "Nó Architect (Estágio 2): avaliador macro via plugin-providers (branching/subtasks)"
status: done
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"]
blocks: ["DMM-06"]
capacity_target: sonnet
---

# DMM-03 · Nó Architect (Estágio 2): orquestrador macro

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Implementar o **nó avaliador** (ADR 0013, Estágio 2 — The Architect): planeja a execução, quebra
problemas e avalia progresso **sem abrir arquivos**. A engine submete o contexto traduzido/comprimido
(saída do Estágio 1) ao **modelo de fronteira** via `plugin-providers`; a resposta define quais
ramificações do workflow seguir ou quais sub-tarefas criar.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Estágio 2.
- [ ] `docs/adr/0014-contrato-no-workflow-declarativo.md` (DMM-01) — como um nó dirige branching.
- [ ] `packages/plugin-providers/src/**` — invocação de modelo de fronteira.
- [ ] `packages/plugin-workflows/src/**` — como um nó decide a próxima aresta do grafo.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-providers/src/**`, `packages/plugin-workflows/src/**`.
- **[CREATE]** definição do nó Architect (formato DMM-01) + mapeamento resposta→ramificação/subtask.
- **[CREATE]** teste: contexto de exemplo → decisão de branching determinística (com provider mockado).

## 4. Estratégia de Testes Estrita
- Vitest com `plugin-providers` mockado (resposta fixa → aresta esperada). **Fora de Escopo:** custo real de API.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** deixar o Architect abrir/ler arquivos (é papel do Explorer, DMM-04) — só planeja.
> - **NÃO** hardcodar o modelo: provider é configurável por nó.

### Pegadinhas conhecidas
- A resposta do provedor deve ser mapeada em um Delta com `{ next: string, args: {} }` para informar o fluxo, conforme `docs/adr/0014`.

## 6. Feedback de Especificação
- **DERIVADO**: Orquestração via `Envelope` e formato de nó/transição derivados de `docs/adr/0014-contrato-orquestrador-declarativo.md` (DMM-01).

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-01` (ainda em `draft:pending_decision` — é o spike que define o
  contrato de nó/transição e como "um nó dirige branching" — `docs/adr/0014`). A spec §3 já
  marca `[CREATE] definição do nó Architect (formato DMM-01) + mapeamento resposta→ramificação/subtask`,
  ou seja, o **formato e o mecanismo de branching** são exatamente o que o spike vai decidir.
- **Por que NÃO `harden`:** sem o ADR 0014, qualquer mapeamento "resposta do modelo → aresta
  do grafo" seria chute.
- **Próximo passo:** após DMM-01 virar `done`, reendurecer (pass-2 JIT). Painel listará DMM-03
  como "REENDURECER" automaticamente.
- **Pré-endurecimento já válido:** `capacity_target: sonnet` (composição de provider+workflow
  existente, não é spike algorítmico), `dependencies: [DMM-01]` consistente com `blocks:`.
- **Pendente p/ pass-2:** assinatura TS exata do nó + do mapeamento de resposta→aresta, formato
  concreto do teste (provider mockado → aresta esperada), casos de branching enumerados.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Nó Architect decide branching a partir da resposta do modelo, via contrato DMM-01.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Nó Architect implementado como workflow declarativo (ADR 0014): `createArchitectWorkflow`/`runArchitect`
  compõem `plan` (DI) → `dispatch` via Zen engine + orquestrador.
- 6 arquivos criados em `src/nodes/architect/` + 1 teste com 5 casos (sequential, branch, simple, DI, maxItems).
- Nenhum hardcode: `ModelPlanner` injetado por DI, JDM portátil, branching decidido por Zen.
- Gate verde: build + lint + test (6/6 workflows).

**Rework [M1] (deepseek, 2026-07-09):**
- `createDispatchHandler`: valida que `mode === "sequential"` tem `tasks` não-vazias e `mode === "branch"` tem `branches` não-vazias. Mismatch → `Promise.reject` com mensagem explícita.
- Testes: 7 casos (eram 5). Novos: `mode=branch+tasks` e `mode=sequential+branches` adversariais.
- Gate:
```
$ pnpm --filter @plataforma/plugin-workflows build
$ tsc (Exit 0)
$ pnpm --filter @plataforma/plugin-workflows test
✓ poc/architect.poc.test.ts (7 tests)
✓ poc/chain.poc.test.ts (1 test)
 Test Files  2 passed | Tests  8 passed
$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/ (Exit 0)
```

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Revisor:** `agile_reviewer:claude-sonnet` (1ª revisão independente)
- **Data:** 2026-07-09

**QA REPORT — DMM-03 — Nó Architect (Estágio 2)**
```
Data: 2026-07-09  |  Revisor: agile_reviewer (claude-sonnet)
Spec consultada: tasks/DMM-03.md §1–7  |  Arquivos auditados: 5 (criados) + 1 (modificado)
Testes: 6 rodados · 6 passaram · 0 falharam
tsc: OK (0 erros)  |  lint: OK (0 erros)

Evidência de Execução
─────────────────────
$ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows test
$ vitest run
 ✓ poc/architect.poc.test.ts (5 tests) 315ms
 ✓ poc/chain.poc.test.ts   (1 test)   203ms

 Test Files  2 passed (2)
      Tests  6 passed (6)
   Start at  13:49:35
   Duration  1.33s
```

BLOCKER (0) / MAJOR (1) / MINOR (3) / INFO (3)
──────────────────────────────────────────────
**MAJOR**
`[M1]` `packages/plugin-workflows/src/nodes/architect/architect.handlers.ts:31`
  Evidência: `dispatchItems: mode === "sequential" ? tasks : branches` — se o
  planner retornar `mode: "branch"` com `tasks: [...]` (ou `mode: "sequential"`
  com `branches: [...]`, ou `mode` fora da union), o envelope final terá
  `{ dispatched: true, dispatchItems: [] }` sem qualquer erro. O JDM
  r3 → `dispatch` → terminal r4 também aceita o resultado silenciosamente
  (não há sanity check em `createDispatchHandler`).
  Viola: §5 Pegadinha ("resposta do provedor deve ser mapeada em Delta com
  { next, args }" — a integridade do mapping é parte do contrato DMM-01) e
  §4 (Estratégia de testes — "resposta fixa → aresta esperada": o suite cobre
  apenas pares canônicos mode↔campo, não mismatch).
  Ação: (a) validar que o campo certo está populado conforme `mode` e levantar
  erro explícito, ou (b) preferir o campo presente independente de `mode`, ou
  (c) documentar como invariante esperado e adicionar testes adversariais
  (atualmente AUSENTES). Recomendo (a) + 2 testes adversariais
  (`mode=branch+tasks`, `mode=sequential+branches`).

**MINOR**
`[m1]` `architect.ts:13-15` + `types.ts:3-12` + `architect.handlers.ts:7-19`
  Evidência: `ModelPlanner` é apenas `type` alias
  (`(context: string) => Promise<ArchitectPlan>`). Em runtime, se o provider
  retornar `{}`, `summary: undefined` ou `mode` inválido, o envelope propaga
  valores inconsistentes sem qualquer validação. TypeScript-only.
  Viola: ADR 0013 §2 Estágio 2 (formato do response bem-definido).
  Ação: adicionar guarda leve (Zod ou manual) em `createPlanHandler`;
  rejeitar `mode` fora da union e exigir `summary: string`.

`[m2]` `architect.handlers.ts:9-10`
  Evidência: `result.tasks?.slice(0, maxItems)` aceita `maxItems = -1` e
  retorna `slice(0, -1)` = tudo exceto o último item (semântica
  contraintuitiva).
  Viola: §5 NÃO FAZER (sem hardcode); secundário — afeta UX do caller.
  Ação: `Math.max(0, maxItems)` ou validar `opts.maxItems > 0` em
  `createArchitectWorkflow`.

`[m3]` `architect.ts:13-15`
  Evidência: `loadArchitectGraph()` faz `fs.readFileSync(architect.jdm.json)`
  no construtor do workflow. A regra §5 ("NÃO deixar o Architect abrir/ler
  arquivos — é papel do Explorer, DMM-04") refere-se a abrir arquivos do
  projeto do usuário (código-fonte da task executada), não o próprio JDM
  do nó. **Defensável** (consistente com o padrão `chain.poc.test.ts` de
  DMM-01), mas precisa de comentário explícito para evitar re-revisão
  posterior.
  Ação: adicionar `// nota: fs.readFileSync do JDM é o BOOT do workflow
  (carrega a definição do grafo), não abre código-fonte da task — papel
  do Explorer (DMM-04).`

**INFO**
`[i1]` Cobertura §4 está completa para os pares canônicos:
  sequential+tasks / branch+branches / simple / DI / maxItems = 5/5 no
  `architect.poc.test.ts` + 1/1 no `chain.poc.test.ts` (baseline DMM-01)
  = 6/6. DoD §7 ("Nó Architect decide branching a partir da resposta do
  modelo, via contrato DMM-01") atendida nos casos cobertos.

`[i2]` ADR 0014 `{ next, args }` Delta: `architect.ts:35-45` retorna
  `Decision{next: string | null}` (sem `args`); o JDM não precisa de args
  para a aresta de decisão. Consistente com `types.ts:25-28`.

`[i3]` Acoplamento (Gate 5.1.2): imports cross-package do `architect/**`
  são apenas `@plataforma/plugin-zen-engine` (peer, decisor de DI) e
  `@plataforma/plugin-workflows` (auto, intra-package). Zero ciclo, sem
  inversão de direção.

VEREDICTO: REFATORAÇÃO NECESSÁRIA
Resumo: Gate verde (tsc/lint/test 6/6), DoD atendido no happy-path, mas
o dispatch handler é silencioso em mode/campo mismatch (MAJOR `[M1]`) e
falta validação runtime do payload do planner. 3 MINORs são endurecimento
opcional.
```

**Comentários de Revisão:** Único achado bloqueante (de revisão) é o
`[M1]` — o handler `dispatch` aceita silenciosamente pares canônicos
quebrados (`mode: "branch"` + `tasks: [...]` etc.) e devolve
`dispatchItems: []` com `dispatched: true`. Em produção, isso seria um
nó que "executou sem subtarefas" sem qualquer sinal de erro. Os 3 MINORs
são endurecimento defensivo. O Gate 5.1.1 (wiring) está OK porque a
integração downstream **DMM-06** está linkada no frontmatter
`blocks: ["DMM-06"]` (DMM-06 ainda em `draft:triaged`, será o caller
real).

### Parecer do Reviewer 2 (claude-sonnet, independente — pós-rework):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Revisor:** `agile_reviewer:claude-sonnet` (Reviewer 2; 1ª revisão foi `agile_reviewer:claude-sonnet` R1 em 2026-07-09T16:51, mesmo modelo — mas sessão independente).
- **Data:** 2026-07-09
- **Anti-ancoragem:** veredito formado a partir da spec + código + Gate + sondas **antes** de reler o parecer R1 linha-a-linha. O parecer R1 só foi comparado após a conclusão do meu veredito.

**QA REPORT — DMM-03 (rework) — Nó Architect (Estágio 2)**
```
Data: 2026-07-09  |  Revisor: agile_reviewer (claude-sonnet)
Spec consultada: tasks/DMM-03.md §1–7  |  Arquivos auditados: 5 (criados) + 1 (modificado) — branch tem 3 commits
Testes: 8 rodados · 8 passaram · 0 falharam
tsc: OK (0 erros)  |  lint: OK (0 erros)

Evidência de Execução
─────────────────────
$ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows test
$ vitest run
 ✓ poc/architect.poc.test.ts (7 tests) 194ms
 ✓ poc/chain.poc.test.ts   (1 test)   183ms

 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  14:18:11
   Duration  983ms
```

Sonda adversarial
─────────────────
`poc/m1-rework.probe.test.ts` (redigido, executado, **REMOVIDO**) — 5 casos:
1. ✅ `mode=branch` + `tasks:[]` → `Promise.reject(/branch.*branches/)`
2. ✅ `mode=sequential` + `branches:[]` → `Promise.reject(/sequential.*tasks/)`
3. ✅ `mode="explodir"` (model garbage) → `Promise.reject(/desconhecido/)`
4. ✅ `mode=undefined` (plan retorna nada) → `Promise.reject(/desconhecido/)`
5. ℹ️ plan handler com `{}` → `summary: undefined` preservado sem crash
   (confirma que o [m1] do parecer R1, validação runtime do plan, NÃO foi
   corrigido no rework — apenas documentado como não-bloqueante).

**Confirmação: [M1] do parecer R1 está TOTALMENTE corrigido.** O rework
de deepseek (commit `74499e2`) implementa:
  - `architect.handlers.ts:22-46` `createDispatchHandler` agora valida:
    - `mode === "sequential"` → exige `tasks.length > 0` (reject caso vazio)
    - `mode === "branch"` → exige `branches.length > 0` (reject caso vazio)
    - `mode` fora da union → reject com mensagem explícita
  - `architect.poc.test.ts:102-114` 2 testes adversariais novos:
    - `dispatch rejeita mode=branch com tasks (mismatch campo)`
    - `dispatch rejeita mode=sequential com branches (mismatch campo)`
  - Gate triplo pós-rework: 8/8 (era 6/6), tsc/lint limpos.

BLOCKER (0) / MAJOR (0) / MINOR (1) / INFO (4)
──────────────────────────────────────────────
**MAJOR — nenhum.** O parecer R1 [M1] (dispatch silencioso em mode/campo
mismatch) está integralmente resolvido pelo rework. Sondas 1-4
confirmam o comportamento esperado.

**MINOR (herdado do R1, NÃO corrigido no rework — esperado, fora de escopo)**
`[m1]` `architect.ts:13-15` + `types.ts:3-12` + `architect.handlers.ts:7-19`
  Validação runtime ausente no `createPlanHandler`: provider pode
  retornar `{}`, `summary: undefined` ou `mode` inválido. Sonda 5
  confirma que `summary: undefined` propaga sem crash (não-bloqueante).
  Track: adicionar guarda leve (Zod ou manual) em `createPlanHandler`;
  rejeitar `mode` fora da union e exigir `summary: string` (ADR 0013
  §2 Estágio 2).

**INFO (herdados do R1)**
`[i1]` `result.tasks?.slice(0, maxItems)` ainda aceita `maxItems = -1`
  retornando `slice(0, -1)` (semântica contraintuitiva). Defensável
  para o caller atual. Track: `Math.max(0, maxItems)` no rework futuro.

`[i2]` `loadArchitectGraph()` (`architect.ts:13-15`) ainda faz
  `fs.readFileSync(architect.jdm.json)`. **Defensável** (consistente
  com `chain.poc.test.ts` de DMM-01) — bootstrap do grafo, não abre
  código-fonte da task. Track: adicionar comentário explicativo
  referenciando o papel do Explorer (DMM-04).

`[i3]` Cobertura §4 completa para pares canônicos: 5/5 originais +
  2/2 adversariais = 7/7 no `architect.poc.test.ts` + 1/1 no
  `chain.poc.test.ts` (baseline DMM-01) = 8/8. DoD §7 atendida.

`[i4]` Acoplamento (Gate 5.1.2): zero import cross-package não-trivial
  em `architect/**` (apenas `@plataforma/plugin-zen-engine` peer).
  Zero ciclo. Consistente com `docs/visao-arquitetural.md §1`.

`[i5]` Gate 5.1.1 (wiring) OK: caller de produção ainda não existe
  (próprio teste). Integração downstream **DMM-06** linkada no
  frontmatter `blocks: ["DMM-06"]` (DMM-06 ainda em `draft:triaged`,
  será o caller real).

VEREDICTO: APROVADO
Resumo: O rework de deepseek (commit `74499e2`) fechou integralmente o
[M1] do parecer R1 (dispatch silencioso em mode/campo mismatch).
Sondas adversariais 1-4 confirmam o comportamento esperado em todos
os casos de mismatch. Gate triplo verde (8/8 plugin-workflows, tsc/lint
limpos). Os 1 MINOR + 4 INFO persistentes são housekeeping não-
bloqueante, herdados do R1 e explicitamente fora do escopo do rework
(foco era exclusivamente no MAJOR). Recomendo **integrar**.
```

**Comentários de Revisão (R2):** Divergência do parecer R1 — claude-sonnet
R1 marcou **Requer Refatoração** por causa do [M1] (dispatch
silencioso em mode/campo mismatch). O rework de 2026-07-09T17:15
(deepseek) **resolveu integralmente** o [M1]: validação runtime
adicionada em `createDispatchHandler` com 2 testes adversariais.
Minhas 5 sondas adversariais (incluindo 2 casos não cobertos pelos
testes do rework — mode desconhecido e mode=undefined) confirmam que
o dispatch agora rejeita explicitamente todos os cenários de mismatch.
Os outros achados do R1 ([m1] plan handler validation, [i1] maxItems
negativo, [i2] fs.readFileSync defensável) são housekeeping
não-bloqueante, corretamente deixados para cleanup futuro. Recomendo
**integrar** (merge na master + approve).

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T18:37]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-01 ainda draft:pending_decision; reendurecer JIT após spike
- **[2026-07-09T12:20]** - *Antigravity* - `[Endurecido]`: Endureceu spec com assinaturas de DMM-01
- **[2026-07-09T12:20]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-09T15:35]** - *claude-sonnet* - `[Iniciado]`: iniciando
- **[2026-07-09T15:41]** - *claude-sonnet* - `[Finalizado]`: Nó Architect implementado: workflow declarativo plan→dispatch via ADR 0014. Gate: 6/6 tests pass, lint/build verde.
- **[2026-07-09T16:42]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando
- **[2026-07-09T16:51]** - *agile_reviewer:claude-sonnet* - `[Requer Refatoração]`: Rework: [M1] dispatch handler silencioso em mode/campo mismatch (architect.handlers.ts:31) — adicionar validação de par mode↔campo + 2 testes adversariais (mode=branch+tasks, mode=sequential+branches). Não-bloqueantes [m1-m3, i1-i4] → ledger. Gate triplo (tsc/lint/test) verde na re-submissão. (1ª revisão independente; reviewer: claude-sonnet)
- **[2026-07-09T17:12]** - *deepseek* - `[Iniciado]`: rework: corrigindo achados do parecer
- **[2026-07-09T17:15]** - *deepseek* - `[Finalizado]`: rework pronto: [M1] corrigido — dispatch valida mode↔campo e rejeita mismatch. 8/8 tests, build + lint limpos.
- **[2026-07-09T17:17]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando 2 (post-rework independente; reviewer anterior: claude-sonnet R1)
- **[2026-07-09T17:21]** - *agile_reviewer:claude-sonnet* - `[Aprovado]`: Integrado: merge na master (commit 9becd8e; conflito em index.ts resolvido combinando exports de DMM-02 + DMM-03), worktree removida, Gate verde (pnpm --filter @plataforma/plugin-workflows: build OK + test 14/14 + lint OK — 3 files: chain.poc+ingress.poc+architect.poc). 4 não-bloqueantes (m1, i1, i2, i3) → ledger. Parecer R2 confirma rework deepseek (commit 74499e2) fechou integralmente o [M1] do parecer R1. 5 sondas adversariais validam o dispatch em runtime.
