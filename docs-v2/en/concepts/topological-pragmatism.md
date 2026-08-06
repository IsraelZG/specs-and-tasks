---
id: topological-pragmatism
type: concept
status: replaced
sources:
  - docs-v2/en/adr/ADR-001-logical-authority.md
  - docs-v2/en/architecture/topology-and-authority.md
replaces:
  - docs/conceitos/pragmatismo-topologico.md
---

# topological-pragmatism (replaced)

The idea "P2P-first, not P2P-purist" evolved into a stricter model: every
network has a logical authority, and direct P2P connections are an
optimization under authority authorization.

The original motivation remains: use each topology for what it offers best,
without dogma. The difference is that the trust model is now fixed. Peers
deliver bytes. Only the authority confirms the graph.

Current definition: `docs-v2/en/architecture/topology-and-authority.md`
section 3.
