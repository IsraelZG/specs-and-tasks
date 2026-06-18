---
name: asset-consent
title: "ASSET:CONSENT"
aliases: ["ASSET:CONSENT", "consentimento", "consentimento LGPD", "consentimento GDPR"]
tags: [protocol, acesso, ontologia, lgpd, compliance]
---

# ASSET:CONSENT

## Definição

`ASSET:CONSENT` é um subtipo de [[asset]] que representa uma **declaração de consentimento para processamento de dados pessoais**, conforme exigido pela LGPD (art. 18) e pelo GDPR. É uma primitiva de primeira classe no grafo: o consentimento não é uma configuração implícita em código — é um **nó físico, auditável e inalterável**.

O nó registra de forma granular:
- a **finalidade** do processamento consignada;
- a **data de concessão**;
- a **chave pública do emitente** (o titular dos dados);
- e admite **revogação instantânea** via nova versão assinada pelo titular.

A lente jurídica completa — papéis de controlador/operador por modalidade de rede, direitos de portabilidade, deleção e o procedimento de expurgo LGPD — está em **[[caderno-1-vision/03-legal-and-compliance-framework#21-consentimento-de-primeira-classe-assetconsent]]**.

## Invariantes Ontológicas

Seguindo o [[substantivo-verbo-principio]]:

- O **ato de consentir** é uma **aresta** (`GRANTED_TO`), não um nó.
- O **nó** `ASSET:CONSENT` é a **declaração** — o objeto do direito concedido.
- A revogação é uma nova versão do nó (linhagem normal do [[no]]) com `weight = 0` (lápide), nunca uma mutação do registro original — preservando [[imutabilidade-dupla]].

## Comportamento

- Concedido via aresta `GRANTED_TO` apontando do `ASSET:CONSENT` para o `PROFILE` beneficiado.
- Referenciado por `SPECIFICATION`s de conformidade que bloqueiam a deleção de dados protegidos por obrigação legal (ver `caderno-1/03 §2.3`).
- A revogação dispara, indiretamente, o procedimento de rotação de épocas ([[rotacao-de-epocas]]) quando associada ao expurgo de dados.

## Critérios de Minimalismo (§4 da Ontologia)

`ASSET:CONSENT` satisfaz os quatro critérios do [[minimalismo-ontologico]] para existir como subtipo distinto:

1. **Comportamento sistêmico diferenciado**: sujeito a regras de auditoria regulatória que não se aplicam a `ASSET:PERMISSION` ou `ASSET:ROLE`.
2. **Irredutível por payload**: a semântica legal de finalidade/revogação exige tratamento estrutural próprio.
3. **Aresta exclusiva**: `GRANTED_TO` é o verbo semântico específico desta relação (diferente de `DELEGATED_TO` de permissões).
4. **Reusabilidade multidomínio**: obrigatório em qualquer modalidade de rede (pública, whitelabel ou P2P pura).

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[asset]] | 1 | criado |
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[imutabilidade-dupla]] | 1.5 | criado |
| [[rotacao-de-epocas]] | 2 | criado |
| `ASSET:PERMISSION` / [[asset-permission]] | 2 | criado |
| `minimalismo-ontologico` / [[minimalismo-ontologico]] | futura | placeholder |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§3.3` | Substituir definição por `[[asset-consent]]` |
| `caderno-1-vision/03-legal-and-compliance-framework.md` | `§2.1` | Lente LGPD — manter texto normativo; adicionar wikilink de retorno para este verbete |


