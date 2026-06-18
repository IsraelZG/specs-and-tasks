# 05-media-transport-plane.md — Plano de Transporte de Mídia (BLOBs e Stream)

Este documento especifica os dois planos de mídia da Plataforma Projeto SuperApp V0.41 — o **Plano de BLOBs** (mídia durável: imagens, vídeos, arquivos, legendas, áudio) e o **Plano de Stream de Tempo Real** (áudio/vídeo síncronos) — ambos **ortogonais ao RBSR** (que reconcilia o grafo, não mídia). Substitui o stub anterior.

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

A especificação de chaves e o comportamento detalhado de criptografia estão consolidados no verbete canônico [[convergent-encryption]].

A `SPECIFICATION:MEDIA_DELIVERY` que governa o asset declara `dedup_mode: convergent | unique`. O default por modalidade: **Pública/Corporativa → `convergent`**; **P2P Puro → `unique`**.

Consulte o verbete canônico [[convergent-encryption]] para:
- A fórmula de derivação de `K_content` no modo `convergent` e o nonce determinístico antialiançamento.
- A fórmula de derivação de `K_file` no modo `unique`.
- As consequências de privacidade, deduplicação e coordenação com o [[agente-de-sistema]].


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

O modelo que separa o **asset lógico** de suas **renditions** (variações de mídia) está consolidado no verbete canônico [[rendition]].

Consulte o verbete canônico [[rendition]] para:
- A estrutura de nós e arestas que compõe as renditions.
- O uso e as restrições da relação `MUTATES` em renditions.
- Detalhes sobre o gerenciamento de permissões individuais por variação de qualidade ou idioma.
- A geração de renditions por meio de utilitários `compute` assíncronos (ver [[rendition]] e `caderno-3-sdk/19-streaming-reference-spec.md §2`).

### 4.2 Fontes (redundância de ponteiros)

Adicionar uma fonte ao **mesmo ciphertext** (ex.: "este `InfoHash` agora também está no IPFS") **não muda o conteúdo** — não é versão. Modela‑se como **aresta**, nunca como nó novo (`CONTENT:SOURCE` falharia o minimalismo do caderno‑2/01 §4) e nunca como `MUTATES`:

- `PROFILE (operador da fonte) —SERVES→ CONTENT:rendition`, com a URL/CID/magnet como **atributo da aresta**. Adicionar fonte = nova aresta (append‑only); remover = lápide (`weight = 0`).
- **Split durável/efêmero:** fontes duráveis (WebSeed cloud, pin IPFS, super‑peer seeder) = arestas `SERVES` no grafo (mudam raramente, ok replicar via RBSR). Seeders‑peer efêmeros (mobile que pode dormir) = **cache de roteamento local**, nunca no grafo (mesma regra da presença, RFC §Descoberta).

### 4.3 Schema do manifesto (payload do nó da rendition `CONTENT`)

A especificação normativa e o schema do manifesto JSON para cada `rendition` estão consolidados no verbete canônico [[rendition]].

Consulte o verbete canônico [[rendition]] para obter:
- O schema JSON normativo e a tipagem dos campos de metadados de rendition.
- A descrição das propriedades de criptografia associadas e dos ponteiros físicos de adapters de transporte (`webtorrent`, `ipfs`, `cloud_webseed`).

---

## 5. Adapters de Transporte

Cada protocolo é um **NetworkAdapter independente**; o manifesto lista os adapters por rendition; o cliente faz fallback na ordem: **swarm P2P → WebSeed cloud → IPFS** (ou conforme política da `SPECIFICATION:MEDIA_DELIVERY`).

### 5.1 WebTorrent (P2P)

- Browser: WebRTC + trackers WSS privados (sem DHT). Native (Desktop/Cloud): pode adicionar PEX e seeders torrent convencionais (peças potência‑de‑2 garantem compat).
- O `InfoHash` vem do manifesto no grafo — o cliente **não precisa de DHT** para localizar o conteúdo; o swarm serve para multiplicar seeders.

### 5.2 Cloud WebSeed + Edge Translation (BEP 19)

A especificação normativa para a integração de servidores de nuvem como HTTP seeders (BEP 19) e o funcionamento do mecanismo de Edge Translation estão consolidados no verbete canônico [[webseed-bep19]].

Consulte [[webseed-bep19]] para obter:
- O fluxo de upload, registro e download integrado ao swarm WebTorrent.
- A tradução de requisições stateless via Edge Worker (Edge Translation).
- O mapeamento de ranges de peças e tags criptográficas.
- As restrições e regras do funcionamento modality-gated.


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

A especificação normativa para o ciclo de vida, gravação e processamento de transmissões ao vivo está consolidada no verbete canônico [[consolidacao-de-live]].

Consulte [[consolidacao-de-live]] para obter:
- O fluxo operacional de geração de segmentos voláteis (`REPLICABLE_VOLATILE`) e descarte após consolidação.
- Os custos computacionais e re-encriptação associados aos modos `unique` e `convergent`.
- O mecanismo de checkpoints periódicos para lives ilimitadas (24/7).
- A ausência de impacto durável no grafo de metadados.

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


