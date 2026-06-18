---
title: Virtual Foreign Key (VFK)
slug: vfk
aliases:
  - VFK
  - Virtual Foreign Key
tags:
  - sdk
  - canonical
  - onda-7
modo: canonical
fonte-canonica: docs/caderno-3-sdk/01-sqlite-and-projections-schema.md §2.1
aparicoes-consolidadas:
  - docs/glossary.md §Virtual Foreign Key
dependencias:
  - [[ulid]]
  - [[aresta]]
  - [[sync-worker]]
  - [[tinybase]]
---

# Virtual Foreign Key (VFK)

## Definição

**Virtual Foreign Key (VFK)** é o mecanismo de integridade referencial polimórfica usado pela plataforma para resolver, em $O(1)$, a qual tabela (`nodes` ou `edges`) aponta o campo `target_id` de uma aresta — sem depender de `FOREIGN KEY` física do SQLite nem de consulta extra ao banco.

O SQLite não suporta chaves estrangeiras polimórficas que apontem para tabelas distintas. O campo `target_id` da tabela `edges` precisa ser polimórfico: pode apontar para `nodes(id)` (caso comum) ou para `edges(id)` (ex.: aresta `WITNESSED_BY` apontando para uma aresta de transação).

## Mecanismo

A solução consiste em reservar o **11º caractere (index 10)** do [[ulid]] — imediatamente após os 48 bits de timestamp — como **discriminador de tabela**:

| caractere | tabela-alvo | exemplo de id |
|:----------|:------------|:--------------|
| `N` | `nodes` | `01J2X3Y4Z5N6Y7Z8A9BC...` |
| qualquer outro | `edges`  | `01J2X3Y4Z5E6Y7Z8A9BC...` |

A inspeção é uma única leitura de caractere — $O(1)$ — executada pela camada do [[sync-worker]] e do [[tinybase]] antes de qualquer join ou projeção.

A FK física é removida do DDL; a constraint passa a ser responsabilidade da camada de aplicação:

```sql
-- edges.target_id: sem FOREIGN KEY física
target_id TEXT NOT NULL,  -- polimórfico via VFK (nó ou aresta)
```

Os IDs são mantidos como `TEXT` (não `BLOB`) exatamente por causa da VFK: blobificar economizaria ~10 bytes por ID, mas destruiria a inspeção do caractere e a ordenação lexicográfica. O custo de ergonomia é intencional.

## Por quê

O modelo de grafo exige arestas que apontem tanto para nós quanto para outras arestas (grafo de grafos). Introduzir uma coluna de discriminação separada (`target_type`) seria redundante e susceptível a dessincronização. Embutir o tipo no próprio ULID mantém o discriminador inseparável do identificador, auditável via assinatura criptográfica e resolvível sem JOIN.

## Contrato

A definição normativa completa — incluindo exemplos de DDL e raciocínio de tradeoff TEXT vs BLOB — está em:

- [caderno-3-sdk/01-sqlite-and-projections-schema.md §2.1 — Virtual Foreign Keys (VFK) por Bitmasking de Caractere](../caderno-3-sdk/01-sqlite-and-projections-schema.md)

Regras:
1. Se o 11º caractere for **`N`**, o `id` pertence à tabela `nodes`. Se o 11º caractere **não for `N`**, o `id` pertence à tabela `edges`.
2. Qualquer novo tipo de tabela replicável que precise de referências polimórficas **deve** reservar um caractere distinto via RFC de schema (a convenção é extensão da plataforma sobre o spec padrão do ULID).
3. A verificação da VFK é obrigatória na camada [[sync-worker]]/[[tinybase]] antes de inserir ou projetar uma aresta; violações devem ser rejeitadas como erro de integridade.

## Aparições a consolidar

- `docs/glossary.md §Virtual Foreign Key` — define o conceito em uma linha; consolidado neste verbete.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[ulid]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[sync-worker]] | 7 | criado |
| [[tinybase]] | 7 | criado |


