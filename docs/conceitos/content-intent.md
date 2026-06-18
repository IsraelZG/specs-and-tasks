---
name: content-intent
title: "CONTENT:INTENT (Intenção de Ação)"
aliases: ["CONTENT:INTENT", "intent", "intenção de modificação", "nó de intenção"]
tags: [protocol, ontologia, graph, transações, serialização]
---

# CONTENT:INTENT (Intenção de Ação)

## Definição

`CONTENT:INTENT` é um **subtipo de [[content]]** que materializa, como nó durável e assinado no grafo, a intenção de uma ação que exige validação não-trivial.

Conforme `caderno-2-protocol/01-graph-ontology.md §3.2`:

> `CONTENT:INTENT` — Registro assinado de uma intenção de modificação não-trivial.

E conforme `caderno-2-protocol/01-graph-ontology.md §1`:

> **Não existe o tipo de nó `EVENT`**. Eventos consolidados são representados por novos nós-versão e arestas relacionais. A intenção de uma ação é representada pelo nó `CONTENT:INTENT` (um subtipo de `CONTENT`, não uma primitiva separada).

`CONTENT:INTENT` **não** é um quinto tipo de nó; é um `CONTENT`. Toda semântica de criação, mutação e governança de `CONTENT` se aplica.

## O Papel de Hub Transacional

Na arquitetura de operações não-comutativas (v4), a intent é o **hub**: todos os elementos da operação pendem dela por arestas nó-para-nó.

Fluxo canônico (`rfc-v4.md §2.4`):

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

As regras completas do fluxo (âncora de origem por head vs. destino por `entity_id`, serialização estrutural via `SPENDS`, merge aditivo de créditos concorrentes, K=1 como caso comum, aplicador determinístico, evidência inline) estão em `rfc-v4.md §2.4`.

## Arestas Ancoradas na Intent

| aresta | direção | papel |
|:---|:---|:---|
| `AUTHORED` | `PROFILE` → `CONTENT:INTENT` | quem criou a intenção |
| `SPENDS` | `CONTENT:INTENT` → head de `ASSET` (nó) | âncora de serialização — única referência intencional a versão específica |
| `CREDITS` | `CONTENT:INTENT` → `ASSET` (`entity_id`) | destino comutativo (aponta linhagem estável) |
| `APPROVES` | `PROFILE:SYSTEM` → `CONTENT:INTENT` | aprovação de validador (evidência inline) |
| `RESOLVES` | validador → `CONTENT:INTENT` | fecha o ciclo; a intenção virou fato histórico |
| `TRANSFERS` | nó de saldo novo → `CONTENT:INTENT` | referencia a intent no registro de execução |
| `RESULTED_FROM` | nó consequente → `CONTENT:INTENT` | rastreabilidade causal em O(1) |

A semântica detalhada de cada aresta está em `caderno-2-protocol/01-graph-ontology.md §2.2` e em `rfc-v4.md §3.2`.

## Usos Normativos Além de Transações Financeiras

`CONTENT:INTENT` é reutilizado para qualquer ação que exija registro formal e validação:

- **Portabilidade LGPD** — titular emite uma `CONTENT:INTENT` de portabilidade solicitando exportação dos seus dados (`caderno-1-vision/03-legal-and-compliance-framework.md §2.2`).
- **Deleção LGPD** — titular emite uma `CONTENT:INTENT` de deleção; retenção legal prevalece quando `SPECIFICATION`s de conformidade o exigem (`caderno-1-vision/03-legal-and-compliance-framework.md §2.3`).

## Consolidação do Bug de Definição Dupla

O glossário (`glossary.md`) continha duas entradas independentes para `CONTENT:INTENT` (linhas 41 e 125), com textos quase idênticos. A definição autoritativa é a de `caderno-2-protocol/01-graph-ontology.md §3.2`. Na Fase 3, ambas as entradas do glossário devem ser substituídas por referência a este verbete.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[content]] | 1 | criado (placeholder) |
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[mutates]] | 1 | criado |
| [[linhagem-de-versoes]] | 1 | criado |

Dependências de ondas futuras (Foam placeholders — não criar agora):

- `[[asset-lock]]` — Onda 3; reserva temporária ancorada via `SPENDS`
- `[[merge-aditivo]]` — Onda 6; regra de créditos concorrentes
- `[[aplicador-deterministico]]` — Onda 9; finalização determinística
- `[[serialization-por-linhagem]]` — Onda 9; invariante de core
- `[[asset-consent]]` — Onda 2; criado

## Aparições a Consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§3.2` | Substituir linha de definição inline por `[[content-intent]]` |
| `caderno-2-protocol/01-graph-ontology.md` | `§1` | Adicionar `[[content-intent]]` ao parágrafo sobre `EVENT` |
| `caderno-2-protocol/01-graph-ontology.md` | `§2.2` | Substituir referências a `CONTENT:INTENT` por `[[content-intent]]` |
| `glossary.md` | linha 41 (`§CONTENT:INTENT`) | Substituir definição por referência a `[[content-intent]]` |
| `glossary.md` | linha 125 (`§CONTENT:INTENT`) | Remover entrada duplicada |
| `glossary.md` | `§SPENDS`, `§CREDITS`, `§RESULTED_FROM`, `§RESOLVES` | Adicionar link `[[content-intent]]` |
| `rfc-v4.md` | `§2.4` | Adicionar link `[[content-intent]]` no título/intro da seção |
| `caderno-1-vision/03-legal-and-compliance-framework.md` | `§2.2`, `§2.3` | Substituir `CONTENT:INTENT` inline por `[[content-intent]]` |


