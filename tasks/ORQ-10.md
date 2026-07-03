---
id: ORQ-10
title: "Observabilidade + controle: stream de eventos ao vivo no painel + cancelar/matar instancia + deteccao de travada"
status: draft:placeholder
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-09"] # consome o onEvent/cancel do adapter — ORQ-09 é casca decomposed em ORQ-09a/09b; fecha sozinha via parentAutoClose (T-1029) quando as duas filhas chegam a done
blocks: ["ORQ-11"]
capacity_target: # preenchido no endurecimento pós-ORQ-08
---

# ORQ-10 · Observabilidade + controle (o "remote-control")

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Tarefa de TOOLING do CONTROLE (Docs)**, persiste via `fila.mjs`.
- **⚠️ Depende de ORQ-09.** O formato do evento (`onEvent`) e o mecanismo de cancelamento vêm da
  Decisão D/E do ADR 0008 (ORQ-08), implementados no adapter em ORQ-09. Endurecer JIT.

## 1. Objetivo
Entregar o que motivou trocar o Crush: **ver e controlar cada instância**. O adapter in-process
(ORQ-09) já emite eventos por passo e é cancelável; esta task **consome** isso para:
1. **Stream ao vivo no painel :8780** (ORQ-06) — cada tool call de cada agente aparece em tempo real.
2. **Cancelar/matar** uma instância pelo painel (o `AbortController` da Decisão E).
3. **Detecção de travada** — sem evento há N segundos → marca a instância como suspeita (o problema
   que deixou "1 task em 2h" invisível). Opcional: auto-abort no timeout global.
É o oposto do Crush headless: nada de janela, tudo observável e interrompível de um lugar só.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] **`docs/adr/0008-*.md` (ORQ-08)** — Decisão D (protocolo de evento) e E (cancelamento): fonte canônica.
- [ ] **ORQ-09** — o `VercelAgentAdapter` que expõe `onEvent` e o cancel; esta task pluga neles.
- [ ] [ORQ-06](./ORQ-06.md) — o painel :8780 (ledger + instâncias + saldos). Aqui ganha a aba/stream
      de eventos ao vivo e o botão matar. Reusa a API JSON existente do painel.
- [ ] [ORQ-07](./ORQ-07.md) / `docs/adr/0007-painel-remoto-modelo-b.md` — se o acesso remoto (modelo B)
      já estiver de pé, o stream deve fluir por ele também (o relay já existe como PoC).
- [ ] `tasks/.orchestrator/` — o registry de instâncias vivas que o painel já lê.

## 3. Escopo de Arquivos (Inputs e Outputs)
> **A endurecer JIT (pós-ORQ-08/09).** Esboço:
- **[UPDATE]** painel :8780 (ORQ-06) — endpoint/stream (SSE ou WebSocket) que emite os eventos do adapter.
- **[UPDATE]** o `run()`/registry — persistir último-evento-ts por instância; expor `cancel(id)`.
- **[CREATE]** UI mínima no painel: lista de instâncias com passo atual + botão matar + flag "travada".
- **[CREATE]** detecção de travada (sem evento há N s) + timeout global (Decisão E).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] Com adapter fake emitindo eventos: painel recebe o stream e renderiza o passo atual.
- [ ] `cancel(id)` aborta o run (o fake reage ao AbortSignal) e libera o slot no registry.
- [ ] Detecção de travada: sem evento por > N s → instância marcada suspeita.
- [ ] **Fora de escopo:** o adapter em si (ORQ-09); religar o dispatcher (ORQ-11).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:** NÃO reimplemente o adapter (só consuma `onEvent`/`cancel`). NÃO abra porta de
> entrada nova na máquina (reusar o :8780 / relay existente). NÃO rode git no Docs.
1. Endurecer JIT do formato de evento/cancel (do ADR 0008).
2. Stream no painel → cancelar → detecção de travada. Gate → §8 → enfileira.

## 6. Feedback de Especificação (Spec Feedback Loop)
- Formato de evento e cancelamento estão no ADR 0008. Se ambíguo, volte ao spike.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Stream ao vivo dos passos de cada instância visível no painel :8780?
- [ ] Botão matar/cancelar aborta o run e libera o slot?
- [ ] Detecção de travada (sem evento há N s) sinaliza a instância?
- [ ] Sem janela de terminal, sem porta de entrada nova?

### Verificação automática *(a fixar no endurecimento)*
```bash
# ex.: teste do stream + cancel com adapter fake; smoke do painel mostrando 1 instância viva
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
