---
id: T-PL-05a
title: "Fila assíncrona: claim por ASSET:LOCK + lease com heartbeat"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PL-01", "T-110"]
blocks: ["T-PL-05b"]
parent: "T-PL-05"
---

# T-PL-05a · Fila assíncrona: claim por ASSET:LOCK + lease com heartbeat

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Monorepo:** Turborepo
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o mecanismo de claim + lease no pacote `@plataforma/plugins`: tasks na fila são reivindicadas por workers via `ASSET:LOCK` com lease renovável (heartbeat). Se o heartbeat falha, o lease expira e outro worker pode reivindicar. Tudo sob VirtualClock para testes determinísticos
*(extraído de T-PL-05 §1; `caderno-3-sdk/12-plugins-e-computacao.md` §5.2)*.

### Contratos exatos
```ts
// --- packages/plugins/src/compute-queue.ts 
---
import { StoragePort } from '@plataforma/protocol'; // T-004
import { ULID } from '@plataforma/core'; // T-102

export type TaskStatus = 'pending' | 'claimed' | 'executing' | 'completed' | 'failed' | 'expired';

export interface ComputeTask {
  taskId: ULID;
  specId: ULID;              // SPEC que define a task
  status: TaskStatus;
  claimedBy?: string;         // persona peerId do worker
  leaseExpiresAt?: number;    // timestamp ms
  createdAt: number;
}

export interface ClaimResult {
  task: ComputeTask;
  leaseToken: string;         // token para renovar/devolver
}

/** Worker reivindica task pendente. Adquire ASSET:LOCK com TTL. */
export function claimTask(
  storage: StoragePort,
  workerId: string,
  ttlMs?: number,  // default 30000 (30s)
): Promise<ClaimResult | null>;  // null se fila vazia

/** Worker renova lease (heartbeat). */
export function renewLease(
  storage: StoragePort,
  taskId: ULID,
  leaseToken: string,
): Promise<boolean>;

/** Worker libera task (devolve para fila). */
export function releaseTask(
  storage: StoragePort,
  taskId: ULID,
  leaseToken: string,
): Promise<void>;

/** Verifica leases expirados e retorna tasks para pending. */
export function expireLeases(storage: StoragePort): Promise<number>;
```
- `claimTask`: busca primeira task `pending`, marca `claimed`, registra `ASSET:LOCK` (T-110) com TTL.
- `renewLease`: atualiza `leaseExpiresAt` sem criar novo LOCK.
- `expireLeases`: varre tasks `claimed` com `leaseExpiresAt < now`, retorna para `pending`.

## 2. Contexto RAG
- [caderno-3-sdk/12-plugins-e-computacao.md](../docs/caderno-3-sdk/12-plugins-e-computacao.md) (§5.2)
- [T-PL-01 · SPEC:PLUGIN](./T-PL-01.md)
- [T-110 · KeyVault](./T-110.md)

## 3. Escopo de Arquivos
- **[READ]** `packages/plugins/src/schema.ts` (T-PL-01)
- **[READ]** `packages/core/src/keyVault.ts` (T-110)
- **[CREATE]** `packages/plugins/src/compute-queue.ts`
- **[CREATE]** `packages/plugins/tests/compute-queue.claim.test.ts`

## 4. Estratégia de Testes
- [x] **Framework:** Vitest + VirtualClock (T-003).

Casos de teste:
1. `claimTask` sobre fila com 1 task pending → retorna task, status `claimed`.
2. `claimTask` sobre fila vazia → null.
3. `renewLease` → `leaseExpiresAt` atualizado.
4. `releaseTask` → task volta para `pending`.
5. `expireLeases` com lease expirado (clock.advance) → task volta para `pending`.
6. 2 workers tentam `claimTask` mesma task → apenas um ganha.
7. `renewLease` com token inválido → false.

## 5. Instruções de Execução
1. Escreva testes com VirtualClock.
2. Implemente `claimTask` (SELECT pending + UPDATE + LOCK).
3. Implemente `renewLease`, `releaseTask`, `expireLeases`.
4. Rode build + test.

## 6. Feedback de Especificação
- *(Nenhuma pendência)*

## 7. DoD & Reviewer Checklist

### Gate de Evidência
```bash
pnpm --filter @plataforma/plugins build
pnpm --filter @plataforma/plugins test
```

### Checklist
- [ ] Claim adquire LOCK com TTL?
- [ ] Lease renovável via heartbeat?
- [ ] Lease expirado → task volta para fila?
- [ ] 7 casos de teste passando?
- [ ] `pnpm --filter @plataforma/plugins build` e `test` verdes?

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
