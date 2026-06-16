---
name: economia-como-modulo
title: "Economia como Módulo (v4)"
aliases: ["economia-como-módulo", "economy as module", "Economia-como-Módulo"]
tags: [governance, economia, asset, v4, specification]
---

# Economia como Módulo (v4)

> **Modo canonical** — definição única aqui. Fontes consolidadas:
> `rfc-v4.md §4.1` (texto normativo principal) e `glossary.md §Economia-como-Módulo (v4)`.

---

## Definição

A **economia como módulo** é o princípio arquitetural pelo qual a economia de
contribuição (e qualquer outra economia interna à rede) é tratada como **um
módulo ASSET governado por [[specification]]**, e não como uma primitiva do
core da plataforma.

> Definição canônica (`rfc-v4.md §4.1`):
>
> "A economia de contribuição é **um** modelo econômico entre vários que o
> ASSET viabiliza — não primitiva do core."

Formulação compacta (`glossary.md §Economia-como-Módulo (v4)`):

> "A economia de contribuição é um `ASSET` governado por SPEC; o core
> **mede**, a SPEC **liquida**. Um entre vários modelos econômicos possíveis."

---

## Divisão core / SPEC

A separação fundamental (`rfc-v4.md §4.1`) é:

| Responsabilidade | Quem carrega | O que entrega |
|:---|:---|:---|
| **Medição verificável** | Core | Recibos de banda, provas de storage, amostras de compute — um registro assinado e auditável de trabalho feito |
| **Liquidação** | SPEC (via [[specification|Zen Engine]]) | A regra "contribuição → crédito/fiat/reputação" — procedimento na SPEC, não no core |

A regra de liquidação é configurada por rede/módulo. O core não sabe o que fazer com a medição; a SPEC decide.

- **Split, comissão e impostos de rede:** Splits de pagamento, comissões de venda e impostos/taxas de manutenção de rede são casos de liquidação por SPEC. O core apenas mede as operações e finaliza os créditos/débitos atômicos multi-destino correspondentes, enquanto a lógica e percentuais de split e taxas são definidos em Zen na SPEC do item ou da rede.


---

## Por que não é primitiva do core

Conforme `rfc-v4.md §4.1`, esta separação resolve dois problemas da v4 anterior:

1. **Regresso de mint**: o nó de contribuição é assinado pelo [[agente-de-sistema]]
   e ancorado em evidência verificável sob demanda (spot-check de recibo/storage),
   **não** pré-auditado por K=5 recursivo.

2. **Múltiplas economias**: o mesmo mecanismo roda a economia de pontos de um
   módulo de fidelidade e a economia de contribuição da rede — porque o [[asset]]
   é o tipo comum e a SPEC é o lugar da política.

---

## Relação com os verbos econômicos

Os verbos [[spends]] <!-- Foam placeholder — verbete Onda 10 --> e
[[credits]] <!-- Foam placeholder — verbete Onda 10 --> são as arestas
que materializam, respectivamente, o débito e o crédito sobre um `ASSET`.
A aresta de [[contribuicao-verificavel]] <!-- Foam placeholder — verbete Onda 10 -->
está para o saldo de [[standing]] <!-- Foam placeholder — verbete Onda 10 -->
como `TRANSFERRED_TO` está para o saldo de dinheiro — **zero tipo de nó novo,
mesmo code path de qualquer saldo** (`rfc-v4.md §3.3`).

---

## Relação com a defesa Sybil

A economia mede contribuição; ela **não é** a defesa Sybil primária — se fosse,
colidiria (Sybils poderiam contribuir entre si). A defesa primária é o custo de
criação de identidade.

A economia ganha papel de segurança **apenas** no bonding de papéis privilegiados
(validador/custódio): mau comportamento corta a caução
([[bond-caucao]] <!-- Foam placeholder — verbete Onda 10 -->).

> Texto normativo completo: `rfc-v4.md §4.2`.
> Verbete relacionado: [[defesa-sybil]] <!-- Foam placeholder — verbete Onda 10 -->.

---

## Conceitos relacionados

- [[asset]] — tipo ontológico que viabiliza qualquer modelo econômico como módulo
- [[specification]] — onde a política de liquidação é declarada (Zen Engine)
- [[agente-de-sistema]] — executor da medição verificável no device
- [[contribuicao-verificavel]] <!-- Foam placeholder — verbete Onda 10 --> — o que o agente mede e reporta
- [[standing]] <!-- Foam placeholder — verbete Onda 10 --> — saldo de contribuição acumulado (`ASSET:BALANCE_STATE`)
- [[spends]] <!-- Foam placeholder — verbete Onda 10 --> — aresta de débito sobre um ASSET
- [[credits]] <!-- Foam placeholder — verbete Onda 10 --> — aresta de crédito sobre um ASSET
- [[defesa-sybil]] <!-- Foam placeholder — verbete Onda 10 --> — mecanismo primário anti-Sybil (separado da economia)
- [[bond-caucao]] <!-- Foam placeholder — verbete Onda 10 --> — caução para papéis privilegiados; único ponto onde economia tem papel de segurança


