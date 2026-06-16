---
title: "Lente de Módulo"
slug: lente-de-modulo
aliases: ["lente de módulo", "lente"]
tags: [sdk, erp, crm, modulo, v4]
---

# Lente de Módulo

## Definição

Uma **lente de módulo** é o princípio de que módulos (como ERP, CRM, Marketplace) não possuem bases de dados duplicadas ou APIs de sincronização entre si. Em vez disso, eles são wrappers e projeções que leem e escrevem sobre o **mesmo subgrafo compartilhado** de dados da ontologia (nós de `INTENT`, `INVENTORY`, `BALANCE_STATE`, etc.) sob diferentes perspectivas de acesso.

## Contrato

As especificações de lentes de módulo estão descritas em [[caderno-3-sdk/16-erp-crm-reference-spec#1-erp-como-lente-do-subgrafo-transacional]].
