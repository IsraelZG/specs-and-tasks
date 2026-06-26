---
name: merges
title: "Aresta MERGES"
aliases: ["MERGES", "aresta de merge", "aresta de incorporação de ramo", "incorporação de fork"]
tags: [protocol, ontologia, linhagem, arestas, fork]
---

# Aresta MERGES

## Definição

`MERGES` é a aresta estrutural que liga um **nó de merge** (source) aos **ramos concorrentes**
(target) que ele incorpora na resolução de um fork estrutural. Aponta do nó de merge para o ramo
incorporado — direção oposta ao [[mutates]] convencional (`mutates` aponta da nova versão para a
versão anterior; `MERGES` aponta do merge para o ramo consumido). Funciona para forks de 2 ou mais
ramos (uma aresta `MERGES` por ramo incorporado). Cada `MERGES` atesta que o conteúdo daquele ramo
foi consumido no nó de merge, marcando o ramo como "resolvido" para a detecção estrutural de fork.

## Por quê

`MUTATES` expressa "**esta** é a próxima versão linear da linhagem": um source, um target, um pai.
Tentar usar `MUTATES` para merge de N ramos concentraria em uma única aresta a semântica de
"continuação linear" (que tem pai único e encadeia `previous_hash`) e a de "incorporação de ramo
concorrente" (que tem múltiplos alvos e ao mesmo tempo não deve encadear `previous_hash` contra
si própria). Misturar as duas quebra o invariante `parentHash: NodeHash` único (rework-3 da T-108)
e impede a auditoria topológica limpa. `MERGES` separa estas duas ontologias — cada uma faz um
papel — preservando a cadeia linear de `MUTATES` intacta e dando aos merges um caminho de auditoria
próprio.

## Contrato

Os invariantes formais residem em
[caderno-2-protocol/02-cryptographic-lineage-and-auth#32-duas-camadas-de-imutabilidade](../caderno-2-protocol/02-cryptographic-lineage-and-auth.md)
e em
[caderno-2-protocol/04-automerge-integration-spec#42-resolucao-de-forks](../caderno-2-protocol/04-automerge-integration-spec.md).
Resumo dos pontos-chave:

- **Direção:** `source_id` = nó de merge (nodeType `MERGE`); `target_id` = ramo concorrente
  incorporado (branch tip). Inverso do [[mutates]].
- **`previous_hash`:** `MERGES` **não** carrega `previous_hash` (a coluna é NULL — ver
  I-MERGES-2). Não é parte da cadeia de imutabilidade da ordem linear; é apenas atestado de
  incorporação.
- **Monotonicidade:** `HLC(source) > HLC(target)` — mesmo invariante do [[mutates]] e de qualquer
  relação causal no grafo.
- **Mesma `entity_id`:** `source.entity_id == target.entity_id` — só se mescla dentro da mesma
  linhagem (mesma entidade). Garante que `MERGES` nunca cruza entidades distintas.
- **Unicidade por (merge × ramo):** no máximo uma aresta `MERGES` por par
  `(merge_node, branch_tip)`. Id composto: `${C.id}->${Bi.id}#MERGES`.
- **Sem ciclos:** `target_id` deve ser ramo ativo do forkPoint ancestral do `source_id` — arestas
  `MERGES` não formam ciclos.
- **Detecção de fork resolvido:** ramos que possuem uma aresta `MERGES` incoming são considerados
  "já incorporados" e excluídos pela próxima rodada de `detectStructuralFork` — sem isto, o fork
  ficaria eternamente "ativo" mesmo após `C` existir.

## Implementação

O schema da tabela `edges` (em
[caderno-3-sdk/01-sqlite-and-projections-schema#1-schema-das-tabelas-replicaveis-nodes-e-edges](../caderno-3-sdk/01-sqlite-and-projections-schema.md))
aceita `MERGES` como valor de `type` sem mudança estrutural — a coluna `previous_hash` é BLOB
nullable, e `MERGES` simplesmente a deixa em NULL. O índice `idx_edges_target(target_id, type)`
já cobre a consulta "este ramo é target de algum `MERGES`?" em O(log n).

A criação das arestas `MERGES` acontece em `resolveFork` (T-601 rework-1, `packages/core/src/merge.ts`)
em transação separada do `insertNode` (que cuida da `MUTATES` de continuação linear), conforme
emenda da T-601 §1 nota.

## Evolução

`MERGES` é aresta estrutural primitiva; não admite especifiers nem subtipos. É introduzida pela
[RFC-028](../rfcs/rfc-028-aresta-merges.md) (2026-06-26) e registrada no
[ADR-0005](../adr/0005-aresta-merges.md). Alterações na sua semântica exigem RFC de protocolo com
impacto em caderno-2/02, caderno-2/04 e caderno-3/01 (os mesmos onde `MERGES` foi absorvida).