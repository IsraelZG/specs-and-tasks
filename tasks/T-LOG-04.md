---
id: T-LOG-04
title: "operacao interna: dispatch-saga, entregador como listing, localizacao efemera, surge por Zen, repasse por SPEC"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-LOG-01", "T-LOG-02", "T-LOG-03", "T-009a"]
blocks: ["T-LOG-05"]
---

# T-LOG-04 · operacao interna: dispatch-saga, entregador como listing, localizacao efemera, surge por Zen, repasse por SPEC

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de operação interna de transporte no pacote `@plataforma/logistica`: entregador/motorista como `PROFILE` que oferta capacidade como serviço negociável (listing de disponibilidade no marketplace), dispatch via saga (`ASSET:LOCK` com TTL — ofertar reserva disponibilidade, aceite confirma, recusa/expiração libera), localização ao vivo como sinal efêmero (não nó durável), precificação dinâmica (surge/distância/tempo) como Zen, e repasse ao entregador como liquidação por SPEC.
*(Fonte: `docs/caderno-3-sdk/25-logistica-reference-spec.md` §4)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/logistica/src/dispatch.ts 
---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Estado do dispatch. */
export type DispatchState =
  | 'offered'       // ofertado ao entregador
  | 'accepted'      // aceito pelo entregador
  | 'en_route_pickup'  // a caminho da coleta
  | 'collected'     // coletado
  | 'en_route_delivery' // a caminho da entrega
  | 'delivered'     // entregue
  | 'declined'      // recusado pelo entregador
  | 'expired'       // TTL expirado sem resposta
  | 'cancelled';    // cancelado pelo sistema

/** Listing de disponibilidade do entregador. */
export interface CourierAvailability {
  profileId: ULID;
  /** Região de atuação (polígono ou bounding box). */
  coverageArea: { lat: number; lng: number; radiusKm: number };
  /** Se está online e disponível. */
  online: boolean;
  /** Modos de transporte. */
  modes: ('motorcycle' | 'car' | 'bicycle' | 'walking')[];
  /** Capacidade (peso/volume). */
  maxWeightKg: number;
  updatedAt: number;
}

/** Ordem de dispatch (corrida/entrega). */
export interface DispatchOrder {
  id: ULID;
  fulfillmentOrderId: ULID; // T-LOG-02
  /** Entregador designado. */
  courierProfileId: ULID;
  state: DispatchState;
  /** Lock ID que reserva o entregador. */
  lockId?: ULID;
  /** Localização de coleta. */
  pickupLocation: { lat: number; lng: number; address: string };
  /** Localização de entrega. */
  deliveryLocation: { lat: number; lng: number; address: string };
  /** Preço da corrida (surge/dinâmico). */
  price: number;
  /** Repasse ao entregador. */
  courierPayout: number;
  /** Prova de entrega (foto, assinatura, geolocalização, código). */
  proofOfDelivery?: {
    photoUrl?: string;
    signature?: string;
    location: { lat: number; lng: number };
    confirmationCode?: string;
    timestamp: number;
  };
  createdAt: number;
  updatedAt: number;
}

/** Sinal efêmero de localização do entregador (NÃO durável). */
export interface CourierLocationSignal {
  courierProfileId: ULID;
  dispatchOrderId: ULID;
  location: { lat: number; lng: number };
  /** Velocidade e direção. */
  speedKmh?: number;
  heading?: number;
  timestamp: number;
}

/** Ativa/desativa disponibilidade do entregador. */
export async function setCourierAvailability(
  storage: StoragePort,
  profileId: ULID,
  available: boolean,
  coverageArea?: CourierAvailability['coverageArea'],
  modes?: CourierAvailability['modes'],
): Promise<CourierAvailability>;

/** Busca entregadores disponíveis na região. */
export async function findAvailableCouriers(
  storage: StoragePort,
  location: { lat: number; lng: number },
  maxRadiusKm: number,
): Promise<CourierAvailability[]>;

/** Oferece corrida a entregador (dispatch com LOCK TTL). */
export async function offerDispatch(
  storage: StoragePort,
  params: {
    fulfillmentOrderId: ULID;
    courierProfileId: ULID;
    pickupLocation: DispatchOrder['pickupLocation'];
    deliveryLocation: DispatchOrder['deliveryLocation'];
    price: number;
    courierPayout: number;
    /** TTL do lock em ms (quanto tempo o entregador tem para aceitar). */
    offerTtlMs: number;
  },
): Promise<DispatchOrder>;

/** Entregador aceita corrida. */
export async function acceptDispatch(
  storage: StoragePort,
  dispatchOrderId: ULID,
  courierProfileId: ULID,
): Promise<DispatchOrder>;

/** Entregador recusa corrida. */
export async function declineDispatch(
  storage: StoragePort,
  dispatchOrderId: ULID,
  courierProfileId: ULID,
): Promise<DispatchOrder>;

/** Avança estado do dispatch (coletado, entregue, etc.). */
export async function advanceDispatch(
  storage: StoragePort,
  dispatchOrderId: ULID,
  newState: DispatchState,
  proofOfDelivery?: DispatchOrder['proofOfDelivery'],
): Promise<DispatchOrder>;

