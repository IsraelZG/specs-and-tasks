---
id: EST-04b
title: "Migração — corpus completo (~200 tasks), casos-limite, stress-test de formato"
status: review
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-04a"]
blocks: []
capacity_target: haiku
---

# EST-04b · Corpus completo + stress-test

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. Roda contra o `tasks/` real do Docs (via worktree do superapp).
- **Fonte:** RFC-018 §2 B2 — migrar tudo, estressar o parser (EST-04a).

## 1. Objetivo
Rodar o parser (EST-04a) contra **todas as ~200 tasks** do `tasks/*.md` no corpus real do Docs.
Documentar tasks que falharam, que produziram warnings, e que precisaram de fallback manual.
O relatório gerado é o entregável — não é preciso migrar o banco de verdade ainda (dry-run é
suficiente; a migração efetiva será trigger manual após validação).

### Contratos
```ts
// --- packages/plugin-tasks/scripts/migrate/runner.ts
import type { ParsedTask } from "./parser";

export interface MigrationReport {
  total: number;
  succeeded: number;
  warnings: number;
  failed: Array<{ file: string; error: string }>;
  byStatus: Record<string, number>;  // contagem de tasks por status
}

export function runMigration(dryRun?: boolean): Promise<MigrationReport>;
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (B2 — migrar tudo).
- [x] `docs/task-template.md` — formato canônico.
- [x] `EST-04a` — parser que consome.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-tasks/scripts/migrate/runner.ts`
- **[CREATE]** `packages/plugin-tasks/scripts/migrate/report.ts` — formata relatório

## 4. Estratégia de Testes
- [x] **Framework:** vitest, fixtures reais (amostra de 5 tasks).
- [x] **Casos:**
  1. `runMigration({ dryRun: true })` com amostra de 5 tasks → 5 succeeded, 0 failed.
  2. Runner itera sobre glob `tasks/*.md` sem pular arquivo.
  3. Relatório produz contagem `byStatus` coerente.

## 5. Instruções de Execução
1. Implementar runner que varre `tasks/*.md` com glob.
2. Para cada arquivo, chama `parseTaskMd` (EST-04a).
3. Gera relatório ao final. Rodar dry-run primeiro; migração real só após validação.
4. Gate → §8.

## 6. Feedback de Especificação
- **Nenhuma decisão em aberto.** Contrato derivado de EST-04a.
- `capacity_target: haiku` — runner é iteração e relatório.

## 7. Definition of Done (DoD)

### Gate de Evidência
```bash
pnpm --filter @plataforma/plugin-tasks build
pnpm --filter @plataforma/plugin-tasks test
pnpm --filter @plataforma/plugin-tasks migrate -- --dry-run
```

### Checklist
- [ ] Runner processa todas as ~200 tasks sem crash?
- [ ] Relatório com contagem + falhas + byStatus?
- [ ] Dry-run 5/5 succeeded na amostra?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Runner varre 399 tasks reais, 0 falhas, 123 warnings (maioria status `draft` legado)
- Script `migrate` com `npx tsx`, aceita `--dry-run`
- Parser + schema copiados da EST-04a (ainda não mergeada); merge real unifica sem conflito

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
> pnpm --filter @plataforma/plugin-tasks build
$ tsc (OK)

> pnpm --filter @plataforma/plugin-tasks test
$ vitest run
✓ tests/schema.test.ts (5 tests)
✓ tests/stateMachine.test.ts (7 tests)
✓ tests/parser.test.ts (5 tests)
✓ tests/runner.test.ts (3 tests)
Test Files  4 passed (4)  Tests  20 passed (20)

> pnpm --filter @plataforma/plugin-tasks migrate -- --dry-run
Total files: 399  Succeeded: 399  Warnings: 123  Failed: 0
By Status: done:161, draft:triaged:123, ready:60, draft:29, draft:hardened:15,
  draft:decomposed:4, blocked:2, draft:placeholder:2, review:2, in_progress:1
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T13:01]** - *deepseek* - `[Triado]`: triado — corpus + stress-test, capacity=haiku, depende de EST-04a (triaged)
- **[2026-07-06T13:01]** - *deepseek* - `[Endurecido]`: endureceu spec — corpus runner + relatorio, derivado EST-04a, capacity=haiku
- **[2026-07-06T13:01]** - *deepseek* - `[Promovida p/ ready]`: safety-net flip
- **[2026-07-06T14:26]** - *deepseek* - `[Iniciado]`: iniciando migration runner + stress-test
- **[2026-07-06T14:31]** - *deepseek* - `[Finalizado]`: migration runner, 399/399 succeeded, 0 failures, 20/20 testes
