---
title: Index Worker
slug: index-worker
aliases:
  - Index Worker
  - index-worker
tags:
  - sdk
  - canonical
  - onda-7
modo: canonical
fonte-canonica: docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.3
aparicoes-consolidadas:
  - docs/glossary.md §Index Worker
  - docs/rfc-transporte-p2p-v3.1.md §3.1
dependencias:
  - [[sync-worker]]
  - [[crypto-worker]]
  - [[fts5]]
---

# Index Worker

## Definição

O **Index Worker** é o Web Worker dedicado a reconstruir e manter as projeções locais de busca a partir dos payloads já decifrados pelo [[crypto-worker]]. Opera fora da Main Thread para não bloquear a UI.

Fonte canônica: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.3](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md).

## Por quê

A reconstrução de índices de busca sobre payloads decifrados pode envolver varreduras de texto completo e re-indexação geográfica. Executar essas operações de forma assíncrona em um worker dedicado evita jank na interface e mantém o isolamento de responsabilidades: o [[crypto-worker]] cifra/decifra; o Index Worker projeta.

## Responsabilidades

Conforme [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.3](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md):

- **Reconstrução da tabela FTS5** (`search_index_fts`) — indexação de texto completo sobre payloads decifrados recebidos do [[crypto-worker]].
- **Atualização do índice geográfico** (`geo_index`, R*Tree) — mantém dados geoespaciais indexados para consultas de proximidade.

## Arquitetura de Workers

```
              ┌─────────────────────────────────┐
              │      Main Thread (React UI)     │
              └────────────────┬───▲────────────┘
                    postMessage│   │Reactive updates
                  (via Comlink)│   │(TinyBase Store)
              ┌────────────────▼───┴────────────────┐
              │             Sync Worker             │
              └──────────────┬──────────┬───────────┘
                             │          │
                 postMessage │          │ postMessage
                             ▼          ▼
                   ┌───────────┐      ┌───────────┐
                   │Crypto Wkr │      │ Index Wkr │
                   └───────────┘      └───────────┘
```

Fonte: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md).

## Aparições a consolidar

As seguintes definições duplicadas foram consolidadas neste verbete:

- `docs/glossary.md §Index Worker`
- `docs/rfc-transporte-p2p-v3.1.md §3.1`

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[sync-worker]] | 7 | criado |
| [[crypto-worker]] | 7 | criado |
| [[fts5]] | fase-3 | placeholder |
