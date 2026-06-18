---
name: standing
title: "Standing (v4)"
aliases: ["Standing", "saldo de contribuição", "standing de contribuição"]
tags: [protocol, economia, agente, v4, contribuicao]
---

# Standing (v4)

> **Modo canonical** — definição única aqui. Fontes consolidadas:
> `rfc-v4.md §3.3` (texto normativo principal) e `rfc-v4.md Apêndice A`
> (glossário) e `glossary.md §Standing (v4)`.

---

## Definição

**Standing** é o saldo de [[contribuicao-verificavel]] acumulado por um
device — e somado por peer — representado como um `ASSET:BALANCE_STATE`
governado por SPEC de contribuição.

Definição canônica (`rfc-v4.md Apêndice A`):

> "Saldo de contribuição acumulado (`ASSET:BALANCE_STATE` de contribuição),
> por device → por peer."

Formulação compacta (`glossary.md §Standing (v4)`):

> "Saldo de contribuição acumulado (`ASSET:BALANCE_STATE` de contribuição),
> medido por device e somado por peer."

---

## Estrutura no grafo

Texto normativo em `rfc-v4.md §3.3`:

> "O *standing* acumulado é um `ASSET:BALANCE_STATE` governado por SPEC de
> contribuição — a aresta de contribuição está para esse saldo como
> `TRANSFERRED_TO` está para o saldo de dinheiro. Zero tipo de nó novo;
> mesmo code path de qualquer saldo."

Consequências diretas:

- **Nenhum tipo de nó novo**: standing usa o mesmo caminho de código de
  qualquer [[asset-balance-state]].
- **Granularidade de sessão/época**: contribuições são consolidadas antes de
  impactar o saldo; recibos por chunk são efêmeros.
- **Medição é do core; liquidação é da SPEC**: o core registra a evidência
  verificável; converter standing em crédito, fiat ou reputação é decisão
  de [[specification]] (Zen Engine) por rede/módulo. Ver
  [[economia-como-modulo]].

---

## Relação com contribuição verificável

Standing é o acúmulo resultante de arestas [[contributes-aresta]]
(`CONTRIBUTES`) emitidas pelo [[agente-de-sistema]] a cada sessão/época.
A relação é análoga à de `TRANSFERRED_TO` → `ASSET:BALANCE_STATE` de
dinheiro: a aresta de contribuição debita/credita o saldo de standing
(`rfc-v4.md §3.3`).

---

## Standing como gate de convite (defesa Sybil)

Standing tem papel explícito na [[defesa-sybil]] (`rfc-v4.md §4.2`):

> "**Convite-como-`ASSET:INVITE`**: saldo finito, emissão restrita,
> **gateada por standing** (mais convites por ser bom cidadão). Converte
> '100 identidades já' em 'fluxo lento gateado por contribuição real'.
> Rate limiter, não muro."

Além disso, contribuição só conta se servir contrapartes **distintas e
independentemente reputadas**:

> "1000 Sybils servindo uns aos outros = ~0 de standing. Mata a fome,
> não a existência." (`rfc-v4.md §4.2`)

---

## Relação com reputação local

Standing e [[reputacao-local]] <!-- Foam placeholder — verbete Onda 10 -->
são dimensões distintas:

- **Standing** é objetivo, verificável, acumulado no grafo como
  `ASSET:BALANCE_STATE`.
- **Reputação local** é subjetiva, não-transitiva, não-replicada; scores
  ficam locais e só [[fato-negativo-verificavel]] <!-- Foam placeholder — verbete Onda 10 -->
  (mau ato re-checável por qualquer um) vai ao grafo.

---

## Conceitos relacionados

- [[contribuicao-verificavel]] — trabalho que gera incremento de standing
- [[contributes-aresta]] — aresta `CONTRIBUTES` que registra cada contribuição
- [[agente-de-sistema]] — executor da medição verificável no device
- [[economia-como-modulo]] — separa medição (core) de liquidação (SPEC)
- [[asset-balance-state]] — tipo de ativo que implementa o saldo de standing
- [[reputacao-local]] <!-- Foam placeholder — verbete Onda 10 --> — avaliação subjetiva complementar ao standing objetivo
- [[defesa-sybil]] — standing como gate de emissão de convites
- [[fato-negativo-verificavel]] <!-- Foam placeholder — verbete Onda 10 --> — mau ato que impacta reputação (não standing diretamente)
- [[desafio-canary]] <!-- Foam placeholder — verbete Onda 10 --> — auditoria da integridade do agente que mede contribuição


