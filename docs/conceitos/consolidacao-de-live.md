---
title: Consolidação de Live
slug: consolidacao-de-live
aliases:
  - Consolidação de Live
  - consolidacao-de-live
  - gravação de live
  - VOD da live
tags:
  - sdk
  - media
  - stream
  - canonical
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/05-media-transport-plane.md §8.2
aparicoes-consolidadas:
  - docs/glossary.md §Consolidação de Live
  - docs/caderno-3-sdk/05-media-transport-plane.md §8.2
dependencias:
  - [[convergent-encryption]]
  - [[ephemeral-messages]]
  - [[agente-de-sistema]]
  - [[content-file]]
  - [[livekit]]
---

# Consolidação de Live

## Definição

**Consolidação de Live** é o padrão de gravação e processamento de transmissões ao vivo na plataforma. Durante a transmissão, a mídia é dividida em segmentos curtos (~6 segundos), imutáveis e fechados, que são distribuídos progressivamente no swarm como dados voláteis (`REPLICABLE_VOLATILE`) através do canal de mensagens efêmeras, mantendo o disco local do broadcaster como a única fonte de verdade e evitando a poluição do grafo. Ao encerrar a transmissão, esses segmentos voláteis são concatenados e consolidados em um único arquivo de mídia de qualidade final (`REPLICABLE_AUDITABLE`) e commitados como um único nó `CONTENT:FILE` no grafo, otimizando o sharding, o download e a saúde de compartilhamento (seeding) no swarm.

## Por quê → [[caderno-1-vision]]

A plataforma prioriza a eficiência de rede e o minimalismo no armazenamento de estado distribuído (ver [[caderno-1-vision/01-vision-and-positioning.md]]). Transmitir e gravar lives geraria um volume massivo de metadados se cada pequeno bloco fosse commitado permanentemente no grafo (cerca de 1.200 nós para uma live de 2 horas). 

A Consolidação de Live resolve isso:
- **Saúde do Swarm:** Em vez de fragmentar a audiência em centenas de swarms isolados e ineficientes de arquivos de 6 segundos, a consolidação cria um swarm único e robusto para o vídeo de gravação final (VOD), onde todos os espectadores seedam uns aos outros.
- **Minimalismo de Grafo:** Reduz o footprint no grafo para exatamente um único nó `CONTENT:FILE` no fim da live.
- **Resiliência local:** O disco local do broadcaster é a fonte primária de verdade, garantindo que mesmo diante de falhas de transporte ou rede durante a transmissão ao vivo, a gravação final não seja corrompida.

## Contrato → [[caderno-2-protocol]]

Os segmentos parciais gerados durante a transmissão ao vivo não participam do protocolo de reconciliação de estado RBSR. Em vez disso:
1. Eles trafegam como dados `REPLICABLE_VOLATILE` por meio de mensagens efêmeras de transporte (ver [[ephemeral-messages]]), sendo descartados pelos espectadores logo após o consumo ou ao final da live.
2. O arquivo consolidado final é persistido e registrado sob a primitiva `REPLICABLE_AUDITABLE` como um nó regular do tipo `CONTENT:FILE` (ver [[content-file]] <!-- Foam placeholder — Onda 11 -->), apontando para o magnet link ou InfoHash do blob final.
3. Não há criação de tipos duráveis complexos de manifesto crescente, como `LIVE_VOD` ou equivalentes, no grafo. O estado efêmero é representado por `CONTENT:LIVE_SESSION` (ver [[livekit]] <!-- Foam placeholder — Onda 11 -->) e o persistido é o tipo de arquivo comum.

## Implementação → [[caderno-3-sdk]]

O comportamento detalhado de gravação e os custos computacionais da consolidação estão descritos em [`caderno-3-sdk/05-media-transport-plane.md §8.2`](../caderno-3-sdk/05-media-transport-plane.md).

### Fluxo Operacional

