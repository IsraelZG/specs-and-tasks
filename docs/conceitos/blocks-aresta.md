---
name: blocks-aresta
title: "Aresta BLOCKS"
aliases: ["BLOCKS", "BLOCKS (v4)"]
tags: [protocol, ontologia, arestas, bloqueio-social, v4]
---

# Aresta BLOCKS

`BLOCKS` é uma aresta de relação social do grafo da plataforma que expressa o ato de um [[profile]] bloquear outro [[profile]]. É distinta dos verbos raiz canônicos (ver [[verbos-raiz-canonicos]]) por expressar um filtro de leitura social — não uma garantia criptográfica. Integra o trio de arestas de contribuição social e econômica introduzidas na v4, junto com [[consumes-aresta]] e [[contributes-aresta]].

## Definição

Conforme `caderno-2-protocol/01-graph-ontology.md §2.3`:

> **`BLOCKS`** — Liga um `PROFILE` a outro `PROFILE`. Conjunto **limitado** (dezenas), avaliado como filtro de leitura na montagem do feed público. Não é garantia criptográfica (ver caderno-2/02 §X / RFC §2.8).

Confirmado em `rfc-v4.md §3.2`:

> | `BLOCKS` | `PROFILE` → `PROFILE` | Bloqueio social (limitado, filtro de leitura) |

## Estrutura da aresta

| Campo | Valor |
|:---|:---|
| Sujeito | `PROFILE` (qualquer subtipo — o autor que bloqueia) |
| Objeto | `PROFILE` (o profile bloqueado) |
| Cardinalidade | N → N (um profile pode bloquear vários; um profile pode ser bloqueado por vários) |
| Cardinalidade prática | Conjunto **limitado** (dezenas, não milhões) — avaliado como filtro na montagem do feed |

## Semântica e força do bloqueio

A força do bloqueio `BLOCKS` depende do tipo de audiência do conteúdo. Conforme `rfc-v4.md §2.8`:

| Audiência | Força do bloqueio |
| :--- | :--- |
| **DM** (2 pessoas) | E2E forte (chave de época) |
| **Seguidores de X** (perfil privado) | Criptográfico (chave-na-emissão com [[predicado-de-bloqueio]] + TTL) |
| **Feed Público** | **Social** — filtro de leitura sobre arestas `BLOCKS` limitadas; não é garantia criptográfica |

O princípio normativo, conforme `rfc-v4.md §2.8`:

> *privacidade criptográfica exige audiência limitada; conteúdo público recebe apenas bloqueio social.*

Para o feed público, `BLOCKS` é avaliada na **montagem do feed**, não na emissão. Isso garante O(1) na permissão global de leitura (uma única `ASSET:PERMISSION` global, não O(usuários) arestas) e separa acesso (sou membro?) de bloqueio (este autor deve ser filtrado da minha visão?).

## Relação com o predicado de bloqueio e o Key Vault

Para conteúdo com **audiência limitada** (DM, seguidores), a `BLOCKS` alimenta o [[predicado-de-bloqueio]] na liberação de chave pelo Key Vault. Conforme `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2.1`:

> A v4 acrescenta um predicado à decisão de liberação: **"libera a chave de época se o solicitante NÃO está na lista de bloqueio do autor"** (arestas `BLOCKS` do autor). Isso **substitui o mecanismo anterior de rotação-de-época-como-bloqueio** — antes era necessário rotacionar a época para expulsar alguém; agora basta adicionar à lista `BLOCKS`.
>
> * **Custo de revogação:** O(1 pedido negado); a latência efetiva do bloqueio é o **TTL da chave em RAM**, sem rotação de época.

## Limites honestos

Conforme `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2.1`:

> bloqueio é criptográfico apenas contra o bloqueado **agindo sozinho**; sua força é inversamente proporcional ao número de detentores-de-chave dispostos a cooperar — i.e., ao tamanho da audiência.

O [[bloqueio-social]] (feed público) não impede que um insider repasse conteúdo ao bloqueado. Conforme `rfc-v4.md §5.2`:

> Insider que relaya conteúdo a um bloqueado: Bloqueio é criptográfico contra o bloqueado **sozinho**; nunca contra um insider colaborador.

## Posição no trio de arestas de contribuição social (v4)

`BLOCKS` integra o trio introduzido em `caderno-2-protocol/01-graph-ontology.md §2.3`, junto com [[consumes-aresta]] e [[contributes-aresta]]:

| Aresta | Sujeito | Objeto | Semântica |
|:---|:---|:---|:---|
| `CONSUMES` | `PROFILE` | `CONTENT` | Ato do consumidor; histórico próprio |
| `CONTRIBUTES` | `PROFILE:SYSTEM` | prova de contribuição | Banda/storage/compute unificados por `kind` |
| `BLOCKS` | `PROFILE` | `PROFILE` | Bloqueio social (filtro de leitura, limitado) |

Diferença fundamental: `CONTRIBUTES` é exclusiva de [[profile-system]]; `CONSUMES` e `BLOCKS` são abertas a qualquer subtipo de [[profile]].

## Distinção de outros verbos

`BLOCKS` **não é** um verbo raiz canônico (ver [[verbos-raiz-canonicos]]). Os verbos raiz (`RELATES`, `OWNS`, `GOVERNS`, `INTERACTS`, `PARTICIPATES_IN`) expressam relações estruturais ou sociais genéricas. `BLOCKS` expressa um ato de supressão de visibilidade concreto, com semântica de filtro de feed — por isso merece aresta própria e não é modelado como `RELATES:SOCIAL:BLOCKS`.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[aresta]] | 1 | criado |
| [[no]] | 1 | criado |
| [[profile]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| [[consumes-aresta]] | 3 | criado |
| [[contributes-aresta]] | 3 | criado |
| [[predicado-de-bloqueio]] | 3 | placeholder |
| [[bloqueio-social]] | 3 | placeholder |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§2.3` | Substituir definição inline por `[[blocks-aresta]]` |
| `docs/glossary.md` | `§BLOCKS (v4)` | Substituir por link `[[blocks-aresta]]` |
| `rfc-v4.md` | `§3.2` | Substituir menção definitória por `[[blocks-aresta]]` |


