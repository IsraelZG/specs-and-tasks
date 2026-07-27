---
id: T-AD-01
title: "SPEC:AD/AD_CAMPAIGN + RELATES:AD:PROMOTES + orcamento/pacing por BALANCE_STATE/LOCK"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004"]
blocks: ["T-AD-02", "T-AD-03"]
capacity_target: sonnet
---

# T-AD-01 · SPEC:AD/AD_CAMPAIGN + RELATES:AD:PROMOTES + orcamento/pacing por BALANCE_STATE/LOCK

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

> **⚠️ DECISÃO ARQUITETURAL PENDENTE: caminho de implementação (OPEN-1).**
> Os contratos TS abaixo são DERIVADOS de `docs/caderno-3-sdk/29-anuncios-reference-spec.md` §1,
> `docs/conceitos/anuncio.md` e `docs/conceitos/anuncio-listing.md` — fontes normativas válidas
> independentemente do pacote de implementação. O path original (`apps/nexus-backend/src/modules/ads/`)
> aponta para o monólito Nexus (congelado). Arquiteto precisa definir o destino — ver Seção 6.

## 1. Objetivo
Definir as especificações de anúncio e campanha conforme `29-anuncios-reference-spec.md` S1:
anúncio = `CONTENT` (criativo) governado por `SPEC:AD`, ligado ao item promovido por
`RELATES:AD:PROMOTES`; campanha = `SPECIFICATION:AD_CAMPAIGN` (orçamento, período, modelo de
cobrança, segmentação, superfícies). Orçamento da campanha = `ASSET:BALANCE_STATE` dedicado;
reserva de verba por veiculação usa `ASSET:LOCK` (pacing).

> **Derivação:** Tipos derivados de `docs/caderno-3-sdk/29-anuncios-reference-spec.md` §1,
> `docs/conceitos/anuncio.md`, `docs/conceitos/anuncio-listing.md`, T-004 (PeerId/portas
> fundamentais, `done`). *(fontes: todas verificadas e existentes no estado atual do repo.)*

### Contratos exatos (assinaturas TS fixadas — destino do arquivo pendente OPEN-1)

```ts
// --- <caminho a definir (OPEN-1)>/types.ts 
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
    dailyCap?: number;             // pacing diário
    remainingCredits: number;      // derivado de BALANCE_STATE
  };
  billingModel: AdBillingModel;
  cpmCents?: number;
  cpcCents?: number;
  cpaCents?: number;
  surfaces: AdSurface[];
  targetSegments?: string[];
  startAt: number;
  endAt: number;
  isActive: boolean;
  /** k-anonimato: coorte mínimo para iniciar veiculação. */
  minCohortSize: number;           // default: 100
}
```

```ts
// --- <caminho a definir (OPEN-1)>/ad-manager.ts ---
export interface AdManager {
  /** Cria anúncio (CONTENT governado por SPEC:AD) + aresta RELATES:AD:PROMOTES. */
  createAd(spec: AdSpec): Promise<AdSpec>;

  /** Cria campanha (SPECIFICATION:AD_CAMPAIGN) + BALANCE_STATE dedicado. */
  createCampaign(spec: AdCampaignSpec): Promise<AdCampaignSpec>;

  /** Atualiza campanha (pausa, ajusta orçamento). */
  updateCampaign(campaignId: string, updates: Partial<AdCampaignSpec>): Promise<AdCampaignSpec>;

  /** Reserva verba para uma veiculação (LOCK sobre BALANCE_STATE). */
  reserveBudget(campaignId: string, amountCredits: number): Promise<{
    lockId: string;
    reserved: boolean;             // false se saldo insuficiente
    remainingCredits: number;
  }>;

  /** Libera lock de verba (impressão não concretizada). */
  releaseBudget(lockId: string): Promise<void>;

  /** Liquida evento cobrável (debita BALANCE_STATE, credita plataforma/publicador). */
  settleEvent(campaignId: string, lockId: string, eventCostCredits: number): Promise<{
    remainingCredits: number;
    campaignPaused: boolean;       // true se esgotou
  }>;

  /** Lista anúncios ativos de uma campanha. */
  listCampaignAds(campaignId: string): Promise<AdSpec[]>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [docs/mecanica-de-telas.md §B9 + §T2](../docs/mecanica-de-telas.md) — verba estourada pausa automática; "promover item" cria campanha que referencia o nó (RELATES:AD:PROMOTES), nunca duplica.
- [docs/caderno-3-sdk/29-anuncios-reference-spec.md](../docs/caderno-3-sdk/29-anuncios-reference-spec.md) S1 — Anúncio e campanha
- [[anuncio]] — Ecossistema de anúncios: SPEC:AD, SPECIFICATION:AD_CAMPAIGN, RELATES:AD:PROMOTES
- [[anuncio-listing]] — Listing (oferta de vendedor) como item promovido
- [[spec-page]] — SPEC:PAGE como superfície de veiculação
- [T-004 · Portas fundamentais](./T-004.md) — `done`. PeerId, portas base.

## 3. Escopo de Arquivos (Inputs e Outputs)
> **⚠️ DEPENDENTE DE OPEN-1.** Paths originais (Nexus) — o arquiteto definirá o destino final.

- **[READ]** `docs/caderno-3-sdk/29-anuncios-reference-spec.md` S1
- **[READ]** `docs/conceitos/anuncio.md` — Contratos e proteção anti-fraude
- **[READ]** `docs/conceitos/anuncio-listing.md` — Listing como item promovido
- **[CREATE]** `<OPEN-1>/types.ts` — Tipos acima
- **[CREATE]** `<OPEN-1>/ad-manager.ts` — AdManager interface + implementação
- **[CREATE]** `<OPEN-1>/ad-manager.test.ts` — Testes TDD

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter <pkg> test` (pkg = definido em OPEN-1)
- [x] **Fora de Escopo:** Integração com motor econômico real; liquidação real de créditos; UI

