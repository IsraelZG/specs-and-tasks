---
name: consumes-aresta
title: "Aresta CONSUMES"
aliases: ["CONSUMES", "CONSUMES (v4)"]
tags: [protocol, ontologia, arestas, contribuicao, consumo, v4]
---

# Aresta CONSUMES

`CONSUMES` é uma aresta de contribuição/consumo do grafo da plataforma que expressa o ato de um [[profile]] consumir um [[content]]. É distinta dos verbos raiz canônicos (ver [[verbos-raiz-canonicos]]) por ter histórico próprio e fazer parte do trio de arestas de contribuição social e econômica introduzidas na v4.

## Definição

Conforme `caderno-2-protocol/01-graph-ontology.md §2.3`:

> **`CONSUMES`** — Liga um `PROFILE` a um `CONTENT` consumido (ex.: chunks de um `CONTENT:FILE`). Verbo distinto (ato do consumidor; histórico próprio).

Confirmado em `rfc-v4.md §3.2`:

> | `CONSUMES` | `PROFILE` → `CONTENT` | Consumo (histórico próprio; verbo distinto) |

## Estrutura da aresta

| Campo | Valor |
|:---|:---|
| Sujeito | `PROFILE` (qualquer subtipo) |
| Objeto | `CONTENT` consumido (ex.: `CONTENT:FILE`) |
| Cardinalidade | N → N (um profile pode consumir múltiplos conteúdos; um conteúdo pode ser consumido por múltiplos profiles) |
| Granularidade | Sessão/época — não por chunk individual |

A granularidade de sessão/época é normativa. Conforme `rfc-v4.md §3.3`:

> Agregação para conter volume: `CONSUMES`/`SERVES`/`CONTRIBUTES` em granularidade de **sessão/época**, não por chunk (recibos por chunk são efêmeros e consolidados).

## Posição no trio de arestas de contribuição social (v4)

`CONSUMES` integra o trio introduzido em `caderno-2-protocol/01-graph-ontology.md §2.3`, junto com [[contributes-aresta]] e [[blocks-aresta]]:

| Aresta | Sujeito | Objeto | Semântica |
|:---|:---|:---|:---|
| `CONSUMES` | `PROFILE` | `CONTENT` | Ato do consumidor; histórico próprio |
| `CONTRIBUTES` | `PROFILE:SYSTEM` | prova de contribuição | Banda/storage/compute unificados por `kind` |
| `BLOCKS` | `PROFILE` | `PROFILE` | Bloqueio social (filtro de leitura, limitado) |

Diferença fundamental: `CONTRIBUTES` é exclusiva de [[profile-system]]; `CONSUMES` e `BLOCKS` são abertas a qualquer subtipo de [[profile]].

## Relação com o modelo econômico (v4)

`CONSUMES` cria o lado da demanda do modelo de contribuição. Conforme `rfc-v4.md §3.3`, a contraparte `CONTRIBUTES` acumula *standing* em um `ASSET:BALANCE_STATE` de contribuição governado por SPEC — de forma análoga a como `TRANSFERRED_TO` está para saldos monetários. `CONSUMES` registra quem usou recursos; a precificação e o matching com `CONTRIBUTES` são responsabilidade da SPEC de contribuição.

<!-- TODO(revisar) A relação exata entre CONSUMES e o cálculo de standing/reputação local (rfc-v4 §3.3–3.4) deve ser conferida quando os verbetes contributes-aresta e standing forem criados (Ondas 3 e 10). -->

## Distinção de outros verbos

`CONSUMES` **não é** um verbo raiz canônico (ver [[verbos-raiz-canonicos]]). Os verbos raiz (`RELATES`, `OWNS`, `GOVERNS`, `INTERACTS`, `PARTICIPATES_IN`) expressam relações estruturais ou sociais genéricas. `CONSUMES` expressa um ato de consumo concreto, com histórico dedicado — por isso merece aresta própria e não é modelado como `INTERACTS:CONTENT:CONSUMES`.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[aresta]] | 1 | criado |
| [[no]] | 1 | criado |
| [[profile]] | 1 | criado |
| [[content]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| [[profile-system]] | 3 | criado |
| [[contributes-aresta]] | 3 | placeholder |
| [[blocks-aresta]] | 3 | placeholder |
| [[standing]] | 10 | placeholder |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§2.3` | Substituir definição inline por `[[consumes-aresta]]` |
| `glossary.md` | `§CONSUMES (v4)` | Substituir por link `[[consumes-aresta]]` |
| `rfc-v4.md` | `§3.2` e `§3.3` | Substituir menções definitórias por `[[consumes-aresta]]` |


