---
id: T-STR-01
title: "SPECs de conteudo/canal/colecao + reproducao adaptativa sobre o media plane"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004", "T-801"]
blocks: ["T-STR-02", "T-STR-03", "T-STR-04"]
capacity_target: sonnet
---

# T-STR-01 · SPECs de conteudo/canal/colecao + reproducao adaptativa sobre o media plane

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

> **⚠️ DECISÃO ARQUITETURAL PENDENTE: caminho de implementação (OPEN-1).**
> Os contratos TS abaixo são DERIVADOS de `docs/caderno-3-sdk/19-streaming-reference-spec.md` S1-S2,
> `docs/conceitos/content-file.md`, `docs/conceitos/rendition.md` — fontes normativas válidas.
> O path original (`apps/nexus-backend/src/modules/streaming/`) aponta para o Nexus congelado.
> Arquiteto precisa definir o destino — ver Seção 6.

## 1. Objetivo
Definir as especificações (SPECs) de conteúdo, canal e coleção conforme
`19-streaming-reference-spec.md` S1-S2: conteúdo = `CONTENT` (vídeo/áudio/live) governado por
`SPEC` da modalidade; canal/criador = `PROFILE`; coleção (playlist, álbum, série) = `CONTENT`
agregador por aresta. Reprodução adaptativa escolhe a rendition pela banda + buffer-ahead;
streaming progressivo a partir dos chunks (AES-256-GCM por chunk, T-801).

> **Derivação:** Tipos derivados de `docs/caderno-3-sdk/19-streaming-reference-spec.md` S1-S2,
> `docs/conceitos/content-file.md`, `docs/conceitos/rendition.md`, T-004 (portas, `done`),
> T-801 (chunking/storage engine, `done`). *(fontes: todas verificadas e existentes.)*

### Contratos exatos (assinaturas TS fixadas — destino do arquivo pendente OPEN-1)

```ts
// --- <caminho a definir (OPEN-1)>/types.ts 
export type MediaKind = 'video' | 'audio' | 'live';
export type DeliveryMode = 'vod' | 'live' | 'audio';

export interface MediaContentSpec {
  contentId: string;
  kind: MediaKind;
  title: string;
  description?: string;
  authorId: string;                // PROFILE do criador
  channelId?: string;              // PROFILE do canal
  collectionIds?: string[];        // coleções a que pertence
  durationMs?: number;
  createdAt: number;
  publishedAt?: number;
  isLive: boolean;
}

export interface ChannelSpec {
  channelId: string;               // = PROFILE id
  ownerId: string;
  displayName: string;
  description?: string;
  avatarContentId?: string;
  subscriberCount?: number;        // projeção
}

export interface CollectionSpec {
  collectionId: string;            // = CONTENT id
  ownerId: string;
  title: string;
  description?: string;
  kind: 'playlist' | 'album' | 'series';
  contentIds: string[];            // ordenados
  isPublic: boolean;
}

export interface AdaptivePlaybackStrategy {
  /** Seleciona a rendition ideal com base na banda estimada e buffer-ahead. */
  selectRendition(
    availableRenditions: RenditionInfo[],
    estimatedBandwidthBps: number,
    bufferAheadMs: number
  ): RenditionInfo;
}

export interface RenditionInfo {
  renditionId: string;
  quality: string;                 // ex: '1080p', '720p', '4K'
  codec: string;                   // ex: 'h264', 'av1'
  bitrateBps: number;
  width?: number;
  height?: number;
}
```

```ts
// --- <caminho a definir (OPEN-1)>/media-catalog.ts ---
export interface MediaCatalog {
  /** Cria ou atualiza SPEC de conteúdo de mídia. */
  upsertContent(spec: MediaContentSpec): Promise<MediaContentSpec>;

  /** Cria ou atualiza SPEC de canal. */
  upsertChannel(spec: ChannelSpec): Promise<ChannelSpec>;

  /** Cria coleção e arestas de agregação. */
  createCollection(spec: CollectionSpec): Promise<CollectionSpec>;

  /** Adiciona conteúdo a uma coleção. */
  addToCollection(collectionId: string, contentId: string, position?: number): Promise<void>;

  /** Remove conteúdo de uma coleção. */
  removeFromCollection(collectionId: string, contentId: string): Promise<void>;

  /** Lista conteúdos de um canal. */
  listChannelContent(channelId: string, cursor?: string): Promise<{
    items: MediaContentSpec[];
    nextCursor?: string;
  }>;

  /** Lista renditions disponíveis para um conteúdo. */
  listRenditions(contentId: string): Promise<RenditionInfo[]>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [docs/mecanica-de-telas.md §B8 + §T2](../docs/mecanica-de-telas.md) — estados de reprodução validados em mockup; `streaming:content` é payload de drag/share.
- [docs/caderno-3-sdk/19-streaming-reference-spec.md](../docs/caderno-3-sdk/19-streaming-reference-spec.md) S1-S2 — Conteúdo, canal, coleção, adaptativo
- [[content-file]] — `CONTENT:FILE` como representação física do blob
- [[rendition]] — Variantes de qualidade como nós `CONTENT` irmãos
- [T-004 · Portas fundamentais](./T-004.md) — `done`. PeerId, portas base.
- [T-801 · Storage Engine de BLOBs (Chunking)](./T-801.md) — `done`. AES-256-GCM por chunk, Merkle Tree.

## 3. Escopo de Arquivos (Inputs e Outputs)
> **⚠️ DEPENDENTE DE OPEN-1.** Paths originais (Nexus) — o arquiteto definirá o destino final.

- **[READ]** `docs/caderno-3-sdk/19-streaming-reference-spec.md` S1-S2
- **[READ]** `docs/conceitos/content-file.md` — Modelo de `CONTENT:FILE`
- **[READ]** `docs/conceitos/rendition.md` — Modelo de rendition, manifesto JSON
- **[CREATE]** `<OPEN-1>/types.ts` — Tipos acima
- **[CREATE]** `<OPEN-1>/media-catalog.ts` — MediaCatalog interface + implementação
- **[CREATE]** `<OPEN-1>/adaptive-playback.ts` — AdaptivePlaybackStrategy
- **[CREATE]** `<OPEN-1>/media-catalog.test.ts` — Testes TDD

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter <pkg> test` (pkg = definido em OPEN-1)
- [x] **Fora de Escopo:** Testes com blobs reais; rede P2P; player UI

