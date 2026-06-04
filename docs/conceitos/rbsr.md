---
name: rbsr
title: "RBSR (Range-Based Set Reconciliation)"
aliases: ["Range-Based Set Reconciliation", "reconciliação de conjuntos por range", "set reconciliation"]
tags: [protocol, sincronizacao, reconciliacao, hub]
---

# RBSR (Range-Based Set Reconciliation)

**Modo hub** — definição normativa completa em `caderno-2-protocol/03-set-reconciliation-protocol.md §1`.

---

## O que é

RBSR é o algoritmo de sincronização de conjuntos adotado pela plataforma para reconciliar as tabelas físicas `nodes` e `edges` entre dois peers sem transferir bancos inteiros. Opera por XOR recursivo de fingerprints de ranges ordenados da B-Tree em memória, isolando cirurgicamente apenas os elementos divergentes.

Conforme `caderno-2-protocol/03-set-reconciliation-protocol.md §1`:

> Para sincronizar de forma eficiente conjuntos de nós e arestas entre dois peers sem transferir logs inteiros ou chaves redundantes, a plataforma adota o algoritmo de **Range-Based Set Reconciliation** executado em memória pelo Sync Worker.

O protocolo opera **independentemente do Automerge Repo**, que gerencia apenas documentos colaborativos.

---

## Funcionamento resumido

1. **Fingerprint do range** — cada elemento $(id, signature)$ possui um SHA-256 de 256 bits; o fingerprint de um range $[A,B]$ é o XOR cumulativo dos fingerprints individuais. Ver detalhes em [[fingerprint]].
2. **Anti-entropy O(1)** — na Onda 0, apenas o root fingerprint é trocado. Se coincidir, a sessão encerra sem mais dados. Ver [[anti-entropy]].
3. **Divisão recursiva** — se os fingerprints diferem, o range é subdividido em sub-ranges da B-Tree até individualizar os IDs divergentes. O peer em falta emite `REQUEST_NODES`.
4. **Fechamento com RangeFooter** — cada range transferido carrega um rodapé (`count` + `checksum`) para tornar colisão/omissão detectável. Ver [[range-footer]].
5. **Rodada de desafio com nonce** — se um `RangeFooter` falha ou o escopo é marcado como alto-risco, o range é re-sincronizado com nonce por sessão, inviabilizando pré-computação adversarial. Ver [[nonce-challenge]].

Para a especificação matemática completa (fórmulas, structs e invariantes), consulte `caderno-2-protocol/03-set-reconciliation-protocol.md §1`.

---

## Escopo e autorização

A B-Tree de sincronização é calculada **exclusivamente sobre o subgrafo autorizado** pelo [[ucan]] ativo. Um peer sem UCAN sobre um subgrafo nunca recebe, transmite ou verifica fingerprints daquele subgrafo. Detalhes em [[sync-dirigido-por-ucan]] e `caderno-2-protocol/03-set-reconciliation-protocol.md §2`.

---

## Relação com o sistema de Ondas

O RBSR estrutura a sincronização em quatro fases ([[onda]]). A Onda 0 é a fase de anti-entropy O(1) do RBSR; as Ondas 1–3 executam a reconciliação progressiva e a reidratação de payloads. Ver `caderno-2-protocol/03-set-reconciliation-protocol.md §4`.

---

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[ulid]] | 1 | criado |
| [[ucan]] | 2 | criado |
| [[fingerprint]] | 4 | placeholder |
| [[range-footer]] | 4 | placeholder |
| [[nonce-challenge]] | 4 | placeholder |
| [[anti-entropy]] | 4 | placeholder |
| [[onda]] | 4 | placeholder |
| [[sync-dirigido-por-ucan]] | 4 | placeholder |
| [[sync-worker]] | 7 | placeholder |

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/03-set-reconciliation-protocol.md` | `§1` | Fonte canônica — acrescentar wikilink `[[rbsr]]` no título |
| `rfc-transporte-p2p-v3.1.md` | `§2.6–2.6.4` | Conteúdo quase verbatim do caderno-2/03; substituir por resumo + `[[rbsr]]` |
| `docs/glossary.md` | `§RBSR` | Acrescentar link `[[rbsr]]` na entrada |
