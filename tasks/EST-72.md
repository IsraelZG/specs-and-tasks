---
id: EST-72
title: "Task Inspector em Coluna Adjunta FlexLayout"
status: draft:triaged
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-45", "EST-69", "EST-71"]
blocks: []
capacity_target: sonnet
ui: true
test_profile: ui
---

# EST-72 · Task Inspector em Coluna Adjunta FlexLayout

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-72`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Playwright, Vitest.
- **Capacidade-alvo:** sonnet (desenvolvimento de componente de inspeção em coluna adjunta no FlexLayout).

## 1. Objetivo
Implementar o painel microscópico **Task Inspector** como uma coluna adjunta no layout **FlexLayout** (`@plataforma/shell`), que é aberta à direita ao clicar em qualquer nó de task no Board/FlowGrid:
- **Navegação em Profundidade (§2 da especificação):** O contexto da task abre sem sobrepor modais, mantendo o Board visível ao lado.
- **Abas de Inspeção:** Visão Geral (Markdown da spec, metadados MGTIA), Grafo Local (antecessores e sucessores diretos), Worktree & Diffs (arquivos modificados) e Stream de Logs do Harness ao Vivo.
- **Controle de Transições MGTIA:** Botões de ação (`start`, `pause`, `finish`, `rework`) e disparo de despacho individual/galho.

## 2. Contexto RAG
- [especificação do Estaleiro §2](../docs/especificacao-estaleiro.md) — Paradigma de Interface (FlexLayout e Colunas Adjuntas).
- EST-45 — Migração do shell para `@plataforma/shell`.
- EST-69 — Grafo FlowGrid e evento de seleção de nó.
- EST-71 — Ações de despacho granular.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/shell/src/FlexLayoutShell.tsx`.
- **[READ]** `apps/estaleiro/ui/src/views/BoardView.tsx`.
- **[CREATE]** `apps/estaleiro/ui/src/components/TaskInspectorColumn.tsx` — componente da coluna de inspeção com as 4 abas (Visão Geral, Grafo Local, Diffs, Logs).
- **[UPDATE]** `apps/estaleiro/ui/src/views/BoardView.tsx` — integrar a abertura dinâmica da coluna `TaskInspectorColumn` no FlexLayout ao selecionar um card.
- **[CREATE]** `apps/estaleiro/ui/test/TaskInspectorColumn.test.tsx` — testes de renderização de abas e gatilho de transições MGTIA.

## 4. Estratégia de Testes Estrita
1. **Abertura em Coluna Adjunta:** Clicar num card no Board insere uma nova aba/painel à direita no FlexLayout com o ID e título da task selecionada.
2. **Navegação por Abas:** Alternar entre Visão Geral, Grafo Local, Diffs e Logs atualiza os dados apresentados sem perder a referência da task.
3. **Transição de Status MGTIA:** Clicar no botão `start` ou `finish` envia o comando para a API e atualiza os metadados do inspector em tempo real.

## 5. Não fazer
- NÃO utilizar modais flutuantes sobrepostos (dialog/popover em tela cheia) — respeitar estritamente a diretriz de layout FlexLayout em colunas.

## 6. Feedback de Especificação
- Spec triada e alinhada com o paradigma de interface em colunas da especificação do Estaleiro.

## 7. Gate por Comando
```bash
pnpm gate apps/estaleiro --profile ui
```

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-22T21:57]** - *gemini-3.6-flash* - `[Triado]`: Spec criada baseada na aprovacao do Bloco 1.
