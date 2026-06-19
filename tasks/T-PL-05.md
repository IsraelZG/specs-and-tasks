---
id: T-PL-05
title: "fila assincrona (task=no, claim por ASSET:LOCK, resultado assinado, idempotencia)"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PL-01", "T-110"]
subtasks: ["T-PL-05a","T-PL-05b"]
blocks: ["T-PL-06"]
---

# T-PL-05 · fila assincrona (task=no, claim por ASSET:LOCK, resultado assinado, idempotencia)

> **DECOMPOSTA** — não executar diretamente. O trabalho está nas subtarefas: T-PL-05a, T-PL-05b

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o modo assíncrono da ComputePort: cada invocação materializa uma task = nó governada por SPEC. Um worker elegível reivindica via `ASSET:LOCK`, com lease renovável (heartbeat). O resultado é publicado como nó assinado pela persona do executor, idempotente por chave de requisição (reentrega → no-op).

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/12-plugins-e-computacao.md` §5.2 (task = nó, claim por ASSET:LOCK, lease com heartbeat, idempotência, resultado assinado)
- Enriquecimento: [[fila-de-computacao]] — definição canônica; [[plugin]] — capacidades compute
- Dep T-110: Key Vault para ASSET:LOCK

### Contratos TS (derivados do RAG §5.2)

```ts
// --- packages/plugins/src/compute-queue.ts ---
import type { PluginManifest, PluginCapability } from './schema';
import type { ComputeRequest, ComputeResponse, ComputeSite } from './compute-port';

export type TaskStatus = 'pending' | 'claimed' | 'executing' | 'completed' | 'failed' | 'expired';

export interface ComputeTask {
  /** entity_id do nó task. */
  task_id: string;
  /** Chave de idempotência (hash da requisição). */
  request_key: string;
  capability_id: string;
  input: unknown;
  /** Restrições de execução. */
  restrictions?: {
    allowed_sites?: ComputeSite[];
    max_privacy_class?: string;
  };
  /** Status atual. */
  status: TaskStatus;
  /** Quem reivindicou (peer_id do worker). */
  claimed_by?: string;
  /** Lease do lock (HLC timestamp de expiração). */
  lease_expires_at?: number;
  /** Heartbeat interval (ms). */
  heartbeat_interval_ms: number;
  /** Resultado quando completed. */
  result?: ComputeResponse;
  /** Assinatura do executor sobre o resultado. */
  result_signature?: string;
  /** Timestamps. */
  created_at: number;
  updated_at: number;
}

export interface TaskClaimResult {
  claimed: boolean;
  task?: ComputeTask;
  /** Se o lock já pertence a outro worker. */
  reason?: 'already_claimed' | 'lease_active' | 'no_task_available';
}

export interface HeartbeatResult {
  ok: boolean;
  /** Se o lease expirou e a task voltou à fila. */
  lease_expired: boolean;
}

export interface ComputeQueue {
  /**
   * Enfileira uma task (modo async).
   * Gera `request_key` determinístico a partir da requisição para idempotência.
   */
  enqueue(request: ComputeRequest, manifest: PluginManifest, capability: PluginCapability): Promise<ComputeTask>;

  /**
   * Worker reivindica a próxima task pendente elegível.
   * Usa ASSET:LOCK com lease renovável (heartbeat).
   */
  claim(worker_id: string, supported_runtimes: string[]): Promise<TaskClaimResult>;

  /**
   * Worker renova o lease do lock.
   * Se expirado, a task volta à fila para re-claim.
   */
  heartbeat(task_id: string, worker_id: string): Promise<HeartbeatResult>;

  /**
   * Worker publica o resultado (assinado pela persona do executor).
   * Idempotente: se request_key já tem resultado → no-op.
   */
  complete(task_id: string, worker_id: string, result: ComputeResponse, signature: string): Promise<ComputeTask>;

  /**
   * Marca task como failed (erro não recuperável).
   */
  fail(task_id: string, worker_id: string, error: string): Promise<ComputeTask>;

  /**
   * Lista tasks pendentes para um worker (filtradas por runtime compatível).
   */
  listPending(worker_runtimes: string[]): Promise<ComputeTask[]>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/12-plugins-e-computacao.md](../docs/caderno-3-sdk/12-plugins-e-computacao.md) §5.2 (task = nó, claim por ASSET:LOCK, heartbeat, idempotência, resultado assinado), §5.3 (unificação de renditions, live, embeddings), §5.4 (determinismo governa verificação)
