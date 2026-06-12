---
name: defesa-sybil
title: "Defesa Sybil (v4)"
aliases: ["Defesa Sybil", "Sybil defense", "resistência Sybil", "anti-Sybil"]
tags: [governance, identidade, economia, sybil, v4, web-of-trust]
---

# Defesa Sybil (v4)

> **Modo canonical** — definição única aqui. Fonte normativa:
> `rfc-v4.md §4.2` (texto integral reproduzido nas seções abaixo).
> Lente principal: governance.

---

## Definição

**Defesa Sybil** é o conjunto de mecanismos que torna economicamente inviável
(ou de retorno nulo) a criação de múltiplas identidades falsas para subverter
a rede. A defesa **não é** eliminação de Sybils — é torná-los irrelevantes.

Princípio fundamental (`rfc-v4.md §4.2`):

> "A defesa **primária** é o **custo de criação de identidade** (v3.1 §1.4),
> **separado da economia**. A economia só mede contribuição; ela coludiria
> se fosse a defesa (Sybils contribuindo entre si)."

E no quadro de princípios (`rfc-v4.md §1.2`):

> "Sybil é problema de identidade, não de economia."

---

## O stack de mecanismos (P2P puro — opt-in via SPEC)

Texto normativo de `rfc-v4.md §4.2`, reproduzido literalmente:

> - **Convite-como-`ASSET:INVITE`**: saldo finito, emissão restrita,
>   **gateada por standing** (mais convites por ser bom cidadão). Converte
>   "100 identidades já" em "fluxo lento gateado por contribuição real".
>   Rate limiter, não muro.
> - **Responsabilização do convidante (staking social)**: convidou quem
>   comete mau ato verificável → sua reputação leva o golpe.
> - **Irrelevância por diversidade**: contribuição só conta servindo
>   contrapartes **distintas e independentemente reputadas**. 1000 Sybils
>   servindo uns aos outros = ~0 de standing. Mata a fome, não a existência.
> - **Bond/caução para papéis privilegiados** (validador/custódio): mau
>   comportamento corta a caução. É aqui que a economia ganha papel de
>   **segurança** legítimo — bonding, não gating de participação básica.
> - **Detecção topológica** (SybilGuard/SybilLimit): real mas pesada, exige
>   visão quase-global — natural como add-on da **autoridade** (mais um
>   recurso das modalidades gerenciadas).

---

## Teto honesto

Texto normativo de `rfc-v4.md §4.2`:

> "**Teto honesto:** nenhum sistema P2P puro resolve Sybil sem âncora
> confiável ou recurso real-escasso. A alegação correta é 'resistente o
> bastante para ser padrão-ouro e servir deployments tolerantes a confiança',
> **não** 'Sybil-proof'. Em redes comerciais, Sybil está resolvido na porta
> (identidade verificada)."

---

## Por modalidade de rede

Tabela de `rfc-v4.md §4.4`:

| Modalidade | Mecanismo de identidade / Sybil |
| :--- | :--- |
| P2P Puro | Autogerada; convite-como-asset + diversidade + bond |
| Pública | Validada por autoridade (resolvido na porta) |
| Corporativa | SSO (resolvido na porta) |

Em redes públicas e corporativas, a defesa Sybil está na camada de
onboarding (identidade verificada externamente), não no stack interno.
Os mecanismos desta seção são **módulos opt-in via SPEC**, nunca
baixados no core de todo deployment (`rfc-v4.md §1.4`):

> "Toda complexidade que só serve ao P2P puro (defesa Sybil pesada,
> convite-como-asset, detecção topológica) é **módulo opt-in via SPEC**,
> nunca baixada no core de todo deployment."

---

## Separação entre economia e identidade

A distinção é estrutural e inviolável. Da tabela de princípios
(`rfc-v4.md §1.2`):

> "PCR como defesa Sybil → **Defesa Sybil separada da economia; economia
> só mede contribuição**. PCR coludia (Sybils auditando uns aos outros);
> Sybil é problema de identidade, não de economia."

[[contribuicao-verificavel]] pressupõe a camada de identidade; não a
substitui. [[economia-como-modulo]] (medir no core, liquidar na SPEC)
não é, por si só, defesa Sybil — é a separação que torna a economia
resistente à colusão.

---

## Conceitos relacionados

- [[asset-invite]] — artefato consumível que implementa o rate limiter de identidade; emissão gateada por [[standing]]
- [[bond-caucao]] — caução para papéis privilegiados; único ponto onde a economia tem papel de segurança legítimo (será criado a seguir)
- [[standing]] — saldo de contribuição que gatea a emissão de convites; 1000 Sybils servindo uns aos outros geram ~0 de standing
- [[reputacao-local]] — staking social: convidante sofre golpe de reputação por mau ato do convidado
- [[contribuicao-verificavel]] — contribuição só conta servindo contrapartes distintas e independentemente reputadas
- [[economia-como-modulo]] — separação medição (core) / liquidação (SPEC); a economia não é a defesa Sybil
- [[fato-negativo-verificavel]] — mau ato verificável que dispara responsabilização do convidante
- [[agente-de-sistema]] — executor da medição de contribuição que torna a irrelevância por diversidade mensurável
- [[modalidade-de-rede]] — P2P puro vs. pública vs. corporativa; nível de defesa difere por modalidade
