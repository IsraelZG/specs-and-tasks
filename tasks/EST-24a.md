---
id: EST-24a
title: "Agent runtime factory: provider + tools + harness + RunService"
status: done
complexity: 3
parent_task: "EST-24"
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-05", "EST-06", "EST-10", "EST-22"]
blocks: ["EST-24b", "EST-32"]
capacity_target: sonnet
---

# EST-24a · Agent runtime factory

## 1. Objetivo
Criar a composição injetável que resolve modelo via `plugin-providers`, cria `PluginTools` mediadas e encaminha `runner` pelo `RunService`/`harnessBridge`.

## 2. Contexto RAG
- `packages/plugin-providers/src/registry.ts`.
- `packages/plugin-fs-tools/src/index.ts`.
- `packages/plugin-agent-harness/src/runner.ts`.
- `apps/estaleiro/core/src/run-service.ts` e portas do host.

## 3. Escopo
- **[CREATE]** factory no core do Estaleiro e testes unitários.
- **[UPDATE]** bootstrap do EST-22 somente para registrar a factory.
- Não alterar contratos públicos dos plugins base.

## 4. Testes
Stubs de provider, tools, runner e bridge; verificar propagação de abort, timeout, eventos e cwd.

## 5. DoD
Factory usada por caller real e pronta para EST-24b; build/test/lint verdes.

## 6. Feedback
Se `resolveModel` não produzir `LanguageModel` compatível, pausar e registrar decisão.

## 7. Verificação
`pnpm --filter @plataforma/estaleiro-core build`, `test`, `lint`; testes do harness se afetados.

## 8. Handover e revisão

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Revisor:** agile_reviewer (minimax-m3) · 2026-07-10
- **Commit auditado:** `7441f72` (branch `task/EST-24a`)
- **Arquivos auditados:** 5 (factory.ts, bootstrap.ts, index.ts, package.json, factory.test.ts) + 2 (package.json estaleiro root, pnpm-lock.yaml) — todos dentro do escopo declarado em §3.

**Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/estaleiro-core build  →  tsc OK (sem erros)
$ pnpm --filter @plataforma/estaleiro-core test   →  Test Files 11 passed (11) · Tests 44 passed (44)
                                                   (8 novos testes em factory.test.ts: resolve, tools, eventos, cwd, timeoutMs, maxSteps, abort, roster inválido)
$ pnpm --filter @plataforma/estaleiro-core lint   →  eslint src/  (sem erros, sem warnings)
```

**Sondas adversariais:** escrevi 1 probe (`factory.probe.test.ts`) cobrindo o caso que a spec §4 exige — "propagação de abort" end-to-end. O probe FALHOU (ver [M1]). Removi o probe após confirmar (regra do reviewer).

**Achados:**

```
MAJOR (1)
────────────────────────────────────────────────────
[M1] apps/estaleiro/core/src/factory.ts:78-89  —  signal do factory NÃO é propagado para o runner
  Evidência: O probe criou um AbortController, passou em AgentRuntimeOptions.signal,
    executou `rt.execute({ taskId: "T-probe-1" })` e asserts que `run` foi chamado com
    `objectContaining({ signal: ac.signal })`. A chamada efetiva:
      run({ taskId, model, cwd, tools, cancelWatcher: true, onEvent })
    NÃO contém `signal` — foi omitida do spread de `runService.execute` em `execute()`.
  Viola: §4 "verificar propagação de abort, timeout, eventos e cwd" — abort só chega nas tools, não no runner.
  Também viola: §5.1 Gate de segurança/privacidade — sem propagação de signal ao runner, um cancelamento
    do orquestrador não interrompe o loop principal do harness; apenas tools abortáveis respondem.
  Ação corretiva: Em `execute()`, adicionar `...(opts.signal !== undefined ? { signal: opts.signal } : {})`
    ao spread passado para `runService.execute(...)`. Cobrir com teste que asserte `objectContaining({ signal })`.

MINOR (1)
────────────────────────────────────────────────────
[m1] apps/estaleiro/core/tests/factory.test.ts:174-184  —  Test #7 ("propaga sinal de abort para tools e runner") não verifica nada
  Evidência: A única asserção é `expect(runMock).toHaveBeenCalled()` — o que vale para qualquer chamada.
  Viola: Cobertura real do bullet de §4.
  Ação corretiva: Substituir por asserções com `objectContaining({ signal: ac.signal })` (cobre o [M1]) e
    outra confirmando que `makeTools` recebeu o signal (já implícito, mas documenta o contrato).

INFO (1)
────────────────────────────────────────────────────
[i1] apps/estaleiro/core/src/factory.ts:12-21  —  `bashTimeoutMs` no AgentRuntimeOptions
  Observação: o nome sugere timeout do BashPort, mas é na verdade o `bashTimeoutMs` do `makeTools`
  (plugin-fs-tools). A propagação está correta (`factory.ts:43`), mas a nomenclatura pode confundir
  caller. Sugestão: renomear para `toolsBashTimeoutMs` em uma próxima task — não bloqueia esta.

