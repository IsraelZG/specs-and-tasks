---
id: T-JU-04
title: "resolucao multi-jurisdicao por ancora de papel (origem/destino/prestacao/titular) + provisao dupla + vetor cross-border"
status: draft:triaged
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-JU-01", "T-JU-02", "T-JU-03"]
blocks: []
---

# T-JU-04 · resolucao multi-jurisdicao por ancora de papel (origem/destino/prestacao/titular) + provisao dupla + vetor cross-border

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar resolução multi-jurisdição por âncora de papel: cada aspecto regulado tem uma âncora (origem, destino, prestação, titular, MoR). Uma operação cross-border resolve cada regra com a âncora correspondente — não uma jurisdição única. Provisão dupla: venda BR→US apura imposto de saída `@BR` e entrada `@US`, ambos em `BALANCE_STATE` próprios. Vetor: conflito de duas regras no mesmo papel detectado na validação.
**Fonte:** `caderno-3-sdk/13-jurisdicao.md §5`. **Conceitos:** [[jurisdicao]], [[spec-jurisdicional]], [[vigencia-de-regra]].

### Contratos essenciais

```ts
// packages/jurisdiction/src/multi-jurisdiction.ts
export type JurisdictionAnchor = 'origin' | 'destination' | 'labor' | 'data_subject' | 'merchant_of_record';
export interface AnchorResolution { anchor: JurisdictionAnchor; jurisdiction: JurisdictionId; specVariantId?: string; }
export interface MultiJurisdictionOperation { operationId: string; anchors: Partial<Record<JurisdictionAnchor, { entityId: string; defaultJurisdiction: JurisdictionId }>>; }
export function resolveAnchors(operation: MultiJurisdictionOperation): AnchorResolution[];
export interface DualProvision { originProvision: { jurisdiction: JurisdictionId; amount: number }; destinationProvision: { jurisdiction: JurisdictionId; amount: number }; }
export function validateNoConflict(resolutions: AnchorResolution[]): { valid: boolean; conflicts: string[]; };
```
**File paths:** `packages/jurisdiction/src/multi-jurisdiction.ts` (CREATE), `packages/jurisdiction/tests/multi-jurisdiction.test.ts` (CREATE), `packages/jurisdiction/src/index.ts` (UPDATE).

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/13-jurisdicao.md](../docs/caderno-3-sdk/13-jurisdicao.md) — §5 (âncora por papel, composição multi-jurisdição, MoR, blocking vs degradação)
- [[jurisdicao]] — resolução multi-jurisdição por papel
- Deps: T-JU-01 (`JurisdictionId`, `resolveJurisdiction`), T-JU-02 (`SpecPayload`), T-JU-03 (`VigenciaWindow`)

**Testes (8 casos):** 1. Venda BR→US: origem=BR, destino=US → duas resoluções. 2. `validateNoConflict` sem conflito → `valid: true`. 3. Duas regras reivindicam mesmo papel → conflito detectado. 4. Âncora MoR resolve separadamente das demais. 5. `resolveAnchors` com anchor ausente → retorna default da implementação. 6. Provisão dupla: `originProvision` e `destinationProvision` em jurisdições diferentes. 7. Conector distinto por âncora: BR usa NF-e, US usa sales-tax. 8. Vetor cross-border: regra errada de jurisdição vizinha não aplicada (degradação para base).

**Pegadinhas:** `JurisdictionAnchor` é union literal (5 âncoras). MoR sempre se resolve como âncora separada. `DualProvision` não é sempre dual — depende das âncoras presentes na operação. Hard Stop (`blocking: true`) vs degradação: se conector fiscal falha e a SPEC tem `blocking: true`, a transição é bloqueada.

**Gate:** `pnpm --filter @plataforma/jurisdiction build && pnpm --filter @plataforma/jurisdiction test`

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:** T-JU-01, T-JU-02, T-JU-03 sendo endurecidas nesta passada. Âncoras dependem de `resolveJurisdiction` (T-JU-01). **Status:** `draft` até deps implementadas.


## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `resolveAnchors` resolve jurisdição por âncora de papel?
- [ ] `validateNoConflict` detecta conflito de duas regras no mesmo papel?
- [ ] Provisão dupla (BR→US) com jurisdições distintas?
- [ ] Âncora MoR resolvida separadamente?
- [ ] Vetor cross-border: regra de jurisdição vizinha não aplicada?
- [ ] `pnpm --filter @plataforma/jurisdiction build` e `test` verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/jurisdiction build
pnpm --filter @plataforma/jurisdiction test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
