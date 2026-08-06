---
id: docs-v2-readme
type: index
status: active
date: 2026-08-01
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md
---

# Technical specification v2 — index

This directory contains the technical rewrite of the platform specification.
It activates the regulated securitization profile and removes the pure P2P
mode. The legal opinion and the original product texts remain in `docs/`.

The Portuguese originals live in `pt-BR`. The English translations live in
this directory. The two trees mirror each other file by file.

## Conventions

- One concept has one name and one canonical definition.
- Every file declares `id`, `type`, `status` and `sources` in the
  frontmatter.
- Files with `status: replaced` are history. Do not use them as contract.
- The field `replaces` points to the old document that this file makes
  obsolete.
- Every protocol defines exact types, states, errors, idempotency and tests.
- No document leaves a design decision to the implementer.
- The controlled expression for the placement classification is:
  "private placement, outside the scope of public offerings, as documented
  by the legal classification".

## Document map

### Governance

- [ADR-001 — Logical authority and the end of pure P2P](adr/ADR-001-logical-authority.md)

### Architecture

- [Network topology and logical authority](architecture/topology-and-authority.md)

### Protocol

- [Graph Sync Protocol — authoritative change feed](protocol/graph-sync-protocol.md)
- [Wire Protocol — frames and logical channels](protocol/wire-protocol.md)
- [Cryptographic lineage, legal identity and signature](protocol/cryptographic-lineage-and-auth.md)
- [Automerge integration](protocol/automerge-integration.md)

### SDK

- [SQLite schema and projections](sdk/sqlite-schema.md)
- [Sync Worker and lifecycle](sdk/sync-worker.md)
- [Media transport plane](sdk/media-transport-plane.md)
- [External connectors](sdk/connectors.md)

### Securitization profile

- [Profile `corporate-regulated/securitization`](securitization-profile/profile.md)
- [Framing record](securitization-profile/framing-record.md)
- [Issuance dossier and formal books](securitization-profile/dossier-and-books.md)
- [Ownership and movement](securitization-profile/ownership-and-movement.md)
- [Liens, blocks and financial events](securitization-profile/liens-and-events.md)
- [Segregated estate](securitization-profile/segregated-estate.md)
- [External registration](securitization-profile/external-registration.md)
- [Retention and privacy](securitization-profile/retention-and-privacy.md)

### Concepts

- [Concept index](concepts/_index.md)

### Execution

- [Implementation plan](implementation-plan.md)
- [Tasks that need re-hardening](tasks-needing-rehardening.md)
