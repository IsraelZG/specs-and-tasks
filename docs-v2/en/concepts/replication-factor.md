---
id: replication-factor
type: concept
status: history
sources:
  - docs-v2/en/adr/ADR-001-logical-authority.md
replaces:
  - docs/conceitos/replication-factor.md
---

# replication-factor (history)

The replication factor N was the minimum number of peers that had to keep
each record in pure P2P networks, checked by gossip before pruning.

The gossip availability guarantee between clients no longer exists. The
authority keeps the full copy and the recovery replicas. Client pruning is
a replica policy governed by the document class.

Current definition: `docs-v2/en/sdk/sqlite-schema.md` section 2.
Decision: `docs-v2/en/adr/ADR-001-logical-authority.md`.
