---
name: gerenciador-de-espaco
title: "Gerenciador de Espaço (Layout Solver)"
aliases: ["gerenciador de espaço", "solver de layout", "layout solver", "gerenciador de espaço determinístico"]
tags: [sdk, shell, layout]
---

# Gerenciador de Espaço

## Definição

O gerenciador de espaço do shell é um **solver determinístico** encarregado de calcular a alocação de colunas e painéis com base na largura disponível do viewport, na pinagem e recência do usuário, e nas restrições declaradas nos manifestos dos módulos (largura mínima/preferida, empilhamento, colapso para trilho). Ele garante que nenhum painel se perca de forma silenciosa, empilhando os excedentes em uma pilha visível de colapsados. O contrato completo está em `caderno-3-sdk/28-shell-e-composicao.md §3`.

## Ver também
- [[spec-workspace]] — O layout resolvido salvo
- [[caderno-3-sdk/26-plugins-frontend]] — Os plugins e manifestos declarando suas restrições
