---
name: spec-workflow
title: "SPEC:WORKFLOW"
aliases: ["SPEC:WORKFLOW", "workflow", "orquestração", "máquina de estados"]
tags: [sdk, workflow, orquestracao, saga]
---

# SPEC:WORKFLOW

## Definição

Um processo é um nó `SPECIFICATION` (kind: `WORKFLOW`) cujo payload é a definição da máquina de estados. O estado de execução é projeção (event sourcing), nunca nó mutável. O contrato completo está em `caderno-3-sdk/24-workflow-reference-spec.md`.

## Ver também
- [[maquina-rasa]] — Nível 1: ~90% dos processos de negócio
- [[statechart-harel]] — Nível 2: statechart completo (SCXML)
- [[asset-lock]] — Primitiva de compensação usada pelos workflows
