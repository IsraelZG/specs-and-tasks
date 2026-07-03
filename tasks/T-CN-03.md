---
id: T-CN-03
title: "esqueleto Classe D (cursor, polling/webhook, supressao de eco) com provedor fake"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-CN-01", "T-CN-02", "T-201"]
blocks: []
---

# T-CN-03 · esqueleto Classe D (cursor, polling/webhook, supressao de eco) com provedor fake

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o esqueleto de conector Classe D (Espelho Bidirecional) com os invariantes D1–D6: cursor durável (UIDVALIDITY/UIDNEXT), ingresso por polling + webhook, egresso como intent, supressão de eco (header `X-Plataforma-Ref`), conflito delegado à SPEC do domínio, e mutação por `SUPERSEDED_BY`. Usar provedor fake no testkit para testes determinísticos.
**Fonte:** `caderno-3-sdk/06-connectors.md §3` — invariantes D1–D6. **Conceitos:** [[conector-espelho]], [[conector-externo]].

### Contratos exatos

```ts
// --- packages/connectors/src/mirror-connector.ts 
---

import type { ExternalConnector, ConnectorId, ConnectorHealth } from './external-connector';
import type { ExternalRef, TranslationPipeline } from './translation-pipeline';

/** Estado do cursor durável (D1). */
export interface MirrorCursor {
  /** Checkpoint do provedor (UIDVALIDITY/UIDNEXT, updated_since). */
  checkpoint: string;
  updatedAt: number;
}

/** Evento de ingresso (polling ou webhook). */
export interface MirrorIngressEvent {
  externalRef: ExternalRef;
  payload: unknown;
  receivedAt: number;
  source: 'polling' | 'webhook';
}

/** Resultado de egresso como intent (D3). */
export interface MirrorEgressResult {
  success: boolean;
  externalRef?: ExternalRef;
  /** Marcador de origem para supressão de eco (D4). */
  originMarker: string; // header X-Plataforma-Ref
}

/** Conector Classe D — espelho bidirecional. */
export interface MirrorConnector extends ExternalConnector {
  class: 'D';

  /** D1: Persiste e recupera cursor durável. */
  getCursor(): Promise<MirrorCursor | null>;
  saveCursor(cursor: MirrorCursor): Promise<void>;

  /** D2: Polling (piso garantido) + registro de webhook. */
  poll(): Promise<MirrorIngressEvent[]>;
  registerWebhook(url: string): Promise<void>;

  /** D3: Egresso como intent — executa ação externa. */
  egress(externalRef: ExternalRef, action: string, payload: unknown): Promise<MirrorEgressResult>;

  /** D4: Verifica se ingresso é eco de egresso próprio. */
  isEcho(externalRef: ExternalRef): boolean;
}

/** Provedor fake para testes determinísticos. */
export interface FakeMirrorProvider {
  /** Eventos pendentes para polling. */
  pendingEvents: MirrorIngressEvent[];
  /** Cursor simulado. */
  cursor: MirrorCursor | null;
  /** Registro de egressos para verificação de eco. */
  egressLog: Map<ExternalRef, MirrorEgressResult>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/06-connectors.md](../docs/caderno-3-sdk/06-connectors.md) — §3 (D1–D6: cursor, polling/webhook, egresso como intent, supressão de eco, conflito, mutação por linhagem)
- [[conector-espelho]] — definição canônica e invariantes
- [[conector-externo]] — taxonomia base

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/connectors/src/external-connector.ts` — `ExternalConnector`, `ConnectorId` (T-CN-01)
- **[READ]** `packages/connectors/src/translation-pipeline.ts` — `TranslationPipeline` (T-CN-02)
- **[CREATE]** `packages/connectors/src/mirror-connector.ts` — `MirrorConnector`, `FakeMirrorProvider`
- **[CREATE]** `packages/connectors/src/mirror-fake.ts` — implementação fake para testkit
- **[CREATE]** `packages/connectors/tests/mirror-connector.test.ts` — testes D1–D6 com fake provider
- **[UPDATE]** `packages/connectors/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/connectors test`).
- [x] **Fora de Escopo:** Conexão real IMAP/SMTP, proveedor real.

Casos de teste:
1. D1: `saveCursor` + `getCursor` → recupera cursor igual.
2. D1: `getCursor` sem cursor salvo → `null`.
3. D2: `poll` retorna eventos pendentes do fake provider.
4. D2: `registerWebhook` registra URL; webhook simulado entrega evento.
5. D3: `egress` com ação → retorna `MirrorEgressResult` com `originMarker`.
6. D4: `isEcho` com `externalRef` já egredido → `true`.
7. D4: `isEcho` com `externalRef` novo → `false`.
8. D2+D4: polling retorna evento que é eco → descartado pelo pipeline (não ingerido).
9. D6: mutação por `SUPERSEDED_BY` — reingresso de mesmo `externalRef` gera `duplicate` (T-CN-02).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente conexão real com provedor externo. Fake provider apenas.
> - **NÃO** modifique `TranslationPipeline` — use a interface existente.

### Pegadinhas conhecidas
- `originMarker` é o header `X-Plataforma-Ref`. Deve ser único por egresso e verificável no ingresso.
- `isEcho` compara `externalRef` exato. O fake provider mantém `egressLog` em `Map`.
- Cursor nulo (perda) → trigger de ressincronização completa. O fake provider deve simular este cenário.
- T-201 (wire format) está draft — não depende diretamente, mas o payload usa `unknown` até T-201 definir `WireData`.

1. **[TDD]** Crie `packages/connectors/tests/mirror-connector.test.ts` com 9 casos.
2. Crie `packages/connectors/src/mirror-connector.ts` com interfaces.
3. Crie `packages/connectors/src/mirror-fake.ts` com `FakeMirrorConnector` implementando `MirrorConnector`.
4. Re-exporte em `packages/connectors/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:**
> - **T-201 (wire format) está `draft`.** O tipo `WireData` ainda não está definido. O payload de ingresso usa `unknown` por enquanto.
> - **T-CN-01 e T-CN-02 estão sendo endurecidas nesta passada** — tipos `ConnectorId`, `ExternalConnector`, `TranslationPipeline` definidos.
> **Status:** `draft` até T-201 chegar a `ready`. Esqueleto Classe D já está com contratos derivados de fonte.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/connectors build
pnpm --filter @plataforma/connectors test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] `MirrorConnector` com `getCursor/saveCursor`, `poll`, `registerWebhook`, `egress`, `isEcho`?
- [ ] D1: cursor durável persiste e recupera?
- [ ] D4: supressão de eco — `isEcho` detecta egresso próprio?
- [ ] Fake provider cobre polling, webhook, cursor nulo?
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
