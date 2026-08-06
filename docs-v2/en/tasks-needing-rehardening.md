---
id: tasks-needing-rehardening
type: record
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (sections 3 and 18)
  - docs-v2/en/adr/ADR-001-logical-authority.md
---

# Tasks that need re-hardening

This record lists the work fronts impacted by the rewrite. The MGTIA task
update happens only after the canonical sources are complete. This file is
the bridge between the specification and the backlog.

## 1. Fronts impacted by the new topology

| Front | Reason | New source |
| :--- | :--- | :--- |
| Sync and reconciliation | RBSR left the normal path | `protocol/graph-sync-protocol.md` |
| Wire protocol | logical channels and new frames | `protocol/wire-protocol.md` |
| Genesis and bootstrap | creation by the authority | `architecture/topology-and-authority.md` |
| Custody and pruning | designated custody, replica pruning | `sdk/sqlite-schema.md` |
| Sync Worker | outbox and batch application | `sdk/sync-worker.md` |
| Blob transport | authority manifest, no DHT | `sdk/media-transport-plane.md` |
| Identity and signature | legal binding and levels | `protocol/cryptographic-lineage-and-auth.md` |

## 2. New securitization profile fronts

| Front | Source |
| :--- | :--- |
| Framing record | `securitization-profile/framing-record.md` |
| Dossier, closings and books | `securitization-profile/dossier-and-books.md` |
| Ownership, orders and movements | `securitization-profile/ownership-and-movement.md` |
| Liens and financial events | `securitization-profile/liens-and-events.md` |
| Segregated estate | `securitization-profile/segregated-estate.md` |
| External registration | `securitization-profile/external-registration.md` |
| Retention, legal hold and LGPD | `securitization-profile/retention-and-privacy.md` |
| Regulatory connectors and fiscal matrix | `sdk/connectors.md` |

## 3. Procedure

1. Mark the affected tasks for re-hardening.
2. Re-harden each task against the matching new source.
3. Do not re-harden against the old `docs/` documents. They are history
   for the topics covered by this corpus.
