---
id: T-108-rework-3
title: "T-108 rework-3 — parentHash validation + entity_members table (ADR) + entity_heads maintenance (ADR) + test 4 fix"
status: review
complexity: 3
parent_task: T-108
subtasks: []
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-108"]
blocks: ["T-601"]
capacity_target: sonnet
---

# T-108-rework-3 · T-108 rework-3 — correções da auditoria pós-aprovação

> **Contexto:** T-108 (Linhagem Layer 2) foi `done` após rework-2 em 2026-06-22T22:40.
> Uma auditoria pós-aprovação executada em 2026-06-24 (agile_reviewer, post-mortem
> sem ponytail) identificou **1 BLOCKER + 3 MAJOR** contra a spec — a saber:
> ausência da validação `parentHash`, substituição não-declarada de `entity_id`
> (coluna) por `entity_members` (tabela), manutenção manual de `entity_heads`
> (não via trigger como a spec pedia), e teste case 4 mislabeled. A máquina
> MGTIA rejeitou transições `done → review` e `done → rework`; a única reversa
> permitida foi `done → blocked` (registrada na Seção 8 de T-108.md via
> `manage-task.mjs block`). Esta task é a 3ª iteração de rework, estruturada
> como nova task (em vez de retorno direto para `rework`) para preservar
> auditabilidade e permitir que o MGTIA siga a sequência `draft → ready →
> in_progress → review → done` padrão. **Branch:** `task/T-108` (3 commits
> existentes: `d72063c`, `1d8b6f0`, `acae28f` — manter histórico).

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo — pacote alvo: `packages/core/`
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar as 4 correções identificadas na auditoria pós-aprovação de T-108
(`tasks/T-108.md` Seção 8, entrada de 2026-06-24). Cobertura: **[B1]** validação
`parentHash` ausente, **[M1]** decisão arquitetural sobre `entity_members` vs
`entity_id` (coluna), **[M2]** decisão arquitetural sobre manutenção de
`entity_heads` (trigger vs manual), **[M3]** correção do teste case 4
(mislabeled) + suite de regressão para `parentHash`.

*(derivado de `tasks/T-108.md` Seção 1 (spec original) + Seção 8 (auditoria
pós-aprovação 2026-06-24) + `docs/plano-de-implementacao.md` §2.1 Anel 1 + RFC-005
§A.5)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/core/src/signature.ts (adição) ---
import { sha256 } from '@plataforma/crypto';

export interface UnsignedNode {
  id: ULID;
  nodeType: string;
  payload: Uint8Array;
  hlc: HLCTimestamp;
  publicKey: Ed25519PublicKey;
  /** Hash do nó pai (parents[0] = node raiz da entity). Para nó-raiz, todos-zero (32B). */
  parentHash: NodeHash;          // NOVO — validado em insertNode
}

export interface SignedNode extends UnsignedNode {
  signature: Ed25519Signature;
}

// --- packages/core/src/lineage.ts (mudança) ---
/**
 * Insere nó no grafo com validação Layer 2:
 *  1. Se há pai, valida que:
 *     - parentHash confere com hashNode(parent)         ← NOVO (B1)
 *     - HLC(filho) > HLC(pai)
 *     - entity_id do filho = entity_id do pai
 *  2. Se é nó-raiz, parentHash deve ser 32 bytes zeros (ou omitido/null).
 *  3. Detecta e rejeita ciclos.
 *  4. Persiste nó + aresta MUTATES.
 *  5. Atualiza entity_heads em código (Opção B, ADR 0002 — manutenção dentro da transaction,
 *     sem trigger). É o ÚNICO caminho de inserção de nós que afeta linhagem (invariante U3
 *     do ADR 0002): bulk-import/hidratação/apply-batch DEVE passar por aqui.
 */
