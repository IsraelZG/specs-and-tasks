---
name: maquina-rasa
title: "Máquina Rasa (Workflow Nível 1)"
aliases: ["máquina rasa", "workflow nível 1", "FSM simples"]
tags: [sdk, workflow, fsm]
---

# Máquina Rasa

## Definição

O Nível 1 de workflow é uma máquina de estados finita simples, suficiente para ~90% dos processos de negócio. Inclui: estados nomeados, transições com guarda Zen, ações entry/exit, timers HLC, estado composto raso e escalonamento de tarefa humana. O contrato completo está em `caderno-3-sdk/24-workflow-reference-spec.md §4`.

## Ver também
- [[spec-workflow]] — Definição geral de workflow
- [[statechart-harel]] — Nível 2 (superset do Nível 1)
