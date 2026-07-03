---
id: T-MAP-03
title: "consumo cross-modulo + localizacao como dado sensivel/efemero + vetores"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-MAP-01", "T-MAP-02"]
blocks: []
---

# T-MAP-03 · consumo cross-modulo + localizacao como dado sensivel/efemero + vetores

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Implementar o módulo de consumo cross-modulo e privacidade de localização no pacote `@plataforma/mapa`: interface de lookup de `PLACE` por outros módulos (produto/loja no marketplace, check-in social, geolocalização de live, local de evento, roteirização de entrega) sem que cada módulo reimplemente geo. Localização do usuário tratada como dado sensível: captura sob consentimento explícito, granularidade declarada (precisa vs. aproximada), nunca exposta a segmentação de anúncios. Compartilhamento de localização em tempo real é sinal efêmero (como presença), não nó durável. Inclui testes de vetor (edge cases).
*(Fonte: `docs/caderno-3-sdk/23-mapa-reference-spec.md` §3-4)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/mapa/src/location-privacy.ts 
---
import type { ULID } from '@plataforma/core';
import type { LatLng } from './place.js';

/** Granularidade de localização compartilhada. */
export type LocationGranularity = 'precise' | 'approximate' | 'city' | 'region';

/** Estado de compartilhamento de localização. */
export interface LocationSharingConsent {
  profileId: ULID;
  /** Se o usuário consentiu compartilhar localização. */
  consented: boolean;
  /** Granularidade autorizada. */
  granularity: LocationGranularity;
  /** Finalidades autorizadas (ex: ['delivery', 'checkin']). */
  purposes: string[];
  /** Se é compartilhamento em tempo real (efêmero). */
  realtime: boolean;
  grantedAt: number;
  revokedAt?: number;
}

/** Sinal efêmero de localização (não durável). */
export interface EphemeralLocation {
  profileId: ULID;
  location: LatLng;
  /** Precisão em metros. */
  accuracy: number;
  /** Timestamp da captura. */
  timestamp: number;
  /** Se é localização em tempo real (live). */
  live: boolean;
}

/** Registra consentimento de localização. */
export async function setLocationConsent(
  storage: StoragePort,
  consent: Omit<LocationSharingConsent, 'grantedAt'>,
): Promise<LocationSharingConsent>;

/** Revoga consentimento de localização. */
export async function revokeLocationConsent(
  storage: StoragePort,
  profileId: ULID,
  purpose: string,
): Promise<LocationSharingConsent>;

/** Verifica se usuário consentiu compartilhar localização para uma finalidade. */
export async function checkLocationConsent(
  storage: StoragePort,
  profileId: ULID,
  purpose: string,
): Promise<{ allowed: boolean; granularity: LocationGranularity | null }>;

/** Aplica granularidade à coordenada (trunca/precisa conforme consentimento). */
export function applyGranularity(
  location: LatLng,
  granularity: LocationGranularity,
): LatLng;

/** Emite sinal efêmero de localização (não persiste). */
export function emitEphemeralLocation(
  profileId: ULID,
  location: LatLng,
  accuracy: number,
  live?: boolean,
): EphemeralLocation;

/** Verifica se um sinal efêmero ainda é válido (max age em segundos). */
export function isEphemeralValid(signal: EphemeralLocation, maxAgeSeconds?: number): boolean;

