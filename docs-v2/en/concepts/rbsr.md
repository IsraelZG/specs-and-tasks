---
id: rbsr
type: concept
status: history
sources:
  - docs-v2/en/adr/ADR-001-logical-authority.md
  - docs-v2/en/protocol/graph-sync-protocol.md
replaces:
  - docs/conceitos/rbsr.md
---

# rbsr (history)

Range-Based Set Reconciliation was the graph synchronization protocol in
the previous specification. It reconciled sets by range fingerprint XOR
between peers.

RBSR is no longer the normal synchronization path. The authoritative
change feed replaced it. RBSR remains available as a helper audit
algorithm between authority replicas, outside the client path.

Current definition: `docs-v2/en/protocol/graph-sync-protocol.md`.
Decision: `docs-v2/en/adr/ADR-001-logical-authority.md`.
