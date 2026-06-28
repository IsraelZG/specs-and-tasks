---
id: T-LOG-03
title: "transporte externo: conector de transportadora (cotacao/etiqueta/rastreio) idempotente"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-LOG-01", "T-CN-03"]
blocks: ["T-LOG-04", "T-LOG-05"]
---

# T-LOG-03 · transporte externo: conector de transportadora (cotacao/etiqueta/rastreio) idempotente

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de transporte externo no pacote `@plataforma/logistica`: conector de transportadora via conector classe C (emissão/contratação) e classe E (consulta de rastreio). Operações: cotação de frete, geração de etiqueta, e eventos de rastreio — todas com `external_ref` idempotente. A transportadora é autoridade sobre o status externo; o grafo espelha sem duplicar eventos. O mesmo workflow de rastreamento unifica transporte externo e interno; a UI não distingue a origem do status.
*(Fonte: `docs/caderno-3-sdk/25-logistica-reference-spec.md` §3, §5)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/logistica/src/carrier.ts ---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Transportadora externa. */
export interface Carrier {
  id: string;
  name: string; // "Correios", "Jadlog", "FedEx"
  /** Tipo de conector: C (emissão) + E (consulta). */
  connectorClass: 'C' | 'E';
  /** Configuração de acesso (API key via System Peer). */
  config: Record<string, unknown>;
}

/** Requisição de cotação de frete. */
export interface ShippingQuoteRequest {
  carrierId: string;
  originLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
  package: {
    weightKg: number;
    dimensionsCm?: { length: number; width: number; height: number };
    declaredValue?: number;
  };
  /** Serviços opcionais (PAC, SEDEX, etc.). */
  serviceCode?: string;
}

/** Resultado de cotação de frete. */
export interface ShippingQuote {
  id: ULID;
  carrierId: string;
  serviceCode: string;
  serviceName: string; // "PAC", "SEDEX", "FedEx Priority"
  /** Preço do frete. */
  price: number;
  /** Prazo estimado em dias úteis. */
  estimatedDays: number;
  /** Data estimada de entrega (epoch ms). */
  estimatedDelivery: number;
  /** external_ref idempotente. */
  externalRefHash: string;
  createdAt: number;
  /** TTL da cotação (preços variam). */
  validUntil: number;
}

/** Requisição de geração de etiqueta/envio. */
export interface ShippingLabelRequest {
  carrierId: string;
  quoteId: ULID;
  orderId: ULID;
  /** Dados do remetente. */
  sender: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
  };
  /** Dados do destinatário. */
  recipient: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
  };
  package: ShippingQuoteRequest['package'];
}

/** Etiqueta/envio gerado. */
export interface ShippingLabel {
  id: ULID;
  carrierId: string;
  /** Código de rastreio. */
  trackingCode: string;
  /** URL ou base64 da etiqueta. */
  labelUrl: string;
  /** external_ref idempotente. */
  externalRefHash: string;
  createdAt: number;
}

/** Evento de rastreio (chega via conector classe E). */
export interface TrackingEvent {
  id: ULID;
  trackingCode: string;
  /** Status do evento (ex: "posted", "in_transit", "out_for_delivery", "delivered"). */
  status: string;
  /** Descrição legível. */
  description: string;
  /** Localização do evento (se disponível). */
  location?: { lat: number; lng: number; city: string };
  /** Timestamp do evento reportado pela transportadora. */
  occurredAt: number;
  /** external_ref idempotente do evento (hash do payload). */
  externalRefHash: string;
  ingestedAt: number;
}

/** Solicita cotação de frete. */
export async function quoteShipping(
  storage: StoragePort,
  req: ShippingQuoteRequest,
): Promise<ShippingQuote>;

/** Gera etiqueta/envio (conector classe C). */
export async function generateLabel(
  storage: StoragePort,
  req: ShippingLabelRequest,
): Promise<ShippingLabel>;

/** Ingere evento de rastreio (conector classe E) — idempotente. */
export async function ingestTrackingEvent(
  storage: StoragePort,
  event: Omit<TrackingEvent, 'id' | 'ingestedAt'>,
): Promise<TrackingEvent>;

/** Lista eventos de rastreio para um código. */
export async function getTrackingHistory(
  storage: StoragePort,
  trackingCode: string,
): Promise<TrackingEvent[]>;

