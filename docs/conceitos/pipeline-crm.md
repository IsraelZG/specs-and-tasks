---
title: "Pipeline de CRM"
slug: pipeline-crm
aliases: ["pipeline de crm", "pipeline-crm"]
tags: [sdk, crm, state-machine, workflow]
---

# Pipeline de CRM

## Definição

O **pipeline de CRM** é a máquina de estados rasa (`StateMachine` governada por `SPEC:CRM_PIPELINE`) que representa os estágios operacionais configuráveis de relacionamento e negociação com clientes (ex: leads, vendas, suporte), onde cada transição de estágio é validada como um intent.

## Contrato

As especificações do pipeline de relacionamento e vendas estão em [[caderno-3-sdk/16-erp-crm-reference-spec#5-crm-relacionamento-como-grafo]].
