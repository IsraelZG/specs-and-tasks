---
id: EST-08
title: "plugin-local-inference: substrato ORT in-process (modelo-como-dado), consumido por plugin-context e futuramente T-IA-01/T-IA-05"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: sonnet # substrato ORT in-process, modelo-como-dado, ADR-0011
---

# EST-08 · plugin-local-inference (substrato ORT in-process)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-local-inference/`. **Componente NOVO**, identificado
  durante a sessão de decisões do RFC-018 (não estava no esboço original) — separação entre
  "conector de API" (plugin-providers, HTTP) e "inferência dentro do próprio processo" (este
  plugin, sem rede, sem servidor externo).

## 1. Objetivo
Extrair o mecanismo de inferência ONNX Runtime in-process já provado nos spikes ORQ-14/15
(sessão ORT, tokenizer, modelo-como-dado, EPs cpu/dml/webgpu) para um plugin **compartilhado**,
em vez de embutido dentro do `plugin-context`. Hoje só a compressão (LLMLingua-2) usa isso; a fila
já tem dois outros consumidores planejados que vão precisar do MESMO runtime: **T-IA-01**
(embeddings) e **T-IA-05** (SLM do command palette). Um substrato só evita 3 cópias do
gerenciamento de sessão ORT.

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §3 (nota "plugin-local-inference", diagrama revisado) — a decisão que criou este componente.
- [ ] `docs/adr/0010-compressor-ml-onnx-in-process.md` e `docs/adr/0011-infra-de-inferencia-local.md` — os spikes que provaram o mecanismo: `onnxruntime-node`, modelo-como-dado, matriz de EPs (cpu funciona; dml falha no Adreno; qnn/webgpu são follow-up).
- [ ] `tools/orchestrator/context-bench.poc.mjs` (VIA 4/5) — o código de referência (`onnxInit`, `onnxVia`) a generalizar para um substrato reusável (hoje é específico da bancada).
- [ ] T-IA-01 (embeddings, `ready`) e T-IA-05 (SLM palette, `draft:triaged`) — os consumidores futuros; NÃO modificar essas tasks aqui, só garantir que a API deste plugin sirva a ambas.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-local-inference/src/session.*` — carregamento de sessão ORT, cache de modelo (nunca commitado no repo — path externo, herdado do padrão `~/.cache/` dos spikes).
- **[CREATE]** `packages/plugin-local-inference/src/infer.*` — API genérica `infer(modelRef, input) → output`, independente do caso de uso (compressão, embedding, classificação).
- **[CREATE]** testes com um modelo pequeno de fixture.

## 4. Estratégia de Testes
- [ ] Sessão carrega e roda inferência real (reusar um dos modelos já baixados/testados nos spikes, ex. LLMLingua-2). EP `cpu` funcional; tentativa de EP `dml` documenta falha (herdado do ADR-0011, não é regressão nova).

## 5. Instruções de Execução
1. Generalizar `onnxInit`/`onnxVia` da bancada (ORQ-15) para uma API sem acoplamento ao caso de compressão.
2. Modelo como configuração (path/hash), não hardcoded.
3. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = a conversa que criou este plugin (ver RFC-018 §3, nota). Não re-decidir EPs/hardware — isso é ADR-0011, já resolvido (CPU funciona; GPU/NPU são follow-up de hardware fora deste escopo).

## 7. Definition of Done (DoD)
- [ ] API `infer()` genérica, independente de caso de uso?
- [ ] Sessão ORT com cache de modelo fora do repo?
- [ ] Teste real de inferência (não mock) passando?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-local-inference test
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
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-local-inference ORT in-process, capacity=sonnet, depende de EST-02 (draft)
