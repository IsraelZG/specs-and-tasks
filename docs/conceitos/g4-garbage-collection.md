---
title: G4 — Garbage Collection Híbrido
slug: g4-garbage-collection
aliases:
  - G4
  - Garbage Collection Híbrido
  - G4 GC
  - Coleta de Lixo G4
tags:
  - sdk
  - hub
  - onda-7
modo: hub
fonte-canonica: docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §4
aparicoes-consolidadas:
  - docs/rfc-transporte-p2p-v3.1.md §4.5
dependencias:
  - [[sync-worker]]
  - [[tinybase]]
  - [[retention-state]]
  - [[replication-factor]]
  - [[poda-segura]]
  - [[tier-aware-degradation]]
  - [[tombstone-lapide]]
---

# G4 — Garbage Collection Híbrido

## Definição

O **G4** é o Garbage Collector híbrido da plataforma, responsável por compactar o armazenamento local (OPFS/disco) quando o dispositivo atinge limiares de quota, sem comprometer a integridade auditável do grafo nem a disponibilidade da rede. Opera em dois planos complementares: o **plano local** (compactação de payloads e do log Automerge) e o **plano de custódia altruísta** (expulsão de cache de dados de outros peers via pools segmentados).

## Por quê

Dispositivos móveis e navegadores têm quotas de armazenamento finitas. O G4 garante que a plataforma permaneça operável mesmo em dispositivos com pouco espaço, preservando as propriedades de auditoria criptográfica (assinaturas e arestas do grafo nunca são removidas) e a promessa de retenção mínima de dados na rede (não poda antes de confirmar o Replication Factor).

## Contrato

A especificação normativa completa está em dois locais canônicos:

- **Plano local — compactação e proteções**: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §4](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md)
- **Plano de custódia — pools segmentados LRU/Rarest-First**: [rfc-transporte-p2p-v3.1.md §4.5](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md)

### Gatilho de execução

O G4 é acionado quando o armazenamento OPFS atinge **90% da quota** disponível ou o limite fixado pelo usuário.

### Plano local (caderno-3/02 §4)

1. **Notificação Proativa**: o sistema sugere liberação de espaço de forma transparente antes de agir automaticamente.
2. **Poda do SQLite**: converte registros do estado Integral para Podado (`retention_state = 'pruned'`), removendo fisicamente as colunas `payload` e `payload_iv`. Assinaturas e arestas de relacionamento são mantidas intactas para auditoria. Ver [[retention-state]] e [[poda-segura]].
3. **Compactação do CRDT (Automerge)**: limpa micro-updates históricos e Changes brutas da tabela `pending_changes`, consolidando o log do Automerge Repo correspondente aos blocos podados.
4. **Pins e Proteções**: o G4 **nunca** poda registros protegidos por nós de prioridade (`ASSET:PIN` do usuário) ou sob conformidade de retenção regulatória obrigatória (dados fiscais/financeiros).
5. **Restrição de Bateria (Tier-aware Pause)**: a execução do G4 e a poda de payloads são **pausadas automaticamente** se [[tier-aware-degradation]] estiver ativa (bateria baixa). Em economia de energia, o mobile limita conexões a no máximo 2 peers WebRTC — quórum insuficiente para garantir o [[replication-factor]] ($N=3$) antes de podar, evitando perda permanente de dados na rede.

### Plano de custódia — pools segmentados (rfc §4.5)

O cache altruísta (dados de outros peers custodiados localmente) usa **pools de expulsão distintos** por tipo de dado:

- **Grafo**: algoritmo **LRU** (*Least Recently Used*).
- **BLOBs de vídeo/mídia**: **Rarest-First** — protege sementes raras na malha antes de excluí-las (inversão do rarest-first de download do BitTorrent). A raridade é estimada via contagem de peers no tracker; por ser estimável e potencialmente manipulável, a decisão final de expulsão de um BLOB raro é cruzada com o ranking de custódia (rfc §4.1) antes de ser efetivada.

### Coleta de tombstones (rfc §2.10.3)

O G4 também é responsável pela coleta de [[tombstone-lapide|tombstones]] expirados: registros marcados como inativos (`active = 0`) há mais de N ciclos de auditoria podem ser podados, desde que respeitados os requisitos de retenção legal de cada modalidade de rede.

## Aparições a consolidar

- `docs/rfc-transporte-p2p-v3.1.md §4.5` — define os pools segmentados LRU/Rarest-First para cache altruísta; consolidado acima.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[sync-worker]] | 7 | criado |
| [[tinybase]] | 7 | criado |
| [[retention-state]] | — | sem verbete (Fase 3) |
| [[replication-factor]] | 4 | criado |
| [[poda-segura]] | 4 | criado |
| [[tier-aware-degradation]] | 12 | placeholder |
| [[tombstone-lapide]] | 7 | placeholder |
