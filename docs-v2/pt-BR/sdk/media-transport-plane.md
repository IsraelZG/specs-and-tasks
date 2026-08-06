---
id: media-transport-plane
tipo: sdk
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 10)
  - docs/caderno-3-sdk/05-media-transport-plane.md (base herdada)
substitui:
  - docs/caderno-3-sdk/05-media-transport-plane.md
  - docs/conceitos/private-swarm.md (descoberta por DHT)
conceitos:
  - blob-manifest
---

# Plano de transporte de mídia

Blobs ficam fora do change feed do grafo. O grafo armazena hash, tamanho,
cifra e localizadores. Os bytes trafegam por adapters especializados, como
WebTorrent.

## 1. Separação de planos

| Plano | Natureza | Transporte | Persistência |
| :--- | :--- | :--- | :--- |
| Grafo | registros oficiais | change feed | autoridade |
| Blobs | bytes cifrados | adapters (WebTorrent, WebSeed) | custódia designada |
| Stream | áudio e vídeo síncronos | WebRTC | não persiste |

## 2. Manifesto de blob

A autoridade publica o manifesto de cada blob. O manifesto é um registro do
grafo oficial.

```typescript
interface BlobManifest {
  manifest_id: Ulid;
  network_id: Ulid;
  content_hash: Hash32;        // hash do ciphertext completo
  size_bytes: number;          // uint53
  chunk_size: number;          // potência de 2; default 1 MiB
  chunk_hashes: Hash32[];      // hash por chunk cifrado
  cipher: 'AES-256-GCM';
  tag_region_offset: number;   // região trailing de tags GCM
  tag_region_length: number;   // 16 * número de chunks
  locators: BlobLocator[];     // fontes autorizadas
  issued_at: number;
  authority_key: PubKey;
  signature: Signature;
}

interface BlobLocator {
  kind: 'private_tracker' | 'webseed' | 'authorized_peer';
  uri: string;                 // endereço da fonte
}
```

## 3. Regras de transporte

1. Peers podem servir chunks cifrados.
2. O receptor valida o hash de cada chunk antes do uso.
3. O receptor valida a tag GCM de cada chunk antes de decifrar.
4. A chave de decifragem vem do Key Vault após validação do UCAN.
5. DHT público não é usado para metadados de rede regulada.
6. Trackers privados, WebSeeds e peers autorizados são as fontes
   permitidas.

## 4. Chunking e cifra (mantidos)

O plaintext é fatiado em chunks de tamanho potência de 2. Cada chunk é
cifrado de forma independente com AES-256-GCM. O `InfoHash` é calculado
sobre o ciphertext. As tags GCM ficam em uma região contígua ao final do
objeto. Os modos `convergent` e `unique` permanecem. O perfil regulado usa
o modo que a `SPECIFICATION` da rede declarar.

## 5. Reidratação na UI

O pipeline permanece: Service Worker, Sync Worker, adapter, Crypto Worker,
`ReadableStream`, `SourceBuffer`. O Service Worker busca a região de tags
antes do stream. Bytes decifrados nunca entram no contexto da página.

## 6. Custódia

A autoridade designa os custódios de blobs entre instâncias próprias e
peers autorizados com tier verificado. Um peer móvel efêmero não recebe
custódia crítica. A disponibilidade do blob é responsabilidade da
autoridade, não do seeder original.

## 7. Testes de conformidade

1. Um chunk com hash divergente é descartado antes do uso.
2. Um blob servido por fonte fora de `locators` é rejeitado.
3. Nenhum metadado de blob de rede regulada vai a tracker ou DHT público.
4. O manifesto sem assinatura válida da autoridade é rejeitado.
