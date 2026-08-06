---
id: concepts-index
type: index
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 14)
---

# Concept index

Each entry has a status. `active` defines the current contract.
`replaced` and `history` do not authorize implementation.

## Active

- [automerge-repo](automerge-repo.md) — local-first document subsystem
- [shell-document](shell-document.md) — ephemeral broadcast and presence room
- [ephemeral-messages](ephemeral-messages.md) — discardable session messages
- [sync-worker](sync-worker.md) — central client data worker
- [safe-pruning](safe-pruning.md) — pruning as a replica policy
- [private-swarm](private-swarm.md) — cache between devices of the same owner

## Replaced

- [network-mode](network-mode.md) — see `architecture/topology-and-authority.md`
- [topological-pragmatism](topological-pragmatism.md) — see `architecture/topology-and-authority.md`

## History (removed mechanisms)

- [rbsr](rbsr.md) — helper audit algorithm, not the normal path
- [first-peer-protocol](first-peer-protocol.md) — autonomous genesis removed
- [genesis-state](genesis-state.md) — genesis state removed
- [replication-factor](replication-factor.md) — gossip guarantee removed
- [consistent-hashing](consistent-hashing.md) — official custody removed
