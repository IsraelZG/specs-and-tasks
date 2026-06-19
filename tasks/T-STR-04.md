---
id: T-STR-04
title: "monetizacao (assinatura/PPV/ads/tip) + repasse por SPEC + vetor sem-seeder"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-STR-01", "T-MK-04"]
blocks: []
---

# T-STR-04 · monetizacao (assinatura/PPV/ads/tip) + repasse por SPEC + vetor sem-seeder

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar a camada de monetizacao de streaming conforme `19-streaming-reference-spec.md` S5:
assinatura (classe `assinatura`, RFC-012) para premium/canal; pay-per-view (classe
`acesso_licenca`); anuncios pre/mid-roll (superficie RFC-015); doacao/tip ao vivo =
`CREDITS` direto. Repasse ao criador = liquidacao por SPEC ([[economia-como-modulo]]): core
mede, SPEC liquida — por view/assinatura/tempo assistido. Inclui vetor de hardening:
transicao P2P→operador quando sem seeders disponiveis (19-streaming S6.1).

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/streaming/monetization-types.ts ---

export type MonetizationModel =
  | 'subscription'        // classe assinatura (RFC-012)
  | 'pay_per_view'        // classe acesso_licenca
  | 'ad_supported'        // anuncios pre/mid-roll (RFC-015)
  | 'tip'                 // CREDITS direto ao vivo
  | 'free';

export interface MonetizationSpec {
  contentId: string;
  model: MonetizationModel;
  priceCredits?: number;           // para PPV
  subscriptionTierId?: string;     // para assinatura
  adSlotCount?: number;            // para ad-supported
  creatorSplitBps: number;         // repasse ao criador (basis points, ex: 7000 = 70%)
}

export interface PlaybackRevenue {
  contentId: string;
  viewerId: string;
  model: MonetizationModel;
  amountCredits: number;
  creatorAmountCredits: number;    // apos split
  platformAmountCredits: number;   // apos split
  measuredAt: number;
  watchDurationMs: number;         // tempo assistido medido pelo core
}

export interface CreatorPayout {
  creatorId: string;
  periodStart: number;
  periodEnd: number;
  totalCredits: number;
  breakdown: PlaybackRevenue[];
}
```

```ts
// --- apps/nexus-backend/src/modules/streaming/monetization.ts ---

export interface MonetizationEngine {
  /** Calcula o custo de acesso ao conteudo para o viewer. */
  calculateAccessCost(contentId: string, viewerId: string): Promise<{
    model: MonetizationModel;
    costCredits: number;           // 0 se free ou ja assinante
    requiresPayment: boolean;
  }>;

  /** Registra evento de playback e calcula receita. */
  recordPlayback(contentId: string, viewerId: string, durationMs: number): Promise<PlaybackRevenue>;

  /** Liquida repasse ao criador por periodo. */
  settleCreatorPayout(creatorId: string, periodStart: number, periodEnd: number): Promise<CreatorPayout>;

  /** Verifica se viewer tem acesso (assinante, ja pagou PPV, ou free). */
  checkAccess(contentId: string, viewerId: string): Promise<boolean>;

  /** Degrada entrega para operador quando sem seeders. */
  evaluateSeederHealth(contentId: string): Promise<{
    healthySeeders: number;
    minRequired: number;
    shouldFallbackToOperator: boolean;
  }>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/19-streaming-reference-spec.md](../docs/caderno-3-sdk/19-streaming-reference-spec.md) S5-S6 — Monetizacao e limites
- [[economia-como-modulo]] — Liquidacao por SPEC: core mede, SPEC liquida
- T-STR-01 — MediaCatalog (SPECs de conteudo)
- T-MK-04 — SPENDS/CREDITS (maquina economica)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/19-streaming-reference-spec.md` S5-S6
- **[READ]** `docs/conceitos/economia-como-modulo.md` — Modelo de liquidacao
- **[READ]** `apps/nexus-backend/src/modules/streaming/media-catalog.ts` — T-STR-01
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/monetization-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/monetization.ts` — MonetizationEngine
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/monetization.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Liquidacao real de creditos; integracao com gateway de pagamento

Casos de teste (numerados):
1. `calculateAccessCost` para conteudo `free` retorna `requiresPayment: false`, `costCredits: 0`.
2. `calculateAccessCost` para conteudo `pay_per_view` com `priceCredits: 100` retorna `requiresPayment: true`, `costCredits: 100`.
3. `calculateAccessCost` para conteudo `subscription` com viewer ja assinante retorna `requiresPayment: false`.
4. `checkAccess` para viewer que pagou PPV retorna `true`.
5. `checkAccess` para viewer que NAO pagou PPV retorna `false`.
6. `recordPlayback` calcula `PlaybackRevenue` com split `creatorSplitBps` (ex.: 70% = 7000 bps).
7. `settleCreatorPayout` agrega `PlaybackRevenue` por periodo e retorna `CreatorPayout`.
8. `evaluateSeederHealth` com 0 seeders e `minRequired: 1` retorna `shouldFallbackToOperator: true`.
9. `evaluateSeederHealth` com 5 seeders e `minRequired: 1` retorna `shouldFallbackToOperator: false`.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** implemente cobranca real — apenas o calculo e o registro de receita.
> - **NAO** debite creditos diretamente — delegue a T-MK-04 (SPENDS/CREDITS).
> - **NAO** prometa disponibilidade garantida em P2P puro — sem seeders, degrada para operador.

### Pegadinhas conhecidas
- **Armadilha:** Repasse ao criador e liquidacao por SPEC: core mede (tempo assistido), SPEC liquida (split). Nao hard-code o split — leia da `MonetizationSpec.creatorSplitBps`.
- **Armadilha:** Entrega P2P depende de seeders disponiveis (19-streaming S6.1). O player deve monitorar buffer-ahead, taxa de seeders ativos, e throughput sustentado. Ao cruzar thresholds, solicita chunks ao operador ANTES do esgotamento do buffer.
- **Armadilha:** `CREDITS` por transcode (19-streaming S5.3) sao liquidados pela maquina economica — nao neste modulo. Apenas estime o custo (T-STR-02).
- **Armadilha:** DRM honesto: a chave restringe acesso ao decodificavel, mas nao impede captura de tela (19-streaming S6.3). Nao prometa o impossivel — o limite e declarado.

1. **[TDD]** Escreva `monetization.test.ts` com os 9 casos da Secao 4.
2. Crie `monetization-types.ts` com interfaces da Secao 1.
3. Implemente `monetization.ts` com calculo de acesso, registro de playback, e liquidacao.
4. Implemente `evaluateSeederHealth` com thresholds configaveis.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 19-streaming S5-S6 e [[economia-como-modulo]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `MonetizationEngine` compila com as assinaturas exatas da Secao 1?
- [ ] Split `creatorSplitBps` e respeitado no calculo de `PlaybackRevenue`?

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
