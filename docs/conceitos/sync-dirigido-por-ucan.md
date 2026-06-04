---
name: sync-dirigido-por-ucan
title: "Sync Dirigido por UCAN"
aliases: ["sync dirigido por ucan", "sync dirigido por permissions", "UCAN-driven sync", "permission-driven sync"]
tags: [protocol, sincronizacao, ucan, controle-de-acesso, hub]
---

# Sync Dirigido por UCAN

**Modo hub** — definição normativa completa em `caderno-2-protocol/03-set-reconciliation-protocol.md §2`.

---

## O que é

Sync Dirigido por UCAN é o mecanismo pelo qual a sincronização de dados entre peers é **escopada e filtrada pelo token de autorização [[ucan]] ativo**, em vez de usar canais globais ou tópicos corporativos de pub/sub.

Conforme `caderno-2-protocol/03-set-reconciliation-protocol.md §2`:

> Diferente de barramentos de Pub/Sub tradicionais, a plataforma **não possui canais globais ou tópicos de sincronização corporativos**.

O princípio central: a B-Tree de reconciliação e seus [[fingerprint|fingerprints]] de ranges são calculados e expostos **exclusivamente** sobre o subgrafo explicitamente autorizado pelo UCAN ativo.

## Como funciona

Conforme `caderno-2-protocol/03-set-reconciliation-protocol.md §2`:

> **Filtragem por UCAN**: Ao iniciar a sincronização, o Sync Worker local lê o token UCAN de autorização ativo, extrai a query de traversal (que define `root`, `depth`, `direction` e filtros de arestas/nós da `ASSET:PERMISSION` correspondente) e a injeta como uma restrição de filtragem na consulta recursiva (Common Table Expressions - CTE) local do SQLite. Isso garante que a B-Tree de sincronização e seus respectivos fingerprints de ranges sejam calculados e expostos exclusivamente sobre o subgrafo explicitamente autorizado.

> **Execução Restrita**: A troca de XORs de ranges da B-Tree ocorre estritamente nos escopos autorizados comuns. Um peer sem um UCAN ativo contendo permissão de acesso sobre um subgrafo nunca receberá, transmitirá ou verificará fingerprints de ranges pertencentes a esse subgrafo, blindando metadados na camada de transporte.

A RFC de transporte (`rfc-transporte-p2p-v3.1.md §2.7`) sintetiza o enforcement bilateral:

> **Enforcement bilateral.** A validação é feita pelo lado que **fornece** o dado: ele valida assinaturas e cadeia de delegação do UCAN anexado à requisição antes de servir qualquer delta. Um peer sem UCAN ativo sobre um subgrafo **nunca** recebe, transmite ou verifica fingerprints daquele subgrafo — blindando metadados na camada de transporte.

## Por que não há canais globais

A ausência de canais ou tópicos globais é uma escolha de design deliberada: um canal global exporia metadados de topologia (quais subgrafos existem, quem participa) a qualquer peer conectado. Ao vincular a formação da B-Tree ao escopo UCAN, o mecanismo de [[rbsr]] nunca revela a existência de dados para os quais o peer solicitante não tem autorização, mesmo ao nível de [[fingerprint]].

## Relação com o RBSR e as Ondas

O sync dirigido por UCAN opera como **pré-condição** do protocolo [[rbsr]]: antes de qualquer troca de fingerprints de range, o Sync Worker filtra o conjunto de elementos pela query de traversal extraída do UCAN. As [[onda|ondas]] (Onda 0 a 3) executam sobre esse conjunto já filtrado. O mecanismo se integra diretamente ao [[anti-entropy]] O(1) da Onda 0: o root fingerprint trocado na abertura da sessão já é o fingerprint do subgrafo autorizado, não do grafo total.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[ucan]] | 2 | criado |
| [[rbsr]] | 4 | criado |
| [[fingerprint]] | 4 | criado |
| [[anti-entropy]] | 4 | criado |
| [[onda]] | 4 | criado |
| [[range-footer]] | 4 | criado |
| [[nonce-challenge]] | 4 | criado |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/03-set-reconciliation-protocol.md` | `§2` | Fonte canônica — acrescentar wikilink `[[sync-dirigido-por-ucan]]` no título da seção |
| `rfc-transporte-p2p-v3.1.md` | `§2.7` | Substituir definição inline por referência `[[sync-dirigido-por-ucan]]`; manter o detalhe de enforcement bilateral como nota local |
