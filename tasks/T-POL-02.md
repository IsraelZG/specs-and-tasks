---
id: T-POL-02
title: "Polish: T-010 system-peer (dead vi import, header redundante)"
status: draft
complexity: 1
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# T-POL-02 · Polish: T-010 system-peer (dead vi import, header redundante)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
Aplicar 2 melhorias (MINOR) identificadas pelo reviewer na T-010 (Peer do sistema v0 + admin). Mudanças cosméticas de cleanup, sem alterar comportamento.

Itens a corrigir (origem: `tasks/T-010.md` Seção 8 / QA Report 2026-06-22T19:57):
- **mn2:** `vi` importado em `tests/admin.test.ts:1` mas nunca referenciado em lugar nenhum do arquivo. Remover do import.
- **mn3:** `req.header('authorization') ?? req.header('Authorization')` redundante em 3 lugares — Express `req.header()` é case-insensitive. Manter só a primeira chamada.

Os outros 2 minors da T-010 (mn1 `resolveAdminToken` em arquivo separado, mn4 `/control/registry` não documentado) são **decisões documentadas de design** e NÃO devem ser alterados.

## 2. Contexto RAG (Spec-Driven Development)
- [tasks/T-010.md](../tasks/T-010.md) — Seção 8 (Parecer do Revisor com mn1-mn4)
- Worktree de referência: `C:\Dev2026\.superapp-worktrees\T-010\` (branch `task/T-010`)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `apps/system-peer/tests/admin.test.ts` (linha 1: import statement)
- **[READ]** `apps/system-peer/src/admin.ts` (linha 5: header fallback)
- **[READ]** `apps/system-peer/src/server.ts` (linha 46 e linha 84: header fallback duplicado)
- **[UPDATE]** `apps/system-peer/tests/admin.test.ts`
  - Linha 1: remover `, vi` do import — manter `import { describe, it, expect, beforeAll, afterAll } from 'vitest';`
- **[UPDATE]** `apps/system-peer/src/admin.ts`
  - Linha 5: trocar `req.header('authorization') ?? req.header('Authorization')` por `req.header('authorization')`.
- **[UPDATE]** `apps/system-peer/src/server.ts`
  - Linha 46 e linha 84: mesma troca acima em ambos os call sites.
- **NÃO EDITAR** nada além desses 3 arquivos. Não mexer em `adminToken.ts` (mn1) nem em `/control/registry` (mn4).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Métricas/Cobertura:** os 13 testes de T-010 devem continuar verdes; nenhuma regressão.
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/system-peer test` em `C:\Dev2026\.superapp-worktrees\T-010\`.
- [x] **Fora de Escopo:** novos testes, mudanças de comportamento, alteração de API.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO mexer em `adminToken.ts` (mn1 é separação deliberada de arquivos, decisão de design).
> - NÃO mexer no endpoint `/control/registry` (mn4 é infra de teste M0 documentada).
> - NÃO trocar `req.header('authorization')` por `req.header('Authorization')` — manter minúsculo, é o que o Express retorna nativamente.

### Pegadinhas conhecidas
- **mn2:** o `vi` foi importado originalmente pensando em mocks que não foram usados. Remover com cuidado — checar com grep que não há `vi.` no arquivo antes de remover.
- **mn3:** Express normaliza headers para lowercase. O `??` com versão capitalized é não-apenas-redundante, é literalmente dead code. Trocar direto, sem testes extras — lint+test existentes já exercitam o caminho.
- Se `pnpm lint` reclamar de `no-unused-imports` no test file, é exatamente o que queremos corrigir (o lint pode ter passado no `done` original por outro motivo — verificar).

1. **[mn2]** Editar `tests/admin.test.ts:1`: remover `, vi` do import.
2. **[mn3]** Editar `src/admin.ts:5`: trocar `req.header('authorization') ?? req.header('Authorization')` por `req.header('authorization')`.
3. **[mn3]** Editar `src/server.ts:46`: mesma troca.
4. **[mn3]** Editar `src/server.ts:84`: mesma troca.
5. Rodar `pnpm --filter @plataforma/system-peer lint && pnpm --filter @plataforma/system-peer build && pnpm --filter @plataforma/system-peer test`. 13/13 testes verdes.
6. Commit: `polish(T-010): remove dead vi import + redundante case-insensitive header fallback`.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado]* — itens vêm do QA Report literal da T-010.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
cd C:/Dev2026/.superapp-worktrees/T-010
pnpm --filter @plataforma/system-peer lint   # eslint src/ tests/  — 0 erros
pnpm --filter @plataforma/system-peer build  # tsc                  — 0 erros
pnpm --filter @plataforma/system-peer test   # vitest               — 13/13 verdes
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
