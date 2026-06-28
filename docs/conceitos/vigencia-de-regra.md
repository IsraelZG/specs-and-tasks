---
name: vigencia-de-regra
title: "Vigência de Regra"
aliases: ["vigência de regra", "competência", "regra temporal", "validade de lei"]
tags: [sdk, jurisdicao, temporal, compliance]
---

# Vigência de Regra

## Definição

Toda SPEC jurisdicional carrega janela de vigência no payload (`vigente_de`, `vigente_ate`). A regra aplicável a uma operação é a vigente **na competência do fato**, não na data em que o cálculo é executado. Mudança de lei = `SUPERSEDED_BY` com nova janela. O contrato completo está em `caderno-3-sdk/13-jurisdicao.md §3`.

## Ver também
- [[jurisdicao]] — Dimensão de resolução
- [[linhagem-de-versoes]] — Navegação para recálculo retroativo
