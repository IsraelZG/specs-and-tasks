# 05-media-transport-plane.md — Plano de Transporte de Mídia (BLOBs e Stream)

Este documento especifica os dois planos de mídia da Plataforma V3.1 — o **Plano de BLOBs** (mídia durável: imagens, vídeos, arquivos, legendas, áudio) e o **Plano de Stream de Tempo Real** (áudio/vídeo síncronos) — ambos **ortogonais ao RBSR** (que reconcilia o grafo, não mídia). Substitui o stub anterior.

---

## 1. Separação de Planos

| Plano | Natureza | Transporte | Cifra | Sobrevive à sessão? |
| :--- | :--- | :--- | :--- | :--- |
| **BLOBs** | Durável | WebTorrent / IPFS / Cloud‑WebSeed (adapters) | Por chunk (§3) | Sim |
| **Stream** | Efêmero | LiveKit (WebRTC P2P / fanout via relay) | Sessão (DTLS/SRTP) | Não |

O grafo **nunca** armazena o blob nem o stream — apenas metadados, ponteiros e direito de acesso. O blob físico é responsabilidade da custódia gerida (§7) e dos adapters (§5); o stream não é persistido.

---

## 2. Modelo de Chunking

- **Fatiamento:** o plaintext é dividido em chunks de tamanho potência‑de‑2 (default `chunk_size = 1 MiB = 1.048.576 bytes`), antes do upload.
- **Compat torrent convencional:** as **peças do torrent são construídas sobre o ciphertext** com `piece_length = chunk_size` (potência‑de‑2 limpa). As tags de autenticação **não** vão inline (ver §3.3), preservando a compatibilidade com clientes torrent padrão e a opção de seeders torrent convencionais.
- **Conteúdo endereçável:** o `InfoHash` (e, quando aplicável, o `CID` IPFS) é calculado **sobre o ciphertext** — nunca sobre o plaintext.

---

## 3. Criptografia por Chunk

### 3.1 Algoritmo e independência

Cada chunk é cifrado **independentemente** com AES‑256‑GCM, produzindo `(ciphertext_i, tag_i)` onde `tag_i` tem 16 bytes. A independência é o que permite **decifração progressiva** (streaming via HTTP Range, §5.2) sem manter o arquivo inteiro em memória, e **validação por chunk** (a tag autentica cada peça antes de entregar ao player).

### 3.2 Dois modos de chave (escolhidos por modalidade / SPECIFICATION)

A `SPECIFICATION:MEDIA_DELIVERY` que governa o asset declara `dedup_mode: convergent | unique`. O default por modalidade: **Pública/Corporativa → `convergent`**; **P2P Puro → `unique`**.

**Modo `convergent` (managed, com deduplicação):**
- A chave deriva do **próprio conteúdo**, de forma determinística e idêntica para qualquer publicador da mesma rede:
```
K_content = HKDF(salt_rede, H(plaintext_canônico), "blob-convergent-v1")  // 32 bytes
```
onde `salt_rede` é um segredo de rede mantido pelo agente do sistema (escopa a dedup à rede; duas redes não cruzam confirmação de arquivos).
- **Nonce determinístico:** `nonce_i = fixed_field(8B) ‖ counter_i(4B big‑endian)`, com `fixed_field = H(plaintext_canônico)[:8]` e `counter_i = i`. É seguro porque conteúdo diferente ⇒ `K_content` *e* `fixed_field` diferentes; conteúdo igual ⇒ mesmo ciphertext (que é o objetivo da dedup). Nunca ocorre "(chave, nonce) iguais sobre plaintexts diferentes" — a condição do *forbidden attack* do GCM.
- **Consequência:** conteúdo igual → ciphertext igual → `InfoHash` igual → **deduplicação na camada de storage/swarm** (uma cópia física na rede). O upload e a geração de chunks/chaves no modo convergente são **coordenados pelo agente do sistema** (`PROFILE:SYSTEM`), que aplica o `salt_rede` consistente e checa se o `InfoHash` já existe antes de re‑subir.

**Modo `unique` (P2P puro, sem deduplicação):**
- Chave única por arquivo, não derivada do conteúdo:
```
K_file = HKDF(epoch_key, file_entity_id, "blob-unique-v1")  // 32 bytes
```
- **Nonce:** `fixed_field` aleatório por arquivo `‖ counter_i`.
- **Consequência:** conteúdo idêntico cifrado por usuários diferentes → ciphertext diferente → `InfoHash` diferente → **sem dedup**, mas **sem confirmation‑of‑file attack** — privacidade máxima.

### 3.3 Armazenamento das tags (região trailing)

