---
id: T-JU-03
title: "selecao por vigencia na competencia + recalculo retroativo + vetor (regra errada nunca aplicada)"
status: draft
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-JU-01", "T-JU-02", "T-103"]
blocks: ["T-JU-04"]
---

# T-JU-03 · selecao por vigencia na competencia + recalculo retroativo + vetor (regra errada nunca aplicada)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar seleção de SPEC por vigência temporal: a regra aplicável é a vigente na **competência do fato** (mês de referência), não na data de execução. Recálculo retroativo navega `SUPERSEDED_BY` e aplica a versão da SPEC vigente naquela competência. Mudança de lei = `SUPERSEDED_BY` com nova janela. Vetor: regra errada nunca aplicada por engano de data.
**Fonte:** `caderno-3-sdk/13-jurisdicao.md §3`. **Conceitos:** [[vigencia-de-regra]], [[jurisdicao]].

### Contratos essenciais

```ts
// packages/jurisdiction/src/vigencia.ts
export interface VigenciaWindow { vigente_de: number; vigente_ate: number | null; } // timestamps ms
export interface SpecVersion { specId: string; vigencia: VigenciaWindow; supersededBy?: string; payload: Record<string, unknown>; }
export function selectByCompetencia(versions: SpecVersion[], competenciaMs: number): SpecVersion | null;
export function navigateSuperseded(versions: SpecVersion[], competenciaMs: number): SpecVersion[];
export interface RecalculoResult { appliedVersion: SpecVersion; originalVersion?: SpecVersion; correct: boolean; }
```
**File paths:** `packages/jurisdiction/src/vigencia.ts` (CREATE), `packages/jurisdiction/tests/vigencia.test.ts` (CREATE), `packages/jurisdiction/src/index.ts` (UPDATE).

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/13-jurisdicao.md](../docs/caderno-3-sdk/13-jurisdicao.md) — §3 (vigência, competência, recálculo retroativo, SUPERSEDED_BY, conflito detectado)
- [[vigencia-de-regra]] — definição canônica
- Deps: T-103 (HLC) ready — `HLC` provê timestamps para competência. T-JU-01 (`JurisdictionId`), T-JU-02 (`SpecPayload`).

**Testes (8 casos):** 1. `selectByCompetencia` com competência dentro da janela → retorna versão. 2. Competência antes de `vigente_de` → `null`. 3. Competência após `vigente_ate` → `null`. 4. `navigateSuperseded` segue cadeia `SUPERSEDED_BY`. 5. Recálculo retroativo: competência passada → versão antiga correta. 6. Conflito: duas versões com janelas sobrepostas → erro detectado. 7. `vigente_ate: null` = vigência aberta (sem fim). 8. Vetor: regra de 2025 não se aplica a competência de 2024.

**Pegadinhas:** `vigente_de`/`vigente_ate` são timestamps ms Unix. Competência é mês de referência (1º dia do mês à meia-noite UTC). `SUPERSEDED_BY` é cadeia linear (uma versão substitui exatamente uma anterior). Sobreposição detectada: `a.vigente_ate > b.vigente_de && a.vigente_de < b.vigente_ate` para mesma jurisdição.

**Gate:** `pnpm --filter @plataforma/jurisdiction build && pnpm --filter @plataforma/jurisdiction test`

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:** T-103 (HLC) ready. T-JU-01 e T-JU-02 sendo endurecidas nesta passada. **Status:** `draft` até deps implementadas.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `selectByCompetencia` seleciona versão correta por competência?
- [ ] Recálculo retroativo navega `SUPERSEDED_BY`?
- [ ] Conflito de vigências sobrepostas detectado?
- [ ] Vetor: regra errada nunca aplicada?
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

