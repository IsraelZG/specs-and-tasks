---
id: implementation-plan-v2
type: plan
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 14, item 10)
  - docs/plano-de-implementacao.md (inherited structure)
  - docs-v2/en/adr/ADR-001-logical-authority.md
replaces:
  - docs/plano-de-implementacao.md
---

# Implementation plan v2

This plan revises the implementation cycle for the new topology. The
inherited principles remain: spec-first, ports before adapters, core
isomorphism, decision in `SPECIFICATION`, radical honesty in tests.

## 1. What changes versus the previous plan

| Before | Now |
| :--- | :--- |
| RBSR as the normal sync path | authoritative change feed with manifests |
| Genesis by the first peer (FPP/GENESIS) | network creation by the authority |
| Three network modes | two topologies with authority + regulatory profiles |
| Custody by consistent hashing and gossip | custody designated by the authority |
| System peer | logical authority (one or more instances) |
| Direct client graph write | outbox proposal, authority confirmation |

## 2. Revised milestones

```
M0 Foundation and testability
 └─► M1 Crypto, identity and local storage
      └─► M2 Logical authority, WS transport and handshake
           ├─► M3 Change feed, manifests and waves
           │     └─► M6 Lineage, forks and compensating corrections
           ├─► M4 Opportunistic P2P (signaling, promotion, relay)
           │     └─► M7 Private Swarm
           └─► M5 Legal identity, UCAN, epochs and connectors
                       └─► M8 Blobs and media plane
M9 Profile corporate-regulated/securitization
M10 Hardening, adversarial suite and observability
```

## 3. New or rewritten milestones

### M2 — Logical authority

- Authority service: network creation, member admission, peer directory,
  signaling, key distribution.
- Batch manifest issuance and validation with chaining.
- Authority replicas with consistent state. One physical instance is not a
  logical single point of failure.
- Acceptance: scenario with two authority instances and one client. The
  unavailability of one instance does not interrupt the feed.

### M3 — Change feed

- Monotonic cursor per partition. Batches with a signed manifest.
- Read flow with source choice and hash validation.
- Durable outbox and proposal write flow.
- Compensating events. No change to a confirmed record.
- Acceptance: the conformance tests of
  `docs-v2/en/protocol/graph-sync-protocol.md` section 12.

### M4 — Opportunistic P2P

- Signaling by the authority and authorization for direct connections.
- Record delivery by peers with manifest validation.
- WebSocket or authority relay fallback.
- Acceptance: a batch delivered by a hostile peer with one altered byte
  fails client validation.

### M9 — Profile `corporate-regulated/securitization`

1. Versioned and blocking framing record.
2. Issuance dossier, formal books and chained closings.
3. Holder accounts, orders, movements and compensating reversals.
4. Liens with incompatible movement blocking.
5. Segregated estate with logical and accounting isolation.
6. External registration with reconciliation and blocking.
7. KYC, AML/CFT and fiscal enablement matrix.
8. Retention by document class, legal hold and LGPD service.
9. Regulatory connectors with per-call evidence.
- Acceptance: the legal-technical acceptance criteria of the briefing,
  section 16.

## 4. Test strategy

The three rings remain: deterministic simulation, multi-process
integration and real E2E. The convergence assertions change from range
fingerprint to cursor and manifest hash. The adversarial vectors gain new
cases:

1. Manifest with forged `prev_manifest_hash`.
2. Peer serving a record outside the manifest.
3. Absent authority during a write proposal.
4. Ownership movement without an approved order.
5. Disposal under legal hold.
6. Movement between incompatible segregated estates.

## 5. Out of scope for this cycle

- Public offering. The profile covers private placement.
- RBSR on the client path. It remains an audit between authority replicas.
