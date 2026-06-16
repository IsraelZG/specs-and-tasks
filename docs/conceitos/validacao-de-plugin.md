---
name: validacao-de-plugin
title: "Validação de Plugin"
aliases: ["validação de plugin", "gate de oferta", "plugin validation"]
tags: [sdk, plugins, marketplace, seguranca]
---

# Validação de Plugin

## Definição

Validação de plugin é o **gate de oferta** (não de uso): para *listar* um plugin no marketplace, ele passa pelo processo de validação da implementação. Os critérios dependem da [[modalidade-de-rede]] e os riscos são mitigados por meio de quatro tiers de validação:

- **Página Spec (Tier Leve):** seguro por construção (linguagem de páginas restrita da RFC-008), sem scripts arbitrários.
- **Componente Rico First-Party (Tier de Autoria):** código compilado nativo da plataforma, sujeito ao fluxo de autoria de componentes (RFC-006 §3).
- **Plugin de UI Sandbox (Tier Médio):** isolado com bridge de mensageria tipada e limites de taxa de sinal.
- **Iframe de Código Arbitrário / 3D Pesado (Tier Mais Estrito):** código opaco executando de forma arbitrária; exige análise estática de recursos, fingerprinting e controle estrito de abuso de GPU.

O contrato completo está em `caderno-3-sdk/12-plugins-e-computacao.md §2` e `caderno-3-sdk/26-plugins-frontend.md §6`.


## Ver também
- [[plugin]] — Unidade validada
- [[modalidade-de-rede]] — Critérios variam por modalidade
