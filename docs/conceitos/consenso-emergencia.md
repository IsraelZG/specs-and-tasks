---
title: "Consenso de Emergência"
slug: consenso-emergencia
aliases: ["eleição de emergência", "eleição de emergência a 2/3", "quórum de emergência", "emergency consensus"]
tags: [governance, liveness, validadores, consenso, emergencia, v3.1-removido, v4]
modo: hub
fonte-canonica: docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4
aparicoes-consolidadas:
  - caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.6
dependencias:
  - [[tradeoff-liveness-validadores]]
  - [[morte-da-rede]]
  - [[congelamento-escopado]]
  - [[serialization-por-linhagem]]
  - [[rbsr]]
  - [[specification-network-governance]]
---

# Consenso de Emergência

## Definição

O **consenso de emergência** era o mecanismo da V3.1 pelo qual, na ausência dos validadores primários de uma rede, um conjunto alternativo de peers poderia assumir a validação de operações não-comutativas por meio de uma **eleição de emergência a 2/3** do quórum disponível.

Na **v4, esse mecanismo foi removido**. A justificativa normativa está em [[tradeoff-liveness-validadores]] e na fonte canônica abaixo.

## Conteúdo normativo

O raciocínio completo — incluindo por que a eleição de emergência a 2/3 é incompatível com o modelo append-only da plataforma, como o congelamento escopado por linhagem a substitui, e as propriedades de segurança resultantes — está definido canonicamente em:

> `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4` (Tradeoff de Liveness dos Validadores — Formalização)

A seção `caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.6` repete esse conteúdo; é aparição a consolidar (ver abaixo).

## Resumo estrutural

### Por que foi removido (v4)

O mecanismo de eleição de emergência a 2/3 foi **removido** na v4 porque reintroduziria **split-brain → double-spend**: se dois grupos independentes elegem validadores de emergência distintos sob partição de rede, ambos podem autorizar operações conflitantes na mesma linhagem não-comutativa, violando o [[invariante-de-core]].

A V3.1 formalizava a eleição de emergência apenas em [[caderno-4-governance/03-specification-lifecycle-and-rfcs]] §3.4 e na ex-RFC de transporte §4.6 (hoje [[caderno-5-transport/01-p2p-transport-and-reconciliation]]); não havia outra formalização.

### O que substitui

Em vez de eleger validadores de emergência, a v4 adota o **[[congelamento-escopado]]** por linhagem:

- Quando o validador/quórum de uma linhagem fica inalcançável, **apenas aquele ativo específico** entra em modo read-only.
- A rede como um todo continua operacional — operações comutativas (leitura, gossip, [[rbsr]], chats, rascunhos) funcionam independentemente de validadores.
- Não há eleição de substituto sem cerco (sem quórum); a linhagem permanece frozen até o validador original retornar.

A serialização por linhagem é formalizada em [[serialization-por-linhagem]] (Onda 9).

### Posição no modelo de governança

O cenário em que **todos** os validadores de uma linhagem se tornam permanentemente inacessíveis configura a [[morte-da-rede]] para aquele ativo — um estado previsto pela governança, não um defeito a mitigar. O mecanismo de consenso de emergência da V3.1 tentava evitar esse estado à custa de segurança; a v4 o aceita como consequência correta do design.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§4.6` (menciona remoção da eleição de emergência a 2/3) | Substituir por resumo + wikilink `[[consenso-emergencia]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[rbsr]] | 4 | criado |
| [[tradeoff-liveness-validadores]] | 8 | criado |
| [[specification-network-governance]] | 8 | criado |
| [[morte-da-rede]] | 8 | placeholder (mesma onda) |
| [[congelamento-escopado]] | 8 | placeholder (mesma onda) |
| [[serialization-por-linhagem]] | 9 | placeholder (onda futura) |
| [[invariante-de-core]] | 9 | placeholder (onda futura) |


