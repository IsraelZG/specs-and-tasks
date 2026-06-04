---
name: asset-lock
title: "ASSET:LOCK"
aliases: ["ASSET:LOCK", "asset lock", "reserva temporária", "lock TTL"]
tags: [protocol, transacoes, saga, asset]
---

# ASSET:LOCK

**Modo hub** — definição normativa completa em
`caderno-2-protocol/01-graph-ontology.md §3.3` e em
`rfc-transacoes-multidominio.md §2`.

> Aparições consolidadas:
> - `glossary.md §ASSET:LOCK como Reserva` — repete a semântica; canonical aqui.
> - `rfc-transacoes-multidominio.md §2` — define o papel nas sagas com TTL (fonte normativa complementar).
> - `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.3` — nota de implementação (tabela `asset_balances`).

---

## O que é

`ASSET:LOCK` é um nó temporário do grafo — subtipo de [[asset]] — que representa
a **reserva de um recurso com prazo de expiração (TTL)**. É a primitiva que
permite compor operações multi-domínio sem introduzir nenhum tipo de nó novo:
o lock **ancora no head específico** do recurso via aresta `SPENDS` (herdando
a detecção estrutural de conflito já existente), e expira via lápide/GC quando
o TTL vence.

Definição canônica (do inventário, `caderno-2-protocol/01-graph-ontology.md §3.3`):

> `ASSET:LOCK` — Reserva temporária de recurso com TTL (participante de sagas
> multidomínio; ver rfc-transacoes-multidominio.md §2).

---

## Papel nas sagas multidomínio

O detalhamento normativo da semântica de reserva/saga está em
`rfc-transacoes-multidominio.md §2` (Tier 1) e §3 (Tier 2). Em resumo:

- **Reservar uma perna**: uma operação não-comutativa cujo *output*, em vez de
  transferência final, é um `ASSET:LOCK` temporário. O lock ancora no head do
  recurso via `SPENDS`.
- **Confirmar uma perna**: op que consome o lock e materializa o efeito real
  (transferência/crédito).
- **Expiração automática**: o TTL é um predicado adjudicado pelo validador-dono
  da linhagem; vencido sem confirmação, o lock vira lápide e o head é liberado.
  A expiração **é a compensação automática** — sem coordenador vivo.

Para a regra de corrida confirm-vs-expira e a adjudicação pelo validador-dono
da linhagem, ver `rfc-transacoes-multidominio.md §5.1`.

---

## Implementação local (SDK)

A tabela `asset_balances` mantém saldos sob reserva bloqueados enquanto o lock
está ativo; a confirmação do lock materializa o efeito final. Ver nota em
`caderno-3-sdk/01-sqlite-and-projections-schema.md §3.3`.

---

## Conceitos relacionados

- [[asset]] — tipo-pai ontológico
- [[asset-balance-state]] — saldo que permanece bloqueado durante o lock
- [[content-intent]] — intent que gera o lock via aresta `SPENDS`
- [[tombstone-lapide]] <!-- Foam placeholder — verbete Onda 7 -->
- [[saga]] <!-- Foam placeholder — verbete Onda 9 -->
- [[2pc-com-lock-ttl]] <!-- Foam placeholder — verbete Onda 9 -->
- [[politica-de-ttl]] <!-- Foam placeholder — verbete Onda 9 -->
- [[linhagem-de-versoes]]
