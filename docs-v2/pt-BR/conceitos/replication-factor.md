---
id: replication-factor
tipo: conceito
status: historico
fontes:
  - docs-v2/adr/ADR-001-autoridade-logica.md
substitui:
  - docs/conceitos/replication-factor.md
---

# replication-factor (histórico)

O replication factor N era o número mínimo de peers que deviam manter cada
registro em redes P2P puro, verificado por gossip antes da poda.

A garantia de disponibilidade por gossip entre clientes deixou de existir.
A autoridade mantém a cópia integral e as réplicas de recuperação. A poda
do cliente é uma política de réplica governada pela classe documental.

Definição corrente: `docs-v2/sdk/sqlite-schema.md` seção 2.
Decisão: `docs-v2/adr/ADR-001-autoridade-logica.md`.
