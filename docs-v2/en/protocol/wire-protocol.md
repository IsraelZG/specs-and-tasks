---
id: wire-protocol
type: protocol
status: active
protocol-version: 1
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 9)
  - docs/caderno-2-protocol/05-wire-protocol.md (inherited physical frame)
replaces:
  - docs/caderno-2-protocol/05-wire-protocol.md
concepts:
  - network-adapter-port
  - logical-channel
---

# Wire Protocol — frames and logical channels

## 1. Physical frame

```
[LENGTH: uint32 BE] [VERSION: uint8] [CHANNEL: uint8] [FRAME_TYPE: uint8] [PAYLOAD: MessagePack]
```

- `LENGTH` excludes the field itself. A value above the channel ceiling
  means rejection without parse.
- The current `VERSION` is `0x01`. The value `0x00` is invalid.
- `CHANNEL` identifies the logical channel (section 2).
- `FRAME_TYPE` identifies the message inside the channel (section 3).
- `PAYLOAD` uses MessagePack. Unknown fields stay preserved and ignored.

## 2. Logical channels

One physical connection per peer multiplexes the protocols over the
`NetworkAdapterPort`. Each logical channel has its own version, size limit,
backpressure, timeout and cancellation.

| Code | Channel | Frame ceiling | Default timeout |
| :--- | :--- | :--- | :--- |
| `0x01` | `FEED_SYNC` — change feed sync | 1 MiB | 30 s |
| `0x02` | `CONTROL` — control and ACK | 64 KiB | 10 s |
| `0x03` | `AUTOMERGE` — Automerge Repo messages | 1 MiB | 30 s |
| `0x04` | `EPHEMERAL` — directed ephemeral messages | 64 KiB | 5 s |
| `0x05` | `IDENTITY` — identity and keys | 256 KiB | 15 s |
| `0x06` | `TELEMETRY` — allowed telemetry | 64 KiB | 10 s |
| `0xF0–0xFF` | reserved for network `SPECIFICATION` extension | — | — |

Cancelling one channel does not drop the physical connection. The
backpressure of one channel does not block the other channels.

## 3. Frame types per channel

### 3.1 Channel `FEED_SYNC`

| Code | Type | Direction |
| :--- | :--- | :--- |
| `0x01` | `FEED_SUBSCRIBE` (initial cursor per partition) | client → authority |
| `0x02` | `MANIFEST` (batch manifest) | authority → client |
| `0x03` | `RECORD_REQUEST` (requested ids) | client → source |
| `0x04` | `RECORD_BATCH` (requested records) | source → client |
| `0x05` | `PROPOSAL` (write proposal) | client → authority |
| `0x06` | `PROPOSAL_RESULT` (confirmation or rejection) | authority → client |
| `0x07` | `GAP_REQUEST` (gap request) | client → authority |

### 3.2 Channel `CONTROL`

| Code | Type |
| :--- | :--- |
| `0x01` | `ACK` |
| `0x02` | `NACK` (with normative error code) |
| `0x03` | `HEARTBEAT_PING` |
| `0x04` | `HEARTBEAT_PONG` |
| `0x05` | `CHANNEL_CLOSE` |

### 3.3 Channel `AUTOMERGE`

| Code | Type |
| :--- | :--- |
| `0x01` | `AM_MESSAGE` (opaque Automerge Repo bytes) |

The internal Automerge messages are opaque bytes. The transport does not
convert those bytes to the domain schema.

### 3.4 Channel `EPHEMERAL`

| Code | Type |
| :--- | :--- |
| `0x01` | `EPHEMERAL_MESSAGE` (discardable, no ACK) |
| `0x02` | `DIRECTED_FRAME` (RPC, ACK, keys, critical control) |

Critical messages use `DIRECTED_FRAME` with ACK or outbox persistence.
Never use `EPHEMERAL_MESSAGE` as proof of an operation.

### 3.5 Channel `IDENTITY`

| Code | Type |
| :--- | :--- |
| `0x01` | `IDENTITY_CATCHUP` |
| `0x02` | `KEY_REQUEST` |
| `0x03` | `KEY_RESPONSE` |

## 4. Connection authentication

The connection uses Noise_XX with mutual authentication. The static key is
the device key. The handshake exchanges the `identity_epoch_index`.
Identity epoch divergence diverts the channel to `IDENTITY_CATCHUP` before
any domain traffic. The error `STALE_EPOCH` refers only to the identity
epoch.

## 5. Version evolution

1. Higher version in a volatile channel (`EPHEMERAL`, `CONTROL`,
   `TELEMETRY`): discard the frame and keep the connection.
2. Higher version in an auditable channel (`FEED_SYNC`, `IDENTITY`): write
   to quarantine, outside projections, and emit `UPGRADE_REQUIRED`.
3. Lower version: try the regressive schema. On failure, quarantine.
4. The signed record envelope is invariant across frame versions.

## 6. Normative errors

| Code | Condition |
| :--- | :--- |
| `FRAME_TOO_LARGE` | `LENGTH` above the channel ceiling |
| `VERSION_UNSUPPORTED` | version without regressive schema |
| `STALE_EPOCH` | diverging identity epoch |
| `CHANNEL_TIMEOUT` | no answer within the channel timeout |
| `BACKPRESSURE_APPLIED` | channel queue at its limit |

## 7. Conformance tests

1. The receiver rejects a frame with `LENGTH` above the ceiling without parse.
2. A future-version frame does not crash and does not corrupt projections.
3. Cancelling one channel preserves the other channels and the
   connection.
4. The client retransmits a `DIRECTED_FRAME` without ACK within the timeout.
5. `AUTOMERGE` channel bytes reach the adapter without interpretation.
