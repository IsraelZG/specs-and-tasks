---
id: consistent-hashing
type: concept
status: history
sources:
  - docs-v2/en/adr/ADR-001-logical-authority.md
replaces:
  - docs/conceitos/consistent-hashing.md
---

# consistent-hashing (history)

Consistent hashing distributed id ranges between peers for official graph
custody and blob sharding in authority-free networks.

Official custody by consistent hashing between clients no longer exists.
The authority designates the custodians of records and blobs among its own
instances and authorized peers with a verified tier.

The algorithm can remain as an internal load distribution detail within
the authority instances. It is not a correctness foundation of the
ledger.

Decision: `docs-v2/en/adr/ADR-001-logical-authority.md`.