/** Testes de vetor: edge cases de privacidade e cross-modulo. */
export function runEdgeCaseTests(): void;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/23-mapa-reference-spec.md](../docs/caderno-3-sdk/23-mapa-reference-spec.md) §3-4 — consumo cross-modulo, privacidade de localização
- [[conector-externo]] — provedor de tiles é serviço de terceiro; offline depende de tiles pré-baixados

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/23-mapa-reference-spec.md` §3-4
- **[READ]** `packages/mapa/src/place.ts` (T-MAP-01) — LatLng, Place, queryContainingPoint
- **[READ]** `packages/mapa/src/class-e-connector.ts` (T-MAP-02) — ClassEConnector
- **[CREATE]** `packages/mapa/src/location-privacy.ts` — funções acima
- **[CREATE]** `packages/mapa/tests/location-privacy.test.ts` — incluindo vetores de edge case
- **[UPDATE]** `packages/mapa/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/mapa test`.
- [x] **Fora de Escopo:** Integração com frontend de mapa (renderização de tiles), push notifications.

Casos de teste (numerados):

### Consentimento e granularidade
1. `setLocationConsent(profile, { granularity: 'precise', purposes: ['delivery'] })` → consentimento criado.
2. `checkLocationConsent(profile, 'delivery')` → `{ allowed: true, granularity: 'precise' }`.
3. `checkLocationConsent(profile, 'advertising')` → `{ allowed: false, granularity: null }`.
4. `revokeLocationConsent(profile, 'delivery')` → `checkLocationConsent` passa a retornar `false`.

### Granularidade aplicada
5. `applyGranularity({ lat: -23.5505, lng: -46.6333 }, 'precise')` → coordenadas inalteradas.
6. `applyGranularity({ lat: -23.5505, lng: -46.6333 }, 'approximate')` → truncado a 3 casas decimais (~100m).
7. `applyGranularity({ lat: -23.5505, lng: -46.6333 }, 'city')` → truncado a 1 casa decimal (~10km).

### Sinais efêmeros
8. `emitEphemeralLocation(profile, loc, 10)` → sinal com timestamp, `live: false`.
9. `isEphemeralValid(signal, 60)` → `true` (emitido há < 60s).
10. `isEphemeralValid(signal, 60)` após 120s → `false` (expirado).

### Vetores (edge cases)
11. **Localização nunca persistida**: `emitEphemeralLocation` NÃO grava no storage (verificar que `StoragePort.exec` não foi chamado).
12. **Consentimento revogado para todas as finalidades**: após revogar, localização não pode ser usada para NENHUMA finalidade.
13. **Múltiplas finalidades**: consentimento para `['delivery', 'checkin']` não autoriza `['advertising']`.
14. **Granularidade herdada**: se usuário consentiu `approximate`, o módulo de entrega recebe coordenada truncada, não a precisa.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** persista localização em tempo real (`live: true`) — é sinal efêmero, como presença. Armazenar localização live viola o contrato de privacidade.
> - **NÃO** exponha localização a segmentação de anúncios — `checkLocationConsent` deve negar para finalidade `advertising` a menos que explicitamente consentido.
> - **NÃO** reimplemente geo nos módulos consumidores — todos usam as funções deste módulo para lookup de PLACE.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Efêmero ≠ cache**: `EphemeralLocation` não é armazenado em disco. Se o worker confundir "sinal efêmero" com "cache TTL" e persistir, a localização live vira dado durável — violação de privacidade.
- **Granularidade não é arredondamento simples**: `approximate` pode usar técnicas como geohash truncado ou grade. O importante é que a coordenada original não é recuperável a partir da truncada.
- **Cross-module sem acoplamento**: outros módulos (marketplace, social, eventos) referenciam `PLACE` por ID, não copiam lógica geo. Este módulo exporta `queryNearby`, `queryBoundingBox`, etc. — os consumidores chamam, não reimplementam.

1. **[TDD]** Crie `packages/mapa/tests/location-privacy.test.ts` com casos 1–14.
2. Implemente `setLocationConsent`, `revokeLocationConsent`, `checkLocationConsent`.
3. Implemente `applyGranularity` (truncagem por casas decimais).
4. Implemente `emitEphemeralLocation` e `isEphemeralValid` (não persistem).
5. Re-exporte em `packages/mapa/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-MAP-01 e T-MAP-02 estão `draft`**: `LatLng`, `Place`, `ClassEConnector` ainda não definidos. Usar interfaces provisórias.
> - **Framework de privacidade**: a fonte RAG §4 diz "captura sob consentimento explícito". O framework canônico de privacidade (caderno-1/03) tem `ASSET:CONSENT`. Esta task implementa o mecanismo de localização; a integração com `ASSET:CONSENT` virá depois.
> **Status:** `draft` até T-MAP-01 e T-MAP-02 ficarem `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `checkLocationConsent` verifica finalidade granular (não binário)?
- [ ] `applyGranularity` trunca coordenadas conforme o nível?
- [ ] `emitEphemeralLocation` NÃO persiste no storage?
- [ ] `isEphemeralValid` expira corretamente?
- [ ] Os 14 casos de teste passam?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/mapa build
pnpm --filter @plataforma/mapa test
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
