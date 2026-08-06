---
id: safe-pruning
type: concept
status: active
sources:
  - docs-v2/en/sdk/sqlite-schema.md
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (section 8)
replaces:
  - docs/conceitos/poda-segura.md
---

# safe-pruning

Pruning is a replica policy. It removes the local payload when the
retention policy allows it. It never destroys the authoritative source.

Rules:

1. The authority keeps the full copy required by the document class.
2. The pruned replica preserves id, hash, signature and continuity proof.
3. A legal hold blocks the pruning of the affected record.
4. Rehydration, restoration and as-of-date reconstruction are testable.

The pre-pruning check by peer gossip no longer exists. Availability
guarantee comes from the authority, not from a peer quorum.

Full contract: `docs-v2/en/sdk/sqlite-schema.md` sections 2 and 3.
