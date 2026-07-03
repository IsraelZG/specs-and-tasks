# ADR-005 — Agnosticismo de Engine de Storage: Query-Model para o Grafo, Projeções na Camada de Índice

- **Data:** 2026-07-02
- **Status:** Accepted
- **Autor:** Claude (sessão forte, spike T-1037)
- **Decisores:** arquiteto da plataforma (Israel) — decisão registrada em `tasks/T-1037.md §6`

---

## Contexto

Um dos princípios da plataforma é *"ninguém escreve SQL diretamente; o resto do sistema é abstraído pelo TinyBase"*. Uma auditoria (2026-07-02) constatou que esse princípio vale para o **resto do sistema** (a UI só fala com TinyBase, que é um store reativo tabular/KV, não SQL) — mas **não para o core**.

A `StoragePort` (`packages/protocol/src/ports.ts:51`) não é uma porta de *armazenamento*; é uma porta de *SQL*:

```ts
export interface StoragePort {
  exec(sql: string, params?: SqlParams): Promise<SqlRow[]>;   // ← o contrato É a linguagem SQL
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  migrate(migrations: Array<{ version: number; sql: string }>): Promise<void>;
}
```

Consequência: os serviços do core escrevem SQL cru por toda parte — **86 ocorrências em 8 arquivos** (`merge.ts`, `lineage.ts`, `invite.ts`, `schema.ts`, `blindArchives.ts`, `sync/concurrentGuard.ts`, `deviceState/schema.ts`, `sqliteStorage.ts`). Exemplo típico (`lineage.ts:51`): `await storage.exec('SELECT * FROM nodes WHERE id = ?', [id])`.

A `visao-arquitetural.md §3` documenta esse acesso como intencional. O efeito colateral não documentado: **trocar de engine de armazenamento (Postgres, ou qualquer NoSQL/KV/documento) hoje é uma mudança de paradigma**, porque o contrato da porta é o dialeto SQL, não um modelo de query. A promessa "não acoplado a SQLite" na verdade é "não acoplado a um *driver* SQLite específico" — o *dialeto* está cravado no core.

### O que é e o que não é SQL-específico

Duas categorias distintas de tabela hoje passam pela mesma `StoragePort.exec`:

1. **Grafo append-only replicado** (`nodes`, `edges` — `schema.ts:5,16`): é o dado que atravessa a rede, precisa durar e precisa portar. As operações que o core faz sobre ele são **leitura por id, inserção de nó/aresta assinado, e range scans ordenados sobre ULIDs**. O RBSR (`caderno-2-protocol/03 §1`) precisa exatamente de *range scans ordenados* — o que um KV ordenado (LMDB/RocksDB/IndexedDB) atende **nativamente**, às vezes melhor que SQL. **Nada aqui é SQL-específico.**

2. **Projeções e estado local** (`entity_heads`, `entity_members`, `chat_conversations`, `drafts`, `prefetch_cache`, `ui_preferences`, `peer_history`, `blind_archives`): são derivadas do grafo (ou estado puramente local), **nunca replicadas**, sempre reconstruíveis. É onde vivem as consultas relacionais reais (joins, agregações, CTE de traversal para o filtro UCAN). Estas **são** SQL-friendly — mas são locais e descartáveis por definição.

O acoplamento problemático está **inteiramente** no item 1 exposto como SQL. O item 2 é um detalhe de materialização local.

---

## Decisão

Adota-se a **Opção C — híbrida** (dentre A: manter SQL-as-port; B: query-model total; C: híbrido). Registro da decisão do arquiteto em `tasks/T-1037.md §6`.

### 1. `StoragePort` deixa de expor `exec(sql)`

A porta passa a expor **operações do domínio do grafo**, tipadas e agnósticas de engine. Contrato-alvo (assinaturas finais fixadas no endurecimento das subtasks de implementação; forma):

```ts
export interface GraphStorePort {
  putNode(node: SignedNode): Promise<void>;
  getNode(id: EntityId): Promise<SignedNode | null>;
  putEdge(edge: SignedEdge): Promise<void>;
  getEdges(query: { source?: EntityId; target?: EntityId; type?: EdgeType }): Promise<SignedEdge[]>;
  /** Range scan ordenado por id (ULID) — a primitiva que o RBSR precisa. */
  rangeScan(lo: EntityId, hi: EntityId): AsyncIterable<SignedNode>;
  transaction<T>(fn: (tx: GraphStoreTx) => Promise<T>): Promise<T>;
}
```

O grafo append-only (nodes/edges) só é acessado por esta porta. Adapters concretos:
- **SQLite** (`packages/core/src/sqliteStorage.ts` evolui): traduz cada operação para SQL internamente — o SQL fica confinado ao adapter, não vaza para os 8 sítios do core.
- **Um KV/documento** como segundo backend de prova (a existência de um segundo adapter é o que *comprova* a portabilidade — hoje só há SQLite nativo + SQLite WASM/OPFS, ambos SQL).

