---
name: aresta
title: "Aresta (Edge)"
aliases: ["edge", "vínculo", "relacionamento"]
tags: [protocol, ontologia, graph]
---

# Aresta (Edge)

## Definição

Uma Aresta é a estrutura que representa uma relação ou ação entre dois [[no]]s no grafo: uma tripla `(source_id, verb, target_id)` onde o verbo define a semântica do relacionamento. Arestas são sempre verbos — nunca substantivos (ver [[substantivo-verbo-principio]]). Arestas de alto grau semântico seguem o padrão formal `VERBO:DOMÍNIO:SPECIFIER`; arestas estruturais e de linhagem (ex.: `MUTATES`, `AGGREGATES`, `REQUIRES`) são verbos simples. A gramática completa dos verbos disponíveis está em [[verbos-raiz-canonicos]].

## Por quê

Separar entidades (nós) de relações (arestas) é a garantia de que o modelo permaneça ortogonal e extensível: adicionar uma nova relação entre entidades existentes não requer criar um novo tipo de nó. O princípio "nós são substantivos, arestas são verbos" elimina tipos ambíguos como `EVENT` e mantém o grafo como uma linguagem formal consistente entre domínios.

## Contrato

O texto autoritativo está em [[caderno-2-protocol/01-graph-ontology#2-convenção-de-nomenclatura-de-arestas]].

Propriedades-chave:

- **Estrutura mínima:** `(source_id, type, target_id)` + campos de linhagem (`id`, `entity_id`, `hlc`, `signature`, `epoch`).
- **Padrão de nomenclatura:** `VERBO:DOMÍNIO:SPECIFIER` — `VERBO` é a raiz verbal presente, `DOMÍNIO` é a categoria ontológica, `SPECIFIER` é o refinamento opcional.
- **Verbos raiz aceitos:** ver [[verbos-raiz-canonicos]]. Verbos fora deste conjunto requerem RFC.
- **Polimorfismo de alvo:** `target_id` pode apontar para um nó (`nodes.id`, 11º char `N`) ou para outra aresta (`edges.id`, 11º char `E`) — resolvido via [[vfk|Virtual Foreign Key]]; ver [[ulid]].
- **Imutabilidade:** arestas são append-only; "remover" uma relação equivale a criar uma aresta de encerramento (`RESOLVES`, `REVOKED_BY`) ou marcar `active = 0`.
- **Assinatura:** todos os campos planos e o payload cifrado são cobertos pela assinatura [[chave-mestra-ed25519]] do autor.

## Implementação

O schema físico da tabela `edges` (com `id`, `entity_id`, `source_id`, `target_id`, `type`, `hlc`, `signature`, `active`) está em [[caderno-3-sdk/01-sqlite-and-projections-schema#1-schema-das-tabelas-replicáveis-nodes-e-edges]].

## Evolução

Novos tipos de aresta são adicionados via RFC de ontologia. A convenção `VERBO:DOMÍNIO:SPECIFIER` e a lista de verbos raiz são o ponto de estabilidade; especifiers novos dentro de verbos raiz existentes têm custo menor de aprovação.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Aresta` | Substituir pelo wikilink `[[aresta]]` |


