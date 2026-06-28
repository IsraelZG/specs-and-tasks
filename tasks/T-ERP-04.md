---
id: T-ERP-04
title: "CRM (pipeline workflow, visao 360 por traversal, regua Zen)"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-ERP-01", "T-WF-01"]
blocks: ["T-ERP-05"]
---

# T-ERP-04 · CRM (pipeline workflow, visao 360 por traversal, regua Zen)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de CRM no pacote `@plataforma/erp` como lente sobre o grafo: pipeline de vendas via `StateMachine` (`SPEC:CRM_PIPELINE`) com estágios configuráveis, visão 360° do cliente por traversal (pedidos, interações, financeiro, tickets — sem tabela agregada), e régua de relacionamento como Zen disparando intents/notificações por conector classe A. Dado pessoal de CRM invoca o framework de privacidade canônico (consentimento, expurgo por rotação de época), sem criar mecanismo próprio.
*(Fonte: `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §5)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/erp/src/crm.ts ---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Estágio de pipeline de CRM (configurável). */
export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  /** Probabilidade de fechamento (0–100), usado para forecast. */
  probability: number;
  /** Se é estágio terminal (ganho/perdido). */
  isTerminal: boolean;
}

/** Definição de pipeline: SPEC:CRM_PIPELINE. */
export interface CrmPipeline {
  kind: 'CRM_PIPELINE';
  version: number;
  stages: PipelineStage[];
  /** Transições permitidas entre estágios. */
  transitions: Record<string, string[]>;
}

/** Entidade de CRM (lead/oportunidade) — ancora em PROFILE. */
export interface CrmEntity {
  id: ULID;
  profileId: ULID; // PROFILE do contato/organização
  pipelineId: ULID; // SPEC:CRM_PIPELINE
  currentStage: string;
  /** Valor estimado da oportunidade. */
  estimatedValue: number;
  /** Data prevista de fechamento. */
  expectedCloseDate?: number;
  createdAt: number;
  updatedAt: number;
}

/** Tipo de interação de CRM. */
export type InteractionType = 'email' | 'call' | 'meeting' | 'message' | 'note';

/** Registro de interação com contato. */
export interface CrmInteraction {
  id: ULID;
  crmEntityId: ULID;
  profileId: ULID;
  type: InteractionType;
  summary: string;
  timestamp: number;
}

/** Resultado da visão 360° de um cliente. */
export interface Customer360View {
  profileId: ULID;
  crmEntities: CrmEntity[];
  interactions: CrmInteraction[];
  /** Contagem de pedidos vinculados (traversal para CONTENT:INTENT). */
  orderCount: number;
  /** Total financeiro vinculado (traversal para BALANCE_STATE). */
  totalRevenue: number;
}

/** Cria um pipeline de CRM com estágios padrão. */
export function createCrmPipeline(stages?: PipelineStage[]): CrmPipeline;

/** Cria uma entidade de CRM (lead/oportunidade). */
export async function createCrmEntity(
  storage: StoragePort,
  params: {
    profileId: ULID;
    pipelineId: ULID;
    estimatedValue: number;
    expectedCloseDate?: number;
  },
): Promise<CrmEntity>;

/** Avança uma entidade de CRM para o próximo estágio. */
export async function advanceStage(
  storage: StoragePort,
  crmEntityId: ULID,
  targetStage: string,
): Promise<CrmEntity>;

/** Registra interação com contato. */
export async function recordInteraction(
  storage: StoragePort,
  interaction: Omit<CrmInteraction, 'id'>,
): Promise<CrmInteraction>;

/** Constrói visão 360° por traversal no grafo. */
export async function getCustomer360(
  storage: StoragePort,
  profileId: ULID,
): Promise<Customer360View>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/16-erp-crm-reference-spec.md](../docs/caderno-3-sdk/16-erp-crm-reference-spec.md) §5 — CRM como grafo, pipeline, interações, régua
- [[pipeline-crm]] — máquina de estados rasa governada por `SPEC:CRM_PIPELINE`
- [[spec-workflow]] — SPEC:WORKFLOW como nó SPECIFICATION para pipeline
- [[conector-externo]] — conector classe A (egresso notificacional) para régua disparar intents/notificações

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/16-erp-crm-reference-spec.md` §5
- **[READ]** `docs/conceitos/pipeline-crm.md` — definição do pipeline de CRM
- **[READ]** `docs/conceitos/spec-workflow.md` — base de SPEC:WORKFLOW
- **[CREATE]** `packages/erp/src/crm.ts` — funções acima
- **[CREATE]** `packages/erp/tests/crm.test.ts`
- **[UPDATE]** `packages/erp/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/erp test`.
- [x] **Fora de Escopo:** Envio real de notificações (conector classe A), integração com módulo de privacidade.

Casos de teste (numerados):
1. `createCrmPipeline()` retorna pipeline com estágios padrão: `[lead, qualificado, proposta, negociacao, ganho, perdido]`.
2. `createCrmPipeline` com estágios customizados → pipeline usa os estágios fornecidos.
3. `createCrmEntity` → `currentStage` é o primeiro estágio do pipeline.
4. `advanceStage` de `lead` para `qualificado` → sucesso.
5. `advanceStage` com transição inválida (pular estágio) → erro.
6. `advanceStage` para estágio terminal (`ganho`) → `isTerminal: true`, não permite mais transições.
7. `recordInteraction` → interação vinculada ao `crmEntityId` e `profileId`.
8. `getCustomer360` retorna visão agregada (entidades, interações, pedidos, receita) por traversal.
9. Duas entidades de CRM para o mesmo `profileId` → `getCustomer360` retorna ambas.
10. Pipeline com 10 estágios: percorrer todos sequencialmente sem pular.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie tabela agregada para visão 360° — a visão é traversal sobre o grafo (pedidos, interações, financeiro). Use queries que navegam arestas, não uma tabela `customer_360`.
> - **NÃO** implemente envio de email/SMS/WhatsApp (conector classe A) — a régua de relacionamento é Zen (fora do escopo), o disparo é via conector (T-CN-01).
> - **NÃO** crie mecanismo próprio de privacidade — invoque as primitivas do caderno-1 (consentimento, expurgo por época).

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Transições inválidas**: o pipeline declara `transitions` como `Record<string, string[]>` — só os pares listados são válidos. Não assuma que "próximo estágio" é o seguinte no array — use o mapa de transições.
- **Terminal não é cancelado**: estágios terminais (`ganho`, `perdido`) não permitem transição de saída. Mas `cancelado` é diferente de `perdido` — a fonte RAG não distingue; usar `isTerminal` como flag explícita.
- **Visão 360° depende de outros módulos**: `orderCount` e `totalRevenue` vêm de traversal para nós que T-ERP-01/02/03 criarão. Nos testes, stubar esses dados.

1. **[TDD]** Crie `packages/erp/tests/crm.test.ts` com casos 1–10.
2. Implemente `createCrmPipeline` com estágios padrão e customizados.
3. Implemente `createCrmEntity` e `advanceStage` com validação de transições.
4. Implemente `recordInteraction`.
5. Implemente `getCustomer360` por traversal (use StoragePort queries para navegar arestas).
6. Re-exporte em `packages/erp/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-WF-01 (SPEC:WORKFLOW) está `draft`**: o pipeline de CRM é uma StateMachine. O contrato exato de SPEC:WORKFLOW (guarda Zen, ações intent, orçamento) virá de T-WF-01. A interface acima é provisória.
> - **Régua de relacionamento**: a fonte RAG §5.4 diz "Zen disparando intents/notificações". Isso depende de T-604 (Zen Engine). Fora do escopo desta task, mas precisa ser referenciado como dependência indireta.
> **Status:** `draft` até T-WF-01 ficar `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `advanceStage` valida transições conforme o mapa declarado no pipeline?
- [ ] Estágios terminais não permitem transição de saída?
- [ ] `getCustomer360` é traversal (não tabela agregada)?
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