export async function insertNode(
  storage: StoragePort,
  node: SignedNode,
  parentId?: ULID,
): Promise<void>;
```

> **Mudanças não contratuais:** `hashNode`, `getLineage`, `getHead`, `validateChain`,
> `detectFork`, `NodeHash` permanecem inalterados. `NodeHash` continua sendo
> `Uint8Array`. **Schema (`schema.ts` V2) NÃO precisa de migration v3** — ADRs 0001/0002
> confirmam Opção B em ambos (manter `entity_members` + manutenção em código), então nada
> de trigger no schema.

## 2. Contexto RAG (Spec-Driven Development)
- [`tasks/T-108.md`](../tasks/T-108.md) — spec original (Seção 1, 4) + auditoria pós-aprovação (Seção 8, 2026-06-24)
- [`docs/plano-de-implementacao.md` §2.1 Anel 1](../docs/plano-de-implementacao.md) — Simulação Determinística; storage SQLite (better-sqlite3 + wa-sqlite)
- [`docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` §1.4.1](../docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md) — Layer 1 + Layer 2
- [`docs/conceitos/entity-id.md`](../docs/conceitos/entity-id.md) — herança de entity_id via nó-raiz
- [`docs/conceitos/hlc.md`](../docs/conceitos/hlc.md) — invariante de pai HLC, seleção de head
- [`docs/adr/0001-entity-id-representation.md`](../docs/adr/0001-entity-id-representation.md) — **aceito** — Opção B (manter `entity_members`) + invariantes U1/U2
- [`docs/adr/0002-entity-heads-maintenance.md`](../docs/adr/0002-entity-heads-maintenance.md) — **aceito** — Opção B (manutenção em código) + invariante U3 (funil único `insertNode`)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/signature.ts` — adicionar `parentHash` em `UnsignedNode`/`SignedNode` (afeta callers)
- **[READ]** `packages/core/src/lineage.ts` — implementar validação `parentHash` em `insertNode:80-86` (afetado por B1)
- **[READ]** `packages/core/src/schema.ts` — migration v2 atual (decidir se v3 é necessária — ver ADR M2)
- **[READ]** `packages/core/tests/lineage.test.ts` — referência do test 4 mislabeled (linha 152-159) que precisa ser refeito
- **[READ]** `packages/core/tests/ulid.test.ts`, `tests/random.test.ts` — cobertura SeededRandom existente (não tocar)
- **[READ]** `docs/adr/0001-entity-id-representation.md` — ADR 0001 (Status: **aceito**) — representação canônica de `entity_id` (Opção B: manter `entity_members`) + invariantes U1/U2
- **[READ]** `docs/adr/0002-entity-heads-maintenance.md` — ADR 0002 (Status: **aceito**) — manutenção de `entity_heads` em código (Opção B) + invariante U3 (funil único `insertNode`)
- **[UPDATE]** `packages/core/src/signature.ts` — adicionar `parentHash: NodeHash` em `UnsignedNode`/`SignedNode`
- **[UPDATE]** `packages/core/src/lineage.ts` — validação `parentHash` em `insertNode` (B1); **ADRs 0001/0002 confirmam Opção B — sem trigger** (manutenção em código já está correta). Documentar conformidade com invariante U3 no JSDoc de `insertNode` (referência a ADR 0002)
- **[UPDATE]** `packages/core/src/index.ts` — re-exports (se algum tipo novo entrar)
- **[UPDATE]** `packages/core/tests/lineage.test.ts` — refazer case 4 (test parentHash real) + adicionar cases 11 (parentHash mismatch → erro) + 12 (parentHash válido → passa) + 13 (nó-raiz com parentHash não-zero → erro) + 14 (bulk-import via `insertNode` mantém `entity_heads` sincronizado — cross-link ADR 0002/T-308)
- **[UPDATE]** `tasks/T-108.md` — Seção 6 com decisões dos ADRs #M1 (Opção B, manter `entity_members`) e #M2 (Opção B, manutenção em código) + invariantes U1/U2/U3 + nota sobre `parentHash`

