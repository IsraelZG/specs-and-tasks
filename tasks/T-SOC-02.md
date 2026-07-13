---
id: T-SOC-02
title: "feed via SuperCard/Layout + ranking Zen + RRF + slot de anuncio"
status: draft:triaged
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-SOC-01", "T-PG-02", "T-IA-03"]
blocks: ["T-SOC-03"]
ui: true
capacity_target: sonnet
---

# T-SOC-02 · feed via SuperCard/Layout + ranking Zen + RRF + slot de anuncio

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (JSDOM) + `playwright` (E2E smoke)
- **Capacidade-alvo:** sonnet


> [!WARNING]
> **REVISAR:** Esta spec contém dependência de terminologia e infraestrutura do antigo monólito "Nexus" ou chamadas diretas ao motor "Zen Engine". 
> Em virtude da introdução do Estaleiro (RFC-018) e do `@plataforma/plugin-workflows`, esses componentes foram superados ou encapsulados. 
> Re-endureça esta spec adequando aos novos contratos antes de desenvolvê-la.

## 1. Objetivo
Implementar o feed social conforme `18-social-reference-spec.md` S4: composicao de `SuperCard` +
`Layout` com conteudo recuperado por traversal social + RRF (RFC-011) e anuncios (RFC-015)
como itens distinguiveis. Ranking e Zen na SPEC do feed, com variantes cronologica, algoritmica
ou hibrida configuraveis. Slot de anuncio rotulado "patrocinado" (requisito de produto).

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-frontend/src/modules/social/feed-types.ts 
---

export type FeedRankingMode = 'chronological' | 'algorithmic' | 'hybrid';

export type FeedItemKind = 'post' | 'story' | 'ad' | 'suggestion';

export interface FeedItem {
  kind: FeedItemKind;
  contentId: string;
  authorId: string;
  body?: string;
  mediaContentIds?: string[];
  createdAt: number;
  isSponsored: boolean;            // true se for anuncio
  rankingScore?: number;           // score Zen, se ranking algoritmico
  ttlMs?: number;                  // story apenas
}

export interface FeedConfig {
  rankingMode: FeedRankingMode;
  /** Superficies elegiveis para anuncio. */
  adSurfaces: string[];            // ex: ['feed', 'sidebar']
  /** Intervalo entre slots de anuncio (ex: a cada N itens). */
  adSlotInterval: number;          // default: 5
  /** Limite de itens por pagina. */
  pageSize: number;                // default: 20
}

export interface FeedPage {
  items: FeedItem[];
  nextCursor?: string;
  hasMore: boolean;
}
```

```tsx
// --- apps/nexus-frontend/src/modules/social/Feed.tsx ---

export interface FeedProps {
  profileId: string;
  config?: Partial<FeedConfig>;
}

export interface FeedComponent {
  /** Carrega proxima pagina do feed. */
  loadMore(): Promise<FeedPage>;

  /** Atualiza feed (pull-to-refresh). */
  refresh(): Promise<FeedPage>;

  /** Estado reativo da pagina atual. */
  readonly currentPage: FeedPage | null;

  /** Alterna modo de ranking. */
  setRankingMode(mode: FeedRankingMode): void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B7](../docs/mecanica-de-telas.md) — mecânica validada no mockup B7: card de post com visibilidade por post (ícone+label), curtir otimista, overflow ⋯ (compartilhar/denunciar/bloquear com efeito recíproco explicado); **slot de anúncio = mesmo container do post orgânico + badge "Patrocinado"** (aria-label própria); stories com rail visto/não-visto, viewer com progresso 5s/story e navegação lateral. Lacuna registrada lá: thread de comentários não foi mockada — mecânica a definir no endurecimento.
