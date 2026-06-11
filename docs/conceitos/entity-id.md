---
name: entity-id
title: "entity_id (identificador de entidade)"
aliases: ["entityId", "entity_id", "identificador de entidade"]
tags: [protocol, identificadores, linhagem]
---

# Campo `entity_id`

## Definição

`entity_id` é o [[ulid]] do **nó-raiz da linhagem** de uma entidade: é atribuído uma única vez, no momento da criação do primeiro nó, e permanece imutável em todos os nós-versão subsequentes adicionados via [[mutates]]. Enquanto [[id]] identifica uma versão específica e muda a cada edição, `entity_id` é o fio de identidade que atravessa toda a [[linhagem-de-versoes]] de uma entidade — responde à pergunta "a que entidade este nó pertence?" independentemente de quantas vezes ela foi editada.

## Por quê

O modelo é imutável e append-only: edições produzem novos nós, não substituem os existentes. Sem um campo de identidade estável, não seria possível consultar "o estado atual da entidade X" nem agregar histórico de versões. `entity_id` é o invariante que permite tanto o acesso por [[head]] (`SELECT … WHERE entity_id = ? ORDER BY hlc DESC LIMIT 1`) quanto a auditoria completa de versões (`SELECT … WHERE entity_id = ? ORDER BY hlc`).

## Contrato

- **Valor inicial:** no nó-raiz (sem pai `MUTATES`), `entity_id = id` — a entidade nasce com o identificador de sua primeira versão.
- **Propagação:** cada novo nó-versão herda o `entity_id` do nó pai; a cadeia é verificável percorrendo as arestas [[mutates]] até a raiz.
- **Tipo:** [[ulid]] armazenado como `TEXT` — mesma convenção de `id`, sem discriminador de tipo no 11º caractere (o 11º char do `entity_id` reflete o tipo do nó-raiz, tipicamente `N`).
- **Unicidade de head:** a tabela `entity_heads` usa `entity_id` como chave primária para garantir exatamente um [[head]] por linhagem.

## Implementação

O campo `entity_id TEXT NOT NULL` nas tabelas `nodes` e `edges` está definido em [[caderno-3-sdk/01-sqlite-and-projections-schema#1-schema-das-tabelas-replicáveis-nodes-e-edges]]. A tabela `entity_heads` (§3.1 do mesmo caderno) é indexada por `entity_id` e mantida pelo trigger `trg_nodes_insert_entity_head` via comparação de [[hlc]].

## Evolução

Estável. A semântica `entity_id = id do nó-raiz` é invariante do schema v4.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§entity_id` | Substituir pelo wikilink `[[entity-id]]` |
| `caderno-3-sdk/01-sqlite-and-projections-schema.md` | `§1` (comentário DDL) | Adicionar link `[[entity-id]]` ao comentário da coluna |


