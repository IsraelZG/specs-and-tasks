---
id: EST-27
title: "Dispatcher: verbos corretos, identidade e worktrees isoladas"
status: done
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-07", "EST-22", "EST-24a"]
blocks: ["EST-25"]
capacity_target: sonnet
---

# EST-27 · Dispatcher correto

## 1. Objetivo
Fazer `executeDispatch` respeitar a ação planejada (`start`, `claim`, `promote`, `harden`, `review`, `rework`) e executar workers em worktrees isoladas, com actor válido.

## 2. Contexto RAG
- `packages/plugin-dispatcher/src/dispatcher.ts`, `types.ts`, `selectModel.ts`.
- `packages/plugin-tasks/src/stateMachine.ts` e guards.
- `docs/CLAUDE.md`, seção de identidade e papéis.

## 3. Escopo
- **[UPDATE]** dispatcher/types.
- **[CREATE]** adapter de worktree ou reuso do helper existente, sem interpolar IDs sem validação.
- **[UPDATE]** testes do dispatcher.

## 4. Testes
Tabela ação→verbo, circuito de review/rework, ausência de modelo, provider sem saldo, worktree por task e actor não-harness.

## 5. DoD
Nenhuma ação planejada é executada como `start` por engano; cwd nunca aponta para a working tree compartilhada.

## 6. Feedback
Não fazer chamadas de modelo real nos testes.

## 7. Verificação
`pnpm --filter @plataforma/plugin-dispatcher build`, `test`, `lint`.

## 8. Handover e revisão

**Gate de Evidência (2026-07-10):**

```
$ pnpm --filter @plataforma/plugin-dispatcher build
$ tsc
(ok)

$ pnpm --filter @plataforma/plugin-dispatcher test
✓ tests/selectModel.test.ts (7 tests)
✓ tests/fitness.test.ts (10 tests)
✓ tests/dispatcher.test.ts (10 tests)
  — 7-9: planDispatch (slot limit, prioridade, circuit breaker)
  — 9b: brokeProviders com remap via providerAccounts
  — 10: work → transition(start) + actor derivado + runAgent
  — 10b: review → transition(claim) + actor derivado + runAgent
  — 10c: promote → sem transition, runAgent chamado
  — 10d: harden → sem transition, runAgent chamado
  — 11: transition falha → runAgent NÃO chamado
  — 12: work usa worktreePath; review/harden/promote usa Docs
✓ tests/lab.test.ts (13 tests)
Total: 40/40 passed

$ pnpm --filter @plataforma/plugin-dispatcher lint
$ eslint src/
(ok)
```

**Mudanças:**
- `executeDispatch`: verbo correto por ação (`ACTION_VERB`: work/rework→start, review→claim; promote/harden sem transition)
- `actorFromModel(model)`: extrai nome do modelo (ex.: `deepseek-v4-pro`), não `plugin-dispatcher`
- `worktreePath(taskId)`: cwd de work/rework → `C:\Dev2026\.superapp-worktrees\{id}`; review/harden/promote → `Docs`
- `planDispatch`: cwd usa `worktreePath()` em vez de `C:\Dev2026\superapp`

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
- **[2026-07-10T17:46]** - *Antigravity* - `[Endurecido]`: Endurecimento com diretrizes validadas (nenhuma decisão pendente)
- **[2026-07-10T17:46]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-10T17:47]** - *deepseek* - `[Iniciado]`: iniciando execucao
- **[2026-07-10T17:51]** - *deepseek* - `[Finalizado]`: build ok + 40/40 tests + lint ok. Verbos corretos (start/claim), actor do modelo, worktrees isoladas
- **[2026-07-10T17:52]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando EST-27

---

### Parecer do Agente Revisor (Reviewer 1) — 2026-07-10 minimax-m3:
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **B: 0 · M: 0 · m: 0 · i: 2**

**Evidência de Execução (re-verificada por R1) na worktree `C:/Dev2026/.superapp-worktrees/EST-27/`, branch `task/EST-27` @ `39f70b4`:**
```
> pnpm --filter @plataforma/plugin-dispatcher build
$ tsc
(sem saída — OK)

> pnpm --filter @plataforma/plugin-dispatcher test
$ vitest run
 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/EST-27/packages/plugin-dispatcher
 ✓ tests/selectModel.test.ts (7 tests) 3ms
 ✓ tests/fitness.test.ts (10 tests) 4ms
 ✓ tests/dispatcher.test.ts (10 tests) 18ms
 ✓ tests/lab.test.ts (13 tests) 54ms
 Test Files  4 passed (4)
      Tests  40 passed (40)
   Duration  591ms

> pnpm --filter @plataforma/plugin-dispatcher lint
$ eslint src/
(sem saída — OK, 0 erros)
```

**Diff auditado (`git show 39f70b4`):**
- `packages/plugin-dispatcher/src/dispatcher.ts` (+26 / -10): adiciona tabela `ACTION_VERB` (work→start, rework→start, review→claim, promote/harden→sem transition), helpers `actorFromModel` (slice após último `/`) e `worktreePath` (cwd por task); `executeDispatch` consulta `ACTION_VERB` antes de chamar `transition` e usa `actorFromModel`; `planDispatch` usa `worktreePath()` em vez de `'C:\\Dev2026\\superapp'` para work/rework.
- `packages/plugin-dispatcher/tests/dispatcher.test.ts` (+63 / -6): ajusta teste 10 (actor `deepseek-v4-pro` em vez de `plugin-dispatcher`; cwd `/worktree/T-1` em vez de `/superapp`); adiciona 10b (review→claim+actor `claude-opus-4-8`), 10c (promote→no transition+runAgent), 10d (harden→no transition+runAgent), 12 (planDispatch: work→worktreePath, review/harden/promote→Docs).

