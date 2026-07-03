---
id: ORQ-10
title: "Observabilidade + controle: stream de eventos ao vivo no painel + cancelar/matar instancia + deteccao de travada"
status: ready
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-09"] # consome o onEvent/cancel do adapter — ORQ-09 é casca decomposed em ORQ-09a/09b; fecha sozinha via parentAutoClose (T-1029) quando as duas filhas chegam a done
blocks: ["ORQ-11"]
capacity_target: sonnet
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
- **[UPDATE]** [headroom-proxies.mjs](file:///C:/Dev2026/Docs/scripts/headroom-proxies.mjs)
  - Estender o servidor HTTP para gerenciar o estado em memória dos eventos das instâncias ativas.
  - Implementar rota `POST /api/instances/events` para ingestão de eventos enviados pelo `agentAdapter` (`{ taskId, type, ts, ...payload }`).
  - Implementar rota `GET /api/instances/events` com suporte a SSE (Server-Sent Events) para alimentar o painel remoto.
  - Implementar rota `POST /api/instances/cancel` que recebe `{ taskId }` e cria o arquivo de cancelamento `tasks/.orchestrator/<taskId>.cancel`.
  - Estender a variável `DASHBOARD_HTML` adicionando a renderização do console de passos em tempo real, botão "Matar" que chama a API de cancelamento e o indicador de inatividade (travado).
- **[UPDATE]** [agentAdapter.mjs](file:///C:/Dev2026/Docs/tools/orchestrator/src/agentAdapter.mjs)
  - Injetar no fluxo `run()` a escuta periódica (ex: `setInterval` de 1s ou watcher) do arquivo `tasks/.orchestrator/<taskId>.cancel`. Se presente, executa `ac.abort()` e deleta o arquivo.
  - Configurar um fallback padrão no callback `onEvent` de `run()` para enviar os eventos por POST à rota `/api/instances/events` do painel se nenhum handler customizado for fornecido.
- **[CREATE]** [monitor.mjs](file:///C:/Dev2026/Docs/tools/orchestrator/src/monitor.mjs)
  - Implementar a detecção em background de instâncias sem sinal de vida (travadas) há mais de 300 segundos, acionando a gravação do arquivo `.cancel`.
- **[CREATE]** [monitor.test.mjs](file:///C:/Dev2026/Docs/tools/orchestrator/tests/monitor.test.mjs)
  - Cobertura de testes unitários determinísticos sobre a detecção de inatividade de instâncias fakes e gravação de flags de cancelamento.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Node.js native test runner (`node --test`)
- [x] **Cenários de Teste:**
  1. Teste de SSE no Painel: Valida o disparo e buffering de eventos via `POST /api/instances/events` e recepção via SSE.
  2. Teste de Interrupção via arquivo: Valida que a criação de `<id>.cancel` aborta o loop do `agentAdapter` e retorna o shape correto `{ exit: null, timedOut: true }`.
  3. Teste do Monitor de Travadas: Simula o decurso do timeout em mock e garante a criação da flag de cancelamento.
- [x] **Ambiente do Teste:** Node.js (sem browser)
- [x] **Fora de Escopo:** O fluxo de agendamento de recursos do orquestrador (ORQ-11).

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
node --env-file=../../.env --test tools/orchestrator/tests/monitor.test.mjs
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

- **[2026-07-03 19:46:24]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T19:33]** - *Gemini 3.1 Pro* - `[Triado]`: Triagem pré-endurecimento
- **[2026-07-03T19:33]** - *Gemini 3.1 Pro* - `[Endurecido]`: Endurecido JIT com base no ADR-0008
- **[2026-07-03T19:47]** - *Gemini 3.1 Pro* - `[Triado]`: Re-triagem pós-correção do frontmatter
- **[2026-07-03T19:48]** - *Gemini 3.1 Pro* - `[Endurecido]`: Re-endurecido com base no ADR-0008
- **[2026-07-03T20:07]** - *system* - `[Promovida p/ ready]`: Promovida pelo arquiteto (arquiteto-promover)
