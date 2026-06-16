---
name: sessao-colaborativa
title: "Sessão Colaborativa"
aliases: ["sessão colaborativa", "sessão de módulo", "doc colaborativo de sessão"]
tags: [sdk, modulos, automerge, colaboracao]
---

# Sessão Colaborativa

## Definição

Uma sessão de módulo onde ocorre edição é modelada como um **documento colaborativo Automerge efêmero e local-first** por padrão. O compartilhamento e persistência no grafo de dados duráveis dependem de um **opt-in** do usuário (gênese de rascunhos, publicação). O profile do módulo atua como um co-editor que propõe alterações via `CONTENT:INTENT`. O contrato completo está em `caderno-4-governance/02b-modulos-profiles-mensageria.md §4`.

## Ver também
- [[modulo-lente-e-ator]] — Diferença entre lente (leitura) e ator (sessão/comando)
- [[spec-page]] — Páginas de leitura pura não usam sessões CRDT
- [[maquina-rasa]] — Máquinas de estado de workflow governando as sessões
