---
id: DMM-13a
title: "Módulo Laboratório no plugin-dispatcher (clone worktrees, N variantes em paralelo, relatório)"
status: done
complexity: 3
parent_task: "DMM-13"
subtasks: []
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-06", "DMM-12"]
blocks: []
capacity_target: sonnet
---

# DMM-13a · Módulo "Laboratório" no `plugin-dispatcher`

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Sub-piece de **dispatch** do Laboratório Genético (DMM-13). Implementa o módulo "Laboratório"
no `plugin-dispatcher` que, dado um workflow base + parâmetros do Algoritmo Genético, clona
N worktrees isoladas e despacha cada variante em paralelo. Ao final, integra os resultados
das N variantes num único relatório consumido pelo Fitness (DMM-13c).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] ADR 0013 — delegação multi-modelo declarativa.
- [ ] `packages/plugin-dispatcher/src/dispatcher.ts` (EST-07) — `runAgent` port a reaproveitar.
- [ ] `tools/scripts/worktree.mjs` (no Docs) — pattern de worktree isolada para task.
- [ ] DMM-13b (Meta-Arquiteto) — produz a lista de variantes.
- [ ] DMM-13c (Fitness) — consome o relatório.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-dispatcher/src/lab/` — módulo novo (dir ou arquivo a fixar).
- **[CREATE]** teste: dado 3 variantes mockadas, valida que N worktrees são criadas, N runs
  completam, relatório agrega os resultados.

## 4. Estratégia de Testes Estrita
- **Vitest:** Variantes mockadas (sem chamar harness real); worktree mockada via
  `vi.mock('child_process')` ou similar. Asserta: N worktrees, paralelismo, agregação.

## 5. Instruções de Execução (Step-by-Step)
- **NÃO-FAZER:** **NÃO** rodar modelo real; testes com harness stub. **NÃO** sobrepor
  worktrees (cfr. DMM-13 §5 pai).

### Pegadinhas conhecidas
- "Paralelismo" — qual concurrency? Sugestão: `Promise.all` com cap configurável
  (N=4 default; ajustar por memória disponível). Decisão a fechar em pass-2.

## 6. Feedback de Especificação

### Decisões Arquiteturais Fechadas (Endurecimento JIT, 2026-07-09)
1. **Concurrency Cap (Híbrida):** Configurável pelo usuário (ex: no `orquestrador.config.json`). Além do limite de paralelismo (`max_parallel_variants`), devem ser suportados parâmetros vitais de segurança, como: `variant_timeout_ms` (timeout hard por variante para evitar loops infinitos estagnando o batch) e `memory_limit_mb` / flags de consumo (para abortar/pular o dispatch local se não houver RAM suficiente).
2. **Cleanup de Worktrees:** As worktrees (e o repo `.git` isolado) serão MANTIDAS pós-run para fins de debug e observabilidade. No entanto, o sistema monitorará este diretório de trabalho: pastas inativas marcadas como `stale` (além de um threshold de tempo/tamanho) engatilharão uma solicitação explícita (prompt) para o usuário autorizar o expurgo (GC), evitando o consumo oculto de disco.

### Classificação (pass-2)
- **Status:** `draft:hardened`
- **Motivo:** Arquitetura do laboratório fechada. Aguardará auto-promote para `ready` assim que a DMM-12 ficar `done`.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Módulo `Lab` cria N worktrees, despacha N variantes, integra relatório.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-dispatcher test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- `packages/plugin-dispatcher/src/lab/types.ts` — `LabConfig`, `VariantSpec`, `VariantResult`, `LabReport`, `LabSummary`, `RunAgentFn`
- `packages/plugin-dispatcher/src/lab/lab.ts` — `runLab()`: cria N worktrees, despacha variantes em batch com cap de concorrência, agrega relatório; `createWorktree()` / `removeWorktree()` helpers
- `packages/plugin-dispatcher/src/lab/index.ts` — barrel export
- `packages/plugin-dispatcher/src/index.ts` — exporta o módulo lab
- `packages/plugin-dispatcher/tests/lab.test.ts` — 13 testes: worktree creation, remove, N worktrees, cwd dispatch, concurrency cap, report aggregation, worktree failure, agent error, defaults, model override, worktreePath, config preservation

### Gate de Evidência
```
pnpm --filter @plataforma/plugin-dispatcher test