As `N` tags (16 bytes cada) **não** são intercaladas no stream de ciphertext (preserva `piece_length` potência‑de‑2 e compat convencional) e **não** vão para o grafo em mídia (16×N pode chegar a centenas de KB; re‑poluiria o RBSR). São armazenadas como uma **região contígua ao final do mesmo torrent/objeto**, após as peças de conteúdo. O manifesto grava `tag_region.offset` e `tag_region.length = 16 × N`.

- **Streaming:** o cliente busca a região de tags **primeiro** (~16 KB por GB), cacheia, e então faz streaming sequencial; para decifrar o chunk `i` usa `peça_i` + `tag_region[16i : 16i+16]`.
- **Dedup preservado:** mesmo conteúdo → mesmas tags → mesma região → **um único `InfoHash`**.
- (Para blobs minúsculos, opcionalmente, as tags podem ir no payload do `CONTENT:FILE`; não recomendado para mídia.)

### 3.4 Entrega da chave (ortogonal à dedup)

A chave (`K_content` ou `K_file`) **nunca** está no asset nem no manifesto em claro. É armazenada **envelopada** sob a chave de época da audiência e entregue pelo **Key Vault** após validação do UCAN (fluxo inverso capability‑based, caderno‑2/02 §2.2). Assim, mesmo no modo convergente — em que o ciphertext é uma cópia única compartilhada — **só peers autorizados recebem a chave**. Deduplicação (camada de ciphertext) e controle de acesso (camada de entrega de chave) são independentes.

---

## 4. Manifesto, Renditions e Fontes

### 4.1 Asset lógico vs renditions

- O **asset lógico** é um nó `CONTENT` (ex.: "o filme X") governado por `GOVERNED_BY → SPECIFICATION:MEDIA_ASSET`. Não carrega ciphertext; agrega renditions.
- Cada **rendition** (1080p, 4K, legenda PT, áudio 128 kbps, foto 2048px) é um **nó `CONTENT` próprio**, content‑addressed e imutável, governado por `GOVERNED_BY → SPECIFICATION:MEDIA_RENDITION`, ligado ao asset lógico por uma **aresta estrutural** `RELATES:MEDIA:RENDITION` (asset → rendition). Renditions são **irmãs, não versões** — por isso `MUTATES` é proibido entre elas. Cada rendition pode ter `ASSET:PERMISSION` e `AUTHORED` próprios (4K pago vs 1080p free; legenda adicionada depois por outro autor).
- **`MUTATES` é reservado** para o único caso de versão real: re‑encodar/corrigir os *bytes de uma rendition específica* (substituir um encode 1080p ruim). Aí `MUTATES` aponta da nova versão da rendition para a anterior, como qualquer linhagem.

### 4.2 Fontes (redundância de ponteiros)

Adicionar uma fonte ao **mesmo ciphertext** (ex.: "este `InfoHash` agora também está no IPFS") **não muda o conteúdo** — não é versão. Modela‑se como **aresta**, nunca como nó novo (`CONTENT:SOURCE` falharia o minimalismo do caderno‑2/01 §4) e nunca como `MUTATES`:

- `PROFILE (operador da fonte) —SERVES→ CONTENT:rendition`, com a URL/CID/magnet como **atributo da aresta**. Adicionar fonte = nova aresta (append‑only); remover = lápide (`weight = 0`).
- **Split durável/efêmero:** fontes duráveis (WebSeed cloud, pin IPFS, super‑peer seeder) = arestas `SERVES` no grafo (mudam raramente, ok replicar via RBSR). Seeders‑peer efêmeros (mobile que pode dormir) = **cache de roteamento local**, nunca no grafo (mesma regra da presença, RFC §Descoberta).

### 4.3 Schema do manifesto (payload do nó da rendition `CONTENT`)

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

---

## 5. Adapters de Transporte

Cada protocolo é um **NetworkAdapter independente**; o manifesto lista os adapters por rendition; o cliente faz fallback na ordem: **swarm P2P → WebSeed cloud → IPFS** (ou conforme política da `SPECIFICATION:MEDIA_DELIVERY`).

### 5.1 WebTorrent (P2P)

- Browser: WebRTC + trackers WSS privados (sem DHT). Native (Desktop/Cloud): pode adicionar PEX e seeders torrent convencionais (peças potência‑de‑2 garantem compat).
- O `InfoHash` vem do manifesto no grafo — o cliente **não precisa de DHT** para localizar o conteúdo; o swarm serve para multiplicar seeders.

### 5.2 Cloud WebSeed + Edge Translation (BEP 19)

Integra nuvem (S3/GCS/Drive) ao swarm **sem rodar cliente torrent na nuvem**:

