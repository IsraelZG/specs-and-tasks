---
name: contribuicao-verificavel
title: "Contribuição Verificável (v4)"
aliases: ["Contribuição Verificável", "verifiable contribution", "contribuicao verificavel"]
tags: [protocol, economia, agente, v4, contribuicao]
---

# Contribuição Verificável (v4)

> **Modo canonical** — definição única aqui. Fontes consolidadas:
> `rfc-v4.md §3.3` (texto normativo principal, incluindo tabela dos quatro regimes)
> e `glossary.md §Contribuição Verificável (v4)`.

---

## Definição

**Contribuição verificável** é qualquer trabalho prestado à rede pelo
[[agente-de-sistema]] que pode ser aferido por um dos quatro regimes de
verificação sem depender de autorrelato não checável.

> Definição canônica (`rfc-v4.md §Apêndice A`):
>
> "Trabalho à rede medido por um dos quatro regimes
> (banda / storage / compute-det. / compute-não-det.)."

Formulação compacta (`glossary.md §Contribuição Verificável (v4)`):

> "Trabalho à rede medido por um de quatro regimes: banda (recibo de
> contraparte), storage (desafio-resposta), compute determinístico
> (amostragem), compute não-determinístico (aceitação + reputação)."

---

## Os quatro regimes de verificação

Texto normativo e tabela completa em `rfc-v4.md §3.3`. Reprodução literal:

| Contribuição | Verificação | Confiança |
| :--- | :--- | :--- |
| **Banda** | Recibo assinado pela **contraparte**, ancorado ao `InfoHash`/hash de chunk do grafo | Bilateral, verificável-pelo-dado |
| **Storage** | **Desafio-resposta** de retrievability | Verificável sob demanda |
| **Compute determinístico** (validação, merge, regra Zen) | **Reexecução de amostra aleatória** | Probabilístico (a amostragem certa) |
| **Compute não-determinístico** (IA, análise) | **Aceitação do solicitante** + reputação | Mercado de reputação (locação de tempo de máquina) |

O seed de amostragem deriva do `output_digest`/beacon, **nunca** de um
contador que o ator incrementa (anti-grinding). Texto normativo:
`rfc-v4.md §3.3`.

---

## A aresta `CONTRIBUTES`

A contribuição verificável é registrada no grafo pela aresta
[[contributes-aresta]] (`CONTRIBUTES`) emitida por `PROFILE:SYSTEM` em
direção à prova de contribuição. O campo `kind` no atributo diferencia os
três tipos físicos (`serve | store | compute`); as regras de validação,
criptografia e sincronização são idênticas entre eles — exatamente o
critério de "mesmo tipo diferenciado por payload" (`rfc-v4.md §3.2`).

Granularidade de registro: **sessão/época**, não por chunk (recibos por
chunk são efêmeros e consolidados antes de ir ao grafo).

---

## Relação com standing

O [[standing]] <!-- Foam placeholder — verbete Onda 10 --> acumulado é um
`ASSET:BALANCE_STATE` governado por SPEC de contribuição. A aresta de
contribuição está para esse saldo como `TRANSFERRED_TO` está para o saldo
de dinheiro — zero tipo de nó novo, mesmo code path de qualquer saldo
(`rfc-v4.md §3.3`).

---

## Medição é do core; liquidação é da SPEC

A distinção canônica, conforme [[economia-como-modulo]]:

- **Core entrega a medição verificável**: recibos, provas de storage,
  amostras de compute — um registro assinado e auditável de trabalho feito.
- **Liquidação** (converter em crédito interno, fiat ou reputação) é
  decisão de [[specification]] (Zen Engine), por rede/módulo.

A regra "contribuição → crédito" é procedimento na SPEC, não no core.
(`rfc-v4.md §4.1`)

---

## Integridade do agente e desafio-canary

Falha de integridade é detectada *pós-hoc*: um agente adulterado falha o
[[desafio-canary]] <!-- Foam placeholder — verbete Onda 10 -->,
instrumento de auditoria proativa que injeta tarefas de gabarito
conhecido, indistinguíveis do trabalho real. Forte para trabalho
determinístico, storage e banda; fraco para compute não-determinístico.
Texto normativo: `rfc-v4.md §2.7` e
`caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`.

---

## Relação com defesa Sybil

A economia de contribuição **não substitui** a defesa Sybil. Contribuição
só conta servindo contrapartes distintas e independentemente reputadas;
1 000 Sybils servindo uns aos outros gera ~0 de standing
(`rfc-v4.md §4.2`). A defesa primária é o custo de identidade, separada
da economia. Ver [[economia-como-modulo]].

---

## Conceitos relacionados

- [[agente-de-sistema]] — executor da medição verificável no device
- [[contributes-aresta]] — aresta `CONTRIBUTES` que registra a contribuição
- [[standing]] <!-- Foam placeholder — verbete Onda 10 --> — saldo de contribuição acumulado (`ASSET:BALANCE_STATE`)
- [[desafio-canary]] <!-- Foam placeholder — verbete Onda 10 --> — mecanismo de auditoria pós-hoc do agente
- [[economia-como-modulo]] — princípio que separa medição (core) de liquidação (SPEC)
- [[spends]] <!-- Foam placeholder — verbete Onda 10 --> — aresta de débito sobre um ASSET
- [[credits]] <!-- Foam placeholder — verbete Onda 10 --> — aresta de crédito sobre um ASSET
- [[reputacao-local]] <!-- Foam placeholder — verbete Onda 10 --> — consequência subjetiva; scores ficam locais
- [[fato-negativo-verificavel]] <!-- Foam placeholder — verbete Onda 10 --> — mau ato re-checável por qualquer um
- [[profile-system]] — tipo ontológico do agente emissor da aresta CONTRIBUTES


