---
name: spends
title: "Aresta SPENDS"
aliases: ["SPENDS", "SPENDS (v4)"]
tags: [protocol, ontologia, arestas, economia, transacao, v4]
---

# Aresta SPENDS

> **Modo canonical** — definição única aqui. Fontes consolidadas:
> `caderno-2-protocol/01-graph-ontology.md §2.2` (texto normativo principal)
> · `glossary.md §SPENDS (v4)` · `rfc-v4.md §3.2` (tabela de tipos de aresta).

---

## Definição

`SPENDS` é a aresta de débito/gasto do grafo da plataforma. Liga um
[[content-intent]] ao **head específico** (`nodes.id`, não `entity_id`) do
[[asset]] de origem que será debitado.

Definição canônica (`caderno-2-protocol/01-graph-ontology.md §2.2`):

> **`SPENDS`** — Liga um `CONTENT:INTENT` ao **head específico** (`nodes.id`, não `entity_id`) do `ASSET` de origem que será debitado. É a **única referência intencional a uma versão específica** na ontologia: pinar o head exato é o que serializa o débito e permite detecção de conflito estrutural (duas intents com `SPENDS` para o mesmo head). Justificativa de minimalismo: nenhuma outra aresta fixa a versão consumida como âncora de serialização.

Confirmação em `glossary.md §SPENDS (v4)`:

> **SPENDS (v4)** — Aresta de `CONTENT:INTENT` ao head específico do `ASSET` de origem; âncora de serialização (única referência intencional a versão específica).

---

## Estrutura da aresta

| Campo | Valor |
|:---|:---|
| Sujeito | `CONTENT:INTENT` (hub da operação) |
| Objeto | `nodes.id` do head atual do `ASSET` de origem (nó específico, não linhagem) |
| Direção | Intent → head do ativo debitado |
| Mutabilidade | Imutável após emissão |

Conforme `rfc-v4.md §3.2`:

> | `SPENDS` | `CONTENT:INTENT` → head de `ASSET` (nó) | Âncora de serialização (versão consumida) |

---

## Por que `nodes.id` e não `entity_id`

A escolha de referenciar o head (`nodes.id`) em vez da linhagem (`entity_id`)
é normativa e intencional. Conforme `rfc-v4.md §2.4`:

> **Âncora de origem por head, destino por entity_id.** `SPENDS → H` fixa a *versão* consumida (gastar é não-comutativo; pinar o head exato é o ponto). `CREDITS → AB` aponta a linhagem estável (creditar é comutativo; fixar o head de AB serializaria o recebimento sem necessidade).

Gastar é uma operação [[comutativo-vs-nao-comutativo|não-comutativa]]: a
ordem em que dois débitos ocorrem sobre o mesmo ativo **importa** — um deles
pode ser inválido se o saldo for insuficiente. Pinar o head exato torna o
conflito detectável estruturalmente, sem decifrar o payload:

> O `serialization_ref` é uma aresta, não campo de payload. É a própria `SPENDS → H`. Benefício: detecção de conflito **estrutural** — "outras intents com `SPENDS` para o mesmo H que eu aprovei" — sem decifrar valor nenhum. (`rfc-v4.md §2.4`)

Contraste com [[credits]], cujo objeto é `entity_id` (linhagem estável),
pois creditar é comutativo e não requer serialização.

---

## Papel no fluxo de aprovação de operação não-comutativa

`SPENDS` é o elemento central da [[serialization-por-linhagem]]. O fluxo
completo, conforme `rfc-v4.md §2.4`:

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

A aresta `SPENDS → H` é a única peça que serializa a transação. Dois gastos
concorrentes sobre o mesmo head são detectados por [[validador-declarado]] e
[[aplicador-deterministico]] sem precisar inspecionar o valor.

---

## Relação com `ASSET:LOCK` em sagas multidomínio

Em sagas transdomínio, conforme `caderno-2-protocol/01-graph-ontology.md §2.2`:

> **Nota (v4 multidomínio):** Em sagas transdomínio, `ASSET:LOCK` (item temporal com TTL) pode ser o **output de uma operação de reserva** em vez de transferência final. O lock ancora no head da linhagem via `SPENDS` (herdando detecção estrutural de conflito); expira automaticamente via lápide/GC (caderno-3/01 §2.2) quando TTL vence. Ver rfc-transacoes-multidominio.md §2.

O mecanismo é idêntico: a aresta `SPENDS → H` ancora a reserva no head,
detectando conflito estruturalmente. O [[asset-lock]] usa `SPENDS` da mesma
forma que uma transferência final — o que diferencia é apenas o nó de
destino resultante (lock temporário vs. saldo novo).

---

## Par simétrico: CREDITS

`SPENDS` sempre aparece em par com [[credits]] na mesma [[content-intent]]:

| Aresta | Objeto | Semântica | Comutatividade |
|:---|:---|:---|:---|
| `SPENDS` | `nodes.id` do head do ativo de origem | Débito, serializado | Não-comutativo |
| `CREDITS` | `entity_id` do ativo de destino | Crédito, aditivo | Comutativo |

A assimetria é deliberada: `SPENDS` serializa, `CREDITS` não. Conforme
`rfc-v4.md §2.4`:

> Só o débito é serializado. O crédito a AB é monotônico (não pode dar double-spend) e dispensa aprovação própria. Créditos concorrentes a AB bifurcam e fazem **merge aditivo** (soma os deltas, nunca LWW — LWW perderia dinheiro), pela regra da SPEC de `ASSET:BALANCE_STATE`.

---

## Conceitos relacionados

- [[content-intent]] — hub da operação; sujeito da aresta `SPENDS`
- [[asset]] — objeto; ativo de origem debitado
- [[credits]] — aresta par, crédito comutativo ao destino
- [[comutativo-vs-nao-comutativo]] — distinção fundamental que justifica o design de `SPENDS`
- [[serialization-por-linhagem]] — mecanismo de serialização do qual `SPENDS` é âncora
- [[validador-declarado]] — valida a intent e detecta conflito via `SPENDS`
- [[aplicador-deterministico]] — materializa o débito após quórum
- [[invariante-de-core]] — garante que nenhuma SPEC pode contornar a serialização
- [[asset-lock]] — usa `SPENDS` para reserva temporária em sagas
- [[contribuicao-verificavel]] — contexto de uso econômico da aresta
- [[asset-reputation]] <!-- Foam placeholder — verbete Onda 10 --> — ativo de reputação que pode ser debitado via `SPENDS`

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§2.2` | Substituir definição inline por `[[spends]]` |
| `glossary.md` | `§SPENDS (v4)` | Substituir por link `[[spends]]` |
| `rfc-v4.md` | `§3.2` e `§2.4` | Substituir menções definitórias por `[[spends]]` |


