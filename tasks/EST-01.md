---
id: EST-01
title: "Bootstrap do monorepo Estaleiro (apps/estaleiro/ + packages/plugin-* scaffold)"
status: draft:placeholder
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
capacity_target: # a fixar no endurecimento (pass 2)
---

# EST-01 · Bootstrap do monorepo Estaleiro

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Primeira task do épico Estaleiro** — cria o esqueleto onde as demais
  EST-* vão trabalhar. Executa no monorepo do **superapp** (código), não no Docs.
- **Fonte canônica:** `docs/rfcs/rfc-018-estaleiro.md` — RFC aceito, 26/26 decisões tomadas.

## 1. Objetivo
Criar o scaffold do monorepo: `apps/estaleiro/{core,ui}/` (cascas vazias, buildáveis) e
`packages/` preparado para receber os pacotes `@plataforma/plugin-*` (RFC-018 §2 G1, §3). Sem
lógica de negócio — só workspace, tooling (turborepo/pnpm-workspace), build/test/lint rodando
verde em cascas vazias. É a fundação de que todas as outras EST-* dependem.

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (tabela de decisões G1/G2) e §3 (diagrama de arquitetura-alvo) — FONTE.
- [ ] Padrão de workspace já usado no monorepo do superapp (pnpm-workspace.yaml, turbo.json existentes).

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/core/` (package.json mínimo, buildável)
- **[CREATE]** `apps/estaleiro/ui/` (package.json mínimo, buildável)
- **[UPDATE]** `pnpm-workspace.yaml` — incluir `apps/estaleiro/*` e `packages/plugin-*`
- **[UPDATE]** `turbo.json` se necessário para os novos workspaces

## 4. Estratégia de Testes
- [ ] `pnpm install` resolve sem erro; `pnpm build`/`pnpm lint` na raiz incluem os novos workspaces vazios sem quebrar o build existente.

## 5. Instruções de Execução
1. Scaffold mínimo, sem código de negócio.
2. Confirmar que o build da raiz (pacotes existentes do superapp) não regride.
3. Gate → §8.

## 6. Feedback de Especificação
- Epic de fundação — endurecer com `/endurecer-task` antes de executar (paths exatos, comandos exatos do monorepo real).

## 7. Definition of Done (DoD)
- [ ] Workspaces novos existem e resolvem via pnpm?
- [ ] Build/lint da raiz continuam verdes?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm install && pnpm build && pnpm lint
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
