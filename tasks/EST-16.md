---
id: EST-16
title: "plugin-workflows: desenho e gestão de fluxos de agente (JDM/Zen — nano-broker, pipelines de prompt, políticas de dispatch)"
status: draft:placeholder
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-07"]
blocks: []
capacity_target: # a fixar no endurecimento (provável sonnet; a validação de licença/fit do jdm-editor pode virar mini-spike)
---

# EST-16 · plugin-workflows (desenho + gestão de fluxos de agente)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-workflows/`. Nasceu da percepção do arquiteto
  (2026-07-05): "precisaremos de um sistema básico de desenho e gerenciamento de workflows, para
  desenharmos os fluxos que podemos implementar (uso de modelos nano para ferramentas, para
  prompts iniciais, etc.)".

## 1. Objetivo
Dar forma **declarativa e editável** aos fluxos de agente que hoje vivem espalhados em prosa e
código: o tool-broker nano (caderno 30 §9-A), pipelines de montagem de prompt (`assemblePrompt`),
políticas de dispatch (quando fan-out, quando escalar de modelo), correntes de fallback. **Não
construir engine nem editor do zero** — o produto já decidiu o **GoRules Zen Engine** (T-604:
`@gorules/zen-engine`) como avaliador de regras, e o ecossistema GoRules tem um **editor visual
open-source de grafos JDM** (`@gorules/jdm-editor`, React) que encaixa direto na UI do Estaleiro
(EST-14) como view adicional. O plugin: armazena/versiona definições de fluxo (JDM/JSON),
avalia-as via zen-engine, e expõe ao `plugin-dispatcher` (EST-07) e ao `plugin-agent-harness`
os pontos de decisão ("este output de tool vai pro nano ou direto?", "este prompt usa qual
template/persona?").

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` — arquitetura; este plugin entra como durável (@plataforma/plugin-workflows).
- [ ] `tasks/T-604.md` (reendurecida 2026-07-03) — decisão do produto: `@gorules/zen-engine` único
      + `evaluateUnaryExpressionSync`. Este plugin USA a mesma engine — coerência lab↔produto.
- [ ] `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §9 — os 3 degraus do
      "modelo pequeno como intermediário" (tool-broker/CodeAct/triagem) = os primeiros fluxos a desenhar.
- [ ] `tools/scripts/orquestrar.mjs` (`assemblePrompt`) — o pipeline de prompt existente a tornar declarativo.
- [ ] `docs/_vendor/OmniRoute/` — o conceito de "combos" deles (cadeias declarativas de
      provider/modelo com degradação automática) é um precedente de formato; citar arquivos exatos
      no endurecimento (RFC-018 §6.6).
- [ ] `@gorules/jdm-editor` (npm/GitHub) — **confirmar licença e maturidade no endurecimento antes
      de fixar** (CITE OU ESCALE — se a licença não servir, alternativa é editor mínimo próprio
      sobre o FlexLayout, registrada como decisão).

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-workflows/src/{store,evaluate}.*` — definições de fluxo versionadas + avaliação via zen-engine.
- **[CREATE]** pontos de integração: hook de decisão consumido por EST-07 (dispatch) e pelo harness (tool-broker/prompt pipeline).
- **[UPDATE]** EST-14 ganha a view de edição (jdm-editor embarcado) — coordenar com o endurecimento de EST-14 (pode virar 6ª view ou painel dentro da view de frota).

## 4. Estratégia de Testes
- [ ] Definição de fluxo (fixture JDM) avaliada corretamente via zen-engine; hook de decisão retorna a rota esperada para 2+ cenários (ex.: output >2k tok → rota nano; task com flag fan-out → rota N-worktrees).

## 5. Instruções de Execução
1. Endurecer JIT: confirmar licença/fit do `@gorules/jdm-editor`; fixar o formato (JDM puro vs. JDM+extensões).
2. Store + avaliação primeiro (headless); editor visual por último (depende de EST-14).
3. Primeiro fluxo real a modelar: o gating do `optimizeToolOutput` (threshold/rota nano — hoje hardcoded no plugin-context).
4. Gate → §8.

## 6. Feedback de Especificação
- **Aberto (resolver no endurecimento):** licença/maturidade do `@gorules/jdm-editor`; se não servir,
  decidir entre editor mínimo próprio ou adiar a parte visual (o store+avaliação não dependem dela).
- A relação com `SPEC:WORKFLOW` do produto (guards Zen no grafo) é de **coerência de engine**, não de
  formato idêntico — o Estaleiro não roda sobre o grafo (RFC-018 §6.3); não fingir que são a mesma coisa.

## 7. Definition of Done (DoD)
- [ ] Fluxos declarativos versionados e avaliados via zen-engine (mesma engine do produto)?
- [ ] Hook de decisão consumido por dispatcher/harness em ≥1 fluxo real (gating do nano)?
- [ ] Decisão do editor visual registrada (adotado, próprio, ou adiado com motivo)?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-workflows test
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
