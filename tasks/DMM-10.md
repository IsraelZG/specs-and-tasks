---
id: DMM-10
title: "Editor visual JDM (@gorules/jdm-editor) na view de Planejamento"
status: draft:placeholder
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
ui: true
dependencies: ["DMM-01"]
blocks: []
capacity_target: sonnet # pode escalar p/ opus-spike se o mapeamento schema jdm-editor ↔ contrato DMM-01 for não-trivial
---

# DMM-10 · Editor visual JDM (@gorules/jdm-editor)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo · UI: FlexLayout + TinyBase

## 1. Objetivo
View de Planejamento (ADR 0013 §1.2): integrar o **`@gorules/jdm-editor`** para montar/alterar
livremente a esteira de trabalho — o "cérebro" da delegação (Tradução → Macro Planejamento →
Exploração → Edição). Editar um grafo salva no formato do `plugin-workflows` (contrato DMM-01) e
alimenta o default de DMM-06 / a execução.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §1.2 (Editor Visual JDM).
- [ ] `docs/adr/0014-contrato-no-workflow-declarativo.md` (DMM-01) — schema de nó a mapear no editor.
- [ ] `packages/plugin-workflows/src/**` — formato de grafo persistido (JDM/Zen).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** contrato de nó (DMM-01), formato de grafo do `plugin-workflows`.
- **[CREATE]** `apps/estaleiro/ui/src/views/planner/**` — wrapper do `@gorules/jdm-editor` + save/load.
- **[UPDATE]** `apps/estaleiro/ui/package.json` — dep `@gorules/jdm-editor`; `App.tsx` — aba Planejamento.

## 4. Estratégia de Testes Estrita
- **UI (ui: true):** smoke (montar editor, editar um nó, serializar → grafo válido do plugin-workflows)
  OU verificação manual do revisor. Marcar no Parecer.
- **Fora de Escopo:** todos os tipos de nó do JDM — só os nós da delegação (DMM-02…05).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** inventar um schema paralelo — o editor serializa para o formato do `plugin-workflows` (DMM-01).
> - **NÃO** trazer backend/servidor do `@gorules/zen` — só o editor visual client-side.

### Pegadinhas conhecidas
- `@gorules/jdm-editor` traz peso/estilos próprios; validar bundle + tema no build Vite. Se o mapeamento
  do schema for não-trivial, **escalar para opus-spike** (ADR de mapeamento) antes de codar.

## 6. Feedback de Especificação
- *[preencher no endurecimento]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Editor monta/edita um grafo que serializa para o formato do `plugin-workflows`; verificação de UI feita.
### Verificação automática
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui lint
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
