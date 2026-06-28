---
name: content-translation
title: "CONTENT:TRANSLATION (Tradução i18n)"
aliases: ["CONTENT:TRANSLATION", "tradução i18n", "nó de tradução", "internacionalização"]
tags: [sdk, ontologia, graph, content, i18n, customizacao]
---

# CONTENT:TRANSLATION (Tradução i18n)

## Definição

`CONTENT:TRANSLATION` é um **subtipo de [[content]]** que armazena dicionários de strings de interface como **dados no grafo** — e não como código ou arquivos estáticos. O [[tinybase]] observa a tradução selecionada pelo usuário e atualiza a interface dinamicamente, sem recarregar a aplicação.

Conforme `caderno-2-protocol/01-graph-ontology.md §3.2`:

> `CONTENT:TRANSLATION` — Dicionário de strings i18n.

A estrutura completa do payload, as regras de validação e o mecanismo de distribuição estão definidos em
`caderno-3-sdk/04-theme-and-i18n-data-structures.md §2` — **leia ali antes de implementar**.

## Estrutura do Nó

O payload é um documento YAML/JSON com os campos `id`, `type`, `metadata` (idioma, região, versão,
cobertura) e `strings` (dicionário plano de chaves de tradução).

Exemplo de payload e estrutura completa: ver `caderno-3-sdk/04-theme-and-i18n-data-structures.md §2.1`.

## Validação

Conforme `caderno-3-sdk/04-theme-and-i18n-data-structures.md §2.2`, o [[zen-engine]] garante:

- **Preservação de placeholders** — os placeholders presentes nas strings canônicas (ex: `{count}`, `{name}`)
  devem ser preservados na string traduzida.
- **Ausência de injeção de scripts** — os payloads textuais não podem conter scripts maliciosos.

## Distribuição

Nós `CONTENT:TRANSLATION` são catalogados e descobertos via [[marketplace-customizacoes]].

- Em redes públicas: instalação livre, regulada pela reputação dos publicadores.
- Em redes corporativas: administradores podem forçar temas e traduções via `SPECIFICATION:NETWORK_GOVERNANCE`,
  mas o usuário retém o direito de forçar contraste e modo de acessibilidade localmente.

(Ver `caderno-3-sdk/04-theme-and-i18n-data-structures.md §3`.)

## Arestas Típicas

| aresta | direção | papel |
|:---|:---|:---|
| `AUTHORED` | `PROFILE` → `CONTENT:TRANSLATION` | quem criou a tradução |
| `MUTATES` | nó novo → nó anterior | nova versão da tradução (linhagem) |
| `GOVERNED_BY` | `CONTENT:TRANSLATION` → `SPECIFICATION:TRANSLATION` | schema e regras de conformidade |

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

- `[[tinybase]]` — Onda 7; observa a tradução selecionada e atualiza a UI reativamente
- `[[marketplace-customizacoes]]` — Onda 12; distribuição de temas e traduções
- `[[zen-engine]]` — Onda 7; validador que aplica regras de conformidade

## Aparições a Consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§3.2` | Substituir linha inline de `CONTENT:TRANSLATION` por `[[content-translation]]` |
| `caderno-3-sdk/04-theme-and-i18n-data-structures.md` | `§2` (título e texto) | Adicionar referência de volta a `[[content-translation]]` |