✓ tests/selectModel.test.ts (7 tests) 3ms
✓ tests/lab.test.ts (13 tests) 56ms
✓ tests/dispatcher.test.ts (6 tests) 20ms

Test Files  3 passed (3)
     Tests  26 passed (26)
```
### Rework 1 — Handover
- **B1** (`exactOptionalPropertyTypes`): `VariantResult.taskId` agora é incluído condicionalmente (spread só quando definido), eliminando atribuição de `undefined` a optional property. Todos os 3 pontos (makeFailedResult, runBatch success, runBatch catch).
- **B2** (`buildSummary`): Condição de `failed` simplificada para `!r.timedOut && r.exit !== 0`, agora capturando worktree-creation-failed (exit:null) como falha.

### Gate de Evidência (rework)
```
pnpm --filter @plataforma/plugin-dispatcher build

(tsc — zero errors)

pnpm --filter @plataforma/plugin-dispatcher test

✓ tests/selectModel.test.ts (7 tests) 4ms
✓ tests/dispatcher.test.ts (6 tests) 17ms
✓ tests/lab.test.ts (13 tests) 41ms

Test Files  3 passed (3)
     Tests  26 passed (26)
```
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

### Parecer do Reviewer 2 (minimax, independente):
- [ ] **Aprovado**
- [x] **Requer Refatoração**

- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/plugin-dispatcher build
$ tsc
(zero errors)
$ pnpm --filter @plataforma/plugin-dispatcher test
 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/DMM-13a/packages/plugin-dispatcher
 ✓ tests/selectModel.test.ts (7 tests) 3ms
 ✓ tests/dispatcher.test.ts (6 tests) 20ms
 ✓ tests/lab.test.ts (13 tests) 57ms
 Test Files  3 passed (3)
      Tests  26 passed (26)
$ pnpm --filter @plataforma/plugin-dispatcher lint
$ eslint src/
C:\Dev2026\.superapp-worktrees\DMM-13a\packages\plugin-dispatcher\src\lab\lab.ts
  79:28  error  Forbidden non-null assertion  @typescript-eslint/no-non-null-assertion
✖ 1 problem (1 error, 0 warnings)
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @plataforma/plugin-dispatcher@0.0.1 lint: `eslint src/`  Exit 1
```
- **Sonda (lab.probe.test.ts, 2 testes novos, depois removida):** ambas passaram.
  B2 (consistência summary) confirmado: `completed+failed+timedOut == total` mesmo com
  worktree-creation-failed (exit:null).
- **Veredito:** REFATORAÇÃO NECESSÁRIA
- **Contagem:** B:0 · M:1 · m:0 · i:0

MAJOR
- [M1] `packages/plugin-dispatcher/src/lab/lab.ts:79` — `worktreePaths.get(variant.id)!`
  continua usando non-null assertion, proibida pelo lint do monorepo
  (`@typescript-eslint/no-non-null-assertion`). **NÃO foi corrigido no rework** apesar de
  estar no parecer R1 e (implicitamente) no rework como não-bloqueante. Hoje a linha
  continua falhando o `pnpm lint` (1 erro).
  **Ação corretiva:** refatorar o flow de `runLab` para carregar `worktreePath` *junto*
  do variant no `pending` em vez de via `Map.get().!` — ex.: `const pending = variants
  .filter(v => worktreePaths.has(v.id))
  .map(v => ({ variant: v, worktreePath: worktreePaths.get(v.id)! }))` e ajustar
  `runBatch` para receber `({variant, worktreePath})[]`. Aí o `!` some naturalmente.
  Alternativa: usar um guard defensivo (`if (!path) throw new Error(...)`) — mas a
  refatoração de estrutura é mais limpa e mata o `!` na origem.
  *Nota:* o rework R1 recebeu a instrução "M1 → ledger" (verbatim), e o worker
  interpretou literalmente — pulou o fix. Isso é parcialmente culpa do parecer R1;
  deveria ter ficado explícito que M1 = MAJOR exige rework, não só entrada no ledger.

