---
id: T-PL-05b
title: "Fila assíncrona: resultado assinado + idempotência"
status: draft:triaged
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PL-05a", "T-107"]
blocks: []
parent: "T-PL-05"
capacity_target: haiku
---

# T-PL-05b · Fila assíncrona: resultado assinado + idempotência

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Monorepo:** Turborepo
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Implementar publicação de resultado + idempotência no pacote `@plataforma/plugins`: worker completa task e publica resultado como nó assinado. Reentrega do mesmo resultado (mesmo `requestKey`) → no-op. Chave de requisição é `blake2s256(taskId || input_hash)`
*(extraído de T-PL-05 §1; `caderno-3-sdk/12-plugins-e-computacao.md` §5.2)*.

### Contratos exatos
```ts
// --- packages/plugins/src/compute-queue.ts (extensão) 
---
import { SignedNode } from '@plataforma/core'; // T-107

export interface TaskResult {
  taskId: ULID;
  status: 'completed' | 'failed';
  output?: unknown;
  error?: string;
  resultNode?: SignedNode;   // nó assinado publicado no grafo
}

/** Publica resultado da task. Idempotente por requestKey. */
export function publishResult(
  storage: StoragePort,
  taskId: ULID,
  leaseToken: string,
  result: Omit<TaskResult, 'resultNode'>,
  authorKey: Ed25519PrivateKey,
): Promise<TaskResult>;

/** Gera requestKey para idempotência. */
export function computeRequestKey(taskId: ULID, input: unknown): string;

/** Verifica se task já foi completada (idempotência check). */
export function isTaskCompleted(storage: StoragePort, taskId: ULID): Promise<TaskResult | null>;
```
- `publishResult`: valida `leaseToken`, cria `SignedNode` com `output`/`error`, marca task como `completed | failed`.
- Idempotência: se `isTaskCompleted` retorna resultado existente, `publishResult` retorna o mesmo (no-op).
- `requestKey = blake2s256(taskId || canonicalize(input))` — mesmo input + mesma task → mesma chave.

## 2. Contexto RAG
- [caderno-3-sdk/12-plugins-e-computacao.md](../docs/caderno-3-sdk/12-plugins-e-computacao.md) (§5.2)
- [T-PL-05a · Claim/Lease](./T-PL-05a.md)
- [T-107 · Assinatura](./T-107.md)

## 3. Escopo de Arquivos
- **[READ]** `packages/plugins/src/compute-queue.ts` (T-PL-05a)
- **[READ]** `packages/core/src/signature.ts` (T-107)
- **[CREATE]** `packages/plugins/tests/compute-queue.result.test.ts`
- **[UPDATE]** `packages/plugins/src/compute-queue.ts`

## 4. Estratégia de Testes
- [x] **Framework:** Vitest (Node puro).

Casos de teste:
1. `publishResult` → task status `completed`, `resultNode` existe no grafo.
2. `publishResult` 2× com mesmo input → resultado idêntico (idempotente).
3. `isTaskCompleted` retorna resultado após publish.
4. `publishResult` com `leaseToken` inválido → rejeitado.
5. `computeRequestKey` determinístico: mesmo input → mesma chave.

## 5. Instruções de Execução
1. Escreva testes com tasks claimed via T-PL-05a.
2. Implemente `publishResult` (assina nó + atualiza status).
3. Implemente `computeRequestKey`, `isTaskCompleted`.
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
- [ ] Resultado assinado publicado como SignedNode?
- [ ] Idempotente (mesmo input → mesmo resultado)?
- [ ] LeaseToken inválido → rejeitado?
- [ ] 5 casos de teste passando?
- [ ] `pnpm --filter @plataforma/plugins build` e `test` verdes?

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
