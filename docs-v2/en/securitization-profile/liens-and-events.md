---
id: liens-and-events
type: domain
status: active
profile: corporate-regulated/securitization
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 11.4)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (section 12.6)
concepts:
  - lien
---

# Liens, blocks and financial events

## 1. Liens

```typescript
type LienKind =
  | 'pledge'              // pledge
  | 'fiduciary_assignment'// fiduciary assignment
  | 'usufruct'            // usufruct
  | 'judicial_block'      // judicial block
  | 'circulation_restriction';  // circulation restriction

interface Lien {
  lien_id: Ulid;
  issuance_id: Ulid;
  account_id: Ulid;              // burdened account
  kind: LienKind;
  beneficiary_identity_id: Ulid; // lien beneficiary
  priority: number;              // priority order
  support_document_ids: Ulid[];  // documents that constitute the lien
  effective_from: number;
  effective_until: number | null;  // null while valid
  state: 'active' | 'released' | 'expired';
}
```

Rules:

1. The lien records type, beneficiary, priority and validity.
2. The system blocks a movement incompatible with an active lien with the error
   `LIEN_CONFLICT`.
3. The lien release is a new event. It does not change the constitution
   record.
4. Priority resolves competition between liens over the same position.

## 2. Financial events

```typescript
type FinancialEventKind =
  | 'interest'              // interest
  | 'premium'               // premium
  | 'amortization'          // amortization
  | 'early_maturity'        // early maturity
  | 'payment'               // payment
  | 'withholding'           // withholding
  | 'bank_reconciliation';  // bank reconciliation

interface FinancialEvent {
  event_id: Ulid;
  issuance_id: Ulid;
  kind: FinancialEventKind;
  calculation_base_hash: Hash32; // calculation data used
  amount_cents: bigint;
  currency: 'BRL';
  due_date: string;              // ISO 8601
  settled_at: number | null;
  payment_evidence_id: Ulid | null;  // payment evidence
  withholding_receipt: string | null;  // withholding receipt
  bank_reconciliation_ref: string | null;
}
```

Rules:

1. The event records the calculation base by hash.
2. The payment links to evidence and to bank reconciliation.
3. The withholding keeps the receipt and feeds the fiscal connectors. See
   `docs-v2/en/sdk/connectors.md`.
4. A settled event does not change. A correction creates a compensating
   event.

## 3. Conformance tests

1. A transfer over a position with an active `judicial_block` fails.
2. A lien release preserves the constitution record.
3. An interest event without a recorded calculation base is invalid.
4. A payment without reconciliation stays `settled_at = null`.
