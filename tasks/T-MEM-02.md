---
id: T-MEM-02
title: "Ingestão GraphRAG: extração e validação de entidades e relações"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-MEM-01", "T-IA-02"]
blocks: []
capacity_target: sonnet
---

# T-MEM-02 · Ingestão GraphRAG: extração e validação de entidades e relações

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; confirmar contrato de embedding/inferência local de T-IA-02 e memória de T-MEM-01.
- **Runtime:** Node.js e TypeScript; `pnpm`; Vitest.
- **Capacidade-alvo:** sonnet; triagem inicial.

## 1. Objetivo
Implementar pipeline de ingestão que normaliza/chunka/deduplica e, quando a política do domínio permitir, extrai entidades e relações com saída estruturada. O modelo sugere; schema/ontologia/política determinísticos validam. O resultado atualiza projeções de grafo, FTS e vetores com proveniência.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §6.
- [T-MEM-01](./T-MEM-01.md) — provenance, temporalidade e lifecycle.
- [T-IA-02](./T-IA-02.md) — compute local de embedding/LLM.
- [Cognee](https://github.com/topoteretes/cognee) — inspiração de pipeline/ontologia, sem dependência de runtime.

## 3. Escopo a endurecer
- **[READ]** contratos de memória e inferência resultantes das dependências.
- **[CREATE/UPDATE]** Tools de chunk/dedup/extract/validate/upsert e workflow de ingestão.
- **[CREATE]** corpus sintético, testes de schema e teste anti-promoção de relação inválida.

## 4. Casos obrigatórios no endurecimento
1. Chunking/dedup determinísticos produzem o mesmo resultado para a mesma fonte/versionamento.
2. Relação bem-formada com origem permitida é persistida com provenance.
3. Saída malformada ou fora da ontologia é rejeitada sem contaminar grafo/FTS/vetor.
4. Extração de conteúdo protegido só ocorre após autorização no caminho pós-decifra.
5. Falha de modelo local não impede indexação léxica determinística da fonte autorizada.

## 5. Não fazer
- Não transformar sugestão de LLM em fato canônico sem validação.
- Não enviar conteúdo privado a API externa por default.
- Não criar ontologia global hardcoded fora da SPEC/domínio.

## 6. Feedback de Especificação
O schema de entidade/relação por domínio e os exports de inferência dependem de T-MEM-01/T-IA-02; reendurecer após ambas `done`.

## 7. Gate futuro
Fixar pacote, build/test/lint, corpus sintético e prova de rejeição de saída inválida no endurecimento JIT.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada ingestão GraphRAG após contratos de memória e inferência.
