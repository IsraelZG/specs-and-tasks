---
title: Automerge Repo
slug: automerge-repo
aliases:
  - "Automerge Repo"
  - "automerge-repo"
  - "automerge repo"
  - "camada de orquestração do Automerge"
  - "automerge"
  - "crdt"
tags:
  - protocol
  - automerge
  - hub
  - sdk
  - onda-6
modo: hub
fonte-canonica: docs/caderno-2-protocol/04-automerge-integration-spec.md §2
aparicoes-consolidadas:
  - docs/glossary.md §Automerge Repo
  - docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1
  - docs/rfc-transporte-p2p-v3.1.md §2.1
dependencias:
  - [[no]]
  - [[aresta]]
  - [[mutates]]
  - [[linhagem-de-versoes]]
  - [[profile]]
  - [[asset-permission]]
  - [[ucan]]
  - [[profile-system]]
  - [[documento-casca]]
  - [[changes]]
  - [[ephemeral-messages]]
  - [[sync-worker]]
  - [[tinybase]]
  - [[agente-de-sistema]]
---

# Automerge Repo

## Definição
O **Automerge Repo** é a camada de orquestração sobre o Automerge encarregada de gerenciar o ciclo de vida dos documentos colaborativos (como documentos de texto, planilhas e quadros de tarefas). Ele fornece suporte para a persistência física local em OPFS ou tabelas locais, sincronização incremental de mudanças granulares (Changes) em tempo real entre peers, e o fluxo de mensagens de baixa latência (Ephemeral Messages) via WebRTC ou WebSockets.

## Por quê
O Automerge Repo viabiliza a edição colaborativa em tempo real com feedback instantâneo na interface do usuário (UI) sem degradar o desempenho ou a integridade estrutural do banco de dados relacional. Ao capturar as micro-alterações de digitação (Changes) em canais voláteis em RAM, o sistema evita inflar a tabela física central do grafo (`nodes`) com micro-versões irrelevantes de digitação. Apenas quando uma heurística de consolidação (inatividade ou limite de operações) é atingida, um snapshot binário completo e imutável é gravado como um nó-versão oficial, conciliando a colaboração efêmera e rápida com um histórico de auditoria relacional robusto.

## Contrato
A especificação de protocolo do Automerge Repo é definida em:
* [caderno-2-protocol/04-automerge-integration-spec.md §2 e §3](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/04-automerge-integration-spec.md#L20-L57)
* [rfc-transporte-p2p-v3.1.md §2.1 e §2.3](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L46-L55)

**Regras de Swarm e Capabilidade**:
A formação de swarms WebRTC entre co-editores é orquestrada por meio de [[documento-casca]] (salas de encontro efêmeras em RAM, sem histórico de CRDT). O identificador da sala (`RendezvousId`) é derivado de forma não-enumerável a partir de um segredo de capabilidade:

$$\text{RendezvousId} = \text{SHA-256}(\texttt{rendezvous\_secret} \mathbin{\Vert} \texttt{ASSET:PERMISSION\_ID})$$

Onde o `rendezvous_secret` é compartilhado exclusivamente a quem possui o [[ucan]] correspondente, impedindo a enumeração e vazamento de metadados.

**Mensagens Efêmeras**:
O canal de [[ephemeral-messages]] provido pelo Automerge Repo via WebRTC é transiente e não é gravado permanentemente no grafo, sendo usado para:
* Propagação em tempo real de [[changes]] (micro-edições) de digitação entre peers co-editores conectados ao documento.
* Coordenação de committer e co-assinatura digital (multi-sig) de commits colaborativos antes da sua persistência física.

## Implementação
As diretrizes de implementação do Automerge Repo na arquitetura cliente estão descritas em:
* [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L28-L36)
* [rfc-transporte-p2p-v3.1.md §3.1 e §3.2](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L341-L370)

**Acoplamento com Workers e SQLite**:
* **Runtime**: O Automerge Repo roda dentro do [[sync-worker]] (Web Worker secundário), isolando o processamento em segundo plano para manter a Main Thread responsiva. Ele interage reativamente com o [[tinybase]] em memória na Main Thread.
* **Escrita em Staging**: Mudanças em tempo real alimentam o Automerge Repo e são salvas localmente na tabela local não-replicada `pending_changes` no SQLite.
* **Gatilho de Commit**: Monitorado pelo Sync Worker, o commit consolida as changes acumuladas usando `Automerge.save(doc)` quando acionado por inatividade (ex.: 3s sem alterações) ou limiar de operações (ex.: 100 changes pendentes).
* **Emissão de Nó-Versão**: O Sync Worker eleito insere um [[no]]-versão físico de tipo `CONTENT:DOCUMENT` na tabela física replicada `nodes`, assinado via Ed25519 (Layer 1 - Imutabilidade do Registro). Uma [[aresta]] `MUTATES` conecta a versão anterior à nova, registrando no campo indexado `previous_hash` a assinatura Ed25519 da aresta anterior, estabelecendo a Layer 2 (Imutabilidade da Ordem). A aresta `AUTHORED` liga o autor (`PROFILE`) ao nó final e inclui em seu payload os hashes das changes consolidadas. A tabela `pending_changes` é então limpa.
* **Private Swarm**: O Automerge Repo é reutilizado para sincronizar de forma cross-device os rascunhos e preferências de UI do usuário contidos no banco secundário (`device_state.db`), com criptografia E2E a partir da chave do dispositivo.

## Evolução
As diretrizes de governança e evolução de sincronia e committer são descritas em:
* [caderno-2-protocol/04-automerge-integration-spec.md §4](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/04-automerge-integration-spec.md#L59-L67)

**Atualização v4 (Colapso dos Modos)**:
Com o advento do ecossistema V4, a eleição e o papel dos committers no Automerge Repo são reestruturados:
* **Substrato de Agentes**: Como todos os dispositivos rodam ativamente um [[agente-de-sistema]] (`PROFILE:SYSTEM`), o modelo de coordenação simplifica-se e os quatro modos da V3.1 (`first_proposer`, `system_agent`, `deterministic`, `manual`) colapsam.
* **Resolução Determinística**: Em documentos comutativos (mensagens e documentos de texto), a eleição de committer torna-se determinística entre os agentes (menor `entity_id` ativo no ciclo), e o CRDT nativo do Automerge assume a convergência dos dados.
* **Roteamento de Não-Comutativos**: Estados não-comutativos (como saldos financeiros e alterações de permissões) não utilizam o fluxo distribuído e desempates do Automerge Repo, sendo roteados diretamente para o validador declarado da linhagem para serialização estrita.

## Aparições a consolidar
As seguintes definições duplicadas do termo foram consolidadas neste verbete:
* `docs/glossary.md §Automerge Repo`
* `docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1`
* `docs/rfc-transporte-p2p-v3.1.md §2.1`

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[mutates]] | 1 | criado |
| [[linhagem-de-versoes]] | 1 | criado |
| [[profile]] | 1 | criado |
| [[asset-permission]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[profile-system]] | 3 | criado |
| [[documento-casca]] | 6 | placeholder |
| [[changes]] | 6 | criado |
| [[ephemeral-messages]] | 6 | criado |
| [[sync-worker]] | 7 | placeholder |
| [[tinybase]] | 7 | placeholder |
| [[agente-de-sistema]] | 10 | placeholder |