1. **Upload:** o agente do sistema (managed) cifra por chunk e envia o ciphertext via HTTP para a nuvem como **um objeto consolidado por rendition** (no S3, o Multipart Upload é só o transporte de upload; ao completar vira um objeto único). As tags vão na `tag_region` ao final do mesmo objeto.
2. **Registro:** grava `InfoHash` + URL HTTP do WebSeed no manifesto / aresta `SERVES`.
3. **Download:** o cliente WebTorrent é instanciado com o magnet + a URL do WebSeed.
4. **Edge Translation:** um **Edge Worker** (Cloudflare/Lambda) atua como ponte stateless e **content‑blind**: injeta o token de acesso ao bucket e traduz `HTTP Range` ↔ peça do WebTorrent sob demanda. **Vê apenas ciphertext + token**, nunca a chave AES. Duas camadas: *token* = "pode buscar estes bytes do bucket" (acesso ao storage); *chave AES* = "pode ler estes bytes" (conteúdo).
5. **Range‑Range:** o objeto na nuvem é segmentado **só na transmissão** via `Range: bytes=...`. `peça_i = objeto[i × piece_length : (i+1) × piece_length]`; `tag_i = objeto[tag_region.offset + 16i : +16]`.

> **Modality‑gated:** o WebSeed/Edge é feature de modalidade gerida. Em P2P puro sem Edge Worker, a redundância vem de seeders‑peer + custódia.

### 5.3 IPFS

- **Privacidade por cifra no cliente** (recomendado), não Private Swarm Key (que quebra interop). Cifra‑se antes de publicar; o `CID` é do **ciphertext**, inútil sem a chave (entregue via UCAN/Key Vault). Equivalente ao WebTorrent: o `CID` público é descobrível, mas o conteúdo não é legível.

### 5.4 Limite de metadado (comum a P2P/IPFS)

O `InfoHash`/`CID` é público e anunciável: um observador que **já conhece** o hash vê que uma transferência ocorre e seu tamanho/popularidade — não o conteúdo. Mitigação: **escopar descoberta a trackers WSS privados / relays da rede** (não à Mainline DHT pública). Conhecer o hash exige acesso ao grafo.

---

## 6. Reidratação na UI

Segue o pipeline do RFC de transporte §3.4 (Service Worker → Sync Worker → adapter → Crypto Worker → `ReadableStream` → `SourceBuffer`), com um passo adicional: **na abertura do stream, o Service Worker busca primeiro a `tag_region` e a cacheia**; para cada `peça_i` recebida, combina com `tag_i` e despacha ao Crypto Worker para `AES-256-GCM(decrypt)`. Backpressure (`PAUSE/RESUME_STREAM`, 20 MB/5 MB) e zero‑copy (`postMessage(buffer, [buffer])`) inalterados. Chunks descriptografados nunca são expostos ao contexto da página.

---

## 7. Ponte com a Custódia Gerida

O blob está **fora do RBSR**, então a custódia do grafo (anel por consistent‑hashing, RELEASE/ACK — RFC §4) governa os *registros* `CONTENT:FILE`/arestas, e a disponibilidade do **ciphertext físico** é governada separadamente:

- **Disponibilidade declarada por tier:** um peer só é fixado como custódio de chunk se seu tier (RFC §Tiers) declara e verifica `seeder`/`store`. Mobile efêmero nunca recebe custódia crítica de blob.
- **Contabilidade de banda:** o serving de chunk gera recibo assinado pela contraparte ancorado ao `InfoHash`/hash de chunk (v4 §3.3), alimentando o standing de contribuição.
- **G4 (RFC §4.5):** expulsão de blob por **Rarest‑First** cruzado com o ranking de custódia; raridade estimada via contagem de seeders no tracker privado/PEX (não DHT).
- **Modalidades:** P2P puro = replication factor por gossip + custódia; Corporativa = super peer mantém 100% + WebSeed; Pública = sharding + peer de sistema como WebSeed de fallback.

---

## 8. Stream de Tempo Real e Gravação de Lives

### 8.1 Stream de tempo real (LiveKit)

- Áudio/vídeo síncronos via **LiveKit**; `REPLICABLE_VOLATILE` (caderno‑3/02): não sobrevive ao ciclo de reconciliação.
- WebRTC P2P (1‑para‑1) ou fanout via relay (1‑para‑muitos / lives). Referência ao stream = `CONTENT:LIVE_SESSION` (metadata: quem está live, desde quando), ligada ao broadcaster por aresta `STREAMS` (não‑durável).
- **Fanout em P2P puro sem relay** permanece problema aberto (pesquisa); mitigado por super‑peer observador que replica o stream (hierarquia temporária aceitável).

