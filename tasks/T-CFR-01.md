---
id: T-CFR-01
title: "plano de contas como SPEC + mapeamento fato para conta por Zen jurisdicional"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004", "T-JU-01"]
blocks: ["T-CFR-02", "T-CFR-03", "T-CFR-04", "T-CFR-05"]
capacity_target: sonnet
---

# T-CFR-01 · plano de contas como SPEC + mapeamento fato para conta por Zen jurisdicional

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet


> [!WARNING]
> **REVISAR:** Esta spec contém dependência de terminologia e infraestrutura do antigo monólito "Nexus" ou chamadas diretas ao motor "Zen Engine". 
> Em virtude da introdução do Estaleiro (RFC-018) e do `@plataforma/plugin-workflows`, esses componentes foram superados ou encapsulados. 
> Re-endureça esta spec adequando aos novos contratos antes de desenvolvê-la.

## 1. Objetivo
Implementar o módulo de plano de contas e classificação contábil no pacote `@plataforma/contabil`. O plano de contas é uma `SPECIFICATION` hierárquica versionada por linhagem. A regra "fato econômico → conta débito/crédito" é Zen na SPEC contábil, parametrizável por jurisdição (a variante regional fornece o plano referencial). Mudança de regra = `SUPERSEDED_BY` com vigência por competência. O razão contábil é derivado e reconstruível da linhagem dos fatos — correção = novo fato/estorno append-only.
*(Fonte: `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §1-2)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/contabil/src/chart-of-accounts.ts 
---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Natureza de uma conta contábil. */
export type AccountNature = 'debit' | 'credit';

/** Tipo de conta no plano. */
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

/** Conta no plano de contas. */
export interface ChartAccount {
  code: string; // hierárquico: "1", "1.1", "1.1.1"
  name: string;
  type: AccountType;
  nature: AccountNature;
  /** Conta pai (para hierarquia). */
  parentCode?: string;
  /** Se aceita lançamentos (folha) ou só sumariza (sintética). */
  isAnalytical: boolean;
}

/** Plano de contas = SPECIFICATION. */
export interface ChartOfAccountsSpec {
  kind: 'CHART_OF_ACCOUNTS';
  version: number;
  /** Jurisdição que forneceu o plano referencial. */
  jurisdiction: string; // ex: "BR", "BR-SP"
  accounts: ChartAccount[];
  /** Vigência: competência inicial (epoch ms). */
  effectiveFrom: number;
  /** ID da versão anterior (SUPERSEDED_BY). */
  supersedesId?: ULID;
}

/** Fato econômico a ser classificado. */
export interface EconomicFact {
  id: ULID;
  factType: string; // "sale", "purchase", "payment", "payroll", "tax_provision"
  amount: number;
  /** Data do fato (epoch ms). */
  factDate: number;
  /** Jurisdição do fato. */
  jurisdiction: string;
  /** Metadados extras (contraparte, SKU, etc.). */
  payload: Record<string, unknown>;
}

/** Lançamento contábil derivado (partida dobrada). */
export interface AccountingEntry {
  id: ULID;
  factId: ULID;
  /** Conta debitada. */
  debitAccount: string;
  /** Conta creditada. */
  creditAccount: string;
  amount: number;
  /** Competência do lançamento. */
  competence: number; // epoch ms do período
  /** Versão do plano de contas usado. */
  chartVersion: number;
  createdAt: number;
}

/** Regra de classificação: fato → débito/crédito. */
export interface ClassificationRule {
  factType: string;
  debitAccount: string;
  creditAccount: string;
  jurisdiction: string;
  /** Vigência da regra (epoch ms). */
  effectiveFrom: number;
  /** Se substituiu regra anterior. */
  supersedesRuleId?: ULID;
}

/** Cria plano de contas jurisdicional. */
export function createChartOfAccounts(
  jurisdiction: string,
  accounts: ChartAccount[],
  effectiveFrom: number,
  supersedesId?: ULID,
): ChartOfAccountsSpec;

/** Registra regra de classificação (fato → contas). */
export function createClassificationRule(params: {
  factType: string;
  debitAccount: string;
  creditAccount: string;
  jurisdiction: string;
  effectiveFrom: number;
  supersedesRuleId?: ULID;
}): ClassificationRule;

/** Classifica um fato econômico gerando lançamento contábil. */
export async function classifyFact(
  storage: StoragePort,
  fact: EconomicFact,
  chartId: ULID,
): Promise<AccountingEntry>;

/** Reconstrói o razão contábil de um período a partir da linhagem. */
export async function buildLedger(
  storage: StoragePort,
  chartId: ULID,
  fromCompetence: number,
  toCompetence: number,
): Promise<AccountingEntry[]>;

/** Lista contas do plano (folha ou sintéticas). */
export function listAccounts(
  chart: ChartOfAccountsSpec,
  analyticalOnly?: boolean,
): ChartAccount[];
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md](../docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md) §1-2 — contabilidade como derivação por SPEC, plano de contas
- [[jurisdicao]] — dimensão de contexto que seleciona variante de regra
- [[lancamento-derivado]] — classificação contábil gerada por SPEC a partir de fatos econômicos
- [[vigencia-de-regra]] — competência temporal (RFC-009 A.3)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §1-2, §6
- **[READ]** `docs/conceitos/jurisdicao.md` — resolução multi-jurisdição por papel
- **[READ]** `docs/conceitos/lancamento-derivado.md` — definição de lançamento derivado
- **[READ]** `tasks/T-JU-01.md` — resolução de jurisdição efetiva (cascata)
- **[CREATE]** `packages/contabil/src/chart-of-accounts.ts` — funções acima
- **[CREATE]** `packages/contabil/tests/chart-of-accounts.test.ts`
- **[UPDATE]** `packages/contabil/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/contabil test`.
- [x] **Fora de Escopo:** Integração com Zen engine real (T-604), transmissão de SPED.

Casos de teste (numerados):
1. `createChartOfAccounts('BR', contas, 2026-01-01)` → spec com `kind: 'CHART_OF_ACCOUNTS'`, `version: 1`.
2. `listAccounts(chart)` retorna todas as contas; `listAccounts(chart, true)` retorna só analíticas.
3. `createClassificationRule({ factType: 'sale', debitAccount: '1.1.1', creditAccount: '3.1.1', jurisdiction: 'BR' })` → regra criada.
4. `classifyFact(fato_venda_BR, chart)` → lançamento com débito e crédito conforme regra.
5. `classifyFact` com fato sem regra para o `factType` → erro "no classification rule".
6. `classifyFact` com jurisdição diferente → usa regra da jurisdição correta.
7. `buildLedger` reconstrói razão de um período com múltiplos fatos → soma débitos = soma créditos (partida dobrada).
8. Mudança de regra com `supersedesRuleId`: fato classificado após a mudança usa nova regra; fato antes usa regra antiga.
9. Plano de contas com `supersedesId`: nova versão substitui anterior; `buildLedger` usa versão correta por competência.
10. Conta sintética (não analítica) não pode receber lançamento direto → erro.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** permita edição de lançamento — correção = novo fato/estorno append-only.
> - **NÃO** permita lançamento em conta sintética (não analítica).
> - **NÃO** aplique regra de jurisdição errada — a classificação respeita a jurisdição do fato.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Vigência por competência**: um fato com `factDate` em 2025 usa a regra vigente em 2025, mesmo que a regra atual (2026) seja diferente. `classifyFact` precisa selecionar a regra cujo `effectiveFrom <= factDate` e que não tenha sido substituída antes de `factDate`.
- **Plano hierárquico**: contas sintéticas são soma das analíticas filhas. `buildLedger` deve validar que totais sintéticos batem com a soma das analíticas, mas não gerar lançamentos sintéticos — eles são projeção.
- **Partida dobrada nativa**: a fonte RAG §1.1 diz que a partida dobrada já é nativa do protocolo (um `SPENDS`, N `CREDITS`). Aqui a classificação é apenas mapear o fato para contas; o balanço estrutural vem do protocolo.

1. **[TDD]** Crie `packages/contabil/tests/chart-of-accounts.test.ts` com casos 1–10.
2. Implemente `createChartOfAccounts`, `listAccounts`.
3. Implemente `createClassificationRule` e `classifyFact` com seleção por jurisdição e competência.
4. Implemente `buildLedger` (reconstrução a partir da linhagem de fatos).
5. Re-exporte em `packages/contabil/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-JU-01 (resolução de jurisdição) está `draft`**: a cascata de jurisdição e o formato exato do identificador hierárquico (`BR`, `BR-SP`) dependem de T-JU-01. A interface acima usa `string` para jurisdição como placeholder.
> - **Mapeamento fato→conta via Zen**: a fonte RAG §2.2 diz que a regra é "Zen na SPEC contábil". T-604 (Zen Engine) está `draft`. Esta task implementa a regra como lookup determinístico (factType + jurisdição → contas); o Zen virá como upgrade quando T-604 estiver pronto.
> **Status:** `draft` até T-JU-01 ficar `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `classifyFact` seleciona regra por jurisdição e vigência por competência?
- [ ] `buildLedger` reconstrói razão com partida dobrada (soma débitos = soma créditos)?
- [ ] Mudança de regra com `supersedesRuleId` respeita competência?
- [ ] Conta sintética rejeita lançamento direto?
- [ ] Os 10 casos de teste passam?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/contabil build
pnpm --filter @plataforma/contabil test
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