- [caderno-3-sdk/18-social-reference-spec.md](../docs/caderno-3-sdk/18-social-reference-spec.md) S4 — Feed e ranking
- [caderno-3-sdk/29-anuncios-reference-spec.md](../docs/caderno-3-sdk/29-anuncios-reference-spec.md) S2 — Superficies de veiculacao
- [[projecao-analitica]] — Agregados para contadores (likes, views)
- T-SOC-01 — SocialGraph (arestas, perfis)
- T-PG-02 — Renderer de SuperCard/Layout
- T-IA-03 — RRF (recuperacao semantica)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/18-social-reference-spec.md` S4
- **[READ]** `docs/caderno-3-sdk/29-anuncios-reference-spec.md` S2
- **[READ]** `apps/nexus-frontend/src/modules/social/` — SocialGraph de T-SOC-01
- **[CREATE]** `apps/nexus-frontend/src/modules/social/feed-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-frontend/src/modules/social/Feed.tsx` — Componente + hook
- **[CREATE]** `apps/nexus-frontend/src/modules/social/Feed.test.tsx` — Vitest (JSDOM)
- **[CREATE]** `apps/nexus-frontend/src/modules/social/Feed.e2e.ts` — Playwright smoke

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (JSDOM) + Playwright (E2E smoke)
- [x] **Ambiente do Teste:** JSDOM para unitarios; headless browser para smoke
- [x] **Fora de Escopo:** Testes com grafo real; rede P2P

Casos de teste (numerados):
1. `Feed` renderiza estado vazio com mensagem "Nenhum conteudo no feed".
2. `loadMore` retorna `FeedPage` com `items` e `nextCursor`; segunda chamada usa cursor.
3. `refresh` limpa pagina e recarrega do inicio.
4. Slot de anuncio aparece a cada `adSlotInterval` itens com `isSponsored: true` e rotulo "patrocinado".
5. `setRankingMode('chronological')` reordena feed por `createdAt` decrescente.
6. `FeedItem` de kind `story` com `ttlMs` expirado nao aparece apos refresh.
7. Playwright smoke: feed monta, botoes de ranking alternam, scroll carrega mais itens.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** implemente o algoritmo de ranking — delegue ao Zen (T-604) via config.
> - **NAO** renderize anuncio sem rotulo "patrocinado" — requisito de produto, nao opcional.
> - **NAO** duplique logica de `SuperCard`/`Layout` — consuma o renderer de T-PG-02.

### Pegadinhas conhecidas
- **Armadilha:** Ranking e Zen na SPEC do feed, mas a qualidade depende da vantagem observacional do agente (18-social S4.3). Em P2P puro com visao parcial, o ranking e mais fraco — declarado como limite honesto. O componente deve expor o modo `chronological` como fallback garantido.
- **Armadilha:** Anuncio e sempre distinguivel de conteudo organico na UI (29-anuncios S2.3). Um cliente adversario pode omitir o rotulo localmente, mas o componente honesto DEVE renderiza-lo.
- **Armadilha:** Contadores virais (likes/views) inflam o grafo com arestas leves — use projecoes de intent em lote ([[projecao-analitica]], 18-social S3.3). Nao consulte o grafo para cada contador individualmente.
- **Armadilha:** `adSlotInterval` define a cada quantos itens organicos um anuncio aparece. Se nao houver anuncios disponiveis, o slot e simplesmente pulado — nao insira placeholder vazio.

1. **[TDD]** Escreva `Feed.test.tsx` com os 6 casos unitarios da Secao 4.
2. Crie `feed-types.ts` com interfaces e config padrao.
3. Implemente `Feed.tsx` com composicao de SuperCard/Layout, intercalacao de anuncios, e controle de ranking.
4. Implemente `loadMore` com cursor e `refresh` com reset.
5. Escreva `Feed.e2e.ts` com smoke test Playwright.
6. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 18-social S4 e 29-anuncios S2.
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (JSDOM + Playwright smoke)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] Todo anuncio renderizado tem `isSponsored: true` e rotulo visivel?

### Verificacao automatica *(comandos exatos — worker E reviewer rodam e COLAM a saida)*
```bash
pnpm --filter nexus-frontend build
pnpm --filter nexus-frontend test
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
