---
title: Changes
slug: changes
aliases: ["Changes", "micro-changes", "micro-edições", "micro-alterações"]
tags: [protocol, automerge, sync-worker, pending-changes]
modo: canonical
fonte-canonica: docs/caderno-2-protocol/04-automerge-integration-spec.md §3.1
aparicoes-consolidadas:
  - glossary.md §Changes
dependencias:
  - [[automerge]]
  - [[automerge-repo]]
  - [[sync-worker]]
  - [[pending-changes]]
  - [[ephemeral-messages]]
---

# Changes

## Definição

`Changes` são as operações elementares e granulares de edição (como micro-updates de digitação, cliques ou modificações na UI) registradas em tempo real pelo motor de CRDT do [[automerge]]. Capturadas localmente pelo [[sync-worker]] pré-commit, elas são armazenadas na tabela local não-replicada [[pending-changes]] no SQLite e propagadas em RAM para co-editores conectados como [[ephemeral-messages]] via WebRTC/WebSocket, sendo posteriormente unificadas e consolidadas no snapshot binário de um nó-versão físico (`nodes`) sob commits discretos.

## Por quê

As `changes` viabilizam a colaboração em tempo real (digitação simultânea) com reatividade instantânea na interface do usuário sem causar inchaço no grafo distribuído persistente do sistema. Ao invés de criar e trafegar um nó-versão assinado no grafo para cada caractere digitado, o sistema usa as `changes` como um estágio transitório de dados (staging) na RAM e no SQLite local. A justificativa conceitual e a integração do Automerge ao Grafo de Versões estão descritas em [[caderno-2-protocol/04-automerge-integration-spec#1-o-acoplamento-automerge-e-grafo-de-versoes]] e as heurísticas que acionam a consolidação em [[caderno-2-protocol/04-automerge-integration-spec#3-2-gatilho-de-commit]].

## Contrato

As regras de contrato do ciclo de vida das `changes` estão normatizadas na especificação em [[caderno-2-protocol/04-automerge-integration-spec#3-o-ciclo-de-commit-colaborativo]].

Os principais requisitos de contrato consistem em:
- **Captura em Staging**: As alterações geradas na UI local em tempo real são salvas na tabela local não-replicada [[pending-changes]] (ver [[caderno-2-protocol/04-automerge-integration-spec#3-1-captura-de-changes-escrita-em-staging]]).
- **Propagação Efêmera**: As `changes` são distribuídas imediatamente em RAM para outros peers co-editores como [[ephemeral-messages]] via canais WebRTC na RAM.
- **Gatilho de Consolidação (Commit)**: O Sync Worker monitora as `changes` em [[pending-changes]]. O gatilho de commit é disparado sob duas heurísticas configuráveis na `SPECIFICATION` do documento:
  - *Inatividade*: Por exemplo, 3 segundos consecutivos sem novas alterações locais ou de peers co-editores.
  - *Limiar de Operações*: Por exemplo, acúmulo de 100 micro-changes pendentes.
- **Emissão e Limpeza**: Ao disparar o gatilho, o committer gera o snapshot binário consolidado (`Automerge.save(doc)`), persiste o nó-versão no grafo (`nodes`) com as arestas `MUTATES` e `AUTHORED` correspondentes, e limpa as `changes` consolidadas da tabela local [[pending-changes]].

## Implementação

No SDK da plataforma, o controle do ciclo de vida e a persistência em memória/SQLite das `changes` são descritos em:
- **[[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#4-garbage-collection-hibrido-g4-e-quotas]]**: Onde é detalhado como o Garbage Collector (G4) compacta as `changes` brutas da tabela local e consolida o log do [[automerge-repo]].
- **[[caderno-3-sdk/01-sqlite-and-projections-schema#4-matriz-de-classificação-de-transporte]]**: Mapeamento de `pending_changes` na categoria `REPLICABLE_VOLATILE` do banco SQLite local (`sqlite_pending_changes`) com protocolo `EPHEMERAL_WEBRTC`.

## Evolução

A estrutura das `changes` é ditada pelo motor [[automerge]] e empacotada por seu respectivo [[automerge-repo]]. Modificações na serialização de commits ou na forma de propagação de micro-edições exigem alterações nas heurísticas de commit descritas em [[caderno-2-protocol/04-automerge-integration-spec]] e no gerenciamento do buffer do [[sync-worker]].

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Changes` | Remover a definição conceitual duplicada e direcionar para este verbete |
| `caderno-2-protocol/04-automerge-integration-spec.md` | `§3.1` | Manter a especificação técnica e linkar a este verbete |