### Comentários de Revisão
- **B1, B2 RESOLVIDOS** com evidência (tsc limpo, 26/26 tests, sonda B2 passou). Bom.
- **M1 ficou pendente** — único motivo da recusa. É 1 linha + 1 refactor de assinatura;
  não é trabalho caro; é trabalho mecânico.
- **Lint do worker NÃO foi rodado no rework** (Gate §8 colou só `build` + `test`, sem
  `lint`). Mesmo padrão do R1 (i2). Está no ledger — `i2[DMM-13a][estaleiro/processo]`.
  A causa-raiz do M1 ter passado batido é essa: o gate do rework foi parcial.
- **Sem regressão de cobertura** — os 13 testes do lab + 6 dispatcher + 7 selectModel
  continuam verdes. Concorrência, agregação, model override, defaults, worktreePath,
  config preservation: tudo ok.
- **Divergência do parecer anterior:** nenhum — concordo com o R1 nos B1/B2 e na
  classificação de M1 como MAJOR. A diferença é que o R1 também roteou M1 para
  "ledger / não-bloqueante", o que o worker leu como "pode pular". Corrigindo.
- Task **fica em `review`** — `request_changes → rework` é do `/integrar-task`.

### Parecer do Reviewer 3 (minimax, independente):
- [x] **Aprovado**
- [ ] **Requer Refatoração**

- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/plugin-dispatcher lint
$ eslint src/
(zero errors)
$ pnpm --filter @plataforma/plugin-dispatcher build
$ tsc
(zero errors)
$ pnpm --filter @plataforma/plugin-dispatcher test
 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/DMM-13a/packages/plugin-dispatcher
 ✓ tests/selectModel.test.ts (7 tests) 3ms
 ✓ tests/dispatcher.test.ts (6 tests) 17ms
 ✓ tests/lab.test.ts (13 tests) 62ms
 Test Files  3 passed (3)
      Tests  26 passed (26)
