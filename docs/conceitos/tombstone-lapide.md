---
title: Tombstone (Lápide)
slug: tombstone-lapide
aliases:
  - Tombstone
  - Lápide
  - tombstone
tags:
  - sdk
  - canonical
  - onda-7
modo: canonical
fonte-canonica: docs/caderno-3-sdk/01-sqlite-and-projections-schema.md §2.2
aparicoes-consolidadas:
  - docs/glossary.md §Tombstone
  - docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.10.3
dependencias:
  - [[aresta]]
  - [[imutabilidade-dupla]]
  - [[retention-state]]
  - [[g4-garbage-collection]]
  - [[active-edges]]
---

# Tombstone (Lápide)

## Definição

**Tombstone** (ou **lápide**) é o mecanismo de deleção lógica da plataforma no modelo append-only: em vez de remover um registro fisicamente, marca-se a [[aresta]] como inativa (`active = 0`). O registro original nunca é destruído; apenas se torna invisível para consultas da aplicação.

## Protocolo

O protocolo completo está definido em [`caderno-3-sdk/01-sqlite-and-projections-schema.md §2.2`](../caderno-3-sdk/01-sqlite-and-projections-schema.md):

1. A deleção marca a aresta como inativa (`active = 0`), criando a lápide.
2. Um trigger local remove a relação da projeção [[active-edges]], tornando-a invisível para consultas da aplicação.
3. O registro original e a lápide permanecem no grafo para auditoria.
4. O [[g4-garbage-collection]] pode podar lápides expiradas após **N ciclos de auditoria**, respeitando os requisitos de retenção legal de cada modalidade:
   - Financeiro: 5 anos.
   - Conteúdo comum: configurável pela `SPECIFICATION`.

Registros marcados como `retention_state = expunged` (ver [[retention-state]]) não preservam payload nem assinatura; apenas o `id` permanece como âncora de auditoria.

## Garantias

- **[[imutabilidade-dupla]] preservada**: a lápide é uma nova aresta; o registro original não sofre `UPDATE`.
- **Invisibilidade operacional**: a projeção [[active-edges]] filtra automaticamente as lápides via trigger SQLite.
- **Auditabilidade**: a sequência registro → lápide → (eventual expurgo) é rastreável no grafo pela [[linhagem-de-versoes]].

## Usos recorrentes no grafo

| contexto | efeito tombstone |
|:---------|:-----------------|
| Deleção de conteúdo | aresta para o nó-conteúdo recebe `active = 0` |
| Consumo de `ASSET:INVITE` | convite vira lápide após cerimônia Noise_XX |
| Expiração de `ASSET:LOCK` | TTL vencido aciona lápide/GC, liberando o head |
| Revogação de `ASSET:PERMISSION`/`ASSET:ROLE` | aresta de delegação recebe `active = 0` |
| Moderação (`BELONGS_TO`) | lápide sobre aresta desvincula post do feed sem corromper assinatura do autor |

## Aparições a consolidar

- `docs/glossary.md §Tombstone (Lápide)` — definição em uma linha; consolidada neste verbete.
- `docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.10.3` — repete o protocolo de quatro etapas; consolidado neste verbete.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[aresta]] | 1 | criado |
| [[imutabilidade-dupla]] | 1.5 | criado |
| `retention_state` | — | não é alvo de verbete na Fase 2; documentado em [[caderno-3-sdk/01-sqlite-and-projections-schema]] |
| [[g4-garbage-collection]] | 7 | criado |
| [[active-edges]] | — | não é alvo de verbete na Fase 2 (sem ★) |


