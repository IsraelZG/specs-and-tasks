---
name: chave-de-epoca
title: "Chave de Época (Epoch Key)"
aliases: ["epoch key", "chave epoch", "época criptográfica", "chave AES", "chave de conteúdo"]
tags: [protocol, criptografia, acesso, forward-secrecy]
---

# Chave de Época (Epoch Key)

## Definição

A Chave de Época é a **Chave de Conteúdo por Época (AES-256-GCM)** que cifra os payloads binários de nós e os payloads sensíveis de arestas de um grupo ou documento. É emitida por [[asset-permission]] (ou `ASSET:ROLE`) vigente: cada permissão tem sua própria epoch key, controlada pelo [[key-vault]]. Quando uma revogação ocorre, o [[rotacao-de-epocas]] gera uma nova chave para uma nova época e a distribui exclusivamente aos participantes com UCANs ainda ativos — o membro excluído retém acesso ao histórico cifrado com épocas anteriores, mas não consegue decifrar novos nós: é o mecanismo de forward secrecy da plataforma.

## Por quê

O sistema precisa de confidencialidade seletiva em uma rede P2P onde os dados se replicam entre peers: todos replicam todos os nós (sincronia estrutural), mas apenas detentores da chave de época correta conseguem decifrar o payload. Isso desacopla replicação de autorização — peers sem permissão carregam o ciphertext mas não têm acesso ao plaintext — e permite revogação sem exigir deleção de dados históricos.

## Contrato

O texto autoritativo está em [[caderno-2-protocol/02-cryptographic-lineage-and-auth#31-as-camadas-de-chaves]] (estrutura) e [[caderno-2-protocol/02-cryptographic-lineage-and-auth#33-rotacao-de-epocas-e-forward-secrecy]] (ciclo de vida).

Propriedades-chave (extraídas literalmente de §3.1 e §3.3):

- **Algoritmo:** AES-256-GCM.
- **Custódia:** "Custodiada no Cofre de Chaves (Key Vault)."
- **Cache volátil:** "Cache em memória RAM da chave de época descriptografada pelo Key Vault, com expiração padrão (TTL) de 4 horas, para evitar chamadas de descriptografia contínuas na projeção reativa do TinyBase."
- **Distribuição na rotação:** "A nova chave é encapsulada em envelopes criptográficos distribuídos exclusivamente aos participantes cujos UCANs correspondentes à `ASSET:PERMISSION` ou `ASSET:ROLE` continuam ativos."
- **Forward secrecy pragmático:** "O membro excluído perde o acesso às chaves das novas épocas. Contudo, mantém acesso aos dados históricos cifrados com chaves das épocas em que era participante."
- **Acesso offline pós-rotação:** "`UCAN válido offline ≠ acesso ao conteúdo pós-rotação`." O dispositivo offline lê histórico mas não decifra novos nós até reconectar e obter a nova chave.

Separação de papéis: a [[chave-mestra-ed25519]] **assina**; a Chave de Época **cifra** (tratando-se exclusivamente de uma Época de Conteúdo, totalmente ortogonal à [[epoca-de-identidade]]). As duas camadas nunca se substituem.

## Implementação

O [[key-vault]] — subsistema interno do Crypto Worker — entrega a chave de época decifrada após validar o UCAN do solicitante. Ver [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#12-crypto-worker]].

## Evolução

AES-256-GCM é estável. O mecanismo de rotação é descrito em [[rotacao-de-epocas]]; qualquer mudança no ciclo de vida de épocas (ex.: rotação por TTL além de revogação) exigiria RFC própria.

## Aparições a consolidar

Nenhuma (conceito sem redefinições espalhadas — `★` ausente no inventário).
