---
id: sync-worker
tipo: conceito
status: ativo
fontes:
  - docs-v2/sdk/sync-worker.md
substitui:
  - docs/conceitos/sync-worker.md
---

# sync-worker

Worker central de dados do cliente. Persiste no SQLite, aplica o change
feed, gerencia a outbox de propostas e orquestra o Automerge Repo.

O Sync Worker não executa mais o RBSR como caminho normal. O cursor
monotônico por partição define a posição do cliente no feed.

Contrato completo: `docs-v2/sdk/sync-worker.md`.
