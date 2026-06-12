---
name: approves
title: "Aresta APPROVES"
aliases: ["APPROVES", "APPROVED_BY", "APPROVES (v4)"]
tags: [protocol, ontologia, arestas, validacao, transacao, v4]
---

# Aresta APPROVES

`APPROVES` é uma aresta de validação do grafo da plataforma que expressa o ato de um validador (um [[profile-system]]) autorizar uma [[content-intent]]. É distinta dos verbos raiz canônicos (ver [[verbos-raiz-canonicos]]) por registrar evidência inline de aprovação em operações não-comutativas — não uma relação estrutural ou social genérica.

## Definição

Conforme `rfc-v4.md §3.2`:

> | `APPROVES` | `PROFILE:SYSTEM` → `CONTENT:INTENT` | Aprovação de validador (evidência inline) |

O princípio de que o ato de aprovar é uma aresta — não um nó — é enunciado em `caderno-2-protocol/01-graph-ontology.md §1`:

> O ato de aprovar não é um nó — é uma aresta (`APPROVED_BY`).

Na v4, o tipo normalizado para esse ato é `APPROVES` (sujeito → objeto), conforme `rfc-v4.md §3.2`. O nome `APPROVED_BY` (objeto ← sujeito) aparece no caderno de ontologia como formulação anterior; ambos descrevem o mesmo facto semântico com direção oposta de leitura.

## Estrutura da aresta

| Campo | Valor |
|:---|:---|
| Sujeito | `PROFILE:SYSTEM` (validador declarado da linhagem) |
| Objeto | `CONTENT:INTENT` que está sendo aprovada |
| Cardinalidade | N → 1 (K aprovadores para uma mesma intent; K=1 é o caso comum) |
| Mutabilidade | Imutável após emissão (append-only) |
| Assinatura | Individualizada por aprovador (evidência inline, não agregada) |

## Papel no fluxo de aprovação

`APPROVES` ocupa a posição central no fluxo de execução de uma operação não-comutativa. Conforme `rfc-v4.md §2.4`:

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

Regras normativas relativas a `APPROVES`, conforme `rfc-v4.md §2.4`:

- **K=1 é o caso comum** (cashback, fidelidade, maioria dos não-financeiros). A posse da linhagem é determinística (`hash(AA.entity_id)` → um agente do conjunto declarado) — não pega-quem-agarra-primeiro.
- **Evidência inline, não agregada.** As assinaturas dos aprovadores ficam individualizadas (em `APPROVES` separadas, ou bundle inline), preservando atribuição para corte de caução. Assinatura agregada (BLS/threshold) economiza bytes mas apaga "quem assinou o quê".
- **Finalização pelo [[aplicador-deterministico]], não "o N-ésimo".** Sob aprovação assíncrona com K>1, o aplicador é determinístico (menor `entity_id` entre os aprovadores), evitando finalização duplicada.
- **Síncrono vs. assíncrono é representação SPEC-selecionável.** Assíncrono (intent persistida, validadores aprovam independentemente) é o default financeiro. Síncrono (coleta efêmera + bundle consolidado) serve alta frequência. O core verifica o predicado de quórum independentemente da forma.

## Posição no conjunto de arestas de transação serializada

`APPROVES` integra o conjunto de arestas não-comutativas introduzidas na v4, conforme `rfc-v4.md §3.2`:

| Aresta | from → to | Papel |
|:---|:---|:---|
| [[spends]] | `CONTENT:INTENT` → head de `ASSET` (nó) | Âncora de serialização (versão consumida) |
| [[credits]] | `CONTENT:INTENT` → `ASSET` (entity_id) | Destino comutativo |
| `APPROVES` | `PROFILE:SYSTEM` → `CONTENT:INTENT` | Aprovação de validador (evidência inline) |
| [[transfers-aresta]] | nó de saldo novo → `CONTENT:INTENT` | Execução, referenciando a intent (navegabilidade) |

## Distinção de outros verbos

`APPROVES` **não é** um verbo raiz canônico (ver [[verbos-raiz-canonicos]]). Os verbos raiz (`RELATES`, `OWNS`, `GOVERNS`, `INTERACTS`, `PARTICIPATES_IN`) expressam relações estruturais ou sociais genéricas. `APPROVES` expressa um ato concreto de validação criptograficamente assinada sobre uma intent específica, com consequências de liquidação não-comutativa — por isso merece aresta própria.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[aresta]] | 1 | criado |
| [[no]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| [[profile-system]] | 3 | criado |
| [[content-intent]] | 3 | criado |
| [[spends]] | 10 | criado |
| [[credits]] | 10 | criado |
| [[transfers-aresta]] | 10 | criado |
| [[aplicador-deterministico]] | 9 | criado |
| [[serialization-por-linhagem]] | 9 | criado |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `rfc-v4.md` | `§3.2` e `§2.4` | Substituir menções definitórias por `[[approves]]` |
| `caderno-2-protocol/01-graph-ontology.md` | `§1` (APPROVED_BY) e `§3.1` | Linkar `[[approves]]` e nota de normalização de nome |
