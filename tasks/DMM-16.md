---
id: DMM-16
title: "Contrato universal de Tool e adaptadores MCP/Workflow/UI"
status: done
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
- **Arquivos criados/modificados:** `packages/core/src/toolContract.ts` (novo), `packages/core/src/index.ts` (re-exports), `packages/core/tests/toolContract.test.ts` (novo)
- **Evidência do Gate (backend):**
```
pnpm gate @plataforma/core --profile backend
✅ @plataforma/core:build | exit=0
✅ @plataforma/core:test | exit=0  (27 tests: 22 existentes + 5 novos toolContract.test.ts)
✅ @plataforma/core:lint | exit=0
📦 artefato: .gate/daacd425831aef3ed84ee4f83bd347f71d99ec35.json | profile=backend | allGreen=true
```
- **5 casos de teste obrigatórios implementados:**
  1. Invocação multi-superfície (workflow/mcp/ui) retorna mesmo resultado com schema validado ✅
  2. Rejeição por capabilidade ausente + deadline excedido em todas superfícies ✅
  3. Validação Zod recusa entrada inválida antes de execute, sem vazamento de estado ✅
  4. Chamada não-idempotente gera exatamente 1 evento de auditoria no contexto ✅
  5. Anti-fake: adaptador que consulta PluginRegistry rejeita tool não registrada ✅

### Parecer do Agente Revisor:
- [x] Aprovado
- [ ] Requer Refatoração

**Veredicto: APROVADO** · 0 BLOCKER · 0 MAJOR · 0 MINOR · 1 INFO

**Escopo vs diff (master..HEAD = 3 commits, +284/-0):**

| declarado | alterado | disposição |
|---|---|---|
| [READ] `packages/core/src/pluginRegistry.ts` | não | OK — não modificado |
| [READ] `packages/core/src/pluginManifest.ts` | não | OK — não modificado |
| [READ] `packages/plugin-workflows/src/workflow-composer.ts` | não | OK — não modificado |
| [CREATE] `packages/core/src/toolContract.ts` | sim (115 linhas) | OK — interfaces e 3 adaptadores |
| [UPDATE] `packages/core/src/index.ts` | sim (13 linhas) | OK — re-exports adicionados |
| [CREATE] `packages/core/test/toolContract.test.ts` | sim, em `tests/` (156 linhas) | OK — spec diz `test/`, código segue padrão existente do repo (`tests/`) — ver INFO-1 |

**Auditoria de código (Lvl 0):**

- `toolContract.ts:1-115` — `UniversalToolDescriptor<TInput,TOutput>`, `ToolExecutionContext`, `ToolAdapter<TInput,TOutput>` casam com a assinatura TS da §3 (com `z.ZodType` em vez de `z.ZodSchema` — fix correto, `ZodSchema` foi deprecado em zod v4). Os 3 adaptadores (`createWorkflowAdapter`, `createMcpAdapter`, `createUiAdapter`) compartilham um único `makeInvoker`, garantindo que UI/MCP não burlem `toolContract` (regra §5).
- Ordem de checagem em `makeInvoker`: `registry.resolve()` → `impl.tool.id` → `capabilitiesRequired` → `deadlineMs` → `inputSchema.parse()` → `execute()` → `outputSchema.parse()` → audit. Falhas curtas antes do trabalho caro; erros padronizados via `ToolAuthorizationError`.
- `toolContract.ts:82-90` — `auditLog.push` apenas quando `!isIdempotent` e APÓS sucesso. Falha em execute não é auditada (decisão aceitável para v1; alinhada com §4 caso 4 "exatamente 1 evento").
- `pluginRegistry.ts` (DMM-14) — inalterado, em conformidade com §5 "NÃO substituir ou duplicar o PluginRegistry".
- `index.ts:151-163` — apenas re-exports adicionados; nada existente foi tocado.

**Casos de teste (§4 — 5 obrigatórios, todos verificados):**