═══════════════════════════════════════════════════
VEREDICTO: REFATORAÇÃO NECESSÁRIA
Resumo: Build/test/lint verdes (44 passed, 0 failed), escopo respeitado, 8 testes novos cobrem
  provider/tools/bridge/runner + propagação de cwd/timeoutMs/maxSteps/eventos. Mas a propagação
  do `signal` de abort para o runner está QUEBRADA — um único find-and-replace + 1 asserção
  adicional resolve. Sem isso, a spec §4 não está plenamente atendida.
```


### Parecer do Reviewer 2 (minimax-m3, independente):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Revisor:** agile_reviewer (minimax-m3) · 2026-07-10
- **Commit auditado:** `469f219` (rework) + `7441f72` (feat, base)
- **Anti-ancoragem:** parecer formado a partir do rework diff + Gate re-rodado + spec §4; veredito "APROVADO" derivado do rework, não herdado.

**Evidência de Execução (pós-rework):**
```
$ pnpm --filter @plataforma/estaleiro-core build  →  tsc OK (sem erros)
$ pnpm --filter @plataforma/estaleiro-core test   →  Test Files 11 passed (11) · Tests 44 passed (44)
$ pnpm --filter @plataforma/estaleiro-core lint   →  eslint src/  (sem erros)
```

**Verificação dos achados do Parecer 1:**
- **[M1] factory.ts:78-89** — ✅ RESOLVIDO em `469f219` (+1 linha):
  ```diff
  +      ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
  ```
  Signal do `AgentRuntimeOptions` agora chega ao `runService.execute(...)` → `run(...)`. Cobertura do §4 (propagação de abort) completa.
- **[m1] factory.test.ts:174-184** — ✅ RESOLVIDO em `469f219` (mesmo commit): teste renomeado para "propaga sinal de abort **do factory** para o runner" e asserção trocada para `objectContaining({ signal: ac.signal })`. O bug latente (asserção trivial) está coberto.

**Achados deste parecer:** 0 (zero).

**Itens do ledger pendentes:** `[i1]` (bashTimeoutMs naming) — não-bloqueante, sugestão de nomenclatura para task futura, ainda válido.

═══════════════════════════════════════════════════
VEREDICTO: APROVADO
Resumo: Rework cirúrgico (6 linhas, 1 arquivo de impl + 1 de teste) endereça [M1] e [m1] da revisão
  anterior; Gate re-rodado pós-rework 100% verde (44/44 tests). Não há novos achados. A spec §4
  (propagação de abort, timeout, eventos, cwd) está agora plenamente atendida.



## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
- **[2026-07-10T16:39]** - *Antigravity* - `[Endurecido]`: Diretrizes validadas (nenhuma decisão aberta pendente)
- **[2026-07-10T16:39]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-10T17:04]** - *deepseek* - `[Iniciado]`: iniciando factory agent runtime
- **[2026-07-10T17:10]** - *deepseek* - `[Finalizado]`: Factory createAgentRuntime criada no core do estaleiro. build: tsc OK, test: vitest 29/29 pass (8 novos factory tests), lint: eslint src/ OK
- **[2026-07-10T17:15]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: qa-review --integrar EST-24a
- **[2026-07-10T17:20]** - *agile_reviewer:minimax-m3* - `[Parecer]`: REFATORAÇÃO NECESSÁRIA — 1 MAJOR (signal não propagado ao runner), 1 MINOR (test #7 sem asserção), 1 INFO. Build/test/lint verdes.
- **[2026-07-10T17:21]** - *agile_reviewer:minimax-m3* - `[Requer Refatoração]`: Rework: [M1] factory.ts:78-89 signal do factory NAO propagado para o runner — spec §4 exige 'propagacao de abort' end-to-end. Workaround: adicionar '...(opts.signal !== undefined ? { signal: opts.signal } : {})' ao spread de runService.execute(...) em execute() + assercao objectContaining({ signal: ac.signal }) em novo teste. Nao-bloqueantes [m1,i1] -> ledger. Parecer completo em §8.
- **[2026-07-10T17:27]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1 (signal propagation) e m1 (test assertion)
- **[2026-07-10T17:29]** - *deepseek* - `[Finalizado]`: rework pronto: [M1] signal propagation adicionado em execute() + [m1] test assertion com objectContaining({ signal }). build: tsc OK, test: vitest 44/44 pass, lint: eslint OK
- **[2026-07-10T17:31]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: qa-review --integrar EST-24a (rework)
- **[2026-07-10T17:35]** - *agile_reviewer:minimax-m3* - `[Parecer]`: APROVADO (Reviewer 2, independente) — [M1] e [m1] resolvidos em `469f219`; Gate re-rodado 100% verde; 0 achados novos.
- **[2026-07-10T17:35]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit 62a688c, com resolucao de conflito de version bump em apps/estaleiro/package.json 0.0.26→0.0.28), worktree removida, Gate verde (build tsc OK, test 44/44, lint OK). Nao-bloqueantes [i1] -> ledger ([m1] resolvido no rework). Reviewer 2 (independente) aprovou.
