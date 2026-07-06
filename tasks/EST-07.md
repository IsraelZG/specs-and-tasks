---
id: EST-07
title: "plugin-dispatcher: sucessor do orquestrar.mjs (escolhe modelo, decide o que despachar, lock de task)"
status: draft:placeholder
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-03", "EST-06"]
blocks: []
capacity_target: sonnet
---

# EST-07 · plugin-dispatcher (sucessor do orquestrar.mjs)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-dispatcher/`. **Componente NOVO** (RFC-018 D1) — não é
  move de código pronto, é o desenho de um dispatcher próprio, plugin dedicado (nem core, nem
  agent-harness). **CONFIRMA que ORQ-11 (religar orquestrar.mjs no Docs) fica obsoleta** — esta
  task é a sucessora real.

## 1. Objetivo
Implementar o dispatcher que decide **o que** despachar (consultando `plugin-tasks` por tasks
prontas, EST-03), **para qual modelo** (roster/seleção, herdado de `orquestrador.config.json`), e
**trava lock** de task durante execução — chamando `plugin-agent-harness` (EST-06) para efetivamente
rodar. Vive como plugin próprio (RFC-018 D1) porque sobrevive à migração do Estaleiro, diferente do
core (descartável).

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (D1) e §5 (nota sobre ORQ-11 obsoleta).
- [ ] `tools/scripts/orquestrar.mjs` — `planDispatch`/`selectModel`/lock/registry — a lógica de decisão a portar (não o `spawnAgent`, que já morreu no ADR-0008).
- [ ] `tasks/orquestrador.config.json` — roster por nível (haiku/sonnet/opus/vision).
- [ ] `packages/plugin-tasks/src/service.*` (EST-03) — fonte de "o que está pronto pra rodar".
- [ ] `packages/plugin-agent-harness/src/agentAdapter.*` (EST-06) — o `run()` que o dispatcher invoca.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-dispatcher/src/{planDispatch,selectModel,lock}.*` — portado/adaptado de `orquestrar.mjs`.
- **[CREATE]** testes de seleção de modelo e de lock (2 dispatches concorrentes na mesma task → 1 só ganha).

## 4. Estratégia de Testes
- [ ] Seleção de modelo por nível/roster; lock impede dispatch duplo da mesma task; integração fake com plugin-tasks (task pronta → dispatch → agent-harness chamado).

## 5. Instruções de Execução
1. Portar `planDispatch`/`selectModel` do `orquestrar.mjs`, adaptando a fonte de tasks para `plugin-tasks`.
2. Lock via o mecanismo do plugin-tasks (ou próprio, se justificado — registrar decisão).
3. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 D1. Fechar **ORQ-11** com nota apontando pra esta task quando esta
  entrar em execução (RFC-018 §5).

## 7. Definition of Done (DoD)
- [ ] Seleção de modelo por roster funcional?
- [ ] Lock impede dispatch duplo?
- [ ] Integração com plugin-tasks (consulta) e plugin-agent-harness (execução) funcional?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-dispatcher test
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
