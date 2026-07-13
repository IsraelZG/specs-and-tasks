# ADR-0015 — Extensão mínima da GraphStorePort (recuperação arquitetural da T-1043)

- **Data:** 2026-07-12
- **Status:** Proposed (duas decisões abertas: D1 tombstone, D2 encoding HLC — recomendações abaixo)
- **Autor:** Claude Fable (sessão de recuperação arquitetural, a pedido do arquiteto)
- **Estende:** [[adr-005-storage-engine-agnosticism]] · **Desbloqueia:** `tasks/T-1043.md`

---

## Contexto — estado real na master (`f51c200`), não o da spec

A T-1043 fala em "86 ocorrências em 8 arquivos", mas parte do trabalho já aconteceu na master
(via T-1042 e afins). Estado verificado em 2026-07-12:

- `GraphStorePort` + `GraphStoreTx` **já existem** em `packages/protocol/src/ports.ts:186` com a
  forma mínima do ADR-005 (put/get node, put/get edges, rangeScan por id, transaction write-only).
- `SqliteStorage` e `SqliteWasmStorage` **já implementam** a porta (mantendo `exec`/`migrate` como
  utilitário). Testes: `packages/protocol/tests/ports.test.ts`, `packages/core/tests/sqliteStorage.graphStore.test.ts`.
- `ProjectionManager` **já existe como interface** em `packages/core/src/projection.ts`, com
  implementação de referência in-memory **apenas no teste** (`projection.test.ts`). Não há impl
  de produção: `entity_members`/`entity_heads` seguem mantidas por SQL inline em `lineage.ts`.
- A branch antiga `task/t-1043` (`bad8e25`, 1 commit wip do deepseek) está **superseded** — sua
  infra foi refeita na master. Recomendação: descartar após conferência (`git log master..task/t-1043`).
- Restam **51 sítios `exec(sql)` em 7 arquivos** do core (o censo de 86 incluía o SQL interno do
  adapter, que agora é legítimo).

O handoff do deepseek (Log §9 da T-1043, 2026-07-03) identificou corretamente o bloqueio:
`SELECT MAX(hlc)`, `WHERE hlc > ?` e os joins com `entity_members` não mapeiam para a porta atual.
Este ADR fixa a extensão mínima que resolve isso sem virar uma SQL API disfarçada.

---

## Censo e classificação das 51 consultas remanescentes

Semânticas: **[L]** lookup · **[T]** range/agregação temporal (HLC) · **[A]** agregação ·
**[J]** join/projeção · **[X]** transação/escrita · **[D]** DDL/migração.

### `merge.ts` (7)

| # | Linha | Consulta | Sem. | Destino |
|---|---|---|---|---|
| M1 | 39 | `SELECT * FROM nodes WHERE id=?` | L | `getNode` |
| M2 | 46 | `SELECT entity_id FROM entity_members WHERE node_id=?` | J | `ProjectionManager.getEntityOf` (novo) |
| M3 | 57 | `SELECT target_id FROM edges WHERE edge_type='MERGES'` | L | `getEdges({type})` |
| M4 | 110 | `…edges WHERE edge_type='MUTATES' AND source_id=?` | L | `getEdges({source,type})` |
| M5 | 184 | `SELECT 1 FROM edges WHERE …source AND target` | L | `getEdges({source,target,type}).length>0` |
| M6 | 231 | `INSERT INTO edges` (MERGES, em loop na tx) | X | `tx.putEdge` |
| M7 | 283 | `SELECT head_id, head_hlc FROM entity_heads WHERE entity_id=?` | J | `ProjectionManager.getEntityHead` |

### `lineage.ts` (17)