- [docs/conceitos/fila-de-computacao.md](../docs/conceitos/fila-de-computacao.md) — definição canônica
- [docs/conceitos/plugin.md](../docs/conceitos/plugin.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugins/src/schema.ts` (T-PL-01)
- **[READ]** `packages/plugins/src/compute-port.ts` (T-PL-04)
- **[READ]** `docs/caderno-3-sdk/12-plugins-e-computacao.md` §5
- **[CREATE]** `packages/plugins/src/compute-queue.ts` — ComputeQueue, ComputeTask
- **[CREATE]** `packages/plugins/src/task-idempotency.ts` — gerador de request_key
- **[CREATE]** `packages/plugins/tests/compute-queue.test.ts`
- **[UPDATE]** `packages/plugins/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro (fila em memória — não persiste no grafo real)
- [x] **Fora de Escopo:** Persistência real no grafo, ASSET:LOCK real (T-110)

Casos de teste (numerados):
1. `enqueue()` cria task com `status: 'pending'` e `request_key` preenchido.
2. `enqueue()` com mesma `request_key` → idempotente, retorna task existente (no-op).
3. `claim()` por worker elegível → `claimed: true`, task com `status: 'claimed'` e `claimed_by`.
4. `claim()` sem tasks pendentes → `claimed: false`, reason `no_task_available`.
5. `claim()` em task já claimed com lease ativo → `claimed: false`, reason `lease_active`.
6. `heartbeat()` renova `lease_expires_at` → `ok: true`.
7. `heartbeat()` com lease expirado → `lease_expired: true`, task volta a `pending`.
8. `claim()` após lease expirar → outro worker consegue reivindicar (task volta à fila).
9. `complete()` com worker correto → task `completed`, `result` e `result_signature` preenchidos.
10. `complete()` com worker incorreto (não é `claimed_by`) → erro.
11. `complete()` idempotente: task já `completed` → no-op, retorna task existente.
12. `fail()` marca task como `failed` com mensagem de erro.
13. `listPending()` retorna apenas tasks `pending` ou com lease expirado.
14. Lease com heartbeat: worker renova a cada `heartbeat_interval_ms`; se parar de renovar, task expira e volta à fila.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente persistência real no grafo — use fila em memória.
> - NÃO implemente ASSET:LOCK real (T-110) — use lock simbólico.
> - NÃO implemente assinatura real (T-107) — use string placeholder.

### Pegadinhas conhecidas
- O claim é atômico: entre verificar se a task está `pending` e marcá-la como `claimed`, outro worker não pode pegar a mesma task. Em memória, use lock simples; no grafo real, a serialização por linhagem garante isso.
- `request_key` é determinístico: `hash(capability_id + JSON.stringify(input))`. Mesma requisição → mesma chave.
- O heartbeat é um intervalo curto (governado por SPEC). Se o worker não renovar dentro de N intervalos, o lock é considerado solto.
- Resultado assinado: `result_signature` é a assinatura Ed25519 do worker sobre `task_id + JSON.stringify(result.output)`.

1. **[TDD]** Crie `packages/plugins/tests/compute-queue.test.ts` com os 14 casos (RED).
2. Implemente `packages/plugins/src/compute-queue.ts`.
3. Implemente `packages/plugins/src/task-idempotency.ts`.
4. Atualize `packages/plugins/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §5.2–§5.4 — OK
- `docs/conceitos/fila-de-computacao.md` — OK
- `docs/conceitos/plugin.md` — OK
- `packages/plugins/src/schema.ts` — T-PL-01 (dep)
- `packages/plugins/src/compute-port.ts` — T-PL-04 (dep)
- T-110 (Key Vault) — `draft` no INDEX

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 14 casos de teste passam?
- [ ] Idempotência por `request_key` funciona?
- [ ] Claim é atômico (não tem double-claim)?
- [ ] Heartbeat mantém lease; sem heartbeat, task volta à fila?
- [ ] `complete()` verifica `claimed_by`?
- [ ] Resultado é assinado (campo `result_signature` preenchido)?

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
