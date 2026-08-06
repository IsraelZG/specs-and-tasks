---
id: automerge-repo
type: concept
status: active
sources:
  - docs-v2/en/protocol/automerge-integration.md
  - https://automerge.org/docs/reference/concepts/
replaces:
  - docs/conceitos/automerge-repo.md
---

# automerge-repo

Local-first subsystem for collaborative documents. It manages the Changes
DAG of each document and the CRDT merge.

The Automerge Repo does not replicate the official graph. The official
graph syncs through the authoritative change feed. The Automerge Repo does
not validate legal rules and does not execute authorization by subgraph
traversal.

The `NetworkAdapterPort` creates and maintains the connections. The
Automerge Repo consumes each connection through a thin adapter.

Full contract: `docs-v2/en/protocol/automerge-integration.md`.
