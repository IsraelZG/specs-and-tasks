---
id: shell-document
type: concept
status: active
sources:
  - docs-v2/en/protocol/automerge-integration.md
replaces:
  - docs/conceitos/documento-casca.md
---

# shell-document

An empty or minimal `DocHandle` of the Automerge Repo. It serves session
broadcast and presence.

The room identifier derives from a capability secret:
`RendezvousId = SHA-256(rendezvous_secret || ASSET:PERMISSION_ID)`.

The Shell Document does not create the WebRTC connection. The
`NetworkAdapterPort` creates and maintains the connection. The Shell
Document does not persist graph data.

Full contract: `docs-v2/en/protocol/automerge-integration.md` section 2.
