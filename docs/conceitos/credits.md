---
name: credits
title: "Aresta CREDITS"
aliases: ["CREDITS", "CREDITS (v4)"]
tags: [protocol, ontologia, arestas, economia, transacao, v4]
---

# Aresta CREDITS

> **Modo canonical** — definição única aqui. Fontes consolidadas:
> `caderno-2-protocol/01-graph-ontology.md §2.2` (texto normativo principal)
> · `rfc-v4.md §3.2` (tabela de tipos de aresta) · `rfc-v4.md §2.4` (fluxo de aprovação).

---

## Definição

`CREDITS` é a aresta de crédito/destino do grafo da plataforma. Liga um
[[content-intent]] ao **`entity_id`** (linhagem estável) do [[asset]] de
destino que receberá o valor.

Definição canônica (`caderno-2-protocol/01-graph-ontology.md §2.2`):

> **`CREDITS`** — Liga um `CONTENT:INTENT` ao **`entity_id`** (linhagem estável) do `ASSET` de destino. Aponta para a linhagem, não para o head, porque creditar é comutativo (ver caderno-2/04 §4.3, merge aditivo). Segue o padrão de referência estável de `AGGREGATES`/`REQUIRES`.

Confirmação em `rfc-v4.md §3.2`:

> | `CREDITS` | `CONTENT:INTENT` → `ASSET` (entity_id) | Destino comutativo |

---

## Estrutura da aresta

| Campo | Valor |
|:---|:---|
| Sujeito | `CONTENT:INTENT` (hub da operação) |
| Objeto | `entity_id` do `ASSET` de destino (linhagem estável, não head específico) |
| Direção | Intent → linhagem do ativo creditado |
| Mutabilidade | Imutável após emissão |

---

## Por que `entity_id` e não `nodes.id`

A escolha de referenciar a linhagem (`entity_id`) em vez do head (`nodes.id`)
é normativa e intencional. Conforme `rfc-v4.md §2.4`:

> **Âncora de origem por head, destino por entity_id.** `SPENDS → H` fixa a *versão* consumida (gastar é não-comutativo; pinar o head exato é o ponto). `CREDITS → AB` aponta a linhagem estável (creditar é comutativo; fixar o head de AB serializaria o recebimento sem necessidade). Casa com o padrão da v3.1 §2.1 (`AGGREGATES`/`REQUIRES` apontam para `entity_id`).

Creditar é uma operação [[comutativo-vs-nao-comutativo|comutativa]]: a
ordem em que dois créditos chegam ao mesmo ativo não altera o resultado
final — ambos serão somados. Pinar o head do destino introduziria serialização
desnecessária, tornando o recebimento mais caro sem nenhum benefício de
correção. Conforme `rfc-v4.md §2.4`:

> Só o débito é serializado. O crédito a AB é monotônico (não pode dar double-spend) e dispensa aprovação própria. Créditos concorrentes a AB bifurcam e fazem **merge aditivo** (soma os deltas, nunca LWW — LWW perderia dinheiro), pela regra da SPEC de `ASSET:BALANCE_STATE`.

Contraste com [[spends]], cujo objeto é `nodes.id` (head específico), pois
gastar é não-comutativo e exige serialização.

---

## Papel no fluxo de aprovação de operação não-comutativa

`CREDITS` é o destino da operação serializada por [[serialization-por-linhagem]].
O fluxo completo, conforme `rfc-v4.md §2.4`:

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

A aresta `CREDITS → AB` é comutativa: dois créditos concorrentes a AB produzem
dois nós `AB_new` separados que fazem [[merge-aditivo]] (deltas somados, nunca
LWW), pela regra da SPEC de `ASSET:BALANCE_STATE`. O [[aplicador-deterministico]]
não precisa serializar o crédito — apenas o débito (via [[spends]]) exige isso.

---

## Par simétrico: SPENDS

`CREDITS` sempre aparece em par com [[spends]] na mesma [[content-intent]]:

| Aresta | Objeto | Semântica | Comutatividade |
|:---|:---|:---|:---|
| `SPENDS` | `nodes.id` do head do ativo de origem | Débito, serializado | Não-comutativo |
| `CREDITS` | `entity_id` do ativo de destino | Crédito, aditivo | Comutativo |

A assimetria é deliberada e segue o critério de minimalismo ontológico: cada
aresta faz exatamente o que sua semântica exige — nem mais, nem menos.

---

## Conceitos relacionados

- [[content-intent]] — hub da operação; sujeito da aresta `CREDITS`
- [[asset]] — objeto; ativo de destino creditado
- [[spends]] — aresta par, débito serializado da origem
- [[comutativo-vs-nao-comutativo]] — distinção fundamental que justifica o design de `CREDITS`
- [[merge-aditivo]] — regra de resolução de créditos concorrentes sobre o mesmo destino
- [[serialization-por-linhagem]] — mecanismo de serialização; `CREDITS` é o polo não-serializado
- [[aplicador-deterministico]] — materializa o crédito após quórum de aprovação
- [[invariante-de-core]] — garante que o débito (via `SPENDS`) não pode ser contornado
- [[economia-como-modulo]] — contexto de uso econômico da aresta
- [[contribuicao-verificavel]] — fluxo onde `CREDITS` remunera standing de contribuição
- [[standing]] — saldo (`ASSET:BALANCE_STATE`) creditado via esta aresta em fluxos de contribuição
- [[asset-lock]] — em sagas, o lock usa `SPENDS` (não `CREDITS`) para ancoragem

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§2.2` | Substituir definição inline por `[[credits]]` |
| `rfc-v4.md` | `§3.2` e `§2.4` | Substituir menções definitórias por `[[credits]]` |
