---
id: ORQ-13
title: "Otimizador de contexto in-process no VercelAgentAdapter (crusher estrutural + CCR store + nano tier)"
status: draft:triaged
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-09", "ORQ-12"] # 09 entrega o harness de tools onde isto pluga; 12 (ADR-0009) fixa o veredito
blocks: []
capacity_target: sonnet
---

# ORQ-13 · Otimizador de contexto in-process no VercelAgentAdapter

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. Pacote `tools/orchestrator/` (dep-isolado). Persistir via `fila.mjs`.
  Identidade = modelo real. NÃO rodar git no Docs.
- **⚠️ Depende de ORQ-09 (harness de tools) estar `done`.** Endurecer/executar antes seria plugar
  num `execute()` que ainda não existe. Por isso `draft:triaged` — reendurecer JIT quando ORQ-09 fechar.

## 1. Objetivo
Implementar o veredito **GO** do ADR-0009 (spike ORQ-12): um otimizador de contexto **próprio,
in-process, sem serviço standing**, que encolhe os outputs de tool antes de entrarem no contexto do
agente. Substitui o proxy Headroom (:8787, NO-GO no ADR-0009) reaproveitando o **mecanismo** da fonte
aberta (SmartCrusher/CCR), não a ferramenta. Três camadas, na ordem de custo:
1. **CCR store local** — grava o original por hash, devolve resumo/marcador; tool `retrieve(hash)`
   re-hidrata sob demanda. Reversível (provado na bancada ORQ-12, `idêntico=true`).
2. **Crusher estrutural** — para JSON/arrays/listagens: colapsa itens de mesma forma preservando
   exemplos + contagem (inspirado em `headroom/transforms/smart_crusher.py`, determinístico, 0 dep).
   Protege código (roteia por tool: readFile de `.ts/.js/.rs` → não cruša).
3. **Nano-preprocess** — acima de ~2000 tokens de output, resume via `deepseek-v4-flash` (lossy →
   sempre com o original no CCR store). Medido no ORQ-12: 81–99% a ~US$0.0004.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] **`docs/adr/0009-otimizacao-de-contexto-agent-adapter.md`** — FONTE CANÔNICA: veredito, ordem
      das camadas, threshold (>2k tok), forma da integração (envolver `execute()` das tools).
- [ ] `tools/orchestrator/context-bench.poc.mjs` (ORQ-12) — o CCR store (`makeCCRStore`), o
      `nativeCrush` e o `nanoPreprocess` JÁ PROVADOS: porte/endureça a partir daqui, não reinvente.
- [ ] `tools/orchestrator/src/*` (ORQ-09b) — o `VercelAgentAdapter` e o harness onde os `execute()`
      das tools readFile/bash/grep serão envolvidos. Assinaturas reais saem daqui (reendurecer JIT).
- [ ] `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §3 (CCR) e §4 (nano).
- [ ] Fonte aberta p/ inspiração (NÃO portar fiel): `github.com/chopratejas/headroom` —
      `headroom/transforms/smart_crusher.py` (crusher estrutural) e `headroom/cache/compression_store.py`
      (CCR store). Determinísticos; extrair o mecanismo escopado aos nossos outputs.

## 3. Escopo de Arquivos (Inputs e Outputs)
> **A endurecer JIT (pós-ORQ-09)** — paths de `src/` exatos vêm do que a ORQ-09b entregar. Esboço:
- **[CREATE]** `tools/orchestrator/src/context/ccrStore.*` — `makeCCRStore()` (stash/retrieve/dispose),
      portado do PoC. + a tool `retrieve` (schema Zod) registrável no harness.
- **[CREATE]** `tools/orchestrator/src/context/crusher.*` — `crushStructural(text, {kind})` determinístico.
- **[CREATE]** `tools/orchestrator/src/context/optimize.*` — `optimizeToolOutput(out, {tool, nano, store})`:
      orquestra as 3 camadas (gating por tamanho, roteia por tool, chama nano só acima do threshold).
- **[UPDATE]** `tools/orchestrator/src/tools.*` (ORQ-09a/b) — envolver o retorno de readFile/bash/grep
      com `optimizeToolOutput` + registrar a tool `retrieve`.
- **[CREATE]** testes de cada camada + do `optimizeToolOutput`.

## 4. Estratégia de Testes Estrita (TDD)
- [ ] `ccrStore`: stash→retrieve devolve original byte-a-byte; retrieve de hash inexistente erra claro.
- [ ] `crushStructural`: em array JSON repetitivo encolhe >40% preservando ≥1 exemplo real; em código
      (`.ts`) mantém ~intacto (não destrói — roteia por kind).
- [ ] `optimizeToolOutput`: output <2k tok passa cru (sem nano, sem custo); output grande vira
      resumo + hash e o `retrieve(hash)` recupera o original; nano é chamado só acima do threshold.
- [ ] provider fake para o tier nano (sem gastar $) nos testes unitários; 1 teste opt-in com nano real.
- [ ] **Fora de escopo:** portar content_router/code_compressor de 184/84KB; hospedar o modelo ONNX
      Kompress (nano cobre); tocar `orquestrar.mjs`.

## 5. Instruções de Execução
> **⚠️ NÃO FAZER:** NÃO subir/rotear pelo proxy Headroom (:8787 — NO-GO no ADR-0009). NÃO portar o
> codebase inteiro do Headroom — só o mecanismo do crusher+store escopado. NÃO deixar o crusher
> destruir código. NÃO rodar git no Docs.
1. Reendurecer JIT: fixar paths/assinaturas contra o `src/` real da ORQ-09b.
2. **[TDD]** camadas na ordem: ccrStore → crusher → optimize → wiring nas tools.
3. Gate → §8 → enfileira.

## 6. Feedback de Especificação
- **Aberto (deferir p/ arquiteto se surgir):** o tier ML de prosa. ADR-0009 decidiu nano em vez de
  hospedar o Kompress-v2-base (ONNX). Se um dia o custo/latência do nano incomodar, reavaliar portar o
  modelo via `onnxruntime-web` in-process — é uma alternativa conhecida, fora deste escopo (YAGNI hoje).
- Decisões estruturais estão no ADR-0009. Se algo lá ficou ambíguo ao endurecer, PARE e volte ao ADR.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] 3 camadas implementadas (CCR store + crusher estrutural + nano gated), na ordem do ADR-0009?
- [ ] `optimizeToolOutput` envolvendo os `execute()` das tools sem quebrar o protocolo de eventos (ADR-0008 §D)?
- [ ] Reversibilidade: `retrieve(hash)` recupera o original (teste verde)?
- [ ] Crusher NÃO destrói código (roteia por tool/kind)?
- [ ] Nenhum serviço standing (sem proxy :8787); deps npm novas isoladas no pacote do orchestrator?

### Verificação automática *(a fixar no endurecimento — comando real do pacote)*
```bash
cd tools/orchestrator && node --test tests/
```
> **GATE:** saída literal de test colada na §8.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real de test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
