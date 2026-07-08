---
id: DMM-04
title: "Nó Explorer (Estágio 3): harness read-only + fs-tools + crushToCsv"
status: draft:placeholder
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"]
blocks: ["DMM-06"]
capacity_target: sonnet
---

# DMM-04 · Nó Explorer (Estágio 3): exploração delegada → CSV

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Implementar o **nó de invocação delegada** (ADR 0013, Estágio 3 — The Explorer): faz crawling do
repositório (coordenadas, buscas) e converte saídas extensas em **CSV denso**. A engine aciona o
`plugin-agent-harness` com `maxSteps` **baixo** e system prompt restrito a **leitura**; o agent usa
`plugin-fs-tools` (bash restrito). A saída bruta passa por `crushToCsv` do `plugin-context`
(transição declarada, contrato DMM-01) antes de alimentar os nós seguintes.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Estágio 3.
- [ ] `docs/adr/0014-contrato-no-workflow-declarativo.md` (DMM-01) — transição declarada (crushToCsv).
- [ ] `packages/plugin-agent-harness/src/runner.ts` (EST-06) — `run` com `maxSteps`/system prompt.
- [ ] `packages/plugin-fs-tools/` (EST-05) — bash gated / read-only.
- [ ] `packages/plugin-context/src/` — `crushToCsv`.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-agent-harness/src/runner.ts`, `packages/plugin-fs-tools/src/**`, `plugin-context` crushToCsv.
- **[CREATE]** definição do nó Explorer (harness read-only + maxSteps baixo) + transição crushToCsv.
- **[CREATE]** teste: run stub sobre um repo fixture → saída CSV densa esperada.

## 4. Estratégia de Testes Estrita
- Vitest com harness em modo stub/mock (sem chamar modelo real). Asserta **read-only** (nenhuma escrita).
- **Fora de Escopo:** qualidade do crawling com modelo real (é validação de integração posterior).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** dar acesso de escrita ao Explorer — system prompt e gating de `plugin-fs-tools` só leitura.
> - **NÃO** reimplementar o crush — chamar `crushToCsv` existente via transição declarada.

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Nó Explorer roda read-only, saída passa por crushToCsv via transição declarada.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
pnpm --filter @plataforma/plugin-agent-harness test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
