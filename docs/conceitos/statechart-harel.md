---
name: statechart-harel
title: "Statechart Harel (Workflow Nível 2)"
aliases: ["statechart", "statechart harel", "workflow nível 2", "SCXML"]
tags: [sdk, workflow, statechart, scxml]
---

# Statechart Harel (Workflow Nível 2)

## Definição

O Nível 2 é o statechart de Harel completo, com semântica canônica do SCXML (W3C). Adiciona ao Nível 1: regiões paralelas, hierarquia profunda, pseudo-estados (fork/join/history), eventos internos com bubbling. Necessário só para fluxos genuinamente concorrentes (~10%). Nível 1 é subconjunto estrito: nenhuma migração necessária ao avançar. O contrato completo está em `caderno-3-sdk/24-workflow-reference-spec.md §5`.

## Ver também
- [[maquina-rasa]] — Nível 1 (subconjunto)
- [[spec-workflow]] — Definição geral
