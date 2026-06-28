---
name: spec-workspace
title: "SPEC:WORKSPACE"
aliases: ["SPEC:WORKSPACE", "workspace", "workspace salvo", "layout do shell"]
tags: [sdk, shell, layout]
---

# SPEC:WORKSPACE

## Definição

Um workspace é um nó `SPECIFICATION` (kind: `WORKSPACE`) cujo payload é o modelo serializável da árvore FlexLayout do shell (binds de módulo + página/rota + params por painel). O arranjo vivo e efêmero em execução no dispositivo não propaga broadcast automático a outros terminais ativos; o workspace salvo serve como o estado estático inicial da próxima sessão. O contrato completo está em `caderno-3-sdk/28-shell-e-composicao.md §1`.

## Ver também
- [[gerenciador-de-espaco]] — Solver de alocação de colunas
- [[modulo-lente-e-ator]] — O módulo bindo nos painéis do workspace
- [[command-palette]] — Localizado na camada de overlay do shell workspace
