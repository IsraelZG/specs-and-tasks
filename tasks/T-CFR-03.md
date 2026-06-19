---
id: T-CFR-03
title: "persona contador (ASSET:ROLE escopado lendo subgrafo do cliente) + exportacoes formais"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-CFR-01", "T-501", "T-512"]
blocks: ["T-CFR-05"]
---

# T-CFR-03 · persona contador (ASSET:ROLE escopado lendo subgrafo do cliente) + exportacoes formais

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de acesso do contador no pacote `@plataforma/contabil`: definição da persona externa (`PROFILE`) com `ASSET:ROLE` escopado que lê o subgrafo do cliente pela lente contábil/fiscal, sem export manual. Geração de exportações formais (ECD, ECF, SPED Fiscal/Contribuições, balancete, razão) como projeções sob demanda com data de geração e competência registradas. Fechamento de período declara a competência fechada: novos fatos nessa competência exigem reabertura explícita (intent auditável).
*(Fonte: `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §4, §6)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/contabil/src/accountant.ts ---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';
import type { AccountingEntry } from './chart-of-accounts.js';

/** Escopo de acesso do contador. */
export interface AccountantScope {
  /** Contador (PROFILE). */
  accountantProfileId: ULID;
  /** Cliente cujo subgrafo pode ler. */
  clientProfileId: ULID;
  /** Permissões granulares. */
  permissions: AccountantPermission[];
  /** Vigência do acesso (epoch ms). */
  grantedAt: number;
  /** Se revogado. */
  revokedAt?: number;
}

export type AccountantPermission =
  | 'read:chart_of_accounts'
  | 'read:ledger'
  | 'read:tax_calculations'
  | 'read:payroll'
  | 'read:balance_sheet'
  | 'export:ecd'
  | 'export:ecf'
  | 'export:sped'
  | 'close:period'
  | 'reopen:period';

/** Tipo de exportação formal. */
export type ExportType = 'ecd' | 'ecf' | 'sped_fiscal' | 'sped_contributions' | 'balance_sheet' | 'ledger';

/** Exportação formal gerada. */
export interface FormalExport {
  id: ULID;
  type: ExportType;
  competence: number; // período de referência
  generatedAt: number;
  generatedBy: ULID; // contador
  /** Dados da exportação (projeção materializada). */
  payload: Record<string, unknown>;
  /** Se foi transmitida oficialmente. */
  transmitted: boolean;
  transmittedAt?: number;
}

/** Período contábil. */
export interface AccountingPeriod {
  competence: number; // primeiro dia do período (epoch ms)
  status: 'open' | 'closed';
  closedAt?: number;
  closedBy?: ULID;
  reopenedAt?: number;
  reopenedBy?: ULID;
  reopenReason?: string;
}

/** Concede acesso de contador a cliente. */
export async function grantAccountantAccess(
  storage: StoragePort,
  params: {
    accountantProfileId: ULID;
    clientProfileId: ULID;
    permissions: AccountantPermission[];
  },
): Promise<AccountantScope>;

/** Revoga acesso de contador. */
export async function revokeAccountantAccess(
  storage: StoragePort,
  scopeId: ULID,
): Promise<AccountantScope>;

/** Verifica se contador tem permissão para ação em cliente. */
export async function checkAccountantPermission(
  storage: StoragePort,
  accountantProfileId: ULID,
  clientProfileId: ULID,
  permission: AccountantPermission,
): Promise<boolean>;

/** Gera exportação formal. */
export async function generateExport(
  storage: StoragePort,
  params: {
    type: ExportType;
    competence: number;
    generatedBy: ULID;
  },
): Promise<FormalExport>;

/** Fecha período contábil. */
export async function closePeriod(
  storage: StoragePort,
  competence: number,
  closedBy: ULID,
): Promise<AccountingPeriod>;

/** Reabre período contábil. */
export async function reopenPeriod(
  storage: StoragePort,
  competence: number,
  reopenedBy: ULID,
  reason: string,
): Promise<AccountingPeriod>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md](../docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md) §4 — preparação para contabilidade do cliente, exportações formais, fechamento
- [[acesso-contador]] — perfil de papel externo com ASSET:ROLE escopado lendo subgrafo
- [[asset-lock]] — ROLE como conceito de permissão O(1) revogável

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §4, §6
- **[READ]** `docs/conceitos/acesso-contador.md` — definição de acesso do contador
- **[READ]** `tasks/T-501.md` — motor de UCAN Core (base para verificação de permissão)
- **[READ]** `tasks/T-512.md` — bancada Auth (frontend, escopo de role)
- **[CREATE]** `packages/contabil/src/accountant.ts` — funções acima
- **[CREATE]** `packages/contabil/tests/accountant.test.ts`
- **[UPDATE]** `packages/contabil/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/contabil test`.
- [x] **Fora de Escopo:** Integração real com UCAN, interface de login do contador (frontend).

Casos de teste (numerados):
1. `grantAccountantAccess(contador, cliente, ['read:ledger', 'export:sped'])` → scope criado.
2. `checkAccountantPermission(contador, cliente, 'read:ledger')` → `true`.
3. `checkAccountantPermission(contador, cliente, 'close:period')` → `false` (não incluído no scope).
4. `revokeAccountantAccess` → `checkAccountantPermission` passa a retornar `false`.
5. `generateExport('sped_fiscal', 2026-06, contador)` → export gerada com payload de projeção.
6. `generateExport` sem permissão → erro de acesso negado.
7. `closePeriod(2026-06)` → `status: 'closed'`, registra `closedBy` e `closedAt`.
8. Inserir fato com `factDate` em período fechado → erro (exige reabertura).
9. `reopenPeriod(2026-06, contador, 'correção de provisão')` → `status: 'open'`, registra histórico.
10. Histórico de fechamentos/reaberturas é append-only auditável.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie login/senha para contador — a autenticação é via UCAN (T-501) e o escopo é ROLE no grafo.
> - **NÃO** permita que contador acesse dados além do `clientProfileId` no seu scope.
> - **NÃO** implemente transmissão oficial de exportações (conector classe C) — apenas gere a projeção.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Permissão O(1)**: a verificação de permissão do contador deve ser O(1) — não iterar todos os scopes. O `accountantProfileId + clientProfileId` é chave composta.
- **Fechamento não é imutável**: período fechado pode ser reaberto com intent explícito. O histórico de reaberturas é append-only (linhagem). Não confundir "fechado" com "imutável".
- **Exportações são projeções, não extrações**: `generateExport` deve consultar a linhagem e projetar, não copiar dados para um arquivo paralelo que fica desatualizado.

1. **[TDD]** Crie `packages/contabil/tests/accountant.test.ts` com casos 1–10.
2. Implemente `grantAccountantAccess` e `revokeAccountantAccess`.
3. Implemente `checkAccountantPermission` (O(1) por chave composta).
4. Implemente `generateExport` como projeção (usa `buildLedger` de T-CFR-01).
5. Implemente `closePeriod` e `reopenPeriod` com histórico auditável.
6. Re-exporte em `packages/contabil/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-501 (UCAN) e T-512 (Auth) estão `draft`**: a verificação de permissão real depende do motor UCAN. Esta task usa uma camada de permissão local (stub) que será substituída quando T-501 e T-512 estiverem prontos.
> - **Escopo exato de permissões**: a lista `AccountantPermission` acima é derivada da fonte RAG §4. Confirmar se há outras permissões necessárias (ex: `read:inventory`?).
> **Status:** `draft` até T-501 e T-512 ficarem `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `checkAccountantPermission` verifica escopo granular (não binário)?
- [ ] Acesso revogado é imediatamente refletido?
- [ ] `generateExport` é projeção, não extrato estático?
- [ ] `closePeriod`/`reopenPeriod` mantém histórico auditável?
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
