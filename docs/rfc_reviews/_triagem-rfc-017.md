# Triagem — rfc-017 (Streaming: VOD, Live, Áudio)

**Contagens por veredito:** INCORPORAR 4 · JA-COBERTO 2 · UI->INVENTARIO 7 · REJEITAR 0 · REVISAR-HUMANO 1
**Σ vereditos = 14 achados**

## REVISAR-HUMANO (destaque)
- **017-12** — Expiração/purga de blobs P2P abandonados "baseada em métricas" (§5 Fim de Vida): cria mecânica de governança de retenção/GC sobre o media plane que a RFC não especifica e que toca política de armazenamento/economia (quem paga retenção, quando purgar). Decisão arquitetural — não redigir norma.

## Tabela

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 017-01 | Detalhar métricas/thresholds de transição P2P→Operador para evitar buffering brusco na UX (§2 A.2) | INCORPORAR | A.6 (existente, item novo) | Acrescentar a A.6.1: "A transição P2P→operador é guiada por métricas observadas pelo player (buffer-ahead abaixo de limiar configurável, taxa de seeders ativos, throughput sustentado); ao cruzar o threshold o player solicita os chunks ao operador na modalidade gerenciada antes do esgotamento do buffer, degradando sem interrupção visível." | [ ] |
| 017-02 | SPEC de remuneração do transcode deve compensar ativamente peers com GPUs ociosas (§2 A.2.2) | INCORPORAR | A.5 (existente, item novo) | Acrescentar a A.5: "O utilitário `compute` de transcode (A.2.2) é remunerado pela máquina econômica da RFC-010/012: peers que executam jobs de rendition (H.264/AV1) recebem `CREDITS` proporcionais ao custo computacional medido, priorizando capacidade ociosa (ex.: GPU) na fila." | [ ] |
| 017-03 | Falha em job de transcode deve disparar re-tentativa imediata noutro nó (§2 A.2.2) | INCORPORAR | A.2 (existente, item novo §2.x) | Acrescentar a A.2.2: "A falha de um job de transcode não invalida a rendition: o orquestrador da fila (RFC-010 A.5.3) re-enfileira o job imediatamente noutro nó, sem perda do `CONTENT` original." | [ ] |
| 017-04 | Consolidação de live em rolling-windows (ex. 10min) para evitar corrupção do VOD em queda abrupta do peer gerador (§2) | INCORPORAR | A.3 (existente, item novo §3.x) | Acrescentar a A.3: "A [[consolidacao-de-live]] opera em janelas progressivas (rolling-windows, ex. blocos de minutos) gravadas durante a transmissão, de modo que uma queda abrupta do peer gerador preserve os segmentos já consolidados; o `CONTENT:FILE` final agrega as janelas íntegras." | [ ] |
| 017-05 | LiveKit: SDK first-party embutido × SFU plugin infra (§1 validação) | JA-COBERTO | — | A.3.1 já fixa exatamente: "SDK cliente é embutido (first-party) e o SFU é plugin `infra`". Consistência LiveKit verificada entre rfc-010/017/018 — não é conflito. | [x] |
| 017-06 | Degradação declarada sem seeders / sem garantia de banda em P2P puro (§2 menciona como limitação) | JA-COBERTO | — | A.6.1 e A.7 (vetor §0.1.7) já declaram "sem seeders/relay degrada para o operador… não há garantia de banda". O refinamento de métrica está em 017-01. | [x] |
| 017-07 | Layout: Video Player Modular (alterna Live/VOD/Audio sem recarregar SPEC:PAGE) + Theatre/Mini-player (PiP) (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Organismo: `MediaPlayerSurface` (player modal Live/VOD/Audio sem reload de `SPEC:PAGE`, com Theatre Mode e Mini-player/PiP) — módulo Streaming | [ ] |
| 017-08 | Atom `PlaybackScrubber` (preview thumbnails por meta) (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Átomo: `PlaybackScrubber` (scrubber com preview thumbnails baseadas em metadados) — módulo Streaming | [ ] |
| 017-09 | Atom `QualitySelector` (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Átomo: `QualitySelector` (seleção de rendition/qualidade) — módulo Streaming | [ ] |
| 017-10 | Atom `LiveBadge` (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Átomo: `LiveBadge` (indicador de transmissão ao vivo) — módulo Streaming | [ ] |
| 017-11 | Molecule `VideoThumbnailCard` (progress bar, duração, canal) (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Molécula: `VideoThumbnailCard` (thumbnail com barra de progresso, duração, canal) — módulo Streaming | [ ] |
| 017-13 | Molecule `SuperChatTipRow` (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Molécula: `SuperChatTipRow` (linha de doação/tip ao vivo = `CREDITS`, A.5.1) — módulo Streaming | [ ] |
| 017-14 | Organism `MediaPlayerEngine` (decodifica chunks ou stream LiveKit) + `CreatorStudioDashboard` (pipeline de transcodes) (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Organismo: `MediaPlayerEngine` (carcaça agnóstica chunks/LiveKit) e `CreatorStudioDashboard` (gestor do pipeline de transcode/publicação) — módulo Streaming | [ ] |

> Nota §4/§5: a modelagem de grafo (SPEC:VOD/LIVE_EVENT, CONTENT:FILE, BELONGS_TO, renditions como irmãos) e o ciclo de vida (nascimento criptografado, mutação por transcode, live→VOD) apenas descrevem o que A.1–A.3 já normatizam — sem norma nova, ignorados conforme regra de §4/§5. Exceção: 017-12 (purga por métricas) → REVISAR-HUMANO.
