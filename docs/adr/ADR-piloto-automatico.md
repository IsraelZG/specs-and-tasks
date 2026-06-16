# ADR — Piloto Automático (Runner de Ondas / Torre de Controle)

- **Status:** Aceito (arquitetura) · invocação de agente externo a validar via PoC (spike T-1017)
- **Data:** 2026-06-15
- **Contexto-fonte:** vínculo com T-1010..T-1019 (ledger MGTIA, REST/MCP, worktree, merge cycle)

## Contexto

O ciclo MGTIA `worker → review → rework` hoje exige um humano para: passar prompts de
kickoff/rework e **validar o veredito do QA** (um QA leve pode aprovar com teste vermelho ou
rejeitar sem rodar nada). Queremos um **runner** que percorra o grafo de tasks em ondas,
dispare os agentes (Claude=arquiteto/forte; DeepSeek/Gemini=worker/reviewer via OpenCode),
e só chame o humano em condições de exceção bem definidas.

O **único bloco realmente incerto** é *como invocar cada agente externo em modo headless*
(OpenCode com modelo escolhido, `cwd` num worktree, e como ele reporta de volta). Isso fica
isolado na spike **T-1017** (PoC). Todo o resto é determinístico.

## Decisão

### Princípio central
O runner **não confia no auto-relato dos agentes** para "verde". Ele é dono da verdade:
re-roda a verificação (`build`+`test`) ele mesmo, no worktree da task, antes de aceitar uma
aprovação. Um "approved com teste vermelho" torna-se estruturalmente impossível.

### Defaults decididos
1. **Estado híbrido:** agentes auto-reportam `start/finish/pause` via o ledger central
   (mantém a convenção e o log legível); o runner é dono de **spawn + gate + contador de
   rework + escalada**. (Não migramos para "runner dono de todas as transições".)
2. **Gate determinístico re-roda os testes** — não confia na saída colada pelo agente.
3. **Modo supervisionado por padrão** (confirma antes de cada spawn/merge); autopilot é opt-in.
4. **Concorrência inicial K=1** (serial); paralelismo é fase posterior.

### Separação que habilita paralelismo: ledger central, código isolado
| O quê | Onde mora | Acesso do agente |
|---|---|---|
| Estado/log (status, parecer) | **um** ledger no repo principal | `NEXUS_ROOT_DIR=<repo principal>` |
| Código (src, testes) | worktree por task | `cwd=.nexus-worktrees/T-XXXX` |

`TaskService` já desacopla `rootDir` (ledger) do `cwd` (código), então o agente edita código
isolado no worktree mas escreve status sempre no ledger central.

### Componentes (todos em `apps/nexus-backend/src/runner/`)
- **Scheduler** (`scheduler.ts`) — calcula o ready-set (deps `done`, não bloqueada) e escolhe
  o lote. Puro/determinístico. → task T-1020.
- **Gate de verificação** (`verify-gate.ts`) — roda os comandos de "Verificação automática"
  no worktree e devolve `{ ok, output }`. → task T-1021.
- **Agent adapter** (`agent-adapter.ts`) — interface `AgentAdapter` + `CommandAdapter`
  genérico (template de comando por papel, vindo de config/env). A recipe específica do
  OpenCode/Claude é **config**, validada pela spike T-1017. → task T-1022.
- **Runner core** (`runner.ts`) — o loop serial supervisionado que costura os três acima
  com o `TaskService`. → task T-1023.

### O loop por task (dirigido pelo runner)
```
pick(task)  # ready-set
  └─ spawn WORKER (cwd=worktree, NEXUS_ROOT_DIR=central) → ledger deve virar 'review'
  └─ GATE (runner roda build+test no worktree)
        ├─ vermelho → request_changes automático (anexa saída) → rework++ → volta ao worker
        └─ verde → spawn REVIEWER (julga mérito/cobertura/escopo)
              ├─ request_changes → rework++ → volta ao worker (lê Parecer da task)
              └─ approve → (gate final) → done → destrava dependentes
  rework > N(=2) → ESCALA
```

### Escalada ao humano (únicos pontos de intervenção)
1. `rework` > N (default 2). 2. Agente chamou `pause`/`blocked`. 3. Gate ↔ veredito divergem.
4. Conflito de merge (`done→blocked`, T-1019). 5. Subprocesso travou/timeout ou não moveu o
estado esperado. 6. Task `opus-spike` na fila (política: modelo forte/humano).

### Paralelismo e merges (fases posteriores)
- Pool de K slots, cada um um worktree; ready-set prefere tasks de **escopo de arquivo
  disjunto** (declarado na seção 3 das specs).
- **Merges serializados** na trunk; conflito → `blocked` + escala; pós-merge, worktrees de
  dependentes são recriados a partir da trunk atualizada.

### Observabilidade e segurança
- Torre = Board (T-1013, lê o ledger central ao vivo) + `wave.log` append-only.
- Caps: `--max-concurrency`, `--max-rework`, `--dry-run`, kill-switch.
- Gates de I/O externo: `NEXUS_WORKTREE_ENABLED`, `NEXUS_PUSH_ENABLED`. Segredos só via env.

## Plano faseado
| Fase | Entrega | Depende de |
|---|---|---|
| 0 — Spike | Recipe de invocação OpenCode + 1 task ponta-a-ponta | **T-1017** |
| 1 — Loop serial supervisionado | scheduler + gate + adapter + runner-core | T-1020..T-1023 |
| 2 — Merge + autopilot | merge no approve, autopilot, kill-switch | T-1019 + Fase 1 |
| 3 — Paralelo | pool K>1, ready-set por escopo, rebase pós-merge | Fase 2 |
| 4 — Roteamento multi-modelo | adapters Claude+OpenCode por Capacidade-alvo | Fase 1 |

## Questões abertas (deferidas à PoC da T-1017)
1. OpenCode tem modo headless/scriptável? Como invocar? 2. Como setar o modelo por execução?
3. Provedores (DeepSeek/Gemini) disponíveis/contratados? 4. Roda com `cwd` num worktree dado?
5. Como o agente reporta de volta (exit code? chama o ledger via API/CLI?)?
6. Recomendação final: seguir/ajustar/bloquear.

## Consequências
- (+) Remove ~80% do atrito humano já na Fase 1 (sem prompts, sem validar QA à mão).
- (+) Qualidade garantida por gate determinístico, não por confiança no agente.
- (−) Acopla o projeto a um runtime de agente externo (mitigado: `CommandAdapter` genérico).
- (−) Integração paralela traz o problema clássico de merge (mitigado: serialização + escala).
