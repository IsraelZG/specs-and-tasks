---
name: imutabilidade-dupla
title: "Imutabilidade Dupla"
aliases: ["duas camadas de imutabilidade", "Layer 1/Layer 2", "imutabilidade do registro", "imutabilidade da ordem"]
tags: [protocol, criptografia, linhagem, integridade]
---

# Imutabilidade Dupla

## Definição

Imutabilidade Dupla é o princípio que garante a integridade auditável de cada [[linhagem-de-versoes]] em dois níveis ortogonais e complementares:

1. **Layer 1 — Imutabilidade do Registro:** cada [[no]] e [[aresta]] individual recebe uma assinatura digital [[chave-mestra-ed25519]] cobrindo todos os seus campos planos e o payload cifrado. Qualquer adulteração de campo invalida a assinatura.

2. **Layer 2 — Imutabilidade da Ordem:** toda aresta [[mutates]] carrega um campo plano não cifrado `previous_hash`, que aponta para o hash da assinatura Ed25519 da aresta `MUTATES` anterior. Isso encadeia as assinaturas consecutivamente, tornando detectáveis em $O(1)$ — sem descriptografar payloads — qualquer remoção silenciosa de elo ou reordenação histórica.

Juntas, as duas camadas tornam qualquer falsificação, supressão ou reordenação de versões detectável sem acesso às chaves de conteúdo.

## Por quê

A Layer 1 sozinha protege cada versão individualmente, mas não impede que um peer mal-intencionado omita elos intermediários ou reordene a cadeia histórica. A Layer 2 fecha essa lacuna: adulterações na ordem quebram a cadeia de `previous_hash`, que é indexada e verificável sem custo de descriptografia. A justificativa de design completa está em **[[caderno-2-protocol/02-cryptographic-lineage-and-auth#3-2-duas-camadas-de-imutabilidade-linhagem-de-versoes]]**.

## Contrato

> O texto normativo completo — incluindo a semântica exata do `previous_hash`, a relação com [[hlc]] e as invariantes de validação na recepção — está em **[[caderno-2-protocol/02-cryptographic-lineage-and-auth#3-2-duas-camadas-de-imutabilidade-linhagem-de-versoes]]**. Não reproduzir aqui.

Pontos-chave:

- **`previous_hash`** reside exclusivamente na estrutura da aresta `MUTATES`; foi removido dos payloads dos nós-versão para evitar redundância e contaminação de escopo.
- **Auditoria topológica** em $O(1)$: o campo é coluna plana indexada — não exige descriptografar payloads.
- **Cobertura da assinatura**: `previous_hash` é coberto pela assinatura [[chave-mestra-ed25519]] do autor junto com todos os demais campos planos de `MUTATES`.

## Relações

- [[mutates]] — aresta que transporta o `previous_hash` da Layer 2.
- [[linhagem-de-versoes]] — sequência de nós-versão cuja integridade a imutabilidade dupla protege.
- [[head]] — ponta da linhagem; só é confiável porque nenhum elo pode ser removido silenciosamente.
- [[chave-mestra-ed25519]] — algoritmo de assinatura que realiza a Layer 1.
- [[hlc]] — ordenação causal estrita entre versões; complementa a Layer 2.
