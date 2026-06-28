---
title: Edge Translation
slug: edge-translation
aliases:
  - tradução-de-borda
  - Edge Translation
tags:
  - sdk
  - media
modo: canonical
fonte-canonica: docs/caderno-3-sdk/05-media-transport-plane.md §5.2
aparicoes-consolidadas:
  - docs/glossary.md §Edge Translation
  - docs/conceitos/webseed-bep19.md §Edge Translation
dependencias:
  - [[webseed-bep19]]
  - [[webtorrent-blobs]]
  - [[key-vault]]
  - [[ucan]]
---

# Edge Translation

## Definição

O **Edge Translation** é um mecanismo no qual um Edge Worker stateless e content-blind atua como intermediário na entrega de mídias criptografadas, traduzindo requisições `HTTP Range` em peças WebTorrent e injetando tokens de acesso ao armazenamento físico na nuvem, sem ter acesso às chaves de criptografia dos dados.

## Por quê

Na [[vision]] de conformidade e segurança da plataforma (detalhada em [caderno-1-vision/01-vision-and-positioning.md](../caderno-1-vision/01-vision-and-positioning.md)), é fundamental desacoplar a autorização de transporte físico e a descriptografia de dados.
Ao delegar a injeção de tokens de storage a um Edge Worker, a rede pode servir dados de buckets de nuvem privados de forma totalmente segura. Isso protege a infraestrutura de nuvem contra a exposição direta de chaves de API/tokens de longa duração e evita que o provedor de nuvem (ou o próprio Edge Worker) acesse em claro o conteúdo da mídia, mitigando ataques de confidencialidade na borda (edge).

## Contrato

O contrato técnico (especificado em [caderno-3-sdk/05-media-transport-plane.md](../caderno-3-sdk/05-media-transport-plane.md) e integrado ao [[webseed-bep19]]) exige o desacoplamento rígido de duas camadas de autorização:
1. **Token de Acesso ao Storage:** O Edge Worker intercepta a requisição do cliente, injeta o token ou assinatura temporária de autenticação no bucket privado (ex: AWS IAM, token S3) e assina a requisição HTTP Range enviada ao storage de origem. O Edge Worker vê apenas o ciphertext e o token.
2. **Chave AES do Arquivo (`K_content` ou `K_file`):** O conteúdo armazenado no bucket é sempre cifrado por chunk e o Edge Worker opera de forma *content-blind* (sem visibilidade da chave AES de decifração). O cliente do SDK só consegue descriptografar a mídia após obter a chave de forma independente via [[key-vault]] validada por [[ucan]].

O mapeamento de ranges na tradução segue a regra:
- $\text{peça}_i = \text{objeto}[i \times \text{piece\_length} : (i+1) \times \text{piece\_length}]$
- $\text{tag}_i = \text{objeto}[\text{tag\_region.offset} + 16i : \text{tag\_region.offset} + 16i + 16]$

## Implementação

A integração técnica no SDK (lente especificada em [caderno-3-sdk/05-media-transport-plane.md](../caderno-3-sdk/05-media-transport-plane.md)) envolve o seguinte fluxo de tradução operado no WebSeed Adapter:
- O cliente WebTorrent solicita uma peça de um torrent e converte a requisição em uma requisição HTTP Range voltada para a URL do Edge Worker.
- O Edge Worker (ex: Cloudflare Workers ou AWS Lambda@Edge) intercepta e processa o request, anexa a autenticação do storage privado e encaminha a requisição de intervalo de bytes ao bucket.
- O buffer de resposta do bucket é retornado ao cliente.
- O cliente, utilizando o Service Worker e o Crypto Worker, combina a peça recebida com a respectiva tag criptográfica da `tag_region` obtida previamente para descriptografá-la de forma isolada em memória.

## Evolução

A governança do ciclo de vida e a evolução (alinhada a [caderno-4-governance/01-development-roadmap.md](../caderno-4-governance/01-development-roadmap.md)) distinguem seu uso de acordo com a modalidade:
- A funcionalidade de Edge Translation é restrita a topologias com redundância gerenciada. Em cenários de [[rede-p2p-pura]], a tradução na borda é pulada em favor do transporte direto entre peers e custódia local.
- Futuras revisões preveem a integração do Edge Worker com sistemas automáticos de contabilidade de largura de banda na infraestrutura gerenciada, onde o Edge Worker gera um recibo de serving assinado que pode ser auditado e imputado diretamente ao standing de contribuição de operadores que custodeiam o WebSeed.

---

## Aparições a consolidar

- `docs/glossary.md §Edge Translation` — definição de glossário em uma linha; consolidada neste verbete.
- `docs/conceitos/webseed-bep19.md §Edge Translation` — seção contendo o detalhamento do Edge Translation; consolidada neste verbete.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[key-vault]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[webtorrent-blobs]] | 6 | não é alvo de verbete na Fase 2 (sem ★) — Foam placeholder |
| [[webseed-bep19]] | 11 | criado |


