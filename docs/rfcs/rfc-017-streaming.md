# RFC-017 — Streaming (VOD, Live, Áudio)
> **Status:** Proposta
> **Precedência:** apoia-se no media transport plane (caderno-3/05), nos utilitários `compute` assíncronos da RFC-010 (transcode = utilitário; LiveKit = plugin `infra`) e na máquina econômica da RFC-012. **Produto único** com três modalidades; specs internas separadas, envoltório único (modelo YouTube). **Zero tipo de nó novo.** Onde não tocada, a doc vigente prevalece.
> **Transversais posteriores a aplicar na absorção:** o `VideoEditor`/`AudioEditor` é `ui` plugin/componente rico (RFC-024); a pipeline de upload→transcode→publicação é orquestrável como `SPEC:WORKFLOW` (RFC-022) sobre os utilitários `compute`; `VideoGrid`→player segue o shell (RFC-026); o módulo segue o plano de comando/compartimentação (RFC-027).
> **Tese:** VOD, live e áudio compartilham um catálogo, um perfil de criador e uma economia; diferem só no **plano de transporte** da mídia.

## A.1 — Produto único, três planos de transporte

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/19-streaming-reference-spec.md` | novo | Documento canônico, §1 |

**Texto normativo:** conteúdo = `CONTENT` (vídeo/áudio/live) governado por `SPEC` da modalidade; canal/criador = `PROFILE`; coleção (playlist, álbum, série) = `CONTENT` agregador por aresta. A modalidade só muda como os bytes chegam (§2–§4).

## A.2 — VOD

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/19-streaming-reference-spec.md` | §2 | Adicionar |
| `caderno-3-sdk/05-media-transport-plane.md` | §renditions | Editar: rendition = utilitário `compute` assíncrono (link RFC-010 A.5) |

**Texto normativo:**

1. Arquivo = blob no media plane: chunking, **AES-256-GCM por chunk**, dois modos (convergente para rede gerenciada/dedup; único para P2P puro/privacidade). Entrega P2P por WebSeed/WebTorrent (plugin `infra`, canais próprios — RFC-010 A.3).
2. **Renditions** (qualidades) = `CONTENT` **irmãos** do original, geradas por **utilitário `compute` assíncrono** (transcode) na fila da RFC-010 (A.5.3) — não mais mecanismo avulso. A falha de um job de transcode não invalida a rendition: o orquestrador da fila (RFC-010 A.5.3) re-enfileira o job imediatamente noutro nó, sem perda do `CONTENT` original.
3. Reprodução adaptativa escolhe a rendition pela banda; streaming progressivo a partir dos chunks.

## A.3 — Live

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/19-streaming-reference-spec.md` | §3 | Adicionar |
| `docs/conceitos/consolidacao-de-live.md` | corpo | Editar: link para esta seção |

**Texto normativo:**

1. Transmissão ao vivo via **LiveKit**: o **SDK cliente é embutido** (first-party) e o **SFU é plugin `infra`** que o LiveKit exige (RFC-010 A.3, modality-gated); canais WebRTC próprios, baixa latência fora do reconciliador do grafo. Sem SFU (P2P puro), degrada para WebRTC bruto em grupos pequenos.
2. Segmentos ao vivo são **efêmeros**; ao encerrar, a [[consolidacao-de-live]] (utilitário `compute` assíncrono) consolida num **único `CONTENT:FILE`** que entra no plano VOD — a live vira VOD sem dado duplicado. A [[consolidacao-de-live]] opera em janelas progressivas (rolling-windows, ex. blocos de minutos) gravadas durante a transmissão, de modo que uma queda abrupta do peer gerador preserve os segmentos já consolidados; o `CONTENT:FILE` final agrega as janelas íntegras.
3. Chat e reações ao vivo são a lente de mensagens (RFC-018) sobre a sessão.

## A.4 — Áudio

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/19-streaming-reference-spec.md` | §4 | Adicionar |

**Texto normativo:** áudio (música, podcast) usa a maquinaria de VOD (A.2); álbum/playlist = coleção (A.1). Sem plano novo — é VOD de faixa de áudio.

## A.5 — Monetização

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/19-streaming-reference-spec.md` | §5 | Adicionar |

**Texto normativo:**

1. **Assinatura** (classe `assinatura`, RFC-012) para premium/canal; **pay-per-view** (classe `acesso_licenca`); **anúncios** pré/mid-roll (superfície da RFC-015); **doação/tip** ao vivo = `CREDITS` direto.
2. **Repasse ao criador** = liquidação por SPEC ([[economia-como-modulo]]), por view/assinatura/tempo assistido medido pelo core.
3. O utilitário `compute` de transcode (A.2.2) é remunerado pela máquina econômica da RFC-010/012: peers que executam jobs de rendition (H.264/AV1) recebem `CREDITS` proporcionais ao custo computacional medido, priorizando capacidade ociosa (ex.: GPU) na fila.

## A.6 — Limites honestos

1. Entrega P2P depende de seeders disponíveis; sem seeders/relay, degrada para o operador na modalidade gerenciada — não há garantia de banda em P2P puro. A transição P2P→operador é guiada por métricas observadas pelo player (buffer-ahead abaixo de limiar configurável, taxa de seeders ativos, throughput sustentado); ao cruzar o threshold o player solicita os chunks ao operador na modalidade gerenciada antes do esgotamento do buffer, degradando sem interrupção visível.
2. Latência de live tem piso de rede; não compete com broadcast dedicado em escala sem infra de operador.
3. **DRM honesto:** a chave restringe acesso ao decodificável, mas não impede captura de quem tem permissão de assistir (screen capture). Declarado — não se promete o impossível.

## A.7 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-STR-01..04 |

**T-STR-01** SPECs de conteúdo/canal/coleção + reprodução adaptativa sobre o media plane (DoD Cloud); **T-STR-02** renditions como utilitário `compute` assíncrono (RFC-010) com irmãos `CONTENT`; **T-STR-03** live via LiveKit (plugin infra) + consolidação ao encerrar → `CONTENT:FILE`; **T-STR-04** monetização (assinatura/PPV/ads/tip) + repasse por SPEC; vetor (§0.1.7): sem seeder → degradação declarada, não falha silenciosa.