Casos de teste (numerados):
1. `createAd` cria `CONTENT` governado por `SPEC:AD` e aresta `RELATES:AD:PROMOTES` para o item promovido.
2. `createCampaign` cria `SPECIFICATION:AD_CAMPAIGN` com `BALANCE_STATE` dedicado e `remainingCredits = totalCredits`.
3. `reserveBudget(campaignId, 500)` com saldo 1000 retorna `reserved: true` e `remainingCredits: 500`.
4. `reserveBudget(campaignId, 2000)` com saldo 1000 retorna `reserved: false`.
5. `releaseBudget(lockId)` restaura saldo.
6. `settleEvent` debita saldo; se `remainingCredits` chega a 0, `campaignPaused: true`.
7. `updateCampaign` com `isActive: false` pausa campanha.
8. Campanha com `minCohortSize: 100` não inicia veiculação se coorte < 100 (k-anonimato).

## 5. Instruções de Execução (Step-by-Step)
> **REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie tipo de nó novo — anúncio é `CONTENT`, campanha é `SPECIFICATION`, promoção é aresta.
> - **NÃO** duplique o item promovido — `RELATES:AD:PROMOTES` referencia, não copia.
> - **NÃO** implemente liquidação real de créditos — delegue ao motor econômico.

### Pegadinhas conhecidas
- **Armadilha:** `RELATES:AD:PROMOTES` é aresta hierárquica justificada pelos 4 critérios de minimalismo (29-anuncios header): relação durável, consultável, com payload próprio, distinta de autoria.
- **Armadilha:** Orçamento usa `ASSET:BALANCE_STATE` + `ASSET:LOCK` (pacing). O `LOCK` reserva verba antes da veiculação; se a impressão não se concretizar, `releaseBudget` libera. Não debite direto sem lock.
- **Armadilha:** k-anonimato (`minCohortSize`) é obrigatório em `SPEC:AD_CAMPAIGN` (29-anuncios S3.4). Campanha só inicia veiculação quando o coorte atinge N usuários.
- **Armadilha:** Anúncio não duplica o item promovido (29-anuncios S1.1). O criativo é próprio do anúncio, mas o item promovido é referenciado, não copiado.

1. **[TDD]** Escreva `ad-manager.test.ts` com os 8 casos da Seção 4.
2. Crie `types.ts` com interfaces da Seção 1.
3. Implemente `ad-manager.ts` com CRUD de anúncios/campanhas e controle de orçamento.
4. Implemente `reserveBudget`/`releaseBudget`/`settleEvent` com LOCK sobre BALANCE_STATE.
5. Rode build + test (§7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECIDIDO (arquiteto, 2026-07-27):** Opção A — Implementar no pacote `@plataforma/plugin-ads` (`packages/plugin-ads/`).
> - **OPEN-1 (RESOLVIDO):** O subsistema de Anúncios e Campanhas será implementado como o plugin `@plataforma/plugin-ads`, seguindo o padrão de plugins do Estaleiro Host.
> - **Demais itens:** Nenhuma decisão em aberto.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] OPEN-1 resolvido pelo arquiteto (path/pacote definido)?
- [ ] Código segue estritamente os arquivos de Output especificados?
- [ ] `pnpm gate <pkg> --profile backend` verde (saída colada)?
- [ ] `AdManager` compila com as assinaturas exatas da Seção 1?
- [ ] `reserveBudget`/`releaseBudget`/`settleEvent` mantêm integridade do saldo?

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
- **[2026-07-26T14:03]** - *deepseek* - `[Decisão pendente]`: OPEN-1: caminho de implementacao — tipos derivados de 29-anuncios, mas path Nexus congelado. Decidir pacote/plugin destino.
- **[2026-07-27T13:59]** - *gemini* - `[Reconciliado]`: status restaurado de draft:pending_decision para draft:placeholder (drift corrigido)
- **[2026-07-27T13:59]** - *gemini* - `[Decisão pendente]`: decisão pendente OPEN-1
- **[2026-07-27T13:59]** - *gemini* - `[Decidido]`: decisão: Opção A (@plataforma/plugin-ads)
- **[2026-07-27T13:59]** - *system* - `[Auto-promovida]`: deps todas done
