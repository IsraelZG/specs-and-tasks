---
name: design-token
title: "Design Token"
aliases: ["token", "tokens de design", "design tokens", "token semântico", "token de tema", "primitivo"]
tags: [sdk, ui, design-system, tokens, style-dictionary]
---

# Design Token

## Definição

Design tokens are a unidade atômica do [[caderno-3-sdk/10-design-system|design-system]] da plataforma — variáveis nomeadas que armazenam decisões de estilo (cor, espaçamento, tipografia, motion) desvinculadas de qualquer implementação específica. Compilados por **Style Dictionary** para todos os formatos de distribuição (CSS custom properties, JS/TS, React Native, iOS Swift, Android XML, variante TV).

O contrato completo de tokens, invariantes e regras de composição está definido em `caderno-3-sdk/10-design-system.md §1`.

## As Três Camadas

A plataforma adota arquitetura de tokens em três camadas:

1. **Global (primitivos)** — valores brutos sem semântica. Imutáveis por tema.
2. **Tema** — mapeamento semântico de primitivos por contexto visual (`light`, `dark`, white-label). Única camada que [[content-theme]] pode sobrescrever.
3. **Semântica (componentes)** — tokens consumidos pelos componentes, referenciando exclusivamente a camada de tema.

Componentes **nunca** consomem primitivos diretamente nem valores literais (Invariante I1). Nenhum módulo declara cor/fonte/dimensão literal — lint de CI bloqueia (Invariante I3).

## Relação com CONTENT:THEME

[[content-theme]] é o mecanismo de dados no grafo que sobrescreve exclusivamente a **camada de tema** do contrato de tokens — nunca a semântica diretamente. Ver `caderno-3-sdk/04-theme-and-i18n-data-structures.md §1` e `caderno-3-sdk/10-design-system.md §1`.

## Dependências

| conceito | status |
|:---|:---|
| [[content-theme]] | criado |
| [[no]] | criado |

## Ver também

- `caderno-3-sdk/10-design-system.md §1` — Contrato completo e invariantes
- `caderno-3-sdk/04-theme-and-i18n-data-structures.md §1` — Integração com CONTENT:THEME
