---
name: agente-de-ia
title: "Agente de IA"
aliases: ["agente de ia", "AI agent", "agente inteligente", "persona delegada IA"]
tags: [sdk, ia, agentes, rag]
---

# Agente de IA

## Definição

Um agente de IA atua no grafo exclusivamente via `CONTENT:INTENT`, com `ASSET:ROLE` delegado e escopado pelo principal que o instanciou. O agente não consegue fazer nada que seu principal não pudesse fazer. O contrato completo está em `caderno-3-sdk/14-ia-rag-e-agentes.md §5`.

## Ver também
- [[agente-de-sistema]] — Atua em nome da plataforma (distinto do agente de IA)
- [[recuperacao-hibrida]] — Substrato de retrieval
- [[command-palette]] — Superfície primária de invocação
- [[plugin]] — Capacidades (mãos, cérebro, contexto) são injetadas por plugins; o `ASSET:ROLE` do plugin invocado intersecta o do agente, nunca o excede
