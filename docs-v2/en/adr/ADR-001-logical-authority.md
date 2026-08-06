---
id: adr-001-logical-authority
type: adr
status: accepted
date: 2026-08-01
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (sections 5, 6 and 7)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md
replaces:
  - docs/conceitos/first-peer-protocol.md (as a correctness foundation)
  - docs/conceitos/genesis-state.md (as a correctness foundation)
  - docs/conceitos/consenso-emergencia.md
  - docs/conceitos/consistent-hashing.md (as official custody)
  - docs/conceitos/replication-factor.md (as a gossip-maintained guarantee)
  - docs/caderno-2-protocol/03-set-reconciliation-protocol.md (RBSR as the normal path)
---

# ADR-001 — Every network has a logical authority. The pure P2P mode no longer exists

## Context

The previous specification allowed three network modes: pure P2P, corporate
and public. The pure P2P mode operated without an identified authority. It
used autonomous genesis by the first peer, emergency consensus between
clients, validator election among common peers and custody by consistent
hashing.

The legal compliance opinion concluded that a technical trail without an
identified authority cannot support a formal registered title register. The
rewrite briefing ordered the removal of the pure P2P mode from all active
technical specifications.

## Decision

1. Every active network has an identified logical authority.
2. The logical authority can use several physical instances.
3. High availability does not create competing authorities.
4. The authority does not require a cloud provider. It can run on local or
   contracted infrastructure.
5. The authoritative change feed replaces RBSR as the normal graph
   synchronization path.
6. Direct P2P connections remain an optimization for latency and cost,
   under signaling and authorization from the authority.
7. Reputation mechanisms remain only for abuse and quality of service.
   They do not decide ledger validity.

## Mechanisms removed as a correctness foundation

- Autonomous genesis by the first peer.
- A network without an identified owner or operator.
- Emergency consensus between clients.
- Validator election among common peers.
- Replication factor maintained only by gossip.
- Official custody by consistent hashing among clients.
- A public DHT to discover the private graph.
- RBSR as the mandatory protocol of the normal path.
- A system peer as a stand-in for an absent authority.

## Consequences

- The network mode concept changes. Two topologies remain: corporate
  network and operated public network. Both have an identified legal and
  technical responsible party.
- The regulatory profile is orthogonal to the topology. The profile
  `corporate-regulated/securitization` activates mandatory controls over
  any topology.
- The old documents that allowed pure P2P become history. This ADR does not
  change earlier ADRs. It replaces them for future work.
- RBSR remains available as a helper audit algorithm between authority
  replicas. It is not the normal client path.
- Tasks that depend on the removed mechanisms need new hardening. The list
  is in `tasks-needing-rehardening.md`.

## Alternatives considered

- **Keep pure P2P as a legacy mode.** Rejected. An active definition that
  allows an authority-free network contradicts the legal framing of the
  regulated product.
- **Authority elected by clients.** Rejected. Clients do not elect an
  authority. The authority designates it at network creation. Its rotation
  is a governance act, not a consensus between peers.
