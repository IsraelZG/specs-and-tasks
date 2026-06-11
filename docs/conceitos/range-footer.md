---
name: range-footer
title: "RangeFooter"
aliases: ["Range Footer", "rodapé de range", "RangeFooter"]
tags: [protocol, sincronizacao, reconciliacao, hub]
---

# RangeFooter

**Modo hub** — definição normativa completa em `caderno-2-protocol/03-set-reconciliation-protocol.md §1.2`.

---

## O que é

`RangeFooter` é o rodapé `{count, checksum}` anexado ao fechamento de cada range transferido no protocolo [[rbsr]], tornando colisão ou omissão adversarial de [[fingerprint]] detectável de forma determinística — mesmo nos casos em que, hipoteticamente, o fingerprint coincidisse por acidente ou ataque.

Conforme `caderno-2-protocol/03-set-reconciliation-protocol.md §1.2`:

> Fechamento com RangeFooter: junto à resposta de cada range, o emissor anexa um rodapé que torna colisão/omissão adversarial detectável de forma determinística.

---

## Estrutura

A struct canônica está definida em `caderno-2-protocol/03-set-reconciliation-protocol.md §1.2`:

```
RangeFooter {
  count:    uint32,    // quantidade de registros no range
  checksum: bytes32    // SHA-256(id₁ ‖ id₂ ‖ ... ‖ idₙ), IDs em ordem lexicográfica
}
```

O receptor valida `count` e `checksum`. **Se o fingerprint do range havia coincidido mas o footer diverge → colisão detectada**, e o range é re-sincronizado em modo de desafio ([[nonce-challenge]]).

Para a especificação completa (fórmulas, semântica e invariantes de validação), consulte `caderno-2-protocol/03-set-reconciliation-protocol.md §1.2`.

---

## Papel no protocolo RBSR

O `RangeFooter` atua como camada de defesa-em-profundidade sobre o [[fingerprint]] (XOR de SHA-256). Enquanto o fingerprint permite a detecção eficiente de divergências durante a divisão recursiva de ranges, o footer garante que a transferência final de um range seja verificável registro a registro — cobrindo o caso de colisão adversarial no fingerprint XOR.

O fluxo geral é descrito em [[rbsr]]. O rodapé é emitido na etapa 5 do protocolo (resposta ao `REQUEST_NODES`).

---

## Rodada de desafio

Quando um `RangeFooter` falha, o range afetado é re-sincronizado via [[nonce-challenge]], que introduz um nonce por sessão nas fórmulas de fingerprint, inviabilizando pré-computação adversarial. O nonce não é aplicado no caminho rápido (preserva a cacheabilidade do anti-entropy [[anti-entropy]] O(1)).

---

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[rbsr]] | 4 | criado |
| [[fingerprint]] | 4 | placeholder |
| [[nonce-challenge]] | 4 | placeholder |
| [[anti-entropy]] | 4 | placeholder |
| [[onda]] | 4 | placeholder |

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/03-set-reconciliation-protocol.md` | `§1.2` | Fonte canônica — acrescentar wikilink `[[range-footer]]` |
| `rfc-transporte-p2p-v3.1.md` | `§2.6.3` | Conteúdo quase verbatim do caderno-2/03; substituir por resumo + `[[range-footer]]` |
| `docs/glossary.md` | `§RangeFooter` | Acrescentar link `[[range-footer]]` na entrada |
| `rfc-transporte-p2p-v3.1.md` | `Apêndice B §RangeFooter` | Acrescentar link `[[range-footer]]` na entrada |


