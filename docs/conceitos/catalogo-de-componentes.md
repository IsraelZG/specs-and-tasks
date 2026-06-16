---
name: catalogo-de-componentes
title: "Catálogo de Componentes"
aliases: ["catálogo de componentes", "components catalog", "component catalog", "índice de componentes"]
tags: [sdk, ui, design-system, componentes, ai-ready, metadados]
---

# Catálogo de Componentes

## Definição

O catálogo de componentes é o índice canônico e vivo de todos os componentes UI do [[design-system]] da plataforma. Cada entrada registra identidade, metadados AI-ready, variantes, props, tokens consumidos, anti-patterns e ciclo de vida. Um índice leve auto-gerado (`components.index.json`) serve à descoberta; metadados completos carregam sob demanda.

O contrato completo de metadados e fluxo de autoria está definido em `caderno-3-sdk/10-design-system.md §3`.

## Schema de Metadados (AI-ready)

Cada componente publica um arquivo de metadados conforme o schema TypeScript canônico (`ComponentIdentity`, `Usage`, `AntiPatterns`, `Variants`, `Composition`, `Behavior`, `Props`, `TokenUsage`, `Accessibility`, `AIHints`). Cada `ComponentIdentity` carrega marcação de ciclo de vida (`status: stable | deprecated`, `replacedBy?`, `deprecatedSince?`).

Componentes `deprecated` permanecem por retrocompatibilidade mas são excluídos das `AIHints` de descoberta para geração — agentes não os propõem para telas novas.

## Conjunto Piloto

Componentes já autorados: `Button`, `Input`, `Card`, `Message`, `NavItem`, `Toast`.

## Princípio de Autoria

**"token layer leads, metadata follows"** — primeiro os tokens semânticos do componente, depois implementação, depois metadados. O fluxo de autoria de 12 passos (`docs/AUTHORING.md` do pacote) e a validação de CI (drift de schema, tokens mal classificados, anti-patterns malformados) são obrigatórios para entrada no catálogo.

## Dependências

| conceito | status |
|:---|:---|
| [[design-token]] | criado (esta absorção) |
| [[no]] | criado |

## Ver também

- `caderno-3-sdk/10-design-system.md §3` — Contrato completo de metadados e fluxo de autoria
- `caderno-3-sdk/10-design-system.md §2` — Hierarquia de composição componente ↔ engine ↔ módulo
