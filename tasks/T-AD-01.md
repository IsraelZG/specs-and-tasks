---
id: T-AD-01
title: "SPEC:AD/AD_CAMPAIGN + RELATES:AD:PROMOTES + orcamento/pacing por BALANCE_STATE/LOCK"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004"]
blocks: ["T-AD-02", "T-AD-03"]
---

# T-AD-01 · SPEC:AD/AD_CAMPAIGN + RELATES:AD:PROMOTES + orcamento/pacing por BALANCE_STATE/LOCK

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir as especificacoes de anuncio e campanha conforme `29-anuncios-reference-spec.md` S1:
anuncio = `CONTENT` (criativo) governado por `SPEC:AD`, ligado ao item promovido por
`RELATES:AD:PROMOTES`; campanha = `SPECIFICATION:AD_CAMPAIGN` (orcamento, periodo, modelo de
cobranca, segmentacao, superficies). Orcamento da campanha = `ASSET:BALANCE_STATE` dedicado;
reserva de verba por veiculacao usa `ASSET:LOCK` (pacing).

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/ads/types.ts ---

export type AdBillingModel = 'CPM' | 'CPC' | 'CPA';

export type AdSurface = 'feed' | 'pre_roll' | 'mid_roll' | 'banner' | 'search' | 'listing';

export interface AdSpec {
  adId: string;                    // = CONTENT id
  advertiserId: string;            // PROFILE do anunciante
  campaignId: string;
  promotedContentId: string;       // item promovido (PROFILE, CONTENT, listing)
  creative: {
    title: string;
    body: string;
    mediaContentId?: string;       // imagem/video do criativo
    callToAction?: string;
  };
  createdAt: number;
}

export interface AdCampaignSpec {
  campaignId: string;              // = SPECIFICATION id
  advertiserId: string;
  name: string;
  budget: {
    totalCredits: number;
    dailyCap?: number;             // pacing diario
    remainingCredits: number;      // derivado de BALANCE_STATE
  };
  billingModel: AdBillingModel;
  cpmCents?: number;               // custo por mil impressoes
  cpcCents?: number;               // custo por clique
  cpaCents?: number;               // custo por acao/conversao
  surfaces: AdSurface[];           // superficies elegiveis
  targetSegments?: string[];       // criterios de segmentacao
  startAt: number;
  endAt: number;
  isActive: boolean;
  /** k-anonimato: coorte minimo para iniciar veiculacao. */
  minCohortSize: number;           // default: 100
}
```

```ts
// --- apps/nexus-backend/src/modules/ads/ad-manager.ts ---

export interface AdManager {
  /** Cria anuncio (CONTENT governado por SPEC:AD) + aresta RELATES:AD:PROMOTES. */
  createAd(spec: AdSpec): Promise<AdSpec>;

  /** Cria campanha (SPECIFICATION:AD_CAMPAIGN) + BALANCE_STATE dedicado. */
  createCampaign(spec: AdCampaignSpec): Promise<AdCampaignSpec>;

  /** Atualiza campanha (pausa, ajusta orcamento). */
  updateCampaign(campaignId: string, updates: Partial<AdCampaignSpec>): Promise<AdCampaignSpec>;

  /** Reserva verba para uma veiculacao (LOCK sobre BALANCE_STATE). */
  reserveBudget(campaignId: string, amountCredits: number): Promise<{
    lockId: string;
    reserved: boolean;             // false se saldo insuficiente
    remainingCredits: number;
  }>;

  /** Libera lock de verba (impressao nao concretizada). */
  releaseBudget(lockId: string): Promise<void>;

  /** Liquida evento cobravel (debita BALANCE_STATE, credita plataforma/publicador). */
  settleEvent(campaignId: string, lockId: string, eventCostCredits: number): Promise<{
    remainingCredits: number;
    campaignPaused: boolean;       // true se esgotou
  }>;

