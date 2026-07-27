---
id: T-SOC-01
title: "SPECs de perfil/post/story + arestas sociais + visibilidade publica/privada"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004", "T-108"]
blocks: ["T-SOC-02", "T-SOC-03"]
capacity_target: sonnet
---

# T-SOC-01 · SPECs de perfil/post/story + arestas sociais + visibilidade publica/privada

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

> **⚠️ DECISÃO ARQUITETURAL PENDENTE: caminho de implementação (OPEN-1).**
> Os contratos TS abaixo são DERIVADOS de `docs/caderno-3-sdk/18-social-reference-spec.md` S1-S3,
> `docs/conceitos/bloqueio-social.md`, `docs/conceitos/projecao-analitica.md` — fontes normativas
> válidas. O path original (`apps/nexus-backend/src/modules/social/`) aponta para o Nexus congelado.
> Arquiteto precisa definir o destino — ver Seção 6.

## 1. Objetivo
Definir as especificações (SPECs) de perfil, post, story e arestas sociais conforme
`18-social-reference-spec.md` S1-S3. Zero tipo de nó novo. Visibilidade pública/privada como
flag estática declarada no nascimento do nó na SPEC; privacidade retroativa é criptograficamente
impossível (limite honesto). Arestas sociais: `RELATES:SOCIAL:FOLLOWS`, `RELATES:SOCIAL:MENTIONS`,
`BLOCKS`. Bloqueio é social, não criptográfico ([[bloqueio-social]]).

> **Derivação:** Tipos derivados de `docs/caderno-3-sdk/18-social-reference-spec.md` S1-S3,
> `docs/conceitos/bloqueio-social.md`, `docs/conceitos/projecao-analitica.md`, T-004 (PeerId/portas,
> `done`), T-108 (linhagem Layer 2, `done`). *(fontes: todas verificadas e existentes.)*

### Contratos exatos (assinaturas TS fixadas — destino do arquivo pendente OPEN-1)

```ts
// --- <caminho a definir (OPEN-1)>/types.ts 
export type Visibility = 'public' | 'private' | 'mutual';

export type SocialEdgeKind =
  | 'RELATES:SOCIAL:FOLLOWS'
  | 'RELATES:SOCIAL:MENTIONS'
  | 'BLOCKS';

/** SPEC para perfil social. */
export interface ProfileSpec {
  profileId: string;
  visibility: Visibility;          // estática, declarada no nascimento do nó
  displayName: string;
  bio?: string;
  avatarContentId?: string;
}

/** SPEC para post. */
export interface PostSpec {
  postId: string;
  authorId: string;
  visibility: Visibility;
  body: string;
  mediaContentIds?: string[];      // CONTENT:FILE anexados
  createdAt: number;
}

/** SPEC para story — CONTENT efêmero com TTL. */
export interface StorySpec {
  storyId: string;
  authorId: string;
  visibility: Visibility;
  body?: string;
  mediaContentId?: string;
  createdAt: number;
  ttlMs: number;                   // tempo de vida; poda por G4
}

/** Payload de aresta social. */
export interface SocialEdgePayload {
  edgeKind: SocialEdgeKind;
  fromProfileId: string;
  toProfileId: string;
  conversationId?: string;         // se FOLLOWS mútuo, referencia a DM
}
```

```ts
// --- <caminho a definir (OPEN-1)>/social-graph.ts ---
export interface SocialGraph {
  /** Cria ou atualiza SPEC de perfil. */
  upsertProfile(spec: ProfileSpec): Promise<ProfileSpec>;

  /** Cria post governado por SPEC:POST. */
  createPost(spec: PostSpec): Promise<PostSpec>;

  /** Cria story com TTL declarado. */
  createStory(spec: StorySpec): Promise<StorySpec>;

  /** Cria aresta social (follow, mention, block). */
  createEdge(payload: SocialEdgePayload): Promise<void>;

  /** Remove aresta social (unfollow, unblock). */
  removeEdge(kind: SocialEdgeKind, from: string, to: string): Promise<void>;

  /** Verifica se perfil A bloqueou perfil B. */
  isBlocked(viewerId: string, authorId: string): Promise<boolean>;

  /** Lista seguidores de um perfil. */
  getFollowers(profileId: string, cursor?: string): Promise<{
    followers: string[];
    nextCursor?: string;
  }>;

  /** Lista perfis que um perfil segue. */
  getFollowing(profileId: string, cursor?: string): Promise<{
    following: string[];
    nextCursor?: string;
  }>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [docs/mecanica-de-telas.md §T2](../docs/mecanica-de-telas.md) — integração entre módulos: `social:post` é payload de drag/share.
- [docs/caderno-3-sdk/18-social-reference-spec.md](../docs/caderno-3-sdk/18-social-reference-spec.md) S1-S3 — Perfis, grafo social, publicações
- [[bloqueio-social]] — Política de filtro de leitura para audiência pública
- [[projecao-analitica]] — Agregados incrementais pós-descriptografia
- [[content]] — Tipo base; perfil/post/story são `CONTENT`
- [[blocks-aresta]] — Aresta `BLOCKS` (X bloqueou Y)
- [T-004 · Portas fundamentais](./T-004.md) — `done`. PeerId, portas base.
- [T-108 · Linhagem Layer 2](./T-108.md) — `done`. Navegação DAG por arestas MUTATES.

## 3. Escopo de Arquivos (Inputs e Outputs)
> **⚠️ DEPENDENTE DE OPEN-1.** Paths originais (Nexus) — o arquiteto definirá o destino final.

- **[READ]** `docs/caderno-3-sdk/18-social-reference-spec.md` S1-S3
- **[READ]** `docs/conceitos/bloqueio-social.md` — Separação acesso vs. bloqueio
- **[READ]** `docs/conceitos/projecao-analitica.md` — Modelo de projeção
- **[CREATE]** `<OPEN-1>/types.ts` — Tipos acima
- **[CREATE]** `<OPEN-1>/social-graph.ts` — SocialGraph interface + implementação
- **[CREATE]** `<OPEN-1>/social-graph.test.ts` — Testes TDD

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter <pkg> test` (pkg = definido em OPEN-1)
- [x] **Fora de Escopo:** Renderização UI; feed; ranking

