---
title: Anúncios, Campanha e Promoção
slug: anuncio
aliases:
  - anúncio
  - campanha
  - promoção
  - SPEC:AD
  - SPECIFICATION:AD_CAMPAIGN
  - RELATES:AD:PROMOTES
tags:
  - sdk
  - ads
  - marketing
  - canonical
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/29-anuncios-reference-spec.md §1
aparicoes-consolidadas:
  - docs/glossary.md §Anúncio
  - docs/caderno-3-sdk/29-anuncios-reference-spec.md §1
dependencias:
  - [[content]]
  - [[specification]]
  - [[profile]]
  - [[economia-como-modulo]]
  - [[asset-balance-state]]
  - [[asset-lock]]
---

# Anúncio, Campanha e Promoção

## Definição

O ecossistema de anúncios e marketing da plataforma é governado de forma cross-módulo sobre o grafo unificado de metadados, sem criar novos tipos de nós redundantes:
1. **Anúncio** é um nó `CONTENT` (criativo) governado pela especificação de anúncios `SPEC:AD`, vinculado ao item promovido por uma aresta estrutural `RELATES:AD:PROMOTES`.
2. **Campanha** é definida pela especificação `SPECIFICATION:AD_CAMPAIGN`, que centraliza as regras de orçamento, pacing, superfícies de veiculação e critérios de segmentação.
3. **Promoção** é o ato de veicular o anúncio associado nas superfícies expostas pelos diversos módulos (Feed, Streaming, Marketplace, Busca), referenciando o item de forma limpa sem duplicá-lo.

## Por quê → [[caderno-1-vision]]

A plataforma rejeita abordagens centralizadas tradicionais e invasivas de publicidade. Em vez disso, adota a soberania por construção:
- **Promoção Não-Duplicada:** Um anúncio não cria um produto ou vídeo novo no grafo; ele simplesmente estende um nó existente por meio de uma aresta leve `RELATES:AD:PROMOTES`.
- **Segmentação Local P2P:** A seleção do anúncio roda inteiramente no cliente do espectador. O anunciante não recebe dados de perfilamento individual, apenas relatórios agregados.
- **Transparência e Consentimento:** Todo anúncio é obrigatoriamente rotulado na UI como "patrocinado", e a veiculação respeita estritamente o limite observacional e as chaves de acesso expostas pelo usuário.

## Contrato → [[caderno-2-protocol]]

A veiculação e o orçamento contam com garantias do protocolo:
- O orçamento de uma campanha é depositado em um `ASSET:BALANCE_STATE` específico da mesma.
- A distribuição de impressões no tempo é controlada por meio de `ASSET:LOCK` temporários (pacing) para evitar esgotamento de fundos.
- Os eventos de clique ou impressão são assinados pelo `PROFILE` do espectador e liquidados através do motor Zen (ver [[economia-como-modulo]]).

## Implementação → [[caderno-3-sdk]]

O detalhamento técnico das superfícies e segmentação está em [`caderno-3-sdk/29-anuncios-reference-spec.md`](../caderno-3-sdk/29-anuncios-reference-spec.md).

### Proteção Anti-Fraude e Anonimato

1. **Assinatura do Observador:** Apenas cliques e impressões que carregam a assinatura do perfil (`PROFILE`) que visualizou o anúncio são passíveis de faturamento, prevenindo cliques artificiais não identificados.
2. **Filtro Sybil de Liquidação:** O Zen atribui peso nulo a eventos gerados por perfis recém-criados ou que não possuam reputação/saldo mínimo na rede.
3. **Privacidade Diferencial & k-anonimato:** Para mitigar ataques de des-anonimização em audiências muito restritas, o SDK exige que a veiculação só comece quando o coorte atingir $k$ usuários ativos, inserindo ruído estatístico nas métricas agregadas repassadas ao anunciante.
