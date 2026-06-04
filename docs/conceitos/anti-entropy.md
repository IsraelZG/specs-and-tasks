---
title: Anti-Entropy O(1)
slug: anti-entropy
aliases: ["Anti-Entropy", "anti-entropy O(1)", "Bootstrap / Anti-Entropy"]
tags: [protocol, sincronizacao, reconciliacao, sync-worker, onda]
modo: hub
fonte-canonica: docs/caderno-2-protocol/03-set-reconciliation-protocol.md §1.1, §4
aparicoes-consolidadas:
  - glossary.md §Anti-Entropy O(1)
  - caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §3.1
  - rfc-transporte-p2p-v3.1.md §2.8 e Apêndice B
dependencias:
  - [[rbsr]]
  - [[fingerprint]]
  - [[range-footer]]
  - [[onda]]
  - [[sync-worker]]
---

# Anti-Entropy O(1)

Mecanismo de verificação de consistência que abre cada sessão de sincronização com custo mínimo: os dois peers trocam apenas o **root fingerprint** do escopo autorizado; se os valores coincidem, a sessão encerra sem transferir nenhum dado adicional — custo $O(1)$.

A definição normativa completa está em **`caderno-2-protocol/03-set-reconciliation-protocol.md §1.1 e §4`**.

## Funcionamento

O anti-entropy é a **Onda 0** do [[onda|pipeline de ondas]]:

1. O [[sync-worker]] calcula o fingerprint total do range autorizado $F[-\infty,+\infty]$ — o XOR cumulativo de todos os fingerprints SHA-256 de 256 bits dos pares $(id, signature)$ na B-Tree em memória.
2. O peer local envia esse root fingerprint ao peer remoto.
3. Se $F_1 = F_2$ — conjuntos idênticos — a sessão encerra imediatamente em $O(1)$, sem dados adicionais.
4. Se $F_1 \neq F_2$ — há divergência — o [[rbsr]] inicia a divisão recursiva de ranges para isolar os IDs divergentes.

> **Meta de 100 ms.** Vale apenas para o *resume* com malha já formada. No *cold start* (lookup DHT + travessia de NAT + handshake TLS) o custo é de segundos — o anti-entropy mede apenas o RTT do fingerprint após o canal estar estabelecido. Fonte: `caderno-2/03 §4`.

O root fingerprint é **determinístico e sem nonce** no caminho rápido, preservando o cache. O nonce é reservado para rodadas de desafio ([[nonce-challenge]]) acionadas somente quando um [[range-footer]] falha ou o escopo é marcado como alto-risco.

## Anti-entropy no mobile (lente SDK)

`caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §3.1` descreve variações para mobile:

- Ao inicializar o app ou retornar do modo suspenso (*resume*), o [[sync-worker]] executa o anti-entropy $O(1)$ antes de qualquer reconciliação.
- Em caso de divergência, a reconciliação recursiva é restrita ao **contexto ativamente visualizado** + janela temporal recente; o restante fica adiado para a Onda 3.
- O Sync Worker mantém um conjunto em RAM de **`ranges conhecidos-divergentes-mas-adiados`** que mascara o cálculo do anti-entropy, impedindo que divergências passivas forcem loops de reconciliação a cada *resume*.

## Relação com outras primitivas

- **[[onda]]** — o anti-entropy é a Onda 0; as Ondas 1–3 executam o [[rbsr]] progressivo.
- **[[fingerprint]]** — o root fingerprint trocado na Onda 0 é um fingerprint de 256 bits; a segurança de 256 bits impede colisões adversariais com custo $\sim 2^{128}$.
- **[[range-footer]]** — detecta colisões/omissões após a reconciliação de um range; falha no footer aciona o [[nonce-challenge]], que não afeta o caminho rápido do anti-entropy.
- **[[rbsr]]** — protocolo que assume o controle quando o anti-entropy detecta divergência.

## Ver também

- [[onda]] — pipeline de quatro fases; Onda 0 = anti-entropy
- [[rbsr]] — reconciliação recursiva acionada quando $F_1 \neq F_2$
- [[fingerprint]] — hash de range de 256 bits (SHA-256)
- [[range-footer]] — rodapé de integridade por range
- [[nonce-challenge]] — rodada de desafio para ranges sob suspeita
- [[sync-worker]] — executor do pipeline

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[rbsr]] | 4 | criado |
| [[fingerprint]] | 4 | placeholder |
| [[range-footer]] | 4 | criado |
| [[onda]] | 4 | criado |
| [[nonce-challenge]] | 4 | placeholder |
| [[sync-worker]] | 7 | placeholder |
