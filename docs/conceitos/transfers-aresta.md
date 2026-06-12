---
name: transfers-aresta
title: "Aresta TRANSFERS"
aliases: ["TRANSFERS", "TRANSFERS (v4)"]
tags: [protocol, ontologia, arestas, economia, transacao, v4]
---

# Aresta TRANSFERS

`TRANSFERS` é uma aresta de execução do grafo da plataforma que expressa o ato de um nó de saldo novo referenciar a [[content-intent]] que autorizou a transferência. É distinta dos verbos raiz canônicos (ver [[verbos-raiz-canonicos]]) por registrar o fato de execução de uma operação financeira não-comutativa — não uma relação estrutural ou social genérica.

## Definição

Conforme `rfc-v4.md §3.2`:

> | `TRANSFERS` | nó de saldo novo → `CONTENT:INTENT` | Execução, referenciando a intent (navegabilidade) |

Conforme `rfc-v4.md §2.4`, a aresta é emitida pelo [[aplicador-deterministico]] após a aprovação da intent:

```
— após aprovação, o aplicador determinístico cria:
AA_new      ──[MUTATES]───→  H        (novo saldo de AA = decrypt(H) − valor)
AB_new      ──[MUTATES]───→  AB_head  (novo saldo de AB = decrypt(AB_head) + valor)
AA_new      ──[TRANSFERS]─→  C        (executado; referencia a intent — navegável)
AB_new      ──[TRANSFERS]─→  C
```

## Estrutura da aresta

| Campo | Valor |
|:---|:---|
| Sujeito | Nó de saldo novo (`AA_new` ou `AB_new`) criado após execução |
| Objeto | `CONTENT:INTENT` que originou a operação |
| Direção | Nó resultante → intent (sentido oposto ao de `SPENDS`/`CREDITS`) |
| Cardinalidade | N → 1 (múltiplos nós de saldo resultantes apontam para uma mesma intent) |
| Mutabilidade | Imutável após emissão (append-only) |

## Papel no fluxo de aprovação

`TRANSFERS` fecha o ciclo de uma transferência serializada. O fluxo completo conforme `rfc-v4.md §2.4`:

```
A           ──[AUTHORED]──→  C (CONTENT:INTENT; valor cifrado no payload)
C           ──[SPENDS]────→  H        (head atual de AA — nó; âncora de serialização)
C           ──[CREDITS]───→  AB       (entity_id do ativo que recebe)
V(dono)     ──[APPROVES]──→  C        (K=1 no caso comum; uma aprovação)

— após aprovação, o aplicador determinístico cria:
AA_new      ──[MUTATES]───→  H        (novo saldo de AA = decrypt(H) − valor)
AB_new      ──[MUTATES]───→  AB_head  (novo saldo de AB = decrypt(AB_head) + valor)
AA_new      ──[TRANSFERS]─→  C        (executado; referencia a intent — navegável)
AB_new      ──[TRANSFERS]─→  C
```

A função de `TRANSFERS` nesse fluxo é dupla:

1. **Evidência de execução**: a presença da aresta `TRANSFERS` em um nó de saldo sinaliza que a intent foi finalizada pelo [[aplicador-deterministico]]. Sem `TRANSFERS`, o nó de saldo não pode ser associado à intent que o gerou.
2. **Navegabilidade**: a aresta torna o grafo bidireccionalmente navegável — da intent para os saldos resultantes (via `TRANSFERS` reversa) e dos saldos para a intent (sentido direto). Isso viabiliza auditoria em O(1): dado um nó de saldo, alcança-se a intent, as aprovações (`APPROVES`), o débito serializado (`SPENDS`) e o crédito comutativo (`CREDITS`).

## Distinção de RESULTED_FROM e TRANSFERRED_TO

`caderno-2-protocol/01-graph-ontology.md §2.2` menciona que o ciclo de aprovação "reusa `TRANSFERRED_TO` (origem → destino)". Na v4, conforme `rfc-v4.md §3.2`, o tipo normalizado é `TRANSFERS` (nó de saldo novo → intent). A diferença semântica é de direção e âncora:

| Aresta | Direção | Objeto | Semântica |
|:---|:---|:---|:---|
| `TRANSFERS` | nó de saldo novo → intent | `CONTENT:INTENT` | Execução — liga o resultado à sua causa |
| `RESULTED_FROM` | nó consequente → causa | qualquer nó causal | Rastreabilidade causal genérica |

<!-- TODO(revisar) A referência a TRANSFERRED_TO em caderno-2/01 §2.2 usa o nome antigo. Verificar se houve renomeação formal para TRANSFERS na v4 ou se os dois coexistem com semânticas distintas. -->

## Distinção de outros verbos

`TRANSFERS` **não é** um verbo raiz canônico (ver [[verbos-raiz-canonicos]]). Os verbos raiz (`RELATES`, `OWNS`, `GOVERNS`, `INTERACTS`, `PARTICIPATES_IN`) expressam relações estruturais ou sociais genéricas. `TRANSFERS` expressa o fato concreto de execução de uma transferência de valor — com direção inversa à da intent, para fechar o ciclo de navegabilidade do grafo.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[aresta]] | 1 | criado |
| [[no]] | 1 | criado |
| [[asset]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| [[content-intent]] | 3 | criado |
| [[spends]] | 10 | criado |
| [[credits]] | 10 | criado |
| [[aplicador-deterministico]] | 9 | criado |
| [[serialization-por-linhagem]] | 9 | criado |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `rfc-v4.md` | `§3.2` e `§2.4` | Substituir menções definitórias por `[[transfers-aresta]]` |
| `caderno-2-protocol/01-graph-ontology.md` | `§2.2` | Verificar e linkar `[[transfers-aresta]]` |
