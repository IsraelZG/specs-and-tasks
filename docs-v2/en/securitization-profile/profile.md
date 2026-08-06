---
id: profile-securitization
type: regulatory-profile
status: active
profile: corporate-regulated/securitization
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (sections 4 and 11)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md
concepts:
  - regulatory-profile
---

# Profile `corporate-regulated/securitization`

The securitization profile activates mandatory controls over a network
with a logical authority. A common administrator cannot disable these
controls. The generic platform core does not change. The controls of this
profile do not become universal product rules.

## 1. Mandatory profile controls

| Control | Generic core | Securitization profile |
| :--- | :--- | :--- |
| KYC and KYB | optional | mandatory |
| Ultimate beneficial owner | optional | mandatory |
| AML/CFT, PEP, sanctions, client risk | optional | mandatory |
| Key to legal identity binding | optional | mandatory |
| Framing record per issuance | absent | mandatory, blocking |
| Issuance dossier | absent | mandatory |
| Individual holder accounts | absent | mandatory |
| Formal debenture books | absent | mandatory |
| Retention by document class | configurable | mandatory, non-bypassable |
| Blocking external registration | absent | conditional on framing |
| Segregated estate isolation | absent | conditional on framing |

## 2. Issuance framing

Every issuance uses the controlled expression: "private placement, outside
the scope of public offerings, as documented by the legal classification".

Rules:

1. The absence of publicity alone does not prove a private placement.
2. The process records recipients, channels and materials of the
   placement.
3. The legal officer approves the framing before issuance.
4. A change in distribution allows a new classification.

## 3. Bookkeeping and registered titles

The profile base case is: registered, private, non-book-entry title
outside the central depository. In this case, the company keeps its
registered title records on its own platform.

Rules:

1. The platform does not present itself as a regulated bookkeeping
   service.
2. The indenture declares the adopted form: registered non-book-entry or
   book-entry.
3. Book-entry form, public offering or central depository change the
   result. In those cases, the platform integrates and reconciles the
   authorized infrastructure.

## 4. KYC and AML/CFT

The profile makes mandatory:

1. KYC, KYB and identity verification.
2. Validate the powers of directors, attorneys and representatives.
3. Identification and update of the ultimate beneficial owner.
4. Risk assessment, PEP, sanctions and risky jurisdictions.
5. Recording of evidence origin and onboarding decision.
6. Transaction monitoring and alert handling.
7. Blocks, periodic reviews and compliance decision trail.

```typescript
interface KycRecord {
  kyc_id: Ulid;
  subject_legal_identity_id: Ulid;
  kind: 'kyc' | 'kyb';
  identity_evidence_ids: Ulid[];
  beneficial_owners: Ulid[];       // ultimate beneficial owners
  pep_status: 'no' | 'yes' | 'under_review';
  sanctions_checked_at: number;
  risk_rating: 'low' | 'medium' | 'high';
  onboarding_decision: 'approved' | 'rejected' | 'escalated';
  decision_reason: string;
  alerts: Ulid[];                  // monitoring alerts
  next_review_at: number;          // periodic review
  decided_by: string;
  decided_at: number;
}
```

Without an approved `KycRecord`, no holder account opens. See
`docs-v2/en/securitization-profile/ownership-and-movement.md`.

## 5. Profile components

- [Framing record](framing-record.md)
- [Issuance dossier and formal books](dossier-and-books.md)
- [Ownership and movement](ownership-and-movement.md)
- [Liens, blocks and financial events](liens-and-events.md)
- [Segregated estate](segregated-estate.md)
- [External registration](external-registration.md)
- [Retention and privacy](retention-and-privacy.md)

## 6. Profile acceptance criteria

1. Every issuance has an approved and versioned framing.
2. The placement records recipients and materials.
3. The registered or book-entry form is explicit.
4. KYC and AML/CFT are mandatory.
5. Every relevant signature has a legal and temporal binding.
6. The official ledger is append-only and complete.
