---
id: T-CN-01
title: "interface ExternalConnector + registro + health/quotas no system-peer"
status: ready
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-004"]
blocks: ["T-CN-02"]
---

# T-CN-01 · interface ExternalConnector + registro + health/quotas no system-peer

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir a interface `ExternalConnector` (taxonomia A–E) com contrato comum (`id`, `class`, `capabilities()`, `health()`) e um registro de conectores no system-peer. Esta interface é o ponto de acoplamento entre SPECs de fluxo e sistemas externos.
**Fonte:** `caderno-3-sdk/06-connectors.md §1` — contrato `ExternalConnector`, taxonomia A–E, identidade e roteamento spec-driven. **Conceitos:** [[conector-externo]], [[agente-de-sistema]].

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/connectors/src/external-connector.ts 
---

import type { PeerId, LoggerPort } from '@plataforma/protocol';

/** Identificador estável de conector, referenciável por SPECIFICATION. */
export type ConnectorId = string;

/** Classes da taxonomia (caderno-3-sdk/06 §0). */
export type ConnectorClass = 'A' | 'B' | 'C' | 'D' | 'E';

/** Status de saúde do conector. */
export type ConnectorHealthStatus = 'up' | 'degraded' | 'down';

export interface ConnectorHealth {
  status: ConnectorHealthStatus;
  lastSuccessAt: number | null; // timestamp Unix ms
  message?: string;
}

/** Capacidades: canais suportados, rate limits, quotas. */
export interface ConnectorCapabilities {
  channels: string[];
  rateLimitPerSecond?: number;
  dailyQuota?: number;
  supportsWebhook: boolean;
}

/** Contrato comum de todo conector externo (caderno-3-sdk/06 §1). */
export interface ExternalConnector {
  id: ConnectorId;
  class: ConnectorClass;
  capabilities(): ConnectorCapabilities;
  health(): Promise<ConnectorHealth>;
}

/** Entrada no registro de conectores do system-peer. */
export interface ConnectorEntry {
  connector: ExternalConnector;
  enabled: boolean;
  registeredAt: number;
}

/** Registro de conectores — cria, consulta, lista. */
export interface ConnectorRegistry {
  register(entry: ConnectorEntry): void;
  get(id: ConnectorId): ConnectorEntry | undefined;
  list(): ConnectorEntry[];
  listByClass(cls: ConnectorClass): ConnectorEntry[];
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/06-connectors.md](../docs/caderno-3-sdk/06-connectors.md) — §0 (taxonomia), §1 (contrato comum + identidade), §5 (registro de instâncias)
- [[conector-externo]] — taxonomia completa e dependências
- [[agente-de-sistema]] — persona do conector classes C/D (T-CN-04 complementa)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/protocol/src/ports.ts` — `PeerId`, `LoggerPort` (T-004 ready)
- **[CREATE]** `packages/connectors/src/external-connector.ts` — interfaces acima
- **[CREATE]** `packages/connectors/src/connector-registry.ts` — implementação `ConnectorRegistry` em memória
- **[CREATE]** `packages/connectors/tests/external-connector.test.ts` — stubs + testes de registro
- **[UPDATE]** `packages/connectors/src/index.ts` — re-exportar `external-connector.ts` + `connector-registry.ts`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser).
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/connectors test`).
- [x] **Fora de Escopo:** Implementações reais de conector (SMTP, BaaS), conexão de rede.

Casos de teste (numerados):
1. `class DummyConnector implements ExternalConnector` compila; `id`, `class`, `capabilities()`, `health()` com tipos corretos.
2. `DummyConnector` classe A: `health()` retorna `{ status: 'up', lastSuccessAt: number }`.
3. `DummyConnector` classe C: `health()` retorna `{ status: 'degraded', message: string }`.
4. `ConnectorRegistry.register()` insere entrada; `get(id)` retorna igual; `get('inexistente')` retorna `undefined`.
5. `ConnectorRegistry.list()` retorna todas; `listByClass('C')` filtra corretamente.
6. Registro rejeita `register()` com `id` duplicado (lança erro).
7. Type-check negativo: `capabilities()` retornando `string` falha `tsc --noEmit`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente lógica de rede ou chamada externa. Este pacote é de contratos + registro em memória.
> - **NÃO** importe bibliotecas de side-effect (fs, http, crypto) neste pacote.
> - **NÃO** invente classes além das 5 (A–E) da taxonomia.

### Pegadinhas conhecidas
- `ConnectorClass` é union literal (`'A' | 'B' | 'C' | 'D' | 'E'`), não `string`. TypeScript deixa passar `string` onde espera union — o teste deve validar com tipo explícito.
- `health()` é `async`; stubs de teste devem retornar `Promise.resolve(...)`, não valor cru.
- `lastSuccessAt` é `number | null` — não use `undefined` (confunde JSON serialization).
- O pacote `@plataforma/protocol` é dep de tipo apenas (import type). Não instancie `LoggerPort` — só use no tipo.

1. **[TDD]** Crie `packages/connectors/tests/external-connector.test.ts` com stubs (casos 1–7 da Seção 4).
2. Crie `packages/connectors/src/external-connector.ts` com os tipos e interface `ExternalConnector`.
3. Crie `packages/connectors/src/connector-registry.ts` com `MapConnectorRegistry` (implementação em `Map<string, ConnectorEntry>`).
4. Re-exporte em `packages/connectors/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
*(Nenhuma pendência — contrato derivado integralmente de `caderno-3-sdk/06-connectors.md §1`.*
*Dep T-004 ready com tipos concretos `PeerId`, `LoggerPort`.)*

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/connectors build
pnpm --filter @plataforma/connectors test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] Interface `ExternalConnector` com `id`, `class`, `capabilities()`, `health()` exportada?
- [ ] `ConnectorRegistry` com `register/get/list/listByClass` funcional?
- [ ] Type-check (`tsc --noEmit`) passa sem `any`?
- [ ] Testes cobrem registro, consulta, filtro por classe e rejeição de duplicata?
- [ ] `pnpm --filter @plataforma/connectors build` e `test` verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
- **[2026-07-03T20:03]** - *system* - `[Endurecido]`: Endurecimento em lote (dependencies done/empty)
- **[2026-07-03T20:03]** - *system* - `[Auto-promovida]`: deps todas done
