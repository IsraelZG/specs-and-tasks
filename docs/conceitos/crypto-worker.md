---
title: Crypto Worker
slug: crypto-worker
aliases:
  - Crypto Worker
  - crypto-worker
  - worker criptográfico
tags:
  - sdk
  - hub
  - onda-7
modo: hub
fonte-canonica: docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.2
aparicoes-consolidadas:
  - docs/glossary.md §Crypto Worker
  - docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.1
dependencias:
  - [[sync-worker]]
  - [[key-vault]]
  - [[chave-de-epoca]]
  - [[ucan]]
  - [[asset-permission]]
  - [[asset-role]]
  - [[onda]]
---

# Crypto Worker

## Definição

O **Crypto Worker** é o Web Worker isolado da plataforma dedicado ao processamento criptográfico pesado. Opera fora da Main Thread e é coordenado pelo [[sync-worker]] via `postMessage`.

Definição normativa completa em: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.2](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md).

## Por quê

Operações de cifragem em batch e validação de assinaturas são computacionalmente custosas e bloqueariam a Main Thread (React UI) se executadas inline. Isolá-las em um worker dedicado garante responsividade da interface e confina o material de chaves a um contexto de memória controlado.

## Responsabilidades

As responsabilidades canônicas estão detalhadas em [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.2](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md):

- **Encriptação e decifração em batch** — processa payloads AES-256-GCM de forma assíncrona.
- **Validação de assinaturas Ed25519 em blocos** — executada em massa durante as [[onda|Ondas 1 e 2]] de sincronização.
- **Hospedar o [[key-vault]]** — subsistema interno para custódia segura de chaves; intercepta tokens [[ucan]] para validar direitos (`ASSET:PERMISSION` ou `ASSET:ROLE`) e entrega a chave de conteúdo baseada no TTL do papel ativo.
- **TTL rígido de 4 horas em RAM** — chaves de época decifradas são mantidas em memória física do worker e limpas após expiração.

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

Fonte: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md).

## Reidratação de BLOBs (zero-copy)

No fluxo de reidratação de arquivos pesados na UI (descrito em [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §7](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md)), o Crypto Worker recebe chunks vindos do [[sync-worker]] (após busca P2P via WebTorrent) e os decifra com AES-256-GCM usando a chave do nó `ASSET:FILE`. Os bytes são devolvidos ao Service Worker via `postMessage(buffer, [buffer])` — **Transferable Objects (zero-copy)** — transferindo a propriedade da memória sem cópia para evitar pausas do GC. Chunks decifrados residem apenas no `ReadableStream`/`SourceBuffer` e nunca são expostos ao JavaScript da página.

## Aparições a consolidar

As seguintes definições duplicadas foram consolidadas neste verbete:

- `docs/glossary.md §Crypto Worker`
- `docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.1`

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[sync-worker]] | 7 | criado |
| [[key-vault]] | 2 | criado |
| [[chave-de-epoca]] | 1 | criado |
| [[ucan]] | 2 | criado |
| [[asset-permission]] | 2 | criado |
| [[asset-role]] | 2 | criado |
| [[onda]] | 4 | criado |