| # | Linha | Consulta | Sem. | Destino |
|---|---|---|---|---|
| L1 | 51 | `SELECT * FROM nodes WHERE id=?` | L | `getNode` |
| L2 | 58 | `edges MUTATES target=?` (parentOf) | L | `getEdges({target,type})` |
| L3 | 72 | idem, em loop (ancestors) | L | `getEdges({target,type})` |
| L4 | 125 | `entity_members WHERE node_id=?` (insertNode) | J | `PM.getEntityOf` **com fallback walk-to-root** (red-team §3) |
| L5 | 148 | `INSERT INTO nodes` | X | `tx.putNode` |
| L6 | 154 | `INSERT INTO entity_members` | X/J | `PM.onNodeInserted` |
| L7 | 160 | `INSERT INTO edges` (MUTATES) | X | `tx.putEdge` |
| L8–L10 | 167–181 | `SELECT/INSERT/UPDATE entity_heads` | J | interno do `PM.onNodeInserted` |
| L11 | 221 | `SELECT head_id FROM entity_heads` (getHead) | J | `PM.getEntityHead` |
| L12 | 244 | `entity_members` (validateChain, raiz) | J | `PM.getEntityOf` |
| L13 | 255 | `edges MUTATES source+target` | L | `getEdges` |
| L14–L15 | 261–262 | `entity_members` (child/parent) | J | `PM.getEntityOf` |
| L16 | 269 | `edges MUTATES target=?` (root check) | L | `getEdges({target,type})` |
| L17 | 282 | `SELECT COUNT(*) edges MUTATES source=?` (detectFork) | A | `getEdges({source,type}).length` (out-degree típico ≤ 3; sem `countEdges` — YAGNI) |

### `invite.ts` (7)

| # | Linha | Consulta | Sem. | Destino |
|---|---|---|---|---|
| I1 | 19 | `CREATE TABLE tombstones` (dentro de validateInvite!) | D | eliminar — vai para migração (decisão D1) |
| I2 | 122 | `SELECT 1 FROM tombstones` | L | D1 |
| I3 | 164 | idem, dentro da tx (anti-TOCTOU) | X/L | D1 |
| I4 | 173 | `INSERT OR IGNORE INTO nodes` (stub inviter) | X | `tx.putNode` **idempotente** (mudança de semântica, §Extensão 4) |
| I5 | 186 | `INSERT INTO nodes` | X | `tx.putNode` |
| I6 | 200 | `INSERT INTO edges` | X | `tx.putEdge` |
| I7 | 214 | `INSERT INTO tombstones` | X | D1 |

### `sync/concurrentGuard.ts` (4)

| # | Linha | Consulta | Sem. | Destino |
|---|---|---|---|---|
| C1 | 38 | `SELECT MAX(hlc) FROM nodes` | T/A | **novo** `latestHlc()` |
| C2 | 53 | `SELECT id, node_type FROM nodes WHERE hlc>? ORDER BY id` | T | **novo** `scanSince(hlc)` |
| C3 | 73 | `entity_members WHERE node_id=?` | J | `PM.getEntityOf` |
| C4 | 84 | `COUNT(*) nodes JOIN entity_members WHERE entity=? AND hlc<=?` | J/A/T | **eliminada por invariante**: `existedBefore ⇔ getNode(entityId)!.hlc <= checkpoint`. O `entity_id` É o id do nó-raiz da entidade, e o invariante HLC (filho > pai) garante que a raiz tem o menor HLC da entidade. O join+agregação colapsa em um lookup. |

### `archive/blindArchives.ts` (5) e `deviceState/schema.ts` (0 exec, 2 migrações)

Todas as operações (`put`, `get`, `list por (scope, created_at DESC) LIMIT`, `COUNT`+`DELETE` de
expirados) são **estado local com TTL, nunca replicado** — categoria 2 do ADR-005. **Nenhum método
novo na GraphStorePort.** Ficam no SQL local (ver "Fronteira StoragePort" abaixo). Custo de
migração destes 2 arquivos: zero.

### `schema.ts` (0 exec; 4 migrações)

Split de responsabilidade: DDL de `nodes`/`edges` (V1) passa a ser **interno do adapter** (cada
adapter é dono do seu esquema físico); V2 (`entity_members`/`entity_heads`) vai para o
`SqliteProjectionManager`; V3 (blind_archives) e V4 (agent_traces) permanecem locais.

**Total: 51 sítios → 0 SQL no core.** ~30 viram porta, ~14 viram ProjectionManager, ~6 dependem
de D1 (tombstones), 1 eliminada por invariante (C4).

---

## Decisão — extensão mínima da porta (4 mudanças)

Nenhum método recebe predicado, expressão ou string de query: são operações fechadas do domínio.
É isso que impede a "SQL API disfarçada" — o teste de cheiro é: *se um método aceita uma condição
arbitrária, ele é SQL com outro nome*.

