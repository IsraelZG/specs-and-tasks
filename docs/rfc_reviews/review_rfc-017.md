# Revisão RFC-017: Streaming (VOD, Live, Áudio)

## 1. Validação da Ideia Central
A redução de VOD, Áudio e Lives a um "Produto Único" focado puramente em "Mídia Transportada" é sensata e madura. O encaixe das transversais fechou muito bem o modelo de autoria (Workflow de Upload via RFC-022) e a UX no Player via Grid (RFC-026 Shell). A clarificação no LiveKit, onde o **SDK é first-party embutido** mas o **SFU é um Plugin Infra**, evita a quebra dos domínios arquiteturais sem perder performance.

## 2. Refinamentos e Adições Sugeridas
- **Descentralização do Transporte (A.2):** O streaming P2P com AES-256-GCM chunked via WebTorrent tem a limitação da "degradação declarada sem seeders" (A.6.1). É crucial detalhar as métricas de transição (Thresholds) para quando o media player desiste do P2P e solicita do Operador em uma rede gerenciada, prevenindo interrupção brusca (Buffering) na UX.
- **Transcode e Orçamento Computacional (A.2.2):** Renditions requerem *muita* CPU (H.264/AV1). Quando a plataforma envia o job para um peer síncrono (RFC-010), a SPEC de remuneração (Tokenomics) do transcode tem que compensar ativamente peers com GPUs ociosas. A falha num job de transcode precisa disparar re-tentativa imediata noutro nó.
- **Consolidação em Tempo de Live:** O documento afirma "ao encerrar, a consolidação transforma num CONTENT:FILE". Se a Live for subitamente terminada (Queda de Energia no peer gerador), pode haver corrupção do VOD final. Sugere-se que o plugin de consolidação produza os flight-chunks em rolling-windows (de 10 em 10 minutos por exemplo).

## 3. Design System & UI Layout
### Ideias de Layout
- Video Player Modular: O player precisa alternar entre modos Live, VOD e Audio sem recarregar a `SPEC:PAGE`.
- Theatre Mode vs. Mini-player (PiP): Padrão na navegação que permite ver o vídeo enquanto lê comentários na disposição de `VideoGrid` Shell.

### Componentes Necessários
- **Atoms:** `PlaybackScrubber` (Com preview thumbnails baseadas em meta), `QualitySelector`, `LiveBadge`.
- **Molecules:** `VideoThumbnailCard` (Progress bar, Duração, Canal), `SuperChatTipRow`.
- **Organisms:** `MediaPlayerEngine` (A carcaça agnóstica que decodifica os chunks ou o stream do LiveKit), `CreatorStudioDashboard` (O workflow manager de pipeline de transcodes).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `SPECIFICATION:VOD` / `SPEC:LIVE_EVENT`
  - `CONTENT:FILE` (O vídeo consolidado).
- **Arestas:** 
  - `BELONGS_TO` (Série/Playlist).
  - Renditions (resoluções menores) atadas ao `CONTENT:FILE` Original.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O chunk nasce criptografado no peer uploader e viaja o media plane. O workflow amarra os utilitários compute.
- **Mutação:** Transcodes geram as versões secundárias. A live muta para estado 'encerrada', trocando sua spec transiente por spec VOD.
- **Fim de Vida:** Deleção lógica suspende a reprodução (descadastra a key). Expiração baseada em métricas purga os blobs abandonados do P2P.
