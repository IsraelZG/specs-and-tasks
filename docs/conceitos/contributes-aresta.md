---
name: contributes-aresta
title: "Aresta CONTRIBUTES"
aliases: ["CONTRIBUTES", "CONTRIBUTES (v4)"]
tags: [protocol, ontologia, arestas, contribuicao, v4]
---

# Aresta CONTRIBUTES

`CONTRIBUTES` é uma aresta de contribuição de infraestrutura do grafo da plataforma que expressa o ato de um [[profile-system]] registrar uma prova de contribuição à rede. É distinta dos verbos raiz canônicos (ver [[verbos-raiz-canonicos]]) por ser exclusiva de agentes de sistema e por unificar três tipos de contribuição de infraestrutura num único tipo diferenciado por payload. Integra o trio de arestas de contribuição social e econômica introduzidas na v4, sendo o verbo simétrico/complementar de [[consumes-aresta]].

## Definição

Conforme `caderno-2-protocol/01-graph-ontology.md §2.3`:

> **`CONTRIBUTES`** — Liga um `PROFILE:SYSTEM` à prova de contribuição à rede. Unifica banda, storage e processamento por atributo `kind: serve | store | compute` — mesmo tipo diferenciado por payload, pois validação/cripto/sync são idênticas (critério 1 do §4). O *standing* acumulado é um `ASSET:BALANCE_STATE` de contribuição (ver caderno-3/03 §X / RFC §3.3).

Confirmado em `rfc-v4.md §3.2`:

> | `CONTRIBUTES` | `PROFILE:SYSTEM` → prova de contribuição | Banda/storage/compute unificados por `kind` no atributo |

## Estrutura da aresta

| Campo | Valor |
|:---|:---|
| Sujeito | `PROFILE:SYSTEM` (exclusivo — ver [[profile-system]]) |
| Objeto | Prova de contribuição à rede |
| Atributo discriminante | `kind: serve \| store \| compute` |
| Cardinalidade | N → N (um agente de sistema pode contribuir com múltiplos tipos; múltiplos agentes contribuem para a rede) |
| Granularidade | Sessão/época — não por chunk individual |

A granularidade de sessão/época é normativa. Conforme `rfc-v4.md §3.3`:

> Agregação para conter volume: `CONSUMES`/`SERVES`/`CONTRIBUTES` em granularidade de **sessão/época**, não por chunk (recibos por chunk são efêmeros e consolidados).

## Os três regimes de contribuição

Conforme `rfc-v4.md §3.3`, a aresta `CONTRIBUTES` unifica três formas de contribuição de infraestrutura, diferenciadas pelo atributo `kind`:

| `kind` | Contribuição | Verificação | Confiança |
|:---|:---|:---|:---|
| `serve` | Banda | Recibo assinado pela **contraparte**, ancorado ao `InfoHash`/hash de chunk do grafo | Bilateral, verificável-pelo-dado |
| `store` | Storage | **Desafio-resposta** de retrievability | Verificável sob demanda |
| `compute` | Compute determinístico (validação, merge, regra Zen) | **Reexecução de amostra aleatória** | Probabilístico |

Conforme `rfc-v4.md §3.3`:

> `CONTRIBUTES` unifica os três tipos de contribuição (`kind: serve|store|compute`) porque suas regras de validação/cripto/sync são idênticas e só muda o rótulo — exatamente o critério de "mesmo tipo diferenciado por payload". Falta de validação **não** gera aresta nova: ver §2.5.

> O seed da amostragem deriva do `output_digest`/beacon, **nunca** de um contador que o ator incrementa (anti-grinding).

## Posição no trio de arestas de contribuição social (v4)

`CONTRIBUTES` integra o trio introduzido em `caderno-2-protocol/01-graph-ontology.md §2.3`, junto com [[consumes-aresta]] e [[blocks-aresta]]:

| Aresta | Sujeito | Objeto | Semântica |
|:---|:---|:---|:---|
| `CONSUMES` | `PROFILE` | `CONTENT` | Ato do consumidor; histórico próprio |
| `CONTRIBUTES` | `PROFILE:SYSTEM` | prova de contribuição | Banda/storage/compute unificados por `kind` |
| `BLOCKS` | `PROFILE` | `PROFILE` | Bloqueio social (filtro de leitura, limitado) |

Diferença fundamental: `CONTRIBUTES` é exclusiva de [[profile-system]]; `CONSUMES` e `BLOCKS` são abertas a qualquer subtipo de [[profile]].

## Relação com o modelo econômico (v4)

`CONTRIBUTES` cria o lado da oferta do modelo de contribuição. Conforme `rfc-v4.md §3.3`:

> O *standing* acumulado é um `ASSET:BALANCE_STATE` governado por SPEC de contribuição — a aresta de contribuição está para esse saldo como `TRANSFERRED_TO` está para o saldo de dinheiro. Zero tipo de nó novo; mesmo code path de qualquer saldo.

O *standing* acumulado via `CONTRIBUTES` é um [[asset-balance-state]] de contribuição governado por SPEC. A contraparte [[consumes-aresta]] registra quem usou recursos; a precificação e o matching são responsabilidade da SPEC de contribuição.

O cálculo de standing e reputação está detalhado em [[standing]] e [[reputacao-local]]. <!-- TODO(revisar): a referência "caderno-3/03 §X" no caderno-2/01 §2.2 usa §X placeholder — localização definitiva pendente. -->

## Distinção de outros verbos

`CONTRIBUTES` **não é** um verbo raiz canônico (ver [[verbos-raiz-canonicos]]). Os verbos raiz (`RELATES`, `OWNS`, `GOVERNS`, `INTERACTS`, `PARTICIPATES_IN`) expressam relações estruturais ou sociais genéricas. `CONTRIBUTES` expressa um ato de contribuição de infraestrutura verificável, com histórico dedicado — por isso merece aresta própria e não é modelado como `INTERACTS:INFRA:CONTRIBUTES`.

A aresta é exclusiva de `PROFILE:SYSTEM` porque agentes humanos não contribuem diretamente com infraestrutura de rede; a contribuição humana é mediada pelo agente de sistema ligado ao seu `PROFILE:AUTHENTICATION`.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[aresta]] | 1 | criado |
| [[no]] | 1 | criado |
| [[profile]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| [[profile-system]] | 3 | criado |
| [[consumes-aresta]] | 3 | criado |
| [[blocks-aresta]] | 3 | placeholder |
| [[standing]] | 10 | placeholder |
| [[reputacao-local]] | 10 | placeholder |
| [[agente-de-sistema]] | 10 | placeholder |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§2.3` | Substituir definição inline por `[[contributes-aresta]]` |
| `glossary.md` | `§CONTRIBUTES (v4)` | Substituir por link `[[contributes-aresta]]` |
| `rfc-v4.md` | `§3.2` e `§3.3` | Substituir menções definitórias por `[[contributes-aresta]]` |


