---
id: ORQ-04
title: "orquestrar.mjs spawn real — registry + lock + prompt assembly + --on-finish + circuit breaker"
status: draft
complexity: 6
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-02"] # reusa as funções de decisão
blocks: ["ORQ-05", "ORQ-06"] # hook nas skills e dashboard dependem do spawn/registry
spec_status: hardened
capacity_target: sonnet
hardened_at: "2026-06-30"
hardened_by: claude-opus
---

# ORQ-04 · orquestrar.mjs spawn real — registry, lock, prompt, --on-finish

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Crush** no PATH (`crush run -m … --yolo`). Sem deps npm.
- **Tarefa de TOOLING do CONTROLE (Docs).** Implemente direto no Docs. Persista via
  `node tools/scripts/fila.mjs add ORQ-04 "<msg>" tools/scripts/orquestrar.mjs .gitignore`. Identidade = modelo real.
- **⚠️ Esta task SPAWNA agentes pagos (via Headroom).** Teste com `max_concurrent:1` e UM modelo barato
  no roster. **Passo 1 obrigatório:** o smoke da premissa (abaixo) antes de construir o resto.
- **Gate adaptado:** evidência = saída literal dos comandos da §7.

## 1. Objetivo
Transformar o núcleo de decisão da ORQ-02 em **dispatcher real**: monta o prompt da skill, **spawna
`crush run` detached** com o modelo escolhido, registra a instância num **registry** (p/ contar
concorrência), serializa o despacho com um **lock single-flight**, e expõe `--on-finish <id>` (o hook
que cada agente chama ao terminar, propagando o pipeline). Inclui **circuit breaker** contra loop
review↔rework.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] [ORQ-02](./ORQ-02.md) — importa `selectModel`, `planDispatch`, `loadConfig`, `fetchLedger`.
      Esta task implementa os modos `--once`/`--on-finish` que lá eram stub.
- [ ] **Crush headless (verificado):** `crush run -m <provider/model> --yolo --cwd <dir> --data-dir <dir> "<prompt>"`.
      `-m` aceita `provider/model`; `--yolo` auto-aceita permissões; `--data-dir` isola a sessão (`.crush/crush.db`).
- [ ] `.claude/skills/<skill>/SKILL.md` — Crush NÃO carrega essas skills; o prompt é **montado** (lê o
      SKILL.md, substitui `$ARGUMENTS`, injeta a identidade-modelo).