/** Calcula external_ref hash para idempotência. */
export function hashExternalRef(...fields: (string | number)[]): string;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/25-logistica-reference-spec.md](../docs/caderno-3-sdk/25-logistica-reference-spec.md) §3, §5 — transporte externo, rastreamento
- [[conector-externo]] — classe C (oráculo transacional para emissão) + classe E (provedor de consulta para rastreio)
- [[dispatch-saga]] — unificação de rastreamento externo e interno

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/25-logistica-reference-spec.md` §3, §5
- **[READ]** `docs/conceitos/conector-externo.md` — classes C e E, external_ref
- **[READ]** `tasks/T-CN-03.md` — esqueleto Classe D (padrão de conector)
- **[READ]** `packages/logistica/src/wms.ts` (T-LOG-01) — operações de armazém
- **[CREATE]** `packages/logistica/src/carrier.ts` — funções acima
- **[CREATE]** `packages/logistica/tests/carrier.test.ts`
- **[UPDATE]** `packages/logistica/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/logistica test`.
- [x] **Fora de Escopo:** Integração real com APIs de transportadoras (Correios, FedEx).

Casos de teste (numerados):
1. `quoteShipping(carrier, origin, dest, pkg)` → cotação com `estimatedDays`, `price`, `externalRefHash`.
2. Duas cotações com mesmos parâmetros → `externalRefHash` idênticos (determinístico).
3. `quoteShipping` com parâmetros diferentes → `externalRefHash` diferentes.
4. `generateLabel(req)` → etiqueta gerada com `trackingCode` e `labelUrl`.
5. Duas chamadas `generateLabel` com mesmo `quoteId` → segunda é rejeitada (idempotente: etiqueta já existe).
6. `ingestTrackingEvent` → evento registrado com `externalRefHash`.
7. Mesmo evento ingerido duas vezes (reemissão) → segundo é ignorado (idempotente por hash).
8. `getTrackingHistory(trackingCode)` → lista ordenada por `occurredAt`.
9. `hashExternalRef` é determinístico: `hashExternalRef('CORREIOS', 'PAC', 'SP', 'RJ')` retorna sempre o mesmo valor.
10. Evento de rastreio com `status: 'delivered'` → tracking completo.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** duplique eventos de rastreio — `ingestTrackingEvent` é idempotente por `externalRefHash`.
> - **NÃO** gere etiqueta sem cotação válida — `generateLabel` verifica que `quoteId` existe e `validUntil > now`.
> - **NÃO** implemente chamada HTTP real à transportadora — usar mock de conector.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Reemissão de eventos**: transportadoras frequentemente reenviam eventos de rastreio (webhook retry). O `externalRefHash` é a defesa — mesmo payload = mesmo hash, ignorar.
- **Cotação tem TTL**: `ShippingQuote.validUntil` expira. Não use cotação vencida para gerar etiqueta — o preço pode ter mudado.
- **Conector C vs E**: emissão de etiqueta é classe C (afirma fato — a etiqueta foi gerada). Consulta de rastreio é classe E (cache com TTL).

1. **[TDD]** Crie `packages/logistica/tests/carrier.test.ts` com casos 1–10.
2. Implemente `hashExternalRef` (hash determinístico).
3. Implemente `quoteShipping` com mock de resposta da transportadora.
4. Implemente `generateLabel` com idempotência (verifica se já existe).
5. Implemente `ingestTrackingEvent` com idempotência por `externalRefHash`.
6. Implemente `getTrackingHistory`.
7. Re-exporte em `packages/logistica/src/index.ts`.
8. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-CN-03 (esqueleto Classe D) está `draft`**: o padrão de conector comum ainda não definido. O conector de transportadora usa interface autônoma.
> - **Transportadoras concretas**: quais implementações (Correios, Jadlog, FedEx) serão feitas? Esta task define a interface; implementações concretas são tasks separadas.
> **Status:** `draft` até T-CN-03 ficar `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `quoteShipping` gera `externalRefHash` determinístico?
- [ ] `generateLabel` é idempotente (não duplica etiqueta)?
- [ ] `ingestTrackingEvent` ignora eventos duplicados por hash?
- [ ] `hashExternalRef` é determinístico?
- [ ] Os 10 casos de teste passam?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/logistica build
pnpm --filter @plataforma/logistica test
```
> **GATE DE EVIDÊNCIA:** Worker cola saída literal na Seção 8.

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
