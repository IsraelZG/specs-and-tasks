---
id: ORQ-11
title: "Religar orquestrar.mjs no VercelAgentAdapter: remove kill-switch + spawn Crush, seleciona adapter in-process"
status: draft:triaged
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-09", "ORQ-10"] # só religa quando o adapter e a observabilidade existem (não voltar a voar cego) — ORQ-09 fecha sozinha via parentAutoClose (T-1029) quando ORQ-09a/09b terminam
blocks: []
capacity_target: # preenchido no endurecimento
---

# ORQ-11 · Religar o dispatcher no adapter in-process

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Tarefa de TOOLING do CONTROLE (Docs)**, persiste via `fila.mjs`.
- **⚠️ Muda o dispatcher VIVO e remove um kill-switch de segurança.** É a última da linha ORQ de
  propósito: só religa quando o adapter (ORQ-09) e a observabilidade/kill (ORQ-10) existem — pra
  nunca mais voltar ao estado "headless e cego" que motivou tudo isso.

## 1. Objetivo
Trocar, no [`orquestrar.mjs`](../tools/scripts/orquestrar.mjs), o `spawnAgent` baseado em Crush pelo
`VercelAgentAdapter` in-process (ORQ-09), e **remover o kill-switch** `EMERGENCY_DISABLE_SPAWN`
(linha ~279) + o `spawn('crush', …)` (linhas ~281–316). O núcleo de decisão (`planDispatch`,
`selectModel`, registry, lock, `--on-finish`) **não muda** — só o mecanismo de execução. Ao fim, o
dispatcher despacha agentes in-process, observáveis (ORQ-10), sem janela e com routing multi-provider
direto. Também reabilita `max_concurrent` em `orquestrador.config.json` (hoje `0`).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] [`tools/scripts/orquestrar.mjs`](../tools/scripts/orquestrar.mjs) — alvo. `spawnAgent`
      (~281–316) e `EMERGENCY_DISABLE_SPAWN` (~279) saem; `dispatchOnce`/registry/lock/`--on-finish`
      ficam. O pidfile do registry passa a rastrear um handle de run in-process, não um `pid` de SO
      (ajustar `pruneRegistry` — não há mais `process.kill(pid,0)` de subprocesso).
- [ ] **ORQ-09** — o `VercelAgentAdapter` a instanciar no lugar do `spawn`.
- [ ] **ORQ-10** — o stream/kill; o `run()` in-process precisa registrar a instância pra ela aparecer
      lá e ser cancelável.
- [ ] [ORQ-04](./ORQ-04.md) — o `spawnAgent` original (o que está sendo substituído) e o `assemblePrompt`
      (que continua sendo usado pra montar o prompt).
- [ ] `docs/adr/0008-*.md` (ORQ-08) — critério de término/timeout (Decisão E) que o loop respeita.

## 3. Escopo de Arquivos (Inputs e Outputs)
> **A endurecer JIT (pós-ORQ-09/10).** Esboço:
- **[UPDATE]** `tools/scripts/orquestrar.mjs` — remove kill-switch + spawn Crush; `spawnAgent` passa a
  chamar `VercelAgentAdapter.run(...)` (in-process, registra a instância pro ORQ-10, hook `--on-finish`
  no término). Ajusta `pruneRegistry` pro novo modelo de "instância viva" (não-pid-de-SO).
- **[UPDATE]** `tasks/orquestrador.config.json` — `max_concurrent` > 0 (reabilita o despacho).
- **[UPDATE]** doc curta: como o `--on-finish` continua fechando o pipeline com o adapter novo.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] `--once`/`--on-finish` continuam funcionando com o adapter in-process (adapter fake nos testes):
      respeitam `max_concurrent`, lock serializa, `--on-finish` libera slot e re-despacha.
- [ ] `pruneRegistry` limpa instâncias mortas no novo modelo (run encerrado/cancelado).
- [ ] **Smoke controlado:** `max_concurrent:1` + 1 task trivial real → despacha 1 agente in-process,
      sem janela, visível no painel (ORQ-10), termina e libera o slot.
- [ ] **Fora de escopo:** o adapter (ORQ-09) e o painel (ORQ-10) em si.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:** NÃO religue com `max_concurrent` alto de primeira — comece em 1. NÃO remova o
> lock/registry/`--on-finish` (só o spawn Crush). NÃO deixe o dispatcher despachar sem o painel de
> ORQ-10 no ar (senão volta a voar cego). NÃO rode git no Docs.
1. Endurecer JIT contra o adapter/painel reais.
2. Trocar `spawnAgent` → `VercelAgentAdapter.run`; remover kill-switch; ajustar `pruneRegistry`.
3. Smoke `max_concurrent:1`. Só então subir o teto. Gate → §8 → enfileira.

## 6. Feedback de Especificação (Spec Feedback Loop)
- Depende das interfaces de ORQ-09/10. Se elas mudarem no endurecimento delas, reendurecer esta.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `spawn('crush')` e `EMERGENCY_DISABLE_SPAWN` removidos; `spawnAgent` chama o adapter in-process?
- [ ] `--once`/`--on-finish`/lock/registry preservados e verdes com o adapter novo?
- [ ] Smoke `max_concurrent:1` despacha 1 agente in-process sem janela, visível/cancelável no painel?
- [ ] `max_concurrent` reabilitado no config (começando baixo)?

### Verificação automática *(a fixar no endurecimento)*
```bash
node tools/scripts/orquestrar.mjs --once --ledger-file <fixture>   # despacha in-process, sem janela
# + smoke com 1 task real e max_concurrent:1
```
> **GATE DE EVIDÊNCIA:** saída literal colada na §8.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T19:48]** - *Gemini 3.1 Pro* - `[Triado]`: Triagem da task dependente na fila ORQ
