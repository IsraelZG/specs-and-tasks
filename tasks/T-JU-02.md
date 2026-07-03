---
id: T-JU-02
title: "composicao base+variante por EXTENDS + validacao variante nao contradiz invariante + degradacao para base"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-JU-01"]
blocks: ["T-JU-03"]
---

# T-JU-02 · composicao base+variante por EXTENDS + validacao variante nao contradiz invariante + degradacao para base

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar a composição SPEC base + variante jurisdicional por aresta `EXTENDS`. A SPEC base declara invariantes universais; variantes (`SPEC:*@BR`, `SPEC:*@US`) estendem a base carregando tabelas/procedimentos Zen da região. O validador garante que a variante só especializa (nunca contradiz invariantes da base). Ausência de variante para uma região → degrada para a base com `fato-negativo-verificavel`.
**Fonte:** `caderno-3-sdk/13-jurisdicao.md §2` — SPEC base + variantes por EXTENDS, resolução em cascata. **Conceitos:** [[spec-jurisdicional]], [[jurisdicao]].

### Contratos exatos

```ts
// --- packages/jurisdiction/src/spec-variant.ts 
---

import type { JurisdictionId, JurisdictionResolution } from './resolver';

/** Payload de uma SPEC jurisdicional (base ou variante). */
export interface SpecPayload {
  invariants: Record<string, unknown>; // invariantes do domínio (base) ou especializações (variante)
  tables?: Record<string, unknown>;    // tabelas de alíquotas, limites, etc.
  procedures?: Record<string, string>;  // procedimentos Zen
}

/** Relação EXTENDS: variante estende base. */
export interface ExtendsRelation {
  /** ID da SPEC variante (ex.: "SPEC:FOLHA@BR"). */
  variantId: string;
  /** ID da SPEC base (ex.: "SPEC:FOLHA"). */
  baseId: string;
  /** Jurisdição da variante. */
  jurisdiction: JurisdictionId;
}

/** Resultado da validação de variante contra base. */
export interface VariantValidation {
  valid: boolean;
  /** Campos da variante que contradizem invariantes da base. */
  contradictions: string[];
}

/**
 * Valida que a variante não contradiz os invariantes da base.
 * Contradição = campo presente na base com valor diferente na variante
 * (a variante só pode adicionar/especializar, nunca redefinir).
 */
export function validateVariant(
  basePayload: SpecPayload,
  variantPayload: SpecPayload,
): VariantValidation;

/**
 * Compõe base + variante: overlay do payload da variante sobre a base.
 * Campos da variante sobrescrevem/estendem a base; invariantes da base são preservados.
 */
export function composeSpec(
  basePayload: SpecPayload,
  variantPayload: SpecPayload,
): SpecPayload;

/**
 * Degradação: quando não há variante para a jurisdição, retorna a base
 * e emite fato-negativo-verificavel.
 */
export interface DegradationResult {
  payload: SpecPayload;
  degraded: boolean; // true se caiu para a base por ausência de variante
  missingJurisdiction?: JurisdictionId;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/13-jurisdicao.md](../docs/caderno-3-sdk/13-jurisdicao.md) — §2 (SPEC base + variantes por EXTENDS, resolução em cascata, internacionalização = adicionar variantes)
- [[spec-jurisdicional]] — definição canônica: base declara invariantes, variante especializa
- [[jurisdicao]] — dimensão de resolução (T-JU-01 provê `resolveJurisdiction`)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/jurisdiction/src/resolver.ts` — `JurisdictionId` (T-JU-01)
- **[CREATE]** `packages/jurisdiction/src/spec-variant.ts` — `validateVariant`, `composeSpec`, tipos
- **[CREATE]** `packages/jurisdiction/tests/spec-variant.test.ts` — testes de composição + validação + degradação
- **[UPDATE]** `packages/jurisdiction/src/index.ts` — re-exportar `spec-variant.ts`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/jurisdiction test`).
- [x] **Fora de Escopo:** Integração com ingestão real de SPEC, persistência.

Casos de teste:
1. `validateVariant` com variante que só adiciona campos → `valid: true`, `contradictions: []`.
2. `validateVariant` com variante que redefine invariante da base → `valid: false`, `contradictions` contém o campo.
3. `composeSpec` faz merge: invariantes da base + campos novos da variante.
4. `composeSpec` com variante que tem campo colidindo → valor da variante prevalece nos campos não-invariantes.
5. `composeSpec` com variante vazia → retorna base intacta.
6. Degradação: sem variante disponível → retorna base com `degraded: true`.
7. Type-check: `SpecPayload` aceita objetos parciais; `validateVariant` retorna `VariantValidation`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente o motor de vigência temporal (T-JU-03). Apenas composição estrutural.
> - **NÃO** implemente resolução multi-âncora (T-JU-04). Apenas uma jurisdição por vez.

### Pegadinhas conhecidas
- `validateVariant` compara `invariants` por deep-equality nas chaves — se a base tem `{tax_rate: 0.15}` e a variante tem `{tax_rate: 0.17}`, é contradição. Mas se a base NÃO tem `tax_rate` e a variante adiciona, é válido.
- `composeSpec` faz shallow merge no nível das chaves top-level (`invariants`, `tables`, `procedures`). Dentro de cada chave, o merge é `Object.assign`.
- `SpecPayload` usa `Record<string, unknown>` porque o conteúdo das tabelas/procedimentos é específico do domínio — a task não valida semântica, só estrutura.

1. **[TDD]** Crie `packages/jurisdiction/tests/spec-variant.test.ts` com casos 1–7.
2. Crie `packages/jurisdiction/src/spec-variant.ts`: `validateVariant`, `composeSpec`, `ExtendsRelation`, `VariantValidation`, `DegradationResult`.
3. Implemente `validateVariant`: itera chaves de `basePayload.invariants`, checa se `variantPayload.invariants` tem a mesma chave com valor diferente.
4. Implemente `composeSpec`: `{ ...basePayload, ...variantPayload }` com merge profundo nas sub-chaves.
5. Re-exporte em `packages/jurisdiction/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
*(Nenhuma pendência — contrato derivado integralmente de `caderno-3-sdk/13-jurisdicao.md §2`.*
*Dep T-JU-01 sendo endurecida nesta mesma passada — `JurisdictionId` definido.)*

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/jurisdiction build
pnpm --filter @plataforma/jurisdiction test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] `validateVariant` detecta contradições de invariantes?
- [ ] `composeSpec` faz merge preservando invariantes da base?
- [ ] Degradação retorna base com `degraded: true`?
- [ ] Testes cobrem: variante válida, contradição, merge, degradação?
- [ ] `pnpm --filter @plataforma/jurisdiction build` e `test` verdes?

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