/** Emite sinal efêmero de localização (NÃO persiste). */
export function emitCourierLocation(
  courierProfileId: ULID,
  dispatchOrderId: ULID,
  location: { lat: number; lng: number },
  speedKmh?: number,
  heading?: number,
): CourierLocationSignal;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/25-logistica-reference-spec.md](../docs/caderno-3-sdk/25-logistica-reference-spec.md) §4 — operação interna de transporte
- [[dispatch-saga]] — coordenação transacional multidomínio para matching de entregadores
- [[asset-lock]] — reserva temporária da disponibilidade do entregador com TTL
- [[economia-como-modulo]] — repasse ao entregador como liquidação por SPEC

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/25-logistica-reference-spec.md` §4
- **[READ]** `docs/conceitos/dispatch-saga.md` — saga de dispatch, matching
- **[READ]** `docs/conceitos/asset-lock.md` — primitiva de reserva/LOCK
- **[READ]** `packages/logistica/src/fulfillment.ts` (T-LOG-02) — FulfillmentOrder
- **[READ]** `tasks/T-009a.md` — ControlPort (interface de controle)
- **[CREATE]** `packages/logistica/src/dispatch.ts` — funções acima
- **[CREATE]** `packages/logistica/tests/dispatch.test.ts`
- **[UPDATE]** `packages/logistica/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/logistica test`.
- [x] **Fora de Escopo:** Streaming real de GPS, push notifications para entregadores.

Casos de teste (numerados):
1. `setCourierAvailability(profile, true, area, ['motorcycle'])` → entregador online.
2. `findAvailableCouriers(loc, 5)` retorna entregadores online no raio de 5km.
3. `findAvailableCouriers` não retorna entregador offline.
4. `offerDispatch(fulfillment, courier, pickup, delivery, 25.0, 20.0, 30000)` → dispatch criado, estado `offered`, lock com TTL 30s.
5. `acceptDispatch(dispatch, courier)` → estado `accepted`, lock confirmado.
6. `declineDispatch(dispatch, courier)` → estado `declined`, lock liberado.
7. `offerDispatch` expirado (TTL passou sem resposta) → estado `expired` (na projeção, não por CRON).
8. `advanceDispatch(dispatch, 'delivered', proof)` → estado `delivered`, prova registrada.
9. `advanceDispatch` com estado inválido (pular de offered para delivered) → erro.
10. `emitCourierLocation(courier, dispatch, loc)` → sinal com timestamp, NÃO persiste no storage.
11. Dois sinais de localização: `isEphemeralValid` verifica idade máxima.
12. `offerDispatch` com mesmo entregador já em corrida → rejeitado (entregador ocupado).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** persista localização ao vivo — `emitCourierLocation` é efêmero, nunca vai ao storage.
> - **NÃO** implemente CRON para expiração de lock — a expiração é avaliada na projeção (disponível = online && !tem_lock_ativo_com_ttl_vigente).
> - **NÃO** permita que entregador em corrida ativa receba novo dispatch.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Lock TTL avaliado na leitura**: um lock com TTL vencido ainda existe no grafo mas NÃO bloqueia o entregador. `findAvailableCouriers` considera disponível se `online && (sem lock ativo || lock.ttl < now)`.
- **Dispatch é orquestração efêmera**: a fonte RAG §4.2 diz "estado do dispatch é orquestração efêmera não-replicada, só pernas finalizadas vão ao grafo". Estados intermediários (offered, accepted) são locais; apenas `delivered`, `cancelled` são fatos duráveis.
- **Surge pricing**: o preço da corrida (`price`) e o repasse (`courierPayout`) são definidos pelo chamador (Zen engine T-604), não calculados neste módulo.

1. **[TDD]** Crie `packages/logistica/tests/dispatch.test.ts` com casos 1–12.
2. Implemente `setCourierAvailability` e `findAvailableCouriers` (filtro por raio e disponibilidade incluindo locks).
3. Implemente `offerDispatch`, `acceptDispatch`, `declineDispatch` (gerenciam lock, validam entregador ocupado).
4. Implemente `advanceDispatch` com prova de entrega.
5. Implemente `emitCourierLocation` (efêmero, sem persistência).
6. Re-exporte em `packages/logistica/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-LOG-02 e T-LOG-03 estão `draft`**: FulfillmentOrder e rastreamento ainda não definidos. Interfaces provisórias.
> - **T-009a (ControlPort) está `draft`**: interface de controle para orquestração efêmera. Assumindo que o dispatch usa StoragePort local enquanto T-009a não está pronto.
> - **Orquestração efêmera**: quais estados do dispatch são duráveis vs. efêmeros? A fonte RAG §4.2 diz que estados intermediários são efêmeros e não-replicados. Confirmar escopo exato.
> **Status:** `draft` até T-LOG-02 e T-LOG-03 ficarem `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `findAvailableCouriers` ignora entregadores com lock TTL vigente?
- [ ] `offerDispatch` bloqueia entregador já em corrida?
- [ ] Expiração de lock é lógica (avaliada na leitura), não por CRON?
- [ ] `emitCourierLocation` NÃO persiste no storage?
- [ ] `advanceDispatch` para `delivered` registra prova de entrega?
- [ ] Os 12 casos de teste passam?

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

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
