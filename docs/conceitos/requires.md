---
name: requires
title: "Aresta REQUIRES"
aliases: ["REQUIRES"]
tags: [protocol, ontologia, arestas, acesso, permissões]
---

# Aresta REQUIRES

`REQUIRES` é uma aresta estrutural permanente que liga uma [[asset-permission]] a outra, declarando que a primeira depende da segunda como pré-requisito de acesso.

## Definição

> **`REQUIRES`** — Liga uma `ASSET:PERMISSION` a outra, indicando uma dependência ou pré-requisito de acesso.

Fonte canônica: `caderno-2-protocol/01-graph-ontology.md §2.1`.

## Papel na ontologia

`REQUIRES` é uma das duas **arestas estruturais permanentes** do modelo de permissões (a outra é [[aggregates]]). Ambas apontam para o `entity_id` dos nós-alvo, seguindo o padrão de referência estável da ontologia:

| Aresta | De | Para | Semântica |
|:---|:---|:---|:---|
| `AGGREGATES` | `ASSET:ROLE` | `ASSET:PERMISSION` | o papel engloba aquela permissão |
| `REQUIRES` | `ASSET:PERMISSION` | `ASSET:PERMISSION` | a permissão depende da outra como pré-requisito |

Enquanto [[aggregates]] compõe permissões em papéis, `REQUIRES` expressa dependência entre permissões atômicas: conceder P₁ só é válido se P₂ também estiver concedida.

## Contexto de uso

`REQUIRES` opera exclusivamente dentro do subgrafo de controle de acesso. Os nós envolvidos são sempre do tipo [[asset-permission]] — direitos atômicos declarativos que definem queries de traversal e restrições. A execução das regras é responsabilidade do [[zen-engine]] (Onda 7), não das próprias arestas.

## Relacionamentos

- [[aresta]] — tipo base de todos os verbos no grafo
- [[verbos-raiz-canonicos]] — catálogo de verbos raiz; `REQUIRES` é uma aresta estrutural, não um verbo raiz de domínio
- [[asset-permission]] — nó de origem e de destino desta aresta
- [[asset-role]] — nó que usa [[aggregates]] para agrupar permissões
- [[aggregates]] — aresta irmã no mesmo subgrafo de controle de acesso


