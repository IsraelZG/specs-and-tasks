---
id: T-AD-02
title: "selecao por superficie (Zen) no contexto do espectador + medicao assinada de evento"
status: draft
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-AD-01", "T-604", "T-IA-03"]
blocks: ["T-AD-03"]
---

# T-AD-02 · selecao por superficie (Zen) no contexto do espectador + medicao assinada de evento

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o motor de selecao de anuncios por superficie conforme `29-anuncios-reference-spec.md`
S2-S4: a campanha declara superficies elegiveis; a selecao de qual anuncio mostrar em uma
superficie e decisao Zen (lance × relevancia × pacing), avaliada no contexto do consumidor.
Segmentacao contextual > perfil: o que a pessoa esta vendo agora e o caminho default.
Privacidade por construcao: segmentacao nunca acessa plaintext de classe restrita (S3.2).
Eventos cobraveis (impressao, clique, conversao) sao medidos pelo core com registro assinado
de evento (assinatura do `PROFILE` do espectador) e liquidados por Zen.
Ponderacao anti-fraude: eventos de `PROFILE` sem reputacao recebem peso zero (S4.4).

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/ads/selector-types.ts ---

export interface AdSelectionContext {
  viewerId: string;
  surface: string;                 // 'feed', 'pre_roll', etc.
  contentContext?: {               // o que o viewer esta vendo agora
    contentType?: string;
    tags?: string[];
    authorId?: string;
  };
  viewerSegments?: string[];       // segmentos expostos pelo viewer
}

export interface AdCandidate {
  adId: string;
  campaignId: string;
  bidCents: number;                // lance (CPM/CPC/CPA)
  relevanceScore: number;          // 0..1, via RRF (T-IA-03)
  remainingBudget: number;
  pacingProgress: number;          // 0..1, quao perto do fim do orcamento
}

export interface AdSelectionResult {
  selectedAdId: string | null;     // null se nenhum anuncio elegivel
  campaignId?: string;
  bidCents?: number;
  rankingScore?: number;           // score Zen final
  isSponsored: boolean;            // sempre true se selectedAdId nao-nulo
}

export interface SignedAdEvent {
  eventId: string;
  eventType: 'impression' | 'click' | 'conversion';
  adId: string;
  campaignId: string;
  viewerId: string;
  viewerSignature: string;         // assinatura Ed25519 do PROFILE do espectador
  surface: string;
  timestamp: number;
}
```

```ts
// --- apps/nexus-backend/src/modules/ads/selector.ts ---

export interface AdSelector {
  /** Seleciona o melhor anuncio para a superficie no contexto do viewer. */
  selectAd(context: AdSelectionContext): Promise<AdSelectionResult>;

  /** Registra evento cobravel com assinatura do viewer. */
  recordEvent(event: SignedAdEvent): Promise<{
    accepted: boolean;
    billable: boolean;             // false se peso zero (anti-fraude)
    reason?: string;
  }>;

  /** Pondera evento por reputacao do viewer (anti-Sybil). */
  weighEvent(viewerId: string, eventType: string): Promise<{
    weight: number;                // 0..1
    reason?: string;               // ex: "PROFILE sem reputacao — peso zero"
  }>;

  /** Verifica k-anonimato: coorte minima atingida para a campanha? */
  checkCohortSize(campaignId: string): Promise<{
    currentCohort: number;
    minRequired: number;
    canServe: boolean;
  }>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/29-anuncios-reference-spec.md](../docs/caderno-3-sdk/29-anuncios-reference-spec.md) S2-S4
- [[anuncio]] — Protecao anti-fraude: assinatura do observador, filtro Sybil, privacidade diferencial
- T-AD-01 — AdManager (SPECs, orcamento)
- T-604 — Zen (motor de decisao)
- T-IA-03 — RRF (recuperacao semantica para relevancia)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/29-anuncios-reference-spec.md` S2-S4
- **[READ]** `docs/conceitos/anuncio.md` — Anti-fraude e anonimato
- **[READ]** `apps/nexus-backend/src/modules/ads/ad-manager.ts` — T-AD-01
- **[CREATE]** `apps/nexus-backend/src/modules/ads/selector-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/ads/selector.ts` — AdSelector interface + implementacao
- **[CREATE]** `apps/nexus-backend/src/modules/ads/selector.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Integracao com Zen real; rede P2P; UI de anuncio

Casos de teste (numerados):
1. `selectAd` no feed com multiplos candidatos retorna o de maior score Zen (lance × relevancia × pacing).
2. `selectAd` com campanha sem saldo (`remainingBudget: 0`) exclui o candidato.
3. `selectAd` com superficie nao elegivel para a campanha exclui o candidato.
4. `selectAd` retorna `null` se nenhum anuncio elegivel.
5. `recordEvent` com assinatura valida do viewer retorna `accepted: true, billable: true`.
6. `recordEvent` com assinatura invalida retorna `accepted: false`.
7. `recordEvent` com viewer sem reputacao retorna `billable: false` (peso zero).
8. `checkCohortSize` com coorte abaixo de `minRequired` retorna `canServe: false`.
9. `weighEvent` para `PROFILE` recem-criado (sem saldo) retorna `weight: 0`.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** acesse plaintext de classe restrita na segmentacao — privacidade por construcao.
> - **NAO** implemente o algoritmo Zen — delegue a T-604.
> - **NAO** aceite evento sem assinatura valida do viewer como fatur vel.

### Pegadinhas conhecidas
- **Armadilha:** Segmentacao nunca acessa plaintext de classe restrita nem cruza fronteira E2E (29-anuncios S3.2). Dado privado nao vira criterio de anuncio. O `AdSelectionContext.viewerSegments` contem apenas o que o usuario expos.
- **Armadilha:** Evento cobravel carrega assinatura do `PROFILE` do espectador (29-anuncios S4.1). Impressao/clique sem assinatura valida nao e fatur vel. Isso amarra a medicao a uma identidade real e eleva o custo de forja.
- **Armadilha:** Ponderacao anti-fraude: eventos de `PROFILE` recem-criado, sem saldo nem reputacao, recebem peso zero (29-anuncios S4.4). Isso protege o anunciante de Sybil sem bloquear participacao legitima.
- **Armadilha:** Privacidade diferencial nos relatorios (29-anuncios S3.4): insere ruido estatistico nas metricas agregadas. O `recordEvent` deve suportar ofuscacao configurada via `SPEC:AD_CAMPAIGN`.

1. **[TDD]** Escreva `selector.test.ts` com os 9 casos da Secao 4.
2. Crie `selector-types.ts` com interfaces da Secao 1.
3. Implemente `selector.ts`: `selectAd` com ranking Zen, `recordEvent` com validacao de assinatura, `weighEvent` com anti-Sybil.
4. Implemente `checkCohortSize` com validacao de k-anonimato.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 29-anuncios S2-S4 e [[anuncio]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `AdSelector` compila com as assinaturas exatas da Secao 1?
- [ ] Eventos sem assinatura valida sao rejeitados? Peso zero para Sybil?

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
