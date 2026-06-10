---
title: Rendition
slug: rendition
aliases:
  - rendition
  - Renditions
  - manifesto de rendition
  - CONTENT:RENDITION
  - RELATES:MEDIA:RENDITION
tags:
  - protocol
  - media
  - content
  - canonical
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/05-media-transport-plane.md §4.1
aparicoes-consolidadas:
  - docs/glossary.md §Rendition
  - docs/caderno-3-sdk/05-media-transport-plane.md §4.1
dependencias:
  - [[content]]
  - [[specification]]
  - [[mutates]]
  - [[asset-permission]]
  - [[profile]]
  - [[serves-aresta]]
  - [[convergent-encryption]]
---

# Rendition

## Definição

Uma **rendition** (ou variação de mídia) é uma variante de um asset de mídia (representando uma qualidade específica, idioma, bitrate, tamanho ou codec) modelada como um nó `CONTENT` próprio, content‑addressed e imutável, governado por `GOVERNED_BY → SPECIFICATION:MEDIA_RENDITION`, e ligado ao asset lógico por uma aresta estrutural `RELATES:MEDIA:RENDITION`. Renditions que representam o mesmo conteúdo são consideradas irmãs, não versões, de modo que o uso de arestas `MUTATES` entre elas é proibido.

## Por quê → [[caderno-1-vision]]

A separação de um asset de mídia em múltiplos nós de rendition permite grande granularidade no controle de acesso e na distribuição de banda. Mídias diferentes do mesmo asset lógico (como uma versão em 4K paga, uma versão 1080p gratuita, ou uma legenda traduzida por terceiros) podem requerer diferentes permissões e ser de autoria de perfis distintos. Isso atende ao princípio de soberania e privacidade da plataforma, permitindo que a distribuição se adapte perfeitamente aos requisitos específicos de rede de cada peer e modalidade de acesso. Ver `caderno-1-vision/01-vision-and-positioning.md §4.1` e `caderno-3-sdk/05-media-transport-plane.md §4.1`.

## Contrato → [[caderno-2-protocol]]

No modelo do grafo de metadados:
- O **asset lógico** é um nó `CONTENT` (ex.: "o filme X") governado por `GOVERNED_BY → SPECIFICATION:MEDIA_ASSET`. Não carrega ciphertext; agrega renditions.
- Cada **rendition** (1080p, 4K, legenda PT, áudio 128 kbps, foto 2048px) é um **nó `CONTENT` próprio**, content‑addressed e imutável, governado por `GOVERNED_BY → SPECIFICATION:MEDIA_RENDITION`, ligado ao asset lógico por uma **aresta estrutural** `RELATES:MEDIA:RENDITION` (asset → rendition). Renditions são **irmãs, não versões** — por isso `MUTATES` é proibido entre elas. Cada rendition pode ter `ASSET:PERMISSION` e `AUTHORED` próprios (4K pago vs 1080p free; legenda adicionada depois por outro autor).
- **`MUTATES` é reservado** para o único caso de versão real: re‑encodar/corrigir os *bytes de uma rendition específica* (substituir um encode 1080p ruim). Aí `MUTATES` aponta da nova versão da rendition para a anterior, como qualquer linhagem.

Ver `caderno-2-protocol/01-graph-ontology.md §3` e `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.2`.

## Implementação → [[caderno-3-sdk]]

O comportamento técnico detalhado e a especificação das renditions e seus formatos de transporte estão consolidados em [`caderno-3-sdk/05-media-transport-plane.md §4.1`](../caderno-3-sdk/05-media-transport-plane.md).

O payload (manifesto) do nó de `CONTENT:rendition` é estruturado conforme o seguinte esquema JSON normativo:

```json
{
  "asset_id": "video_x",
  "rendition": { "kind": "video", "quality": "1080p", "lang": null, "codec": "h264" },
  "encryption": {
    "algorithm": "AES-256-GCM",
    "dedup_mode": "convergent",
    "chunk_size_bytes": 1048576,
    "chunk_count": 1024,
    "plaintext_size_bytes": 1073741824,
    "fixed_field_ref": "derivado de H(plaintext)[:8] (convergent) | aleatório (unique)",
    "key_ref": "urn:ucan:epoch_key_id_123",
    "tag_region": { "offset": 1073741824, "length": 16384 }
  },
  "pointers": [
    { "adapter": "webtorrent", "infohash": "hash_do_ciphertext", "piece_length": 1048576 },
    { "adapter": "ipfs",       "cid": "cid_do_ciphertext" },
    { "adapter": "cloud_webseed", "url": "https://webseed.suarede.com/blobs/" }
  ]
}
```

> `pointers` é a lista de adapters disponíveis para esta rendition (espelha as arestas `SERVES` duráveis). O cliente escolhe por disponibilidade/custo/latência. `piece_length = chunk_size` (potência‑de‑2; as tags ficam fora do stream, em `tag_region`).

Os clientes selecionam a rendition ideal com base em capacidades de rede/dispositivos e realizam o download das peças de forma paralela ou progressiva através da lista de `pointers` (que mapeiam os adapters WebTorrent, IPFS ou HTTP Cloud WebSeed).

## Evolução → [[caderno-4-governance]]

Novos tipos de codecs, tipos de arquivo ou adapters de transporte podem ser introduzidos registrando-se novas especificações que estendam as definições de `SPECIFICATION:MEDIA_RENDITION`. Essas mudanças seguem o ciclo de vida normalizado pelo processo de RFCs e versionamento SemVer (ver [[specification]]).

## Aparições a consolidar

- `docs/glossary.md §Rendition` — definição resumida de uma linha; consolidada neste verbete.
- `docs/caderno-3-sdk/05-media-transport-plane.md §4.1` e `§4.3` — seções originais movidas literalmente para este verbete e substituídas por referências e link direto para manter a fonte canônica única.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[content]] | 1 | criado |
| [[specification]] | 1 | criado |
| [[mutates]] | 1 | criado |
| [[asset-permission]] | 2 | criado |
| [[profile]] | 1 | criado |
| [[serves-aresta]] | 11 | <!-- Foam placeholder — Onda 11 --> |
| [[convergent-encryption]] | 11 | criado |
