---
id: external-registration
type: domain
status: active
profile: corporate-regulated/securitization
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 11.7)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (sections 4, 5 and 12.6)
concepts:
  - external-registration
---

# External registration

The external registration links the issuance to an authorized entity when
the framing requires it. The registration blocks the flow in those cases.

## 1. Exact type

```typescript
interface ExternalRegistration {
  registration_id: Ulid;
  issuance_id: Ulid;
  entity: string;                // registration or depository entity
  required: boolean;             // defined by the framing record
  blocking: boolean;             // blocks the flow when required
  protocol_ref: string | null;   // protocol with the entity
  receipt_ref: string | null;    // confirmation receipt
  state: ExternalRegistrationState;
  divergence: string | null;     // divergence found in reconciliation
  rectification_of: Ulid | null; // rectification of a previous registration
}

type ExternalRegistrationState =
  | 'pending'        // waiting to send
  | 'submitted'      // filed
  | 'confirmed'      // registered
  | 'divergent'      // divergence in reconciliation
  | 'rectified';     // rectified by a new event
```

## 2. Rules

1. The framing record defines whether the profile requires registration and
   whether it blocks the flow.
2. The framing record requires an issuance with a blocking registration to
   advance only with `state = 'confirmed'`.
3. The system records entity, protocol, receipt and state.
4. A divergence between the internal and external position moves the
   state to `divergent` and blocks new movements of the issuance.
5. A rectification is a new event with `rectification_of` filled. It does
   not change the original registration.
6. Periodic reconciliation compares the official internal position with
   the external entity position.

## 3. When the profile requires registration

| Condition in the record | Consequence |
| :--- | :--- |
| `is_receivables_certificate = true` | registration or deposit mandatory |
| `fiduciary_regime = true` | registration of the fiduciary regime instrument |
| `placement = 'public'` | authorized infrastructure. Outside this profile scope |
| `central_depository = true` | depository integration and reconciliation |
| `form = 'book_entry'` | authorized institution and reconciliation |

## 4. Normative errors

| Code | Condition |
| :--- | :--- |
| `EXTERNAL_REGISTRATION_REQUIRED` | flow advanced without confirmed registration |
| `REGISTRATION_DIVERGENT` | reconciliation found an unrectified divergence |

## 5. Conformance tests

1. An issuance with a blocking registration confirms no movements before
   `confirmed`.
2. A reconciliation divergence blocks new movements.
3. A rectification preserves the original registration and the link
   between them.
