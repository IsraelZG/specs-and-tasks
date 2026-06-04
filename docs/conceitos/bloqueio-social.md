---
name: bloqueio-social
title: "Bloqueio Social"
aliases: ["bloqueio social", "social block", "filtro de leitura social"]
tags: [protocol, identidade, controle-de-acesso, bloqueio-social, v4, hub]
---

# Bloqueio Social

**Modo hub** — definição normativa completa em `rfc-v4.md §2.8`.

---

## O que é

Bloqueio social é o mecanismo de supressão de visibilidade aplicado a conteúdo de **audiência pública**. Ao contrário do bloqueio criptográfico (usado para DMs e perfis privados), o bloqueio social é um **filtro de leitura** avaliado na montagem do feed, não uma garantia criptográfica.

Conforme `rfc-v4.md §2.8` (Apêndice B):

> **Bloqueio Social** — Filtro de leitura sobre arestas `BLOCKS` para conteúdo público; não é garantia criptográfica.

O princípio normativo que o fundamenta, conforme `rfc-v4.md §2.8`:

> *privacidade criptográfica exige audiência limitada; conteúdo público recebe apenas bloqueio social.*

## Por que não é criptográfico

Para conteúdo público (chave universal), o bloqueio criptográfico é inviável: uma chave em milhões de mãos é trivialmente redistribuída a um bloqueado. Tornar a chave escassa por-espectador forçaria um custódio online por leitura, contradizendo a tese [[local-first]] <!-- Foam placeholder — verbete Onda 12 -->/P2P.

Conforme `rfc-v4.md §2.8`, a tabela de audiências e força de bloqueio:

| Audiência | Modelagem | Força do bloqueio |
| :--- | :--- | :--- |
| **DM** (2 pessoas) | Grupo de 2, chave de época | E2E forte |
| **Seguidores de X** (perfil privado) | `PROFILE:ORGANIZATION` "seguidores de X", chave de época do grupo, `ASSET:PERMISSION` sobre o subgrafo | **Criptográfico** (chave-na-emissão com [[predicado-de-bloqueio]] + TTL) |
| **Feed Público** | `PROFILE:ORGANIZATION` global, **um** `ASSET:PERMISSION` global de leitura; bloqueio = filtro de leitura sobre arestas `BLOCKS` limitadas | **Social** — gateia primeira emissão (eleva a barra), não é garantia criptográfica |

## Como funciona

Conforme `rfc-v4.md §2.8`:

> Bloqueio do feed público: **uma** `ASSET:PERMISSION` global (O(1), não O(usuários) arestas), e o bloqueio como **arestas `BLOCKS` de X → Y** (limitadas — dezenas, não milhões), avaliadas na montagem do feed. Acesso (sou membro?) e bloqueio (este autor deve ser filtrado da minha visão?) ficam separados; não se bake o bloqueio na query do asset compartilhado.

O ponto central é a **separação de responsabilidades**:

- **Acesso** ("sou membro?") — controlado por `ASSET:PERMISSION` (O(1), uma entrada global).
- **Bloqueio** ("este autor deve ser filtrado?") — controlado pelas arestas [[blocks-aresta]] (`BLOCKS`) do perfil solicitante (conjunto limitado, avaliado por quem monta o feed).

Isso evita que o bloqueio seja "assado" na query do asset compartilhado e preserva a semântica de permissão global eficiente.

## Relação com blocks-aresta e predicado-de-bloqueio

O bloqueio social é a **experiência/política de nível mais alto**. As peças que o implementam são:

| Conceito | Papel |
|:---|:---|
| [[blocks-aresta]] (`BLOCKS`) | A aresta de grafo que registra "X bloqueou Y". Conjunto limitado, avaliado no feed público. |
| [[predicado-de-bloqueio]] | A condição lógica avaliada pelo [[key-vault]] para **audiência limitada** (DM, seguidores). Substitui [[rotacao-de-epocas]] como mecanismo de bloqueio. |
| **bloqueio-social** (este verbete) | A política de filtro de leitura para **audiência pública**, onde o bloqueio criptográfico não é viável. |

Em suma: o [[predicado-de-bloqueio]] serve para audiências limitadas (criptográfico); o bloqueio social serve para audiência pública (filtro de leitura).

## Limites honestos

O bloqueio social não impede que um insider repasse conteúdo ao bloqueado. Conforme `rfc-v4.md §2.8` e o princípio de [[honestidade-radical]] <!-- Foam placeholder — verbete Onda 12 -->:

> O sistema eleva o custo de trapacear, não o elimina.

O bloqueio social "gateia a primeira emissão" — eleva a barra para quem está bloqueado publicar ou interagir — mas não oferece garantia absoluta de isolamento.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[profile]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[chave-de-epoca]] | 1 | criado |
| [[rotacao-de-epocas]] | 1 | criado |
| [[key-vault]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[blocks-aresta]] | 3 | criado |
| [[predicado-de-bloqueio]] | 3 | criado |
| [[local-first]] | 12 | placeholder |
| [[honestidade-radical]] | 12 | placeholder |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `rfc-v4.md` | `§2.8` | Fonte canônica — acrescentar wikilink `[[bloqueio-social]]` onde o conceito é nomeado |
| `caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | `§2.2.1` | Substituir referência inline por `[[bloqueio-social]]` |
| `docs/glossary.md` | `§BLOCKS (v4)` | Acrescentar link `[[bloqueio-social]]` na entrada |
