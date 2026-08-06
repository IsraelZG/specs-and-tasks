---
id: segregated-estate
type: domain
status: active
profile: corporate-regulated/securitization
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (sections 4.3 and 11.6)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (section 5)
concepts:
  - segregated-estate
---

# Segregated estate

A fiduciary regime requires isolation by segregated estate. Each segregated
estate has independent accounting records. Access and reports respect the
same isolation.

## 1. Exact type

```typescript
interface SegregatedEstate {
  estate_id: Ulid;
  network_id: Ulid;
  issuance_id: Ulid;
  fiduciary_term_document_id: Ulid;  // securitization term
  external_registration_id: Ulid | null;  // instrument registration
  ledger_partition: string;          // exclusive change feed partition
  chart_of_accounts_id: Ulid;        // own chart of accounts
  created_at: number;
  state: 'active' | 'wound_up';      // wound_up = liquidated
}
```

## 2. Isolation rules

1. Every record, account, access and report of the estate carries the
   `estate_id`. The identifier is mandatory.
2. The estate change feed uses an exclusive partition.
3. The authority rejects economic references between incompatible estates
   with the error `ESTATE_MISMATCH`.
4. The ledger and the statements of each estate are independent.
5. A movement between accounts of different estates requires its own legal
   act and is never an internal movement.

## 3. Access and reports

1. The profile scopes read and write permissions by `estate_id`.
2. A report of one estate does not include data from another estate.
3. The periodic access review covers each estate independently.

## 4. Accounting

1. Each estate has its own ledger and its own statements.
2. The closings of one estate do not mix positions of another.
3. Liquidation (`wound_up`) generates the final closing and closes the
   partition for new writes. Historical reading remains.

## 5. Conformance tests

1. The authority rejects a record without `estate_id` in the profile.
2. A movement between accounts of different estates fails with
   `ESTATE_MISMATCH`.
3. A report of one estate contains no data of another.
4. The partition of a liquidated estate refuses new writes.
