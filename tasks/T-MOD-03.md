---
id: T-MOD-03
title: "sessao como doc Automerge efemero local-first + opt-in de persistencia + profile como co-editor"
status: draft
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-MOD-01", "T-403"] # ModuleProfile (profile como co-editor) + Automerge Repo (documentos casca)
blocks: ["T-MOD-04"] # Bloqueia vetores de segurança
---

# T-MOD-03 · sessao como doc Automerge efemero local-first + opt-in de persistencia + profile como co-editor

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Package:** `@plataforma/core` (sessão colaborativa) + `@plataforma/transport` (Automerge Repo integração)
- **Test Runner:** `vitest` (Node puro) + `playwright` (E2E colaboração)
- **Capacidade-alvo:** sonnet
- **#fontes:** 6 | **link OK:** ✓ — fonte normativa em `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md` §4

## 1. Objetivo
Implementar sessão colaborativa de módulo: toda edição em módulo é modelada como um **documento Automerge efêmero e local-first** (CRDT em RAM, sem persistência automática). A persistência no grafo como `CONTENT:DOCUMENT` depende de **opt-in explícito** do usuário (gênese de rascunho ou publicação). O profile do módulo atua como **co-editor**: propõe alterações no documento via `CONTENT:INTENT`, respeitando o fluxo de commit do Automerge Repo (changes incrementais → heurística de consolidação → snapshot binário → nó-versão). Sessão sem opt-in = descartada ao fechar; com opt-in = commit gera aresta `MUTATES` + `AUTHORED`. **(Fonte: [[sessao-colaborativa]]; [[automerge-repo]]; [[profile-de-modulo]]; T-MOD-01 ModuleProfile; T-403 Automerge Repo/casca)**

> ✓ **Fonte localizada (correção 2026-06-19):** NÃO é lacuna de design. A sessão como doc colaborativo
> (profile do módulo como co-editor) está em `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md`
> §4 — o link anterior apontava `caderno-3-sdk/` por engano. Worker: derive/valide contra §4.

