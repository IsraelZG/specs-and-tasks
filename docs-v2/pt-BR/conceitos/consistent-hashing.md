---
id: consistent-hashing
tipo: conceito
status: historico
fontes:
  - docs-v2/adr/ADR-001-autoridade-logica.md
substitui:
  - docs/conceitos/consistent-hashing.md
---

# consistent-hashing (histórico)

O consistent hashing distribuía faixas de IDs entre peers para custódia
oficial do grafo e para sharding de blobs em redes sem autoridade.

A custódia oficial por consistent hashing entre clientes deixou de existir.
A autoridade designa os custódios de registros e de blobs entre instâncias
próprias e peers autorizados com tier verificado.

O algoritmo pode persistir como detalhe interno de distribuição de carga
dentro das instâncias da autoridade. Ele não é fundamento de correção do
ledger.

Decisão: `docs-v2/adr/ADR-001-autoridade-logica.md`.
