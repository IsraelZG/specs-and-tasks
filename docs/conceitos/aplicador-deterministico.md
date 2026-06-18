---
title: "Aplicador Determinístico"
slug: aplicador-deterministico
aliases: ["aplicador determinístico", "deterministic applier", "aprovador determinístico"]
tags: [protocol, serialização, linhagem, validadores, finalização, v4]
modo: hub
fonte-canonica: docs/rfc-v4.md §2.4, Apêndice B
aparicoes-consolidadas:
  - glossary.md §Aplicador Determinístico (v4)
  - caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5
dependencias:
  - [[serialization-por-linhagem]]
  - [[invariante-de-core]]
  - [[validador-declarado]]
  - [[linhagem-de-versoes]]
  - [[head]]
  - [[agente-de-sistema]]
---

# Aplicador Determinístico

## Definição

**Aplicador determinístico** é o aprovador de menor `entity_id` entre os membros do conjunto de validadores que cruzaram o limiar de quórum, e que materializa (escreve no grafo) a finalização de uma operação não-comutativa — evitando que múltiplos validadores finalizem a mesma operação em duplicado.

Definido canonicamente no Apêndice B da `rfc-v4.md`:

> **Aplicador Determinístico** — O aprovador de menor `entity_id` que materializa a finalização, evitando duplicação.

## Conteúdo normativo

O texto normativo completo — fluxo de aprovação, regras de serialização, âncora por `head`, evidência inline e comportamento sob aprovação assíncrona (K>1) — está em:

> `rfc-v4.md §2.4` — *Fluxo de Aprovação de Operação Não-Comutativa (Consolidado)*

A seção `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5` reforça o mesmo princípio no contexto de governança. Leia as fontes diretamente para regras normativas.

## Resumo estrutural

### Problema que resolve

Sob aprovação assíncrona com K>1, vários validadores podem detectar independentemente que o limiar de quórum foi cruzado e tentar finalizar a mesma operação — gerando intents conflitantes e forks. O mecanismo "o N-ésimo a finalizar vence" é não-determinístico e inseguro.

Conforme `rfc-v4.md §2.4`, regra 5:

> Finalização pelo aplicador determinístico, não "o N-ésimo". Sob aprovação assíncrona com K>1, vários validadores podem achar que cruzaram o limiar e finalizar em duplicado → fork. O aplicador é determinístico (menor `entity_id` entre os aprovadores).

### Relação com o validador declarado

O [[validador-declarado]] define *quem pode aprovar*; o aplicador determinístico define *quem materializa* após o limiar ser atingido. São dois papéis distintos:

1. Os K validadores do conjunto declarado emitem suas aprovações (`APPROVES`).
2. O aprovador de menor `entity_id` entre os que completaram o quórum executa a finalização — criando os nós `MUTATES`, `TRANSFERS` e demais arestas duráveis no grafo.

### Relação com a invariante de core

O aplicador determinístico é o mecanismo de implementação que faz a [[invariante-de-core]] ser enforçada na prática sob quórum assíncrono. A invariante ("duas escritas conflitantes na mesma linhagem não-comutativa não podem ambas finalizar") seria violável se qualquer validador pudesse materializar — o critério de menor `entity_id` colapsa o conjunto de candidatos a um único executor por operação.

Ver também [[serialization-por-linhagem]] para o contexto mais amplo de como a serialização por linhagem sustenta a invariante.

### Comportamento no threat model

Conforme `rfc-v4.md §5.1`:

> **Validador finaliza em duplicado** → Aplicador determinístico (não "o N-ésimo") ✅ Total

### Papel no fluxo de aprovação (referência)

O fluxo completo está em `rfc-v4.md §2.4`. Em resumo:

- `CONTENT:INTENT` ancora a operação via `SPENDS → head` (âncora de serialização).
- K validadores emitem `APPROVES → CONTENT:INTENT`.
- O aprovador de menor `entity_id` cria os nós de resultado (`MUTATES`, `TRANSFERS`).
- Canal efêmero coordena os validadores; apenas a estrutura acima é durável no grafo.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Aplicador Determinístico (v4)` | Substituir por resumo + wikilink `[[aplicador-deterministico]]` |
| `caderno-4-governance/03-specification-lifecycle-and-rfcs.md` | `§3.5` | Substituir referência local por wikilink `[[aplicador-deterministico]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[head]] | 1 | criado |
| [[invariante-de-core]] | 9 | criado |
| [[serialization-por-linhagem]] | 9 | criado |
| [[validador-declarado]] | 9 | criado |
| [[agente-de-sistema]] | 10 | placeholder (onda 10) |


