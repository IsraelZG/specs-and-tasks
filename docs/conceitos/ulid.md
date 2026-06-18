---
name: ulid
title: "ULID (Universally Unique Lexicographically Sortable Identifier)"
aliases: ["Universally Unique Lexicographically Sortable Identifier", "ULID"]
tags: [protocol, identificadores]
---

# ULID (Universally Unique Lexicographically Sortable Identifier)

## Definição

ULID é o identificador primário de todos os nós e arestas da plataforma: um valor de 128 bits encodado em Crockford Base32 (26 caracteres, case-insensitive) composto por 48 bits de timestamp em milissegundos seguidos de 80 bits aleatórios. A ordenação lexicográfica de strings ULID é idêntica à ordenação temporal, o que permite range-scans eficientes por tempo de criação sem índice secundário. Por ser gerado localmente com entropia suficiente para unicidade prática (2⁸⁰ por milissegundo), não requer coordenação central — adequado ao modelo local-first e P2P da plataforma.

## Por quê

O sistema cria entidades em múltiplos peers sem coordenação. UUIDs v4 puros são aleatórios e não ordenam por tempo; timestamps sozinhos colidem. O ULID combina os dois requisitos: unicidade distribuída + ordenação lexicográfica que preserva a ordem de inserção, útil para cursores de paginação e para o campo `entity_id` que agrupa todas as versões de uma entidade sob a mesma linhagem.

## Contrato

- **Estrutura:** `[48 bits timestamp ms][80 bits random]` → 26 chars Crockford Base32.
- **Ordenação:** strings ULID ordenam lexicograficamente na mesma ordem que o timestamp de criação.
- **Unicidade:** colisão requer dois IDs gerados no mesmo milissegundo com os mesmos 80 bits aleatórios — probabilidade negligenciável sem coordenação.
- **Encoding de tipo ([[vfk|VFK]]):** a plataforma reserva o 11º caractere (index 10, imediatamente após os 48 bits de timestamp) como discriminador de tabela: `N` → `nodes`, `E` → `edges`. Isso permite resolver Virtual Foreign Keys polimórficas em `O(1)` sem consulta extra. Detalhes em [[caderno-3-sdk/01-sqlite-and-projections-schema#21-virtual-foreign-keys-vfk-por-bitmasking-de-caractere]].

## Implementação

O campo `id` em `nodes` e `edges` é `TEXT PRIMARY KEY` com ULID. Mantido como TEXT (não BLOB) porque a ordenação lexicográfica e a inspeção do 11º caractere para VFK dependem da representação em string. Ver schema completo em [[caderno-3-sdk/01-sqlite-and-projections-schema#1-schema-das-tabelas-replicáveis-nodes-e-edges]].

## Evolução

O formato ULID 128 bits é estável. A convenção do 11º caractere como discriminador de tipo é uma extensão da plataforma sobre o spec padrão; qualquer novo tipo de tabela replicável precisaria reservar um caractere distinto via RFC de schema.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§ULID` | Substituir o corpo pelo wikilink `[[ulid]]` |


