---
id: DMM-06
title: "Template de workflow default das 4 etapas (grafo JDM editável)"
status: draft:placeholder
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-02","DMM-03","DMM-04","DMM-05"]
blocks: ["DMM-09"]
capacity_target: sonnet
---

# DMM-06 · Template de workflow default (4 etapas, JDM)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Montar o **grafo JDM padrão** que encadeia os 4 estágios (Ingress → Architect → Explorer → Editor) como
um template declarativo do `plugin-workflows` (ADR 0013 — "Definição de Fluxos: totalmente declarativa").
O template é editável pelo usuário na UI (DMM-10) — este é o **default de fábrica**.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Decisões Fechadas.
- [ ] DMM-02…05 — os 4 nós que este grafo encadeia.
- [ ] `packages/plugin-workflows/src/**` — formato de grafo/template persistido.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** definições de nó de DMM-02…05.
- **[CREATE]** template de workflow default (grafo JDM) no formato do `plugin-workflows`.
- **[CREATE]** teste end-to-end (stubbed) que roda o grafo Ingress→Architect→Explorer→Editor.

## 4. Estratégia de Testes Estrita
- Vitest: roda o template com todos os nós em stub, valida ordem e passagem de payload entre etapas.
- **Fora de Escopo:** execução com modelos reais.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** duplicar lógica dos nós — o template só **referencia/encadeia** DMM-02…05.
> - **NÃO** tornar o grafo imutável — é editável (é um default, não um hardcode).

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Template default encadeia os 4 estágios e roda end-to-end (stub) verde.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
