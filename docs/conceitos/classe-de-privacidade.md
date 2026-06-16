---
name: classe-de-privacidade
title: "Classe de Privacidade"
aliases: ["classe de privacidade", "privacy class"]
tags: [sdk, plugins, privacidade, seguranca]
---

# Classe de Privacidade

## Definição

A classe de privacidade é uma propriedade declarada no contrato de capacidade de um [[plugin]], indicando se a capacidade acessa plaintext sensível. Cruzar a fronteira E2E (site `external`, ou `peer` fora do círculo de confiança) com dado de classe restrita é **proibido por construção**. Exemplo: cálculo de folha jamais elegível a site `external`; transcode de vídeo público elegível a qualquer site. O contrato completo está em `caderno-3-sdk/12-plugins-e-computacao.md §6`.

## Ver também
- [[plugin]] — Classe de privacidade é propriedade do contrato de capacidade
- [[capacidade-de-runtime]] — Casamento de site
