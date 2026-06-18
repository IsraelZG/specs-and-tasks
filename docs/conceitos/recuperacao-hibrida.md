---
name: recuperacao-hibrida
title: "Recuperação Híbrida (RRF + GraphRAG)"
aliases: ["recuperação híbrida", "RRF", "GraphRAG", "retrieval híbrido"]
tags: [sdk, ia, rag, busca]
---

# Recuperação Híbrida

## Definição

Recuperação combina três sinais por Reciprocal Rank Fusion (RRF): léxico (`search_index_fts`), semântico (`vector_index`) e estrutural (traversal de arestas). Apenas recupera nós que o principal poderia ler. O contrato completo está em `caderno-3-sdk/14-ia-rag-e-agentes.md §3`.

## Ver também
- [[agente-de-ia]] — Usa recuperação híbrida como contexto
- [[utilitario-de-ia]] — Embedding como capacidade compute
