---
id: media-transport-plane
type: sdk
status: active
sources:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (section 10)
  - docs/caderno-3-sdk/05-media-transport-plane.md (inherited base)
replaces:
  - docs/caderno-3-sdk/05-media-transport-plane.md
  - docs/conceitos/private-swarm.md (DHT discovery)
concepts:
  - blob-manifest
---

# Media transport plane

Blobs stay outside the graph change feed. The graph stores hash, size,
cipher and locators. The bytes travel through specialized adapters, such as
WebTorrent.

## 1. Plane separation

| Plane | Nature | Transport | Persistence |
| :--- | :--- | :--- | :--- |
| Graph | official records | change feed | authority |
| Blobs | encrypted bytes | adapters (WebTorrent, WebSeed) | designated custody |
| Stream | synchronous audio and video | WebRTC | does not persist |

## 2. Blob manifest

The authority publishes the manifest of each blob. The manifest is an
official graph record.

```typescript
interface BlobManifest {
  manifest_id: Ulid;
  network_id: Ulid;
  content_hash: Hash32;        // hash of the full ciphertext
  size_bytes: number;          // uint53
  chunk_size: number;          // power of 2; default 1 MiB
  chunk_hashes: Hash32[];      // hash per encrypted chunk
  cipher: 'AES-256-GCM';
  tag_region_offset: number;   // trailing GCM tag region
  tag_region_length: number;   // 16 * chunk count
  locators: BlobLocator[];     // authorized sources
  issued_at: number;
  authority_key: PubKey;
  signature: Signature;
}

interface BlobLocator {
  kind: 'private_tracker' | 'webseed' | 'authorized_peer';
  uri: string;                 // source address
}
```

## 3. Transport rules

1. Peers can serve encrypted chunks.
2. The receiver validates the hash of each chunk before use.
3. The receiver validates the GCM tag of each chunk before decrypting.
4. The decryption key comes from the Key Vault after UCAN validation.
5. A public DHT is not used for regulated network metadata.
6. Private trackers, WebSeeds and authorized peers are the allowed
   sources.

## 4. Chunking and cipher (kept)

The client splits the plaintext into power-of-2 chunks. The client encrypts each chunk
independently with AES-256-GCM. The client calculates the `InfoHash` over the
ciphertext. The GCM tags stay in a contiguous region at the end of the
object. The `convergent` and `unique` modes remain. The regulated profile
uses the mode that the network `SPECIFICATION` declares.

## 5. UI rehydration

The pipeline remains: Service Worker, Sync Worker, adapter, Crypto Worker,
`ReadableStream`, `SourceBuffer`. The Service Worker fetches the tag region
before the stream. Decrypted bytes never enter the page context.

## 6. Custody

The authority designates blob custodians among its own instances and
authorized peers with a verified tier. An ephemeral mobile peer does not
receive critical custody. Blob availability is the responsibility of the
authority, not of the original seeder.

## 7. Conformance tests

1. The receiver discards a chunk with a diverging hash before use.
2. The receiver rejects a blob served by a source outside `locators`.
3. No regulated network blob metadata goes to a public tracker or DHT.
4. The receiver rejects a manifest without a valid authority signature.
