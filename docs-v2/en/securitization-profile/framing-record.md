---
id: framing-record
type: domain
status: active
profile: corporate-regulated/securitization
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (sections 4.1, 4.2, 4.3 and 11.1)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (section 3)
concepts:
  - framing-record
---

# Framing record

The framing record is a versioned record of each issuance. It documents
the legal classification. The issuance stays blocked while the record is
incomplete or unapproved.

## 1. Exact type

```typescript
type PlacementKind = 'private' | 'public';
type DebentureForm = 'nominative_non_book_entry' | 'book_entry';

interface FramingRecord {
  framing_id: Ulid;
  issuance_id: Ulid;             // classified issuance
  version: number;               // reclassification creates a new version
  placement: PlacementKind;      // private placement or public offering
  form: DebentureForm;           // title form
  central_depository: boolean;   // central depository
  is_securitization: boolean;    // securitization operation (Law 14,430)
  is_receivables_certificate: boolean;  // Receivables Certificate
  fiduciary_regime: boolean;     // fiduciary regime
  segregated_estate: boolean;    // segregated estate
  external_registrations_required: string[];  // required external registrations
  legal_officer: string;         // legal responsible party
  evidence_ids: Ulid[];          // classification evidence
  approved_at: number | null;    // null while unapproved
  supersedes: Ulid | null;       // previous record version
}
```

## 2. State machine

```
draft → under_review → approved → (reclassified → new version in draft)
```

1. `draft`: the user fills the record.
2. `under_review`: record complete, waiting for the legal officer.
3. `approved`: issuance unlocked.
4. A change in distribution, form or structure opens a new version in
   `draft`. The previous version remains in history.

## 3. Rules

1. No issuance starts without a record in `approved`.
2. The record registers the placement recipients, channels and materials.
3. `placement = 'public'` requires the public offering regime. The private
   securitization profile does not cover this case. The issuance stops
   until a new framing.
4. `form = 'book_entry'`, public offering or central depository require
   authorized infrastructure integration. See
   `docs-v2/en/securitization-profile/external-registration.md`.
5. `is_securitization = true` or `fiduciary_regime = true` activate the
   segregated estate obligations. See
   `docs-v2/en/securitization-profile/segregated-estate.md`.
6. `is_receivables_certificate = true` requires blocking external
   registration.

## 4. Normative errors

| Code | Condition |
| :--- | :--- |
| `FRAMING_INCOMPLETE` | missing mandatory field |
| `FRAMING_NOT_APPROVED` | issuance attempted without approval |
| `FRAMING_STALE` | new fact requires reclassification |
| `EXTERNAL_REGISTRATION_REQUIRED` | framing requires an absent registration |

## 5. Conformance tests

1. The system blocks an issuance without an approved record.
2. A reclassification creates a new version and preserves the previous
   one.
3. A record with `form = 'book_entry'` without external registration
   blocks the issuance.
4. Recipients, channels and materials stay linked to the record.
