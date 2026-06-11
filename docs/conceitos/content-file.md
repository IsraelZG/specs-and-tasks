---
title: Content File
aliases:
  - CONTENT:FILE
  - arquivo de conteúdo
tags:
  - protocol
  - sdk
modo: canonical
---

# Content File

## Definição
Um **Content File** (`CONTENT:FILE`) é um tipo de nó de conteúdo (`CONTENT`) no grafo que registra metadados, ponteiros de transporte (como `InfoHash` ou `CID`) e informações de autenticação (como regiões de tags de criptografia) de um arquivo binário ou BLOB (Binary Large Object) persistente. Como os dados binários volumosos não trafegam via reconciliação de estado, o arquivo físico propriamente dito é armazenado cifrado fora do grafo (off-graph/off-RBSR), sendo gerenciado por uma rede de custódia e entrega de mídia distribuída.

## Por quê ([[vision]])
- **Preservação de Performance:** Evita que blobs binários e estáticos degradem o tráfego e o tempo de reconciliação das mensagens e da estrutura de ontologia do grafo conduzidos via [[rbsr]].
- **Independência de Acesso e Custódia:** Separa o controle de acesso lógico (gerido por chaves de época e UCANs no grafo) da custódia física do ciphertext (armazenado em swarms P2P ou WebSeeds).
- **Deduplicação Inteligente:** Facilita a deduplicação de mídia idêntica no modo de criptografia convergente ([[convergent-encryption]]) ao mesmo tempo que mantém a privacidade dos dados de acordo com a modalidade da rede.

## Contrato ([[protocol]])
O contrato e o comportamento do nó `CONTENT:FILE` são definidos em [[caderno-3-sdk/05-media-transport-plane]].
- **Custódia Off-Graph:** O blob físico do arquivo está **fora do RBSR**, de modo que a custódia do grafo (anel por [[consistent-hashing]], RELEASE/ACK — RFC §4) governa os *registros* `CONTENT:FILE` e suas arestas, e a disponibilidade do **ciphertext físico** é governada separadamente.
- **Armazenamento de Tags:** As tags de criptografia de 16 bytes de cada chunk (AES-256-GCM) não são intercaladas no payload principal nem vão para o grafo para evitar poluir o [[rbsr]]. São gravadas em uma região trailing adjacente ao arquivo, com o manifesto indicando `tag_region.offset` e `tag_region.length = 16 × N`.
- **Exceção para Arquivos Pequenos:** Para blobs minúsculos, opcionalmente, as tags de criptografia podem ir no payload do `CONTENT:FILE` (embora isso não seja recomendado para mídias).
- **Relação com Renditions:** Nós `CONTENT:FILE` geralmente atuam como representações físicas concretas associadas a um asset de mídia por meio de [[rendition]].
- **Associação de Fontes:** A adição de fontes de transporte adicionais (por exemplo, disponibilizar o mesmo `InfoHash` via IPFS) não cria um novo nó. É modelada como uma aresta estrutural:
  `PROFILE (operador da fonte) —SERVES→ CONTENT:rendition` (ver [[serves-aresta]]), com a URL/CID/magnet como um atributo da aresta.

## Implementação ([[sdk]])
A lógica de leitura, decodificação e controle de fluxo é executada no SDK (ver [[caderno-3-sdk/05-media-transport-plane]]):
- **Adapters de Rede:** O SDK suporta múltiplos adapters para carregar o ciphertext físico a partir de `WebTorrent` (trackers WSS privados), `Cloud WebSeed` (com Edge Translation traduzindo HTTP Range requests de forma stateless e content-blind) e `IPFS`.
- **Reidratação na UI:** O Service Worker gerencia a requisição do player, baixa a `tag_region` do arquivo e cacheia-a. Conforme as peças do ciphertext chegam, o Service Worker as envia ao `CryptoWorker` (ver [[crypto-worker]]) via `postMessage` transferível para descriptografia progressiva `AES-256-GCM(decrypt)`. O fluxo descriptografado é empurrado via `ReadableStream` ao player sem expor os chunks descriptografados ao contexto da página.
- **Disponibilidade Declarada por Tier:** Um peer só é fixado como custódio de chunk se seu tier declara e verifica `seeder` ou `store`. Mobile efêmero nunca recebe custódia crítica de blob.

## Evolução ([[governance]])
- **Standing de Contribuição:** O serving de chunks gera recibos assinados pela contraparte que alimentam o standing de contribuição do provedor no módulo de governança econômica (ver [[economia-como-modulo]]).
- **Expulsão por Rarest-First:** A limpeza e o gerenciamento de espaço em disco no SDK utilizam o algoritmo G4 (ver [[g4-garbage-collection]]), que realiza a expulsão de blobs cruzando sua raridade estimada no swarm (via trackers e PEX) com o ranking de custódia local.

## Aparições a consolidar
- `docs/caderno-3-sdk/05-media-transport-plane.md` (no §3.3, §4.2, §5.3, §7 e §8.2) — Contém a especificação e mecânicas técnicas do plano de BLOBs de mídia.
- `docs/backlog-geral.md` (no §6.2) — Lista de tarefas pendentes para a implementação do pipeline de mídia, adapters e reidratação do player no SDK.


