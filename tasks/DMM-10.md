---
id: DMM-10
title: "Editor visual JDM (@gorules/jdm-editor) na view de Planejamento"
status: done
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

> **Registro histórico:** esta entrega permanece `done`, mas `@gorules/jdm-editor` foi reprovado
> como fundação visual no Estaleiro. `EST-44` o remove incrementalmente em favor do `FlowGrid`
> compartilhado da ADR 0016. O formato JDM e `@plataforma/plugin-zen-engine` continuam canônicos.

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo · UI: FlexLayout + TinyBase

## 1. Objetivo
View de Planejamento (ADR 0013 §1.2): integrar o **`@gorules/jdm-editor`** para montar/alterar
livremente a esteira de trabalho — o "cérebro" da delegação. Editar um grafo salva no formato do `plugin-workflows` (contrato DMM-01) e alimenta o default de DMM-06.
Além disso, esta aba atuará como a central **Human-in-the-Loop**, exibindo uma fila de "Pull Requests Internos" — sugestões de auto-cura geradas pelo pipeline de RL para os documentos RAG/OKF, exigindo clique explícito do operador humano para mesclagem.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §1.2 (Editor Visual JDM).
- [ ] `docs/adr/0014-contrato-no-workflow-declarativo.md` (DMM-01) — schema de nó a mapear no editor.
- [ ] `packages/plugin-workflows/src/**` — formato de grafo persistido (JDM/Zen).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** contrato de nó (DMM-01), formato de grafo do `plugin-workflows`.
- **[CREATE]** `apps/estaleiro/ui/src/views/planner/**` — wrapper do `@gorules/jdm-editor` + save/load.
- **[CREATE]** painel de aprovação "Human-in-the-Loop" listando os PRs Internos de auto-cura pendentes.
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
- `@gorules/jdm-editor` traz peso/estilos próprios; validar bundle + tema no build Vite. Se o mapeamento do schema for não-trivial, **escalar para opus-spike** (ADR de mapeamento) antes de codar.
- O editor visual deve cuspir JSON validável pelo schema do Zen.

## 6. Feedback de Especificação
- **DERIVADO**: Grafo JDM exportável como JSON puro, sem acoplamento a código, conforme `docs/adr/0014-contrato-orquestrador-declarativo.md` (DMM-01).

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-01` (acabei de marcar `draft:pending_decision` — spike que define o
  schema de nó). §1 diz: "Edita um grafo salva no formato do plugin-workflows (**contrato
  DMM-01**)" e §3 marca `[READ] contrato de nó (DMM-01), formato de grafo do plugin-workflows` —
  o **mapeamento `@gorules/jdm-editor` ↔ contrato DMM-01** é literalmente o que o spike vai
  decidir (decisão 1 do DMM-01: "schema de nó: compute vs delegated"). Inventar o mapeamento
  aqui seria reescrever o DMM-01.
- **Por que NÃO `harden`:** o spec já tem uma "escada de escape" explícita no §5: "Se o
  mapeamento do schema for não-trivial, **escalar para opus-spike** (ADR de mapeamento) antes
  de codar." Isso é coerente com o regime de DMM-01 (também opus-spike) — sem DMM-01 fechado,
  não há como saber se este aqui vira `sonnet` ou `opus-spike`.
- **Próximo passo:** após DMM-01 virar `done` (spike fechado), reendurecer (pass-2 JIT) com:
  (a) o mapeamento exato jdm-editor ↔ plugin-workflows; (b) o subset de tipos de nó a
  expor (só os da delegação, §4 "Fora de Escopo"); (c) decisão sobre o peso de bundle
  (DMM-10 §5 já alerta).
- **Capacidade-alvo (manter no frontmatter `sonnet`):** o próprio spec diz que **pode
  escalar para opus-spike** se o mapeamento for não-trivial. Isso é uma decisão de pass-2.
- **Pré-endurecimento já válido:** `ui: true`, `dependencies: [DMM-01]` consistente com
  `blocks:` de DMM-01.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Editor monta/edita um grafo que serializa para o formato do `plugin-workflows`; verificação de UI feita.
### Verificação automática
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui lint
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- View `apps/estaleiro/ui/src/views/planner/**`: `PlannerView` + lazy `JdmEditor` (`@gorules/jdm-editor` 1.52.0, só client-side) + `HitlPanel` (PRs internos mock).
- Grafo default = PoC DMM-01 (`nextStep.v1.json`); save/load localStorage; serialização `serializeJdmGraph` valida shape Zen/plugin-workflows.
- Aba **Planejamento** em `App.tsx`. Smoke: 5 testes planner (serialize round-trip, edit nó, HITL approve).
- Side-fix lint pré-existente em `decisions/hooks.ts` (console.error unsafe) e shell teste (aba Planejamento + cleanup jsdom).

Gate:
```
$ pnpm --filter @plataforma/estaleiro-ui build
✓ built in 2.25s  (7660 modules; jdm-editor lazy-split)

$ pnpm --filter @plataforma/estaleiro-ui lint
(eslint src/ — Exit 0)

$ pnpm --filter @plataforma/estaleiro-ui test
Test Files  12 passed (12)
     Tests  39 passed (39)
```

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**

**QA Report:**
- **BLOCKER**: Nenhum.
- **MAJOR**: Nenhum.
- **MINOR**: O pacote `@gorules/jdm-editor` é pesado, será necessário monitorar o tempo de carregamento no futuro.
- **INFO**: O lint issue existente em `decisions/hooks.ts` foi corrigido (side-fix). Evidência de build e testes fornecida (39/39 passed). Smoke tests UI foram mapeados no pacote.

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T18:42]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-01 ainda draft:pending_decision (spike); reendurecer JIT, possível rebaixar capacity p/ opus-spike
- **[2026-07-09T12:21]** - *Antigravity* - `[Endurecido]`: Endureceu spec com esquema JDM JSON de DMM-01
- **[2026-07-09T12:21]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-09T12:24]** - *grok* - `[Iniciado]`: iniciando
- **[2026-07-09T14:15]** - *grok* - `[Finalizado]`: planner JDM+HITL; gate build/lint/test 39/39 green
- **[2026-07-09T14:17]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando DMM-10 (qa-review --integrar)
- **[2026-07-09T14:46]** - *agile_reviewer:Antigravity* - `[Aprovado]`: Integrado: merge na master, worktree removida, Gate verde (39/39). 2 não-bloqueantes -> ledger de pendências.
