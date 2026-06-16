---
name: modulo-lente-e-ator
title: "Módulo como Lente e Ator"
aliases: ["módulo lente e ator", "lente e ator", "plano de dados e comando"]
tags: [governance, modulos, arquitetura]
---

# Módulo como Lente e Ator

## Definição

O módulo é modelado em dois planos ortogonais:
- **Plano de dados (Lente):** módulos compartilham nós do grafo diretamente. A integração é via projeção e compartilhamento de nós, sem APIs entre módulos.
- **Plano de comando (Ator):** o módulo tem um `PROFILE` e recebe mensagens (intents duráveis ou sinais efêmeros) para agir e coordenar comportamento.

O contrato completo está em `caderno-4-governance/02b-modulos-profiles-mensageria.md`.

## Ver também
- [[profile-de-modulo]] — Instanciação por usuário e escopo
- [[sessao-colaborativa]] — Estado de edição
- [[spec-workspace]] — Agrupamento de painéis de módulos no shell
