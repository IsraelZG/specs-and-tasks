---
id: EST-70
title: "Agrupamento Híbrido de Tasks por Épicos / Campanhas"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-03", "EST-69"]
blocks: ["EST-71"]
capacity_target: sonnet
ui: true
test_profile: full
---

# EST-70 · Agrupamento Híbrido de Tasks por Épicos / Campanhas

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-70`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest, Playwright.
- **Capacidade-alvo:** sonnet (modelo de dados de Épicos Híbridos, inferência e UI de filtro/agregação).

## 1. Objetivo
Implementar o sistema de **Épicos / Campanhas Híbridos** no `plugin-tasks` e no `estaleiro-ui`:
1. **Inferência Automática:** O sistema infere o Épico default pelo prefixo do ID da task (ex.: `EST-` $\rightarrow$ Épico *Estaleiro*, `T-DS-` $\rightarrow$ Épico *Design System*, `DMM-` $\rightarrow$ Épico *DMM & Orquestrador*, `C-` $\rightarrow$ Épico *Cleanups*).
2. **Atribuição/Criação Manual:** Permite criar Épicos customizados (`epicId`) e associar/desassociar tasks manualmente pela UI.
3. **Filtros e Métricas:** Filtro por Épico no Board de Tasks e pílulas visuais agregando a porcentagem de progresso (% de tasks concluídas).

## 2. Contexto RAG
- [especificação do Estaleiro §5.2](../docs/especificacao-estaleiro.md) — Árvore de Tasks e Visão em Lote.
- EST-03 — `plugin-tasks` e schema SQLite de tasks.
- EST-69 — Projeção do Grafo de Tasks no FlowGrid.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-tasks/src/schema.ts`.
- **[UPDATE]** `packages/plugin-tasks/src/schema.ts` — adicionar tabela `epics` (`id`, `title`, `color`, `prefixPattern`) e coluna `epic_id` na tabela `tasks`.
- **[UPDATE]** `packages/plugin-tasks/src/task.service.ts` — lógica de inferência de Épico por prefixo de ID e CRUD de Épicos.
- **[UPDATE]** `packages/plugin-tasks/src/routes.ts` — expor endpoints `GET /api/epics`, `POST /api/epics`, `PUT /api/tasks/:id/epic`.
- **[UPDATE]** `apps/estaleiro/ui/src/views/BoardView.tsx` — adicionar a barra de seletor de Épicos e indicador de progresso do Épico ativo.
- **[CREATE]** `packages/plugin-tasks/test/epicService.test.ts` — testes de inferência por prefixo e atribuição manual.

## 4. Estratégia de Testes Estrita
1. **Inferência por Prefixo:** Uma task criada com ID `EST-69` sem `epicId` explícito tem seu Épico inferido automaticamente como "Estaleiro" (`EST`).
2. **Sobrescrita Manual:** Atribuir manualmente um `epicId` customizado a uma task sobrescreve a inferência automática.
3. **Agregação de Progresso:** `GET /api/epics` retorna a contagem de tasks totais, tarefas `done` e a porcentagem de conclusão do Épico.

## 5. Não fazer
- NÃO exigir migração destrutiva do banco SQLite (usar alter table / migration graciosa).

## 6. Feedback de Especificação
- Spec triada com base na decisão aprovada pelo usuário de suportar Épicos Híbridos (prefixo automático + atribuição manual).

## 7. Gate por Comando
```bash
pnpm gate @plataforma/plugin-tasks --profile full
```

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-22T21:57]** - *gemini-3.6-flash* - `[Triado]`: Spec criada baseada na aprovacao do Bloco 1.
