---
id: connectors
type: sdk
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 13)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (sections 10 and 12.7)
  - docs/caderno-3-sdk/06-connectors.md (inherited taxonomy)
replaces:
  - docs/caderno-3-sdk/06-connectors.md
concepts:
  - external-connector
  - fiscal-enablement-matrix
---

# External connectors

The five-class taxonomy remains: notification egress (A), content-blind
ingress (B), transactional oracle (C), bidirectional mirror (D) and query
provider (E). This document defines the ports required by the
securitization profile.

## 1. Securitization profile ports

| Port | Class | Requirement |
| :--- | :--- | :--- |
| Commercial Registry (Junta Comercial) | C | mandatory |
| Registration entity | C | conditional on framing |
| Central depository | C | conditional on framing |
| Signature provider | C | mandatory |
| ICP-Brasil validator | E | mandatory when the level requires it |
| Time-Stamping Authority | C | conditional on signature policy |
| Banks and linked accounts | D | mandatory |
| Bank reconciliation | D | mandatory |
| PEP, sanctions and ultimate beneficial owner | E | mandatory |
| eSocial and EFD-Reinf | C | mandatory for facts since 2025 |
| e-Financeira | C | conditional on the enablement matrix |

## 2. Evidence contract per call

Each call to a profile connector preserves:

```typescript
interface ConnectorCallEvidence {
  call_id: Ulid;
  connector_id: string;
  operation: string;
  request_payload: Uint8Array;     // full request
  response_payload: Uint8Array;    // full response
  protocol_ref: string | null;     // protocol returned by the agency
  receipt_ref: string | null;      // receipt returned by the agency
  layout_version: string;          // layout version used
  technical_identity: string;      // technical identity of the sender
  business_event_id: Ulid;         // related business event
  called_at: number;
}
```

Rules:

1. A rectification is a new event. It does not change the original call.
2. Idempotency uses the provider `external_ref`. A redelivery with the same
   `external_ref` is a no-op.
3. Credentials stay outside the graph, in the operator secret store.
4. Non-authenticatable ingress degrades to polling.

## 3. Fiscal enablement matrix

The profile keeps a versioned fiscal enablement matrix. The matrix decides
to activate each obligation. The name "securitization company" does
not activate any obligation by itself.

```typescript
interface FiscalEnablementMatrix {
  matrix_version: string;
  entity_type: string;             // entity type
  activities: string[];            // actually exercised activities
  products: string[];              // offered products
  supervisor: string | null;       // applicable supervisor
  obligations: FiscalObligation[];
  approved_by: string;             // analysis responsible
  approved_at: number;
}

interface FiscalObligation {
  obligation: 'esocial' | 'efd_reinf' | 'e_financeira';
  enabled: boolean;
  legal_basis: string;             // framing basis
  layout_version: string;
  effective_from: string;          // initial calendar year
}
```

Rules:

1. eSocial and EFD-Reinf cover facts since calendar year 2025. DIRF is not
   modeled as a future obligation.
2. The system activates e-Financeira only after a framing analysis recorded in the
   matrix.
3. A change of activities requires a new matrix version.

## 4. Connectors and the authority

Every class C and D connector acts as a system persona with a scoped role.
That persona signs everything the connector publishes to the graph.
The connector is an authority capability, never a client capability.

## 5. Conformance tests

1. A call without preserved `request_payload` or `response_payload` fails
   audit.
2. A rectification creates a new event and keeps the original.
3. e-Financeira stays disabled without a matrix framing analysis.
4. A redelivery with the same `external_ref` does not duplicate the fact in
   the graph.
