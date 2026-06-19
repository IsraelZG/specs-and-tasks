---
id: T-MOD-02
title: "delegado por (usuario x modulo) escopado por ASSET:ROLE + operacoes cross-user com permissao do proprio usuario"
status: draft
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-MOD-01", "T-501"] # ModuleProfile (delegado base) + UCAN (capability para escopo)
blocks: ["T-MOD-04"] # Bloqueia vetores de segurança
---

# T-MOD-02 · delegado por (usuario x modulo) escopado por ASSET:ROLE + operacoes cross-user com permissao do proprio usuario

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Package:** `@plataforma/core` (delegação escopada + enforcement)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet
- **#fontes:** 5 | **link OK:** ✗ | **SEM-FONTE:** ⚠ RAG caderno não localizado — usando conceitos canônicos

## 1. Objetivo
Implementar o sistema de delegação escopada: cada par (usuário × módulo) recebe um UCAN próprio derivado de `ASSET:ROLE` que restringe o acesso do módulo aos dados daquele usuário naquele domínio. Operações cross-user (ex: gerente de ERP consulta pedido de subordinado) rodam **estritamente com as permissões de leitura do próprio usuário solicitante** — o módulo nunca herda permissões além das do usuário que o delegou. O `ASSET:ROLE` agrega `ASSET:PERMISSION` via arestas `AGGREGATES`; o UCAN emitido contém a query de traversal (root, depth, edge_filter) correspondente. A validação é bilateral: o peer que recebe a requisição valida a cadeia de UCAN + verifica que o `ASSET:ROLE` está ativo (aresta não-lápide). **(Fonte: [[profile-de-modulo]]; [[asset-role]]; [[ucan]]; [[asset-permission]]; T-MOD-01 ModuleProfile; T-501 UCAN motor)**

> ⚠ **SEM-FONTE:** O caderno `docs/caderno-3-sdk/02b-modulos-profiles-mensageria.md` não foi encontrado. Conceitos `profile-de-modulo`, `asset-role`, `ucan` e `asset-permission` suprem os contratos. O Worker deve validar contra essas fontes.

