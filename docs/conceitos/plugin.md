---
name: plugin
title: "Plugin"
aliases: ["plugin", "SPEC:PLUGIN", "plugin de plataforma"]
tags: [sdk, plugins, computacao, extensibilidade]
---

# Plugin

## Definição

Um **plugin** é uma unidade de código assinada e versionada, declarada por um nó **`SPECIFICATION` (kind: `PLUGIN`)**. Ganha de graça linhagem ([[linhagem-de-versoes]]), assinatura do autor e distribuição por replicação/blob plane. O contrato completo está em `caderno-3-sdk/12-plugins-e-computacao.md §1`.

## Dois Tipos de Runtime

- `browser`: JS e/ou WASM, executa em contexto web (aba do usuário ou Worker)
- `node`: executa em peer cloud ou no lado Node de wrapper Electron/Capacitor

## Três Categorias de Capacidade

| Categoria | Provê | Porta |
| :--- | :--- | :--- |
| `compute` | função invocável | `ComputePort` |
| `connector` | ponte ao mundo externo (classes A–E da RFC-007) | `NetworkAdapterPort` no site `external` |
| `infra` | serviço de infra com canais de rede próprios | canais próprios do serviço |

A quarta categoria `ui` (frontend) é definida na RFC-024/caderno-3/26.

## Ver também
- `caderno-3-sdk/12-plugins-e-computacao.md` — Contrato completo
- [[conector-externo]] — Conector é uma categoria de plugin
- [[fila-de-computacao]] — Modo assíncrono