### 8.2 Gravação de live em andamento (segmentos voláteis → blob consolidado)

O tempo real de baixa latência (sub‑segundo, espectador junto do broadcaster) é a §8.1. **Servir a gravação assistível progressivamente** (VOD da live, latência de segmento) é diferente — e **não** é um torrent crescendo: o BitTorrent exige conteúdo completo (o `InfoHash` é calculado sobre o conjunto fechado de peças). O padrão é **segmentos completos + consolidação**, não um único torrent que cresce.

**Durante a live:**
- A cada ~6 s fecha‑se um **segmento** — um blob completo e imutável, com seu próprio `InfoHash` e região trailing de tags (sem problema: o segmento *está* fechado).
- Os segmentos são **`REPLICABLE_VOLATILE`** (observados pelos espectadores, não auditáveis, descartados após consolidar): seus magnets trafegam pelo **canal efêmero** (WebRTC / Automerge ephemeral), **nunca como nós de grafo**. Isso elimina o overhead de N nós por live (uma live de 2 h a 6 s = 1.200 nós evitados).
- **Fonte de verdade = disco local do broadcaster.** Ele grava em disco de qualquer forma; esse arquivo é a fonte de verdade. O canal efêmero é **distribuição‑only** para quem assiste ao vivo — nunca a origem do dado durável.

**Ao encerrar a live:**
- Consolida‑se a gravação local num **único blob**, sobe‑se ao WebTorrent, e commita‑se **um** nó `CONTENT:FILE` com o magnet do todo (`REPLICABLE_AUDITABLE`, spec normal §2–§7). Os segmentos voláteis são descartados.
- **Por que consolidar (e não commitar um manifesto de N segmentos):** saúde de swarm — um swarm único onde todos os espectadores seedam entre si, vs N swarms fragmentados onde quem está no segmento 5 não ajuda o segmento 200; além de alvo único de custódia/dedup e download de arquivo único.

**Custo da consolidação (depende do modo de cifra, §3.2):**
- **`unique` (P2P puro):** se os segmentos compartilharem a mesma chave com **contador contínuo** entre eles, concatenar os ciphertexts **já é** o ciphertext final → só **re‑hash** para o `InfoHash`, sem re‑encriptar.
- **`convergent` (managed):** a chave final = `HKDF(salt_rede, H(plaintext_completo))`, conhecida só no fim → os segmentos da live usam uma **chave de sessão temporária** → há **re‑encriptação** ao consolidar (custo pago pelo agente do sistema, que coordena o upload nessas modalidades).

**Lives ilimitadas (24/7):** sem "fim" para disparar a consolidação única → **checkpoint periódico** (consolidar + commitar um blob a cada X, ex.: por hora).

**Sem tipo durável novo:** a fase de live não tem footprint durável além do `CONTENT:LIVE_SESSION` efêmero (§8.1); a gravação encerrada é um `CONTENT:FILE` comum. Não há estrutura de manifesto durável crescente nem subtipo `LIVE_VOD`.

---

## 9. Limites Honestos

- **Confirmation‑of‑file (modo `convergent`):** quem adivinha o conteúdo confirma sua presença e deriva a chave. Aceito em redes geridas (corporativo já lê tudo via Central Custody; público dedup'a o que é compartilhado). **Nunca** em P2P puro (que usa `unique`).
- **Dedup é intra‑audiência no modo `unique`** e **intra‑rede no modo `convergent`** — nunca global entre redes (silos, caderno‑1/01 §4.4; `salt_rede` escopa a convergência).
- **WebSeed/Edge é managed‑only.** P2P puro não tem redundância de nuvem.
- **Seeder mobile dorme:** disponibilidade é da custódia gerida (§7), não do seeder original.
- **Crash antes de consolidar:** se os segmentos da live viverem **só** no canal efêmero, um crash do broadcaster antes do encerramento perde a gravação. Resolução: o **disco local do broadcaster é a fonte de verdade** (ele grava de qualquer forma); o canal efêmero é distribuição‑only; no restart, consolida o que há em disco e sobe. Lives críticas/ilimitadas usam checkpoint periódico (§8.2).

---

## Referências

- RFC de Transporte §3.4 (pipeline de reidratação), §4 (custódia), §Descoberta (presença efêmera, fontes efêmeras).
- Caderno‑2/02 §2.2 (Key Vault, fluxo inverso), §4.1 (Central Custody).
- v4 §3.3 (recibo de banda ancorado ao `InfoHash`).
- Caderno‑2/01 §4 (minimalismo de tipos), §4.2 (antipadrão dual‑nó).
