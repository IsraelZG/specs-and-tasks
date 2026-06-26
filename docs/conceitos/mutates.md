---
name: mutates
title: "Aresta MUTATES"
aliases: ["MUTATES", "aresta de mutação", "versão anterior"]
tags: [protocol, ontologia, linhagem, arestas]
---

# Aresta MUTATES

## Definição

`MUTATES` é a única [[aresta]] que liga duas versões do mesmo [[no]]: aponta da **nova versão** para a **versão anterior**, formando a cadeia de linhagem. Além dos campos padrão de [[aresta]], carrega duas colunas exclusivas: `previous_hash` — comprometimento criptográfico com a assinatura da aresta `MUTATES` anterior, criando a segunda camada de imutabilidade — e [[hlc]], que garante ordenação causal estrita entre versões. Toda entidade cujo estado muda no sistema produz um novo nó conectado ao anterior por uma aresta `MUTATES`; nunca há `UPDATE` in-place.

## Por quê

Uma assinatura Ed25519 por nó protege a integridade de cada versão individualmente (Layer 1), mas não impede que um atacante remova silenciosamente um elo da história ou reordene versões. O `previous_hash` encadeia as assinaturas: adulterações ou omissões tornam-se detectáveis em $O(1)$ sem descriptografar payloads. A justificativa de design completa está em [[caderno-2-protocol/02-cryptographic-lineage-and-auth#32-duas-camadas-de-imutabilidade-linhagem-de-versões]].

## Contrato

> Os invariantes completos de integridade da cadeia — incluindo o que `previous_hash` aponta exatamente, as regras de validação de monotonicidade [[hlc]] e a detecção estrutural de fork — estão em **[[caderno-2-protocol/02-cryptographic-lineage-and-auth#32-duas-camadas-de-imutabilidade-linhagem-de-versões]]**. Não reproduzir aqui.

Resumo dos pontos-chave:

- **Direção:** `source_id` = nova versão → `target_id` = versão anterior.
- **`previous_hash`:** aponta para o hash da assinatura Ed25519 da aresta `MUTATES` anterior; coluna plana não cifrada, indexada — auditorias topológicas em $O(1)$ sem descriptografar payloads.
- **Monotonicidade:** `HLC(filho) > HLC(pai)` — violação → nó rejeitado como malformado.
- **Fork:** detectado estruturalmente quando duas ou mais arestas `MUTATES` ativas compartilham o mesmo `source_id` sem relação ancestral; resolução via nó de merge com 1 aresta `MUTATES` (continuação linear para o ancestral comum) + N arestas [[merges|`MERGES`]] (uma por ramo concorrente incorporado) — política completa em caderno-2/04 §4.2 e verbete [[fork-resolucao]].
- **Assinatura:** todos os campos planos de `MUTATES` (incluindo `previous_hash`) são cobertos pela assinatura [[chave-mestra-ed25519]] do autor.

## Implementação

O schema da tabela `edges` com a coluna `previous_hash BLOB` e o índice `idx_edges_previous_hash` estão em [[caderno-3-sdk/01-sqlite-and-projections-schema#1-schema-das-tabelas-replicáveis-nodes-e-edges]].

## Evolução

`MUTATES` é uma aresta estrutural primitiva; não admite especifiers nem subtipos. Alterações na semântica do `previous_hash` ou na política de merge de fork requerem RFC de protocolo com impacto em caderno-2/02 e caderno-2/04.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-3/01` | `§1` (DDL) | Manter DDL; adicionar "ver [[mutates]]" ao comentário conceitual |
| `caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§2.10.1` | Substituir redefinição semântica por `[[mutates]]` + link caderno-2/02 §3.2 |


