---
name: asset-reputation
title: "ASSET:REPUTATION"
aliases: ["asset reputation", "reputação de perfil", "ASSET:REPUTATION"]
tags: [vision, asset, reputacao, identidade, rede-publica]
---

# ASSET:REPUTATION

> **Modo canonical** — definição única aqui. Fonte consolidada:
> `caderno-1-vision/01-vision-and-positioning.md §4.1`.
> Onda 10. Sem outras aparições com redefinição substancial.

---

## Definição

**ASSET:REPUTATION** é o subtipo de nó `ASSET` que representa o sinal de
reputação pública acumulado de um perfil em uma rede. Em redes públicas de livre
adesão, ele compõe — junto com auto-atestação, KYC opcional e curadoria — o
mecanismo de verificação de identidade.

Texto canônico (`caderno-1-vision/01-vision-and-positioning.md §4.1`):

> "Usuários criam livremente seu `PROFILE:AUTHENTICATION`. A verificação combina
> auto-atestação, reputação (`ASSET:REPUTATION`), KYC opcional e curadoria."

---

## Por quê → [[modalidade-de-rede]]

Em redes de livre adesão — sem custo de criação de identidade — a verificação
precisa de sinais que não dependam de terceiros confiáveis únicos. `ASSET:REPUTATION`
é esse sinal: cresce com participação verificável e decai com comportamento
negativo, tornando identidades valiosas custosas de construir e fáceis de perder.
É especialmente relevante na [[modalidade-de-rede#1-rede-pública|rede pública]], em contraste com a
[[rede-corporativa-whitelabel]] (onde a identidade é provisionada centralmente via
SSO/AD) e a rede P2P pura (onde não há autoridade de verificação).

---

## Contrato → [[asset]]

`ASSET:REPUTATION` é um subtipo de [[asset]]: usa o mesmo código de caminho de
qualquer saldo (`ASSET:BALANCE_STATE`) e é governado por uma
[[specification]] que define as regras de acúmulo e decaimento.

Distinções em relação a conceitos vizinhos:

| Conceito | Natureza | Replicado? | No grafo? |
|:---|:---|:---|:---|
| `ASSET:REPUTATION` | Ativo de reputação pública | Sim | Sim |
| [[reputacao-local]] | Score subjetivo de primeira mão | Nunca | Não |
| [[standing]] | Saldo de contribuição verificável | Sim | Sim (`ASSET:BALANCE_STATE`) |

`ASSET:REPUTATION` é o sinal público de reputação — visível por outros perfis —
enquanto [[reputacao-local]] é a avaliação privada e não-transitiva que cada peer
faz dos seus pares diretos.

<!-- TODO(revisar): a SPEC que governa o acúmulo/decaimento de ASSET:REPUTATION
não está documentada nas fontes canônicas disponíveis. Verificar se existe
SPECIFICATION específica ou se o mecanismo é definido por rede. -->

---

## Implementação → [[specification]]

Como todo `ASSET`, as regras de acúmulo, decaimento, visibilidade e threshold de
verificação são declaradas em uma [[specification]] interpretada pelo
[[zen-engine]]. O core registra os eventos; a SPEC liquida o impacto na reputação
— mesma separação de [[economia-como-modulo]].

---

## Evolução → [[defesa-sybil]]

Em redes públicas, `ASSET:REPUTATION` tem papel secundário na [[defesa-sybil]]:
reputação custosa de acumular torna identidades Sybil de baixo valor menos úteis.
O mecanismo primário continua sendo o custo de criação de identidade via
[[asset-invite]].

---

## Conceitos relacionados

- [[asset]] — tipo ontológico raiz do qual `ASSET:REPUTATION` é subtipo
- [[reputacao-local]] — avaliação privada de primeira mão; não replicada; distinta da reputação pública
- [[standing]] — saldo de contribuição verificável; par objetivo de reputação
- [[modalidade-de-rede]] — contexto onde `ASSET:REPUTATION` é mais relevante (rede pública)
- [[asset-invite]] — mecanismo de custo de entrada; complementa a reputação na defesa Sybil
- [[defesa-sybil]] — uso de reputação como barreira contra identidades Sybil
- [[economia-como-modulo]] — padrão arquitetural: core mede, SPEC liquida
- [[specification]] — onde a política de acúmulo/decaimento é declarada
