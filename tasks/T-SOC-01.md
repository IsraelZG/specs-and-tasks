---
id: T-SOC-01
title: "SPECs de perfil/post/story + arestas sociais + visibilidade publica/privada"
status: draft:placeholder
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004", "T-108"]
blocks: ["T-SOC-02", "T-SOC-03"]
capacity_target: sonnet
---

# T-SOC-01 · SPECs de perfil/post/story + arestas sociais + visibilidade publica/privada

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet


> [!WARNING]
> **REVISAR:** Esta spec contém dependência de terminologia e infraestrutura do antigo monólito "Nexus" ou chamadas diretas ao motor "Zen Engine". 
> Em virtude da introdução do Estaleiro (RFC-018) e do `@plataforma/plugin-workflows`, esses componentes foram superados ou encapsulados. 
> Re-endureça esta spec adequando aos novos contratos antes de desenvolvê-la.

## 1. Objetivo
Definir as especificacoes (SPECs) de perfil, post, story e arestas sociais conforme
`18-social-reference-spec.md` S1-S3. Zero tipo de no novo. Visibilidade publica/privada como
flag estatica declarada no nascimento do no na SPEC; privacidade retroativa e criptograficamente
impossivel (limite honesto). Arestas sociais: `RELATES:SOCIAL:FOLLOWS`, `RELATES:SOCIAL:MENTIONS`,
`BLOCKS`. Bloqueio e social, nao criptografico ([[bloqueio-social]]).

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/social/types.ts 
---

export type Visibility = 'public' | 'private' | 'mutual';

export type SocialEdgeKind =
  | 'RELATES:SOCIAL:FOLLOWS'
  | 'RELATES:SOCIAL:MENTIONS'
  | 'BLOCKS';

/** SPEC para perfil social. */
export interface ProfileSpec {
  profileId: string;
  visibility: Visibility;          // estatica, declarada no nascimento do no
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

/** SPEC para story — CONTENT efemero com TTL. */
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
  conversationId?: string;         // se FOLLOWS mutuo, referencia a DM
}
```

```ts
// --- apps/nexus-backend/src/modules/social/social-graph.ts ---

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
- [mecanica-de-telas.md §T2](../docs/mecanica-de-telas.md) — integração entre módulos: `social:post` é payload de drag/share (post → Studio abre a mídia no editor; produto → Social gera rascunho de post com card). Post/story precisam ser referenciáveis como nó para o slot de anúncio (§B9, promoção por referência) e para o drag. Assistente (§T1): rascunho de post/legenda gerado por IA entra como proposta com Aceitar/Editar — o SPEC não deve impedir post em estado rascunho-local.
- [caderno-3-sdk/18-social-reference-spec.md](../docs/caderno-3-sdk/18-social-reference-spec.md) S1-S3
- [[bloqueio-social]] — Politica de filtro de leitura para audiencia publica
- [[projecao-analitica]] — Agregados incrementais pos-descriptografia
- [[content]] — Tipo base; perfil/post/story sao `CONTENT`
- [[blocks-aresta]] — Aresta `BLOCKS` (X bloqueou Y)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/18-social-reference-spec.md` S1-S3 — Perfis, grafo social, publicacoes
- **[READ]** `docs/conceitos/bloqueio-social.md` — Separacao acesso vs. bloqueio
- **[READ]** `docs/conceitos/projecao-analitica.md` — Modelo de projecao
- **[READ]** `apps/nexus-backend/src/modules/` — Padrao de modulo existente
- **[CREATE]** `apps/nexus-backend/src/modules/social/types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/social/social-graph.ts` — SocialGraph interface + implementacao
- **[CREATE]** `apps/nexus-backend/src/modules/social/social-graph.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Renderizacao UI; feed; ranking

Casos de teste (numerados):
1. `upsertProfile` com `visibility: 'public'` persiste SPEC com a flag estatica.
2. `upsertProfile` com `visibility: 'private'` persiste SPEC; troca para `public` nao e permitida (privacidade retroativa impossivel — lanca erro).
3. `createPost` com `visibility: 'public'` cria `CONTENT` governado por `SPEC:POST`.
4. `createStory` com `ttlMs: 86400000` cria `CONTENT` com TTL; apos expiracao, `getStories` nao o retorna.
5. `createEdge` com `FOLLOWS` cria aresta; `getFollowers` retorna o seguidor.
6. `createEdge` com `BLOCKS` cria aresta; `isBlocked` retorna `true`.
7. `removeEdge` com `BLOCKS` remove aresta; `isBlocked` retorna `false`.
8. `createEdge` com `MENTIONS` dispara notificacao cruzada ao perfil mencionado (intent).

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** crie tipo de no novo — use `CONTENT`, `SPECIFICATION`, arestas existentes.
> - **NAO** implemente privacidade retroativa — e criptograficamente impossivel. Tornar publico→privado afeta o futuro, nao o passado.
> - **NAO** confunda bloqueio social com bloqueio criptografico — para feed publico, e filtro de leitura ([[bloqueio-social]]).

### Pegadinhas conhecidas
- **Armadilha:** Visibilidade e flag estatica declarada no nascimento do no (18-social S1.1). Uma vez `public`, a chave foi distribuida — mudar para `private` depois nao revoga copias. O codigo deve lancar erro se tentar mudar `public → private`.
- **Armadilha:** `BLOCKS` e aresta limitada (dezenas, nao milhoes — [[bloqueio-social]]). Nao indexe bloqueios como query pesada no asset global — use a separacao: acesso (O(1) `ASSET:PERMISSION`) vs. bloqueio (conjunto limitado de arestas `BLOCKS`).
- **Armadilha:** Stories tem TTL e poda por G4 (18-social S2.2). Nao delete stories manualmente — declare o TTL na criacao e deixe o G4 podar. O teste deve verificar que apos TTL o story nao aparece na projecao, nao que o no foi fisicamente removido.
- **Armadilha:** `MENTIONS` e intent, nao tipo de no novo (18-social S2.1). A notificacao e disparada como efeito colateral do intent, nao como aresta persistente adicional.

1. **[TDD]** Escreva `social-graph.test.ts` com os 8 casos da Secao 4.
2. Crie `types.ts` com interfaces e tipos da Secao 1.
3. Implemente `social-graph.ts` com operacoes de grafo social, delegando a T-004 (portas) e T-108 (linhagem).
4. Implemente `isBlocked` como filtro de leitura sobre arestas `BLOCKS`.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 18-social S1-S3, [[bloqueio-social]], e [[blocks-aresta]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `SocialGraph` compila com as assinaturas exatas da Secao 1?
- [ ] Visibilidade e flag estatica — mudanca `public→private` lanca erro?

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
- **[2026-07-10T15:14]** - *Antigravity* - `[Demovido]`: Rebaixada por obsolescencia de arquitetura (Nexus/Zen)
