---
id: T-MAP-02
title: "conector Classe E (geocoding/places/rotas) com cache TTL + proveniencia + flag cacheavel"
status: draft:triaged
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-MAP-01", "T-CN-03"]
blocks: ["T-MAP-03"]
---

# T-MAP-02 · conector Classe E (geocoding/places/rotas) com cache TTL + proveniencia + flag cacheavel

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o conector Classe E para provedores externos de geocoding, places e rotas no pacote `@plataforma/mapa`. O conector segue a classificação da RFC-007 A.5: provedor de consulta (grafo → externo → grafo), não afirma fato na linhagem, resultado pode materializar como `SPEC:PLACE` com TTL de validade e proveniência (`provider`/`fetched_at`). A SPEC declara se o resultado é cacheável/replicável ou `LOCAL_TRANSIENT`. A chave de API do provedor NUNCA é exposta no frontend — é retida no System Peer do Operador de Node como proxy seguro.
*(Fonte: `docs/caderno-3-sdk/23-mapa-reference-spec.md` §2, `docs/conceitos/conector-externo.md`)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/mapa/src/class-e-connector.ts 
---
import type { LatLng, Place, GeoPolygon } from './place.js';

/** Provedor externo de geodados suportado. */
export type GeoProvider = 'google_maps' | 'openstreetmap' | 'mapbox' | 'here' | 'custom';

/** Modo de cache do resultado. */
export type CacheMode = 'cacheable' | 'replicable' | 'local_transient';

/** Metadados de proveniência do resultado. */
export interface Provenance {
  provider: GeoProvider;
  fetchedAt: number; // epoch ms
  /** TTL em milissegundos. Após este prazo, o resultado é considerado stale. */
  ttlMs: number;
  /** Se o resultado pode ser cacheado localmente. */
  cacheMode: CacheMode;
  /** Termos de uso do provedor (resumo). */
  terms?: string;
}

/** Requisição de geocoding (endereço → coordenadas). */
export interface GeocodeRequest {
  address: string;
  /** Filtro de região (opcional). */
  region?: string;
}

/** Resultado de geocoding. */
export interface GeocodeResult {
  place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>;
  /** Precisão do resultado ( rooftop, range_interpolated, geometric_center, approximate). */
  precision: 'rooftop' | 'range_interpolated' | 'geometric_center' | 'approximate';
  provenance: Provenance;
}

/** Requisição de places search. */
export interface PlacesRequest {
  query: string; // termo de busca ("restaurante", "farmácia")
  near?: LatLng;
  radiusMeters?: number;
  limit?: number;
}

/** Resultado de places search. */
export interface PlacesResult {
  places: Array<{
    place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>;
    distance?: number;
  }>;
  provenance: Provenance;
}

/** Requisição de rota (waypoints → rota). */
export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  /** Modo de transporte. */
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  /** Evitar pedágios, balsas, etc. */
  avoid?: ('tolls' | 'highways' | 'ferries')[];
}

/** Resultado de rota. */
export interface RouteResult {
  /** Distância total em metros. */
  distanceMeters: number;
  /** Duração estimada em segundos. */
  durationSeconds: number;
  /** Polilinha da rota (encoded ou array de pontos). */
  polyline: LatLng[];
  /** Passos da rota (instruções). */
  steps: Array<{
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
    startLocation: LatLng;
    endLocation: LatLng;
  }>;
  /** ETA de chegada (epoch ms). */
  estimatedArrival: number;
  provenance: Provenance;
}

/** Configuração de um conector Classe E. */
export interface ClassEConnectorConfig {
  provider: GeoProvider;
  /** O conector NÃO armazena a API key — ela fica no System Peer. */
  defaultTtlMs: number;
  defaultCacheMode: CacheMode;
  /** URL base da API do provedor. */
  baseUrl: string;
}

/** Interface do conector Classe E. */
export interface ClassEConnector {
  config: ClassEConnectorConfig;

  /** Geocoding: endereço → coordenadas. */
  geocode(req: GeocodeRequest): Promise<GeocodeResult>;

  /** Reverse geocoding: coordenadas → endereço. */
  reverseGeocode(latlng: LatLng): Promise<GeocodeResult>;

  /** Busca de lugares. */
  searchPlaces(req: PlacesRequest): Promise<PlacesResult>;

  /** Cálculo de rota. */
  calculateRoute(req: RouteRequest): Promise<RouteResult>;
}

/** Cria instância do conector Classe E (sem API key — usa proxy do System Peer). */
export function createClassEConnector(
  config: ClassEConnectorConfig,
): ClassEConnector;

/** Verifica se um resultado cacheado ainda é válido (TTL não expirado). */
export function isCacheValid(provenance: Provenance): boolean;