> **Não tocar:** `packages/testkit/src/random.ts` (SeededRandom já corrigido no rework-2).
> **Não tocar:** os outros 9 casos do test suite (já passam, manter).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/core test`. SQLite `:memory:` via `better-sqlite3`.
- [x] **Fora de Escopo:** Sync de rede, RBSR, UCAN, persistência.

Casos de teste (numerados; 1-10 existentes preservados, 11-14 novos):
1-10. **(inalterados)** — preservados do T-108 v2.
11. **`parentHash` mismatch → erro:** insere nó-raiz A. Cria nó B (com `parentHash` diferente de `hashNode(A)`). Tenta `insertNode(B, A.id)` → erro `/parentHash|hash/i`.
12. **`parentHash` válido → passa:** mesmo cenário de 11, mas B com `parentHash = hashNode(A)` → `insertNode` succeeds.
13. **Nó-raiz com `parentHash` não-zero → erro:** ADR 0001 decide que raiz = 32 bytes zeros (ver §Invariante). Insere nó com `parentHash` ≠ zeros → erro.
14. **[Cross-link ADR 0002/T-308] bulk-via-`insertNode` mantém `entity_heads` sincronizado:** insere 50 nós em sequência via `insertNode` (mistura raízes + derivados). Ao final, `entity_heads` contém exatamente o último head de cada entidade. Safeguard da invariante U3.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** introduzir novo worktree — trabalhe na branch `task/T-108` existente (3 commits já feitos).
> - **NÃO** tocar em `packages/testkit/src/random.ts` (correto no rework-2).
> - **NÃO** modificar os 9 testes existentes (1-10) — preservar. Adicionar 11-13 ao final.
> - **NÃO** editar `status:` do frontmatter de T-108 nem seu `INDEX.md` (transição é via manage-task.mjs).

### Pegadinhas conhecidas
- **Mudança de assinatura ripple:** adicionar `parentHash` em `UnsignedNode` quebra TODOS os
  callers que constroem nós sem o campo. `tests/lineage.test.ts:73-83` (`makeNode` helper)
  precisa setar `parentHash` (ou gerar valor default de 32 zeros para raiz). Verificar
  também `tests/signature.test.ts` (casos que constroem SignedNode).
- **Decisão arquitetural em 2 ADRs separados:** [M1] e [M2] são ortogonais. Não bloquear um
  no outro. Worker pode começar pelo mais fácil (M1) enquanto arquiteto resolve M2.
- **Adulteração de SignedNode:** o bypass de Layer 1 (T-107) é o vetor que [B1] cobre. NÃO
  chamar `verifyNode` em `insertNode` (Layer 2 confia que Layer 1 foi validado upstream) —
  apenas comparar `node.parentHash === hashNode(parent)`.
- **Test 4 (mislabeled):** o test atual testa `NONEXISTENTPARENTID` (parentId not found).
  Substituir por teste de `parentHash` real (MISMATCH) — manter o coverage de parentId
  inexistente como caso novo 14.

1. **[ADRs 0001+0002 — ACEITOS]** Ambos ADRs já existem (Status: aceito). Worker NÃO cria nem revisa ADRs — aplica as decisões (Opção B em ambos).
2. Atualizar `tasks/T-108.md` Seção 6 com decisões: ADR 0001 (Opção B — manter `entity_members`, invariantes U1/U2); ADR 0002 (Opção B — manutenção em código, invariante U3 funil único `insertNode`); nota sobre `parentHash`.
3. Atualizar `packages/core/src/signature.ts` adicionando `parentHash: NodeHash` em `UnsignedNode`. Atualizar `makeNode` helper em `tests/lineage.test.ts` e `tests/signature.test.ts` para incluir o campo.
4. Implementar validação `parentHash` em `insertNode:80-86` (B1): `if (node.parentHash !== (await hashNode(parent))) throw new Error('parentHash mismatch')`.
5. **[ADR 0002 — Opção B = manutenção em código]**: NÃO adicionar migration v3, NÃO adicionar trigger. A manutenção em `insertNode:130-145` já está correta. Documentar conformidade com a invariante U3 no JSDoc de `insertNode`: "Único caminho de inserção de nós que afeta linhagem. Bulk-import/hidratação/apply-batch DEVE passar por aqui (ADR 0002)."
6. Adicionar **test 14** (cross-link ADR 0002 / T-308-rework-2): bulk-insert de N nós via `insertNode` em sequência; ao final, `entity_heads` reflete corretamente o último head de cada entidade. **Motivo:** safeguards a invariante U3 mesmo para o caminho bulk — prova que `insertNode` é funil suficiente.
7. Refazer test 4 (M3): substituir `NONEXISTENTPARENTID` por `parentHash` mismatch real. Adicionar tests 11-13.
8. Rode build + test + lint (Seção 7). Cole saída na Seção 8.

## 6. Feedback de Especificação (Spec Feedback Loop)

> **✅ DECISÕES RESOLVIDAS (2026-06-25 — arquiteto):**

> **#M1 — Representação de `entity_id`:** **Opção B — manter tabela `entity_members`.**
> Justificativa: `entity_id` é propriedade da entidade (relação 1:N entity→nodes), não do nó
> armazenado. A `PRIMARY KEY` em `entity_members.node_id` impõe o invariante U1 (cada nó
> pertence a exatamente 1 entidade). Forma normal, JOINs já implementados em `lineage.ts:88,197`,
> future-proof para multi-entity sem migration disruptiva. Atualização normativa apenas — sem
> mudança de código (já implementado assim).
>
> **Invariantes normativos (a partir deste ADR):**
> - **U1** — 1:1 nó→entidade. `PRIMARY KEY` em `entity_members.node_id`. Raiz = entidade é o
>   próprio `node.id`.
> - **U2** — Derivação canônica. `entity_id` de um nó deriva do nó-raiz da linhagem.
>
> **Ref:** `docs/adr/0001-entity-id-representation.md` (Status: aceito).

> **#M2 — Manutenção de `entity_heads`:** **Opção B — manutenção em código** + invariante
> do funil único. A manutenção continua dentro de `storage.transaction(...)` em
> `insertNode:126-145`, sem trigger no schema. `wa-sqlite` (browser/OPFS) tem suporte parcial
> a triggers — feature-flag por backend seria inevitável na Opção A. Opção B é isomórfica (JS
> puro), sem feature-flag.
>
> **Invariante normativa (a partir deste ADR):**
> - **U3 — `insertNode` é a ÚNICA API de inserção de nós que afeta linhagem.** Qualquer
>   código que insira `SignedNode`s no storage — sincronização RBSR, hidratação de snapshot
>   (T-308), apply de patch remoto — DEVE passar pelo helper `insertNode`, ou por helper
>   equivalente que **na mesma transação** atualize `entity_members`/`entity_heads`.
>   **NÃO é permitido** `INSERT INTO nodes ...` direto sem manter as tabelas auxiliares
>   atomicamente. Enforcement por aprovação de revisão (sem runtime check); tasks futuras
>   que introduzam novo caminho de `INSERT INTO nodes` devem justificar no §3 conformidade U3.
>
> **Ref:** `docs/adr/0002-entity-heads-maintenance.md` (Status: aceito).
>
> **Cross-link T-308-rework-2:** o `hydrateSnapshot` atual **retorna** em memória (não
> persiste — esta task não precisa fazer nada). Se task futura introduzir
> `hydrateToStorage`, ela própria declara conformidade com U3. **Test 14** aqui adicionado
> safeguard: bulk-via-`insertNode` mantém `entity_heads` sincronizado.

> **✅ DECISÃO RESOLVIDA (2026-06-24 — endurecedor):** caminho de produção é branch `task/T-108` (3 commits existentes); NUNCA criar novo worktree. Os 9 testes existentes (1-10) **NÃO** são refatorados — apenas o test 4 (mislabeled) e adições 11-13. O SeededRandom de T-003 (já corrigido no rework-2) **NÃO** é tocado.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/core build
pnpm --filter @plataforma/core test
pnpm --filter @plataforma/core lint
```

