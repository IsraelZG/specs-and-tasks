---
id: sync-worker
type: concept
status: active
sources:
  - docs-v2/en/sdk/sync-worker.md
replaces:
  - docs/conceitos/sync-worker.md
---

# sync-worker

Central client data worker. It persists to SQLite, applies the change
feed, manages the proposal outbox and orchestrates the Automerge Repo.

The Sync Worker no longer runs RBSR as the normal path. The monotonic
partition cursor defines the client position in the feed.

Full contract: `docs-v2/en/sdk/sync-worker.md`.
