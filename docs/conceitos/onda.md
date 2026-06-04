---
title: Onda (Wave)
slug: onda
aliases: ["Wave", "Onda de sincronização", "pipeline de ondas"]
tags: [protocol, sincronizacao, reconciliacao, sync-worker]
modo: hub
fonte-canonica: docs/caderno-2-protocol/03-set-reconciliation-protocol.md §4
aparicoes-consolidadas:
  - glossary.md §Onda
  - caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §3
  - rfc-transporte-p2p-v3.1.md §2.8
dependencias:
  - [[rbsr]]
  - [[anti-entropy]]
  - [[fingerprint]]
  - [[sync-worker]]
  - [[graph-based-routing]]
  - [[snapshot-de-bootstrap]]
---

# Onda (Wave)

Fase numerada do pipeline de sincronização executado pelo [[sync-worker]] em cada conexão a um swarm. A sequência de ondas garante que a UI fique utilizável em segundos, diferindo transferências pesadas para fases posteriores.

A definição normativa completa — incluindo a tabela de ondas, a meta de 100 ms da Onda 0 e o vínculo com o [[rbsr]] — está em **[[caderno-2-protocol/03-set-reconciliation-protocol|caderno-2/03 §4]]**.

## Resumo das quatro ondas

| Onda | Nome | Conteúdo | Meta de tempo |
|:-----|:-----|:---------|:--------------|
| **0** | Bootstrap / Anti-Entropy | Apenas troca do root fingerprint (`F[-∞,+∞]`). Se coincidir, a sessão encerra em $O(1)$ sem dados adicionais. | < 100 ms (malha quente); segundos em *cold start* |
| **1** | Prioritária | Cabeçalhos críticos e nós ligados à tela ativa do usuário. | Interativa (bloqueante para renderização) |
| **2** | Background | B-Tree completa e histórico profundo em estado **podado** (IDs, assinaturas, arestas; sem payloads pesados). | Background, não bloqueante |
| **3** | Lazy / BLOBs | Reidratação sob demanda de payloads e anexos multimídia pesados via WebTorrent / [[graph-based-routing]]. | Lazy, disparado pelo contexto de visualização |

> A meta de 100 ms da Onda 0 vale apenas para o *resume* com malha já formada. No *cold start* (lookup DHT + travessia de NAT + handshake TLS) o custo é de segundos — a Onda 0 mede apenas o RTT do fingerprint após o canal estar estabelecido. Fonte: [[caderno-2-protocol/03-set-reconciliation-protocol|caderno-2/03 §4]].

## Relação com outras primitivas

- **[[anti-entropy]]** — a Onda 0 é o mecanismo de anti-entropy $O(1)$: se os [[fingerprint|fingerprints]] coincidem, nenhum dado adicional é transferido.
- **[[rbsr]]** — as Ondas 1 e 2 executam o protocolo Range-Based Set Reconciliation sobre o subgrafo autorizado pelo [[ucan]] ativo.
- **[[snapshot-de-bootstrap]]** — alternativa ao ciclo completo de ondas no primeiro onboarding: o Sync Worker baixa o snapshot (estado podado) e usa as Ondas 2/3 apenas para reidratação incremental.
- **[[graph-based-routing]]** — acionado na Onda 3 para localizar peers custodians dos payloads pesados.

## Notas sobre lentes

- **caderno-3/02 §3** descreve o pipeline de ondas do ponto de vista do SDK (Sync Worker), com nomes ligeiramente diferentes para as ondas 0–3 e foco em mobile/bateria. O conteúdo é complementar, não conflitante; veja [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle|caderno-3/02 §3]] para detalhes de agendamento oportunístico.
- **rfc §2.8** repete a tabela de ondas quase verbatim em relação a caderno-2/03. Não há divergência normativa; a RFC é a perspectiva de transporte P2P.

## Ver também

- [[rbsr]] — protocolo de reconciliação que opera nas Ondas 1 e 2
- [[anti-entropy]] — mecanismo $O(1)$ da Onda 0
- [[fingerprint]] — hash de range trocado na Onda 0
- [[nonce-challenge]] — rodada de desafio acionada quando um [[range-footer]] falha
- [[sync-worker]] — executor do pipeline de ondas
- [[snapshot-de-bootstrap]] — atalho de bootstrap para novos peers
