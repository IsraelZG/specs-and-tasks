---
id: rbsr
tipo: conceito
status: historico
fontes:
  - docs-v2/adr/ADR-001-autoridade-logica.md
  - docs-v2/protocolo/graph-sync-protocol.md
substitui:
  - docs/conceitos/rbsr.md
---

# rbsr (histórico)

Range-Based Set Reconciliation foi o protocolo de sincronização do grafo na
especificação anterior. Ele reconciliava conjuntos por XOR de fingerprints
de ranges entre peers.

O RBSR deixou de ser o caminho normal de sincronização. O change feed
autoritativo o substituiu. O RBSR permanece disponível como algoritmo
auxiliar de auditoria entre réplicas da autoridade, fora do caminho do
cliente.

Definição corrente: `docs-v2/protocolo/graph-sync-protocol.md`.
Decisão: `docs-v2/adr/ADR-001-autoridade-logica.md`.
