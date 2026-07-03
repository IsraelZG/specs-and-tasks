---
id: T-CFR-04
title: "RH: colaborador/vinculo/eventos + folha derivada jurisdicional + provisao e lancamentos"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-CFR-01", "T-CFR-02", "T-JU-01"]
blocks: ["T-CFR-05"]
---

# T-CFR-04 · RH: colaborador/vinculo/eventos + folha derivada jurisdicional + provisao e lancamentos

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de RH no pacote `@plataforma/contabil`: colaborador como `PROFILE`, vínculo como `ASSET:ROLE` com escopo e contrato (`CONTENT`), eventos de trabalho (admissão, ponto, hora extra, afastamento, férias, desligamento) como `CONTENT` governado por SPEC que são a fonte da folha. A folha é derivada como lançamentos contábeis e tributários a partir dos eventos, com encargos jurisdicionais (INSS, FGTS, IRRF) aplicados por competência (vigência da época). Dados pessoais de colaborador tratados sob o framework de privacidade canônico com retenção legal prevalecente.
*(Fonte: `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §5)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/contabil/src/payroll.ts 
---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';
import type { AccountingEntry } from './chart-of-accounts.js';
import type { TaxProvision } from './tax.js';

/** Tipo de vínculo empregatício. */
export type EmploymentType = 'clt' | 'pj' | 'estagio' | 'aprendiz' | 'autonomo';

/** Status do colaborador. */
export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';

/** Colaborador (âncora em PROFILE). */
export interface Employee {
  profileId: ULID;
  /** Matrícula interna. */
  employeeCode: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  /** Data de admissão (epoch ms). */
  hireDate: number;
  /** Data de desligamento (se aplicável). */
  terminationDate?: number;
  /** Salário base mensal. */
  baseSalary: number;
  /** Jurisdição trabalhista. */
  jurisdiction: string;
}

/** Tipo de evento de trabalho. */
export type WorkEventType =
  | 'admission'
  | 'timecard'       // ponto
  | 'overtime'       // hora extra
  | 'leave'          // afastamento/férias
  | 'vacation'       // férias
  | 'termination'    // desligamento
  | 'bonus'          // bônus/PLR
  | 'deduction';     // desconto (VT, VR, etc.)

/** Evento de trabalho (CONTENT). */
export interface WorkEvent {
  id: ULID;
  employeeProfileId: ULID;
  type: WorkEventType;
  /** Data do evento (epoch ms). */
  eventDate: number;
  /** Competência de folha associada. */
  competence: number;
  /** Dados específicos do evento. */
  payload: Record<string, unknown>;
  createdAt: number;
}

/** Rubrica da folha de pagamento. */
export interface PayrollItem {
  employeeProfileId: ULID;
  /** Código da rubrica (ex: '001' = salário base, '002' = horas extras, '050' = INSS). */
  rubricCode: string;
  description: string;
  /** Tipo: provento (+) ou desconto (-). */
  nature: 'earning' | 'deduction';
  amount: number;
  /** Referência ao evento de trabalho que originou. */
  sourceEventId?: ULID;
}

/** Encargo trabalhista/previdenciário. */
export interface LaborCharge {
  id: string;
  name: string; // "INSS", "FGTS", "IRRF", "INSS_empregador"
  jurisdiction: string;
  /** Se é ônus do empregado (desconta) ou empregador (provisiona). */
  borneBy: 'employee' | 'employer';
  /** Alíquota ou fórmula. */
  rate: number;
  /** Base de cálculo. */
  base: 'gross_salary' | 'overtime' | 'bonus' | 'total_earnings';
  /** Vigência (epoch ms). */
  effectiveFrom: number;
}

/** Folha de pagamento apurada para uma competência. */
export interface PayrollResult {
  competence: number;
  jurisdiction: string;
  items: PayrollItem[];
  /** Total de proventos. */
  totalEarnings: number;
  /** Total de descontos. */
  totalDeductions: number;
  /** Líquido. */
  netPay: number;
  /** Provisões geradas (FGTS, INSS empregador). */
  provisions: TaxProvision[];
  /** Lançamentos contábeis gerados. */
  accountingEntries: AccountingEntry[];
}

/** Registra colaborador. */
export async function registerEmployee(
  storage: StoragePort,
  employee: Omit<Employee, 'status'>,
): Promise<Employee>;

/** Registra evento de trabalho. */
export async function recordWorkEvent(
  storage: StoragePort,
  event: Omit<WorkEvent, 'id'>,
): Promise<WorkEvent>;

/** Registra encargo trabalhista jurisdicional. */
export function createLaborCharge(params: Omit<LaborCharge, 'id'>): LaborCharge;

/** Apura folha de pagamento da competência. */
export async function calculatePayroll(
  storage: StoragePort,
  competence: number,
  jurisdiction: string,
): Promise<PayrollResult>;

/** Recalcula folha de competência anterior (retroativo). */
export async function recalculatePayroll(
  storage: StoragePort,
  competence: number,
  jurisdiction: string,
): Promise<PayrollResult>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md](../docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md) §5 — RH e folha, colaborador, eventos de trabalho, folha derivada
- [[folha-derivada]] — apuração da folha como lançamentos derivados dos eventos de trabalho
- [[jurisdicao]] — variante jurisdicional carrega encargos com vigência por competência
- [[lancamento-derivado]] — classificação contábil a partir de fatos econômicos

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §5
- **[READ]** `docs/conceitos/folha-derivada.md` — definição de folha derivada
- **[READ]** `packages/contabil/src/chart-of-accounts.ts` (T-CFR-01) — AccountingEntry
- **[READ]** `packages/contabil/src/tax.ts` (T-CFR-02) — TaxProvision, calculateTaxes
- **[READ]** `tasks/T-JU-01.md` — resolução de jurisdição
- **[CREATE]** `packages/contabil/src/payroll.ts` — funções acima
- **[CREATE]** `packages/contabil/tests/payroll.test.ts`
- **[UPDATE]** `packages/contabil/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/contabil test`.
- [x] **Fora de Escopo:** Integração com eSocial (conector classe C), ponto eletrônico real.

Casos de teste (numerados):
1. `registerEmployee({ code: 'EMP001', type: 'clt', baseSalary: 3000, jurisdiction: 'BR' })` → empregado criado.
2. `recordWorkEvent({ type: 'timecard', employeeId, competence: 2026-06, payload: { hours: 176 } })` → evento registrado.
3. `recordWorkEvent({ type: 'overtime', employeeId, competence: 2026-06, payload: { hours: 10, rate: 1.5 } })` → HE registrada.
4. `createLaborCharge({ name: 'INSS', jurisdiction: 'BR', rate: 0.11, base: 'gross_salary', borneBy: 'employee' })` → encargo criado.
5. `calculatePayroll(2026-06, 'BR')` com 1 empregado CLT, salário 3000, sem HE → proventos=3000, INSS=330 (11%), líquido=2670.
6. `calculatePayroll` com HE (10h a 1.5x) → proventos incluem HE; INSS calculado sobre total.
7. `calculatePayroll` gera provisões patronais (FGTS 8%, INSS empregador 20%).
8. `calculatePayroll` gera lançamentos contábeis (salário → despesa, INSS → obrigação, FGTS → obrigação).
9. `recalculatePayroll(2025-06, 'BR')` usa encargos vigentes em 2025-06, não os atuais.
10. Empregado desligado (`status: 'terminated'`) não aparece na folha de competências posteriores.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** recalcule folha em modo síncrono massivo — recálculos retroativos de competência inteira vão para fila assíncrona (RFC-010). Esta task implementa o cálculo; o despacho assíncrono é separado.
> - **NÃO** modele eventos de trabalho como `ASSET` — a fonte RAG §5.2 diz que são `CONTENT` governado por SPEC.
> - **NÃO** ignore retenção legal — dados de folha sujeitos a obrigação trabalhista/fiscal não são passíveis de expurgo enquanto vigente a retenção.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Encargos por competência**: um empregado admitido em 2025 tem seus encargos calculados com as alíquotas de 2025, mesmo que a folha seja recalculada em 2026. `recalculatePayroll` usa a regra vigente na competência, não na data do recálculo.
- **Múltiplos vínculos**: um `PROFILE` pode ter múltiplos vínculos `ASSET:ROLE` com escopos diferentes. Cada vínculo gera sua própria folha.
- **Base de cálculo composta**: INSS patronal = soma de salários + HE + bônus. FGTS = salário base (sem HE em alguns casos). Cada encargo tem sua própria base.

1. **[TDD]** Crie `packages/contabil/tests/payroll.test.ts` com casos 1–10.
2. Implemente `registerEmployee` e `recordWorkEvent`.
3. Implemente `createLaborCharge` com validação de base de cálculo.
4. Implemente `calculatePayroll` (agrega eventos → rubricas → encargos → provisões → lançamentos).
5. Implemente `recalculatePayroll` (usa encargos vigentes na competência).
6. Re-exporte em `packages/contabil/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-CFR-01 e T-CFR-02 estão `draft`**: `AccountingEntry`, `TaxProvision`, `calculateTaxes` ainda não definidos. Interfaces usadas como referência provisória.
> - **Tabelas de INSS/IRRF**: as alíquotas exatas (faixas progressivas, teto) não são definidas nesta task — isso é conteúdo de SPEC jurisdicional (variante regional). A task implementa o motor que aplica a tabela, não a tabela em si.
> **Status:** `draft` até T-CFR-01 e T-CFR-02 ficarem `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `calculatePayroll` aplica encargos por competência com a regra da época?
- [ ] Provisões patronais geradas separadamente das retenções do empregado?
- [ ] `calculatePayroll` gera lançamentos contábeis (partida dobrada)?
- [ ] `recalculatePayroll` usa encargos da época, não atuais?
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
