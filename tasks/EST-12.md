---
id: EST-12
title: "plugin-skills: gerenciamento de skills/agentes/CLAUDE.md do Estaleiro, edições refletidas no repo via git"
status: draft:triaged
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: sonnet # gerencia skills/agentes/CLAUDE.md, edicoes refletidas via git
---

# EST-12 · plugin-skills

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-skills/`. **Componente NOVO** (RFC-018 B5) — nasceu
  da resposta "os dois convivem" (skills do Claude Code continuam existindo, mas o gerenciamento
  delas — e de configs de agente/CLAUDE.md — passa a ser feito por este plugin, com edições
  internas refletidas no repositório via fluxo git normal).

## 1. Objetivo
Implementar um plugin que **gerencia** (lista, edita, versiona) skills, perfis de agente e
CLAUDE.md equivalentes usados pela frota do Estaleiro — a UI (EST-14) expõe essa gestão; toda
edição feita ali é persistida de volta ao repositório via git (commit normal, não a fila
especial do Docs — este é o repo de código do superapp, onde git funciona normalmente por
task/worktree). Não substitui as skills do Claude Code em si — gerencia a configuração delas.

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (B5) — a decisão exata (skills convivem; gestão via Estaleiro; reflexo em git).
- [ ] **RFC-018 §6.4 (fronteira com plugin-knowledge):** os dois compartilham o mecanismo raso
      "CRUD de markdown + commit serializado" mas servem domínios distintos — NÃO mesclar. Regra:
      escrita de arquivo SEMPRE via `plugin-fs-tools` mediado (nunca fs direto), e o utilitário de
      fila-de-commit-serial é COMPARTILHADO com EST-13 (um só, não duas implementações).
- [ ] `.claude/skills/` (Docs, padrão atual) — a forma de skill markdown a gerenciar/editar.
- [ ] `CLAUDE.md` (projeto) — o tipo de configuração de agente que este plugin também gerencia.
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §3 — diferente do Docs (fila serial), aqui é código: git direto por worktree, como o resto do superapp.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-skills/src/{list,edit,commit}.*` — CRUD de skills/config + persistência git.
- **[CREATE]** testes de roundtrip (editar via API → arquivo atualizado → commit registrado).

## 4. Estratégia de Testes
- [ ] Editar uma skill via API do plugin resulta em arquivo atualizado no repo E um commit git rastreável; listar reflete o estado atual do repo (não cache desatualizado).

## 5. Instruções de Execução
1. CRUD básico sobre arquivos de skill/config.
2. Persistência via commit git (padrão normal do superapp, não a fila do Docs).
3. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 B5. Este plugin NÃO segue a regra "agentes não rodam git" do Docs —
  essa regra é específica do repo de CONTROLE; aqui é o repo de código, onde git por worktree é o
  padrão normal (CLAUDE.md, seção Paralelismo).

## 7. Definition of Done (DoD)
- [ ] CRUD de skills/config funcional?
- [ ] Edição reflete em arquivo + commit git?
- [ ] Listagem reflete estado real do repo?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-skills test
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
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-skills, capacity=sonnet, depende de EST-02 (draft)
