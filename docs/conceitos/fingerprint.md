---
title: Fingerprint
slug: fingerprint
aliases: ["fingerprint de range", "root fingerprint", "hash de range"]
tags: [protocol, sincronizacao, reconciliacao, criptografia, rbsr]
modo: hub
fonte-canonica: docs/caderno-2-protocol/03-set-reconciliation-protocol.md §1.1
aparicoes-consolidadas:
  - rfc-transporte-p2p-v3.1.md §2.6.1 (repete fórmulas e justificativa 256 bits)
dependencias:
  - [[rbsr]]
  - [[range-footer]]
  - [[anti-entropy]]
  - [[onda]]
---

# Fingerprint

Resumo criptográfico de 256 bits que representa um elemento ou um range de elementos do grafo durante a reconciliação [[rbsr]]. A definição normativa completa — incluindo fórmulas, justificativa de segurança e nota v4 — está em **`caderno-2-protocol/03-set-reconciliation-protocol.md §1.1`**.

## Definição

Cada nó $n$ ou aresta $e$ é representado pelo par $(id, signature)$, onde o `id` é um ULID ordenável. O fingerprint individual é:

$$F(x) = \text{SHA-256}(id_x \mathbin{\Vert} \text{signature}_x)$$

O fingerprint de um range $[A, B]$ ordenado lexicograficamente por `id` é o XOR cumulativo dos fingerprints individuais:

$$F([A, B]) = \bigoplus_{x \in [A,B]} F(x)$$

## Por que 256 bits sem truncamento

O uso do SHA-256 completo (sem truncamento) eleva a segurança contra colisões adversariais de $\sim 2^{32}$ (truncamento de 64 bits) para $\sim 2^{128}$. A operação de XOR permanece linear; apenas o custo de forjar um conjunto cujo fingerprint coincida com o do peer honesto torna-se computacionalmente inviável.

> Fonte: `caderno-2/03 §1.1` e `rfc §2.6.1` (texto quase verbatim — a rfc é aparição consolidada).

## Propriedades de cacheabilidade

O fingerprint é **determinístico e sem nonce** no caminho rápido. Isso preserva o cache do *root fingerprint* — o fingerprint total do range $[-\infty, +\infty]$ — que é trocado na [[anti-entropy|Onda 0]] a cada *resume* de sessão.

O nonce só entra na rodada de desafio ([[nonce-challenge]]) acionada quando um [[range-footer]] falha ou o escopo é marcado como alto-risco. Nesse caso a fórmula passa a ser:

$$F(\text{range}, \texttt{nonce}) = \bigoplus_{x} \text{SHA-256}(\texttt{nonce} \mathbin{\Vert} id_x \mathbin{\Vert} \text{signature}_x)$$

Ver detalhes em `caderno-2/03 §1.3`.

## Nota v4

O bundle de assinaturas de quórum de uma operação não-comutativa, quando armazenado inline nos atributos de uma aresta, **não afeta** o fingerprint: `F(x)` usa a `signature` própria da aresta, não seus atributos. A reconciliação permanece inalterada. Fonte: `caderno-2/03 §1.1 Nota v4`.

## Relação com outras primitivas

- **[[rbsr]]** — o fingerprint é a primitiva central do RBSR: comparação de fingerprints de ranges detecta divergência; XOR recursivo isola os IDs divergentes.
- **[[anti-entropy]]** — a Onda 0 troca apenas o *root fingerprint*; se $F_1 = F_2$, a sessão encerra em $O(1)$ sem dados adicionais.
- **[[range-footer]]** — detecta colisões/omissões após transferência de um range; é uma defesa-em-profundidade ortogonal ao fingerprint.
- **[[onda]]** — o root fingerprint é trocado na Onda 0 (Bootstrap/Anti-Entropy).

## Ver também

- [[rbsr]] — protocolo que opera sobre fingerprints de ranges
- [[anti-entropy]] — uso do root fingerprint na Onda 0
- [[range-footer]] — rodapé de integridade complementar ao fingerprint
- [[nonce-challenge]] — rodada de desafio que adiciona nonce ao fingerprint

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[rbsr]] | 4 | criado |
| [[range-footer]] | 4 | criado |
| [[anti-entropy]] | 4 | criado |
| [[onda]] | 4 | criado |
| [[nonce-challenge]] | 4 | placeholder |
| [[sync-worker]] | 7 | placeholder |