### Checklist do Reviewer
- [ ] ADRs `0001-entity-id-representation.md` e `0002-entity-heads-maintenance.md` **aceitos** (não mais RASCUNHO) — referenciados na Seção 6?
- [ ] Decisões dos ADRs registradas em `tasks/T-108.md` Seção 6 e aplicadas no código?
- [ ] Campo `parentHash: NodeHash` adicionado em `UnsignedNode`/`SignedNode` (B1)?
- [ ] Validação `parentHash` em `insertNode` rejeita mismatch?
- [ ] **ADR 0002 = Opção B (manutenção em código)** — sem trigger no schema, sem migration v3, manutenção em `insertNode:130-145` mantida; JSDoc documenta conformidade com invariante U3?
- [ ] Test 4 (mislabeled) refeito como teste de `parentHash` real?
- [ ] Tests 11-13 adicionados e passando?
- [ ] Test 14 (bulk-via-`insertNode` mantém `entity_heads` sincronizado — invariante U3) passando?
- [ ] `makeNode` helpers em `tests/lineage.test.ts` + `tests/signature.test.ts` atualizados para setar `parentHash`?
- [ ] Os 9 testes existentes (1-10) continuam verdes?
- [ ] `pnpm --filter @plataforma/core build` + `test` + `lint` verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **Worker:** Crush
- **Mudanças (commit 14aa742 — branch task/T-108):**
  - `packages/core/src/signature.ts` — adicionado `parentHash: NodeHash` em `UnsignedNode`/`SignedNode`; `canonicalizeNode` inclui `parentHash` na ordem léxica (entre `nodeType` e `payload`).
  - `packages/core/src/lineage.ts` — `NodeHash` re-exportado de signature; `bytesEqual` constant-time; `ZERO_HASH`; `insertNode` valida `parentHash` (B1) e exige zeros para raiz; JSDoc cita ADR 0002 (U3 funil único); `rowToNode` lê `parent_hash` (legacy → 32 zeros); INSERT em `nodes` inclui `parent_hash`.
  - `packages/core/src/schema.ts` — coluna `parent_hash BLOB` adicionada à tabela `nodes` (DDL v1).
  - `packages/core/tests/lineage.test.ts` — `makeNode` aceita `parentHash`; test 4 refeito (M3) com parentHash real; tests 11-14 adicionados (parentHash mismatch / válido / raiz com non-zero / bulk-via-insertNode mantém `entity_heads`).
  - `packages/core/tests/signature.test.ts` — `makeNode` seta `parentHash = zeros`; tests 5/9 atualizados para incluir o campo.

