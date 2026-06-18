---
name: aggregates
title: "Aresta AGGREGATES"
aliases: ["AGGREGATES", "aresta de composição de papel"]
tags: [protocol, ontologia, arestas, acesso, permissões]
---

# Aresta AGGREGATES

## Definição

`AGGREGATES` é uma **aresta estrutural permanente** que liga um [[asset-role]] a uma [[asset-permission]], indicando que o papel engloba aquela permissão. É um dos dois verbos estruturais do modelo de controle de acesso (o outro é [[requires]]).

Conforme `caderno-2-protocol/01-graph-ontology.md §2.1`:

> **`AGGREGATES`** — Liga uma `ASSET:ROLE` a uma `ASSET:PERMISSION`, indicando que o papel engloba aquela permissão.

A semântica completa de como `ASSET:ROLE` agrega permissões atômicas via `AGGREGATES` está em **[[caderno-2-protocol/01-graph-ontology#21-verbos-raiz-canônicos-e-relacionais]]**.

## Por quê

Seguindo o [[substantivo-verbo-principio]], o **ato de compor um papel** é um verbo (aresta), não um atributo embutido no nó `ASSET:ROLE`. Isso garante:

- Auditabilidade: a composição é um fato do grafo, traversável e assinado como qualquer outra aresta.
- Imutabilidade: adicionar ou remover uma permissão de um papel gera nova versão do nó de papel (via [[mutates]]), não uma mutação in-place de lista.
- Reusabilidade: a mesma `ASSET:PERMISSION` pode ser ligada a múltiplos papéis via múltiplas arestas `AGGREGATES`, sem duplicação de definição.

## Contrato

- **Direção:** `source_id` = `ASSET:ROLE` → `target_id` = `ASSET:PERMISSION` (aponta para o `entity_id` da permissão, referência estável de linhagem — mesmo padrão de `CREDITS`).
- **Cardinalidade:** um papel pode agregar N permissões; uma permissão pode ser agregada por N papéis.
- **Estrutural permanente:** não admite specifiers (`AGGREGATES:X` não existe). A relação é sempre composição de papel → permissão atômica.
- `ASSET:PERMISSION` permanece **declarativa** (não executável); a execução é responsabilidade do Zen Engine / `SPECIFICATION` procedural.

## Relação com REQUIRES

`AGGREGATES` e [[requires]] são os dois verbos estruturais do modelo de permissões:

| aresta | source | target | semântica |
|:---|:---|:---|:---|
| `AGGREGATES` | `ASSET:ROLE` | `ASSET:PERMISSION` | papel engloba permissão |
| `REQUIRES` | `ASSET:PERMISSION` | `ASSET:PERMISSION` | permissão depende de outra |

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[aresta]] | 1 | criado |
| [[asset]] | 1 | criado |
| [[no]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| [[mutates]] | 1 | criado |
| [[asset-role]] | 2 | criado |
| [[asset-permission]] | 2 | criado |
| [[requires]] | 2 | placeholder |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§2.1` | Substituir descrição inline por `[[aggregates]]` |
| `glossary.md` | `§AGGREGATES` | Substituir definição por `[[aggregates]]` |
| `glossary.md` | `§ASSET:ROLE` | Substituir "por meio de arestas `AGGREGATES`" por `[[aggregates]]` |


