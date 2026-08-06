---
id: automerge-integration
type: protocol
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 8)
  - docs/caderno-2-protocol/04-automerge-integration-spec.md (inherited base)
  - https://automerge.org/docs/reference/concepts/
  - https://automerge.org/docs/reference/repositories/ephemeral/
  - https://automerge.org/docs/reference/repositories/networking/
  - https://automerge.org/docs/reference/under-the-hood/storage/
replaces:
  - docs/caderno-2-protocol/04-automerge-integration-spec.md
  - docs/conceitos/automerge-repo.md
  - docs/conceitos/documento-casca.md
  - docs/conceitos/ephemeral-messages.md
concepts:
  - shell-document
  - ephemeral-message
---

# Automerge integration

The Automerge Repo is a local-first subsystem for collaborative documents.
It does not replicate the official graph. It does not validate legal rules.
It does not execute authorization by subgraph traversal.

## 1. Scope of use

Use the Automerge Repo in these cases:

- Collaborative documents.
- Collaborative spreadsheets and boards.
- Drafts between devices.
- Small states that need CRDT merge.
- Presence associated with a document.
- Ephemeral messages associated with a session.
- Empty documents used as ephemeral rooms.

Do not use the Automerge Repo to replicate graph SQLite tables. The
official graph syncs through the change feed (see
`docs-v2/en/protocol/graph-sync-protocol.md`).

## 2. Shell Document

The Shell Document is an empty or minimal `DocHandle`. It serves session
broadcast and presence. The room identifier derives from a capability
secret:

```
RendezvousId = SHA-256(rendezvous_secret || ASSET:PERMISSION_ID)
```

Only those who hold the matching UCAN receive the `rendezvous_secret`.

The Automerge Repo does not create the WebRTC connection. The
`NetworkAdapterPort` creates and maintains the connection. The Automerge
Repo consumes the connection through a thin adapter.

## 3. Ephemeral messages

Use `DocHandle.broadcast()` for session discardable messages. Examples:
cursor, presence, typing and progress.

Rules:

1. Broadcast does not guarantee delivery.
2. Do not use broadcast as final proof of an operation.
3. Use directed frames for RPC, ACK, keys and critical control.
4. Use the outbox or the graph for data that must survive a crash.

## 4. Changes persistence

There is one single owner for Changes persistence: the Automerge
`StorageAdapter`. The adapter saves and compacts the increments.

Rules:

1. Do not keep a second full copy of Changes without a proven need.
2. Use `pending_changes` only for commit metadata or audit.
3. The allowed alternative is to implement the `StorageAdapter` over the
   chosen local storage.

## 5. Collaborative commit cycle

1. Edits feed the Automerge Repo in real time.
2. The commit trigger fires on inactivity or operation threshold.
3. The commit generates a consolidated snapshot with `Automerge.save(doc)`.
4. The client sends the snapshot as a proposal to the authority.
5. The confirmation creates the official version node in the change feed.
6. The version node is self-contained. Rehydration uses `Automerge.load`.

Before confirmation, the state is `pending` and local. After confirmation,
the state is `finalized` and durable. No third state exists.

## 6. Co-signature

When the `SPECIFICATION` requires joint approval, the proponent sends the
snapshot hash by directed frame to the co-signers. The signatures return by
directed frame with ACK. The signature set enters the proposal payload. No
coordination message remains in the graph.

## 7. Fork resolution

The authority resolves lineage forks of a document on the confirmation path. The authority serializes non-commutative proposals. For
commutative document content, the merge uses Automerge itself. The merge
node references both branches by two `MUTATES` edges and has an HLC higher
than both.

## 8. Conformance tests

1. A confirmed document rehydrates with `Automerge.load` without the
   Changes history.
2. A lost broadcast message does not change the official state.
3. The client does not open a WebRTC connection from inside the Automerge
   Repo.
4. No second full Changes copy exists outside the `StorageAdapter`.
5. A snapshot sent as proposal does not become a version node before the
   authority confirmation.
