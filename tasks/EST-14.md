---
id: EST-14
title: "Frontend do Estaleiro: semente Lovable A1 (FlexLayout+TinyBase), 5 views, 1 canal WS único"
status: draft:triaged
complexity: 6
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-03", "EST-06", "EST-10", "EST-13"]
blocks: []
capacity_target: sonnet # frontend FlexLayout+TinyBase, 5 views — complexidade 6, requer decomposicao
---

# EST-14 · Frontend do Estaleiro

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/ui/`. **DEVE ser decomposta** (complexidade 6 > limiar
  5). Sugestão de seams para `/endurecer-task`: 1 subtask por view (board, decisões, frota,
  docs/RAG, custo) + 1 subtask de infraestrutura (WS único, F3).

## 1. Objetivo
Construir a UI do Estaleiro a partir da **semente do projeto Lovable A1** (shell FlexLayout +
TinyBase + tokens, já verificado — F1), com as **5 views mantidas no v1** (F2): board de tasks
(consome `plugin-tasks`, EST-03), fila de decisões do arquiteto, painel de frota ao vivo (consome
`plugin-agent-harness`, EST-06, e `plugin-providers`/telemetria, EST-10/11), navegador docs/RAG
(consome `plugin-knowledge`, EST-13), e painel de custo. **Um canal WebSocket só** (F3) — reusa o
stream de eventos já construído no ADR-0008 §D/ORQ-10, sem inventar transporte novo pro board.

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (F1, F2, F3) e §3 (diagrama, "ui" do Estaleiro).
- [ ] Projeto Lovable A1 (preview `https://id-preview--7f5a44a2-6bf8-4330-a3a8-f9740e8d80a9.lovable.app`) — shell FlexLayout+TinyBase+tokens já construído e verificado, a semente.
- [ ] `docs/caderno-3-sdk/28-shell-e-composicao.md` — padrão de colunas FlexLayout já canônico no produto (mesma linguagem visual).
- [ ] `docs/adr/0008-agent-adapter-in-process.md` §D — protocolo de eventos que a view de frota consome via o canal WS único.
- [ ] **`docs/_vendor/orca/`** (clone raso local, MIT) — padrões de UX para a view de frota
      (fan-out N worktrees, diff annotation, task→worktree); no endurecimento, citar os
      componentes/telas exatos dentro do vendor que servem de referência (RFC-018 §6.6).

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/ui/src/views/{board,decisions,fleet,knowledge,cost}/*`.
- **[CREATE]** `apps/estaleiro/ui/src/ws/*` — canal único de sincronização.
- **[UPDATE]** shell FlexLayout (importado do A1) com as 5 views como painéis/colunas.

## 4. Estratégia de Testes
- [ ] Cada view renderiza com dados fake antes de integrar (Storybook-like ou fixture); teste de integração do canal WS (evento chega → TinyBase atualiza → UI re-renderiza).

## 5. Instruções de Execução
1. **Rodar `/endurecer-task` primeiro** — decompor em 1 subtask por view + infraestrutura WS.
2. Importar semente A1, adaptar pro wrapper standalone (EST-15 define o empacotamento).
3. Views por ordem de dependência pronta: board (EST-03) → frota (EST-06/10) → docs/RAG (EST-13) → decisões → custo.
4. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 F1/F2/F3. Não cortar views sem decisão do arquiteto (F2 já resolveu:
  mantém as 5).

## 7. Definition of Done (DoD)
- [ ] Semente A1 importada e adaptada?
- [ ] 5 views funcionais com dados reais dos plugins correspondentes?
- [ ] Canal WS único, sem transporte duplicado?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui build
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
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — frontend Lovable A1 5 views, capacity=sonnet, complexidade 6 exige decomposicao, depende de EST-03/06/10/13 (draft)
