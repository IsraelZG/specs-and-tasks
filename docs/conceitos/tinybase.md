---
title: TinyBase
slug: tinybase
aliases:
  - TinyBase
  - tinybase
  - TinyBase Store
  - store reativa
tags:
  - sdk
  - canonical
  - onda-7
modo: canonical
fonte-canonica: docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §2
aparicoes-consolidadas:
  - docs/glossary.md §TinyBase
dependencias:
  - [[sync-worker]]
  - [[sqlite-wasm]]
  - [[automerge-repo]]
---

# TinyBase

## Definição

**TinyBase** é a biblioteca que atua como camada reativa entre o sistema de dados local e a Main Thread da UI. Ela fornece uma **Store em memória** que a interface de usuário lê e escreve exclusivamente — nunca realizando conexões diretas ao SQLite local.

TinyBase **nunca é a fonte de verdade**; essa função pertence ao SQLite (via [[sync-worker]]). Ela opera como espelho parcial e reativo das projeções do banco, observando escritas e propagando atualizações para os componentes React subscritos.

## Como funciona

Definição normativa completa em: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §2](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md).

### Cache em Memória (Espelhamento Parcial)

A Store do TinyBase retém em cache (`nodes_cache` e `edges_cache`) **apenas o conjunto de dados ativamente assinados pela janela visível da UI atual**, mais um buffer de virtualização. Quando componentes se desinscrevem, a RAM correspondente é limpa.

### Persistência Assíncrona (Persister)

Um persister customizado do TinyBase intercepta escritas na Store e envia os deltas de forma **assíncrona** ao [[sync-worker]] para gravação durável no SQLite. Triggers SQLite atualizam `entity_heads` no banco, e o persister lê a alteração, atualizando reativamente a Store.

### Ponte Reativa com o Sync Worker

```
┌─────────────────────────────────┐
│      Main Thread (React UI)     │
└────────────────┬───▲────────────┘
      postMessage│   │Reactive updates
    (via Comlink)│   │(TinyBase Store)
┌────────────────▼───┴────────────────┐
│             Sync Worker             │
└─────────────────────────────────────┘
```

Fonte: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1 e §2](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md).

A UI escreve na Store do TinyBase; o Persister propaga para o [[sync-worker]] via `postMessage` (Comlink). O Sync Worker grava no SQLite e, mediante triggers em `entity_heads`, devolve atualizações que o Persister injeta de volta na Store, disparando renders reativos na UI.

## Invariante principal

> A UI **nunca** acessa o SQLite diretamente. TinyBase é o único ponto de contato da Main Thread com o estado da aplicação.

## Aparições a consolidar

As seguintes definições duplicadas foram consolidadas neste verbete:

- `docs/glossary.md §TinyBase`

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[sync-worker]] | 7 | criado |
| [[automerge-repo]] | 6 | criado |
| [[sqlite-wasm]] | — | sem verbete (fase 3) |