Casos de teste (numerados):
1. `upsertContent` com `kind: 'video'` persiste `MediaContentSpec` com `isLive: false`.
2. `upsertContent` com `kind: 'live'` persiste com `isLive: true`.
3. `upsertChannel` cria `ChannelSpec` vinculado a `PROFILE`.
4. `createCollection` com `kind: 'playlist'` cria `CONTENT` agregador com arestas para `contentIds`.
5. `addToCollection` insere conteúdo na posição correta; `removeFromCollection` remove.
6. `listChannelContent` retorna conteúdos paginados do canal.
7. `selectRendition` com banda 5Mbps escolhe 1080p entre [720p, 1080p, 4K].
8. `selectRendition` com banda 1Mbps escolhe 720p; com buffer baixo (<2s) degrada para menor qualidade.
9. `listRenditions` retorna renditions como `CONTENT` irmãos (aresta `RELATES:MEDIA:RENDITION`).

## 5. Instruções de Execução (Step-by-Step)
> **REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie tipo de nó novo — use `CONTENT`, `SPECIFICATION`, `PROFILE`, `RELATES:MEDIA:RENDITION`.
> - **NÃO** implemente download/streaming de blobs — isso é responsabilidade do media plane (T-801).
> - **NÃO** confunda rendition com versão — renditions são irmãs, `MUTATES` é proibido entre elas.

### Pegadinhas conhecidas
- **Armadilha:** Renditions são nós `CONTENT` irmãos, ligados ao asset lógico por `RELATES:MEDIA:RENDITION` — não por `MUTATES` ([[rendition]]).
- **Armadilha:** Coleção (playlist, álbum, série) é `CONTENT` agregador por aresta, não um tipo de nó novo (19-streaming S1).
- **Armadilha:** Áudio (música, podcast) usa a maquinaria de VOD (19-streaming S4). Não crie caminho separado.
- **Armadilha:** `selectRendition` deve considerar não apenas banda, mas também buffer-ahead. Se o buffer está abaixo de um limiar configurável, degrade proativamente para evitar stalling.

1. **[TDD]** Escreva `media-catalog.test.ts` com os 9 casos da Seção 4.
2. Crie `types.ts` com interfaces da Seção 1.
3. Implemente `media-catalog.ts` com operações CRUD de catálogo, delegando a T-004 (portas).
4. Implemente `adaptive-playback.ts` com estratégia de seleção por banda + buffer.
5. Rode build + test (§7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECIDIDO (arquiteto, 2026-07-27):** Opção A — Implementar no pacote `@plataforma/plugin-streaming` (`packages/plugin-streaming/`).
> - **OPEN-1 (RESOLVIDO):** O subsistema de Streaming e Mídia será implementado como o plugin `@plataforma/plugin-streaming`, seguindo o padrão de plugins do Estaleiro Host.
> - **Demais itens:** Nenhuma decisão em aberto.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] OPEN-1 resolvido pelo arquiteto (path/pacote definido)?
- [ ] Código segue estritamente os arquivos de Output especificados?
- [ ] `pnpm gate <pkg> --profile backend` verde (saída colada)?
- [ ] `MediaCatalog` compila com as assinaturas exatas da Seção 1?
- [ ] `selectRendition` considera banda E buffer-ahead?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm gate <pkg> --profile backend
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desse comando colada na seção 8. `<pkg>` = pacote definido pelo arquiteto em OPEN-1.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-26T14:03]** - *deepseek* - `[Decisão pendente]`: OPEN-1: caminho de implementacao — tipos derivados de 19-streaming, mas path Nexus congelado. Decidir pacote/plugin destino.
- **[2026-07-27T14:01]** - *gemini* - `[Reconciliado]`: status restaurado de draft:pending_decision para draft:placeholder (drift corrigido)
- **[2026-07-27T14:01]** - *gemini* - `[Decisão pendente]`: decisão pendente OPEN-1
- **[2026-07-27T14:01]** - *gemini* - `[Decidido]`: decisão: Opção A (@plataforma/plugin-streaming)
- **[2026-07-27T14:01]** - *system* - `[Auto-promovida]`: deps todas done
