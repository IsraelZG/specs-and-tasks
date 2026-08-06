---
id: ephemeral-messages
type: concept
status: active
sources:
  - docs-v2/en/protocol/automerge-integration.md
  - https://automerge.org/docs/reference/repositories/ephemeral/
replaces:
  - docs/conceitos/ephemeral-messages.md
---

# ephemeral-messages

Session discardable messages sent by `DocHandle.broadcast()`. Examples:
cursor, presence, typing and progress.

Broadcast does not guarantee delivery. It is not proof of an operation.
RPC, ACK, keys and critical control use directed frames. Data that must
survive a crash uses the outbox or the graph.

Full contract: `docs-v2/en/protocol/automerge-integration.md` section 3.
