---
id: T-601-rework-1
title: "Rework-1 de T-601: rebase contra rework-3 + MERGES (RFC-028) + maxDepth recursivo + projectProvisionalHead async"
status: ready # bloqueante (B4) resolvido pela RFC-028 — spec sem decisões em aberto
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-108"] # T-108 provê insertNode/hashNode/parentHash único (rework-3 já em master)
blocks: ["T-601"] # rework-1 destrava a T-601, que por sua vez destrava T-108 (em blocked)
capacity_target: sonnet
---

# T-601-rework-1 · Rework-1 de T-601: rebase contra rework-3 + MERGES (RFC-028) + maxDepth recursivo + projectProvisionalHead async

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo — pacote alvo: `packages/core/`
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet
- **Branch alvo (worktree):** `task/T-601-rework-1` criada a partir de `master` ATUAL (que contém o rework-3 de T-108 via `6cfb5ba`)
- **Pacote alvo:** `@plataforma/core`

## 1. Objetivo
Executar a rework-1 da T-601 (que está em `rework` desde o Cycle 1 review de 2026-06-26) — aplicar os 4 BLOCKERs + 2 MAJORs do Parecer do Revisor em UM ÚNICO DIFF aditivo contra o master ATUAL, seguindo as decisões da RFC-028 (absorvida em 2026-06-26 — ver `docs/adr/0005-aresta-merges.md` e verbete `docs/conceitos/merges.md`). Em particular: (1) basear o branch em master pós-rework-3 (sem reversões), (2) `resolveFork` seta `parentHash = hashNode(forkPoint)`, (3) `detectStructuralFork` recursivo até `maxDepth`, (4) `resolveFork` cria 1 aresta `MUTATES` (merge→forkPoint) + N arestas `MERGES` (merge→branchTip), (5) `projectProvisionalHead` async + cross-check com `entity_heads`.

### Contratos exatos (assinaturas TS fixadas) — já na T-601, com emenda da RFC-028

Mantidas as três assinaturas (`detectStructuralFork`, `resolveFork`, `projectProvisionalHead`) ver T-601 §1.

Mudanças contratuais da rework-1:

