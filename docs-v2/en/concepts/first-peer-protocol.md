---
id: first-peer-protocol
type: concept
status: history
sources:
  - docs-v2/en/adr/ADR-001-logical-authority.md
replaces:
  - docs/conceitos/first-peer-protocol.md
---

# first-peer-protocol (history)

The First Peer Protocol governed the autonomous genesis of a network by
the first peer, with the state machine JOINING, WAITING_FOR_SWARM,
CONNECTED, GENESIS and OFFLINE_RETRY.

The autonomous genesis by the first peer no longer exists. Every network
The logical authority creates every network. First contact of a client uses the
authority directory, mDNS, a signed multiaddr link or an invite.

Decision: `docs-v2/en/adr/ADR-001-logical-authority.md`.
