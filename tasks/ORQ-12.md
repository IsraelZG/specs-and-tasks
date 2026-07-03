---
id: ORQ-12
title: "SPIKE: Otimização de contexto no AgentAdapter — Headroom CCR in-process + nano-preprocess (ADR + números reais)"
status: in_progress
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-08"] # usa o PoC/ADR-0008 como bancada de medição (adapter in-process já provado)
blocks: [] # se o veredito for GO, gera task(s) de integração no adapter (ORQ-09b+) — criadas pelo arquiteto
capacity_target: opus-spike
---

# ORQ-12 · SPIKE: Otimização de contexto no AgentAdapter (Headroom CCR + nano-preprocess)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Tarefa de TOOLING do CONTROLE (Docs)** — trabalhe em
  `tools/orchestrator/`, persista via `node tools/scripts/fila.mjs add ORQ-12 "<msg>" <paths>`.
  Identidade = modelo real.
- **Capacidade opus-spike:** há decisões em aberto (API real do SDK, forma de integração,
  go/no-go por medição). Entregável = **ADR + números medidos**, não código de produção.
- **⚠️ Roda agente pago de verdade** para gerar tool-outputs reais. Use `deepseek/deepseek-v4-flash`
  (nível haiku do roster) e tasks triviais — o custo do spike é o custo da medição.

## 1. Objetivo
Medir, **nos nossos próprios runs** do adapter in-process (PoC da ORQ-08), se dois padrões de
otimização de contexto pagam o próprio custo — e fixar em ADR o COMO integrá-los (ou o porquê de
descartá-los, com número):

1. **Headroom CCR (Compress-Cache-Retrieve) in-process** — SDK `headroom-ai`:
   `compress(messages, {model})` → `{messages, tokensSaved, compressionRatio}`; conteúdo comprimido
   vive num store local e o modelo recebe a tool `headroom_retrieve` para re-hidratar o original
   sob demanda. Hipótese: comprimir **outputs de tool** (readFile/bash/grep) rende muito mais que
   os ~10% do proxy antigo ([[project_headroom_integration]]), porque é exatamente o que enche a
   janela de um agente de código.
2. **Nano-preprocess multi-modelo** — um modelo barato do roster (`deepseek-v4-flash`) filtra/resume
   outputs grandes de tool ANTES de entrarem no contexto do modelo caro. Hipótese: custo do nano
   << tokens poupados no modelo principal.