## 2. Contexto RAG (Spec-Driven Development)
- **[READ]** `docs/conceitos/profile-de-modulo.md` — delegação por (usuário × módulo) com ASSET:ROLE próprio
- **[READ]** `docs/conceitos/asset-role.md` — agrupamento de permissões via `AGGREGATES`, templates vs instâncias físicas
- **[READ]** `docs/conceitos/ucan.md` — capability model, query de traversal, delegação recursiva, revogação
- **[READ]** `docs/conceitos/asset-permission.md` — permissão atômica (placeholder; fonte: `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.1`)
- **[READ]** `packages/core/src/module/profile.ts` — `ModuleProfile` de T-MOD-01
- **[READ]** `packages/core/src/auth/ucan.ts` — `createUcan()`, `validateUcan()`, `delegateUcan()` de T-501

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/module/profile.ts` — `ModuleProfile`, `createModuleProfile()` (T-MOD-01)
- **[READ]** `packages/core/src/auth/ucan.ts` — `SignedUcan`, `createUcan()`, `validateUcan()` (T-501)
- **[READ]** `packages/core/src/auth/ucan-codec.ts` — codec de serialização (T-501a)
- **[CREATE]** `packages/core/src/module/delegation.ts` — `createModuleDelegation(userId, moduleId, assetRole)`, `validateCrossUserOp(requesterProfile, targetUserId, operation)`
- **[CREATE]** `packages/core/src/module/__tests__/delegation.test.ts` — testes de escopo e enforcement
- **[UPDATE]** `packages/core/src/index.ts` — export barrel
- **FORA DE ESCOPO:** UI de gestão de delegações, integração com KeyVault (liberação de chave de época)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Casos de teste:**
  1. `createModuleDelegation(userA, 'erp', erpRole)` emite UCAN com query de traversal restrita ao subgrafo do userA no módulo ERP
  2. UCAN do módulo ERP do userA NÃO autoriza leitura de nós do userB no mesmo módulo (escopo cross-user rejeitado)
  3. Operação cross-user legítima: gerente (userA) consulta pedido de subordinado (userB) → UCAN inclui `edge_filter` com `PARTICIPATES_IN → PROFILE:REPORTING` e permissão de leitura do próprio userA
  4. UCAN com `depth > 1` sem `edge_filter` → rejeitado (invariante de traversal profundo)
  5. Revogação de delegação: aresta lápide no `ASSET:ROLE` → UCAN emitido anteriormente é rejeitado na validação
  6. Delegação recursiva (A→B→C) respeita limites de traversal originais; `delegatable: false` bloqueia sub-delegação
- [ ] **Fora de Escopo:** integração com KeyVault (liberação de chave AES), sync dirigido por UCAN

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO conceder permissão de leitura cross-user sem verificar que o solicitante TEM permissão sobre o alvo
> - NÃO permitir UCAN com `depth > 1` sem `edge_filter` explícito (invariante de segurança)
> - NÃO usar o mesmo UCAN do módulo para todos os usuários — cada (usuário × módulo) tem UCAN próprio

### Pegadinhas conhecidas
- **Cross-user NÃO é admin:** "gerente vê pedido do subordinado" NÃO significa que o módulo ganha acesso irrestrito ao grafo do subordinado. O UCAN deve incluir `edge_filter` que limita a traversal ao reporting chain (ex: `PARTICIPATES_IN → PROFILE:REPORTING`).
- **Dois níveis de validação:** (a) UCAN válido e não-revogado; (b) operação está dentro do escopo do UCAN. O teste deve cobrir ambos — um UCAN de CRM não autoriza operação de ERP mesmo se válido.
- **Asset:Role vs cargo organizacional:** `ASSET:ROLE` do módulo define permissões técnicas (quais arestas/nós acessar). Cargo organizacional (gerente, diretor) é um fato social separado (aresta `PARTICIPATES_IN`). Não confundir os dois — o UCAN valida o técnico; o fato social define QUEM é subordinado de QUEM.
- **Delegação de UCAN não é clone de chave:** delegar um UCAN (A→B) emite um novo token com audiência B e chain de prova. A chave privada de A nunca sai de A. Implementar como `delegateUcan(originalUcan, delegateKey)` → novo `SignedUcan`.

1. **[TDD]** `packages/core/src/module/__tests__/delegation.test.ts`: cenários 1–6
2. **[IMPL]** `packages/core/src/module/delegation.ts`: `createModuleDelegation()`, `validateCrossUserOp()`
3. **[REFACTOR]** Garantir que `validateCrossUserOp` consulta o grafo (arestas `DELEGATED_TO`, `AGGREGATES`, `PARTICIPATES_IN`), não faz lookup em tabela estática

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões resolvidas pelo Arquiteto:**
> - Contexto RAG: `profile-de-modulo` + `asset-role` + `ucan` + `asset-permission` (caderno fonte não localizado)
> - Escopo: `packages/core/src/module/delegation.ts` — 1 arquivo fonte, 1 teste, 1 update
> - Contratos: `createModuleDelegation()`, `validateCrossUserOp()`
> - Testes: 6 cenários Vitest (Node puro)
> - Gate: `pnpm --filter @plataforma/core build && pnpm --filter @plataforma/core test`
> - #aberto: 0

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados?
- [ ] UCAN de módulo é escopado por (usuário × módulo) e rejeita acesso a outros usuários?
- [ ] Operações cross-user passam por `validateCrossUserOp()` e verificam permissão do solicitante?
- [ ] Invariante de traversal profundo (`depth > 1 → edge_filter` obrigatório) é aplicada?
- [ ] Revogação de `ASSET:ROLE` (aresta lápide) invalida UCANs emitidos?
- [ ] `pnpm lint` não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

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
