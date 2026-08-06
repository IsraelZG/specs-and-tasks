---
id: topology-and-authority
type: architecture
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (sections 5 and 6)
  - docs-v2/en/adr/ADR-001-logical-authority.md
replaces:
  - docs/conceitos/modalidade-de-rede.md
  - docs/conceitos/pragmatismo-topologico.md
  - docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md (section 1.5)
concepts:
  - logical-authority
  - opportunistic-p2p
  - regulatory-profile
---

# Network topology and logical authority

## 1. Definitions

### 1.1 Logical authority

The logical authority is the governance function of a network. An
identified legal entity answers for it. The logical authority is unique per
network.

The authority can run on several physical instances. The instances form a
single logical system with consistent shared or replicated state. High
availability does not create competing authorities.

The authority does not require a cloud provider. It can run on own, local
or contracted infrastructure.

### 1.2 Allowed topologies

| Topology | Operator | Typical use |
| :--- | :--- | :--- |
| `corporate` | The organization itself or a contractor under its governance | Intranet, private operation |
| `public-operated` | The identified founder or operator of the public network | Network open to invited participants |

Both topologies require an identified legal responsible party and an
identified technical responsible party in the network creation record.

### 1.3 Regulatory profile

The regulatory profile is a set of mandatory controls applied over a
topology. Topology and profile are independent decisions.

Example: the profile `corporate-regulated/securitization` hardens a
corporate network for private debenture issuance. A common administrator
cannot disable the mandatory controls of the profile.

## 2. Functions exclusive to the authority

The authority controls these functions. No client executes them.

1. Network creation.
2. Member admission and removal.
3. Capability issuance and revocation.
4. Peer directory and signaling.
5. Key distribution and rotation.
6. Domain operation validation.
7. Official graph order and completeness.
8. Full retention and recovery.
9. Network regulatory policies.

## 3. Opportunistic P2P

Authorized clients can form direct connections between themselves. The
authority provides signaling and authorization for each connection.

When the direct channel fails, the client uses WebSocket or a relay
operated by the authority.

### 3.1 Data that peers can exchange

- Automerge document changes.
- Presence and ephemeral messages.
- Graph records already confirmed by the authority.
- Batches confirmed by an authority manifest.
- Encrypted blobs verifiable by hash.
- Private caches between devices of the same owner.

### 3.2 Actions that peers cannot execute

- Create an independent network.
- Admit members without the authority.
- Create an official key epoch.
- Declare graph completeness.
- Confirm a non-commutative operation.
- Change a regulatory policy.
- Replace the authoritative copy.

### 3.3 Trust model

A P2P connection improves latency and cost. It does not change the trust
model. A peer delivers bytes. Only the authority manifest proves
completeness and position in the feed. The client validates the hash and
signature of each record, whatever the source of the bytes.

## 4. Discovery and first contact

A public DHT is not used to discover the private graph. The discovery
channels are:

1. The authority peer directory.
2. mDNS on a local network.
3. A signed multiaddr link distributed out of band.
4. An `ASSET:INVITE` issued under the network rules.

Private trackers, WebSeeds and authorized peers locate blobs. See
`docs-v2/en/sdk/media-transport-plane.md`.

## 5. Reputation

Reputation scores remain local and non-transitive. They serve to detect
abuse and measure quality of service. They do not decide ledger validity
and they do not elect validators.

## 6. Compliance invariants

- No active network works without a logical authority.
- No authority depends on a single physical instance.
- Clients do not elect a new authority.
- Authority rotation is a governance act recorded in the official graph.
- An authority WebSocket or relay provides the always-available fallback
  path.
