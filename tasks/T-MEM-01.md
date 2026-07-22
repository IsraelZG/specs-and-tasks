---
id: T-MEM-01
title: "Ciclo de vida de memória: proveniência, temporalidade e supersession"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-KNOW-01", "T-IA-03"]
blocks: ["T-MEM-02"]
capacity_target: sonnet
---

# T-MEM-01 · Ciclo de vida de memória: proveniência, temporalidade e supersession

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; confirmar o modelo de node/edge e permission filter pós-T-KNOW-01.
- **Runtime:** Node.js e TypeScript; `pnpm`; Vitest.
- **Capacidade-alvo:** sonnet; triagem inicial.

## 1. Objetivo
Implementar contratos e workflows explícitos para memória de sessão, promoção para memória durável, proveniência, confiança, validade temporal, supersession e esquecimento. A memória derivada referencia nodes canônicos; agente não promove conteúdo transitório silenciosamente.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §6.
- [T-KNOW-01](./T-KNOW-01.md) — conteúdo canônico em nodes.
- [T-IA-03](./T-IA-03.md) — retrieval, permissão e RRF.
- [Referências locais](../docs/referencias-codigo-aberto.md) — Cognee em `docs/_vendor/cognee`, commit fixado; ler `cognee/memify_pipelines/` e `examples/demos/memory_provenance_demo.py` como inspiração de `remember`/`recall`/`forget`, sem reutilizar runtime inteiro.

## 3. Escopo a endurecer
- **[READ]** modelo de nodes/edges e permission filter final.
- **[CREATE/UPDATE]** contratos de item de memória, relações de proveniência/supersession e workflows de promoção/esquecimento.
- **[CREATE]** testes de temporalidade, autorização e reconstrução de provenance.

## 4. Casos obrigatórios no endurecimento
1. Memória de sessão não aparece no retrieval durável sem promoção autorizada.
2. Promoção registra node/versão fonte, ator/modelo e instante.
3. Fato superseded deixa de ser default, mas mantém linhagem auditável.
4. `forget` remove todas as projeções derivadas permitidas e preserva somente retenção exigida.
5. Principal sem permissão não recebe item, provenance ou relação derivada.

## 5. Não fazer
- Não criar grafo opaco como fonte canônica.
- Não usar decaimento/confiança sem fonte de política declarada.
- Não apagar registro sujeito a retenção regulatória.

## 6. Feedback de Especificação
Relações e schema concretos dependem do tipo de node documental escolhido por T-KNOW-01; reendurecer após essa decisão. A semântica de ciclo de vida é derivada da ADR 0019.

## 7. Gate futuro
Fixar pacote, build/test/lint e casos de promoção/supersession/esquecimento após T-KNOW-01 `done`.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triado lifecycle de memória derivada e temporal.
