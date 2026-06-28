---
name: conector-espelho
title: "Conector Espelho (Classe D)"
aliases: ["conector espelho", "espelho bidirecional", "classe D"]
tags: [sdk, conectores, integracao, email, erp]
---

# Conector Espelho (Classe D)

## Definição

Conector de Classe D é o padrão para sistemas externos que são *system of record* contínuo (caixa IMAP, ERP do cliente da garantidora). O contrato completo está em `caderno-3-sdk/06-connectors.md §3`.

## Invariantes D1–D6

1. **D1 — Cursor durável:** sincronização incremental por checkpoint do provedor (UIDVALIDITY/UIDNEXT no IMAP, cursor/updated_since em APIs REST), persistido fora do grafo no system-peer. Perda de cursor → ressincronização completa idempotente (A.3.2 absorve duplicatas).
2. **D2 — Ingresso por polling + webhook:** webhook quando o provedor oferece (acelera), polling como piso garantido. Os dois caminhos convergem no mesmo pipeline de tradução.
3. **D3 — Egresso como intent:** ação local que deve refletir no externo (enviar email, dar baixa no ERP do cliente) é `CONTENT:INTENT` aprovado pelo validador do fluxo; o conector executa a chamada externa como perna de saga e publica o resultado (`external_ref` do lado externo). Falha → compensação declarada na SPEC.
4. **D4 — Supressão de eco:** todo registro que o conector escreve no sistema externo carrega marcador de origem (header `X-Plataforma-Ref` no email; campo de metadado/idempotency-key em APIs); o ingresso descarta registros cujo marcador case com `external_ref` já publicado, impedindo o ciclo externo→grafo→externo.
5. **Conflito:** o sistema externo é autoritativo sobre seu próprio estado (um email "lido" no provedor prevalece); o grafo é autoritativo sobre o que nasceu nele. Disputas reais (edição concorrente dos dois lados) são resolvidas pela SPEC do domínio — nunca pelo conector.
6. **D6 — Mutação por linhagem:** atualização incremental de um fato espelhado não muta o nó in-place; emite novo fato ligado ao anterior por `SUPERSEDED_BY`, preservando o audit trail. A idempotência por `external_ref` (A.3.2) garante que reentregas não gerem cadeias `SUPERSEDED_BY` espúrias.

## Dependências

| conceito | status |
|:---|:---|
| [[conector-externo]] | criado (esta absorção) |
| [[oraculo-baas]] | criado |
| [[fato-negativo-verificavel]] | criado |
