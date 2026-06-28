---
name: capacidade-de-runtime
title: "Capacidade de Runtime"
aliases: ["capacidade de runtime", "runtime capability", "browser runtime", "node runtime"]
tags: [sdk, plugins, runtime]
---

# Capacidade de Runtime

## Definição

Capacidade de runtime é a declaração de em qual ambiente um [[plugin]] pode executar: `browser` (JS/WASM no contexto web) ou `node` (peer cloud ou Electron). O escalonador só elege um site onde `plugin.runtime ⊆ site.runtimes`. O contrato completo está em `caderno-3-sdk/12-plugins-e-computacao.md §4`.

## Ver também
- [[plugin]] — Declara tipo(s) de runtime
- [[classe-de-privacidade]] — Restrições por site
