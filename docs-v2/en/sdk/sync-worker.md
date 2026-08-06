---
id: sync-worker
type: sdk
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 7)
  - docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md (inherited base)
replaces:
  - docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md
  - docs/conceitos/sync-worker.md
concepts:
  - sync-worker
  - outbox
---

# Sync Worker and lifecycle

The Sync Worker is the central data worker of the client. It persists to
SQLite, applies the change feed, manages the outbox and orchestrates the
Automerge Repo. The Sync Worker, Crypto Worker and Index Worker
organization remains.

## 1. Responsibilities

1. Authenticate the authority and maintain the feed session.
2. Apply change feed batches in single transactions.
3. Choose the source of each record: authority or authorized peer.
4. Validate the hash, signature and permission of each record.
5. Manage the durable proposal outbox.
6. Orchestrate the Automerge Repo for collaborative documents.
7. Execute the domain rules declared in the `SPECIFICATION`s.

## 2. Synchronization loop

1. The worker sends the last applied cursor per partition.
2. The worker receives the next manifest.
3. The worker validates the manifest and the chain.
4. The worker downloads the records from the chosen sources.
5. The worker validates each record.
6. The worker writes the batch in one transaction and advances the cursor.
7. The worker asks the authority for gaps.

Fingerprint anti-entropy is no longer the normal path. The partition
monotonic cursor is the position proof. The worker can use state hash
comparison as a helper audit check.

## 3. Proposal sending

1. The worker reads `pending` proposals from the outbox in creation order.
2. The worker sends each proposal through the `FEED_SYNC` channel.
3. On `confirmed`, the worker marks the proposal and waits for the record
   in the feed.
4. On `rejected`, the worker records the reason and removes the proposal
   from the queue.
5. On timeout, the worker resends. The `proposal_id` guarantees
   idempotency.

## 4. Loading waves

The waves remain read prioritization. They now consume the feed.

| Wave | Content | Blocking |
| :--- | :--- | :--- |
| 0 | identity, permissions, specifications | UI opening |
| 1 | priority domains and hot balances | active screen |
| 2 | background history, pruned state | none |
| 3 | on-demand rehydration | viewing context |

## 5. Offline operation

1. The worker keeps local cache reading.
2. The worker accepts edits and writes outbox proposals.
3. The worker exchanges with peers records covered by known manifests.
4. The worker signals in the interface that the data may be stale.

## 6. Memory and garbage collection

The inherited memory lifecycle remains: partial UI cache, 4-hour TTL for
epoch keys in RAM and garbage collection with separate pools. Local pruning
follows the replica policy (see `docs-v2/en/sdk/sqlite-schema.md`). The
`compressed` intermediate state remains between `integral` and
`pruned_replica`.

## 7. Multi-tab

The worker stack has one owner per origin. The preferred path uses
SharedWorker. The fallback uses Web Locks. Follower tabs do not open their
own sync connections.

## 8. Conformance tests

1. Two clients with the same cursor converge after the same batch.
2. A proposal survives app closure and is sent on return.
3. An invalid batch aborts the transaction without advancing the cursor.
4. The worker shows the possibly-outdated indicator when the authority is
   unreachable.
5. A record received from a peer without a matching manifest is not
   applied.
