---
id: DMM-05
title: "Nó Editor (Estágio 4): harness persona Editor, write, loop até exit 0 (maxSteps=40)"
status: draft:placeholder
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"]
blocks: ["DMM-06"]
capacity_target: sonnet
---

# DMM-05 · Nó Editor (Estágio 4): micro-codificação + loop de testes

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Implementar o **último nó ativo** (ADR 0013, Estágio 4 — The Editor): implementa lógica, altera código
e roda validações autônomas. O workflow instancia um run no `plugin-agent-harness` com a persona
**Editor** e acesso de **escrita** no `plugin-fs-tools`. Pelo design do `runner.ts`, o nó gira
internamente (autocorreção até `maxSteps=40`) verificando logs de erro até o sucesso (`exit === 0`);
o workflow só avança quando o nó relata conclusão.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Estágio 4.
- [ ] `packages/plugin-agent-harness/src/runner.ts` (EST-06) — loop interno, `maxSteps`, personas, kill.
- [ ] `packages/plugin-fs-tools/` (EST-05) — write gated + bash.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-agent-harness/src/runner.ts`, `packages/plugin-fs-tools/src/**`.
- **[CREATE]** definição do nó Editor (persona Editor, write, `maxSteps=40`, gate `exit===0`).
- **[CREATE]** teste: run stub que "falha→corrige→passa" → nó só relata done em exit 0.

## 4. Estratégia de Testes Estrita
- Vitest com harness stub simulando iterações até exit 0. **Fora de Escopo:** codificação real com modelo.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** reimplementar o loop de autocorreção — ele já vive no `runner.ts` (EST-06); só configurar.
> - **NÃO** avançar o workflow antes de `exit === 0`.

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Nó Editor: persona Editor + write + loop até exit 0; workflow espera a conclusão.
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