/** Estima TTL restante em ms (0 = expirado). */
export function remainingTtlMs(provenance: Provenance): number;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/23-mapa-reference-spec.md](../docs/caderno-3-sdk/23-mapa-reference-spec.md) §2 — consultas espaciais e provedores externos, cache TTL, proxy seguro de API key
- [[conector-externo]] — taxonomia de classes, classe E = provedor de consulta (grafo → externo → grafo)
- [[peer-do-sistema]] — System Peer do Operador de Node como proxy seguro para API keys
- [[fato-negativo-verificavel]] — ausência de resultado como fato rastreável

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/23-mapa-reference-spec.md` §2
- **[READ]** `docs/conceitos/conector-externo.md` — classe E, cache TTL, proveniência
- **[READ]** `tasks/T-CN-03.md` — esqueleto Classe D (referência de padrão de conector)
- **[READ]** `packages/mapa/src/place.ts` (T-MAP-01) — Place, LatLng, GeoPolygon
- **[CREATE]** `packages/mapa/src/class-e-connector.ts` — funções acima
- **[CREATE]** `packages/mapa/tests/class-e-connector.test.ts`
- **[UPDATE]** `packages/mapa/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/mapa test`.
- [x] **Fora de Escopo:** Chamadas reais a APIs externas (google, mapbox) — usar mock/fake de HTTP.

Casos de teste (numerados):
1. `createClassEConnector({ provider: 'openstreetmap', defaultTtlMs: 86400000, ... })` → instância criada.
2. `geocode({ address: 'Av Paulista, São Paulo' })` → resultado com coordenadas e `provenance.provider`.
3. `reverseGeocode({ lat: -23.5, lng: -46.6 })` → endereço textual.
4. `searchPlaces({ query: 'farmácia', near: center, radiusMeters: 1000 })` → lista de lugares próximos.
5. `calculateRoute(origin, destination)` → rota com `distanceMeters`, `durationSeconds`, `polyline`.
6. `isCacheValid(provenance)` com TTL futuro → `true`.
7. `isCacheValid(provenance)` com TTL expirado → `false`.
8. `remainingTtlMs` retorna valor positivo para cache válido, 0 para expirado.
9. Resultado com `cacheMode: 'local_transient'` → não é persistido em storage.
10. Resultado com `cacheMode: 'cacheable'` → persistido com TTL, `isCacheValid` controla expiração.
11. Conector sem API key → usa proxy do System Peer (stub nos testes).
12. Dois geocodes consecutivos com mesmo endereço: segundo retorna do cache (se válido).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** hardcode API keys no código — a chave é injetada via proxy do System Peer.
> - **NÃO** afirme fato na linhagem para resultados Classe E — esta classe é consulta, não oráculo transacional.
> - **NÃO** ignore `cacheMode` — `local_transient` NUNCA deve ser persistido.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Cache por termos do provedor**: a fonte RAG §2.2 diz que a SPEC declara se é cacheável. Não é decisão do conector — é a SPEC que controla. O conector obedece o `cacheMode` declarado.
- **API key via proxy**: a chave nunca chega ao frontend nem ao cliente P2P. O conector faz a chamada via System Peer que injeta a chave. Nos testes, mockar essa camada.
- **Rota e ETA são efêmeros**: `calculateRoute` retorna resultado com TTL curto (minutos). Condições de trânsito mudam; cache longo de rota gera ETA falso.

1. **[TDD]** Crie `packages/mapa/tests/class-e-connector.test.ts` com casos 1–12 usando mock HTTP.
2. Implemente `createClassEConnector` com interface `ClassEConnector`.
3. Implemente `geocode`, `reverseGeocode`, `searchPlaces`, `calculateRoute` com mock de resposta do provedor.
4. Implemente lógica de cache: `isCacheValid`, `remainingTtlMs`, verificação de `cacheMode` antes de persistir.
5. Implemente proxy de API key (stub que injeta chave no header).
6. Re-exporte em `packages/mapa/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-CN-03 (esqueleto Classe D) está `draft`**: o padrão de conector (interface `ExternalConnector`, regras de identidade) virá de T-CN-03. O conector Classe E acima usa interface autônoma; será adaptado quando o esqueleto comum estiver pronto.
> - **Provedores concretos**: quais provedores (Google, Mapbox, OSRM) terão implementação real? Esta task define a interface; implementações concretas são tasks separadas.
> **Status:** `draft` até T-CN-03 ficar `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `ClassEConnector` obedece `cacheMode` (cacheable/replicable/local_transient)?
- [ ] `isCacheValid` e `remainingTtlMs` controlam expiração corretamente?
- [ ] API key nunca é exposta (injetada via proxy)?
- [ ] Resultados Classe E NÃO afirmam fato na linhagem?
- [ ] Os 12 casos de teste passam?

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
