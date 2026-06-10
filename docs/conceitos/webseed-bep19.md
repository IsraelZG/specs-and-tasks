---
title: WebSeed (BEP 19)
slug: webseed-bep19
aliases:
  - WebSeed
  - BEP 19
  - Cloud WebSeed
  - WebSeed (BEP 19)
tags:
  - sdk
  - media
  - protocol
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/05-media-transport-plane.md §5.2
aparicoes-consolidadas:
  - docs/glossary.md §WebSeed (BEP 19)
dependencias:
  - [[webtorrent-blobs]]
  - [[rendition]]
  - [[aresta]]
  - [[no]]
  - [[profile]]
  - [[content-file]]
  - [[agente-de-sistema]]
  - [[key-vault]]
  - [[ucan]]
  - [[convergent-encryption]]
  - [[serves-aresta]]
  - [[modalidade-de-rede]]
  - [[peer-do-sistema]]
  - [[edge-translation]]
---

# WebSeed (BEP 19)

## Definição

Um **WebSeed** é um servidor HTTP em nuvem (como S3, GCS ou Google Drive) que atua como seeder estático em um swarm [[webtorrent-blobs]] via requisições de intervalo de bytes (`HTTP Range`), sem a necessidade de executar um cliente torrent ativo ou protocolo de transporte P2P na infraestrutura de nuvem.

## Por quê

Na [[vision]] (lente detalhada em [caderno-1-vision/01-vision-and-positioning.md](file:///c:/Dev2026/Docs/docs/caderno-1-vision/01-vision-and-positioning.md)), a plataforma busca acomodar múltiplas [[modalidade-de-rede]]. Em cenários corporativos ou redes gerenciadas que demandam alta confiabilidade e garantia de entrega imediata de mídias duráveis, depender exclusivamente da presença e banda de peers efêmeros pode falhar. O WebSeed permite que a infraestrutura gerenciada garanta 100% de disponibilidade dos BLOBs de forma eficiente, unificando o canal de distribuição P2P com redundância de nuvem barata e de alta performance.

## Contrato

O contrato do WebSeed no plano de transporte de mídia (especificado em [caderno-3-sdk/05-media-transport-plane.md](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/05-media-transport-plane.md)) baseia-se na especificação BEP 19 (WebSeed HTTP/FTP Seeding Extension) integrada com cifra de dados.

### Fluxo de Registro e Distribuição
O contrato operacional da integração com nuvem segue o protocolo estrito:
1. **Upload:** O [[agente-de-sistema]] (managed) cifra o arquivo por chunk e envia o ciphertext via HTTP para a nuvem como **um objeto consolidado por rendition** (no S3, o Multipart Upload é apenas o transporte de upload; ao completar, torna-se um objeto único). As tags criptográficas vão na `tag_region` ao final do mesmo objeto.
2. **Registro:** Grava o `InfoHash` do ciphertext e a URL HTTP do WebSeed no manifesto da [[rendition]], mapeado através da aresta `[[serves-aresta]]`.
3. **Download:** O cliente WebTorrent é instanciado com o magnet link mais a URL do WebSeed.
4. **Range-Range:** O objeto na nuvem é segmentado **só na transmissão** via cabeçalho HTTP `Range`. O mapeamento de chunks e tags segue as regras:
   - $\text{peça}_i = \text{objeto}[i \times \text{piece\_length} : (i+1) \times \text{piece\_length}]$
   - $\text{tag}_i = \text{objeto}[\text{tag\_region.offset} + 16i : \text{tag\_region.offset} + 16i + 16]$

## Implementação

A integração técnica do WebSeed no SDK (lente especificada em [caderno-3-sdk/05-media-transport-plane.md](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/05-media-transport-plane.md)) envolve o desacoplamento de transporte e criptografia:

### Edge Translation

A comunicação com storages privados de nuvem sem comprometer a segurança é delegada a um componente intermediário stateless e content-blind, detalhado no verbete canônico [[edge-translation]].

Consulte [[edge-translation]] para:
- O papel e o funcionamento do Edge Worker na tradução de requisições `HTTP Range` ↔ peça WebTorrent.
- As duas camadas de segurança desacopladas (token de acesso físico vs. chave lógica de decifração).

### Reidratação e Ordem de Fallback
- A ordem de fallback padrão do SDK para download de mídia: **Swarm P2P → WebSeed cloud → IPFS** (regida pela política `SPECIFICATION:MEDIA_DELIVERY`).
- No download, o Service Worker busca a `tag_region` (~16 KB por GB) antes de iniciar as requisições de peças e combina cada $\text{peça}_i$ à sua respectiva $\text{tag}_i$ para descriptografia via Crypto Worker antes de alimentar o player de mídia.

## Evolução

A governança do ciclo de vida e a evolução do WebSeed (alinhada a [caderno-4-governance/01-development-roadmap.md](file:///c:/Dev2026/Docs/docs/caderno-4-governance/01-development-roadmap.md)) distinguem seu uso de acordo com a topologia da rede:

### Restrições por Modalidade
O WebSeed/Edge é uma feature **modality-gated** (restrita a redes gerenciadas). Em redes puramente P2P ([[rede-p2p-pura]]) sem suporte a Edge Workers, a redundância é provida por seeders-peer tradicionais combinados com o anel de custódia gerida.
Em futuras revisões da especificação, planeja-se a automação da auditoria de consumo de banda integrada com recibos assinados de transferência (v4), gerados no próprio Edge Translation e imputados diretamente ao standing de contribuição dos operadores dos seeders.

---

## Aparições a consolidar

- `docs/glossary.md §WebSeed (BEP 19)` — definição resumida em uma linha; consolidada neste verbete.
- `docs/caderno-3-sdk/05-media-transport-plane.md §5.2` — especificação técnica e fluxo de Edge Translation; consolidados neste verbete.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[aresta]] | 1 | criado |
| [[no]] | 1 | criado |
| [[profile]] | 1 | criado |
| [[key-vault]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[webtorrent-blobs]] | 6 | não é alvo de verbete na Fase 2 (sem ★) |
| [[agente-de-sistema]] | 10 | criado |
| [[convergent-encryption]] | 11 | criado |
| [[rendition]] | 11 | criado |
| [[edge-translation]] | 11 | criado |
| [[serves-aresta]] | 11 | <!-- TODO(revisar): verbete não criado na Onda 11 — Foam placeholder --> |
| [[content-file]] | 11 | não é alvo de verbete na Fase 2 (sem ★) |
| [[modalidade-de-rede]] | 12 | <!-- TODO(revisar): verbete não criado na Onda 12 — Foam placeholder --> |
| [[peer-do-sistema]] | 12 | <!-- TODO(revisar): verbete não criado na Onda 12 — Foam placeholder --> |
