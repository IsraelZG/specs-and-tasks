---
title: "2PC com Lock TTL"
slug: 2pc-com-lock-ttl
aliases: ["2PC com Lock TTL", "Tier 2 transações multidomínio", "two-phase commit com TTL", "2PC Tier 2"]
tags: [protocol, transações, multidomínio, 2pc, asset-lock, ttl, isolamento, coordenador, v4]
modo: hub
fonte-canonica: docs/rfc-transacoes-multidominio.md §3
aparicoes-consolidadas:
  - glossary.md §2PC com Lock TTL (Tier 2)
dependencias:
  - [[asset-lock]]
  - [[ucan]]
  - [[linhagem-de-versoes]]
  - [[hlc]]
  - [[invariante-de-core]]
  - [[serialization-por-linhagem]]
  - [[saga]]
  - [[linhagem-de-coordenacao]]
  - [[validador-declarado]]
  - [[politica-de-ttl]]
---

# 2PC com Lock TTL

## Definição

**2PC com Lock TTL** (Tier 2 de transações multidomínio) é o protocolo commit em duas fases (prepare/commit) sobre `[[asset-lock]]`s temporizados, que oferece **isolamento de snapshot** para operações cross-domínio quando há coordenador confiável. O TTL resolve o bloqueio indefinido clássico do 2PC: a janela em-dúvida é delimitada pelo TTL, não indeterminada.

É o tier mais forte de isolamento da plataforma; o Tier 1 (sem coordenador, consistência eventual) é o [[saga]].

## Conteúdo normativo

O texto normativo completo — fases prepare/commit/abort, resolução do bloqueio clássico do 2PC via TTL, e definição do coordenador legítimo — está definido canonicamente em:

> `rfc-transacoes-multidominio.md §3` — Tier 2: 2PC com Locks TTL (Isolamento + Coordenador Confiável)

Para invariantes transversais de TTL (adjudicação pelo validador-dono da linhagem, corrida confirm-vs-expira) ver:

> `rfc-transacoes-multidominio.md §5.1` — Invariantes Transversais de TTL

Para políticas de TTL configuráveis (`fixed`, `per_leg`, `renewable_lease`, `risk_scaled`) ver verbete [[politica-de-ttl]].

## Resumo estrutural

### Fases do protocolo

| fase | mecanismo |
|:---|:---|
| **Prepare** | Cada domínio cria seu `[[asset-lock]]`, valida o efeito local, vota `commit` ou `abort`. |
| **Commit** | Se todos votarem commit, coordenador sinaliza e cada perna consome seu lock. |
| **Abort** | Se qualquer perna falha, coordenador sinaliza abort; todos os locks expiram via sinal (acelerado, não TTL). |

### Resolução do bloqueio clássico do 2PC

O problema clássico do 2PC é que um participante fica travado em `locked state` indefinidamente se o coordenador cai após o prepare. Nesta plataforma o TTL resolve:

- Locks permanecem vivos por seu TTL.
- Se o TTL expira sem commit explícito → abort automático via expiração.
- **Janela em-dúvida = TTL** (delimitada, não indefinida).

### Coordenador legítimo

O coordenador é o **validador declarado da [[linhagem-de-coordenacao]]** — a autoridade dona do contexto:

- Corporativo: back-office (servidor sempre vivo, relógio sincronizado).
- P2P: agente eleito temporariamente.

Não é um super peer contrabandeado: só faz liveness (decidir commit/abort); safety segue nos locks de cada domínio — cada perna valida sua [[serialization-por-linhagem]] independentemente.

### Diferença em relação ao Tier 1 (Saga)

| dimensão | [[saga]] (Tier 1) | 2PC com Lock TTL (Tier 2) |
|:---|:---|:---|
| Isolamento | Nenhum (consistência eventual) | Snapshot (todas as pernas ou nenhuma) |
| Coordenador | Não requerido | Requerido (validador declarado da linhagem) |
| Janela em-dúvida | Eventual (cada perna independente) | Delimitada pelo TTL |
| Abort | Via expiração natural de TTL | Via sinal do coordenador (acelerado) |
| Caso de uso | Default multidomínio | Quando isolamento de snapshot é obrigatório |

### Invariantes de TTL (resumo)

A expiração é adjudicada pelo **validador-dono da linhagem do lock** contra o relógio dele ([[hlc]]), não contra relógio global. O skew de relógio (limitado por `MAX_DRIFT`, `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.5.4`) pode exceder TTLs muito curtos.

Duas operações concorrentes na linhagem do lock — confirm e expire — serializam pela regra de linhagem v4 (`rfc-v4.md §2.3`): apenas uma finaliza.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§2PC com Lock TTL (Tier 2)` | Substituir por wikilink `[[2pc-com-lock-ttl]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[hlc]] | 1 | criado |
| [[ucan]] | 2 | criado |
| [[asset-lock]] | 3 | criado |
| [[invariante-de-core]] | 9 | criado |
| [[serialization-por-linhagem]] | 9 | criado |
| [[saga]] | 9 | criado |
| [[validador-declarado]] | 9 | placeholder (mesma onda) |
| [[linhagem-de-coordenacao]] | 9 | placeholder (mesma onda) |
| [[politica-de-ttl]] | 9 | placeholder (mesma onda) |


