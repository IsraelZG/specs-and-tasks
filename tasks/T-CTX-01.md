---
id: T-CTX-01
title: "ContextBundle e decomposição atômica do plugin-context"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-09", "T-KNOW-01", "T-IA-03", "DMM-17"]
blocks: []
capacity_target: sonnet
---

# T-CTX-01 · ContextBundle e decomposição atômica do plugin-context

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; confirmar exports atuais de `plugin-context`, `plugin-knowledge` e workflow runtime.
- **Runtime:** Node.js e TypeScript; `pnpm`; Vitest.
- **Capacidade-alvo:** sonnet; triagem inicial, dependente de retrieval e invocação de workflow.

## 1. Objetivo
Criar o `ContextBundle` auditável e decompor a preparação de contexto em Tools registráveis: detecção/normalização, crusher estrutural, compressão extrativa, nano-sumarização, tradução narrativa, ajuste de orçamento, CCR store/retrieve e contagem de tokens. A API composta atual pode sobreviver como fachada; a política passa a ser workflow invocável por `invoke_workflow`.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §§2, 3 e 5.
- [caderno SDK/30](../docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md) — CCR e otimização de contexto.
- [EST-09](./EST-09.md) — crusher, nano, LLMLingua-2 e CCR existentes.
- [T-KNOW-01](./T-KNOW-01.md) e [T-IA-03](./T-IA-03.md) — fontes/projeções canônicas e retrieval híbrido.
- [DMM-17](./DMM-17.md) — invocação uniforme de workflows.
- [Referências locais](../docs/referencias-codigo-aberto.md) — Headroom em `docs/_vendor/headroom-upstream` (CCR/decisão de compressão) e LLMLingua em `docs/_vendor/llmlingua/llmlingua/prompt_compressor.py`; adaptar comportamento, não runtime Python.

## 3. Escopo a endurecer
- **[READ]** API/exportações reais de `plugin-context` e `plugin-local-inference`.
- **[READ]** resultado efetivo do retrieval de T-IA-03.
- **[CREATE/UPDATE]** tipos de bundle, Tools atômicas e workflows de preparo no pacote confirmado.
- **[CREATE]** testes de rastreabilidade/CCR e de variantes com e sem tradução.

## 4. Casos obrigatórios no endurecimento
1. Cada item preserva node/versão, hash, permissões, idioma, tokens e cadeia de transformação.
2. Bundle com overflow conserva referência CCR e pode reidratar o conteúdo original autorizado.
3. Variante em inglês traduz narrativa, preservando código, IDs, hashes e paths byte a byte.
4. Saída de shell só passa por RTK no adapter de shell, não pela Tool de tradução documental.
5. Workflow com e sem tradução produz trace/orçamento comparável e não chama modelo grande sem política explícita.

## 5. Não fazer
- Não concatenar strings sem proveniência.
- Não tratar RTK como compressor textual universal.
- Não persistir plaintext sensível fora do domínio autorizado.

## 6. Feedback de Especificação
O shape final do resultado de T-IA-03 e os exports pós-DMM-17 são pré-requisitos de assinatura; reendurecer após ambas as dependências. A decisão de arquitetura já está fechada pela ADR 0019.

## 7. Gate futuro
Fixar build/test/lint do pacote dono, mais roundtrip CCR e teste de preservação literal no endurecimento JIT.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triado ContextBundle e atomização de plugin-context; aguarda retrieval e invoke_workflow.
