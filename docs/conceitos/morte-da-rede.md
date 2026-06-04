---
title: "Morte da Rede"
slug: morte-da-rede
aliases: ["morte natural da rede", "network death", "paralisia natural"]
tags: [governance, liveness, validadores, rede, fisica, hub]
modo: hub
fonte-canonica: docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.3
aparicoes-consolidadas:
  - rfc-transporte-p2p-v3.1.md §4.6
dependencias:
  - [[specification-network-governance]]
  - [[tradeoff-liveness-validadores]]
  - [[consenso-emergencia]]
  - [[congelamento-escopado]]
  - [[rbsr]]
---

# Morte da Rede

## Definição

**Morte da rede** é o estado em que todos os validadores autorizados de uma rede ficam permanentemente offline, tornando as operações não-comutativas (transferências de saldo, decremento de estoque, emissão de permissões) impossíveis de validar. A rede entra em modo read-only por **leis físicas de design** — sem código específico de desativação.

Operações comutativas (leitura, gossip, [[rbsr]], chats, rascunhos) continuam operando normalmente entre os peers ativos.

## Conteúdo normativo

O texto normativo completo — incluindo a mecânica de paralisia natural, a distinção entre operações comutativas e não-comutativas sob ausência de validadores, e a reconciliação de forks nesse estado — está definido canonicamente em:

> `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.3` (Morte da Rede por Leis da Física)

A seção `rfc-transporte-p2p-v3.1.md §4.6` menciona o conceito no contexto do tradeoff de liveness; é aparição a consolidar (ver abaixo).

## Resumo estrutural

### Característica de design, não defeito

A morte da rede é **intencional e defensável** — documentada como propriedade, não tratada como defeito a mitigar. A plataforma não exige código específico para desativar redes: se os validadores autorizados ficam permanentemente offline, a ausência de assinaturas legítimas impede operações não-comutativas por construção.

### Distinção de operações sob morte da rede

| tipo de operação | comportamento |
|:---|:---|
| Comutativas (leitura, gossip, RBSR, chats, rascunhos) | Continuam entre peers ativos |
| Não-comutativas (saldo, estoque, permissões) | Falham por falta de assinaturas legítimas |
| Detecção de forks (estrutural, via RBSR) | Continua operacional |
| Resolução de forks (criação de nó de merge) | Suspensa até retorno de validador |

### Relação com congelamento escopado (v4)

Na v4, o [[congelamento-escopado]] por linhagem torna a morte da rede mais granular: um ativo cuja linhagem perdeu todos os validadores entra em modo read-only escopado, sem afetar linhagens cujos validadores estão alcançáveis. O cenário de extinção total de validadores de **toda** a rede é a morte da rede em sentido pleno.

### Validadores não são SPOF

Validadores são um conjunto K-de-N de entidades independentes. A liveness exige apenas **1** online, não todos. A morte da rede ocorre apenas quando **nenhum** validador do conjunto declarado está disponível — cenário que a governança aceita como consequência correta do design, e que o [[consenso-emergencia]] da V3.1 tentava (incorretamente) evitar.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `rfc-transporte-p2p-v3.1.md` | `§4.6` (menciona "morte natural da rede" no contexto de tradeoff de liveness) | Substituir menção por wikilink `[[morte-da-rede]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[rbsr]] | 4 | criado |
| [[specification-network-governance]] | 8 | criado |
| [[tradeoff-liveness-validadores]] | 8 | criado |
| [[consenso-emergencia]] | 8 | criado |
| [[congelamento-escopado]] | 8 | placeholder (mesma onda) |
| [[serialization-por-linhagem]] | 9 | placeholder (onda futura) |
