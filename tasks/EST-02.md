---
id: EST-02
title: "Host de plugins do Estaleiro: manifest mínimo + mediação total de portas (fs/rede/store/eventos)"
status: done
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-01"]
blocks: []
capacity_target: sonnet # host mediado com 4 portas — decomposta em EST-02a/b/c
children: ["EST-02a", "EST-02b", "EST-02c"]
subtasks: ["EST-02a", "EST-02b", "EST-02c"] # mirror de children: — habilita parentAutoClose (T-1029) quando o fix do service ler este campo (atualmente lê só subtasks:, auto-close é no-op para EST-02)
---

# EST-02 · Host de plugins (manifest + mediação total)

## 0. Ambiente de Execução Obrigatório
- **Task-casca decomposta.** Esta task não executa diretamente — seu escopo foi fatiado em:
  - **EST-02a** — Plugin Manifest Contract (schema Zod)
  - **EST-02b** — Host mediation: portas FS/Bash
  - **EST-02c** — Host mediation: portas Network/Store/Eventos

  Cada filha segue o fluxo MGTIA independente. Esta casca fecha quando as 3 filhas estiverem `done`.

**Runtime:** Node.js 22+. `apps/estaleiro/core/`.

## 1. Objetivo
Implementar o `core` do Estaleiro: o host que **medeia TODAS as portas** para os plugins
(fs, rede, store TinyBase, eventos) — nenhum plugin acessa recurso direto, nenhum plugin importa
outro plugin diretamente (RFC-018 §2 decisões A2/A3). Contrato de plugin = **manifest mínimo com
os MESMOS nomes de campo do caderno 12** (A1) — não o contrato completo de plugin do superapp,
um subconjunto que estende sem reescrever.

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (A1, A2, A3) e §3 (diagrama, "core" do Estaleiro) — FONTE das 3 decisões.
- [x] `docs/caderno-3-sdk/12-plugins-e-computacao.md` — nomes de campo do contrato de plugin do superapp (A1 deriva daqui, não inventa paralelo).
- [x] `tools/orchestrator/tools.poc.mjs` (ORQ-09a) — o padrão de gating de bash/fs já provado, a ser mediado pelo host em vez de embutido na tool.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/core/src/host.*` — registro de plugin, roteamento de chamadas mediadas.
- **[CREATE]** `apps/estaleiro/core/src/manifest.*` — schema Zod do manifest mínimo (A1).
- **[CREATE]** `apps/estaleiro/core/src/ports/{fs,network,store,events}.*` — as 4 portas mediadas.

## 4. Estratégia de Testes
- [x] Plugin de teste registra via manifest; host medeia 1 chamada de cada porta; plugin SEM
  passar pelo host não consegue acessar fs/rede/store/eventos diretamente (teste de isolamento).

## 5. Instruções de Execução
1. Endurecer JIT contra os arquivos reais de EST-01.
2. Manifest schema → host → 1 porta por vez (fs primeiro, reusando o gating do ORQ-09a).
3. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 A1/A2/A3, não reabrir. Se algo ficou ambíguo, PARE e volte ao RFC.
- Decompor via `/endurecer-task` antes de `ready` (complexidade 5).

## 7. Definition of Done (DoD)
- [ ] Manifest mínimo com nomes do caderno 12 implementado?
- [ ] Host medeia as 4 portas (fs/rede/store/eventos)?
- [ ] Plugin não acessa recurso sem passar pelo host (teste de isolamento verde)?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/estaleiro-core test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — host plugins, capacity_target=sonnet, complexidade 5 requer decomposicao, decisoes A1/A2/A3 fechadas no RFC
- **[2026-07-06T12:25]** - *deepseek* - `[Decomposto]`: decomposta em EST-02a (manifest) + EST-02b (fs/bash) + EST-02c (network/store/eventos)
- **[2026-07-06T19:54]** - *system* - `[Auto-encerrado retroativo]`: M-016: todas as 3 filhas done — backfill one-shot
