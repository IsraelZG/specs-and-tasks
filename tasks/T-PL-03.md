---
id: T-PL-03
title: "sandbox node (processo/isolate, capacidades por ASSET:ROLE)"
status: draft:triaged
complexity: 5
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PL-01"]
blocks: ["T-PL-06"]
capacity_target: sonnet
---

# T-PL-03 · sandbox node (processo/isolate, capacidades por ASSET:ROLE)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o sandbox para plugins tipo `node`: execução em processo filho (child_process) ou isolate (Worker thread), com capacidades escopadas por `ASSET:ROLE` da persona do plugin. Acesso a grafo, rede e FS só pelas portas concedidas. Entrada e saída pelo contrato — o plugin não enxerga o grafo além do que a capacidade pede.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6.1 (node plugin: processo/isolate, capacidades por ASSET:ROLE), §6.2 (entrada/saída só pelo contrato)
- Enriquecimento: [[plugin]] — tipo `node`; [[capacidade-de-runtime]] — runtime node

### Contratos TS (derivados do RAG §6)

```ts
// --- packages/plugins/src/sandbox-node.ts 
---
import type { PluginManifest, PluginCapability } from './schema';

/** Capacidades concedidas ao sandbox node. */
export interface NodeSandboxCapabilities {
  /** Acesso ao grafo: entity_ids e operações permitidas. */
  graph: {
    read_entity_ids: string[];
    write_entity_ids: string[];
  };
  /** Portas de rede concedidas (host:port). Vazio = sem rede. */
  network: string[];
  /** Caminhos de FS acessíveis (leitura/escrita). Vazio = sem FS. */
  filesystem: {
    read: string[];
    write: string[];
  };
  /** Orçamento de recursos. */
  limits: {
    cpuMs: number;
    ramMb: number;
    /** Timeout máximo de execução em ms. */
    timeoutMs: number;
  };
}

export interface NodeSandboxInvocation {
  /** ID da capacidade a invocar. */
  capability_id: string;
  /** Schema de entrada conforme declarado na capacidade. */
  input: unknown;
}

export interface NodeSandboxResult {
  /** Schema de saída conforme declarado na capacidade. */
  output: unknown;
  /** Se o orçamento foi exaurido. */
  budget_exhausted: boolean;
  error?: string;
}

export interface NodeSandbox {
  /**
   * Inicializa o sandbox para o plugin node.
   * Pode criar um child_process ou worker thread.
   */
  initialize(
    manifest: PluginManifest,
    bundlePath: string,
    capabilities: NodeSandboxCapabilities
  ): Promise<void>;

  /**
   * Invoca uma capacidade do plugin com o input do contrato.
   * Retorna o output ou erro. Timeout via `capabilities.limits.timeoutMs`.
   */
  invoke(invocation: NodeSandboxInvocation): Promise<NodeSandboxResult>;

  /** Termina o sandbox (SIGTERM → SIGKILL após timeout). */
  shutdown(): Promise<void>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/12-plugins-e-computacao.md](../docs/caderno-3-sdk/12-plugins-e-computacao.md) §6.1 (node plugin: processo/isolate, capacidades por ASSET:ROLE), §6.2 (entrada/saída pelo contrato), §6.3 (classe de privacidade × site)
- [docs/conceitos/plugin.md](../docs/conceitos/plugin.md)
- [docs/conceitos/capacidade-de-runtime.md](../docs/conceitos/capacidade-de-runtime.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugins/src/schema.ts` (T-PL-01)
- **[READ]** `packages/plugins/src/loader.ts` (T-PL-01)
- **[READ]** `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6
- **[CREATE]** `packages/plugins/src/sandbox-node.ts` — NodeSandbox, NodeSandboxCapabilities
- **[CREATE]** `packages/plugins/tests/sandbox-node.test.ts`
- **[UPDATE]** `packages/plugins/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro
- [x] **Fora de Escopo:** Sandbox real com child_process (testes usam mock/in-process), ComputePort (T-PL-04)

Casos de teste (numerados):
1. Inicializa sandbox com capacidades mínimas → `initialize()` resolve sem erro.
2. Invoca capacidade com input válido → `NodeSandboxResult` com `output`.
3. Invoca capacidade com input que não casa com `input_schema` → erro.
4. Capacidade não declarada no manifesto → erro ao invocar.
5. Timeout de execução → `NodeSandboxResult` com `budget_exhausted: true`.
6. Acesso a grafo: entidade em `read_entity_ids` → permitido.
7. Acesso a grafo: entidade fora de `read_entity_ids` → bloqueado.
8. Rede: porta em `network` → permitido.
9. Rede: porta fora de `network` → bloqueado.
10. FS: caminho em `filesystem.read` → permitido.
11. FS: caminho fora de `filesystem.write` → bloqueado.
12. `shutdown()` → sandbox terminado, `invoke()` subsequente rejeitado.
13. Plugin que excede `ramMb` → erro de recurso.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente child_process real nos testes — use mock que valida as restrições.
> - NÃO implemente o grafo real — use stub que verifica entity_ids.
> - NÃO implemente sandbox browser (T-PL-02).

### Pegadinhas conhecidas
- O sandbox node usa `ASSET:ROLE` para escopar acesso — o plugin recebe uma persona com papel limitado.
- `input_schema` e `output_schema` são validados contra o manifesto da capacidade (T-PL-01).
- Orçamento `cpuMs` e `timeoutMs` são distintos: cpuMs é tempo de CPU, timeoutMs é wall-clock.
- `shutdown()` deve ser graceful (SIGTERM, aguardar, SIGKILL).

1. **[TDD]** Crie `packages/plugins/tests/sandbox-node.test.ts` com os 13 casos (RED).
2. Implemente `packages/plugins/src/sandbox-node.ts`.
3. Atualize `packages/plugins/src/index.ts`.
4. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6 — OK
- `docs/conceitos/plugin.md` — OK
- `docs/conceitos/capacidade-de-runtime.md` — OK
- `packages/plugins/src/schema.ts` — T-PL-01 (dep)
- `packages/plugins/src/loader.ts` — T-PL-01 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 13 casos de teste passam?
- [ ] Acesso ao grafo é escopado por entity_ids?
- [ ] Rede e FS são restritos às portas/caminhos declarados?
- [ ] `shutdown()` é graceful e bloqueia novas invocações?
- [ ] Capacidade não declarada é rejeitada?

### Verificação automática
```bash
pnpm --filter @plataforma/plugins build
pnpm --filter @plataforma/plugins test
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
