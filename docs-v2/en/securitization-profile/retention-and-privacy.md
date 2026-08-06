---
id: retention-and-privacy
type: domain
status: active
profile: corporate-regulated/securitization
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (sections 4.6 and 12)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (section 8)
concepts:
  - retention-policy
  - legal-hold
  - lgpd-legal-basis
---

# Retention and privacy

This document applies the retention rules of the schema (see
`docs-v2/en/sdk/sqlite-schema.md`) and the LGPD legal bases to the
securitization profile.

## 1. Profile invariants

1. The authoritative ledger and its recovery replicas do not apply
   destructive pruning to records under retention.
2. The client can prune local payloads when the policy allows it. The
   authority preserves the full record and proves continuity.
3. Document class, start event, basis, legal hold
   and approval govern disposal.
4. No universal term exists. The term comes from the class and the basis.
5. No anonymization destroys a signature, support document or ownership
   link still needed for a legal obligation, rights exercise or defense in
   proceedings.
6. The profile versions every retention policy and reproduces the result in
   force at the decision date.

## 2. Legal bases per purpose

The LGPD does not make consent the universal basis. The profile records the
legal basis of each processing purpose.

```typescript
type LegalBasis =
  | 'legal_obligation'       // legal or regulatory obligation
  | 'contract_execution'     // contract execution
  | 'rights_exercise'        // regular rights exercise
  | 'credit_protection'      // credit protection
  | 'consent';               // consent, when adequate

interface ProcessingPurpose {
  purpose_id: Ulid;
  purpose: string;
  legal_basis: LegalBasis;
  data_categories: string[];
  retention_class_id: string;
  policy_version: string;
}
```

## 3. Data subject rights requests

1. A deletion request does not delete records kept by legal or regulatory
   obligation.
2. The answer restricts use and access, records the retention basis and
   schedules deletion for when all applicable bases end.
3. The system records every decision on a request with basis and approver.
4. A legal hold blocks incompatible disposal and anonymization.

```typescript
interface RightsRequest {
  request_id: Ulid;
  subject_legal_identity_id: Ulid;
  kind: 'access' | 'deletion' | 'portability' | 'rectification';
  state: 'received' | 'under_review' | 'answered';
  answer: string | null;         // grounded answer
  retention_bases_kept: LegalBasis[];  // bases that kept data
  scheduled_erasure_at: number | null; // scheduled deletion
  decided_by: string;
  decided_at: number | null;
}
```

## 4. Evidence export

The platform exports evidence in an intelligible format independent of the
application: statements, holder lists, books, signature evidence packages
and closing chains with their hashes.

## 5. Conformance tests

1. A deletion request on a record under legal obligation results in use
   restriction, not deletion.
2. A legal hold blocks a policy-authorized disposal.
3. The applied retention policy is the one in force at the decision date.
4. The export of a closing validates outside the application by hash.