## 2. Contexto RAG (Spec-Driven Development)
- **[READ]** `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md` §4 — **fonte normativa**: sessão como doc Automerge, profile do módulo como co-editor (intents)
- **[READ]** `docs/conceitos/sessao-colaborativa.md` — doc Automerge efêmero local-first, opt-in de persistência, profile como co-editor via CONTENT:INTENT
- **[READ]** `docs/conceitos/automerge-repo.md` — camada de orquestração: changes, consolidação, commit, nó-versão, ephemeral messages
- **[READ]** `docs/conceitos/profile-de-modulo.md` — profile delegado como ator na sessão
- **[READ]** `packages/core/src/module/profile.ts` — `ModuleProfile` (T-MOD-01)
- **[READ]** `packages/transport/src/automerge/automergeShell.ts` — `AutomergeShell`, `DocumentoEscama` de T-403

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/module/profile.ts` — `ModuleProfile` (T-MOD-01)
- **[READ]** `packages/core/src/module/messaging.ts` — `sendIntent()` (T-MOD-01)
- **[READ]** `packages/transport/src/automerge/automergeShell.ts` — `AutomergeShell`, `DocumentoEscama` (T-403)
- **[CREATE]** `packages/core/src/module/session.ts` — `createSession(moduleProfile, moduleId)`, `commitSession(sessionId)`, `discardSession(sessionId)`
- **[CREATE]** `packages/core/src/module/__tests__/session.test.ts` — testes de ciclo de vida de sessão
- **[UPDATE]** `packages/core/src/index.ts` — export barrel
- **FORA DE ESCOPO:** UI de edição colaborativa (cursor, seleção), WebRTC signaling (T-403 já provê), co-assinatura multi-sig de commits

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Casos de teste:**
  1. `createSession(moduleProfile, 'erp')` inicia documento Automerge em RAM com `ModuleProfile` como co-editor inicial
  2. Múltiplos `ModuleProfile` (ERP + CRM do mesmo usuário) podem co-editar a mesma sessão
  3. `commitSession(sessionId)` com opt-in: changes consolidadas → nó `CONTENT:DOCUMENT` com aresta `MUTATES` da versão anterior + `AUTHORED` pelo profile
  4. `discardSession(sessionId)`: documento em RAM é descartado, sem nó no grafo, sem efeito colateral
  5. Sessão sem opt-in (fechar sem commit): documento desaparece, RAM liberada
  6. Concorrência: dois co-editores propõem alterações conflitantes → Automerge CRDT resolve deterministicamente (última alteração visível a ambos)
  7. Sessão reaberta: `createSession` com `sessionId` existente (já commitado) → carrega nó-versão mais recente do grafo como base
- [ ] **Fora de Escopo:** E2E colaboração multi-dispositivo, WebRTC swarm formation, co-assinatura

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO persistir automaticamente — toda persistência requer opt-in explícito
> - NÃO criar nó `CONTENT:DOCUMENT` sem consolidação (3s inatividade ou 100 changes pendentes — heurística do Automerge Repo)
> - NÃO implementar CRDT próprio — delegar ao Automerge Repo de T-403

### Pegadinhas conhecidas
- **Opt-in, não auto-save:** a sessão é efêmera por padrão. Auto-save sem consentimento do usuário viola o modelo local-first e o princípio de que o grafo só cresce com intenção explícita. O commit deve ser uma ação disparada pelo usuário (ou workflow), não um timer automático.
- **Profile como co-editor, não owner:** o `ModuleProfile` propõe alterações via `CONTENT:INTENT`, mas o nó `AUTHORED` aponta para o `PROFILE` do usuário, não para o módulo. O módulo é instrumento, não autor.
- **Consolidação antes do commit:** `commitSession()` deve chamar `Automerge.save(doc)` e aguardar o snapshot binário. Commitar changes não-consolidadas gera nó-versão incompleto. Usar o gatilho do T-403 (3s inatividade ou 100 changes).
- **Sessão vs documento:** o `sessionId` é um identificador de sessão (efêmero, em RAM). O `documentId` (entity_id do nó `CONTENT:DOCUMENT`) só existe após o primeiro commit. Não confundir os dois — uma sessão pode nunca gerar um documento.

1. **[TDD]** `packages/core/src/module/__tests__/session.test.ts`: cenários 1–7
2. **[IMPL]** `packages/core/src/module/session.ts`: `createSession()`, `commitSession()`, `discardSession()`
3. **[REFACTOR]** Garantir deferência ao `AutomergeShell` de T-403 — não reimplementar lógica de consolidação/commit

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões resolvidas pelo Arquiteto:**
> - Contexto RAG: `sessao-colaborativa` + `automerge-repo` + `profile-de-modulo` (caderno fonte não localizado)
> - Escopo: `packages/core/src/module/session.ts` — 1 arquivo fonte, 1 teste, 1 update
> - Contratos: `createSession()`, `commitSession()`, `discardSession()`
> - Testes: 7 cenários Vitest (Node puro)
> - Gate: `pnpm --filter @plataforma/core build && pnpm --filter @plataforma/core test`
> - #aberto: 0

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados?
- [ ] Sessão é efêmera por padrão (sem opt-in = sem nó no grafo)?
- [ ] `commitSession()` consolida changes via Automerge e gera nó `CONTENT:DOCUMENT` com arestas `MUTATES` + `AUTHORED`?
- [ ] `discardSession()` libera RAM sem efeito colateral no grafo?
- [ ] Automerge CRDT resolve conflitos deterministicamente (cenário 6)?
- [ ] `pnpm lint` não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer (sem auto-save, sem CRDT próprio, sem commit sem consolidação)?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/core build      # tsc — precisa terminar sem erro
pnpm --filter @plataforma/core test       # precisa ficar verde, sem regressão
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
