---
title: Consistent Hashing
slug: consistent-hashing
aliases: ["consistent hashing", "hashing consistente", "sharding determinístico", "anel de hash"]
tags: [protocol, sincronizacao, replicacao, disponibilidade, p2p, sharding]
modo: hub
fonte-canonica: docs/caderno-2-protocol/03-set-reconciliation-protocol.md §3.3
aparicoes-consolidadas:
  - glossary.md §Consistent Hashing
  - rfc-transporte-p2p-v3.1.md §4.2.1
dependencias:
  - [[replication-factor]]
  - [[onda]]
  - [[rbsr]]
  - [[anti-entropy]]
  - [[poda-segura]]
---

# Consistent Hashing

Algoritmo de mapeamento determinístico de `chunkId` (ou `id` de nó/aresta) em um **anel de peers**, usado para eleger os custodiantes responsáveis por cada fragmento de dado sem coordenação centralizada.

A definição normativa completa está em **`caderno-2-protocol/03-set-reconciliation-protocol.md §3.3`**.

## Papel por modalidade de rede

| Modalidade | Uso |
|:-----------|:----|
| **P2P Puro** | A custódia primária de cada chunk é eleita por consistent hashing: `custodians(chunkId) = top-K peers no anel de hash(chunkId)`, com fator [[replication-factor]] $N$ (default 3). Ver `rfc-transporte-p2p-v3.1.md §4.2.1`. |
| **Corporativa** | Não aplicável — o Super Peer garante 100 % do grafo; não há sharding. |
| **Pública** | Sharding determinístico por consistent hashing entre peers ativos; o peer de sistema mantém o grafo íntegro como fallback definitivo de bootstrap. |

## Relação com poda segura

O anel de consistent hashing é a base do protocolo `RELEASE/ACK` descrito em [[poda-segura]]: o peer que deseja podar envia `RELEASE(chunkId)` ao **próximo peer no anel**, que assume custódia primária antes de responder `ACK`. Isso garante que a invariante [[replication-factor]] $\ge N$ seja preservada durante transições Integral → Podado.

## Ver também

- [[replication-factor]] — parâmetro $N$ que o anel de custódia aplica
- [[poda-segura]] — protocolo de três camadas que usa o anel de consistent hashing
- [[anti-entropy]] — Onda 0; detecta divergências antes de redistribuir custódia
- [[rbsr]] — reconcilia dados entre peers após mudanças de custódia

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[replication-factor]] | 4 | criado |
| [[onda]] | 4 | criado |
| [[rbsr]] | 4 | criado |
| [[anti-entropy]] | 4 | criado |
| [[poda-segura]] | 4 | placeholder |
