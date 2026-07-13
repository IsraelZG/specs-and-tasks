---
id: EST-28
title: "Paridade das guardas MGTIA: build + test + lint + bypass"
status: done
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-03c", "EST-03d", "EST-21"]
blocks: ["EST-22"]
capacity_target: haiku
---

# EST-28 · Paridade das guardas MGTIA

## 1. Objetivo
Alinhar o gate de evidência implementado ao contrato vigente: evidência literal de build, test e lint; bypass somente quando explicitamente autorizado pela task; identidade e papel coerentes.

## 2. Contexto RAG
- `CLAUDE.md`, Regras 3 e 6.
- `packages/plugin-tasks/src/guards/evidenceGuard.ts`, `identityGuard.ts`, `service.ts`.

## 3. Escopo
- **[UPDATE]** guards/service/schema se necessário.
- **[UPDATE]** testes negativos e de bypass.

## 4. Testes
Casos isolados faltando build/test/lint, bypass explícito, `agile_reviewer:model`, actor harness e transição inválida.

## 5. DoD
Guard rejeita evidência incompleta e não altera manualmente status/INDEX/log.

## 6. Feedback
Não duplicar a política no servidor; consumir as guardas do plugin.

## 7. Verificação
`pnpm --filter @plataforma/plugin-tasks build`, `test`, `lint`.

## 8. Handover e revisão

```
> pnpm --filter @plataforma/plugin-tasks build
$ tsc

> pnpm --filter @plataforma/plugin-tasks test
$ vitest run
✓ tests/schema.test.ts (5 tests) 4ms
✓ tests/guards.test.ts (26 tests) 6ms
✓ tests/storage.test.ts (6 tests) 12ms
✓ tests/service.test.ts (14 tests) 7ms
✓ tests/parser.test.ts (6 tests) 15ms
✓ tests/stateMachine.test.ts (7 tests) 4ms
✓ tests/runner.test.ts (3 tests) 684ms
✓ tests/validate.test.ts (4 tests) 1156ms
Test Files  8 passed (8)
     Tests  71 passed (71)

> pnpm --filter @plataforma/plugin-tasks lint
$ eslint src/ scripts/
```

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
- **[2026-07-10T16:51]** - *Antigravity* - `[Endurecido]`: Diretrizes validadas (nenhuma decisão aberta pendente)
- **[2026-07-10T16:51]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-10T17:04]** - *deepseek* - `[Iniciado]`: iniciando execução
- **[2026-07-10T17:07]** - *deepseek* - `[Finalizado]`: Gate: build (tsc limpo) + test (71/71) + lint (eslint limpo). evidenceGuard agora exige build+test+lint; bypass preservado. 5 novos casos de teste negativos e positivos.
- **[2026-07-10T17:15]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando EST-28

---

### Parecer do Agente Revisor (Reviewer 1) — 2026-07-10 minimax-m3:
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **B: 0 · M: 0 · m: 0 · i: 2**

**Evidência de Execução (re-verificada por R1) na worktree `C:/Dev2026/.superapp-worktrees/EST-28/`, branch `task/EST-28` @ `44def70`:**
```
> pnpm --filter @plataforma/plugin-tasks build
$ tsc
(sem saída — OK)

> pnpm --filter @plataforma/plugin-tasks test
$ vitest run
 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/EST-28/packages/plugin-tasks
 ✓ tests/stateMachine.test.ts (7 tests) 4ms
 ✓ tests/storage.test.ts (6 tests) 12ms
 ✓ tests/service.test.ts (14 tests) 7ms
 ✓ tests/guards.test.ts (26 tests) 7ms
 ✓ tests/parser.test.ts (6 tests) 14ms
 ✓ tests/schema.test.ts (5 tests) 5ms
 ✓ tests/runner.test.ts (3 tests) 650ms
 ✓ tests/validate.test.ts (4 tests) 1141ms
 Test Files  8 passed (8)
      Tests  71 passed (71)
   Duration  1.72s

> pnpm --filter @plataforma/plugin-tasks lint
$ eslint src/ scripts/
(sem saída — OK, 0 erros)
```

