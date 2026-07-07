---
id: EST-14
title: "Frontend do Estaleiro: semente Lovable A1 (FlexLayout+TinyBase), 5 views, 1 canal WS único"
status: draft:decomposed
complexity: 6
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-03", "EST-06", "EST-10", "EST-13"]
blocks: []
capacity_target: sonnet # frontend FlexLayout+TinyBase, 5 views — complexidade 6, decomposta
children: ["EST-14a", "EST-14b", "EST-14c", "EST-14d", "EST-14e"]
subtasks: ["EST-14a", "EST-14b", "EST-14c", "EST-14d", "EST-14e"]
---

# EST-14 · Frontend do Estaleiro (casca decomposta)

## 0. Ambiente de Execução Obrigatório
- **Task-casca decomposta.** Esta task não executa diretamente — seu escopo foi fatiado em:
  - **EST-14a** — Shell FlexLayout + WS único (infraestrutura, capacity=haiku)
  - **EST-14b** — View Board (tasks grid/kanban, capacity=haiku)
  - **EST-14c** — View Frota (agentes ao vivo, capacity=sonnet)
  - **EST-14d** — View Docs/RAG (navegador markdown, capacity=haiku)
  - **EST-14e** — Views Decisões + Custo (dashboards, capacity=haiku)

  Cada filha segue o fluxo MGTIA independente. Esta casca fecha quando as 5 filhas estiverem `done`.

- **Runtime:** Node.js 22+. `apps/estaleiro/ui/`.
- **Package Manager:** `pnpm` (monorepo do superapp).
- **Test Runner:** `vitest` (JSDOM).
- **Lint:** `eslint src/` (typescript-eslint strict).
- **Capacidade-alvo:** sonnet (casca — as filhas variam haiku/sonnet conforme sua complexidade individual).

## 1. Objetivo
Construir a UI do Estaleiro a partir da **semente do projeto Lovable A1** (shell FlexLayout + TinyBase + tokens, já verificado — F1), com as **5 views mantidas no v1** (F2): board de tasks (consome `plugin-tasks`, EST-03), fila de decisões do arquiteto, painel de frota ao vivo (consome `plugin-agent-harness`, EST-06, e `plugin-providers`/telemetria, EST-10), navegador docs/RAG (consome `plugin-knowledge`, EST-13), e painel de custo. **Um canal WebSocket só** (F3) — reusa o stream de eventos já construído no ADR-0008 §D/ORQ-10, sem inventar transporte novo pro board.

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (F1, F2, F3) e §3 (diagrama, "ui" do Estaleiro) — FONTE da semente, 5 views, WS único.
- [x] Projeto Lovable A1 (shell FlexLayout+TinyBase+tokens) — a semente a importar.
- [x] `docs/caderno-3-sdk/28-shell-e-composicao.md` — padrão de colunas FlexLayout já canônico no produto (mesma linguagem visual).
- [x] `docs/adr/0008-agent-adapter-in-process.md` §D — protocolo de eventos que a view de frota consome via o canal WS único.
- [x] `docs/_vendor/orca/src/shared/worktree-card-properties.ts` — referência de card de worktree para view de frota.
- [x] `docs/_vendor/orca/src/shared/diff-comments-format.ts` — referência de diff annotation.
- [x] **Tasks filhas:** EST-14a, EST-14b, EST-14c, EST-14d, EST-14e.

## 3. Escopo de Arquivos
> O escopo real está nas filhas. Esta casca não cria/edita arquivos diretamente.

## 4. Estratégia de Testes
> Ver cada filha. A casca não tem testes próprios.

## 5. Instruções de Execução
1. Executar as subtasks na ordem de dependência: EST-14a (infra) → EST-14b (board) → EST-14c (frota) → EST-14d (knowledge) → EST-14e (decisions+cost).
2. EST-14a deve ser a primeira (as views dependem dela).

## 6. Feedback de Especificação
> **Decisões DERIVADAS de fonte (CITE OU ESCALE):**

| Item | Fonte |
|---|---|
| Semente Lovable A1 (FlexLayout+TinyBase+tokens) | RFC-018 F1 |
| 5 views (board, decisões, frota, docs/RAG, custo) | RFC-018 F2 |
| WS único (F3), reusa ADR-0008 §D | RFC-018 F3 |
| Ordem de construção: infra → views | Dependências entre filhas |
| Shell em `apps/estaleiro/ui/` | RFC-018 §3 (diagrama) |
| Decomposição em 5 subtasks (seams limpos por view) | Complexidade 6 > limiar 5 (CLAUDE.md) |
| Padrões Orca para frota (worktree cards, diff) | `docs/_vendor/orca/` (RFC-018 §6.6) |

> **Decisões em aberto:** nenhuma. Todas as views e o canal WS foram decididos no RFC-018.

## 7. Definition of Done & Gate
- [ ] EST-14a (Shell+WS) implementada?
- [ ] EST-14b (Board) implementada?
- [ ] EST-14c (Frota) implementada?
- [ ] EST-14d (Knowledge) implementada?
- [ ] EST-14e (Decisões+Custo) implementada?
- [ ] Todas as 5 filhas com status `done`?

### Verificação automática (aplicável à casca — cada filha tem seu próprio gate)
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** O worker da última filha a fechar roda build+test+lint na raiz do pacote e cola a saída literal aqui. Lint incluído desde 2026-07-06.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — frontend Lovable A1 5 views, capacity=sonnet, complexidade 6 exige decomposicao, depende de EST-03/06/10/13 (draft)
- **[2026-07-07T13:25]** - *big-pickle* - `[Decomposto]`: decomposto em 5 subtasks — EST-14a (shell+WS, haiku), EST-14b (board, haiku), EST-14c (frota, sonnet), EST-14d (knowledge, haiku), EST-14e (decisions+cost, haiku)
- **[2026-07-07T13:25]** - *big-pickle* - `[Reconciliado]`: status restaurado de draft:decomposed para draft:triaged (drift corrigido)
- **[2026-07-07T13:25]** - *big-pickle* - `[Decomposto]`: decomposto em 5 subtasks