1. ✅ Multi-superfície (`toolContract.test.ts:54-71`): tool registrada no `PluginRegistry` invocada via `workflow`/`mcp`/`ui` retorna o mesmo `{ result: 10 }` em todas; 3 `auditLog` separados (um por superfície, fresh ctx em mcp/ui), confirmando "sem duplicação por camada" quando cada superfície tem ctx isolado.
2. ✅ Capacidade + deadline (`toolContract.test.ts:73-101`): dois testes — um rejeita `['network']` em ctx `['compute']` com `ToolAuthorizationError` em todas as 3 superfícies; o outro rejeita `deadlineMs: 1` (já ultrapassado) também com `ToolAuthorizationError`.
3. ✅ Zod (`toolContract.test.ts:103-125`): entrada `{ value: 'not-a-number' }` lança erro do `z.object({ value: z.number() })` ANTES de `execute` (verificado com `executeCalled === false`).
4. ✅ Auditoria (`toolContract.test.ts:127-142`): chamada não-idempotente produz exatamente 1 evento em `ctx.auditLog`, com `toolId`, `surface`, `correlationId` corretos.
5. ✅ Anti-fake (`toolContract.test.ts:144-155`): tool NÃO registrada → `registry.resolve()` lança `Error: Plugin "fake-test" não encontrado no registry`, coberto pelo regex `/não encontrado no registry/`. Garante que adaptadores consultam o registry real (não handler stubado).

**Gate re-rodado na worktree atual (`HEAD = a64b9ce`, tree stripped `daacd425...`):**
```
$ pnpm gate @plataforma/core --profile backend
✅ @plataforma/core:build | exit=0 | 2229ms
✅ @plataforma/core:test | exit=0 | 13412ms
✅ @plataforma/core:lint | exit=0 | 11549ms
📦 artefato: .gate/daacd425831aef3ed84ee4f83bd347f71d99ec35.json | profile=backend | allGreen=true
```
Artefato válido: `headSha=a64b9ce24a05804a6be1a8c5c3316c3b0429b927` (HEAD atual), `treeSha=daacd425...` (stripped, sem `.gate/`), `finalHeadSha` = `headSha` (sem rebase após gate), `allGreen=true`. O `treeSha` no JSON é o `strippedTree` (exclui `.gate/`) — convenção do `scripts/gate.mjs:120-128`; bate com a árvore de código real.

**Sondas direcionadas (não reexecutei a suíte inteira; artefato válido cobre):**
- Verifiquei que `makeInvoker` é o ÚNICO caminho dos 3 adaptadores → não há rota paralela que pule o `toolContract` (§5).
- Verifiquei que `pluginRegistry.ts` foi apenas READ — não há shadowing/duplicação do registry (§5).
- Verifiquei que `deadlineMs` é checado **antes** da validação Zod — não desperdiça parse em chamadas fadadas a falhar.
- Verifiquei que o `id !== descriptor.id` em `toolContract.ts:57` é defesa-em-profundidade (a `registry.resolve()` já filtra não-registrados). Não é dead code: protege contra `impl.tool` corrompido.

**Achados:**

- **INFO-1** (cosmético, não-bloqueante): spec §3 declara `packages/core/test/toolContract.test.ts` (singular) mas o código está em `packages/core/tests/toolContract.test.ts` (plural), e o Handover do worker (§8) também reporta `tests/`. O repo `packages/core` já usa `tests/` (plural) — o código segue o padrão existente. Spec tem typo. Ações: nenhuma agora; sugestão é ajustar a spec quando reendurecer tarefas irmãs que referenciem este path.

**Resultado:** APROVADO. Spec §1, §3, §4, §5, §6 e §7 integralmente atendidas. Pode prosseguir para `/integrar-task DMM-16`.

## 9. Log de Execução
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada a fundação de Tool universal; aguarda leitura JIT dos exports do registry.
- **[2026-07-22T14:30]** - *gemini-3.6-flash* - `[Hardened]`: Spec endurecida com contratos TS exatos e re-exports em packages/core.

- **[2026-07-22T17:30]** - *Antigravity* - `[Endurecido]`: endureceu spec DMM-16 com contratos TS exatos
- **[2026-07-22T17:30]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-23T00:41]** - *deepseek* - `[Iniciado]`: Iniciando execução DMM-16
- **[2026-07-23T00:50]** - *deepseek* - `[Finalizado]`: Implementação completa: toolContract.ts + 5 testes, gate verde
- **[2026-07-23T01:01]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando DMM-16
- **[2026-07-23T01:36]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (34a18303ee6b042f74eddd31cdc5e2b01f5cdf7c), worktree liberada, Gate verde (build+test+lint allGreen=true, profile=backend). 1 nao-bloqueante -> ledger de pendencias (INFO-1: spec typo test/ vs tests/).
