---
id: T-CN-02
title: "pipeline de traducao com idempotencia por external_ref + testes de reentrega"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-CN-01"]
blocks: ["T-CN-03"]
---

# T-CN-02 · pipeline de traducao com idempotencia por external_ref + testes de reentrega

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o pipeline de tradução API ↔ grafo com idempotência por `external_ref`. Fato externo é traduzido para nó governado por SPEC (nunca formato proprietário), com `external_ref` em campo `searchable` para dedup determinístico. Reentrega com mesmo `external_ref` → no-op. A projeção de dedup vive no `device_state.db` do system-peer.
**Fonte:** `caderno-3-sdk/06-connectors.md §2` — tradução API↔grafo, idempotência por chave externa, sem side-effect de escrita local, timeout = fato negativo. **Conceitos:** [[conector-externo]], [[fato-negativo-verificavel]].

### Contratos exatos

```ts
// --- packages/connectors/src/translation-pipeline.ts 
---

import type { ConnectorId } from './external-connector';

/** Referência externa para idempotência (txid PIX, chave NF-e, Message-ID). */
export type ExternalRef = string;

/** Resultado da tradução de um fato externo. */
export interface TranslatedFact {
  /** external_ref que garante idempotência. */
  externalRef: ExternalRef;
  /** ID do conector que produziu este fato. */
  connectorId: ConnectorId;
  /** Payload traduzido para o formato do grafo (nó governado por SPEC). */
  graphPayload: Record<string, unknown>;
  /** Timestamp de ingestão (ms). */
  ingestedAt: number;
}

/** Resultado de uma tentativa de ingestão. */
export interface IngestionResult {
  status: 'ingested' | 'duplicate' | 'rejected';
  fact?: TranslatedFact;
  /** Se duplicate, o external_ref que já existia. */
  duplicateOf?: ExternalRef;
}

/**
 * Pipeline de tradução com idempotência por external_ref.
 * Usa o StoragePort (T-004) para projeção de dedup no device_state.db.
 */
export interface TranslationPipeline {
  /**
   * Traduz payload externo bruto → TranslatedFact.
   * A tradução é spec-driven: o mapeamento é declarado, não hardcoded.
   */
  translate(
    connectorId: ConnectorId,
    rawPayload: unknown,
    mappingSpec: Record<string, string>, // provider_field → graph_field
  ): TranslatedFact;

  /**
   * Ingera um TranslatedFact com dedup por external_ref.
   * Mesmo external_ref → duplicate (no-op determinístico).
   */
  ingest(fact: TranslatedFact): Promise<IngestionResult>;

  /**
   * Verifica se um external_ref já foi ingerido (lookup na projeção de dedup).
   */
  isDuplicate(externalRef: ExternalRef): Promise<boolean>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/06-connectors.md](../docs/caderno-3-sdk/06-connectors.md) — §2 (tradução API↔grafo, idempotência, timeout=fato negativo, fail-fast)
- [[conector-externo]] — taxonomia e regras de identidade
- [[fato-negativo-verificavel]] — timeout como fato negativo

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/connectors/src/external-connector.ts` — `ConnectorId` (T-CN-01)
- **[READ]** `packages/protocol/src/ports.ts` — `StoragePort` (T-004 ready, usado para projeção de dedup)
- **[CREATE]** `packages/connectors/src/translation-pipeline.ts` — interfaces + implementação `MapTranslationPipeline`
- **[CREATE]** `packages/connectors/tests/translation-pipeline.test.ts` — testes de tradução + idempotência + reentrega
- **[UPDATE]** `packages/connectors/src/index.ts` — re-exportar `translation-pipeline.ts`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/connectors test`).
- [x] **Fora de Escopo:** Conexão real com provedor externo, storage real em SQLite.

Casos de teste:
1. `translate()` com mapping spec mapeia campos corretamente: `{txid: "abc"}` + `{"txid":"externalRef"}` → `externalRef="abc"`.
2. `translate()` sem mapping spec → payload vazio, `externalRef` do rawPayload (campo `id`).
3. `ingest()` primeira vez → `status: 'ingested'`, fato registrado.
4. `ingest()` segunda vez com mesmo `externalRef` → `status: 'duplicate'`, `duplicateOf` aponta original.
5. `isDuplicate()` retorna `true` após `ingest()` bem-sucedido.
6. `isDuplicate()` retorna `false` para `externalRef` nunca ingerido.
7. Reentrega com 3 chamadas idênticas → 1 `ingested`, 2 `duplicate`.
8. `translate()` com payload malformado (não é objeto) → lança erro.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente conexão com provedor externo real. A tradução é função pura.
> - **NÃO** use banco de dados real — a projeção de dedup é um `Map` em memória para teste.
> - **NÃO** modifique `ExternalConnector` — `TranslationPipeline` é separado.

### Pegadinhas conhecidas
- `externalRef` é string, não any. O mapping spec deve ser usado para extrair o campo correto do payload bruto.
- A idempotência é por `externalRef` exato (case-sensitive). `"ABC" !== "abc"`.
- `ingest()` é async (chamaria `StoragePort` em produção). A implementação de teste usa `Map` síncrono com `Promise.resolve`.
- `rawPayload` pode ser qualquer JSON — validar que é objeto antes de acessar campos.

1. **[TDD]** Crie `packages/connectors/tests/translation-pipeline.test.ts` com casos 1–8.
2. Crie `packages/connectors/src/translation-pipeline.ts` com tipos + `MapTranslationPipeline`.
3. Implemente `translate()`: aplica mapping spec, extrai `externalRef`.
4. Implemente `ingest()`: checa duplicata via `Set<ExternalRef>`, insere ou rejeita.
5. Re-exporte em `packages/connectors/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
*(Nenhuma pendência — contrato derivado integralmente de `caderno-3-sdk/06-connectors.md §2`.*
*Dep T-CN-01 sendo endurecida nesta mesma passada — `ConnectorId` definido.)*

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/connectors build
pnpm --filter @plataforma/connectors test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] `translate()` aplica mapping spec e extrai `externalRef`?
- [ ] `ingest()` é idempotente — mesmo `externalRef` → `duplicate`?
- [ ] Testes cobrem: tradução, primeira ingestão, reentrega (3x), duplicata, payload malformado?
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
