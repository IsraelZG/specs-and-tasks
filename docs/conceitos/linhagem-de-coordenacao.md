---
title: "Linhagem de Coordenação"
slug: linhagem-de-coordenacao
aliases: ["linhagem de coordenação", "coordination lineage", "estado da saga", "coordenador da saga"]
tags: [protocol, transações, multidomínio, saga, 2pc, coordenador, efêmero, v4]
modo: canonical
fonte-canonica: docs/rfc-transacoes-multidominio.md §8
aparicoes-consolidadas:
  - glossary.md §Linhagem de Coordenação
dependencias:
  - [[asset-lock]]
  - [[linhagem-de-versoes]]
  - [[hlc]]
  - [[saga]]
  - [[2pc-com-lock-ttl]]
  - [[serialization-por-linhagem]]
  - [[validador-declarado]]
---

# Linhagem de Coordenação

## Definição

**Linhagem de coordenação** é o contexto de autoridade dentro do qual o **coordenador legítimo** de uma transação multidomínio opera — e, por extensão, o estado efêmero que esse coordenador mantém (quais pernas reservadas, confirmadas ou abortadas). É **local e não-replicado**: vive somente na projeção do agente orquestrador; nunca circula como aresta mutável no grafo.

O coordenador não é um super peer contrabandeado: sua responsabilidade é apenas de **liveness** (decidir commit/abort). A **safety** permanece nos locks de cada domínio — cada perna valida sua [[serialization-por-linhagem]] independentemente.

## Conteúdo normativo

O texto normativo completo — regra inviolável de estado de saga, proibição de estado mutável replicado e ponto de auditoria opcional — está definido canonicamente em:

> `rfc-transacoes-multidominio.md §8` — Estado da Saga (Regra Inviolável)

A definição do coordenador legítimo da linhagem de coordenação e sua função no 2PC está em:

> `rfc-transacoes-multidominio.md §3.1` — Resolução do Bloqueio Clássico do 2PC

## Resumo estrutural

### Estado efêmero e local

O estado de coordenação segue três princípios extraídos de `rfc-transacoes-multidominio.md §8`:

| princípio | detalhe |
|:---|:---|
| **`pending` em projeção local** | Não replicado entre peers; mantido somente no agente orquestrador. |
| **Cada leg durável normal** | Um `[[asset-lock]]` consumido = estado replicado via protocolo v4 (durável, não efêmero). |
| **Consolidação opcional** | Após liquidação final, um `CONTENT:INTENT` "saga liquidada" pode ir ao grafo para auditoria — ponto de referência, não estado de controle. |

**Regra inviolável:** Estado mutável replicado da saga é **proibido**. Criar aresta com `state` mutável que circule entre peers reabriria o buraco do append-only que a v4 fechou (RFC v4 §0.2 / §2.6).

### Coordenador legítimo

Conforme `rfc-transacoes-multidominio.md §3.1`, o coordenador legítimo da linhagem de coordenação é o **[[validador-declarado]] da linhagem de coordenação** — a autoridade dona do contexto:

- **Corporativo:** back-office (servidor sempre vivo, relógio sincronizado com [[hlc]]).
- **P2P:** agente eleito temporariamente.

O coordenador só decide liveness (commit/abort). Safety = invariantes de [[serialization-por-linhagem]] em cada perna, adjudicadas pelo validador-dono de cada linhagem de recurso.

### Relação com Tier 1 (Saga) e Tier 2 (2PC)

| tier | papel da linhagem de coordenação |
|:---|:---|
| [[saga]] (Tier 1) | Estado efêmero local sem coordenador explícito; cada perna expira via TTL independentemente. |
| [[2pc-com-lock-ttl]] (Tier 2) | Coordenador declarado da linhagem de coordenação decide commit/abort; TTL delimita a janela em-dúvida. |

### Invariante de segurança

Enquanto o estado durável de cada perna é replicado normalmente (lock consumido, lançamento compensatório), o estado de orquestração **nunca** sai da projeção local. Se o agente orquestrador cai, o TTL dos locks resolve o destino de cada perna sem coordenação — ver [[2pc-com-lock-ttl]] e [[politica-de-ttl]].

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Linhagem de Coordenação` | Substituir por wikilink `[[linhagem-de-coordenacao]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[hlc]] | 1 | criado |
| [[asset-lock]] | 3 | criado |
| [[serialization-por-linhagem]] | 9 | criado |
| [[saga]] | 9 | criado |
| [[2pc-com-lock-ttl]] | 9 | criado |
| [[validador-declarado]] | 9 | placeholder (mesma onda, não criado) |
| [[politica-de-ttl]] | 9 | criado |