1. **`resolveFork`** — pós `insertNode(storage, mergeNode, fork.forkPoint.id)` (cria `MUTATES` merge→forkPoint), criar N arestas `MERGES` (uma por `branchTip.id`) em transação separada:
   ```ts
   await storage.transaction(async () => {
     for (const branchId of fork.branchTips) {
       await storage.exec(
         `INSERT INTO edges (id, type, entity_id, source_id, target_id,
                             previous_hash, payload, epoch, active, created_at,
                             hlc, signature)
          VALUES (?, 'MERGES', ?, ?, ?,
                  NULL, NULL, ?, 1, unixepoch(),
                  ?, ?)`,
         [`${mergeNode.id}->${branchId}#MERGES`, mergeNode.entity_id,
          mergeNode.id, branchId, /*epoch*/ 0,
          String(mergeHlc), mergeNode.signature],
       );
     }
   });
   ```
   Obs: a coluna real da tabela `edges` para o tipo chama-se `type` (não `edge_type`). Confirmar via `PRAGMA table_info(edges)` na primeira execução; ajustar `NULL` em `previous_hash` (já confirmado nullable em caderno-3/01 §1).

2. **`detectStructuralFork`** — implementar recursiva com `maxDepth` (default 100), filtrando ramos que já são `target_id` de algum `MERGES` (resolvidos):
   ```ts
   const resolved = new Set<ULID>(
     (await storage.exec(
       "SELECT target_id FROM edges WHERE type = 'MERGES'"
     )).map(r => r.target_id as ULID)
   );
   ```
   Ignorar branchTips ∈ `resolved`. Ver RFC-028 §2.Ajuste-em-detectStructuralFork.

3. **`projectProvisionalHead`** — assinatura `async ... Promise<SignedNode>` + cross-check com `entity_heads` (ver T-601 §8.1 [M2] e [M1]).

## 2. Contexto RAG (Spec-Driven Development)
- [tasks/T-601.md §8.1](../tasks/T-601.md) — Handoff para o arquiteto com a sequência passo-a-passo, os 4 BLOCKERs e os 2 MAJORs (esta rework segue a §7 da T-601)
- [docs/adr/0005-aresta-merges.md](../docs/adr/0005-aresta-merges.md) — ADR que registra a escolha `MERGES` (RFC-028 absorvida)
- [docs/conceitos/merges.md](../docs/conceitos/merges.md) — verbete canônico + I-MERGES-1..6
- [docs/caderno-2-protocol/04-automerge-integration-spec.md §4.2](../docs/caderno-2-protocol/04-automerge-integration-spec.md) — passo 3 e 4 reescritos pela RFC-028
- [tasks/T-108-rework-3.md](../tasks/T-108-rework-3.md) — base do `parentHash` único que esta rework preserva
- [tasks/T-108.md §1](../tasks/T-108.md) — `insertNode`, `detectFork`, `getLineage`, `hashNode` (T-108)
- [packages/core/src/lineage.ts](../../superapp/packages/core/src/lineage.ts) — `insertNode`, `getLineage`, `hashNode`, `bytesEqual`, `ZERO_HASH` (pós-rework-3)
- [packages/core/src/signature.ts](../../superapp/packages/core/src/signature.ts) — `SignedNode`, `canonicalizeNode` (pós-rework-3, com `parentHash`)
- [PITFALLS.md P-009](../PITFALLS.md) — validação do branch base (ver Seção 0 acima)

## 3. Escopo de Arquivos (Inputs e Outputs)
Trabalho no worktree `C:/Dev2026/.superapp-worktrees/T-601-rework-1` (ver §5 passo 0 para criação). Diffs esperados: APENAS 3 arquivos contra `master`.
- **[READ]** `packages/core/src/lineage.ts` — `insertNode`, `getLineage`, `hashNode`, `bytesEqual`, `ZERO_HASH`
- **[READ]** `packages/core/src/signature.ts` — `SignedNode`, `UnsignedNode` (com `parentHash`), `canonicalizeNode`, `signNode`
- **[READ]** `packages/core/src/ulid.ts` — `ULID`
- **[READ]** `packages/core/src/hlc.ts` — `HLCTimestamp`, `HybridLogicalClock`
- **[CREATE/OR-REWRITE]** `packages/core/src/merge.ts` — `detectStructuralFork` recursivo, `resolveFork` com `parentHash` + `MERGES`, `projectProvisionalHead` async + storage cross-check, `ForkInfo`
- **[CREATE/REWRITE]** `packages/core/tests/merge.test.ts` — 14 casos (reescrita dos 10 + novos test 11..14)
- **[UPDATE/VERIFY]** `packages/core/src/index.ts` — exportações existentes (não devem precisar mudar)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/core test`. SQLite `:memory:` via `better-sqlite3`.
- [x] **Fora de Escopo:** SimNetwork, RBSR real, rede, UCAN.

