---
id: cryptographic-lineage-and-auth
type: protocol
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 4.4)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (sections 9 and 12.3)
  - docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md (inherited technical base)
replaces:
  - docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md
concepts:
  - key-identity-binding
  - signature-level
  - signature-evidence-package
  - version-lineage
  - identity-epoch
---

# Cryptographic lineage, legal identity and signature

This document defines cryptographic identity, the link to legal identity,
signature levels and version lineage. The inherited key model, UCAN, HLC
and epochs remain valid. This text records only what changes and what stays
normative.

## 1. Key to legal identity binding

The regulated profile binds every signing key to a legal identity. The
binding is an official graph record.

```typescript
type SignatureLevel = 'basic' | 'advanced' | 'qualified' | 'qualified_timestamped';

interface KeyIdentityBinding {
  binding_id: Ulid;
  network_id: Ulid;
  subject_key: PubKey;          // bound Ed25519 key
  legal_identity_id: Ulid;      // verified civil or corporate identity
  representation_powers: string[];  // representation powers in the act
  valid_from: number;           // ms Unix
  valid_until: number | null;   // null while valid
  kyc_record_id: Ulid;          // verification evidence
  evidence_package_id: Ulid;    // binding evidence package
  created_at: number;
  signature: Signature;         // authority signature
}
```

Rules:

1. The binding records its validity period.
2. The binding records the representation powers.
3. A key revocation closes `valid_until`. It does not delete the binding or
   the historical authorship of acts signed during validity.
4. To validate an act, use the binding valid at the act instant.

## 2. Signature levels

The policy defines the level required by risk and act type. ICP-Brasil and
a TSA timestamp are not general requirements for every private act. A
signature outside ICP-Brasil can be valid.

| Level | Typical use | Minimum evidence |
| :--- | :--- | :--- |
| `basic` | low-risk internal acts | authenticated session, signed record, context |
| `advanced` | usual private contracts and orders | signature provider, MFA, identification, device, document hash, acceptance evidence, provider report |
| `qualified` | indenture, high-value acts, sensitive powers | ICP-Brasil certificate and chain and revocation validation |
| `qualified_timestamped` | critical instruments and periodic anchors | qualified signature and TSA timestamp |

The timestamp proves that the document summary existed when the TSA
received it. It does not prove the original creation date. Use the
timestamp as probative reinforcement when the policy requires it.

## 3. Signature evidence package

Every relevant signature preserves an evidence package.

```typescript
interface SignatureEvidencePackage {
  package_id: Ulid;
  document_hash: Hash32;        // hash of the exact signed document
  document_version: number;
  signer_key: PubKey;
  binding_id: Ulid;             // key to legal identity binding
  level: SignatureLevel;
  method: string;               // provider and method used
  provider_report_ref: string | null;
  mfa_evidence: boolean;
  policy_version: string;       // accepted signing policy
  signed_at: number;            // ms Unix, with timezone recorded
  certificate_chain: Uint8Array | null;  // when ICP-Brasil
  revocation_check_at: number | null;
  timestamp_token: Uint8Array | null;    // TSA stamp, when required
  signature: Signature;
}
```

The cryptographic signature of a graph event and the legal signature of the
underlying document are distinct objects. The evidence package links the
two.

## 4. Version lineage (kept)

The graph is append-only. Every node and edge has an Ed25519 signature over
its flat fields and the encrypted payload. The `MUTATES` edge carries
`previous_hash` in a flat indexed column. The head of an entity is the
highest-HLC version node of the lineage. The validation rejects a child with
`HLC(child) <= HLC(parent)` as malformed.

## 5. Identity epoch (kept)

The identity epoch versions identity attestation, device delegations and
revocations. The events that increment the epoch form a closed list. They
are: master or persona key rotation, root UCAN revocation, device
delegation issuance or revocation, and recovery model change. The error
`STALE_EPOCH` refers only to this epoch.

## 6. Key rotation under authority

The authority controls epoch key distribution and rotation. The Network
Key Vault exposes
`requestEpochKey(ucan, scope, delegation_proof) -> key | DENIED`.
Cooperative rotation among common peers no longer exists as an official
mechanism. See `docs-v2/en/adr/ADR-001-logical-authority.md`.

## 7. Normative errors

| Code | Condition |
| :--- | :--- |
| `BINDING_EXPIRED` | binding outside validity at the act instant |
| `BINDING_NOT_FOUND` | key without legal binding in the regulated profile |
| `POWER_INSUFFICIENT` | missing representation power for the act |
| `LEVEL_INSUFFICIENT` | signature level below the policy requirement |
| `EVIDENCE_INCOMPLETE` | evidence package without a mandatory field |

## 8. Conformance tests

1. The authority rejects an act signed after the binding `valid_until`.
2. A key revocation does not change how the system verifies acts within
   validity.
3. An act that requires `qualified` fails with `advanced` evidence.
4. The authority rejects an evidence package without `document_hash`.
5. Validation uses the binding valid at the act date, not the current
   binding.
