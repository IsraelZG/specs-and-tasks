---
name: id
title: "Campo id (identificador de versão de nó)"
aliases: ["node id", "id de nó", "version id"]
tags: [protocol, identificadores]
---

# Campo `id`

## Definição

`id` é o [[ulid]] que identifica **uma versão específica e imutável de um nó** no grafo. Uma vez atribuído na criação do nó, nunca muda — o nó é append-only. Contrasta diretamente com [[entity-id]]: enquanto `id` aponta para um nó concreto (um snapshot), `entity_id` é o fio que une todas as versões daquela entidade ao longo do tempo através da linhagem de [[mutates]]. A distinção é recorrente e causa confusão: `id` é "quem é este objeto específico"; `entity_id` é "a que entidade este objeto pertence".

## Por quê

O modelo é imutável: editar um nó produz um novo nó conectado ao anterior por uma aresta [[mutates]]. Sem dois campos distintos, não seria possível referenciar "a entidade X no seu estado atual" (via `entity_id` + consulta de [[head]]) nem "exatamente esta versão de X" (via `id`). Ter ambos mantém os links estáveis mesmo quando a entidade evolui.

## Contrato

- `id` é um [[ulid]] com o 11º caractere fixo em `N` (nó) ou `E` (aresta) — discriminador de tabela para Virtual Foreign Keys.
- `id` é imutável após a criação; qualquer "edição" produz um novo nó com novo `id`, mesmo `entity_id`.
- `entity_id` de um nó criador (sem pai) é igual ao seu próprio `id`. Versões subsequentes herdam o `entity_id` do nó raiz da linhagem.

## Implementação

O campo `id TEXT PRIMARY KEY` na tabela `nodes` (e o equivalente em `edges`) é definido em [[caderno-3-sdk/01-sqlite-and-projections-schema#1-schema-das-tabelas-replicáveis-nodes-e-edges]].

## Evolução

Estável. O formato ULID e a semântica de imutabilidade são invariantes do schema v4.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§id` | Substituir pelo wikilink `[[id]]` |
| `glossary.md` | `§entity_id` | Substituir pelo wikilink `[[entity-id]]` |