**Diff auditado (`git show 44def70`):**
- `packages/plugin-tasks/src/guards/evidenceGuard.ts` (+9 / -4): troca o `&&` fraco (build OR test) por `||` forte (build AND test AND lint), preserva `bypass: true`, mensagem de erro lista os itens faltantes unidos por `/`.
- `packages/plugin-tasks/tests/guards.test.ts` (+43 / -1): substitui 1 teste positivo fraco por 5 testes — 3 negativos (build+test sem lint, só build, só test+lint), 1 positivo com eslint cru, 1 com bypass.
- `packages/plugin-tasks/tests/service.test.ts` (+1 / -1): ajusta o `section8_handover` do teste "finish permitido" para incluir lint (passa a refletir a nova exigência do gate).

**Veredito formado independentemente (anti-ancoragem §2b):** li a spec (§1-§7), o commit único de EST-28, o estado das guardas (5 arquivos em `src/guards/`), o `service.ts:60-62` que consome `assertEvidencePresent`, e rodei build+test+lint no worktree. Sem parecer R1 anterior — esta é a 1ª revisão.

**Cobertura da §4 da spec (1:1):**
| Caso pedido | Onde | Veredito |
|---|---|---|
| "faltando build/test/lint" (cada um isolado) | `guards.test.ts:43-80` (3 testes) | ✓ |
| "bypass explícito" (evidência, role, identidade) | `guards.test.ts:90-93`, `:23-25`, `:125-127`, `:141-143` | ✓ |
| `agile_reviewer:model` (formato canônico) | `guards.test.ts:129-135`, `:14-17` | ✓ |
| "ator harness" (Crush/Antigravity/opencode) | `guards.test.ts:97-108` | ✓ |
| "transição inválida" (verbo/state) | `stateMachine.test.ts:33-37, 41-43` | ✓ |

**DoD §5 (re-verificada):**
| Item | Status | Evidência |
|---|---|---|
| Guard rejeita evidência incompleta (build AND test AND lint) | ✓ | `evidenceGuard.ts:20` usa `\|\|` forte, 3 testes negativos confirmam |
| Não altera manualmente status/INDEX/log | ✓ | `service.ts:60-62` delega ao `assertEvidencePresent`; nenhuma escrita direta a `INDEX.md`/`tasks/<ID>.md`/`Log` em `src/` |
| §6 Feedback: "consumir as guardas do plugin" (não duplicar) | ✓ | `service.ts:3-7` importa as 3 guardas de `./guards/index.js`; nenhuma reimplementação local |

**Comentários de Revisão:**
- [B0] Nenhum bloqueante. **Gate é de fato mais forte**: a 1ª regex do `&&` permitia finish só com `pnpm test` (sem build); agora exige as 3 evidências. Cobertura nova prova que os 3 caminhos de falha estão fechados.
- [i1] **Edge case residual na regex de lint:** `hasLintEvidence = />\s*pnpm.*lint/i` casa com qualquer texto que tenha `pnpm ... lint` — inclusive um comentário honesto tipo `> pnpm lint não rodou (pule)`. Para tightening futuro, considerar exigir um marcador de sucesso (e.g. `0 errors`, `0 problems`, exit 0). **Não-bloqueante** — a evidência é lida de seção8 que é preenchida pelo próprio worker; a fraude é responsabilidade do worker, não do guard. (MGTIA pressupõe boa-fé do worker + auditoria do reviewer.)
- [i2] O erro `"test/lint"` (junção dos itens faltantes) é ambíguo de ler mas inequívoco de casar — os testes checam o trecho exato. Se um humano olhar a stack trace vai entender do contexto. Documentar no INFO do `assertEvidencePresent` que o separador é `/` entre os faltantes. **Não-bloqueante**, clareza marginal.

**Ponytail check:** mudança mínima (1 arquivo de produção + 2 de teste), sem abstração nova, sem dependência nova, sem boilerplate. **OK**.

**Conclusão:** o EST-28 cumpre o que promete. Gate exige as 3 evidências literais, bypass fica disponível só com autorização explícita, o service consome as guardas (não duplica), e a suíte prova os 5 cenários do spec. **Aprovado para integração.**
- **[2026-07-10T17:31]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit 6172bf8), worktree removida, Gate verde pós-merge (build tsc OK + 71/71 tests + lint limpo). 2 não-bloqueantes (i1+i2) -> ledger.
