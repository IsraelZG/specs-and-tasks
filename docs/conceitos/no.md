---
name: no
title: "Nó (Node)"
aliases: ["node", "nodo", "nó do grafo", "vertex"]
tags: [protocol, ontologia, graph]
---

# Nó (Node)

## Definição

Um Nó é a unidade atômica imutável do grafo: representa uma versão de uma entidade. Cada nó carrega um identificador de versão [[id]] único e imutável; versões sucessivas da mesma entidade são encadeadas por arestas [[mutates]] que preservam o [[entity-id]] constante ao longo da linhagem. Nós são sempre substantivos — nunca verbos (ver [[substantivo-verbo-principio]]). A plataforma reconhece exatamente quatro tipos-raiz: [[profile]], [[content]], [[asset]] e [[specification]]. Não existe tipo `EVENT`.

## Por quê

A escolha de quatro tipos fixos aplica o critério de minimalismo ontológico: qualquer entidade nova que não satisfaça os quatro critérios de diferenciação (comportamento sistêmico distinto, irredutível a payload + SPECIFICATION, arestas exclusivas, reusabilidade multidomínio) é um subtipo ou um conceito de negócio governado por `SPECIFICATION`, não um novo tipo de nó. Isso mantém o grafo como uma linguagem formal interoperável entre domínios.

A ausência de `EVENT` é deliberada: eventos consolidados são nós-versão conectados por arestas relacionais; intenções de ação são `CONTENT:INTENT`.

## Contrato

O texto autoritativo dos quatro tipos e dos critérios de minimalismo está em [[caderno-2-protocol/01-graph-ontology#3-os-quatro-tipos-de-nós]].

Propriedades estruturais comuns a todos os nós:

- **`id`** — [[id]] ULID da versão (11º char `N`); identifica esta versão exata e imutável.
- **`entity_id`** — [[entity-id]] ULID da linhagem; constante em todas as versões do mesmo nó-entidade.
- **`type`** — string `TIPO:SUBTIPO` (ex.: `PROFILE:PERSONA`, `CONTENT:DOCUMENT`).
- **`hlc`** — carimbo [[hlc]] que garante ordenação causal; base para seleção de head.
- **`signature`** — assinatura [[chave-mestra-ed25519]] cobrindo todos os campos planos + payload cifrado.
- **`epoch`** — referência à [[chave-de-epoca]] que protege o payload.
- **Imutabilidade:** nós são append-only; "editar" uma entidade = emitir um novo nó com nova versão ligada por [[mutates]].

Os quatro tipos-raiz e seus papéis:

| tipo | verbete canônico | papel |
|:---|:---|:---|
| `PROFILE` | [[profile]] | Ator ativo com identidade criptográfica |
| `CONTENT` | [[content]] | Informação estruturada passiva e versionada |
| `ASSET` | [[asset]] | Recurso finito, direito, saldo ou autorização |
| `SPECIFICATION` | [[specification]] | Contrato formal que governa schemas e comportamento |

## Implementação

O schema físico da tabela `nodes` (com `id`, `entity_id`, `type`, `hlc`, `signature`, `epoch`, `payload`) está em [[caderno-3-sdk/01-sqlite-and-projections-schema#1-schema-das-tabelas-replicáveis-nodes-e-edges]].

## Evolução

Novos tipos-raiz requerem RFC de ontologia que demonstre falha nos quatro critérios de minimalismo (§4 do caderno-2/01). Novos subtipos dentro de um tipo-raiz existente têm custo menor de aprovação, desde que satisfaçam ao menos o critério de diferenciação de comportamento sistêmico.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Nó (Node)` | Substituir pelo wikilink `[[no]]` |


