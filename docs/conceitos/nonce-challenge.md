---
name: nonce-challenge
title: "Nonce-Challenge (Rodada de Desafio)"
aliases: ["Rodada de Desafio com Nonce", "nonce de desafio", "rodada de desafio"]
tags: [protocol, sincronizacao, reconciliacao, seguranca, hub]
---

# Nonce-Challenge (Rodada de Desafio)

**Modo hub** — definição normativa completa em `caderno-2-protocol/03-set-reconciliation-protocol.md §1.3`.

---

## O que é

`nonce-challenge` é a rodada de re-sincronização de um range [[rbsr]] ativada sob suspeita: quando um [[range-footer]] falha ou quando uma `SPECIFICATION` marca o escopo como alto-risco. Nessa rodada, um nonce por sessão é incorporado ao cálculo de cada [[fingerprint]] do range afetado, inviabilizando ataques por pré-computação de fingerprints maliciosos.

---

## Fórmula canônica

A fórmula está definida em `caderno-2-protocol/03-set-reconciliation-protocol.md §1.3`:

$$F(\text{range}, \texttt{nonce}) = \bigoplus_{x} \text{SHA-256}(\texttt{nonce} \mathbin{\Vert} id_x \mathbin{\Vert} \text{signature}_x)$$

Para a especificação completa (condições de ativação, invariantes e relação com o caminho rápido), consulte `caderno-2-protocol/03-set-reconciliation-protocol.md §1.3`.

---

## Posição no protocolo

O nonce **não** é aplicado no caminho rápido geral. Isso preserva a cacheabilidade do *root fingerprint* usado no [[anti-entropy]] O(1) da [[onda]] 0. O nonce entra **apenas** na rodada de desafio do range afetado — tornando o atacante obrigado a recalcular para cada sessão e cada peer, inviabilizando ataques pré-computados.

O fluxo completo é:

1. [[rbsr]] detecta divergência e inicia reconciliação.
2. Emissor do range anexa [[range-footer]] `{count, checksum}`.
3. Se o footer falha → range re-sincronizado via `nonce-challenge`.
4. Se a `SPECIFICATION` marca escopo alto-risco → `nonce-challenge` ativado diretamente.

---

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[rbsr]] | 4 | criado |
| [[fingerprint]] | 4 | criado |
| [[range-footer]] | 4 | criado |
| [[anti-entropy]] | 4 | criado |
| [[onda]] | 4 | criado |

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/03-set-reconciliation-protocol.md` | `§1.3` | Fonte canônica — acrescentar wikilink `[[nonce-challenge]]` |
| `rfc-transporte-p2p-v3.1.md` | `§2.6.4` | Conteúdo quase verbatim do caderno-2/03; substituir por resumo + `[[nonce-challenge]]` |