```
- **Sonda (lab.probe.test.ts, 3 testes, depois removida):** 2 passaram (B2 ainda conta
  worktree-creation-failed em `summary.failed`; M1 refactor preserva dispatch de N
  variantes). A 3ª falhou por **erro do meu probe** (mock `vi.mocked(execSync)`
  vazou entre testes dentro do mesmo arquivo) — não é regressão do impl. Removida.
- **Veredito:** APROVADO
- **Contagem:** B:0 · M:0 · m:0 · i:0

### Comentários de Revisão
- **M1 RESOLVIDO** com refator estrutural limpo: introduziu `type PendingVariant =
  { variant; worktreePath }` (lab.ts:72), `pending: PendingVariant[]` é construído em
  `runLab` empurrando ambos os campos juntos (lab.ts:126,134), e `runBatch` recebe
  `PendingVariant[]` em vez de `Map.get().!`. O `!` desapareceu da origem — não é
  suprimido por guard, é eliminado pela estrutura. (lab.ts:72-77, 119-152). Bom.
- **B1, B2, M1** todos fechados com Gate de Evidência completo (build + test + lint)
  rodados pelo reviewer. (O i2 do R1 sobre "Gate do worker incompleto" segue no
  ledger como nota de processo — não é bloqueante.)
- **Sem regressão** — os 13 testes do lab continuam todos verdes; nenhum teste de
  selectModel/dispatcher quebrou. Concorrência, agregação, worktreePath, model
  override, defaults, worktree-creation-failed: tudo intacto.
- **Sondagem anti-ancoragem:** formei o veredito após rodar lint+build+test+sonda, ANTES
  de reler os pareceres R1/R2. Os probes passaram para o M1 refactor → fui rever os
  R1/R2 e confirmei convergência. Sem divergência com R2.
- Os achados **não-bloqueantes já drenados** para `tasks/_pendencias.md` (bloco
  `<!-- DMM-13a (R1, REFATORAÇÃO) -->`) seguem lá: M1 foi resolvido (marcar `[x]` no
  próximo `/agrupar-cleanup`), i1 (branch shell injection) e i2 (Gate de Evidência
  parcial do worker) seguem abertos para drain futuro.
- Task **passa para o integrator** — Caminho A do `integrar-task`: merge na master +
  Gate verde + `approve`.

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T19:12]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-06, DMM-12 ainda draft; reendurecer JIT — concurrency cap, cleanup de worktrees
- **[2026-07-09T21:45]** - *Antigravity* - `[Endurecido]`: Decisões de arquitetura fechadas com feedback do usuário
- **[2026-07-09T22:59]** - *Antigravity* - `[Promovida p/ ready]`: draft:hardened com deps ready — safety-net flip
- **[2026-07-09T23:00]** - *Antigravity* - `[Demovido]`: Revertendo promote: dependência DMM-12 ainda não está done
- **[2026-07-09T23:00]** - *Antigravity* - `[Reconciliado]`: status restaurado de draft:hardened para draft:placeholder (drift corrigido)
- **[2026-07-10T11:41]** - *Antigravity* - `[Reconciliado]`: status restaurado de draft:triaged para draft:placeholder (drift corrigido)
- **[2026-07-10T11:44]** - *Antigravity* - `[Promovida p/ ready]`: Movendo para ready
- **[2026-07-10T11:55]** - *deepseek* - `[Iniciado]`: iniciando execução do módulo Laboratório
- **[2026-07-10T12:19]** - *deepseek* - `[Finalizado]`: Módulo Lab implementado — 13 testes, concurrency cap, relatório agregado. 26/26 tests pass
- **[2026-07-10T12:29]** - *agile_reviewer:minimax* - `[Em revisão]`: revisando DMM-13a
- **[2026-07-10T12:32]** - *agile_reviewer:minimax* - `[Requer Refatoração]`: Rework: [B1] lab.ts:58,75 exactOptionalPropertyTypes falha tsc (VariantResult.taskId opcional vs atribuído undefined); [B2] buildSummary nao contabiliza worktree-creation-failed (exit:null cai em nenhuma categoria — completed exige 0, failed exige !=0 e !=null). Nao-bloqueantes (M1 non-null assertion lint; i1 branch shell injection; i2 Gate de Evidencia incompleto) -> ledger de pendencias.
- **[2026-07-10T12:39]** - *deepseek* - `[Iniciado]`: rework: corrigindo B1 (exactOptionalPropertyTypes) e B2 (buildSummary worktree-failed)
- **[2026-07-10T12:41]** - *deepseek* - `[Finalizado]`: rework pronto: B1 exactOptionalPropertyTypes corrigido (spread condicional), B2 buildSummary agora conta exit:null como failed. tsc limpo + 26/26 tests
- **[2026-07-10T12:44]** - *agile_reviewer:minimax* - `[Em revisão]`: R2: revisando rework DMM-13a
- **[2026-07-10T12:46]** - *agile_reviewer:minimax* - `[Requer Refatoração]`: Rework 2: [M1] lab.ts:79 non-null assertion (worktreePaths.get(variant.id)!) NAO corrigido no rework R1 — falha pnpm lint. B1 e B2 verificados e OK (tsc limpo, 26/26 tests, sonda B2 passou). Refatorar pending para carregar {variant, worktreePath} junto, eliminando o '!'. Nao-bloqueantes (i1, i2) seguem no ledger.
- **[2026-07-10T12:58]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1 (non-null assertion na linha 79)
- **[2026-07-10T13:01]** - *deepseek* - `[Finalizado]`: rework pronto: M1 — non-null assertion eliminada (Map+! substituído por PendingVariant[] com worktreePath inline). Build: tsc limpo. Test: 26/26 pass. Lint: 0 erros.
- **[2026-07-10T13:03]** - *agile_reviewer:minimax* - `[Em revisão]`: R3: revisando rework 2 DMM-13a
- **[2026-07-10T13:12]** - *agile_reviewer:minimax* - `[Aprovado]`: Integrado: merge na master (commit ea230d6, push origin/master ok). Conflito em src/index.ts resolvido combinando exports do lab (DMM-13a) com exports do fitness (DMM-13c pre-existente no master). pnpm-lock reconciliado (--ours). Worktree removida. Gate verde: build (tsc 0 errors), test (36/36 incluindo fitness do DMM-13c), lint (0 errors). M1 marcado resolvido no ledger; i1 e i2 seguem para drain futuro via /agrupar-cleanup.