  /** Lista anuncios ativos de uma campanha. */
  listCampaignAds(campaignId: string): Promise<AdSpec[]>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/29-anuncios-reference-spec.md](../docs/caderno-3-sdk/29-anuncios-reference-spec.md) S1 — Anuncio e campanha
- [[anuncio]] — Ecossistema de anuncios: SPEC:AD, SPECIFICATION:AD_CAMPAIGN, RELATES:AD:PROMOTES
- [[anuncio-listing]] — Listing (oferta de vendedor) como item promovido
- [[spec-page]] — SPEC:PAGE como superficie de veiculacao
- T-004 — Portas fundamentais

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/29-anuncios-reference-spec.md` S1
- **[READ]** `docs/conceitos/anuncio.md` — Contratos e protecao anti-fraude
- **[READ]** `docs/conceitos/anuncio-listing.md` — Listing como item promovido
- **[CREATE]** `apps/nexus-backend/src/modules/ads/types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/ads/ad-manager.ts` — AdManager interface + implementacao
- **[CREATE]** `apps/nexus-backend/src/modules/ads/ad-manager.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Integracao com motor Zen real; liquidacao real de creditos; UI

Casos de teste (numerados):
1. `createAd` cria `CONTENT` governado por `SPEC:AD` e aresta `RELATES:AD:PROMOTES` para o item promovido.
2. `createCampaign` cria `SPECIFICATION:AD_CAMPAIGN` com `BALANCE_STATE` dedicado e `remainingCredits = totalCredits`.
3. `reserveBudget(campaignId, 500)` com saldo 1000 retorna `reserved: true` e `remainingCredits: 500`.
4. `reserveBudget(campaignId, 2000)` com saldo 1000 retorna `reserved: false`.
5. `releaseBudget(lockId)` restaura saldo.
6. `settleEvent` debita saldo; se `remainingCredits` chega a 0, `campaignPaused: true`.
7. `updateCampaign` com `isActive: false` pausa campanha.
8. Campanha com `minCohortSize: 100` nao inicia veiculacao se coorte < 100 (k-anonimato).

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** crie tipo de no novo — anuncio e `CONTENT`, campanha e `SPECIFICATION`, promocao e aresta.
> - **NAO** duplique o item promovido — `RELATES:AD:PROMOTES` referencia, nao copia.
> - **NAO** implemente liquidacao real de creditos — delegue ao motor economico.

### Pegadinhas conhecidas
- **Armadilha:** `RELATES:AD:PROMOTES` e aresta hierarquica justificada pelos 4 criterios de minimalismo (29-anuncios header): relacao durave, consultavel, com payload proprio, distinta de autoria. Nao use aresta generica — use esta especifica.
- **Armadilha:** Orcamento usa `ASSET:BALANCE_STATE` + `ASSET:LOCK` (pacing). O `LOCK` reserva verba antes da veiculacao; se a impressao nao se concretizar, `releaseBudget` libera. Nao debite direto sem lock — pode estourar orcamento com concorrencia.
- **Armadilha:** k-anonimato (`minCohortSize`) e obrigatorio em `SPEC:AD_CAMPAIGN` (29-anuncios S3.4). Campanha so inicia veiculacao quando o coorte atinge N usuarios. Teste com coorte abaixo do minimo.
- **Armadilha:** Anuncio nao duplica o item promovido (29-anuncios S1.1). O criativo (titulo, corpo, midia) e proprio do anuncio, mas o item promovido e referenciado, nao copiado.

1. **[TDD]** Escreva `ad-manager.test.ts` com os 8 casos da Secao 4.
2. Crie `types.ts` com interfaces da Secao 1.
3. Implemente `ad-manager.ts` com CRUD de anuncios/campanhas e controle de orcamento.
4. Implemente `reserveBudget`/`releaseBudget`/`settleEvent` com LOCK sobre BALANCE_STATE.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 29-anuncios S1, [[anuncio]], e [[anuncio-listing]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `AdManager` compila com as assinaturas exatas da Secao 1?
- [ ] `reserveBudget`/`releaseBudget`/`settleEvent` mantem integridade do saldo?

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