```ts
// packages/protocol/src/ports.ts — adições

export interface GraphStorePort {
  // … métodos existentes inalterados …

  /**
   * (1) Marca d'água de HLC do conjunto replicado local.
   * Invariantes: igual a max(hlc) sobre todos os nós armazenados; monotônica
   * não-decrescente na mesma sessão; null sse o grafo está vazio.
   * Complexidade: O(1) amortizado (SQLite: MAX sobre índice; KV: chave meta
   * atualizada em putNode).
   */
  latestHlc(): Promise<HLCTimestamp | null>;

  /**
   * (2) Nós com hlc estritamente maior que o argumento, ordenados por (hlc, id).
   * Invariantes: scanSince(latestHlc()) = ∅; todo nó ESCRITO LOCALMENTE após
   * um snapshot h aparece em scanSince(h) — garantido pelo HLC local monotônico.
   * NÃO cobre nós remotos ingeridos com hlc ≤ h (red-team §2): ingestão remota
   * durante sync é responsabilidade do pipeline RBSR, não deste diff.
   * Complexidade: O(log n + k) com índice secundário por hlc.
   */
  scanSince(hlcExclusive: HLCTimestamp): AsyncIterable<SignedNode>;
}

/** (3) Transação ganha leitura — read-your-writes dentro da tx. */
export interface GraphStoreTx {
  putNode(node: SignedNode): Promise<void>;
  putEdge(edge: SignedEdge): Promise<void>;
  getNode(id: EntityId): Promise<SignedNode | null>;
  getEdges(query: { source?: EntityId; target?: EntityId; type?: EdgeType }): Promise<SignedEdge[]>;
}
```

**(4) Semântica de `putNode` muda de "falha se id existe" para idempotente-se-idêntico:**
re-put do mesmo nó assinado (mesmo id + mesmos bytes canônicos) é no-op; put de nó *diferente*
com o mesmo id é erro. Justificativa: RBSR reentrega nós durante o sync e `invite.ts` insere stub
possivelmente pré-existente (I4) — sem isso, todo caller precisa de check-then-put, reintroduzindo
o TOCTOU que a porta deveria eliminar. Dentro de `transaction`, o erro de conflito aborta a tx
inteira (é assim que a cerimônia de convite fica atômica — D1 opção A).

Por que (3) é necessário e não gordura: `insertNode` valida parentHash/HLC/ciclo e `consumeInvite`
faz o check anti-TOCTOU **dentro** da transação. Sem leitura na tx, essas validações rodam fora e
a atomicidade que o código SQL atual tem seria perdida na migração.

### O que fica FORA da porta

- **Projeções** (`entity_members`, `entity_heads`): permanecem no `ProjectionManager`
  (`packages/core/src/projection.ts`, já existente), que ganha **um** método:
  `getEntityOf(nodeId: string): Promise<string | null>` (inverso de `getEntityMembers` — é o que
  M2/L4/L12/L14/L15/C3 precisam). Impl de produção: `SqliteProjectionManager` sobre as tabelas
  atuais; a impl in-memory do teste vira referência.
- **Fronteira StoragePort:** `StoragePort.exec` **sobrevive, confinada a estado local**
  (blindArchives, deviceState, agent_traces, projeções SQLite). Docstring passa a dizer
  "local-state only — o grafo NUNCA passa por aqui" e um lint-guard (fase 10 do plano) proíbe
  `nodes`/`edges` em strings SQL fora dos adapters. Rename de símbolo é cosmético — não pago.

---

## Red-team

### §1 — Encoding de HLC está quebrado HOJE (achado bloqueante, vira invariante da porta)

- Os **dois** adapters serializam `hlc: Number(node.hlc)` (`sqliteStorage.ts:24`,
  `sqliteWasmStorage.ts:16`). HLC = `(ms << 16) | counter` ≈ 1.15e17 > 2^53 — `Number()`
  **arredonda e corrompe os 16 bits do counter lógico** em todo putNode.
- `schema.ts` declara `hlc TEXT`; `lineage.ts` insere `String(hlc)`; `concurrentGuard.ts` compara
  `hlc > ?` — comparação **lexicográfica** de decimais de largura variável ("9" > "10").
  E `MAX(hlc)` sobre coluna com tipos mistos (REAL do adapter, TEXT da lineage) compara por classe
  de storage no SQLite (numérico < texto sempre) — resultado errado silencioso.