Casos de teste (numerados):
1. `upsertProfile` com `visibility: 'public'` persiste SPEC com a flag estática.
2. `upsertProfile` com `visibility: 'private'` persiste SPEC; troca para `public` não é permitida (privacidade retroativa impossível — lança erro).
3. `createPost` com `visibility: 'public'` cria `CONTENT` governado por `SPEC:POST`.
4. `createStory` com `ttlMs: 86400000` cria `CONTENT` com TTL; após expiração, `getStories` não o retorna.
5. `createEdge` com `FOLLOWS` cria aresta; `getFollowers` retorna o seguidor.
6. `createEdge` com `BLOCKS` cria aresta; `isBlocked` retorna `true`.
7. `removeEdge` com `BLOCKS` remove aresta; `isBlocked` retorna `false`.
8. `createEdge` com `MENTIONS` dispara notificação cruzada ao perfil mencionado (intent).

## 5. Instruções de Execução (Step-by-Step)
> **REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie tipo de nó novo — use `CONTENT`, `SPECIFICATION`, arestas existentes.
> - **NÃO** implemente privacidade retroativa — é criptograficamente impossível.
> - **NÃO** confunda bloqueio social com bloqueio criptográfico — para feed público, é filtro de leitura ([[bloqueio-social]]).

### Pegadinhas conhecidas
- **Armadilha:** Visibilidade é flag estática declarada no nascimento do nó (18-social S1.1). Uma vez `public`, a chave foi distribuída — mudar para `private` depois não revoga cópias. O código deve lançar erro se tentar mudar `public → private`.
- **Armadilha:** `BLOCKS` é aresta limitada (dezenas, não milhões — [[bloqueio-social]]). Não indexe bloqueios como query pesada no asset global.
- **Armadilha:** Stories têm TTL e poda por G4 (18-social S2.2). Não delete stories manualmente — declare o TTL na criação e deixe o G4 podar.
- **Armadilha:** `MENTIONS` é intent, não tipo de nó novo (18-social S2.1). A notificação é disparada como efeito colateral do intent.

1. **[TDD]** Escreva `social-graph.test.ts` com os 8 casos da Seção 4.
2. Crie `types.ts` com interfaces da Seção 1.
3. Implemente `social-graph.ts` com operações de grafo social, delegando a T-004 (portas) e T-108 (linhagem).
4. Implemente `isBlocked` como filtro de leitura sobre arestas `BLOCKS`.
5. Rode build + test (§7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECIDIDO (arquiteto, 2026-07-27):** Opção A — Implementar no pacote `@plataforma/plugin-social` (`packages/plugin-social/`).
> - **OPEN-1 (RESOLVIDO):** O subsistema de Grafo Social será implementado como o plugin `@plataforma/plugin-social`, seguindo o padrão de plugins do Estaleiro Host.
> - **Demais itens:** Nenhuma decisão em aberto.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] OPEN-1 resolvido pelo arquiteto (path/pacote definido)?
- [ ] Código segue estritamente os arquivos de Output especificados?
- [ ] `pnpm gate <pkg> --profile backend` verde (saída colada)?
- [ ] `SocialGraph` compila com as assinaturas exatas da Seção 1?
- [ ] Visibilidade é flag estática — mudança `public→private` lança erro?

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
- **[2026-07-26T14:03]** - *deepseek* - `[Decisão pendente]`: OPEN-1: caminho de implementacao — tipos derivados de 18-social, mas path Nexus congelado. Decidir pacote/plugin destino.
- **[2026-07-27T14:01]** - *gemini* - `[Reconciliado]`: status restaurado de draft:pending_decision para draft:placeholder (drift corrigido)
- **[2026-07-27T14:01]** - *gemini* - `[Decisão pendente]`: decisão pendente OPEN-1
- **[2026-07-27T14:01]** - *gemini* - `[Decidido]`: decisão: Opção A (@plataforma/plugin-social)
- **[2026-07-27T14:01]** - *system* - `[Auto-promovida]`: deps todas done
