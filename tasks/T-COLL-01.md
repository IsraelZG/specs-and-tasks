---
id: T-COLL-01
title: "Primitivas determinísticas para orquestração coletiva de agentes"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-16", "EST-10", "DMM-11"]
blocks: []
capacity_target: sonnet
---

# T-COLL-01 · Primitivas determinísticas para orquestração coletiva de agentes

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; confirmar interfaces de provider, workflow e trace após DMM-16.
- **Runtime:** Node.js e TypeScript; `pnpm`; Vitest.
- **Capacidade-alvo:** sonnet; triagem inicial.

## 1. Objetivo
Criar Tools reutilizáveis para orquestração coletiva: reserva/consumo de orçamento, seleção de candidato, verificação determinística por tipo de saída, comparação, acordo/dissenso e proveniência. Estratégias como `best-of-n`, crítica/reparo e painel de especialistas serão workflows posteriores, não Tools monolíticas.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §§2, 3 e 8.
- [DMM-16](./DMM-16.md) — descriptor e adapters universais.
- [EST-10](./EST-10.md) — providers, scoring e fallback existentes.
- [DMM-11](./DMM-11.md) — Judge operacional; não confundir com verificação semântica de resposta.
- [Referências locais](../docs/referencias-codigo-aberto.md) — Collective Intelligence em `docs/_vendor/collective-intelligence`, commit fixado; ler `api/src/core/orchestration/orchestration-engine.ts`, `strategy-tiers.ts` e `verification/answer-check-resolver.ts`; não copiar implementação AGPL.

## 3. Escopo a endurecer
- **[READ]** contratos reais de provider, run trace e Tool registry.
- **[CREATE/UPDATE]** Tools de budget, verify, compare, agreement/dissent e provenance.
- **[CREATE]** fixtures de candidatos independentes e testes de orçamento/verificação.

## 4. Casos obrigatórios no endurecimento
1. Reserva não permite iniciar candidato que exceda orçamento propagado.
2. Verificador determinístico seleciona/rejeita resultado estruturado sem chamar modelo.
3. Respostas divergentes preservam dissenso e provenance em vez de falsa unanimidade.
4. Candidato de provider indisponível é excluído pela política de saúde/fallback existente.
5. Nenhuma estratégia coletiva é marcada estável sem métrica de custo, latência e qualidade no laboratório.

## 5. Não fazer
- Não implementar consenso/debate/swarm como comportamento hardcoded.
- Não usar modelo grande como verificador default.
- Não incorporar código AGPL do Collective Intelligence.

## 6. Feedback de Especificação
As primitives estão decididas, mas paths e envelope real dependem de DMM-16. Reendurecer quando essa dependência estiver concluída; criar estratégias específicas somente após este contrato.

## 7. Gate futuro
Fixar build/test/lint do pacote real e fixtures que provem orçamento, verificação e dissenso no endurecimento JIT.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triadas primitives determinísticas de orquestração coletiva.
