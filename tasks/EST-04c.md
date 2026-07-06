---
id: EST-04c
title: "Migração — validação pós-migração: integridade de dados, checksum de conteúdo, zero perda"
status: ready
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-04b"]
blocks: []
capacity_target: haiku
---

# EST-04c · Validação pós-migração

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-tasks/scripts/migrate/validate.*`.
- **Fonte:** RFC-018 §2 B2 — validação que nenhum dado foi perdido.

## 1. Objetivo
Validar que a migração do corpus (EST-04b) não perdeu dados: para cada task migrada, comparar
hash de conteúdo entre o markdown original e a representação reconstituída a partir do schema.
Gerar certificado de integridade: tasks íntegras × tasks com divergência documentada.

### Contratos
```ts
// --- packages/plugin-tasks/scripts/migrate/validate.ts
import type { MigrationReport } from "./runner";

export interface IntegrityCertificate {
  verified: number;
  diverged: Array<{ file: string; field: string; original: string; reconstructed: string }>;
  report: MigrationReport;
}

export function validateIntegrity(report: MigrationReport): Promise<IntegrityCertificate>;
// Para cada task: extrai campos do schema, reconstrói markdown, compara hash SHA-256
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (B2 — migrar tudo, stress-test).
- [x] `EST-04b` — relatório da migração a validar.
- [x] `EST-03a` — schema que reconstrói a representação.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-tasks/scripts/migrate/validate.ts`

## 4. Estratégia de Testes
- [x] **Framework:** vitest.
- [x] **Casos:**
  1. Verificação de task íntegra → hash match, incluído em `verified`.
  2. Verificação de task com campo divergente → listada em `diverged` com detalhes.
  3. Certificado com 100% de tasks íntegras → sem divergências.
  4. Certificado serializado em JSON.

## 5. Instruções de Execução
1. Implementar validador: para cada task migrada, serializa schema de volta a markdown, compara hash.
2. Gerar certificado de integridade.
3. Gate → §8.

## 6. Feedback de Especificação
- **Nenhuma decisão em aberto.** Contrato derivado de EST-04b + EST-03a.
- `capacity_target: haiku` — validação mecânica (hash + diff).

## 7. Definition of Done (DoD)

### Gate de Evidência
```bash
pnpm --filter @plataforma/plugin-tasks build
pnpm --filter @plataforma/plugin-tasks test
pnpm --filter @plataforma/plugin-tasks migrate -- --validate
```

### Checklist
- [ ] Validador compara hash SHA-256 entre original e reconstituído?
- [ ] Certificado de integridade gerado?
- [ ] 4 casos de teste verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T13:01]** - *deepseek* - `[Triado]`: triado — validacao integridade, capacity=haiku, depende de EST-04b (triaged)
- **[2026-07-06T13:01]** - *deepseek* - `[Endurecido]`: endureceu spec — validacao integridade SHA-256, derivado EST-04b, capacity=haiku
- **[2026-07-06T13:01]** - *deepseek* - `[Promovida p/ ready]`: safety-net flip
