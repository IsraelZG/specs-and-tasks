---
title: "Tradeoff de Liveness dos Validadores"
slug: tradeoff-liveness-validadores
aliases: ["liveness dos validadores", "tradeoff liveness", "liveness-safety tradeoff", "freeze por linhagem"]
tags: [governance, liveness, validadores, safety, linhagem, congelamento]
modo: hub
fonte-canonica: docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4
aparicoes-consolidadas:
  - caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.6
dependencias:
  - [[morte-da-rede]]
  - [[congelamento-escopado]]
  - [[consenso-emergencia]]
  - [[rbsr]]
  - [[serialization-por-linhagem]]
  - [[invariante-de-core]]
  - [[specification-network-governance]]
---

# Tradeoff de Liveness dos Validadores

## Definição

O **tradeoff de liveness dos validadores** é a propriedade intencional e defensável pela qual operações não-comutativas (transferências de saldo, emissão de permissões, alterações de especificação) dependem de ao menos um validador do conjunto K-de-N declarado estar alcançável — enquanto operações comutativas (leitura, gossip, RBSR, navegação, chats, rascunhos) funcionam de forma totalmente independente de validadores.

Quando o validador responsável por uma linhagem fica inalcançável, **apenas aquela linhagem congela** (ver [[congelamento-escopado]]); a rede como um todo continua operacional. O freeze é um *freeze* seguro — não um *crash*.

## Conteúdo normativo

O texto normativo completo — incluindo as três propriedades (comutativas livres, não-comutativas por linhagem, segurança do freeze), o esclarecimento sobre o "SPOF", a reconciliação de forks sob ausência de validadores, e a atualização v4 — está definido canonicamente em:

> `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4` (Tradeoff de Liveness dos Validadores — Formalização)

A seção `caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.6` repete esse conteúdo quase literalmente; é aparição a consolidar (ver tabela abaixo). Leia a fonte canônica diretamente para regras normativas.

## Resumo estrutural

### As três propriedades

| tipo de operação | dependência de validador | comportamento sob ausência |
|:---|:---|:---|
| Comutativas (leitura, gossip, [[rbsr]], chats, rascunhos) | nenhuma | continuam normalmente |
| Não-comutativas (débito, emissão de permissão, mutação de SPEC) | validador da linhagem | apenas aquela linhagem congela (read-only escopado) |
| Segurança do estado | nenhuma | freeze não corrompe dados, não permite operações inválidas, não perde auditabilidade |

### Por que é intencional

A degradação para read-only por linhagem é **documentada como propriedade de segurança**, não tratada como defeito a mitigar. Redes alvo: corporativas, financeiras e reguladas, onde auditabilidade e integridade importam mais que disponibilidade transacional de 100% em cenário de desastre.

### Esclarecimento sobre "SPOF"

Validadores **não** são uma unidade singular. A arquitetura especifica um conjunto K-de-N de entidades independentes (Super Peers, Cloud, Desktops de alta disponibilidade). A liveness exige apenas **1** online, não todos. O cenário de extinção total dos validadores é, por definição, a [[morte-da-rede]] prevista na governança.

### Atualização v4 — congelamento escopado por linhagem

Na v4, a liveness não-comutativa passa a ser **por linhagem** (serialização em [[serialization-por-linhagem]]). Sob ausência do validador/quórum de uma linhagem, **só aquele ativo congela** — não a rede inteira. A eleição de emergência a 2/3 da V3.1 é **removida**, pois reintroduziria split-brain → double-spend. Ver [[congelamento-escopado]] e [[consenso-emergencia]].

### Reconciliação de forks sob ausência de validadores

O protocolo [[rbsr]] detecta e registra forks estruturalmente mesmo sem validadores. Contudo, o **merge** (criação do nó de resolução) exige ao menos um peer capaz de executar a operação de committer. Sem validadores disponíveis, os forks ficam registrados mas **não resolvidos** até que um validador retorne — consistente com o tradeoff: operações comutativas (RBSR, leitura, detecção) progridem; operações não-comutativas (merge de fork), não.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§4.6` (tríade de liveness quase literal) | Substituir por resumo + wikilink `[[tradeoff-liveness-validadores]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[rbsr]] | 4 | criado |
| [[specification-network-governance]] | 8 | criado (mesma onda) |
| [[morte-da-rede]] | 8 | placeholder (mesma onda) |
| [[congelamento-escopado]] | 8 | placeholder (mesma onda) |
| [[consenso-emergencia]] | 8 | placeholder (mesma onda) |
| [[serialization-por-linhagem]] | 9 | placeholder (onda futura) |
| [[invariante-de-core]] | 9 | placeholder (onda futura) |