- **Decisões aplicadas (ADRs já aceitos):**
  - ADR 0001 (Opção B): `entity_members` mantido (U1/U2). Sem migration v3.
  - ADR 0002 (Opção B): `entity_heads` em código (U3 funil único). Sem trigger, sem migration v3.

**Gate de Evidência (worktree T-108, 2026-06-25):**
```
$ pnpm --filter @plataforma/core build
$ tsc
(EXIT 0)

$ pnpm --filter @plataforma/core test
 ✓ tests/mock.test.ts (1 test) 2ms
 ✓ tests/schema.test.ts (7 tests) 28ms
 ✓ tests/ulid.test.ts (13 tests) 7ms
 ✓ tests/hlc.test.ts (10 tests) 39ms
 ✓ tests/keyVault.test.ts (11 tests) 5ms
 ✓ tests/signature.test.ts (10 tests) 142ms
 ✓ tests/lineage.test.ts (14 tests) 420ms
 Test Files  7 passed (7)
      Tests  66 passed (66)  (EXIT 0)

$ pnpm --filter @plataforma/core lint
$ eslint src/
(EXIT 0)
```

**Cobertura dos 4 achados:**
- **[B1] parentHash validation ✅** — `insertNode:88-94` rejeita mismatch; test 4 (refeito) e test 11 cobrem.
- **[M1] ADR 0001 Opção B ✅** — `entity_members` mantido; documentado em §6.
- **[M2] ADR 0002 Opção B ✅** — manutenção em código (sem trigger); JSDoc em `insertNode` cita U3; test 14 safeguard.
- **[M3] Test 4 mislabeled ✅** — refeito como teste de parentHash mismatch real.

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-06-24T15:xx]** - *arquiteto* - `[Promovido]`: T-108-rework-3 criada a partir de auditoria pós-aprovação 2026-06-24. T-601 agora bloqueada. ADRs M1 e M2 pendentes.
- **[2026-06-25]** - *arquiteto* - `[Decisão + flip draft→ready]`: #M1 + #M2 resolvidos via ADRs 0001 (Opção B — manter `entity_members`, invariantes U1/U2) e 0002 (Opção B — manutenção em código, invariante U3 funil único `insertNode`). Sem migration v3, sem trigger. Adicionado teste 14 (bulk-via-`insertNode` mantém `entity_heads` sincronizado) — safeguard cross-link ADR 0002/T-308-rework-2.
- **[2026-06-25T19:07]** - *Crush* - `[Iniciado]`: iniciando rework-3: parentHash validation + ADR 0001/0002 (entity_members/entity_heads em código) + tests 4,11-14
- **[2026-06-25T19:10]** - *Crush* - `[Finalizado]`: rework-3 completo: B1 (parentHash validation), ADR 0001/0002 aplicados, test 4 refeito, tests 11-14 adicionados. Gate 66/66 verde. Commit 14aa742 pushado origin/task/T-108.
