---
name: content-theme
title: "CONTENT:THEME (Tema Visual)"
aliases: ["CONTENT:THEME", "tema dinâmico", "tema visual", "nó de tema"]
tags: [sdk, ontologia, graph, content, ui, customizacao]
---

# CONTENT:THEME (Tema Visual)

## Definição

`CONTENT:THEME` é um **subtipo de [[content]]** que armazena variáveis de tematização visual da plataforma como **dados no grafo** — e não como código. O mecanismo injeta os valores diretamente em CSS Custom Properties no `:root` HTML em tempo de execução, sem recarregar a aplicação.

Conforme `caderno-2-protocol/01-graph-ontology.md §3.2`:

> `CONTENT:THEME` — Variáveis de tematização visual.

A estrutura completa do payload, o vocabulário de tokens e as regras de validação estão definidos em
`caderno-3-sdk/04-theme-and-i18n-data-structures.md §1` — **leia ali antes de implementar**.

## Estrutura e Vocabulário de Tokens

O payload é um documento YAML/JSON com os campos `id`, `type`, `metadata`, `base_mode` e `tokens`.
O vocabulário canônico de tokens (cores HSL, bordas, raios, espaçamento) está especificado em
`caderno-3-sdk/04-theme-and-i18n-data-structures.md §1.1` (ver [[tokens-css-hsl]]).

Exemplo de payload e lista completa de tokens obrigatórios: ver `caderno-3-sdk/04-theme-and-i18n-data-structures.md §1.1`.

## Validação no Upload

Conforme `caderno-3-sdk/04-theme-and-i18n-data-structures.md §1.2`, ao criar ou importar um tema o
[[zen-engine]] aplica o schema da `SPECIFICATION:THEME` verificando:

- **Presença de tokens obrigatórios** — integridade de todas as chaves básicas de cores e fontes.
- **Contraste WCAG** — razão mínima de **4.5:1** para pares críticos (`background`/`foreground`,
  `primary`/`primary-foreground`); publicação bloqueada ou marcada incompatível se abaixo do limiar.

## Distribuição

Nós `CONTENT:THEME` são catalogados e descobertos via [[marketplace-customizacoes]].

- Em redes públicas: instalação livre, regulada pela reputação dos publicadores.
- Em redes corporativas: administradores podem forçar temas via `SPECIFICATION:NETWORK_GOVERNANCE`,
  mas o usuário retém o direito de forçar contraste e modo de acessibilidade localmente.

(Ver `caderno-3-sdk/04-theme-and-i18n-data-structures.md §3`.)

## Arestas Típicas

| aresta | direção | papel |
|:---|:---|:---|
| `AUTHORED` | `PROFILE` → `CONTENT:THEME` | quem criou o tema |
| `MUTATES` | nó novo → nó anterior | nova versão do tema (linhagem) |
| `GOVERNED_BY` | `CONTENT:THEME` → `SPECIFICATION:THEME` | schema e regras de conformidade |

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[content]] | 1 | criado (placeholder) |
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[mutates]] | 1 | criado |
| [[linhagem-de-versoes]] | 1 | criado |

Dependências de ondas futuras (Foam placeholders — não criar agora):

- `[[tokens-css-hsl]]` — Onda 12 (inventário §9); vocabulário de tokens CSS HSL
- `[[marketplace-customizacoes]]` — Onda 12; distribuição de temas e traduções
- `[[zen-engine]]` — Onda 7; validador que aplica o schema SPECIFICATION:THEME

## Aparições a Consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§3.2` | Substituir linha inline de `CONTENT:THEME` por `[[content-theme]]` |
| `caderno-3-sdk/04-theme-and-i18n-data-structures.md` | `§1` (título e texto) | Adicionar referência de volta a `[[content-theme]]` |
