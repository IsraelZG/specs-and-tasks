---
title: Documento Casca
slug: documento-casca
aliases:
  - Documentos Casca
  - Shell Document
  - Shell Documents
  - Rendezvous
  - RendezvousId
  - RendezvousId / Documento Casca
tags:
  - protocol
  - automerge
  - transporte
  - rfc-transporte
  - sync-worker
  - onda-6
modo: hub
fonte-canonica: docs/caderno-2-protocol/04-automerge-integration-spec.md §2
aparicoes-consolidadas:
  - docs/glossary.md §Documento Casca
  - docs/rfc-transporte-p2p-v3.1.md §2.3
  - docs/rfc-transporte-p2p-v3.1.md Apêndice B
dependencias:
  - [[automerge-repo]]
  - [[changes]]
  - [[ephemeral-messages]]
  - [[asset-permission]]
  - [[ucan]]
  - [[sync-worker]]
  - [[private-swarm]]
---

# Documento Casca

## Definição
O **Documento Casca** (também referido como *Shell Document* ou *Rendezvous*) é uma sala de encontro efêmera em RAM, sem histórico de CRDT, usada pela camada de orquestração do [[automerge-repo]] para formar swarms WebRTC/WebSocket multiplexados entre co-editores de um documento. O identificador da sala (`RendezvousId`) é derivado de forma criptográfica não-enumerável a partir de um segredo de capabilidade (`rendezvous_secret` concatenado com o identificador de permissão do ativo), impedindo a adivinhação da sala e o consequente vazamento de metadados.

## Por quê
O mecanismo de Documentos Casca resolve a necessidade de coordenação de baixo nível e feedback em tempo real para edição colaborativa Local-First sem inflar o grafo central do banco de dados relacional com micro-versões ou rascunhos inacabados. Ao isolar as interações em tempo real (como micro-alterações de digitação e posições de cursor) em canais em RAM e em tabelas temporárias locais (`pending_changes`), o sistema atinge baixa latência de colaboração instantânea. Além disso, a derivação criptográfica do identificador de sala a partir de um segredo de capabilidade garante privacidade forte, impedindo que observadores externos ou mal-intencionados enumerem salas ou deduzam quais documentos estão sendo ativamente editados.

## Contrato
As especificações formais de protocolo e o comportamento matemático dos Documentos Casca estão definidos em:
* [caderno-2-protocol/04-automerge-integration-spec.md §2](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/04-automerge-integration-spec.md#L20-L32)
* [rfc-transporte-p2p-v3.1.md §2.3](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L81-L88)

**Derivação de Identificador da Sala (`RendezvousId`)**:
Para evitar ataques de enumeração e proteger metadados, o identificador da sala no swarm não corresponde ao ID do documento ou do ativo. Ele é derivado aplicando a função de hash SHA-256 à concatenação do segredo do rendezvous com o ID de permissão do ativo:

$$\text{RendezvousId} = \text{SHA-256}(\texttt{rendezvous\_secret} \mathbin{\Vert} \texttt{ASSET:PERMISSION\_ID})$$

* O `rendezvous_secret` é distribuído exclusivamente a peers detentores do [[ucan]] correspondente que concede autorização de escrita ou leitura no documento.
* O `ASSET:PERMISSION_ID` é o ID de permissão ([[asset-permission]]) do ativo. Conhecer apenas este identificador não permite inferir o `RendezvousId` sem possuir o segredo correspondente.

**Casos de Uso**:
Os canais de comunicação estabelecidos por meio do Documento Casca são estritamente em RAM e voláteis, sendo empregados para:
* Propagação em tempo real de [[changes]] (micro-edições) de digitação entre co-editores antes de um commit formal.
* Coordenação de eleição de committer de novo nó-versão.
* Troca e validação de assinaturas criptográficas Ed25519 em tempo real usando [[ephemeral-messages]] (ex: co-assinatura/multisig exigida em especificações de governança).
* **Restrição**: Os Documentos Casca não realizam persistência no grafo de dados de linhagem. A gravação final e persistente de commits ocorre nas tabelas físicas `nodes` e `edges`.

## Implementação
As diretrizes de orquestração do runtime e ciclo de vida do Documento Casca estão detalhadas em:
* [rfc-transporte-p2p-v3.1.md §2.1 e §2.8](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L46-L55)
* [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L196-L200)

* **Workers e Runtime**: O [[sync-worker]] gerencia o [[automerge-repo]] e monitora as conexões ativas no `SwarmRegistry`. Ele manipula as mensagens trocadas na sala efêmera em RAM e coordena o despejo das Changes de digitação salvando-as temporariamente na tabela local `pending_changes` do SQLite.
* **Private Swarm**: O mesmo mecanismo de Documento Casca é reaproveitado no [[private-swarm]] para sincronizar preferências e rascunhos entre os múltiplos dispositivos de um mesmo usuário utilizando uma derivação protegida (`RendezvousId = blake2s256(Device_Sync_Key)`).
* **Network Throttle**: A alocação de banda de rede para a sincronização dos swarms WebRTC associados aos Documentos Casca é gerida globalmente. Conexões de abas em segundo plano migram de conexões WebRTC diretas para relays de circuito a fim de economizar soquetes no sistema operacional e poupar bateria.

## Evolução
As diretrizes de governança e a especificação do ciclo de vida das transações colaborativas estão descritas em:
* [caderno-2-protocol/04-automerge-integration-spec.md §3 e §4](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/04-automerge-integration-spec.md#L35-L90)

Com a evolução para a versão V4, a eleição e o papel dos committers na coordenação das salas efêmeras simplificam-se com a introdução do agente de sistema (`PROFILE:SYSTEM`). A eleição de committer nas salas de encontro efêmeras deixa de ser negociada via mensagens políticas e passa a ser decidida de maneira estritamente determinística entre os agentes (ex: menor `entity_id` lexicográfico ativo no ciclo corrente), reduzindo o tráfego de coordenação necessário dentro da sala efêmera em RAM.

## Aparições a consolidar
As definições e referências duplicadas do termo foram unificadas sob este verbete:
1. **`docs/glossary.md §Documento Casca (Shell Document / Rendezvous)`**: define o conceito de sala efêmera sem histórico CRDT e a derivação criptográfica do identificador.
2. **`docs/rfc-transporte-p2p-v3.1.md §2.3`**: descreve detalhadamente o fluxo da camada de transporte e a fórmula de derivação do RendezvousId.
3. **`docs/rfc-transporte-p2p-v3.1.md Apêndice B`**: define no glossário do transporte a sala de encontro WebRTC na RAM sem persistência.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[automerge-repo]] | 6 | criado |
| [[changes]] | 6 | criado |
| [[ephemeral-messages]] | 6 | criado |
| [[asset-permission]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[private-swarm]] | 5 | criado |
| [[sync-worker]] | 7 | placeholder |


