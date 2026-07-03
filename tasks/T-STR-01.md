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
---

# T-STR-01 · SPECs de conteudo/canal/colecao + reproducao adaptativa sobre o media plane

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir as especificacoes (SPECs) de conteudo, canal e colecao conforme
`19-streaming-reference-spec.md` S1-S2: conteudo = `CONTENT` (video/audio/live) governado por
`SPEC` da modalidade; canal/criador = `PROFILE`; colecao (playlist, album, serie) = `CONTENT`
agregador por aresta. Reproducao adaptativa escolhe a rendition pela banda; streaming
progressivo a partir dos chunks (AES-256-GCM por chunk, T-801a).

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/streaming/types.ts 
---

export type MediaKind = 'video' | 'audio' | 'live';
export type DeliveryMode = 'vod' | 'live' | 'audio';

export interface MediaContentSpec {
  contentId: string;
  kind: MediaKind;
  title: string;
  description?: string;
  authorId: string;                // PROFILE do criador
  channelId?: string;              // PROFILE do canal
  collectionIds?: string[];        // colecoes a que pertence
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
  subscriberCount?: number;        // projecao
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
  /** Seleciona a rendition ideal com base na banda estimada. */
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
// --- apps/nexus-backend/src/modules/streaming/media-catalog.ts ---

export interface MediaCatalog {
  /** Cria ou atualiza SPEC de conteudo de midia. */
  upsertContent(spec: MediaContentSpec): Promise<MediaContentSpec>;

  /** Cria ou atualiza SPEC de canal. */
  upsertChannel(spec: ChannelSpec): Promise<ChannelSpec>;

  /** Cria colecao e arestas de agregacao. */
  createCollection(spec: CollectionSpec): Promise<CollectionSpec>;

  /** Adiciona conteudo a uma colecao. */
  addToCollection(collectionId: string, contentId: string, position?: number): Promise<void>;

  /** Remove conteudo de uma colecao. */
  removeFromCollection(collectionId: string, contentId: string): Promise<void>;

  /** Lista conteudos de um canal. */
  listChannelContent(channelId: string, cursor?: string): Promise<{
    items: MediaContentSpec[];
    nextCursor?: string;
  }>;

  /** Lista renditions disponiveis para um conteudo. */
  listRenditions(contentId: string): Promise<RenditionInfo[]>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/19-streaming-reference-spec.md](../docs/caderno-3-sdk/19-streaming-reference-spec.md) S1-S2
- [[content-file]] — `CONTENT:FILE` como representacao fisica do blob
- [[rendition]] — Variantes de qualidade como nos `CONTENT` irmaos
- T-004 — Portas fundamentais
- T-801a — Chunking (AES-256-GCM por chunk)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/19-streaming-reference-spec.md` S1-S2
- **[READ]** `docs/conceitos/content-file.md` — Modelo de `CONTENT:FILE`
- **[READ]** `docs/conceitos/rendition.md` — Modelo de rendition, manifesto JSON
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/media-catalog.ts` — MediaCatalog interface + implementacao
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/adaptive-playback.ts` — AdaptivePlaybackStrategy
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/media-catalog.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Testes com blobs reais; rede P2P; player UI

Casos de teste (numerados):
1. `upsertContent` com `kind: 'video'` persiste `MediaContentSpec` com `isLive: false`.
2. `upsertContent` com `kind: 'live'` persiste com `isLive: true`.
3. `upsertChannel` cria `ChannelSpec` vinculado a `PROFILE`.
4. `createCollection` com `kind: 'playlist'` cria `CONTENT` agregador com arestas para `contentIds`.
5. `addToCollection` insere conteudo na posicao correta; `removeFromCollection` remove.
6. `listChannelContent` retorna conteudos paginados do canal.
7. `selectRendition` com banda 5Mbps escolhe 1080p entre [720p, 1080p, 4K].
8. `selectRendition` com banda 1Mbps escolhe 720p; com buffer baixo (<2s) degrada para menor qualidade.
9. `listRenditions` retorna renditions como `CONTENT` irmaos (aresta `RELATES:MEDIA:RENDITION`).

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** crie tipo de no novo — use `CONTENT`, `SPECIFICATION`, `PROFILE`, `RELATES:MEDIA:RENDITION`.
> - **NAO** implemente download/streaming de blobs — isso e responsabilidade do media plane (T-801a).
> - **NAO** confunda rendition com versao — renditions sao irmas, `MUTATES` e proibido entre elas.

### Pegadinhas conhecidas
- **Armadilha:** Renditions sao nos `CONTENT` irmaos, ligados ao asset logico por `RELATES:MEDIA:RENDITION` — nao por `MUTATES` ([[rendition]]). `MUTATES` e reservado para re-encodar/corrigir os bytes de uma rendition especifica.
- **Armadilha:** Colecao (playlist, album, serie) e `CONTENT` agregador por aresta, nao um tipo de no novo (19-streaming S1). Use arestas `BELONGS_TO` ou similar para vincular conteudos a colecao.
- **Armadilha:** Audio (musica, podcast) usa a maquinaria de VOD (19-streaming S4). Nao crie um caminho separado para audio — e VOD de faixa de audio.
- **Armadilha:** `selectRendition` deve considerar nao apenas banda, mas tambem buffer-ahead. Se o buffer esta abaixo de um limiar configuravel, degrade proativamente para evitar stalling.

1. **[TDD]** Escreva `media-catalog.test.ts` com os 9 casos da Secao 4.
2. Crie `types.ts` com interfaces da Secao 1.
3. Implemente `media-catalog.ts` com operacoes CRUD de catalogo, delegando a T-004 (portas).
4. Implemente `adaptive-playback.ts` com estrategia de selecao por banda + buffer.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 19-streaming S1-S2, [[content-file]], e [[rendition]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `MediaCatalog` compila com as assinaturas exatas da Secao 1?
- [ ] `selectRendition` considera banda E buffer-ahead?

### Verificacao automatica *(comandos exatos — worker E reviewer rodam e COLAM a saida)*
```bash
pnpm --filter nexus-backend build
pnpm --filter nexus-backend test
```
> **GATE DE EVIDENCIA:** nem o `finish` (worker) nem o veredito (reviewer) sao validos sem a
> saida literal desses comandos colada na secao 8. Marcar `[x]` sem evidencia e violacao.

## 8. Log de Handover e Revisao Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoracao**
- **Evidencia de Execucao (obrigatoria — colar saida de build/tsc + test):**
```
(cole aqui a saida real de pnpm build e pnpm test)
```
- **Comentarios de Revisao:**

## 9. Log de Execucao (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessao de trabalho usando `node tools/scripts/manage-task.mjs`.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:03]** - *system* - `[Triado]`: Triagem em lote do backlog
- **[2026-07-03T20:03]** - *system* - `[Endurecido]`: Endurecimento em lote (dependencies done/empty)
- **[2026-07-03T20:03]** - *system* - `[Auto-promovida]`: deps todas done
