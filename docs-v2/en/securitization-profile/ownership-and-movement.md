---
id: ownership-and-movement
type: domain
status: active
profile: corporate-regulated/securitization
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 11.3)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (sections 6.2 and 12.6)
concepts:
  - holder-account
  - movement-order
---

# Ownership and movement

## 1. Holder account

Each holder has an individual account per issuance.

```typescript
interface HolderAccount {
  account_id: Ulid;
  issuance_id: Ulid;
  holder_legal_identity_id: Ulid;  // holder legal identity
  beneficial_owner_ids: Ulid[];    // ultimate beneficial owners
  kyc_record_id: Ulid;             // approved and valid KYC
  segregated_estate_id: Ulid | null;  // segregated estate, when present
  opened_at: number;
  state: 'active' | 'blocked' | 'closed';
}
```

Rules:

1. No account opens without an approved `KycRecord`.
2. The account records the ultimate beneficial owner and the KYC link.
3. A `blocked` account neither originates nor receives movements.

## 2. Movements

```typescript
type MovementKind =
  | 'subscription'     // subscription
  | 'payment_in'       // payment-in
  | 'transfer'         // transfer
  | 'cancellation'     // cancellation
  | 'redemption'       // redemption
  | 'conversion'       // conversion
  | 'amortization'     // amortization
  | 'reversal';        // compensating reversal

interface Movement {
  movement_id: Ulid;
  issuance_id: Ulid;
  kind: MovementKind;
  order_id: Ulid;                // valid order that authorized the movement
  debit_account_id: Ulid | null;
  credit_account_id: Ulid | null;
  quantity: bigint;              // title quantity
  unit_price_cents: bigint | null;
  compensates: Ulid | null;      // reversed movement, when kind=reversal
  feed_cursor: Cursor;           // position in the change feed
  executed_at: number;
}
```

Rules:

1. Each movement points to a valid order.
2. No movement changes a confirmed movement. A correction uses
   `kind = 'reversal'` with `compensates` filled.
3. The account position is the projection of the confirmed movements.

## 3. Orders

```typescript
interface MovementOrder {
  order_id: Ulid;
  issuance_id: Ulid;
  kind: MovementKind;
  requester_identity_id: Ulid;
  signer_binding_ids: Ulid[];    // key to legal identity bindings
  representation_powers: string[];  // required and proven powers
  approval_chain: ApprovalStep[];
  support_document_ids: Ulid[];  // support documents
  effective_at: number;
  state: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface ApprovalStep {
  approver_identity_id: Ulid;
  role: string;                  // role in the approval chain
  evidence_package_id: Ulid;     // approval evidence package
  decided_at: number;
  decision: 'approved' | 'rejected';
}
```

Rules:

1. Each order proves identity, powers and approvals.
2. The profile requires dual approval for sensitive events defined in the
   network policy.
3. A rejected order creates no movement.
4. The order and its approval chain stay retained under the matching
   document class.

## 4. Normative errors

| Code | Condition |
| :--- | :--- |
| `ORDER_INVALID` | order without identity, powers or approval proof |
| `ACCOUNT_BLOCKED` | source or destination account blocked |
| `LIEN_CONFLICT` | active lien incompatible with the movement |
| `INSUFFICIENT_POSITION` | quantity higher than the available position |
| `ESTATE_MISMATCH` | accounts of incompatible segregated estates |

## 5. Conformance tests

1. The authority rejects a movement without an approved order.
2. A reversal does not change the original movement.
3. The as-of-date position reconstructs the same result as the closing.
4. The authority rejects a transfer to an account without approved KYC.
