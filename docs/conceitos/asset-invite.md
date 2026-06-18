---
name: asset-invite
title: "ASSET:INVITE"
aliases: ["ASSET:INVITE", "convite", "convite de onboarding"]
tags: [protocol, asset, identidade, sybil, web-of-trust]
---

# ASSET:INVITE

**Modo canonical** — fontes normativas: `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.4.4` e
`rfc-v4.md §4.2`. Glossário (`glossary.md §ASSET:INVITE`) consolidado aqui.

> Aparições consolidadas:
> - `glossary.md §ASSET:INVITE` — definição curta; canonical aqui.
> - `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.4.4` — payload, cerimônia de consumo e limites honestos (fonte normativa principal).
> - `rfc-v4.md §4.2` — papel na defesa Sybil e gate por standing (fonte normativa complementar).

---

## O que é

`ASSET:INVITE` é um nó consumível do grafo — subtipo de [[asset]] — que concede
o direito de **criar cadastro** (`PROFILE:AUTHENTICATION`) sob web-of-trust.
É **bearer, single-use e de expiry curto**, assinado pelo convidante.

Embute um `multiaddr` para o primeiro contato, mas seu propósito central é a
criação de identidade avalizada — o que o distingue do [[link-multiaddr]], que
é artefato de conectividade pura sem concessão de identidade.

O saldo de convites disponíveis é finito e a emissão é **gateada por
standing** (contribuição acumulada à rede), tornando o `ASSET:INVITE` o
rate-limiter primário contra proliferação de identidades (defesa Sybil).

---

## Payload (RFC §2.4.4)

Texto literal da fonte normativa (`caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.4.4`):

```
{ multiaddr/rendezvous hints, invite_code (aponta ao ASSET:INVITE no grafo),
  inviter_peer_id, assinatura do inviter, expiry }
```

---

## Cerimônia de consumo (RFC §2.4.4)

Reproduzido literalmente de `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.4.4`:

> invitee conecta → Noise_XX → apresenta `invite_code` → inviter/peer‑do‑sistema
> valida que o `ASSET:INVITE` está não‑gasto → invitee cria
> `PROFILE:AUTHENTICATION` → grava aresta `VOUCHES_FOR` (inviter → invitee,
> staking social) + convite vira lápide.

Propriedades após o consumo: o asset vira lápide ([[tombstone-lapide]]),
tornando o consumo irreversível e detectável por qualquer peer.

---

## Limite honesto (RFC §2.4.4)

Texto literal da fonte normativa:

> Bearer, single‑use, expiry curto, assinado. Limite honesto: convite
> interceptado = conta avalizada pelo inviter — risco contido pela exposição
> de reputação do inviter, não eliminável.

---

## Papel na defesa Sybil (RFC-v4 §4.2)

Texto literal de `rfc-v4.md §4.2`:

> **Convite-como-`ASSET:INVITE`**: saldo finito, emissão restrita, **gateada
> por standing** (mais convites por ser bom cidadão). Converte "100 identidades
> já" em "fluxo lento gateado por contribuição real". Rate limiter, não muro.

A responsabilização do convidante funciona como staking social: quem convida
alguém que comete mau ato verificável leva o golpe de reputação. Não é
garantia criptográfica, mas eleva o custo econômico de identidades múltiplas
sob um único convidante.

---

## Contexto de uso: bootstrap frio absoluto (RFC §2.4.1)

O `ASSET:INVITE` é um dos canais out-of-band válidos no estado frio absoluto
(primeiro login sem grafo, sem histórico de peers). Ao lado de mDNS, link
multiaddr e URL do peer do sistema, é o único mecanismo que também cria
identidade — os demais apenas estabelecem conectividade.

---

## Conceitos relacionados

- [[asset]] — tipo-pai ontológico
- [[profile-authentication]] — nó criado pelo invitee ao consumir o convite
- [[standing]] <!-- Foam placeholder — verbete Onda 10 -->
- [[noise-xx]] — handshake usado durante a cerimônia de consumo
- [[ucan]] — capabilidade que autoriza o convidante a emitir convites
- [[tombstone-lapide]] <!-- Foam placeholder — verbete Onda 7 -->
- [[link-multiaddr]] — artefato de conectividade pura; distinto do convite
- [[defesa-sybil]] <!-- Foam placeholder — verbete Onda 10 -->
- [[bond-caucao]] <!-- Foam placeholder — verbete Onda 10 -->
- [[asset-reputation]] <!-- Foam placeholder — verbete Onda 10 -->


