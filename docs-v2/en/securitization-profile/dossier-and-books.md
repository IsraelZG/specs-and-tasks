---
id: dossier-and-books
type: domain
status: active
profile: corporate-regulated/securitization
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (sections 11.2 and 11.5)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (sections 4.3 and 12.6)
concepts:
  - issuance-dossier
  - debenture-registration-book
  - debenture-transfer-book
---

# Issuance dossier and formal books

## 1. Issuance dossier

The dossier groups the corporate documents of an issuance. Each document
has a hash, version, signers and retention state.

```typescript
type DossierDocumentKind =
  | 'corporate_act'        // resolution and corporate acts
  | 'indenture'            // issuance indenture
  | 'amendment'            // amendment
  | 'publication'          // required publication
  | 'guarantee'            // guarantee and its constitution
  | 'commercial_registry'  // Commercial Registry receipt
  | 'framing_opinion';     // framing opinion

interface DossierDocument {
  document_id: Ulid;
  issuance_id: Ulid;
  kind: DossierDocumentKind;
  content_hash: Hash32;
  version: number;
  signer_evidence_ids: Ulid[];   // signature evidence packages
  retention_class_id: string;    // retention document class
  state: 'draft' | 'signed' | 'filed' | 'published';
  filed_at: number | null;
  registry_receipt: string | null;
}
```

Rules:

1. The issuance requires at minimum: corporate act, indenture and framing
   opinion.
2. The indenture declares the title form. The form in the indenture and in
   the framing record must match.
3. An amendment is a new document. It does not change the original
   indenture.
4. Publications and filings keep their protocol and receipt.

## 2. Closing statements

A closing consolidates the position at a cutoff date.

```typescript
interface ClosingStatement {
  closing_id: Ulid;
  issuance_id: Ulid;
  cutoff_date: string;           // ISO 8601 cutoff date
  holder_list_hash: Hash32;      // hash of the holder list
  positions_hash: Hash32;        // hash of the per-holder positions
  prev_closing_hash: Hash32;     // closing chain
  generated_at: number;
  signature: Signature;          // authority signature
}
```

Rules:

1. The closing generates the as-of-date position, the holder list and the
   individual statement.
2. The authority signs each closing and chains it to the previous one.
3. The historical position is reproducible from the feed. The closing is a
   signed projection, not a new source.

## 3. Formal books

The profile generates two books per issuance: the Debenture Registration
Book and the Debenture Transfer Book.

```typescript
interface FormalBook {
  book_id: Ulid;
  issuance_id: Ulid;
  kind: 'registration' | 'transfer';
  opening_term_hash: Hash32;     // opening term
  closing_term_hash: Hash32 | null;  // closing term
  entries_from: Cursor;          // covered feed range
  entries_to: Cursor;
  closed_version_hash: Hash32;   // closed version
  authentication_receipt: string | null;  // Commercial Registry authentication
  custody_ref: string;           // book custody
}
```

Rules:

1. Every book has an opening term and a closing term.
2. The book records authentication, receipt and closed version.
3. A book exemption is a documented legal decision of the issuance. It is
   never the default software behavior.
4. The book exports in a stable, intelligible format, independent of the
   application.

## 4. Conformance tests

1. An issuance without an indenture in the dossier does not open holder
   accounts.
2. A closing validates against the position reconstructed from the feed.
3. A book without an opening term is invalid.
4. The closing chain detects any change by hash.
