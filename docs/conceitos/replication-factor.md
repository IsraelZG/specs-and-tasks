---
title: Replication Factor
slug: replication-factor
aliases: ["replication factor", "fator de replicação", "N (replication)"]
tags: [protocol, sincronizacao, replicacao, disponibilidade, p2p]
modo: hub
fonte-canonica: docs/caderno-2-protocol/03-set-reconciliation-protocol.md §3.1
aparicoes-consolidadas:
  - rfc-transporte-p2p-v3.1.md §4.2.1
dependencias:
  - [[anti-entropy]]
  - [[rbsr]]
  - [[onda]]
  - [[consistent-hashing]]
  - [[poda-segura]]
---

# Replication Factor

Parâmetro $N$ que define o número mínimo de dispositivos que devem manter um nó ou aresta em estado **Integral** para que o dado seja considerado seguro contra perda na rede. O valor padrão é $N = 3$.

A definição normativa completa está em **`caderno-2-protocol/03-set-reconciliation-protocol.md §3`**.

## Papel por modalidade de rede

O replication factor é aplicado de forma diferente conforme a [[modalidade-de-rede]]:

| Modalidade | Estratégia |
|:-----------|:-----------|
| **P2P Puro** | Gossip: cada peer verifica via PING se $\ge N-1$ peers possuem o dado íntegro antes de podar. A custódia primária de cada chunk é eleita por [[consistent-hashing]]. |
| **Corporativa** | Super Peer garante 100% do grafo em estado Integral; dispositivos menores recebem autorização de poda via Manifesto de Retenção. |
| **Pública** | Sharding determinístico por [[consistent-hashing]]; o peer de sistema mantém o grafo íntegro como fallback definitivo de bootstrap. |

## Gossip de poda (P2P Puro)

O protocolo de gossip é o mecanismo de enforcement do replication factor em modo P2P. Antes de um peer executar a transição Integral → Podado:

1. O peer envia `PING` aos $N-1$ peers que devem possuir o dado.
2. Se menos de $N-1$ peers respondem confirmando posse em estado Integral → **poda adiada** (redução de rede detectada).
3. O custódio primário só poda após receber `ACK` do próximo peer no anel (protocolo `RELEASE/ACK` descrito em [[poda-segura]]).

> Para a mecânica completa do protocolo de poda segura com jitter e RELEASE/ACK, ver `rfc-transporte-p2p-v3.1.md §4.3` ([[poda-segura]]).

## Interação com o G4 e tier-aware degradation

O Garbage Collector G4 (ver `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §4`) pausa a poda automaticamente quando o dispositivo entra em modo de economia de energia: em baixa bateria o mobile limita conexões WebRTC a no máximo 2 peers, insuficiente para atingir o quórum de $N-1 = 2$ necessário ao gossip com $N=3$.

## Ver também

- [[anti-entropy]] — Onda 0; verifica se há divergência antes de qualquer replicação
- [[consistent-hashing]] — elege os custodiantes responsáveis por cada chunk
- [[poda-segura]] — protocolo de três camadas (jitter + RELEASE/ACK + health-check) que garante a invariante $N$
- [[rbsr]] — reconciliação que redistribui dados entre peers para restaurar o fator

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[anti-entropy]] | 4 | criado |
| [[rbsr]] | 4 | criado |
| [[onda]] | 4 | criado |
| [[consistent-hashing]] | 4 | placeholder |
| [[poda-segura]] | 4 | placeholder |
| [[modalidade-de-rede]] | 12 | placeholder |