- **Decisão D2 (recomendação): coluna INTEGER de 64 bits, bigint fim-a-fim.** `node:sqlite` aceita
  `bigint` como `SQLInputValue` e lê exato com `setReadBigInts(true)`/`defaultSafeIntegers`. O
  adapter WASM idem (sql.js/wa-sqlite: usar string de largura fixa de 20 dígitos zero-padded se o
  driver não der bigint — a ordenação lexicográfica de largura fixa == numérica). Teste de
  conformidade: round-trip exato de `(1n<<60n)+7n` e ordenação de `scanSince` == 
  `HybridLogicalClock.compare`.

### §2 — Sync sob partição

`beginSync` lê `latestHlc()` sem transação longa e `computeDiff` assume que todo nó novo tem
`hlc > checkpoint`. Isso vale para **escrita local** (HLC local monotônico), mas um nó **remoto**
aplicado durante o sync pode ter `hlc ≤ checkpoint` (relógio do peer atrás) e escapar do diff.
O SQL atual tem exatamente o mesmo furo — **não é regressão da porta** — mas o contrato de
`scanSince` documenta o limite explicitamente (ver assinatura) e o guard continua correto para o
que ele cobre: mudanças locais concorrentes ao sync. Convergência de nós remotos é papel do RBSR.

### §3 — Atomicidade grafo × projeção

Se `PM.onNodeInserted` roda fora da tx do grafo, um crash entre commit e projeção deixa
`entity_members` sem o nó. O perigo real não é staleness de leitura — é que o fallback atual do
`insertNode` (`lineage.ts:130`) usa `entityId = parentId` quando a projeção não responde,
**criando uma entidade nova errada em silêncio** para netos. Contramedidas (ambas obrigatórias):

1. **Correção semântica:** o fallback passa a ser *walk-to-root* via arestas MUTATES (a projeção
   é cache; o grafo é a verdade). Staleness deixa de poder corromper.
2. **Recuperação:** o PM persiste `lastProjectedHlc`; no boot, catch-up =
   `scanSince(lastProjectedHlc)` → `onNodeInserted` idempotente. `rebuild()` (já na interface)
   cobre o caso degenerado.

Alternativa rejeitada: embutir projeção na `GraphStoreTx` — acoplaria a porta replicada a um
detalhe de materialização local, violando o ADR-005 §2, e obrigaria cada adapter KV a conhecer
`entity_heads`.

### §4 — Tombstones do convite (decisão D1)

Hoje: tabela local criada ad-hoc **pelo caller** (`CREATE TABLE` dentro de `validateInvite`), e a
cerimônia mistura escrita de grafo + tombstone na mesma tx SQL — impossível com porta tipada +
estado local separado.

- **Opção A (recomendada): tombstone vira nó do grafo** — `node_type: 'INVITE_TOMBSTONE'`, id
  determinístico `invite:<code>`, payload vazio. O single-use passa a ser o próprio invariante de
  unicidade do `putNode` dentro da mesma `GraphStoreTx` da cerimônia: id duplicado → tx inteira
  aborta. Anti-TOCTOU de graça, atomicidade preservada, e o tombstone **replica** — outros peers
  também recusam o convite consumido (hoje a proteção é só local; defesa em profundidade).
  Custo: novo node_type no modelo replicado — por isso é `decide`, não suposição.
- **Opção B: tombstone em estado local** (`StoragePort` local), com ordem
  *escreve-tombstone-primeiro, depois tx do grafo*. Falha no meio = convite queimado sem consumo —
  direção segura de falha. Perde atomicidade e replicação.

### §5 — Performance

- `scanSince` exige índice por hlc que **não existe hoje** — o `WHERE hlc > ?` atual é full scan.
  A migração cria `idx_nodes_hlc`: a porta fica *mais rápida* que o SQL que substitui.
- `detectFork` via `getEdges().length` materializa poucas linhas (out-degree típico ≤ 3) sobre
  `idx_edges_source`+`idx_edges_type` existentes — sem regressão mensurável.
- `detectStructuralFork`/`isAncestorOf` já são O(tips² × depth) hoje; a porta não piora (mesmos
  índices). Fora do escopo otimizar.
- `rangeScan`/`scanSince` materializam `stmt.all()` internamente por ora — o contrato
  `AsyncIterable` permite streaming depois sem quebrar callers.

---

## Teste de conformidade comum (SQLite, WASM e KV)

Suite parametrizada no testkit: `describeGraphStorePortContract(name, makeStore)` rodada contra
`SqliteStorage`, `SqliteWasmStorage` e um novo **`MemoryGraphStore`** (Map ordenado, ~100 linhas,
vive no testkit). O MemoryGraphStore é o "segundo backend de prova" que o ADR-005 §Consequências
pedia — um KV em memória prova o contrato sem pagar LMDB/RocksDB agora.

