---
title: Sync Worker
slug: sync-worker
aliases:
  - Sync Worker
  - sync-worker
  - worker de sincronização
  - worker principal de transporte
tags:
  - sdk
  - hub
  - onda-7
modo: hub
fonte-canonica: docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1
aparicoes-consolidadas:
  - docs/glossary.md §Sync Worker
  - docs/rfc-transporte-p2p-v3.1.md §3.1
dependencias:
  - [[automerge-repo]]
  - [[rbsr]]
  - [[onda]]
  - [[anti-entropy]]
  - [[tinybase]]
  - [[swarm-registry]]
  - [[graph-based-routing]]
  - [[global-network-throttle]]
  - [[crypto-worker]]
  - [[index-worker]]
  - [[zen-engine]]
  - [[specification]]
  - [[sqlite-wasm]]
  - [[opfs]]
  - [[first-peer-protocol]]
  - [[ucan]]
---

# Sync Worker

## Definição

O **Sync Worker** é o Web Worker central da camada de transporte da plataforma. Opera fora da Main Thread (comunicação via [Comlink](https://github.com/GoogleChromeLabs/comlink)) e concentra todas as responsabilidades de sincronização, persistência durável e orquestração dos demais workers.

Definição normativa completa em: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md).

## Por quê

Manter a Main Thread (React UI) responsiva exige deslocar toda E/S de rede, criptografia e banco de dados para workers secundários. O Sync Worker é o coordenador central: recebe intenções da UI via RPC, decide o roteamento de transporte (SQLite, WebRTC, Private Swarm) e devolve atualizações reativas via [[tinybase]].

## Responsabilidades

As responsabilidades canônicas estão detalhadas em [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md):

- **Orquestrar o [[automerge-repo]]** — carregamento de snapshots, aplicação de [[changes]] e controle de conexões WebRTC entre co-editores.
- **Manter o loop de [[rbsr]]** — sincronização de dados estruturados por Range-Based Set Reconciliation.
- **Gerenciar o [[swarm-registry]]** em memória — peers ativos, latências, capacidades e eleição de líder de sync.
- **Executar transações no SQLite WASM (OPFS)** — escrita durável no banco local.
- **Coordenar os workers secundários** — delega operações criptográficas ao [[crypto-worker]] e reconstrução de índices ao [[index-worker]].
- **Hospedar o [[zen-engine]]** — motor procedural de validação de [[specification]]s (validações locais, migrações e políticas multi-sig).
- **Implementar o sistema de [[onda|ondas]]** — prioriza a transferência de dados em ondas sucessivas (Onda 0 a 3) para abrir a UI em segundos.
- **Executar [[anti-entropy]] em $O(1)$** — troca do root fingerprint ao retornar do modo suspenso; reconciliação recursiva restrita ao contexto visível.
- **Governar o [[global-network-throttle]]** — distribui banda e sockets entre múltiplos swarms simultâneos.
- **Orquestrar o [[first-peer-protocol]]** — máquina de estados de gênese de rede (JOINING → WAITING_FOR_SWARM → CONNECTED / GENESIS / OFFLINE_RETRY).

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

## Roteamento de Transporte

Quando uma ação ocorre na UI, o Sync Worker recebe a intenção via [[tinybase]] Persister, extrai os `transport_hints` da [[specification]] associada ao nó e despacha os bytes para a fila de SQLite ou WebRTC correspondente. Ver [[matriz-de-classificacao-transporte]] para o contrato de tipos (`TransportBehavior`) que governa esse roteamento. Especificação do fluxo em [rfc-transporte-p2p-v3.1.md §2.11 e §3.1](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md).

## Invariante de Validação de Saldos (T1)

O [[zen-engine]] embutido no Sync Worker impõe que toda mutação de saldo carregue, em seu payload criptografado: (a) o delta de alteração e (b) a referência causal à transação ou aresta correspondente. Em contextos de fintech regulada, a validação aritmética `saldo_anterior + delta == saldo_novo` é executada obrigatoriamente no momento do commit. Definição normativa em [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md).

## Aparições a consolidar

As seguintes definições duplicadas foram consolidadas neste verbete:

- `docs/glossary.md §Sync Worker`
- `docs/rfc-transporte-p2p-v3.1.md §3.1`

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[automerge-repo]] | 6 | criado |
| [[rbsr]] | 4 | criado |
| [[onda]] | 4 | criado |
| [[anti-entropy]] | 4 | criado |
| [[swarm-registry]] | 5 | criado |
| [[graph-based-routing]] | 5 | criado |
| [[global-network-throttle]] | 5 | criado |
| [[first-peer-protocol]] | 5 | criado |
| [[ucan]] | 2 | criado |
| [[specification]] | 1 | criado |
| [[tinybase]] | 7 | placeholder |
| [[crypto-worker]] | 7 | placeholder |
| [[index-worker]] | 7 | placeholder |
| [[zen-engine]] | 7 | placeholder |
| [[sqlite-wasm]] | — | sem verbete (fase 3) |
| [[opfs]] | — | sem verbete (fase 3) |


