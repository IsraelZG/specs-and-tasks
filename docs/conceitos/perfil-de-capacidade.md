---
title: Perfil de Capacidade do Motor
slug: perfil-de-capacidade
aliases:
  - perfil-de-capacidade
  - Perfis de Capacidade
  - perfis de capacidade
  - modos de restrição do motor
tags:
  - sdk
  - page-builder
  - layout
  - canonical
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/27-suite-office.md §1
aparicoes-consolidadas:
  - docs/glossary.md §Perfil de Capacidade
  - docs/caderno-3-sdk/27-suite-office.md §1
dependencias:
  - [[specification]]
  - [[content]]
  - [[perfil]]
---

# Perfil de Capacidade do Motor

## Definição

O **Perfil de Capacidade** é o mecanismo de governança declarativa e restrição comportamental do motor de renderização de páginas (`SPEC:PAGE`) da plataforma. Em vez de possuir múltiplos motores ou interpretadores de UI para diferentes produtos (documentos wiki, slides, anúncios ou posts), a plataforma utiliza um motor unificado cuja capacidade e conjunto de elementos renderizáveis são condicionados pelo perfil declarado no nó.

## Por quê → [[caderno-1-vision]]

A filosofia de design de software local-first e soberana da plataforma defende o reuso estrito de infraestrutura mínima e auditada (ver [[caderno-1-vision/01-vision-and-positioning.md]]). Desenvolver renderizadores e builders distintos para cada tipo de documento geraria duplicação de bugs, bundles pesados e silos incompatíveis de dados.
- **Unificação Operacional:** Artigos, wikis, slides de apresentação, feeds sociais e anúncios são, no fundo, arranjos de blocos de UI. Mudar de um para o outro é apenas relaxar ou restringir os componentes autorizados.
- **Segurança de Autoria:** O perfil impede que criadores injetem componentes não autorizados em contextos restritos (ex.: um componente complexo com inputs de rede dentro de um comentário de post simples).
- **Desempenho sob Medida:** O validador de render sabe de antemão os recursos máximos tolerados pelo perfil (DoD orçamentário), evitando que documentos de terceiros causem gargalos na CPU/GPU local.

## Contrato → [[caderno-2-protocol]]

No nível do protocolo:
- O perfil de capacidade é declarado de forma estática no payload de metadados da `SPEC:PAGE` através do campo `limits_profile` (ou propriedade equivalente).
- O validador estático de ingestão de blocos rejeita qualquer nó cujos componentes referenciados não constem na whitelist do perfil correspondente.
- A mutabilidade de um perfil segue regras estritas: é possível mudar o perfil de uma página de forma descendente (restringindo componentes e ações), mas a elevação de privilégios (para perfis com componentes mais amplos) requer validação criptográfica ou re-autoria.

## Implementação → [[caderno-3-sdk]]

Os perfis típicos suportados nativamente pelo SDK incluem:
- **`pagina_completa`:** Sem restrições de whitelists de componentes; ideal para painéis administrativos e dashboards customizados.
- **`documento`:** Comportamento linear e subset otimizado de blocos rich-text (notação tipo Notion/Obsidian); focado em wiki-links e colaboração Automerge em tempo real.
- **`anuncio`:** Focado em layouts visuais criativos e inserção restrita de componentes interativos e links promocionais.
- **`slide`:** Focado em layouts com proporção fixa e suporte a fluxo de apresentações sequenciais de slides e exportadores.
- **`comentario_post`:** Subset mínimo de markdown puramente estático sem suporte a execução ZEN avançada ou interatividades dinâmicas.

Para a especificação detalhada da gramática do documento de UI, consulte [`caderno-3-sdk/11-linguagem-de-paginas.md`](../caderno-3-sdk/11-linguagem-de-paginas.md) e a spec da suíte em [`caderno-3-sdk/27-suite-office.md`](../caderno-3-sdk/27-suite-office.md).
