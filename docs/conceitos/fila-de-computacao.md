---
name: fila-de-computacao
title: "Fila de Computação"
aliases: ["fila de computação", "task queue", "modo assíncrono"]
tags: [sdk, plugins, computacao, assincrono]
---

# Fila de Computação

## Definição

A fila de computação é o modo assíncrono de invocação de capacidades `compute`. A invocação materializa uma **task = nó** governada por SPEC. Um worker elegível **reivindica via [[asset-lock]]**; a [[serialization-por-linhagem]] garante que dois workers não peguem a mesma task. O resultado é publicado como nó assinado pela persona do executor. O contrato completo está em `caderno-3-sdk/12-plugins-e-computacao.md §5`.

## Unificação

Geração de renditions (transcode), [[consolidacao-de-live]] e embeddings são **instâncias do modo assíncrono** deste protocolo.

## Ver também
- [[plugin]] — Unidade distribuível
- [[asset-lock]] — Mecanismo de claim