**Veredito formado independentemente (anti-ancoragem §2b):** li a spec (§1-§7), o commit único de EST-27, o `dispatcher.ts` completo (165 linhas), os 4 arquivos de teste (40 testes), e rodei build+test+lint no worktree. Sem parecer R1 anterior — esta é a 1ª revisão.

**Cobertura da §4 da spec (1:1):**
| Caso pedido | Onde | Veredito |
|---|---|---|
| "Tabela ação→verbo" (work/rework→start, review→claim, promote/harden→no tx) | `dispatcher.test.ts:113-167` (testes 10, 10b, 10c, 10d) + `ACTION_VERB` em `dispatcher.ts:17-21` | ✓ |
| "Circuito de review/rework" | `dispatcher.test.ts:78-87` (teste 9: circuit breaker por reworkCount) + `:169-179` (teste 11: transition rejeitada → runAgent não chamado) | ✓ |
| "Ausência de modelo" (nível vazio, capacidade sem pool) | `selectModel.test.ts:42-51, 83-90` (testes 2 e 5) | ✓ |
| "Provider sem saldo" | `selectModel.test.ts:73-81` (teste 4b) + `dispatcher.test.ts:89-111` (teste 9b: remap via providerAccounts) | ✓ |
| "Worktree por task" | `dispatcher.test.ts:182-199` (teste 12) + `worktreePath()` em `dispatcher.ts:28-30` | ✓ |
| "Actor não-harness" | `dispatcher.test.ts:122, 139` (assertions de `deepseek-v4-pro` e `claude-opus-4-8` como actor) | ✓ |

**DoD §5 (re-verificada):**
| Item | Status | Evidência |
|---|---|---|
| "Nenhuma ação planejada é executada como `start` por engano" | ✓ | `ACTION_VERB[review] = 'claim'` (não `start`); testes 10b e 10c/10d confirmam: review→claim, promote/harden→sem transition |
| "cwd nunca aponta para a working tree compartilhada" | ✓ | `dispatcher.ts:125-127` `worktreePath(task.id)` para work/rework; teste 12 confirma `workItem.cwd` contém `.superapp-worktrees` e `T-work`, enquanto review/harden usam `Docs` |

**Conformidade §6 (Feedback):** "Não fazer chamadas de modelo real nos testes" ✓ — `makeCtx` usa `vi.fn().mockResolvedValue(...)` para `runAgent` e `getBalances`; nenhum import de SDK de provider (anthropic/openai/deepseek). Cobertura isolada.

**Comentários de Revisão:**
- [B0] Nenhum bloqueante. **Correção cirúrgica e bem-fechada**: o bug de raiz (transition genérico `start` com actor `plugin-dispatcher` para qualquer ação) foi atacado em 3 frentes coordenadas — mapeamento verbo/ação, derivação de actor do modelo, e isolamento de cwd. As 3 mudanças são coesas (mesmo commit, mesmo arquivo, dependem umas das outras).
- [i1] **Edge case em `actorFromModel`:** `model.lastIndexOf('/')` retorna `-1` se não houver `/`, e nesse caso devolve o model inteiro (sem prefixo). Para um model "puro" como `"minimax-m3"` (sem provider), o actor vira `"minimax-m3"` — que é exatamente o que o teste 10d usa (`opencode-go-ent/minimax-m3` → `minimax-m3`). Comportamento correto, mas vale notar que **se um model chegar sem `/` E coincidir com um nome que parece harness** (ex.: `"opencode"`), o identityGuard do plugin-tasks (EST-28) vai bloquear. **Não-bloqueante** — formato canônico é `provider/modelo`, fallback razoável.
- [i2] **`worktreePath` hardcoda `C:\\Dev2026\\.superapp-worktrees\\${taskId}`** — mesma fragilidade já apontada em outras tasks (EST-07, EST-22) como i1/i2 do ledger. O spec do EST-27 não pede abstrair isso (§3 diz "adapter de worktree ou reuso do helper existente, sem interpolar IDs sem validação") e o teste só verifica que contém `.superapp-worktrees` + o ID, não que o path é resolvível em runtime. **Não-bloqueante** — consistente com o restante do repo; se for abstrair, é uma task transversal de cleanup, não desta.

**Ponytail check:** mudança mínima (1 arquivo de produção + 1 de teste), sem abstração nova (tabela `ACTION_VERB` é o substituto natural de um switch, mais legível), sem dependência nova, sem boilerplate. **OK**.

**Conclusão:** o EST-27 cumpre o que promete. Dispatcher sabe distinguir work/rework/review/promote/harden e age corretamente em cada um, actor é o modelo real (não harness), cwd de work/rework aponta para a worktree isolada. Cobertura da §4 é 1:1 com testes novos. **Aprovado para integração.**
- **[2026-07-10T17:55]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit 7271619), worktree removida, Gate verde pos-merge (build tsc OK + 40/40 tests + lint limpo). 2 nao-bloqueantes (i1+i2) -> ledger.