- [ ] CLAUDE.md §"Identidade do agente" — injete `<EU>`/`<SeuNome>` = o modelo escolhido (p/ reviewer,
      `agile_reviewer:<modelo>`).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `tools/scripts/orquestrar.mjs` — implementa:
  - `REGISTRY_DIR = tasks/.orchestrator/`; `LOCK = tasks/.orchestrator/.lock`.
  - `pruneRegistry()` — lê `*.json`, testa liveness do `pid` (`process.kill(pid,0)` em try/catch; no
    Windows isso funciona p/ checar existência), remove pidfiles mortos. Retorna a lista viva.
  - `runningCount()` = `pruneRegistry().length`.
  - `withLock(fn)` — `fs.mkdirSync(LOCK)` atômico; se já existe e idade < 120s → sai ("dispatch em
    andamento"); senão quebra o lock velho. `finally` remove o LOCK.
  - `assemblePrompt(action, id, model)` — lê `.claude/skills/<action_skill[action]>/SKILL.md`,
    substitui `$ARGUMENTS`→`id`, prefixa preâmbulo de identidade (ver §5).
  - `spawnAgent({id,action,role,model,cwd})` — `child_process.spawn('crush',[...], {detached:true,
    stdio:'ignore'}).unref()`; grava `REGISTRY_DIR/<id>.json` = `{pid,model,role,started,cwd}`.
  - `dispatchOnce()` — `withLock(() => { prune; plan = planDispatch(fetchLedger(), config, balances,
    runningCount()); for cada item: spawnAgent })`.
  - `--once` → `dispatchOnce()`. `--on-finish <id>` → remove `REGISTRY_DIR/<id>.json` (libera o slot) →
    `dispatchOnce()`.
  - Circuit breaker já está em `planDispatch` (ORQ-02); confirme que é respeitado.
- **[UPDATE]** `.gitignore` — adiciona `tasks/.orchestrator/`.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Self-check por CLI** (§7), com `max_concurrent:1` e roster de 1 modelo barato.
  (a) **smoke** isolado passa; (b) `--once` com 1 idle cria 1 pidfile e 1 processo crush;
  (c) `--once` de novo (slot cheio) NÃO spawna; (d) matar o processo + `--once` → `pruneRegistry`
  remove o pidfile órfão; (e) lock impede 2 dispatch concorrentes; (f) `--on-finish <id>` remove o
  pidfile daquele id e re-despacha.
- [x] **Fora de escopo:** propagar o hook às skills (ORQ-05); dashboard (ORQ-06).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - NÃO spawne sem `--yolo` (trava esperando permissão). NÃO compartilhe `--data-dir` entre instâncias
>   (corrompe `crush.db`). NÃO deixe o pidfile sem prune (vaza slot). NÃO rode git no Docs — enfileire.
> - NÃO remova o lock no meio de um spawn (só no `finally`).

**Passo 1 — SMOKE (premissa; faça ANTES de construir):**
```bash
crush run -m deepinfra/deepseek-v4-flash --yolo --cwd "$(mktemp -d)" "Responda apenas: OK"
```
Se NÃO retornar limpo (auth Headroom, --yolo), é **BLOCKER de ambiente** → `pause`/`block` com a saída;
não invente workaround.

**Preâmbulo de identidade injetado no prompt:**
```
Você é um agente rodando o modelo "<model>". Em TODO comando manage-task.mjs/fila.mjs use
"<model>" como sua identidade (<EU>/<SeuNome>) — para review use "agile_reviewer:<model>".
Execute a tarefa abaixo seguindo estas instruções à risca:
--- (conteúdo do SKILL.md com $ARGUMENTS substituído) ---
```

**Pidfile `tasks/.orchestrator/<id>.json`:** `{ "pid":12345, "model":"deepinfra/deepseek-v4-flash",
"role":"work", "started":"2026-06-30T15:00", "cwd":"C:\\Dev2026\\superapp" }`.

1. Smoke (passo 1). 2. Registry + prune + lock. 3. `assemblePrompt` + `spawnAgent` (detached, data-dir
por instância em `tasks/.orchestrator/data/<id>/`). 4. `--once`/`--on-finish`. 5. Gate (§7) → §8 → enfileira.

## 6. Feedback de Especificação (Spec Feedback Loop)
Sem decisões em aberto. Flags do Crush, registry, lock e prompt assembly fixados. Se o smoke do passo 1
falhar, vira BLOCKER (a premissa headless é pré-condição de toda a ferramenta).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Smoke do passo 1 passou (saída colada). [ ] `--once` respeita `max_concurrent`. [ ] prune limpa
  órfão. [ ] lock serializa. [ ] `--on-finish` libera slot + re-despacha. [ ] `tasks/.orchestrator/` gitignored.

### Verificação automática *(colar saída na §8 — use max_concurrent:1)*
```bash
crush run -m <modelo-barato> --yolo --cwd "$(mktemp -d)" "Responda: OK"   # smoke
node tools/scripts/orquestrar.mjs --once   # deve criar 1 pidfile
ls tasks/.orchestrator/*.json | wc -l
node tools/scripts/orquestrar.mjs --once   # slot cheio → 0 novos
git check-ignore tasks/.orchestrator/x.json && echo "gitignored ok"
```
> **GATE:** sem a saída literal (inclusive do smoke) na §8, `finish` não vale.

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
