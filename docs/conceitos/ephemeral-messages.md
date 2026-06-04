---
title: Ephemeral Messages
slug: ephemeral-messages
aliases: ["Ephemeral Messages", "ephemeral-messages", "mensagens efêmeras", "canal efêmero", "comunicação efêmera"]
tags: [protocol, automerge, WebRTC, transport, pending-changes]
modo: canonical
fonte-canonica: docs/caderno-2-protocol/04-automerge-integration-spec.md §4.1
aparicoes-consolidadas:
  - glossary.md §Ephemeral Messages
  - docs/rfc-transporte-p2p-v3.1.md §2.1
dependencias:
  - [[automerge]]
  - [[automerge-repo]]
  - [[changes]]
  - [[documento-casca]]
  - [[matriz-de-classificacao-transporte]]
  - [[sync-worker]]
  - [[profile-system]]
  - [[swarm-registry]]
---

# Ephemeral Messages

## Definição

`Ephemeral Messages` são mensagens voláteis transmitidas diretamente em RAM entre peers conectados via canais de dados (geralmente WebRTC ou WebSockets), sem persistência durável no grafo global de dados. Providas pela camada de orquestração do [[automerge-repo]], as mensagens efêmeras servem como o canal de transporte de baixa latência e baixo overhead do sistema, sendo categorizadas na [[matriz-de-classificacao-transporte]] como dados `REPLICABLE_VOLATILE`. Elas são destinadas à coordenação de curto prazo, como a propagação em tempo real de [[changes]] pré-commit, coordenação determinística e eleição de committers, coleta de co-assinaturas criptográficas e heartbeats de vivacidade.

## Por quê

O uso de mensagens efêmeras atende à necessidade de reatividade em tempo real e de comunicação operacional com baixo custo computacional e de armazenamento. Se toda micro-edição de texto (caractere digitado, clique, movimento de cursor) ou sinal de sincronização gerasse um nó físico auditável no grafo persistente (`nodes`), o banco de dados do usuário e a rede sofreriam um inchaço inviabilizante. 

Ao separar os dados operacionais voláteis do estado do grafo auditável, as mensagens efêmeras permitem colaboração instantânea em tempo real (digitação simultânea) sob o paradigma **Local-First**, mantendo a integridade semântica do grafo limpa e composta apenas por marcos (commits) significativos e duráveis de versões de documentos.

## Contrato

As regras de contrato que regem o comportamento e os casos de uso das `Ephemeral Messages` estão descritas principalmente nas seguintes seções:

- **Propagação de Alterações (Staging)**: Descrito em [[caderno-2-protocol/04-automerge-integration-spec#3-1-captura-de-changes-escrita-em-staging]], as [[changes]] em tempo real são enviadas em RAM como mensagens efêmeras para todos os peers conectados a um [[documento-casca]].
- **Co-assinatura de Snapshots**: Conforme [[caderno-2-protocol/04-automerge-integration-spec#4-1-co-assinatura-via-ephemeral-messages]], quando a `SPECIFICATION` exige aprovação conjunta antes de publicar uma nova versão, o Committer proposto envia o hash do snapshot binário como mensagem efêmera em RAM via WebRTC para obter assinaturas Ed25519 dos co-editores antes de persistir o nó de versão física final.
- **Enquadramento de Roteamento**: De acordo com a [[matriz-de-classificacao-transporte]] (especificada em [[rfc-transporte-p2p-v3.1#2-11-matriz-de-classificação-de-transporte-as-3-perguntas]]), as mensagens efêmeras são classificadas como `REPLICABLE_VOLATILE` por responderem "SIM" para observabilidade de peers, "NÃO" para auditabilidade histórica e "NÃO" para sobrevivência além da sessão. O protocolo de rede associado é `EPHEMERAL_WEBRTC` (ou canal efêmero websocket/datagram) e utiliza encriptação baseada em Chave de Época.
- **Heartbeat de Vivacidade**: Conforme [[rfc-transporte-p2p-v3.1#3-2-2-swarmregistry]], a recepção de qualquer mensagem efêmera pelo canal de dados funciona como um heartbeat implícito, zerando o temporizador de inatividade do peer remetente no [[swarm-registry]] local.

## Implementação

A infraestrutura de roteamento e processamento das `Ephemeral Messages` está implementada nas seguintes partes do SDK:

- **[[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#1-1-sync-worker]]**: Onde o [[sync-worker]] gerencia o [[automerge-repo]] e despacha as mensagens efêmeras na RAM, servindo como a ponte reativa para o cache de UI.
- **[[caderno-3-sdk/01-sqlite-and-projections-schema#4-matriz-de-classificação-de-transporte]]**: Onde é formalizado o contrato TypeScript para o comportamento de transporte `REPLICABLE_VOLATILE` ligado ao destino físico `sqlite_pending_changes` sob o protocolo `EPHEMERAL_WEBRTC`.
- **Plano de Mídia (`REPLICABLE_VOLATILE`)**: De acordo com [[caderno-3-sdk/05-media-transport-plane#8-2-consolidação-de-live]], os magnets de segmentos de streaming ao vivo trafegam no canal efêmero (WebRTC / Automerge ephemeral) para evitar sobrecarregar o grafo com nós transientes de live.

## Evolução

Na Plataforma V3.1, a eleição e coordenação de committers em documentos colaborativos dependiam de negociações ativas via mensagens efêmeras. 

A partir da **v4** (descrita em [[caderno-2-protocol/04-automerge-integration-spec#4-modos-de-eleicao-de-committer]]), a mecânica evolui para uma eleição puramente determinística baseada na execução local e idêntica entre agentes de sistema ([[profile-system]]), o que elimina o overhead de tráfego de coordenação de committer por mensagens efêmeras (com exceção do recolhimento de assinaturas e propagação de changes).

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Ephemeral Messages` | Remover a definição redundante e linkar a este verbete. |
| `rfc-transporte-p2p-v3.1.md` | `§2.1` | Manter a especificação do stack de transporte e referenciar este verbete. |
| `caderno-2-protocol/04-automerge-integration-spec.md` | `§4.1` | Manter o protocolo normativo de co-assinatura e wikilinkar a este verbete. |
