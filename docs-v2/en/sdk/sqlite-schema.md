---
id: sqlite-schema
type: sdk
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 12)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (sections 8 and 12.4)
  - docs/caderno-3-sdk/01-sqlite-and-projections-schema.md (inherited schema)
replaces:
  - docs/caderno-3-sdk/01-sqlite-and-projections-schema.md
concepts:
  - retention-state
  - retention-policy
  - legal-hold
---

# SQLite schema and projections

The local database uses SQLite. The inherited `nodes` and `edges` tables
remain append-only. This document records what changes: how the schema
separates
four states and the retention policy by document class.

## 1. Four separate states

The schema separates four states. No single field combines them.

| State | Field | Scope |
| :--- | :--- | :--- |
| 1. Replica synchronization | `sync_state` | local replica |
| 2. Authoritative source retention | `retention_state` + `retention_class_id` | authority |
| 3. Privacy and visibility | `privacy_state` | per record |
| 4. Title legal status | `legal_state` | regulated profile |

```sql
ALTER TABLE nodes ADD COLUMN sync_state INTEGER NOT NULL DEFAULT 0;
-- 0=pending, 1=confirmed, 2=superseded_by_compensation

ALTER TABLE nodes ADD COLUMN retention_state INTEGER NOT NULL DEFAULT 0;
-- 0=integral, 1=pruned_replica, 2=compressed, 3=quarantine
-- expunged as a destructive value no longer exists; see section 3

ALTER TABLE nodes ADD COLUMN retention_class_id TEXT;
-- reference to the versioned retention policy

ALTER TABLE nodes ADD COLUMN privacy_state INTEGER NOT NULL DEFAULT 0;
-- 0=normal, 1=restricted_use, 2=anonymized_fields

ALTER TABLE nodes ADD COLUMN legal_state INTEGER;
-- defined by the regulated profile; NULL in the generic core

-- The same columns exist in edges.
```

## 2. Pruning as a replica policy

Pruning is a replica policy. It does not destroy the authoritative source.

1. The client can prune a replica when the policy allows it.
2. The authority keeps the full copy required by the document class.
3. The pruned replica preserves id, hash, signature and continuity proof.
4. Authority recovery replicas do not apply destructive pruning to records
   under retention.
5. Rehydration, restoration and as-of-date reconstruction are testable.

## 3. Governed disposal

No disposal process removes the only copy of documents, signatures, orders
or ownership relations still subject to retention. The old `expunged`
state does not apply to records under retention or legal hold.

Disposal requires: document class, legal basis, retention start event,
expired term, absence of legal hold and recorded approval.

## 4. Versioned retention policy

Every document class has a versioned policy. This document fixes the field
names:

```typescript
interface RetentionPolicy {
  document_class: string;      // document class
  legal_basis: string;         // legal basis
  start_event: string;         // event that starts the term
  retention_period: string;    // ISO 8601 duration (example: "P5Y")
  extension_rule: string;      // extension rule
  legal_hold: boolean;         // active hold blocks disposal
  final_disposition: 'archive' | 'anonymize' | 'destroy';
  approver: string;            // policy approver
  policy_version: string;      // semantic version
}
```

Rules:

1. The policy in force at the decision date is reproducible.
2. A legal hold blocks disposal and incompatible anonymization.
3. No universal term exists. The term comes from the class and the basis.
4. An LGPD request does not delete data kept by legal obligation. The
   answer restricts use and access, records the retention basis and
   schedules deletion for when all applicable bases end.

## 5. Local projections (kept)

The `entity_heads`, `active_edges`, `asset_balances` and
`local_permissions` projections remain local and unreplicated. The head
remains the highest-HLC version node of the lineage.

## 6. Durable outbox

The offline proposal outbox is a local unreplicated table.

```sql
CREATE TABLE outbox (
  proposal_id TEXT PRIMARY KEY,   -- ULID; idempotency
  partition TEXT NOT NULL,
  payload BLOB NOT NULL,
  ucan BLOB NOT NULL,
  created_at INTEGER NOT NULL,
  state INTEGER NOT NULL DEFAULT 0,  -- 0=pending, 1=sent, 2=confirmed, 3=rejected
  result BLOB
);
```

A proposal in the outbox does not belong to the official graph. The Sync
Worker resends `pending` and `sent` proposals until it receives
`ProposalResult`.

## 7. Conformance tests

1. An applied batch advances `sync_state` and the cursor in the same
   transaction.
2. A pruned replica keeps the id, hash and signature of the record.
3. The system blocks and records a disposal under legal hold.
4. The as-of-date reconstruction reproduces the historical position.
5. A confirmed proposal leaves the outbox without creating a second record.
