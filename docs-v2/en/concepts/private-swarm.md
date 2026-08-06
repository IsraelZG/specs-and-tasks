---
id: private-swarm
type: concept
status: active
sources:
  - docs-v2/en/architecture/topology-and-authority.md (section 3.1)
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 6)
replaces:
  - docs/conceitos/private-swarm.md
---

# private-swarm

Synchronization channel between devices of the same owner. It covers
drafts, preferences and private caches. The traffic uses the owner sync
key, derived from the master key by HKDF.

The Private Swarm does not use a public DHT. Discovery uses the authority
directory or out-of-band channels. The Private Swarm does not carry
official graph records.
