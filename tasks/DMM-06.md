---
id: DMM-06
title: "Templates de workflow por Tipagem Dinâmica (grafos JDM editáveis)"
status: draft:triaged
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-02","DMM-03","DMM-04","DMM-05"]
blocks: ["DMM-09"]
capacity_target: sonnet
---

# DMM-06 · Templates de workflow por Tipagem Dinâmica (JDM)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Montar os **grafos JDM** associados a **Tipos Dinâmicos de Task**. Em vez de um fluxo monolítico, o sistema suporta múltiplos templates que encadeiam estágios (ex: Ingress → Architect → Explorer → Editor) de formas variadas dependendo do tipo da task (ex: *Refatoração Larga, Fix Rápido*). O modelo (Architect ou nó de triagem inicial) classifica a task e roteia para o workflow correto. Os templates são editáveis na UI (DMM-10).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Decisões Fechadas.
- [ ] DMM-02…05 — os 4 nós que este grafo encadeia.
- [ ] `packages/plugin-workflows/src/**` — formato de grafo/template persistido.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** definições de nó de DMM-02…05.
- **[CREATE]** templates de workflow (grafos JDM) baseados em tipos dinâmicos no formato do `plugin-workflows`.
- **[CREATE]** teste end-to-end (stubbed) que roda a triagem de tipo dinâmico e invoca o workflow correspondente.

## 4. Estratégia de Testes Estrita
- Vitest: roda o template com todos os nós em stub, valida ordem e passagem de payload entre etapas.
- **Fora de Escopo:** execução com modelos reais.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** duplicar lógica dos nós — o template só **referencia/encadeia** DMM-02…05.
> - **NÃO** tornar o grafo imutável — é editável (é um default, não um hardcode).

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-02`, `DMM-03`, `DMM-04`, `DMM-05` (todos agora `draft:triaged` neste
  mesmo lote, ainda não `done`). §3 marca `[CREATE] template de workflow default (grafo JDM) no
  formato do plugin-workflows` — o **formato do grafo JDM** é a saída do spike DMM-01. Este
  template é literalmente um encadeamento de DMM-02…05, que ainda não definiram o nó final
  (apenas o esboço do spec).
- **Por que NÃO `harden`:** o template *encadeia* DMM-02…05; sem as definições de nó finais,
  este só poderia citar placeholders ("Ingress→Architect→Explorer→Editor"), o que seria
  reescrever DMM-02…05 aqui — trabalho que se refaz em pass-2.
- **Próximo passo:** após DMM-01 (spike) E DMM-02…05 virarem `done`, reendurecer (pass-2 JIT)
  com paths reais e caso end-to-end (stubbed) enumerado.
- **Capacidade:** `sonnet` — composição declarativa de nós existentes, não algorítmico.
- **Pendente p/ pass-2:** assinatura TS exata do template (caminho do arquivo, formato JDM a
  referenciar), casos de teste enumerados (ordem Ingress→Architect→Explorer→Editor; payload
  fluindo entre etapas; ramos condicionais do Architect desviando o caminho).

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
- **[2026-07-08T18:38]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-02..05 (acabei de triar) ainda draft; reendurecer JIT após DMM-01→done E DMM-02..05→done
