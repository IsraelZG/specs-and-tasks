# ADR 0002 — Manutenção de `entity_heads` em código (funil `insertNode` único)

- **Status:** aceito (2026-06-25 — arquiteto, destrava T-108-rework-3 [M2])
- **Contexto:** T-108-rework-3 escalou a divergência entre spec original (trigger SQLite
  `AFTER INSERT ON nodes` para manter `entity_heads`) e implementação (manutenção manual em
  `lineage.ts:126-145`, dentro da `transaction` de `insertNode`).
- **Decisores:** arquiteto

## Problema

A spec T-108 original prescrevia `CREATE TRIGGER trg_nodes_insert_entity_head AFTER INSERT ON
nodes FOR EACH ROW ...` para manter `entity_heads` atualizada. A implementação escolheu fazer
isso **em código**, dentro de `storage.transaction(...)` em `insertNode`. Há dois riscos
arquiteturais a ponderar:

1. **Suporte a triggers em `wa-sqlite` (browser, OPFS) é parcial.** O peer-do-sistema roda em
   Node, mas clientes rodam em browser — feature-flag por backend seria inevitável.
2. **Vetor de dessincronização:** qualquer `INSERT INTO nodes` que **bypassar** `insertNode` deixa
   `entity_heads` (e `entity_members`) silenciosamente inconsistentes.

## Decisão

**Opção B (manutenção em código) + Invariante do funil único.**

### B1 — Manter manutenção em código
- A manutenção de `entity_heads` e `entity_members` continua dentro de `storage.transaction(...)`
  em `insertNode` (lineage.ts:126-145, 113-116). Sem trigger no schema.
- Não introduz feature-flag por backend; `insertNode` é JS puro, isomórfico.

### B2 — Invariante do funil único (normativo)

> **U3 — `insertNode` é a ÚNICA API de inserção de nós que afeta linhagem.** Qualquer código que
> insira `SignedNode`s no storage — sincronização RBSR, hidratação de snapshot (T-308), apply de
> patch remoto, repositório Automerge — DEVE passar pelo helper `insertNode` (encapsulando a
> `transaction` com a manutenção de `entity_members`/`entity_heads`), ou por um helper explícito
> que **na mesma transação** atualize ambas as tabelas auxiliares.
>
> **NÃO é permitido** `INSERT INTO nodes ...` direto sem manter `entity_members` e `entity_heads`
> atomicamente no mesmo `transaction`. O bug que isso previne: snapshot bulk-import silenciosamente
> dessincronizando `entity_heads`.

Este ADR formaliza a invariante; **não** exige mecanismo de enforcement em runtime (não há trigger,
não há check constraint). A invariante é protegida por **aprovação de revisão**: qualquer task que
introduza novo caminho de `INSERT INTO nodes` deve justificar no seu §3 que passa por `insertNode`.

## Alternativas consideradas

- **A — Trigger SQLite puro.** Rejeitada: requer feature-flag por backend (`wa-sqlite` suporta
  parcialmente), aumenta complexidade de testes, e o trigger cegaria a manutenção em JS do
  sync-worker (que tem acesso ao HLC e ao contexto de entidade — informação que o trigger não tem).
- **C — Re-arquitetar para `entity_heads` como projeção materializada por trigger único.** Rejeitada:
  complexidade alta; o trigger teria que saber HLC (string ordenável), o que duplica lógica de
  comparação entre SQL e JS.

## Consequências

- Sem mudança de schema (continua V2; **sem trigger**).
- Sem mudança em `lineage.ts:126-145` (manutenção em código já está correta).
- ADR `0001` (representação) e ADR `0002` (manutenção) são ortogonais mas ambos reforçam o
  modelo "JS é a fonte de verdade para a topologia do grafo; SQL é armazenamento dumb".
- **Brecha preventiva rastreada:** se T-308-rework-2 introduzir persistência de snapshot que
  insere nós em bulk, **deve** fazê-lo via `insertNode` (ou helper equivalente na mesma
  transação). Verificado na auditoria que `hydrateSnapshot` atual **não persiste** (retorna
  `{nodes, edges}` em memória) — a invariante é preventiva; quando bulk-import chegar, a
  própria task responsável declara conformidade com U3.