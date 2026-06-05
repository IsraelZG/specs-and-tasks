---
name: reputacao-local
title: "Reputação Local (v4)"
aliases: ["reputação local", "local reputation", "peer reputation", "Reputação Local v4"]
tags: [protocol, economia, agente, v4, reputacao]
---

# Reputação Local (v4)

> **Modo hub** — este verbete resume e linka. Conteúdo normativo completo em
> `rfc-v4.md §3.4` e `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.6`.
> Aparições consolidadas: `glossary.md §Reputação Local (v4)`.

---

## Definição

**Reputação local** é a avaliação de primeira mão, não-transitiva e
não-replicada que cada peer faz dos peers com quem teve contato direto.

> Definição canônica (`rfc-v4.md §3.4`, glossário):
>
> "Avaliação de primeira mão, não-transitiva, não-replicada, que cada peer
> faz dos peers com que teve contato. Scores ficam locais; só fatos negativos
> verificáveis vão ao grafo."

---

## Propriedades fundamentais

Conforme `rfc-v4.md §3.4`:

- **Projeção local não-replicada** (no estilo [[relay-trust-model]]): local,
  de primeira mão, **não-transitiva**.
- **[[fato-negativo-verificavel|Fatos negativos verificáveis]]** <!-- Foam placeholder — verbete Onda 10 -->
  vão ao grafo como `CONTENT` autocomprovável (§2.5), re-checáveis e
  falsificáveis (acusação falsa é autopunitiva via `APPEAL` re-verificado).
  **Scores subjetivos ficam locais.**
- **Due-diligence escala com stake**: antes de op não-comutativa de alto
  valor, o peer consulta os fatos-negativos-verificáveis da contraparte e
  re-verifica; para interação de baixo valor, não se incomoda.
- **Peer sem histórico** → cautela estrutural (limites conservadores, custódia
  restrita), não palpite. Em rede com autoridade, o **onboarding da autoridade
  é o bootstrap**.
- Atestações de terceiros = **dicas ponderadas** pela confiança de primeira
  mão no atestador; um novato pondera tudo perto de zero e cai nos fatos
  verificáveis.

> Texto normativo integral: `rfc-v4.md §3.4`.

---

## Schema SQLite (`peer_reputation`)

Conforme `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.6`:

> Reputação de primeira mão, não-transitiva (estilo `RelayTrustModel`).
> Scores **não** vão ao grafo; apenas **fatos negativos verificáveis** são
> persistidos como `CONTENT`. Nunca sincronizada.

```sql
CREATE TABLE peer_reputation (
  peer_id TEXT PRIMARY KEY,
  first_hand_score REAL NOT NULL DEFAULT 0,
  observed_consistent INTEGER NOT NULL DEFAULT 0,
  observed_inconsistent INTEGER NOT NULL DEFAULT 0,
  last_hlc INTEGER
);
```

> Definição completa do schema: `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.6`.

---

## Relação com Standing e Fatos Negativos

| Dado | Onde fica | Replicado? |
|:---|:---|:---|
| Score subjetivo (`first_hand_score`) | `peer_reputation` (local) | Nunca |
| Contagens de consistência | `peer_reputation` (local) | Nunca |
| [[fato-negativo-verificavel]] <!-- Foam placeholder — verbete Onda 10 --> | `CONTENT` no grafo | Sim — re-verificável por qualquer um |
| [[standing]] <!-- Foam placeholder — verbete Onda 10 --> | `ASSET:BALANCE_STATE` | Sim |

A assimetria é intencional: scores são subjetivos e não-auditáveis; fatos
negativos têm prova embutida e podem ser re-checados por terceiros, logo
merecem persistência no grafo.

---

## Consequência para agentes desonestos

Conforme `rfc-v4.md §1.2`:

> "Um agente adulterado que mente é detectado *pós-hoc* nas dimensões
> verificáveis (falha o desafio de storage, não tem recibo de contraparte,
> falha a amostra de recálculo) → sua reputação local cai em todo peer
> honesto → é despriorizado e não remunerado."

Ver mecanismo de detecção em [[desafio-canary]] <!-- Foam placeholder — verbete Onda 10 -->.

---

## Conceitos relacionados

- [[agente-de-sistema]] — sujeito monitorado; comportamento detectado alimenta a reputação local
- [[fato-negativo-verificavel]] <!-- Foam placeholder — verbete Onda 10 --> — mau ato auditável que vai ao grafo
- [[desafio-canary]] <!-- Foam placeholder — verbete Onda 10 --> — mecanismo de detecção pós-hoc de desonestidade
- [[standing]] <!-- Foam placeholder — verbete Onda 10 --> — saldo de contribuição acumulado; distinto da reputação local
- [[relay-trust-model]] — modelo de confiança de relay que inspirou o design não-transitivo
- [[comutativo-vs-nao-comutativo]] — escala de due-diligence depende do tipo de operação