Contexto conceitual e os 6 padrões completos: `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md`.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0008-agent-adapter-in-process.md` — a bancada: loop, tools, provider direto, eventos.
- [ ] `tools/orchestrator/{agent-adapter.poc.mjs, tools.poc.mjs}` — o PoC onde a medição acopla.
- [ ] `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` — os padrões (§2 CCR, §3 nano).
- [ ] https://headroom-docs.vercel.app/docs — SDK `headroom-ai` (TS): `compress()`, CCR store,
      tool `headroom_retrieve`, integração Vercel AI SDK. **Não chute a API — cite versão real no ADR.**
- [ ] MCP `headroom` já disponível no ambiente Claude Code (tools `headroom_compress`/
      `headroom_retrieve`/`headroom_stats`) — serve como instrumento de calibração manual antes de
      integrar o SDK no loop.
- [ ] [[project_headroom_integration]] · [[project_orchestration_vercel_adapter]] — por que o
      padrão proxy-por-provedor morreu e o que o substitui.

## 3. Escopo de Arquivos (Inputs e Outputs) — entregáveis do SPIKE
- **[CREATE]** `docs/adr/0009-otimizacao-de-contexto-agent-adapter.md` — o ADR (decisões A–E da §6).
- **[CREATE]** `tools/orchestrator/context-bench.poc.mjs` — bancada de medição: roda N tool-outputs
  reais (readFile de arquivo grande do repo, bash `ls -R`/`grep` largo) por 3 vias — cru ·
  `compress()` do headroom-ai · nano-preprocess — e imprime tabela tokens/latência/custo.
- **[UPDATE]** `tools/orchestrator/package.json` — dep `headroom-ai` (versão pinada).
- **[NÃO TOCAR]** `tools/orchestrator/src/` (produção ORQ-09a/b) — o spike mede no PoC, não integra.

## 4. Estratégia de Testes Estrita
- [x] **Gate por CLI:** saída literal do `context-bench.poc.mjs` colada na §8 — tabela com tokens
      antes/depois, ratio, latência e custo estimado por via, sobre ≥3 outputs reais distintos.
- [x] **Retrieve funcional:** ≥1 caso onde o modelo chama `headroom_retrieve` e recupera o original
      (prova de reversibilidade — sem isso CCR é compressão com perda e o veredito é NO-GO).
- [x] **Fora de escopo:** integrar no adapter de produção (task futura se GO); tocar `orquestrar.mjs`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:** NÃO integre em produção. NÃO ressuscite proxies standing por provedor.
> NÃO invente API do headroom-ai — instale e cite versão. NÃO rode git no Docs (enfileire).
1. Instale `headroom-ai` no pacote do orchestrator; confirme a API real (`compress`, store CCR,
   integração AI SDK — middleware `wrapLanguageModel`? wrapper de tool?). Registre no ADR.
2. Construa `context-bench.poc.mjs`: capture ≥3 tool-outputs reais e grandes (ex.: readFile de um
   caderno de 30KB, `grep` largo no repo, `ls -R` de node_modules) e meça as 3 vias.
3. Rode 1 task trivial end-to-end com CCR ligado (compress + `headroom_retrieve` registrado ao lado
   das tools do PoC) — prova de convivência com o gating da Decisão B do ADR-0008.
4. Escreva o ADR-0009 resolvendo as decisões A–E da §6, com os números da bancada.
5. Gate (§4) → §8 → enfileira via `fila.mjs`.

## 6. Feedback de Especificação — DECISÕES A RESOLVER NO ADR (o entregável)
**Decisão A — API real do headroom-ai.** Assinatura de `compress()`, forma da integração com AI SDK
(middleware vs wrapper), onde o CCR store persiste (memória? disco? path?), versão pinada.
**Decisão B — Ponto de acoplamento no adapter.** Comprimir onde: (i) middleware no model, (ii) wrapper
nos `execute()` das tools, (iii) pós-processamento do histórico entre steps. Qual convive com o
protocolo de eventos (Decisão D do ADR-0008) sem cegar o painel.
**Decisão C — Números.** Ratio medido nos NOSSOS outputs por tipo (código TS, markdown, saída de
build, listagem). Threshold de GO: economia líquida ≥30% de tokens no modelo principal sem perda de
correção na task (o modelo re-hidrata o que precisa).
**Decisão D — Nano-preprocess.** Quando vale: acima de que tamanho de output disparar o nano; custo
medido do nano vs economia; latência adicionada por step. Pode combinar com CCR (nano decide O QUE
comprimir)?
**Decisão E — Go/No-Go e forma da task de integração.** Se GO: spec da mudança no `VercelAgentAdapter`
(ORQ-09b) para o arquiteto criar a task. Se NO-GO: número que justifica, e o que reavaliar depois.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] ADR-0009 existe, decisões A–E resolvidas com API/números reais (não vagos)?
- [ ] Bancada rodou sobre ≥3 outputs reais; tabela literal colada na §8?
- [ ] Reversibilidade provada (`headroom_retrieve` recuperou original em run real)?
- [ ] Veredito GO/NO-GO explícito com threshold da Decisão C aplicado?
- [ ] Nada de produção tocado (`src/`, `orquestrar.mjs` intactos)?

### Verificação automática *(colar saída na §8)*
```bash
cd tools/orchestrator
node --env-file=../../.env context-bench.poc.mjs
```
> **GATE:** sem a tabela literal de medição + o caso de retrieve colados na §8, `finish` não vale.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real da bancada)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-03T18:27]** - *claude-fable* - `[Promovida p/ ready]`: spike destravado (triaged, opus-spike) — flip draft->ready
- **[2026-07-03T18:27]** - *claude-fable* - `[Iniciado]`: iniciando spike: medir CCR (headroom-ai) + nano-preprocess no adapter in-process. Achado inicial via MCP headroom: router protege codigo recente (0% economia) — CCR mira listagens/logs/prosa, nao codigo ativo.
