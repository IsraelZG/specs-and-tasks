---
name: asset-role
title: "ASSET:ROLE"
aliases: ["ASSET:ROLE", "papel de negócio", "cargo organizacional", "role"]
tags: [protocol, acesso, ontologia]
---

# ASSET:ROLE

## Definição

`ASSET:ROLE` é um subtipo de [[asset]] que representa um **papel ou função de negócio** no sistema. Não é uma permissão atômica em si, mas um agrupamento lógico: conecta múltiplos nós [[asset-permission]] através de arestas estruturais `AGGREGATES`, compondo um conjunto coerente de direitos de acesso. A definição normativa completa — incluindo a invariante de validação de traversal profundo, a semântica dos templates vs. instanciação física e a separação entre fatos sociais e autorizações técnicas — está em **[[caderno-2-protocol/02-cryptographic-lineage-and-auth#2-1-asset-permission-e-asset-role]]**.

## Estrutura

- Um `ASSET:ROLE` **agrega** `ASSET:PERMISSION` via arestas `AGGREGATES` (que apontam para o `entity_id` estável das permissões).
- Permissões dentro do papel podem relacionar-se entre si via arestas `REQUIRES`, modelando pré-requisitos lógicos.
- O papel é um nó físico no banco — **não um campo de string** numa tabela de usuários. O sistema de validação de acesso consulta o DAG físico, nunca o payload de `SPECIFICATION` (blueprints).

## Uso: Delegação de Persona Corporativa

Um caso normativo direto de `ASSET:ROLE` é a delegação de cargo em redes corporativas (ver `caderno-2/02 §1.5`):

1. A `PROFILE:ORGANIZATION` cria o `PROFILE:PERSONA` do cargo e emite um `ASSET:ROLE` associado.
2. Uma aresta `DELEGATED_TO` aponta o asset para a chave `PROFILE:AUTHENTICATION` do funcionário.
3. Ao desligar o funcionário, a empresa revoga o asset (aresta lápide com `weight = 0`). A persona e o histórico permanecem sob propriedade institucional.

## Templates vs. Instâncias Físicas

> [!IMPORTANT]
> Moldes de papéis residem em `SPECIFICATION` (propriedade `role_templates`) e funcionam como **blueprint** de bootstrap. Para fins de validação de acesso e controle de segurança, o sistema consulta **exclusivamente os nós físicos** `ASSET:ROLE` e `ASSET:PERMISSION` e o DAG de arestas `AGGREGATES`/`REQUIRES` no banco de dados.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[asset]] | 1 | criado |
| [[asset-permission]] | 2 | criado |
| [[aresta]] | 1 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| `UCAN` / [[ucan]] | 2 | <!-- TODO(revisar): verbete ucan ainda não criado — placeholder Onda 2 --> |
| `ASSET:CONSENT` / [[asset-consent]] | 2 | placeholder Onda 2 |
| `ASSET:LOCK` / [[asset-lock]] | 3 | placeholder Onda 3 |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§ASSET:ROLE` | Substituir definição por `[[asset-role]]` |
| `caderno-2-protocol/01-graph-ontology.md` | `§3.3` | Substituir definição por `[[asset-role]]`; manter exemplos de arestas |
| `caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | `§2.1` | Fonte canônica normativa — manter; adicionar wikilink de retorno |
