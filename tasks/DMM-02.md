---
id: DMM-02
title: "Nó Ingress (Estágio 1): tradução + crusher + l2Compressor como template de workflow"
status: draft:placeholder
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"] # precisa do contrato de nó/transição
blocks: ["DMM-06"]
capacity_target: sonnet
---

# DMM-02 · Nó Ingress (Estágio 1): tradução + filtro

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Implementar o **primeiro nó** da esteira declarativa (ADR 0013, Estágio 1): traduz a spec de entrada
para inglês e remove tokens redundantes. Como **template de workflow** (não hardcoded): o nó chama o
modelo de tradução (via `plugin-local-inference` por padrão, com fallback `plugin-providers`) e depois
repassa o texto por `crusher.ts` e `l2Compressor.ts` (`plugin-context`) como transições declaradas.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Estágio 1.
- [ ] `docs/adr/0014-contrato-no-workflow-declarativo.md` (DMM-01) — contrato de nó/transição.
- [ ] `packages/plugin-context/src/` — `crusher.ts`, `l2Compressor.ts`.
- [ ] `packages/plugin-local-inference/`, `packages/plugin-providers/` — invocação + fallback.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-context/src/{crusher,l2Compressor}.*`, `packages/plugin-local-inference/src/**`.
- **[CREATE]** template/definição do nó Ingress no formato decidido em DMM-01 (path a fixar no endurecimento).
- **[CREATE]** teste que roda o nó: entrada PT-BR verbosa → saída EN comprimida.

## 4. Estratégia de Testes Estrita
- Vitest. Métrica: saída em inglês + redução de tokens mensurável. Fallback local→providers exercido.
- **Fora de Escopo:** os demais estágios; qualidade linguística fina da tradução.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** adicionar lógica de tradução/compressão DENTRO do `plugin-context`/`plugin-local-inference`
>   — o nó apenas **compõe** funções existentes via o contrato de DMM-01.
> - **NÃO** hardcodar o provedor: o default é local, mas trocável por nó na UI.

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Nó Ingress roda como etapa de workflow, sem hardcode em plugin-base.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
pnpm --filter @plataforma/plugin-context test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