Casos de teste (rework-1 manterá os 10 originais que seguem válidos + 4 novos):
1. Sem fork → `detectStructuralFork` retorna null (manter).
2. Fork 2 ramos, mesmo pai, sem ancestralidade (manter).
3. Fork 3 ramos (manter).
4. Sem fork quando há ancestralidade linear (manter).
5. **REESCREVER**: `detectStructuralFork(raiz, 2)` encontra fork profundo em 2 níveis — cenário real de `maxDepth > 1` (ver T-601 §8.1 test 5).
6. `resolveFork` cria nó MERGE + `getLineage` por MUTATES retorna `[merge, forkPoint, raiz]` (manter). A asserção do `parentHash = hashNode(forkPoint)` vai para o novo test 11.
7. `resolveFork` merge.hlc > max(hlc das branches) (manter).
8. **REESCREVER para `MERGES`**: contar arestas por `type`: asserção `MUTATES` count (source_id=`forkPoint`, target_id=`merge`) === 1; `MERGES` count (source_id=`merge`, target_id in branchTips) === `branchTips.length`.
9. `entity_heads` atualizado para o merge (manter).
10. `projectProvisionalHead` retorna ramo de maior HLC (manter; ajustar para `await` já que vira async).
11. **NOVO** — `merge.parentHash === hashNode(forkPoint)` (valida invariante U1 do rework-3).
12. **NOVO** — `detectStructuralFork(raiz, 0)` retorna null (depth 0 = sem busca); `detectStructuralFork(raiz, 1)` encontra só 1 nível.
13. **NOVO** — `resolveFork` recusa criar `MERGES` para ramo que não está em `fork.branchTips` (I-MERGES-4 ou I-MERGES-6).
14. **NOVO** — Após `resolveFork`, `detectStructuralFork(forkPoint)` retorna null (todos os ramos foram incorporados por `MERGES`).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use `git merge semântico de CRDT (Y.js/Automerge) — operação é camada bruta (Layer 2).
> - **NÃO** altere `insertNode` — `resolveFork` o chama como cliente.
> - **NÃO** apague arestas `MUTATES` existentes — `resolveFork` adiciona `MUTATES` (via `insertNode`) + `MERGES` (via transação própria).
> - **NÃO** toque em arquivos fora do escopo da §3 — qualquer divergência fora do diff esperado (3 arquivos: `merge.ts`, `merge.test.ts`, `index.ts`) é BLOCKER.
> - **NÃO** implemente integração com SimNetwork ou RBSR aqui (escopo de T-302/T-402).

### Pegadinhas conhecidas (pré-preenchidas — ver §8.1 da T-601)
- **Branch base:** use o master ATUAL (que já tem o rework-3 de T-108). Não branchar de `d8c3da4` (pré-rework) — isso reverte o rework-3 e bloqueia o merge.
- **Coluna do `type`:** na DDL atual de `edges`, chama-se `type` (não `edge_type`). Verificar `PRAGMA table_info(edges)` antes do INSERT.
- **`previous_hash` em `MERGES`:** é nullable — passe `NULL`. NÃO use `ZERO_HASH` para `MERGES` (reservado para `parentHash` de raiz em `nodes`).
- **`async` em `projectProvisionalHead`:** todos os callers existentes já usam `await` (compat) mas a assinatura PRECISA ser `async () => Promise<SignedNode>` — senão TS quebra em callers que fazem `.then` ou `Promise.all`.
- **`detectStructuralFork` rigth-after-merge:** test 14 exige que ele retorne `null` pós-`resolveFork`. Isto é o efeito direto de filtrar por `target_id` em arestas `MERGES` — sem isto, o fork fica reportado para sempre.

### Passo a passo

0. **Setup worktree** (na superapp, NÃO no controle):
   ```bash
   cd C:/Dev2026/superapp
   git fetch origin
   git worktree add C:/Dev2026/.superapp-worktrees/T-601-rework-1 -b task/T-601-rework-1 origin/master
   cd C:/Dev2026/.superapp-worktrees/T-601-rework-1
   pnpm install  #PatPITFALLS P-001/P-005
   ```
   Verificar branch base está atualizado: `git log --oneline -3` deve incluir `6cfb5ba` (merge do rework-3 da T-108).

1. **Cherry-pick + rebase** do commit `6d61907` (T-601 original) no novo branch:
   ```bash
   git cherry-pick 6d61907
   # resolver conflitos em lineage.ts, signature.ts, schema.ts aceitando "theirs" (master rework-3)
   git cherry-pick --continue  # após resolver
   ```
   Se houver muita regressão, alternativa: `git rebase --onto origin/master 6d61907^ 6d61907`.

2. **Validar diff está aditivo** (só adiciona `merge.ts` + `merge.test.ts` + `index.ts`):
   ```bash
   git diff origin/master..HEAD --stat
   # esperado: 3 arquivos. Se aparecem lineage.ts, signature.ts, schema.ts, teste lineage/signature — aborta e recria.
   ```
   Validar especificamente:
   ```bash
   git diff origin/master..HEAD > packages/core/src/lineage.ts | wc -l    # == 0
   git diff origin/master..HEAD > packages/core/src/signature.ts | wc -l  # == 0
   git diff origin/master..HEAD > packages/core/src/schema.ts | wc -l    # == 0
   ```

3. **Inspeção de schema** (confirma coluna `type` e nullable de `previous_hash`):
   ```ejs
   await storage.exec("PRAGMA table_info(edges)");
   # deve exibir: id, entity_id, source_id, target_id, type, previous_hash, payload, epoch, active, created_at, hlc, signature, retention_state
   # `previous_hash` nullable (notnull == 0)
   ```

4. **[TDD]** Comecar pela reescrita de `merge.test.ts` — 14 casos da §4. Rodar tests (devem falhar enquanto `merge.ts` não estiver reescrito).

5. **Reescrita de `merge.ts`** — três funções `detectStructuralFork`, `resolveFork`, `projectProvisionalHead`. Ver contratos na §1 e exemplos em T-601 §8.1.

6. **Rodar gate** `pnpm --filter @plataforma/core build && pnpm --filter @plataforma/core test && pnpm --filter @plataforma/core lint`. Todos verdes.

7. **Validação final do diff** contra master:
   ```bash
   git diff origin/master..HEAD --stat
   # esperado: 3 arquivos (merge.ts, merge.test.ts, index.ts)
   ```

8. Commit + push.
   ```bash
   git add -A
   git commit -m "fix(T-601-rework-1): rebase + parentHash + MERGES (RFC-028) + maxDepth recursivo + projectProvisionalHead async"
   git push -u origin task/T-601-rework-1
   ```

9. `finish` via `manage-task.mjs finish T-601-rework-1 SeuNome "<colar saída do gate>"`.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **✅ DECISÃO Architectural #1 (2026-06-26): B4 resolvido via RFC-028 — nova aresta `MERGES`.**
> Regra 4 da T-601 emendada para: 1 `MUTATES` (merge→forkPoint) + N `MERGES` (merge→branchTip).
> Invariantes I-MERGES-1..6 documentados em `docs/conceitos/merges.md` e `caderno-2/02 §3.2`.
> Esta rework é a implementação direta do ADR-0005 — sem mais decisões em aberto.

## 7. Definition of Done (DoD) & Reviewer Checklist
- Em adição aos gerais do template:
- [ ] `git diff origin/master..HEAD --stat` mostra EXATAMENTE 3 arquivos (`merge.ts`, `merge.test.ts`, `index.ts`)?
- [ ] `git diff origin/master..HEAD -- > packages/core/src/lineage.ts` vazio (sem reversão do rework-3)?
- [ ] `git diff origin/master..HEAD -- > packages/core/src/signature.ts` vazio?
- [ ] `git diff origin/master..HEAD -- > packages/core/src/schema.ts` vazio?
- [ ] `merge.parentHash === hashNode(forkPoint)` (validado por test 11)?
- [ ] Arestas `MERGES` criadas por `resolveFork` com `type='MERGES'`, `previous_hash=NULL` (I-MERGES-2)?
- [ ] `detectStructuralFork` recursivo até `maxDepth` (validado por test 5 reescrito + test 12)?
- [ ] `detectStructuralFork` filtra ramos já-alvos de `MERGES` (validado por test 14)?
- [ ] `projectProvisionalHead` async com cross-check `entity_heads` (validado por test 10)?
- [ ] `pnpm --filter @plataforma/core build`, `test` (14 ou mais tests), `lint` verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/core build   # tsc, EXIT 0
pnpm --filter @plataforma/core test    # vitest, EXIT 0
pnpm --filter @plataforma/core lint    # eslint, EXIT 0
```

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
- **[2026-06-26]** - *arquiteto* - `[Task criada]`: Rework-1 de T-601 gerada a partir da Seção 8.1 handoff da T-601. Spec sem decisões em aberto (B4 resolvido via RFC-028 absorvida; ADR-0005 registrado). Status: ready.
