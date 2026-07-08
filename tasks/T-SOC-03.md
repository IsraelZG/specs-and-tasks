---
id: T-SOC-03
title: "vetores: privacidade retroativa e bloqueio como limites, story expirado, contadores como projecao"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-SOC-01", "T-SOC-02"]
blocks: []
ui: true
capacity_target: haiku
---

# T-SOC-03 · vetores: privacidade retroativa e bloqueio como limites, story expirado, contadores como projecao

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (JSDOM) + `playwright` (E2E smoke)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Implementar guards e validacoes de hardening para os limites honestos do modulo social
(`18-social-reference-spec.md` S6): privacidade retroativa impossivel, bloqueio como filtro de
leitura (nao criptografico), story expirado nao exibido, contadores como projecao agregada
(nao contagem direta de arestas). Cada vetor e um guard que previne falsa sensacao de seguranca
ou comportamento incorreto na UI.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-frontend/src/modules/social/guard-types.ts 
---

export interface PrivacyGuardResult {
  allowed: boolean;
  reason?: string;                 // ex: "privacidade retroativa é criptograficamente impossível"
}

export interface BlockGuardResult {
  visible: boolean;
  reason?: string;                 // ex: "bloqueio é filtro social, não garantia criptográfica"
}

export interface StoryExpiryResult {
  expired: boolean;
  remainingMs?: number;
}

export interface CounterProjection {
  likes: number;
  views: number;
  lastAggregatedAt: number;
  isEstimated: boolean;            // true se projecao, false se contagem exata
}
```

```ts
// --- apps/nexus-frontend/src/modules/social/guards.ts ---

export interface SocialGuards {
  /** Previne mudanca public→private: lanca erro com explicacao. */
  guardRetroactivePrivacy(currentVisibility: string, newVisibility: string): PrivacyGuardResult;

  /** Avalia se conteudo de autor bloqueado deve ser filtrado da view. */
  guardBlockVisibility(viewerId: string, authorId: string): Promise<BlockGuardResult>;

  /** Verifica se story expirou (TTL vencido). */
  guardStoryExpiry(storyCreatedAt: number, ttlMs: number): StoryExpiryResult;

  /** Retorna projecao agregada de contadores, nao contagem direta de arestas. */
  getCounterProjection(contentId: string): Promise<CounterProjection>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B7](../docs/mecanica-de-telas.md) — comportamento validado no mockup B7 para os vetores: **story expirado é honesto** (placeholder "expirou em 24h" no lugar do conteúdo; não marca "visto"; pausa auto-avanço); **bloqueio como limite** (conteúdo some do feed, "filtrado, não apagado" — §A3). Privacidade retroativa NÃO foi mockada — definir o comportamento observável no vetor.
- [caderno-3-sdk/18-social-reference-spec.md](../docs/caderno-3-sdk/18-social-reference-spec.md) S6 — Limites honestos
- [[bloqueio-social]] — Filtro de leitura sobre arestas `BLOCKS`, nao garantia criptografica
- [[projecao-analitica]] — Agregados incrementais, nao contagem direta de arestas
- T-SOC-01 — SocialGraph (arestas, visibilidade)
- T-SOC-02 — Feed (consumidor dos guards)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/18-social-reference-spec.md` S6 — Limites honestos
- **[READ]** `docs/conceitos/bloqueio-social.md` — Politica de bloqueio para feed publico
- **[READ]** `docs/conceitos/projecao-analitica.md` — Modelo de projecao agregada
- **[READ]** `apps/nexus-frontend/src/modules/social/social-graph.ts` — SocialGraph de T-SOC-01
- **[CREATE]** `apps/nexus-frontend/src/modules/social/guard-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-frontend/src/modules/social/guards.ts` — SocialGuards interface + implementacao
- **[CREATE]** `apps/nexus-frontend/src/modules/social/guards.test.tsx` — Vitest (JSDOM)
- **[CREATE]** `apps/nexus-frontend/src/modules/social/guards.e2e.ts` — Playwright smoke

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (JSDOM) + Playwright (E2E smoke)
- [x] **Ambiente do Teste:** JSDOM para unitarios; headless browser para smoke
- [x] **Fora de Escopo:** Testes criptograficos; rede P2P

Casos de teste (numerados):
1. `guardRetroactivePrivacy('public', 'private')` retorna `{ allowed: false }` com explicacao.
2. `guardRetroactivePrivacy('private', 'public')` retorna `{ allowed: true }`.
3. `guardRetroactivePrivacy('public', 'public')` retorna `{ allowed: true }`.
4. `guardBlockVisibility(viewer, blockedAuthor)` retorna `{ visible: false }`.
5. `guardBlockVisibility(viewer, nonBlockedAuthor)` retorna `{ visible: true }`.
6. `guardStoryExpiry(now - 3600_000, 1800_000)` (TTL de 30min, criado ha 1h) retorna `{ expired: true }`.
7. `guardStoryExpiry(now - 600_000, 1800_000)` (TTL de 30min, criado ha 10min) retorna `{ expired: false }`.
8. `getCounterProjection` retorna `CounterProjection` com `isEstimated: true` (projecao, nao contagem exata).
9. Playwright smoke: toggle de privacidade no perfil mostra alerta ao tentar `public→private`.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** implemente privacidade retroativa — lanca erro com explicacao clara.
> - **NAO** trate bloqueio como garantia criptografica — e filtro de leitura ([[bloqueio-social]]).
> - **NAO** conte arestas diretamente para contadores — use projecao agregada ([[projecao-analitica]]).

### Pegadinhas conhecidas
- **Armadilha:** Privacidade retroativa e criptograficamente impossivel (18-social S6.1). O guard DEVE lancar erro se `public→private`, mas a UI tambem deve mostrar um alerta explicativo ao usuario ANTES de ele tentar — nao apenas confiar no erro do backend.
- **Armadilha:** Bloqueio social nao impede um cliente adversario de ler conteudo ja publico ([[bloqueio-social]]). O guard esconde na UI honesta e corta entrega por cortesia. Nao prometa isolamento absoluto.
- **Armadilha:** Contadores virais criam hot-spotting (18-social S6.3). Use projecao agregada periodica (no de metrica assinado por peers), nao contagem direta de arestas. O campo `isEstimated: true` e obrigatorio para transparencia.
- **Armadilha:** Stories expirados sao podados por G4, mas a UI deve filtrar ANTES do G4 agir — o TTL e cortesia honest-client. Nao confie que o G4 ja removeu o no.

1. **[TDD]** Escreva `guards.test.tsx` com os 8 casos unitarios da Secao 4.
2. Crie `guard-types.ts` com interfaces da Secao 1.
3. Implemente `guards.ts` com os 4 guards, delegando `isBlocked` ao SocialGraph de T-SOC-01.
4. Implemente `getCounterProjection` usando projecao analitica, nao contagem direta.
5. Escreva `guards.e2e.ts` com smoke test Playwright (alerta de privacidade).
6. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 18-social S6, [[bloqueio-social]], e [[projecao-analitica]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (JSDOM + Playwright smoke)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `guardRetroactivePrivacy('public', 'private')` lanca erro com explicacao?
- [ ] Contadores usam projecao (`isEstimated: true`), nao contagem direta?

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
