---
name: profile-persona
title: "PROFILE:PERSONA (Máscara Pública Operacional)"
aliases: ["PROFILE:PERSONA", "persona", "máscara pública", "identidade operacional"]
tags: [protocol, identidade, perfil]
---

# PROFILE:PERSONA

> **Modo canonical** — definição canônica extraída de
> `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.3`.
> Aparição secundária consolidada: `glossary.md §PERSONA`; `caderno-2-protocol/01-graph-ontology.md §3.1`.

---

## Definição

`PROFILE:PERSONA` são as **identidades operacionais visíveis** que um humano
projeta para os outros peers da rede — por exemplo: Persona Pessoal, Persona
Criador, Persona Profissional. Um mesmo usuário pode ter múltiplas personas
simultâneas.

A ligação causal entre a [[profile-authentication|PROFILE:AUTHENTICATION]]
primária e a persona correspondente tem **visibilidade restrita ao grafo local
do usuário**. Outros peers visualizam apenas a `PROFILE:PERSONA` ativa na
coluna de layout — nunca a âncora subjacente.

## Papel na ontologia do grafo

`PROFILE:PERSONA` é subtipo de [[profile]]. Como todo PROFILE, possui par de
chaves Ed25519 e atua como sujeito de ações (emite arestas `AUTHORED`,
`APPROVED_BY`, `SIGNED_BY`; recebe arestas `PARTICIPATES_IN`, `OWNS`).

> Contexto completo dos subtipos de PROFILE em
> `caderno-2-protocol/01-graph-ontology.md §3.1`.

## Identidade de rede derivada

Cada `PROFILE:PERSONA` possui um identificador de rede ([[peer-id]]) derivado
deterministicamente de sua chave pública:

$$\text{PeerId} = \text{blake2s256}(\texttt{PROFILE:PERSONA\_PUB\_KEY})$$

A derivação é **auto-certificável**: o handshake exige desafio-resposta provando
posse da chave privada antes de qualquer troca de dados, eliminando *spoofing*.
Auto-certificação resolve *spoofing*, não ataques Sybil — resistência a Sybil é
responsabilidade do modelo de acesso por convite/web-of-trust da rede.

> Protocolo de handshake completo ([[noise-xx]]): ver
> `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.4.1`.

## Delegação corporativa

Em redes corporativas, uma `PROFILE:ORGANIZATION` pode emitir uma
`PROFILE:PERSONA` para um cargo (ex: "Gerente Financeiro") e delegá-la
temporariamente a um funcionário via aresta `DELEGATED_TO`. Ao desligar o
funcionário, a empresa revoga o ativo; a persona e seu histórico permanecem sob
propriedade institucional.

> Detalhes normativos: `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.5`
> (conceito [[delegacao-persona-corporativa]] — Foam placeholder, verbete futuro).

## Conceitos relacionados

- [[profile]] — tipo-pai; define o comportamento de emissão e recebimento de arestas
- [[profile-authentication]] — identidade-âncora que gera a persona; ligação restrita ao grafo local
- [[peer-id]] — identificador de rede derivado da chave pública da persona
- [[noise-xx]] — handshake que autentica a conexão usando a chave da persona
- [[ucan]] — tokens de autorização emitidos e delegados pela persona
- [[profile-system]] <!-- Foam placeholder — verbete Onda 3 -->
- [[delegacao-persona-corporativa]] <!-- Foam placeholder — verbete futuro -->