Casos do contrato (cada um é um invariante da porta):

1. `putNode`/`getNode` round-trip byte-exato (payload, chaves, parentHash) e **hlc bigint exato
   com valor > 2^53** (mata o bug do §1).
2. `putNode` re-put idêntico = no-op; conflitante (mesmo id, bytes diferentes) = rejeição.
3. `getEdges` por cada combinação de filtro {source, target, type} e sem filtro.
4. `rangeScan`: ordem lexicográfica estrita, intervalo `[lo, hi)`, vazio quando `lo ≥ hi`.
5. `latestHlc`: null em grafo vazio; correto após puts fora de ordem; monotônico.
6. `scanSince`: estritamente exclusivo; ordenado por (hlc, id); consistente com
   `HybridLogicalClock.compare`; `scanSince(latestHlc())` vazio.
7. `transaction`: rollback total em erro (nó E aresta somem); read-your-writes (`tx.getNode` vê
   `tx.putNode` não-commitado); conflito de `putNode` dentro da tx aborta tudo.

---

## Plano executável por Sonnet (fases com gate individual)

Pré-condição: worker atual da T-1043 pausa ou finaliza; branch antiga `task/t-1043` descartada
(superseded). Cada fase = 1+ commits na worktree; gate = `pnpm --filter @plataforma/core build &&
test && lint` (+ protocol/testkit onde tocados).

| Fase | Entrega | Gate específico |
|---|---|---|
| 1 | `protocol`: `latestHlc`, `scanSince`, reads na `GraphStoreTx`, doc de `putNode` idempotente | build+test protocol |
| 2 | `testkit`: `graphStorePortContract` + `MemoryGraphStore` | contrato verde no MemoryGraphStore |
| 3 | Adapters SQLite+WASM: fix HLC (D2), `idx_nodes_hlc`, novos métodos, tx reads | contrato verde nos 3 adapters |
| 4 | `SqliteProjectionManager` (impl produção + `getEntityOf` + `lastProjectedHlc` + catch-up via `scanSince`) | `projection.test.ts` estendido |
| 5 | Migrar `lineage.ts` (fallback walk-to-root do §3 incluso) | testes core |
| 6 | Migrar `merge.ts` | testes core |
| 7 | Migrar `concurrentGuard.ts` (C1→`latestHlc`, C2→`scanSince`, C4→`getNode`) | testes core |
| 8 | Migrar `invite.ts` conforme D1 | testes core |
| 9 | Split `schema.ts` (DDL grafo → adapter; V2 → SqliteProjectionManager) | suite completa + convergência testkit |
| 10 | Lint-guard: proibir `nodes`/`edges` em SQL fora de `sqliteStorage*.ts` (`no-restricted-syntax` ou grep no CI) | lint |

Fases 5–8 são independentes entre si após a 4 — podem ser tasks separadas se a T-1043 for
decomposta (recomendado dado o histórico de 2 pauses: 1043a = fases 1–4, 1043b = 5–9, 10 junto).

## Decisões pendentes (para `/arquiteto-decisoes`)

- **D1** — Tombstone de convite: **A** (nó replicado `INVITE_TOMBSTONE`, recomendada) vs B (estado local).
- **D2** — Encoding HLC: **INTEGER bigint 64-bit** (recomendada) vs TEXT largura-fixa 20 dígitos (fallback WASM se o driver não der bigint).

## Aprendizados (Lei de Aprendizado — vivem neste ADR, artefato canônico)

- Invariante de domínio elimina consulta: HLC(filho) > HLC(pai) ⇒ raiz tem o menor HLC da
  entidade ⇒ o join+COUNT de C4 é um lookup. Antes de estender uma porta para acomodar uma query,
  pergunte se um invariante já responde a pergunta.
- `Number(bigint)` em fronteira de serialização é corrupção silenciosa acima de 2^53 — HLCs com
  counter embutido estouram isso por design. Todo contrato de porta com HLC precisa de teste de
  round-trip com valor > 2^53.
- Coluna SQLite com afinidade TEXT recebendo ora string ora número compara por classe de storage,
  não por valor — `MAX()` mente. Encoding canônico é parte do contrato, não detalhe do adapter.
