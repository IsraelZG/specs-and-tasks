# ADR — Integração Headroom (contrato fixado pelo spike T-1018)

**Status:** Aceito · **Data:** 2026-06-15 · **Decisor:** spike T-1018

## Contexto
O Nexus precisa comprimir contexto (problema 1: export grande; e contexto p/ agentes).
Decidiu-se usar o **Headroom** (`github.com/chopratejas/headroom`). Ao sondar o pacote
`headroom-ai@0.22.4` (npm) descobriu-se que:

- O **SDK TypeScript é um CLIENTE HTTP do proxy Headroom** (Python). Ele **não comprime
  localmente** — `compress(messages, opts)` chama o proxy em `baseUrl` (`/v1/compress`).
  (Confirmado no próprio código: *"The TypeScript SDK is an HTTP client today and does
  not touch the filesystem directly."*)
- `compress(messages: any[], opts?)` recebe um **array de mensagens** (formato OpenAI/
  Anthropic/Vercel/Gemini) e devolve `CompressResult { messages, tokensBefore,
  tokensAfter, compressionRatio, compressed, ccrHashes, ... }`. `opts` aceita
  `baseUrl`, `model`, `timeout`, `fallback`, `tokenBudget`, `stack`.
- **CCR (recuperação do original) é server-side** (no proxy, via `client.retrieve(hash)`).
  Inútil para uma IA externa sem rede.
- Há `SharedContext` (compressão inter-agente) — também depende do proxy.

## Decisão
1. **Interface estável `Compressor`** (em `apps/nexus-backend/src/services/compressor.ts`),
   que recebe **string** e devolve string comprimida + stats — escondendo o transporte:
   ```ts
   interface CompressionStats { originalChars; compressedChars; ratio; engine: 'headroom'|'passthrough' }
   interface CompressionResult { compressed: string; stats: CompressionStats }
   interface Compressor { compress(text: string): Promise<CompressionResult> }
   ```
2. **`HeadroomCompressor`** envolve `compress()` do SDK contra o proxy
   (`HEADROOM_URL`, default `http://127.0.0.1:8787`), com `fallback:true` + try/catch →
   **degrada para passthrough** se o proxy estiver fora (nunca lança).
3. **`PassthroughCompressor`** (no-op) garante operação offline.
4. **`getCompressor()`**: usa Headroom por padrão (com fallback embutido); force
   passthrough com `NEXUS_COMPRESSOR=passthrough`.
5. **Reversibilidade NÃO fica no Compressor.** Quem precisa recuperar o original
   (ex.: `export.service` da T-1015) mantém os trechos originais por conta própria
   (mapa local keyed por seção), o que é offline e serve à IA externa.

## Como ligar a compressão real
O proxy Headroom precisa estar rodando:
- `pip install "headroom-ai[all]"` e `headroom proxy --port 8787`, **ou**
- Docker: `ghcr.io/chopratejas/headroom:latest`.
- Apontar o backend com `HEADROOM_URL=http://127.0.0.1:8787`.

## Consequências
- O pipeline **funciona offline** (passthrough) e usa **compressão real** quando o
  proxy está no ar — sem mudar o código consumidor.
- T-1015/T-1016 consomem apenas a interface `Compressor` (mecânico, handoff-safe).
- Testes cobrem passthrough e o fallback (proxy fora). Teste contra proxy real fica
  condicional ao ambiente.