#### 1. Durante a live:
- A cada ~6 segundos, o broadcaster fecha um **segmento** de mídia. Este segmento é tratado como um blob imutável completo, possuindo seu próprio `InfoHash` e região trailing de tags criptográficas.
- Os links e magnets dos segmentos trafegam exclusivamente via **canal efêmero** (WebRTC / Automerge ephemeral-messages) para distribuição direta e de baixa latência para os espectadores ativos.
- O broadcaster grava continuamente o fluxo bruto e os segmentos em seu disco local (fonte de verdade).

#### 2. Ao encerrar a live:
- O broadcaster lê os segmentos gravados em disco, consolida-os em um **único blob** de mídia e realiza o upload para o WebTorrent/IPFS.
- Commita-se um único nó `CONTENT:FILE` com o magnet link do todo no grafo (`REPLICABLE_AUDITABLE`).
- Os segmentos voláteis mantidos na rede pelos espectadores são descartados.

### Custo de Consolidação por Modo de Cifra

A eficiência e o consumo computacional na consolidação diferem de acordo com o modo de criptografia de mídia ativo (configurado na `SPECIFICATION:MEDIA_DELIVERY` do asset e no [[convergent-encryption]]):

- **Modo `unique` (P2P Puro):**
  Se os segmentos forem cifrados compartilhando a mesma chave de criptografia com um **contador contínuo** de blocos que persiste entre os segmentos, a concatenação binária direta dos ciphertexts dos segmentos gera exatamente o ciphertext final do arquivo completo. Desta forma, a consolidação requer apenas o **re-hash** do arquivo concatenado para obter o novo `InfoHash` final, sem necessidade de decifrar ou re-encriptar os dados (custo computacional quase zero).
  
- **Modo `convergent` (Managed / Corporativo / Público):**
  No modo convergente, a chave final do arquivo deriva deterministicamente do hash do plaintext completo (`HKDF(salt_rede, H(plaintext_completo))`). Como o plaintext completo só é conhecido no encerramento da live, os segmentos são transmitidos ao vivo usando uma **chave de sessão temporária**. Portanto, ao encerrar a live, o broadcaster deve decifrar os segmentos locais e **re-encriptar** o arquivo consolidado sob a chave convergente final gerada (custo computacional de processamento pago pelo broadcaster ou intermediado pelo [[agente-de-sistema]]).

### Lives Ilimitadas e Checkpoints
Para transmissões contínuas de duração ilimitada (24/7), onde o encerramento da live não ocorre naturalmente, adota-se um mecanismo de **checkpoint periódico**: a cada intervalo definido de tempo $X$ (por exemplo, a cada 1 hora), o SDK consolida o segmento decorrido e commita um nó de arquivo parcial no grafo, liberando memória e rotacionando as chaves de sessão temporárias.

---

## Evolução → [[caderno-4-governance]]

Em cenários de falhas físicas ou crash do broadcaster antes do encerramento formal da transmissão, a integridade da gravação final é recuperada por meio de rotinas de recuperação no reinício (restart) do SDK. O SDK detecta a live interrompida localmente, realiza a consolidação do trecho presente no disco local e efetua o commit do arquivo consolidado parcial disponível. Políticas de expurgo, custos e limites de banda de upload para a consolidação são controlados e ajustados via especificações de rede.

## Aparições a consolidar

- `docs/glossary.md §Consolidação de Live` — definição curta do glossário consolidada na íntegra no verbete.
- `docs/caderno-3-sdk/05-media-transport-plane.md §8.2` — seção sobre gravação de live em andamento e consolidação de VOD substituída por referências a este verbete.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[convergent-encryption]] | 11 | criado |
| [[ephemeral-messages]] | 6 | criado |
| [[agente-de-sistema]] | 10 | criado |
| [[content-file]] | 11 | <!-- Foam placeholder — Onda 11 --> |
| [[livekit]] | 11 | <!-- Foam placeholder — Onda 11 --> |
| [[peer]] | 12 | <!-- Foam placeholder — Onda 12 (futura) --> |
| [[modalidade-de-rede]] | 12 | <!-- Foam placeholder — Onda 12 (futura) --> |
