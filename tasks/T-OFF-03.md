---
id: T-OFF-03
title: "planilha first-party (motor de formulas + ZEN) + base como view estruturada/sobre-planilha"
status: draft:triaged
complexity: 5
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-OFF-01", "T-PG-01", "T-604"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# T-OFF-03 · planilha first-party (motor de formulas + ZEN) + base como view estruturada/sobre-planilha

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar planilha first-party com motor de fórmulas real, pontos ZEN, cálculo fora da main thread (worker),
e Base (Airtable-like) como view estruturada sobre a mesma fonte de dados. Fonte: `caderno-3-sdk/27-suite-office.md §3`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/office/src/spreadsheet.ts

export interface CellRef {
  column: string; // "A", "B", ...
  row: number;    // 1-based
}

export interface CellValue {
  raw: string;         // texto digitado (ex.: "=SUM(A1:A10)")
  computed?: number | string | boolean; // valor calculado após fórmula
  formula?: string;    // fórmula em si, se houver
}

export interface SpreadsheetData {
  cells: Map<string, CellValue>; // key = "A1", "B2", etc.
  rowCount: number;
  colCount: number;
}

export interface FormulaEngine {
  /** Avalia todas as fórmulas, resolvendo topologia de dependências. */
  evaluate(grid: SpreadsheetData): SpreadsheetData;
  /** Retorna grafo de dependências: célula → [células que dependem dela]. */
  getDependencyGraph(): Map<string, string[]>;
  /** Registra função customizada (ex.: "IMPOSTO"). */
  registerFunction(name: string, fn: (...args: unknown[]) => unknown): void;
}

export interface SpreadsheetEditor {
  getData(): SpreadsheetData;
  setCell(ref: CellRef, value: string): void;
  getCell(ref: CellRef): CellValue;
  /** Dispara reavaliação de fórmulas (em worker). */
  recalculate(): Promise<void>;
}

// --- packages/office/src/base-view.ts 
---

export type BaseViewKind = "table" | "kanban" | "calendar" | "gallery";

export interface BaseViewProps {
  /** Nós do grafo que alimentam a view (registros = nós sob uma SPEC). */
  records: Array<{ id: string; fields: Record<string, unknown> }>;
  /** Tipo de visualização. */
  viewKind: BaseViewKind;
  /** Colunas visíveis (table) ou agrupamento (kanban). */
  columns?: string[];
}

export interface BaseView {
  /** Muda o tipo de view. */
  setViewKind(kind: BaseViewKind): void;
  /** Filtra registros por condição. */
  filter(predicate: (record: Record<string, unknown>) => boolean): void;
  /** Ordena registros. */
  sort(field: string, direction: "asc" | "desc"): void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/27-suite-office.md](../docs/caderno-3-sdk/27-suite-office.md) §3 — Bases e Planilha (fonte compartilhada)
- [[perfil-de-capacidade]] — Planilha usa perfil `documento` com componente rico de grade

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/27-suite-office.md` §3, §7, §8
- **[READ]** `packages/page-engine/src/capacity-profile.ts` — (T-OFF-01)
- **[CREATE]** `packages/office/src/spreadsheet.tsx` — SpreadsheetEditor React
- **[CREATE]** `packages/office/src/formula-engine.ts` — FormulaEngine + dependency resolver
- **[CREATE]** `packages/office/src/formula-worker.ts` — Web Worker para cálculo fora da main thread
- **[CREATE]** `packages/office/src/base-view.tsx` — BaseView (table/kanban/calendar/gallery)
- **[CREATE]** `packages/office/tests/formula-engine.test.ts` — testes unitários
- **[CREATE]** `packages/office/e2e/spreadsheet.spec.ts` — Playwright
- **[UPDATE]** `packages/office/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest para fórmula engine; RTL para componentes; Playwright para E2E.
- [x] **Ambiente do Teste:** Node puro para fórmulas; JSDOM para SpreadsheetEditor; Chromium para E2E.
- [x] **Fora de Escopo:** Integração real com Zen (T-604) — stubs bastam. Automerge (T-403). Export PDF (T-OFF-04).

Casos de teste (numerados):
1. `FormulaEngine.evaluate()` calcula `=1+2` → 3.
2. `=SUM(A1:A3)` com A1=10, A2=20, A3=30 → 60.
3. Referência circular `A1=B1, B1=A1` → detectada e rejeitada com erro.
4. Dependência N:M: alterar A1 recalcula todas as células que dependem dela (cascata topológica).
5. Função customizada: `registerFunction("DOBRO", x => x*2)` → `=DOBRO(5)` → 10.
6. Worker: `recalculate()` não bloqueia a main thread (teste de timeout).
7. `BaseView` renderiza registros em table, troca para kanban, filtra e ordena.
8. Playwright: usuário digita fórmula, célula recalcula, dependentes atualizam.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** calcule fórmulas na main thread — use Web Worker para não bloquear UI/Automerge/ZEN (§3.4).
> - **NÃO** crie dois silos de dados para planilha e base — a base pode ser uma view sobre a planilha (§3.3: "duas lentes, não dois silos").
> - **NÃO** implemente ZEN nesta task — pontos ZEN ficam dentro do envelope do componente; o ZEN engine (T-604) é chamado como função externa.

### Pegadinhas conhecidas
- **Topologia de dependências:** antes de avaliar, construa o DAG de precedência (célula → células que referencia). Avalie em ordem topológica. Se houver ciclo, rejeite com erro claro.
- **Worker é assíncrono:** `recalculate()` posta a grade para o worker e retorna Promise. A UI mostra loading state enquanto o worker processa. Para grades pequenas (<100 células), pode avaliar sincronamente (otimização).
- **Planilha e base compartilham FONTE, não implementação:** a `SpreadsheetData` é a fonte comum; `BaseView` lê a mesma estrutura mas exibe como table/kanban. Alterar na planilha reflete na base e vice-versa.

1. **[TDD]** Crie `packages/office/tests/formula-engine.test.ts` com casos 1–5.
2. Implemente `packages/office/src/formula-engine.ts` com parser de fórmulas, DAG, avaliação topológica.
3. Implemente `packages/office/src/formula-worker.ts` com worker que recebe grade e retorna grade avaliada.
4. Implemente `packages/office/src/spreadsheet.tsx` com grid editor + integração com worker.
5. Implemente `packages/office/src/base-view.tsx` com table/kanban/calendar/gallery.
6. Adicione Playwright E2E (caso 8) em `packages/office/e2e/spreadsheet.spec.ts`.
7. Re-exporte em `packages/office/src/index.ts`.
8. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] FormulaEngine resolve topologia de dependências e avalia em ordem correta?
- [ ] Referências circulares detectadas e rejeitadas?
- [ ] Cálculo roda em Web Worker (não bloqueia main thread)?
- [ ] BaseView compartilha fonte com planilha (duas lentes)?
- [ ] BaseView suporta table, kanban, calendar, gallery?
- [ ] `pnpm test` verde? Playwright E2E passa?

### Verificação automática
```bash
pnpm --filter @plataforma/office build
pnpm --filter @plataforma/office test
```

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
