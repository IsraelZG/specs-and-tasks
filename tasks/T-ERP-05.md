---
id: T-ERP-05
title: "projecoes analiticas incrementais + teste de custo (volume)"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-ERP-01", "T-ERP-02", "T-ERP-03", "T-ERP-04"]
blocks: []
---

# T-ERP-05 · projecoes analiticas incrementais + teste de custo (volume)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar projeções analíticas materializadas e incrementais no pacote `@plataforma/erp` — a camada de BI/relatórios que resolve o limite de processamento de consultas analíticas sobre grafo cifrado append-only. As projeções são atualizadas no mesmo ponto pós-decifra que FTS/embeddings, com granularidade declarada por SPEC. Inclui teste de volume (10k+ movimentações) para validar custo computacional e correção do custeio projetado.
*(Fonte: `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §6, `docs/conceitos/projecao-analitica.md`)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/erp/src/analytics.ts 
---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Dimensão de uma projeção analítica. */
export type ProjectionDimension = 'time' | 'warehouse' | 'sku' | 'counterparty' | 'pipeline_stage';

/** Métrica agregada. */
export type ProjectionMetric = 'revenue' | 'cost' | 'margin' | 'inventory_value' | 'order_count' | 'avg_ticket';

/** Definição de projeção (SPEC). */
export interface ProjectionSpec {
  id: string;
  name: string;
  dimensions: ProjectionDimension[];
  metrics: ProjectionMetric[];
  /** Granularidade temporal (ex: 'day', 'month', 'quarter'). */
  timeGranularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  /** Se a projeção é incremental (atualiza delta) ou full-rebuild. */
  incremental: boolean;
}

/** Célula de projeção analítica (uma linha do cubo). */
export interface ProjectionCell {
  /** Combinação de dimensões como chave composta. */
  dimensionKey: string;
  /** Métricas agregadas. */
  values: Record<ProjectionMetric, number>;
  /** HLC máximo processado nesta célula (para incremental). */
  lastProcessedHlc: number;
  /** Timestamp da última atualização. */
  updatedAt: number;
}

/** Resultado de uma projeção completa. */
export interface ProjectionResult {
  specId: string;
  cells: ProjectionCell[];
  /** Total de fatos processados. */
  totalFacts: number;
  /** Se a projeção é incremental, fatos desde último processamento. */
  deltaFacts?: number;
  computedAt: number;
}

/** Cria uma SPEC de projeção analítica. */
export function createProjectionSpec(params: {
  name: string;
  dimensions: ProjectionDimension[];
  metrics: ProjectionMetric[];
  timeGranularity?: ProjectionSpec['timeGranularity'];
  incremental?: boolean;
}): ProjectionSpec;

/** Executa (ou atualiza) uma projeção analítica. */
export async function computeProjection(
  storage: StoragePort,
  spec: ProjectionSpec,
): Promise<ProjectionResult>;

/** Lista projeções existentes com seus metadados. */
export async function listProjections(
  storage: StoragePort,
): Promise<ProjectionSpec[]>;

/** Estima custo computacional de uma projeção (fatos × dimensões × métricas). */
export function estimateProjectionCost(
  spec: ProjectionSpec,
  factCount: number,
): { estimatedOps: number; estimatedMemoryBytes: number; tier: 'light' | 'medium' | 'heavy' };
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/16-erp-crm-reference-spec.md](../docs/caderno-3-sdk/16-erp-crm-reference-spec.md) §6 — relatórios e BI, projeções materializadas incrementais, limite honesto de BI cifrado
- [[projecao-analitica]] — agregado incremental pós-decifra, limites dimensionais
- [[linhagem-de-versoes]] — fonte dos fatos para projeção

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §6
- **[READ]** `docs/conceitos/projecao-analitica.md` — contrato de projeções
- **[READ]** `packages/erp/src/inventory.ts` (T-ERP-02) — fonte de dados de inventário
- **[READ]** `packages/erp/src/finance.ts` (T-ERP-03) — fonte de dados financeiros
- **[READ]** `packages/erp/src/crm.ts` (T-ERP-04) — fonte de dados de pipeline
- **[CREATE]** `packages/erp/src/analytics.ts` — funções acima
- **[CREATE]** `packages/erp/tests/analytics.test.ts` — incluindo teste de volume
- **[UPDATE]** `packages/erp/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/erp test`.
- [x] **Fora de Escopo:** Dashboards, renderização de gráficos, RAG para análise semântica.

Casos de teste (numerados):
1. `createProjectionSpec` com dimensões `['time', 'warehouse']` e métricas `['revenue', 'cost']` → spec criada.
2. `computeProjection` sobre 100 fatos → resultado com células agregadas.
3. `computeProjection` incremental: segunda chamada processa só delta (fatos novos desde último `lastProcessedHlc`).
4. Projeção com dimensão `sku`: células distintas para cada SKU.
5. Projeção com granularidade `month`: fatos do mesmo mês na mesma célula.
6. `estimateProjectionCost(light, 1000)` → tier: `light`.
7. `estimateProjectionCost(heavy, 100000)` → tier: `heavy`.
8. **Teste de volume (custo)**: 10.000 movimentações de inventário → `computeProjection` completa em < 2s. Custos calculados batem com projeção manual de amostra.
9. Projeção sobre conjunto vazio → 0 células, sem erro.
10. Duas projeções com specs diferentes coexistem.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente dashboards ou gráficos (frontend) — esta task é só o motor de projeção (backend).
> - **NÃO** faça queries cross-tenant em rede pública — projeções são locais ao device.
> - **NÃO** esconda o custo computacional — `estimateProjectionCost` deve ser chamado antes de `computeProjection` e o custo registrado.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Incremental vs full**: projeção incremental usa `lastProcessedHlc` para filtrar fatos novos. Se o worker fizer `computeProjection` sem verificar o modo, pode recalcular tudo (full rebuild) desperdiçando CPU em BI cifrado — onde cada agregação exige decifrar no device (§6.2).
- **Teste de volume sem memória**: 10k movimentações em memória via stub de StoragePort. Não carregar 10k registros em array — processar em streaming/iterador. O teste de volume valida que a implementação escala linearmente, não que cabe em RAM.
- **Chave de dimensão composta**: `dimensionKey` é concatenada deterministicamente (ex: `2026-06|WH-A|SKU-123`). Ordem das dimensões na chave deve ser consistente.

1. **[TDD]** Crie `packages/erp/tests/analytics.test.ts` com casos 1–10, incluindo teste de volume com 10k registros.
2. Implemente `createProjectionSpec` e `estimateProjectionCost`.
3. Implemente `computeProjection` com suporte a incremental (delta por `lastProcessedHlc`) e full rebuild.
4. Implemente `listProjections`.
5. Re-exporte em `packages/erp/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **Dependências T-ERP-02/03/04 estão `draft`**: as projeções consomem dados de inventário, financeiro e CRM. Sem esses módulos prontos, os testes usam dados stubados.
> - **Limite de BI cifrado**: a fonte RAG §6.2 diz que agregar exige decifrar no device. Esta task assume que os dados já estão decifrados no nível da projeção — o custo de decifra é upstream, não aqui.
> **Status:** `draft` até as dependências ficarem `ready`. Os contratos das projeções não dependem dos detalhes internos dos módulos-fonte.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `computeProjection` suporta modo incremental (delta) e full rebuild?
- [ ] `estimateProjectionCost` retorna tier antes da computação?
- [ ] Teste de volume (10k fatos) completa sem estouro de memória e em tempo razoável?
- [ ] Projeções com dimensões/métricas diferentes produzem células corretas?
- [ ] Os 10 casos de teste passam?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/erp build
pnpm --filter @plataforma/erp test
```
> **GATE DE EVIDÊNCIA:** Worker cola saída literal na Seção 8.

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
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
