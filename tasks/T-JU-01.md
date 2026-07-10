---
id: T-JU-01
title: "resolucao de jurisdicao efetiva (cascata) + registro no fato + testes de precedencia"
status: ready
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-004"]
blocks: ["T-JU-02"]
capacity_target: sonnet
---

# T-JU-01 · resolucao de jurisdicao efetiva (cascata) + registro no fato + testes de precedencia

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o resolvedor de jurisdição efetiva em cascata: dada uma operação, resolve o identificador hierárquico (`BR`, `BR-SP`, `US-CA`, ...) por precedência (override explícito → jurisdição do contexto → default da implementação) e registra a jurisdição resolvida no fato, eliminando ambiguidade silenciosa.
**Fonte:** `caderno-3-sdk/13-jurisdicao.md §1` — jurisdição como dimensão de resolução, cascata de precedência. **Conceitos:** [[jurisdicao]], [[spec-jurisdicional]].

### Contratos exatos

```ts
// --- packages/jurisdiction/src/resolver.ts 
---

/** Identificador hierárquico de jurisdição (ex.: "BR", "BR-SP", "US", "EU"). */
export type JurisdictionId = string;

/** Fontes de jurisdição em ordem de precedência (maior → menor). */
export enum JurisdictionSource {
  ExplicitOverride = 1,   // declarado na operação
  ContextEntity    = 2,   // jurisdição do PROFILE:ORGANIZATION/nó de contexto
  Implementation   = 3,   // default da implementação
}

/** Resultado da resolução com fonte e rastro. */
export interface JurisdictionResolution {
  jurisdiction: JurisdictionId;
  source: JurisdictionSource;
  /** Cadeia hierárquica resolvida (ex.: ["BR", "BR-SP"]). */
  chain: JurisdictionId[];
}

/** Entrada para resolução: override opcional + contexto opcional. */
export interface JurisdictionInput {
  explicitOverride?: JurisdictionId;
  contextJurisdiction?: JurisdictionId;
  defaultJurisdiction: JurisdictionId; // sempre presente
}

/** Resolvedor de jurisdição em cascata (caderno-3-sdk/13 §1.2). */
export function resolveJurisdiction(input: JurisdictionInput): JurisdictionResolution;

/** Registra a jurisdição efetiva no fato (caderno-3-sdk/13 §1.2). */
export interface JurisdictionFact {
  factId: string;
  resolvedJurisdiction: JurisdictionId;
  resolvedAt: number; // timestamp ms
  source: JurisdictionSource;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/13-jurisdicao.md](../docs/caderno-3-sdk/13-jurisdicao.md) — §1 (jurisdição como dimensão, resolução por precedência, registro no fato)
- [[jurisdicao]] — definição canônica e resolução multi-jurisdição por papel
- [[spec-jurisdicional]] — base + variante por `EXTENDS` (usado em T-JU-02)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/protocol/src/ports.ts` — `ClockPort` (T-004 ready)
- **[CREATE]** `packages/jurisdiction/src/resolver.ts` — `resolveJurisdiction` + tipos
- **[CREATE]** `packages/jurisdiction/tests/resolver.test.ts` — testes de cascata e precedência
- **[UPDATE]** `packages/jurisdiction/src/index.ts` — re-exportar `resolver.ts`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser).
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/jurisdiction test`).
- [x] **Fora de Escopo:** Integração com validador de fluxo, persistência real de fatos.

Casos de teste:
1. Override explícito vence: `explicitOverride="BR-SP"`, contexto `"BR"`, default `"US"` → `"BR-SP"` com `source=ExplicitOverride`.
2. Sem override, contexto vence: `explicitOverride=undefined`, contexto `"BR"`, default `"US"` → `"BR"` com `source=ContextEntity`.
3. Sem override nem contexto, default: `explicitOverride=undefined`, `contextJurisdiction=undefined`, default `"US"` → `"US"` com `source=Implementation`.
4. Cadeia hierárquica: `"BR-SP"` → `chain=["BR","BR-SP"]`.
5. `JurisdictionId` inválido (vazio) lança erro.
6. Mesma jurisdição em múltiplas fontes → vence a de maior precedência.
7. Type-check: `JurisdictionSource` enum com valores 1/2/3; `resolveJurisdiction` retorna `JurisdictionResolution`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente a lógica de variantes jurisdicionais (T-JU-02) ou vigência temporal (T-JU-03). Esta task só resolve o identificador.
> - **NÃO** use `any` nos tipos de retorno.
> - **NÃO** dependa de banco de dados — a função `resolveJurisdiction` é pura.

### Pegadinhas conhecidas
- `JurisdictionId` hierárquico usa `-` como separador (ex.: `BR-SP`), não `/` nem `.`. A função de chain deve split por `-` e reconstruir prefixos.
- O default é sempre presente (`JurisdictionInput.defaultJurisdiction` não é opcional), mas override e contexto podem ser `undefined`.
- `JurisdictionSource` é enum numérico — testes devem comparar por valor (`JurisdictionSource.ExplicitOverride`), não por string.
- A função `resolveJurisdiction` é síncrona e pura — não precisa de `ClockPort` para timestamp (isso fica no `JurisdictionFact`).

1. **[TDD]** Crie `packages/jurisdiction/tests/resolver.test.ts` com os 7 casos da Seção 4.
2. Crie `packages/jurisdiction/src/resolver.ts` com `resolveJurisdiction`, `JurisdictionId`, `JurisdictionSource`, `JurisdictionResolution`, `JurisdictionInput`, `JurisdictionFact`.
3. Implemente `resolveJurisdiction`: testa override → contexto → default. Gera `chain` por split de `-`.
4. Re-exporte em `packages/jurisdiction/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
*(Nenhuma pendência — contrato derivado integralmente de `caderno-3-sdk/13-jurisdicao.md §1`.*
*Dep T-004 ready; `ClockPort` disponível para timestamp futuro.)*

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/jurisdiction build
pnpm --filter @plataforma/jurisdiction test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] `resolveJurisdiction` implementa cascata (override > contexto > default)?
- [ ] `JurisdictionSource` enum com 3 valores, correto?
- [ ] `chain` hierárquica gerada corretamente (ex.: `"BR-SP"` → `["BR","BR-SP"]`)?
- [ ] Testes cobrem todos os ramos de precedência?
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
- **[2026-07-03T20:03]** - *system* - `[Endurecido]`: Endurecimento em lote (dependencies done/empty)
- **[2026-07-03T20:03]** - *system* - `[Auto-promovida]`: deps todas done