### 2. Projeções NÃO fazem parte do contrato replicado — vivem na camada de índice (TinyBase-side)

As projeções (`entity_heads`, views, índices de busca) são **materializações locais** definidas *sobre* o query-model do grafo, na camada de leitura/índice — **não** SQL embutido no core. Consequência crítica (resposta direta à pergunta *"o core sempre usa um SQLite interno para as projeções?"* — **não**):

- Num deployment **SQLite**, as projeções vivem no mesmo SQLite do grafo — custo zero, é uma view/tabela derivada no mesmo arquivo.
- Num deployment **NoSQL/KV**, as projeções são re-materializadas via TinyBase, índice em memória, ou os índices secundários nativos daquele engine.
- **Nenhum deployment é forçado a arrastar um SQLite extra só para projeções.** Não existe "dois bancos".

Isso preserva o princípio no dado que importa (o grafo replicado fica engine-agnóstico) sem pagar a reescrita das projeções, que são locais e descartáveis.

### 3. TinyBase já é a fronteira agnóstica — nada muda para a UI

A UI já consome projeções via TinyBase (store reativo tabular/KV), sem tocar SQL. Esta decisão **não altera** essa fronteira; ela apenas estende o mesmo princípio ("o consumidor não vê o dialeto de armazenamento") de UI→TinyBase para core→GraphStorePort.

---

## Consequências

### Positivas
- NoSQL-ready **de verdade** no dado que atravessa a rede — o core nunca mais vê SQL.
- O princípio "não acoplar a SQLite" passa a ser literal (agnóstico de *dialeto*, não só de *driver*) para o grafo.
- RBSR ganha um contrato (`rangeScan`) que é natural em KV ordenado — potencialmente mais simples que a versão SQL atual.
- A superfície de acoplamento cai de 86 sítios espalhados para 1 adapter por engine.

### Negativas / Trade-offs
- **Custo de migração real:** reescrever os sítios de grafo dos 8 arquivos do core para a porta tipada, movendo o SQL para dentro do adapter SQLite. Risco de regressão no caminho de sync já testado — a implementação deve ser feita com a suíte de convergência (`@plataforma/testkit`) como rede de proteção.
- **Dois modelos de acesso coexistem:** grafo via query-model tipado; projeções via SQL local (dentro do adapter/índice). Exige disciplina de fronteira — a regra é: *se o dado replica, passa pela porta tipada; se é projeção local, é problema do adapter/índice*.
- A portabilidade só estará **provada** quando o segundo adapter (KV/documento) existir — até lá é uma asserção de contrato, não um fato demonstrado. (O transporte, em contraste, já tem dois adapters reais provando a `NetworkAdapterPort`.)

### Escopo de implementação (épico derivado — não faz parte deste ADR)
1. Definir as assinaturas finais de `GraphStorePort` (endurecimento).
2. Migrar o adapter SQLite atual para trás da porta tipada (SQL confinado).
3. Reescrever os sítios de grafo dos 8 arquivos do core.
4. Implementar um segundo adapter (KV/documento) como prova de portabilidade.
5. Formalizar a camada de projeção/índice sobre o query-model (relação com TinyBase).

---

## Alternativas Rejeitadas

| Alternativa | Razão da rejeição |
|---|---|
| **A — Manter SQL-as-port (`exec(sql)`)** | Custo zero agora, mas assume SQLite/Postgres para sempre; NoSQL fica fora e o core segue acoplado ao dialeto. Viola parcialmente o princípio "não acoplar a SQLite". |
| **B — Query-model total (grafo E projeções na porta tipada)** | NoSQL-ready total, mas custo alto: reescreve os 86 sítios *e* move as projeções relacionais (joins, agregações) para dentro do adapter, onde são desconfortáveis. Paga adiantado a reescrita de dado que é local e descartável por definição — over-engineering se as projeções nunca precisarem portar (e não precisam: são reconstruídas por engine). |

---

## Referências
- `tasks/T-1037.md` — spec do spike e registro da decisão do arquiteto (§6)
- `packages/protocol/src/ports.ts:51` — `StoragePort` atual (`exec(sql)`)
- `packages/core/src/schema.ts` — DDL de `nodes`/`edges` (grafo) e `entity_heads`/`entity_members` (projeção)
- `packages/core/src/deviceState/schema.ts` — estado local (`drafts`, `prefetch_cache`, `ui_preferences`, `peer_history`)
- `docs/visao-arquitetural.md §3, §4` — StoragePort e as 3 categorias de tabela
- `docs/caderno-2-protocol/03-set-reconciliation-protocol.md §1` — RBSR precisa de range scan ordenado
- `docs/conceitos/matriz-de-classificacao-transporte.md` — TinyBase como camada reativa agnóstica
