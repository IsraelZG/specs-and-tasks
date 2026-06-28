---
name: participates-in
title: "Aresta PARTICIPATES_IN"
aliases: ["PARTICIPATES_IN", "MEMBER_OF (descontinuado)"]
tags: [protocol, ontologia, arestas, relacional, pertencimento]
---

# Aresta PARTICIPATES_IN

`PARTICIPATES_IN` é um **verbo raiz canônico** do grafo da plataforma que expressa pertencimento contínuo de um [[profile]] a um grupo, projeto ou contexto. Substitui permanentemente a antiga aresta `MEMBER_OF`.

## Definição

Conforme `caderno-2-protocol/01-graph-ontology.md §2` e §2.1:

> `PARTICIPATES_IN` — Pertencimento contínuo a grupos, projetos e contextos.

> *A aresta `PARTICIPATES_IN` substitui permanentemente a antiga aresta `MEMBER_OF` em toda a ontologia da plataforma.*

## Padrão de nomenclatura

`PARTICIPATES_IN` segue o padrão formal de arestas de alto grau semântico (ver [[aresta]] e [[substantivo-verbo-principio]]):

```
VERBO:DOMÍNIO:SPECIFIER
```

Exemplos canônicos (fonte: `caderno-2-protocol/01-graph-ontology.md §2`):

| Aresta | Significado Semântico |
|:---|:---|
| `PARTICIPATES_IN:GROUP:MEMBER` | Pertencimento a grupo como membro simples. |
| `PARTICIPATES_IN:PROJECT:CONTRIBUTOR` | Pertencimento a projeto como contribuidor de código. |

## Separação entre fato social e autorização técnica

A existência de uma aresta `PARTICIPATES_IN` **não implica** `ASSET:PERMISSION` sobre o conteúdo do contexto.

Conforme `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2`:

> A Plataforma Projeto SuperApp V0.41 adota uma separação rigorosa entre **Fatos Sociais/Estruturais** (ex: pertencer a um grupo via aresta `PARTICIPATES_IN`) e **Autorizações Técnicas de Acesso**. A existência de uma aresta `PARTICIPATES_IN` não concede permissão criptográfica de leitura ou escrita.

O acesso efetivo é controlado por [[asset-permission]], [[asset-role]] e [[ucan]] — independentemente do pertencimento declarado pela aresta.

## Relação com os verbos raiz canônicos

`PARTICIPATES_IN` é um dos cinco verbos raiz do grafo (ver [[verbos-raiz-canonicos]]):

| Verbo raiz | Semântica |
|:---|:---|
| `RELATES` | Relações sociais, familiares e interpessoais |
| `OWNS` | Posse estável de ativos, recursos e documentos |
| `GOVERNS` | Governança, regulação e especificações |
| `INTERACTS` | Interações temporárias ou casuais com conteúdos |
| `PARTICIPATES_IN` | Pertencimento contínuo a grupos, projetos e contextos |

## Sujeito e contexto de uso

Conforme `caderno-2-protocol/01-graph-ontology.md §3.1`, nós do tipo [[profile]] **emitem** ações e **recebem pertences** via arestas `PARTICIPATES_IN` e `OWNS`. Todos os subtipos — [[profile-authentication]], [[profile-persona]], [[profile-organization]], [[profile-system]] — podem ser sujeito desta aresta.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[aresta]] | 1 | criado |
| [[no]] | 1 | criado |
| [[profile]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| [[asset-permission]] | 2 | criado |
| [[asset-role]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[profile-authentication]] | 3 | placeholder |
| [[profile-persona]] | 3 | criado |
| [[profile-organization]] | Fase 3 | placeholder |
| [[profile-system]] | 3 | criado |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§2` e `§2.1` | Substituir definição inline por `[[participates-in]]` |
| `glossary.md` | `§PARTICIPATES_IN` | Substituir definição por `[[participates-in]]` |


