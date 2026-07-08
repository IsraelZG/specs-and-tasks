---
id: T-AD-03
title: "vetores: segmentacao lendo dado restrito, verba estourada, clique inflado"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-AD-01", "T-AD-02"]
blocks: []
capacity_target: haiku
---

# T-AD-03 · vetores: segmentacao lendo dado restrito, verba estourada, clique inflado

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Implementar guards de hardening para os limites honestos do modulo de anuncios
(`29-anuncios-reference-spec.md` S5): segmentacao nao pode ler dado restrito (privacidade por
construcao), verba nao pode estourar (LOCK + BALANCE_STATE), clique nao pode ser inflado
(assinatura + anti-Sybil). Brand safety: anunciante nao escolhe vizinhanca item a item
(S5.4). Atribuicao de conversao e probabilistica, nao prova (S5.3).

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/ads/guard-types.ts 
---

export interface SegmentationGuardResult {
  allowed: boolean;
  reason?: string;                 // ex: "segmento requer dado de classe restrita"
  sanitizedSegments: string[];     // apenas segmentos validos
}

export interface BudgetGuardResult {
  withinBudget: boolean;
  remainingCredits: number;
  lockedAmount: number;
  reason?: string;                 // ex: "verba estouraria — rejeitado"
}

export interface ClickFraudResult {
  legitimate: boolean;
  weight: number;                  // 0..1, ponderacao anti-fraude
  reason?: string;                 // ex: "PROFILE sem reputacao — peso zero"
}
```

```ts
// --- apps/nexus-backend/src/modules/ads/guards.ts ---

export interface AdGuards {
  /** Valida que segmentacao nao acessa segmentos de classe restrita. */
  guardSegmentationPrivacy(requestedSegments: string[], viewerId: string): Promise<SegmentationGuardResult>;

  /** Verifica se valor cabe no orcamento restante (considerando locks ativos). */
  guardBudgetLimit(campaignId: string, requestedAmount: number): Promise<BudgetGuardResult>;

  /** Avalia legitimidade de evento de clique/impressao (assinatura + reputacao). */
  guardClickFraud(event: SignedAdEvent): Promise<ClickFraudResult>;

  /** Verifica brand safety: anunciante nao controla vizinhanca item a item. */
  guardBrandSafety(adId: string, adjacentContentIds: string[]): Promise<{
    safe: boolean;
    flaggedContentIds: string[];   // conteudo que viola regra de exclusao
  }>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B9](../docs/mecanica-de-telas.md) — comportamento observável validado no mockup B9 para os 3 vetores: dado restrito → `targetingBlocked` sem vazar critérios; verba estourada → campanha para automaticamente + badge própria; clique inflado → suspeitos **excluídos da cobrança e mostrados como transparência** ("N cliques suspeitos excluídos"), métricas calculam sobre cobráveis.
- [caderno-3-sdk/29-anuncios-reference-spec.md](../docs/caderno-3-sdk/29-anuncios-reference-spec.md) S5 — Limites honestos
- [[anuncio]] — Anti-fraude: assinatura do observador, filtro Sybil, k-anonimato
- T-AD-01 — AdManager (orcamento, BALANCE_STATE/LOCK)
- T-AD-02 — AdSelector (selecao, eventos assinados)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/29-anuncios-reference-spec.md` S5
- **[READ]** `docs/conceitos/anuncio.md` — Protecoes anti-fraude
- **[READ]** `apps/nexus-backend/src/modules/ads/ad-manager.ts` — T-AD-01
- **[READ]** `apps/nexus-backend/src/modules/ads/selector.ts` — T-AD-02
- **[CREATE]** `apps/nexus-backend/src/modules/ads/guard-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/ads/guards.ts` — AdGuards interface + implementacao
- **[CREATE]** `apps/nexus-backend/src/modules/ads/guards.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Integracao com rede P2P; auditoria externa

Casos de teste (numerados):
1. `guardSegmentationPrivacy` com segmento `['private_messages']` retorna `allowed: false` e remove do `sanitizedSegments`.
2. `guardSegmentationPrivacy` com segmento `['interests_public']` retorna `allowed: true` e mantem.
3. `guardBudgetLimit` com `requestedAmount: 500` e saldo 1000 retorna `withinBudget: true`.
4. `guardBudgetLimit` com `requestedAmount: 500` e saldo 1000 mas `lockedAmount: 800` (800 ja reservado) retorna `withinBudget: false`.
5. `guardClickFraud` com evento de `PROFILE` sem reputacao retorna `legitimate: false, weight: 0`.
6. `guardClickFraud` com evento de `PROFILE` com reputacao retorna `legitimate: true, weight: 1`.
7. `guardClickFraud` com assinatura invalida retorna `legitimate: false`.
8. `guardBrandSafety` com conteudo adjacente em lista de exclusao retorna `safe: false` e `flaggedContentIds`.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** permita segmentacao que acesse plaintext de classe restrita.
> - **NAO** permita que verba estoure — considerar locks ativos, nao apenas saldo nominal.
> - **NAO** trate atribuicao de conversao como prova — e probabilistica.

### Pegadinhas conhecidas
- **Armadilha:** `guardBudgetLimit` deve considerar `lockedAmount` (verba ja reservada por LOCK), nao apenas `remainingCredits`. Se ha 1000 de saldo mas 800 estao locked, o disponivel real e 200. Nao olhe so o saldo nominal.
- **Armadilha:** Segmentacao contextual e o default; perfilamento profundo e limitado ao que foi exposto (29-anuncios S3.3). O guard deve permitir segmentos de contexto (ex.: `['viewing_category_tech']`) e rejeitar segmentos que exigem leitura de dado privado (ex.: `['dm_history']`).
- **Armadilha:** Brand safety em rede aberta/P2P: o anunciante nao escolhe vizinhanca item a item (29-anuncios S5.4). Mitigavel por regras de exclusao na campanha, nao garantivel. O guard verifica as regras de exclusao configuradas, mas nao promete isolamento absoluto.
- **Armadilha:** Clique/impressao medidos no device sao tao confiaveis quanto o device (29-anuncios S5.6). O guard valida assinatura e reputacao, mas nao elimina fraude em P2P puro — apenas eleva o custo.

1. **[TDD]** Escreva `guards.test.ts` com os 8 casos da Secao 4.
2. Crie `guard-types.ts` com interfaces da Secao 1.
3. Implemente `guards.ts` com os 4 guards, delegando `isBlocked`/saldo ao AdManager (T-AD-01) e `weighEvent` ao AdSelector (T-AD-02).
4. Garanta que `guardBudgetLimit` considera `lockedAmount` + `remainingCredits`.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 29-anuncios S5 e [[anuncio]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `AdGuards` compila com as assinaturas exatas da Secao 1?
- [ ] `guardBudgetLimit` considera locks ativos? `guardClickFraud` rejeita Sybil?

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
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
