---
id: DMM-16
title: "Contrato universal de Tool e adaptadores MCP/Workflow/UI"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-14", "DMM-15", "EST-24b"]
blocks: ["DMM-17", "T-CTX-01", "T-COLL-01"]
capacity_target: sonnet
test_profile: backend
---

# DMM-16 · Contrato universal de Tool e adaptadores MCP/Workflow/UI

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/DMM-16`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest.
- **Capacidade-alvo:** sonnet (fully-specified com coordenação multi-superfície).

## 1. Objetivo
Implementar o metadado e contrato único `UniversalToolDescriptor<TInput, TOutput>` e a porta de resolução de adaptadores no core do superapp (`packages/core`), permitindo invocar a mesma capacidade por Workflow DMM, cliente/servidor MCP e ações de UI sem duplicar regra de Zod schema, capacidades, timeout, idempotência ou auditoria.

O `PluginRegistry` entregue por [DMM-14](./DMM-14.md) (`packages/core/src/pluginRegistry.ts`) é o ponto único de registro e resolução.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §§2–3 — Tool universal e composição por Tool.
- [DMM-14](./DMM-14.md) — `PluginRegistry` (`register`, `resolve`) em `packages/core/src/pluginRegistry.ts`.
- [DMM-15](./DMM-15.md) — Fila e estado durável de execuções (`packages/core/src/sqliteStorage.ts`).
- [EST-24b](./EST-24b.md) — Composição e runner de workflow (`packages/plugin-workflows/src/workflow-composer.ts`).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/pluginRegistry.ts` *(derivado de DMM-14 §3)*.
- **[READ]** `packages/core/src/pluginManifest.ts` *(derivado de DMM-14 §6)*.
- **[READ]** `packages/plugin-workflows/src/workflow-composer.ts` *(derivado de EST-24b §3)*.
- **[CREATE]** `packages/core/src/toolContract.ts` — definições de `UniversalToolDescriptor<TInput, TOutput>`, `ToolExecutionContext` e `ToolAdapter<TInput, TOutput>`.
- **[UPDATE]** `packages/core/src/index.ts` — re-exportar os contratos universais de Tool.
- **[CREATE]** `packages/core/test/toolContract.test.ts` — suíte de testes de integração dos 3 adaptadores (Workflow, MCP e UI) contra uma Tool fake determinística.

### Assinaturas TS Derivadas (packages/core/src/toolContract.ts)
```typescript
import { z } from 'zod';

export interface ToolExecutionContext {
  correlationId: string;
  callerId: string;
  capabilities: string[];
  deadlineMs?: number;
}

export interface UniversalToolDescriptor<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  description: string;
  capabilitiesRequired: string[];
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  timeoutMs?: number;
  isIdempotent?: boolean;
  execute: (input: TInput, ctx: ToolExecutionContext) => Promise<TOutput>;
}

export interface ToolAdapter<TInput = unknown, TOutput = unknown> {
  surface: 'workflow' | 'mcp' | 'ui';
  invoke: (descriptor: UniversalToolDescriptor<TInput, TOutput>, rawInput: unknown, ctx: ToolExecutionContext) => Promise<TOutput>;
}
```

## 4. Estratégia de Testes Estrita
Enumeração dos 5 casos de teste obrigatórios em `packages/core/test/toolContract.test.ts`:

1. **Invocação Multi-Superfície:** Uma Tool determinística registrada no `PluginRegistry` é invocada via adaptador `workflow`, `mcp` e `ui`, retornando o mesmo resultado com schema validado.
2. **Rejeição por Capabilidade / Deadline:** Tentar invocar uma Tool sem as `capabilitiesRequired` no `ToolExecutionContext` lança erro de autorização padronizado em todas as superfícies.
3. **Validação de Schema Zod:** Entradas fora do `inputSchema` são recusadas pelo adaptador antes de atingir a função `execute`, sem vazamento de estado.
4. **Auditoria e Efeitos Únicos:** Uma chamada com `isIdempotent: false` gera exatamente 1 evento no log de auditoria do contexto, sem duplicação por camada.
5. **Anti-Fake (Registry Real):** O teste falha obrigatoriamente se os adaptadores tentarem executar um handler stubado sem consulta prévia ao `PluginRegistry`.

## 5. Não fazer
- NÃO substituir ou duplicar o `PluginRegistry` de DMM-14.
- NÃO permitir que a UI ou MCP chamem os executores diretamente ignorando o `toolContract`.
- NÃO criar sidecars HTTP/REST locais para capacidades que rodam in-process no Node.js.

## 6. Feedback de Especificação
- Decisão arquitetural totalmente fechada pela ADR 0019 §§2-3 e DMM-14.
- Tipos e contratos alinhados com a topologia do `packages/core`.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/core --profile backend
```
*(Executa `pnpm --filter @plataforma/core build`, `test` e `lint`, colando evidências na Seção 8).*

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada a fundação de Tool universal; aguarda leitura JIT dos exports do registry.
- **[2026-07-22T14:30]** - *gemini-3.6-flash* - `[Hardened]`: Spec endurecida com contratos TS exatos e re-exports em packages/core.

- **[2026-07-22T17:30]** - *Antigravity* - `[Endurecido]`: endureceu spec DMM-16 com contratos TS exatos
- **[2026-07-22T17:30]** - *system* - `[Auto-promovida]`: deps todas done
