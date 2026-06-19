---
id: T-CFR-02
title: "apuracao fiscal por competencia + provisao em BALANCE_STATE + arquivo SPED como projecao"
status: draft
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-CFR-01", "T-103"]
blocks: ["T-CFR-04", "T-CFR-05"]
---

# T-CFR-02 · apuracao fiscal por competencia + provisao em BALANCE_STATE + arquivo SPED como projecao

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de apuração fiscal no pacote `@plataforma/contabil`: cálculo de tributos como Zen jurisdicional sobre os fatos aplicando a regra vigente na competência (recálculo retroativo correto por construção), acúmulo do imposto a recolher em `ASSET:BALANCE_STATE` próprio, e geração de arquivos SPED/obrigações acessórias como projeção sobre os fatos. Emissão e transmissão de documentos fiscais (NF-e etc.) são delegadas a conector classe C — a plataforma modela o que precisa para orquestrar e provisionar, não reimplementa o motor fiscal externo. Falta de conector → modo degradado declarado.
*(Fonte: `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §3)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/contabil/src/tax.ts ---
import type { ULID, HLCTimestamp } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';
import type { EconomicFact } from './chart-of-accounts.js';

/** Regime tributário. */
export type TaxRegime = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

/** Tributo a apurar. */
export interface TaxRule {
  id: string;
  name: string; // "ICMS", "PIS", "COFINS", "IRPJ", "CSLL", "ISS"
  jurisdiction: string;
  regime: TaxRegime;
  /** Alíquota base (pode ser ajustada por Zen). */
  baseRate: number;
  /** Base de cálculo (ex: 'revenue', 'payroll', 'profit'). */
  base: 'revenue' | 'payroll' | 'profit' | 'custom';
  /** Vigência da regra (epoch ms). */
  effectiveFrom: number;
  supersedesId?: string;
}

/** Provisão de tributo (acumula em BALANCE_STATE). */
export interface TaxProvision {
  id: ULID;
  taxRuleId: string;
  competence: number; // período de apuração (epoch ms)
  /** Base de cálculo apurada. */
  baseAmount: number;
  /** Valor do tributo. */
  taxAmount: number;
  /** Fatos que compõem a base. */
  sourceFactIds: ULID[];
  createdAt: number;
}

/** Resultado da apuração fiscal de uma competência. */
export interface TaxCalculation {
  competence: number;
  jurisdiction: string;
  provisions: TaxProvision[];
  /** Total a recolher. */
  totalTaxDue: number;
  /** Se houve fatos não classificados (apuração incompleta). */
  incomplete: boolean;
}

/** Layout de arquivo SPED (projeção). */
export interface SpedLayout {
  regime: TaxRegime;
  blocks: SpedBlock[];
}

export interface SpedBlock {
  code: string; // "0", "C", "D", "E", "H", "K", etc.
  description: string;
  records: Record<string, string>[];
}

/** Registra regra tributária jurisdicional. */
export function createTaxRule(params: Omit<TaxRule, 'id'>): TaxRule;

/** Apura tributos de uma competência. */
export async function calculateTaxes(
  storage: StoragePort,
  competence: number,
  jurisdiction: string,
  regime: TaxRegime,
): Promise<TaxCalculation>;

/** Acumula provisão em BALANCE_STATE. */
export async function provisionTax(
  storage: StoragePort,
  provision: Omit<TaxProvision, 'id'>,
): Promise<TaxProvision>;

/** Gera arquivo SPED como projeção sobre os fatos. */
export async function generateSped(
  storage: StoragePort,
  competence: number,
  regime: TaxRegime,
): Promise<SpedLayout>;

/** Recalcula tributos de competência anterior (retroativo). */
export async function recalculateTaxes(
  storage: StoragePort,
  competence: number,
  jurisdiction: string,
): Promise<TaxCalculation>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md](../docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md) §3 — apuração fiscal, provisão, SPED, modo degradado
- [[jurisdicao]] — variante jurisdicional decide qual conector e parâmetros
- [[conector-externo]] — conector classe C para emissão/transmissão de NF-e, classe E para consulta
- [[vigencia-de-regra]] — competência temporal para recálculo retroativo

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §3, §6
- **[READ]** `packages/contabil/src/chart-of-accounts.ts` (T-CFR-01) — EconomicFact, ClassificationRule
- **[READ]** `packages/core/src/hlc.ts` (T-103) — HLCTimestamp para competência
- **[CREATE]** `packages/contabil/src/tax.ts` — funções acima
- **[CREATE]** `packages/contabil/tests/tax.test.ts`
- **[UPDATE]** `packages/contabil/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/contabil test`.
- [x] **Fora de Escopo:** Transmissão real de NF-e/SPED (conector), validação de assinatura digital de NF-e.

Casos de teste (numerados):
1. `createTaxRule({ name: 'ICMS', jurisdiction: 'BR-SP', baseRate: 0.18, ... })` → regra criada.
2. `calculateTaxes(2026-06, 'BR', 'lucro_presumido')` sobre 3 fatos de venda → PIS/COFINS calculados.
3. `calculateTaxes` com jurisdição sem regras → `incomplete: true`, `totalTaxDue: 0`.
4. `provisionTax` → provisão registrada com `sourceFactIds` e `competence`.
5. Duas chamadas a `provisionTax` para mesma competência → segunda atualiza (não duplica).
6. `generateSped('lucro_presumido')` → layout com blocos 0, C, D, E, H, K preenchidos.
7. `recalculateTaxes(2025-01, 'BR')` aplica regra vigente em 2025-01, não a atual.
8. `calculateTaxes` com `base: 'payroll'` (INSS) → calculado sobre total de folha da competência.
9. `calculateTaxes` com `base: 'revenue'` → calculado sobre total de vendas da competência.
10. Modo degradado: `calculateTaxes` sinaliza `incomplete: true` com fato negativo (sem conector, sem estimativa).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** transmita NF-e ou SPED — isso é responsabilidade do conector classe C (fora do escopo). A plataforma só apura e provisiona.
> - **NÃO** estime tributo silenciosamente quando faltam dados — sinalize `incomplete: true`.
> - **NÃO** aplique regra de jurisdição errada — se não há variante para a jurisdição, degrade com fato negativo.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Recálculo retroativo**: `recalculateTaxes(2025-01)` deve usar as regras com `effectiveFrom <= 2025-01` e que não foram substituídas antes dessa data. Não usar a regra atual se ela foi criada depois.
- **Provisão vs. pagamento**: a provisão acumula em BALANCE_STATE (passivo). O pagamento do tributo é um fato separado que liquida esse passivo — não confundir apuração com recolhimento.
- **Base de cálculo mista**: um fato pode contribuir para múltiplos tributos (ex: venda → ICMS + PIS + COFINS). Cada tributo tem sua própria base de cálculo e alíquota.

1. **[TDD]** Crie `packages/contabil/tests/tax.test.ts` com casos 1–10.
2. Implemente `createTaxRule` com validação de `base`/`regime`.
3. Implemente `calculateTaxes` (agrega fatos por competência, aplica regras por jurisdição).
4. Implemente `provisionTax` (acumula em BALANCE_STATE, idempotente por competência).
5. Implemente `generateSped` como projeção (layout de blocos).
6. Implemente `recalculateTaxes` (usa regra da época, não a atual).
7. Re-exporte em `packages/contabil/src/index.ts`.
8. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-CFR-01 está `draft`**: `EconomicFact` e `ClassificationRule` ainda não estão definidos. Usar interfaces provisórias.
> - **Layout SPED completo**: a especificação define que SPED é projeção. O layout exato de cada bloco (registros, campos) depende de especificação da RFB. Esta task implementa o mecanismo de projeção; os layouts específicos serão preenchidos por SPEC.
> **Status:** `draft` até T-CFR-01 ficar `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `calculateTaxes` aplica regra vigente na competência (não a atual)?
- [ ] `recalculateTaxes` é retroativo correto (usa regra da época)?
- [ ] Modo degradado sinaliza `incomplete: true`, nunca estima?
- [ ] `generateSped` é projeção sobre fatos (não mantém estado paralelo)?
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
