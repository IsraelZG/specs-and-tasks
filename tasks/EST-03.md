---
id: EST-03
title: "plugin-tasks: schema completo (replica MGTIA 1:1) + serviço DB-first + guardas de código com escape hatch"
status: draft:placeholder
complexity: 7
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: # a fixar no endurecimento — complexidade 7 EXIGE quebra (regra Dimensionamento)
---

# EST-03 · plugin-tasks: schema completo + serviço + guardas de código

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-tasks/`. **DEVE ser decomposta** antes de executar
  (complexidade 7 > limiar 5 do CLAUDE.md, regra de Dimensionamento — INVIOLÁVEL). Esta é a
  task-casca; rodar `/endurecer-task` para fatiar em filhas (sugestão de seams: schema de dados ·
  máquina de estados/verbos · guardas de código B3 · API do serviço).

## 1. Objetivo
Implementar o sucessor DB-first do MGTIA: schema **completo** (RFC-018 B1 — não um subconjunto),
replicando 1:1 o que hoje vive em markdown — sub-status (`draft:<sub>`), verbos (triage/harden/
decide/promote/start/pause/finish/claim/approve/request_changes/block/unblock), Seção 8 (Parecer),
Seção 9 (Log), Gate de Evidência. Além do schema, as regras hoje só em PROSA no CLAUDE.md viram
**guarda de código** (B3): separação de papéis (worker nunca aprova), gate de evidência obrigatório
para `finish`, identidade de modelo — **cada uma com escape hatch opcional por task** (flag
explícita, nunca silenciosa) para exceções legítimas futuras.

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (B1, B3) — FONTE das duas decisões centrais desta task.
- [ ] `docs/task-template.md` e `tasks/T-001.md` — a forma completa de uma task (todas as 9 seções) que o schema precisa representar sem perda.
- [ ] `CLAUDE.md` §MGTIA — as 6 Regras e a tabela de Ações/Ciclo — fonte das guardas de código (B3).
- [ ] `tools/scripts/manage-task.mjs` (CLI legado) — o comportamento atual de cada verbo, a replicar/superar.
- [ ] Incidentes que motivaram reforço de regra: T-1025 (separação de papéis), M-013/T-1014 (bypass de status) — não reabrir, já resolvidos em prosa; aqui viram guarda de serviço.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-tasks/src/schema.*` — tabelas/tipos completos.
- **[CREATE]** `packages/plugin-tasks/src/stateMachine.*` — verbos e transições válidas.
- **[CREATE]** `packages/plugin-tasks/src/guards/*` — separação de papéis, gate de evidência, identidade — cada uma com flag de exceção.
- **[CREATE]** `packages/plugin-tasks/src/service.*` — API consumida pelo host (EST-02) e pela UI (EST-14).

## 4. Estratégia de Testes
- [ ] Cada verbo testado (transições válidas/inválidas). Worker tentando approve/request_changes é rejeitado, EXCETO com a flag de exceção explícita presente. `finish` sem evidência é rejeitado. Idempotência dos verbos (como o MGTIA atual já garante).

## 5. Instruções de Execução
1. **Rodar `/endurecer-task` primeiro** — esta task-casca não executa como está (complexidade 7).
2. Após decomposição: schema → máquina de estados → guardas → API do serviço, nesta ordem.
3. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 B1/B3, não reabrir escopo. As guardas de código são a parte mais
  sensível (risco de regressão dos incidentes M-013/T-1014/T-1025) — priorizar teste de exceção
  proibida antes de qualquer feature nova.

## 7. Definition of Done (DoD)
- [ ] Schema representa as 9 seções do template sem perda?
- [ ] Todos os verbos do ciclo atual implementados?
- [ ] As 3 guardas de código (papel/gate/identidade) ativas E com escape hatch testado?
- [ ] API do serviço consumível pelo host e pela UI?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-tasks test
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
