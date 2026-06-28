---
title: Marketplace de Customizações
slug: marketplace-customizacoes
aliases: ["marketplace-customizacoes", "marketplace de customizações", "Marketplace de Customizações e Extensões", "marketplace de customizações e extensões"]
tags: [vision, sdk, customizacao, ui]
modo: canonical
fonte-canonica: docs/caderno-3-sdk/04-theme-and-i18n-data-structures.md §3
aparicoes-consolidadas:
  - caderno-3-sdk/04-theme-and-i18n-data-structures.md §3
  - caderno-1-vision/02-business-models-and-licensing.md §1.3
dependencias:
  - [[content-theme]]
  - [[content-translation]]
  - [[specification-network-governance]]
  - [[zen-engine]]
---

# Marketplace de Customizações

## Definição

O **Marketplace de Customizações** é o mecanismo descentralizado da plataforma para catalogar, descobrir e distribuir customizações estruturadas inteiramente como dados no grafo — especificamente nós do tipo [[content-theme]] (`CONTENT:THEME`) e [[content-translation]] (`CONTENT:TRANSLATION`). Em redes públicas, a instalação de customizações é livre e regulada pela reputação dos publicadores, enquanto em redes corporativas a distribuição pode ser restringida ou imposta de forma centralizada pelos administradores.

## Por quê

Para viabilizar a monetização sustentável da rede pública e a governança visual flexível de redes corporativas (ver [[vision]]). Ele permite que criadores disponibilizem temas visuais e pacotes de internacionalização cobrando taxas de distribuição ou sob regime gratuito, o que fomenta um ecossistema ativo de customização sem comprometer a integridade do código da plataforma ou a privacidade dos usuários. O marketplace também permite que corporações apliquem suas regras de identidade visual de maneira controlada, sem impedir os usuários de ajustarem a acessibilidade e o contraste locais.

## Contrato

O funcionamento do Marketplace de Customizações no nível do protocolo envolve a publicação e associação de nós no grafo (ver [[protocol]]):

- **Dados no Grafo**: Temas e traduções são publicados como nós normais do tipo `CONTENT:THEME` e `CONTENT:TRANSLATION`. Como não contêm código executável (apenas dados estáticos estruturados in JSON ou YAML), sua distribuição é inerentemente segura contra a execução de scripts arbitrários.
- **Associação de Autoria**: A autoria e a linhagem de versões dessas customizações são registradas por meio de arestas estruturais (como `AUTHORED` e `MUTATES`) apontando para as identidades (`PROFILE`) dos criadores, permitindo o rastreamento histórico e a validação criptográfica de integridade.

## Implementação

No SDK e na interface da plataforma, o Marketplace de Customizações é integrado por meio de schemas de conformidade e regras de rede (ver [[sdk]]):

- **Validação de Conformidade**: A publicação de qualquer customização passa pelo [[zen-engine]] (validador de domínio), que aplica a respectiva especificação (ex: `SPECIFICATION:THEME`) para garantir a integridade dos tokens obrigatórios, a ausência de scripts nocivos e o contraste de acessibilidade WCAG mínimo de **4.5:1** (ver [[content-theme]]).
- **Modelo de Monetização na Rede Pública**: Conforme detalhado em [[caderno-1-vision/02-business-models-and-licensing#13-marketplace-de-customizações-e-extensões]], criadores de temas ou traduções pagos no marketplace público têm uma comissão retida pela plataforma (default de 15% a 30%, dependendo do tier de publicação).
- **Imposição Corporativa e Acessibilidade**: Administradores de redes corporativas podem forçar a instalação e o uso de temas específicos via especificação de governança da rede ([[specification-network-governance]]). Contudo, o SDK preserva a soberania do usuário local no aplicativo, permitindo que o cliente force localmente o modo escuro/claro ou ajuste os tokens para garantir conformidade com requisitos de contraste e acessibilidade pessoal (ver [[caderno-3-sdk/04-theme-and-i18n-data-structures#3-distribuição-via-marketplace-de-customizações]]).

## Evolução

A governança e a distribuição do marketplace evoluem de acordo com a modalidade e a maturidade da rede (ver [[governance]]):

- **Redes Públicas vs. Corporativas**: A governança do marketplace transita de uma instalação aberta e baseada na reputação em redes públicas para uma instalação auditada e centralizada em ambientes corporativos.
- **Monetização e Reputação**: O ecossistema de temas e traduções evolui integrando-se aos sistemas de reputação e remuneração da plataforma. Reputações negativas resultantes de denúncias ou incompatibilidades técnicas de contraste pós-atualização podem depreciar a visibilidade do publicador no marketplace ou até suspender temporariamente suas publicações pagas.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `docs/caderno-3-sdk/04-theme-and-i18n-data-structures.md` | `§3` | Referenciar o conceito usando `[[marketplace-customizacoes]]`. |
| `docs/caderno-1-vision/02-business-models-and-licensing.md` | `§1.3` | Substituir a referência textual a marketplace de customizações por `[[marketplace-customizacoes]]`. |


