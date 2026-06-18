---
name: jurisdicao
title: "Jurisdição"
aliases: ["jurisdição", "jurisdiction", "regionalização de regras", "multi-jurisdição"]
tags: [sdk, jurisdicao, erp, fintech, compliance]
---

# Jurisdição

## Definição

Jurisdicão é uma dimensão de contexto (como `locale`, `theme`) que seleciona *qual variante de regra* um validador aplica. É um identificador hierárquico (`BR`, `BR-SP`, `US`, `EU`, …). O contrato completo está em `caderno-3-sdk/13-jurisdicao.md`.

## Resolução Multi-Jurisdição por Papel

Não existe "a" jurisdição da operação — existe a jurisdição por papel. Cada aspecto regulado tem uma âncora: tributo de origem, tributo de destino, regra trabalhista, proteção de dados, Merchant of Record (MoR). Ver `caderno-3-sdk/13-jurisdicao.md §5`.

## Ver também
- [[spec-jurisdicional]] — Base + variante por `EXTENDS`
- [[vigencia-de-regra]] — Competência temporal
- [[conector-externo]] — Roteamento de conector por jurisdição
