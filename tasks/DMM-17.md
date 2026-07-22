---
id: DMM-17
title: "Tool invoke_workflow com orçamento, capacidades e proteção contra ciclos"
status: draft:hardened
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-16", "DMM-15"]
blocks: ["T-CTX-01", "T-COLL-01", "T-UIE-04"]
capacity_target: sonnet
test_profile: backend
---

# DMM-17 · Tool `invoke_workflow` com orçamento, capacidades e proteção contra ciclos

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/DMM-17`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest.
- **Capacidade-alvo:** sonnet (coordenação e políticas de execução cruzada).

## 1. Objetivo
Entregar a Tool canônica `invoke_workflow` registrada via `UniversalToolDescriptor` ([DMM-16](./DMM-16.md)). Ela é o único mecanismo oficial para que um workflow inicie a execução de outro workflow de forma segura (e disponível também a clientes MCP e UI). A Tool propaga o `correlationId`, orçamento e prazo, prevenindo loops infinitos ($A \rightarrow A$ e $A \rightarrow B \rightarrow A$) e ampliação indevida de autoridade.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §3.
- [DMM-16](./DMM-16.md) — Descriptor universal `UniversalToolDescriptor` em `packages/core/src/toolContract.ts`.
- [DMM-15](./DMM-15.md) — Estado durável e runner (`packages/core/src/sqliteStorage.ts`).
- [ADR 0016](../docs/adr/0016-ui-engines-e-flow-grid.md) — Repetição sem back-edge e com orçamento.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/toolContract.ts` *(derivado de DMM-16 §3)*.
- **[READ]** `packages/plugin-workflows/src/workflow-composer.ts` *(derivado de EST-24b §3)*.
- **[CREATE]** `packages/plugin-workflows/src/tools/invokeWorkflowTool.ts` — implementação registrada da Tool `invoke_workflow`.
- **[UPDATE]** `packages/plugin-workflows/src/index.ts` — exportar a Tool `invokeWorkflowTool`.
- **[CREATE]** `packages/plugin-workflows/test/invokeWorkflowTool.test.ts` — testes de propagação de orçamento, capacidades e prevenção de ciclo.

### Contrato TS Derivado (packages/plugin-workflows/src/tools/invokeWorkflowTool.ts)
```typescript
import { z } from 'zod';
import { UniversalToolDescriptor } from '@plataforma/core';

export const InvokeWorkflowInputSchema = z.object({
  workflowId: z.string(),
  inputData: z.record(z.unknown()),
  maxDepth: z.number().int().positive().default(5),
  timeoutMs: z.number().int().positive().optional(),
});

export const InvokeWorkflowOutputSchema = z.object({
  executionId: z.string(),
  status: z.enum(['completed', 'failed', 'timed_out', 'rejected']),
  result: z.record(z.unknown()).optional(),
  trace: z.array(z.string()),
});

export type InvokeWorkflowInput = z.infer<typeof InvokeWorkflowInputSchema>;
export type InvokeWorkflowOutput = z.infer<typeof InvokeWorkflowOutputSchema>;
```

## 4. Estratégia de Testes Estrita
Enumeração dos 6 casos de teste obrigatórios em `packages/plugin-workflows/test/invokeWorkflowTool.test.ts`:

1. **Propagação de Contexto:** O workflow filho recebe o mesmo `correlationId` do pai e um `deadlineMs` menor ou igual ao prazo restante do pai.
2. **Restrição de Capabilidades:** O filho é recusado se tentar executar ações cujas `capabilities` exigidas não estejam presentes nas capacidades do pai.
3. **Validação de Payload:** Parâmetros incompatíveis com o schema de entrada do workflow filho são rejeitados antes do início da execução.
4. **Detecção Anti-Ciclo:** Invocações diretas ($A \rightarrow A$) e indiretas ($A \rightarrow B \rightarrow A$) são abortadas e geram trace de auditoria claro.
5. **Esgotamento de Orçamento/Profundidade:** Quando `maxDepth` chega a 0 ou o `timeoutMs` é atingido, o sub-workflow é finalizado com status `rejected`.
6. **Idempotência de Run:** Repetir a invocação com a mesma chave de idempotência reaproveita a execução anterior sem re-executar nós com efeitos colaterais.

## 5. Não fazer
- NÃO adicionar campo `workflowRef` ao schema Zen/FlowGrid (não criar back-edges no grafo visual).
- NÃO permitir que a UI ou MCP chamem sub-workflows ignorando a verificação de ciclo/orçamento.

## 6. Feedback de Especificação
- Decisão arquitetural 100% resolvida pelas ADRs 0016, 0019 e DMM-16.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/plugin-workflows --profile backend
```
*(Executa `pnpm --filter @plataforma/plugin-workflows build`, `test` e `lint`, colando evidências na Seção 8).*

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada a Tool invoke_workflow; depende do descriptor universal de DMM-16.
- **[2026-07-22T14:31]** - *gemini-3.6-flash* - `[Hardened]`: Spec endurecida com Zod schemas, contrato TS de sub-workflow e 6 casos de teste.

- **[2026-07-22T17:31]** - *Antigravity* - `[Endurecido]`: endureceu spec DMM-17 com Zod schemas e contratos TS
