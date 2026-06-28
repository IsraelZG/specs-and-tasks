---
id: T-MAP-01
title: "SPEC:PLACE + consulta sobre geo_index + render GeoSpatial"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004", "T-106"]
blocks: ["T-MAP-02", "T-MAP-03"]
---

# T-MAP-01 · SPEC:PLACE + consulta sobre geo_index + render GeoSpatial

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o módulo de lugares e índice espacial no pacote `@plataforma/mapa`. Um lugar é `CONTENT` governado por `SPEC:PLACE` (coordenadas, endereço, categoria), indexado no `geo_index` (R*Tree) para consulta por proximidade/bounding box. Suporte a geofencing por polígono: consulta "dentro-de-polígono" local sobre o `geo_index`, sem rede. Integração com tiles via provedor de mapa-base para renderização pela engine `GeoSpatial`.
*(Fonte: `docs/caderno-3-sdk/23-mapa-reference-spec.md` §1-2)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/mapa/src/place.ts ---
import type { ULID } from '@plataforma/core';
import type { StoragePort } from '@plataforma/protocol';

/** Coordenada geográfica (WGS84). */
export interface LatLng {
  lat: number; // -90 a 90
  lng: number; // -180 a 180
}

/** Polígono simples (array de vértices, assume fechado). */
export interface GeoPolygon {
  vertices: LatLng[];
}

/** Categoria de lugar. */
export type PlaceCategory =
  | 'address'
  | 'poi'          // point of interest
  | 'store'
  | 'warehouse'
  | 'event_venue'
  | 'delivery_point'
  | 'custom';

/** SPEC:PLACE — lugar indexado espacialmente. */
export interface Place {
  id: ULID;
  /** Coordenadas ou polígono (pelo menos um). */
  location: LatLng;
  polygon?: GeoPolygon;
  /** Endereço textual (opcional). */
  address?: string;
  category: PlaceCategory;
  /** Metadados específicos da categoria. */
  payload: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/** Resultado de consulta espacial. */
export interface SpatialQueryResult {
  place: Place;
  /** Distância em metros do ponto de referência (para queries de proximidade). */
  distance?: number;
}

/** Raio de busca padrão (metros). */
export type BoundingBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** Cria um lugar (SPEC:PLACE). */
export function createPlace(params: {
  location: LatLng;
  polygon?: GeoPolygon;
  address?: string;
  category: PlaceCategory;
  payload?: Record<string, unknown>;
}): Omit<Place, 'id' | 'createdAt' | 'updatedAt'>;

/** Consulta lugares por proximidade a um ponto. */
export async function queryNearby(
  storage: StoragePort,
  center: LatLng,
  radiusMeters: number,
  filters?: { category?: PlaceCategory; limit?: number },
): Promise<SpatialQueryResult[]>;

/** Consulta lugares dentro de um bounding box. */
export async function queryBoundingBox(
  storage: StoragePort,
  box: BoundingBox,
  filters?: { category?: PlaceCategory; limit?: number },
): Promise<SpatialQueryResult[]>;

/** Verifica se uma coordenada está dentro de um polígono (geofencing). */
export function isInsidePolygon(point: LatLng, polygon: GeoPolygon): boolean;

/** Consulta lugares cujo polígono contém o ponto. */
export async function queryContainingPoint(
  storage: StoragePort,
  point: LatLng,
): Promise<Place[]>;

/** Calcula distância em metros entre dois pontos (Haversine). */
export function haversineDistance(a: LatLng, b: LatLng): number;

/** Valida coordenadas (range check). */
export function isValidCoordinate(coord: LatLng): boolean;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/23-mapa-reference-spec.md](../docs/caderno-3-sdk/23-mapa-reference-spec.md) §1-2 — lugar, índice espacial, consultas, geofencing
- [[spec-page]] — página como SPECIFICATION (kind: PAGE) — relevante para renderização GeoSpatial
- [[conector-externo]] — provedor de mapa-base (tiles) é serviço de terceiro

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/23-mapa-reference-spec.md` §1-2
- **[READ]** `docs/conceitos/spec-page.md` — SPEC:PAGE para renderização
- **[READ]** `tasks/T-106.md` — schema nodes/edges, geo_index (R*Tree)
- **[CREATE]** `packages/mapa/src/place.ts` — funções acima
- **[CREATE]** `packages/mapa/tests/place.test.ts`
- **[UPDATE]** `packages/mapa/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/mapa test`.
- [x] **Fora de Escopo:** Renderização real de tiles (depende de provedor externo), geocoding (T-MAP-02), rotas.

Casos de teste (numerados):
1. `createPlace({ location: { lat: -23.5, lng: -46.6 }, category: 'store' })` → objeto Place válido.
2. `isValidCoordinate({ lat: -23.5, lng: -46.6 })` → `true`.
3. `isValidCoordinate({ lat: 91, lng: 0 })` → `false` (lat > 90).
4. `isValidCoordinate({ lat: 0, lng: 181 })` → `false` (lng > 180).
5. `haversineDistance(SP, RJ)` → ~357 km (aproximado, tolerância 5%).
6. `queryNearby(center, 5000)` retorna lugares em raio de 5km.
7. `queryNearby` com `limit: 3` retorna no máximo 3 resultados.
8. `queryBoundingBox(box)` retorna lugares dentro da caixa.
9. `isInsidePolygon(point, square)` → `true` para ponto no centro do quadrado.
10. `isInsidePolygon(point, square)` → `false` para ponto fora.
11. `queryContainingPoint(point)` retorna lugares cujo polígono contém o ponto (geofencing).
12. Lugar sem `polygon` não aparece em `queryContainingPoint` (só lugares com polígono).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** faça chamadas de rede para geocoding — isso é T-MAP-02 (conector Classe E).
> - **NÃO** implemente renderização de mapa no frontend — esta task é só o módulo de dados espaciais.
> - **NÃO** use biblioteca externa de GIS sem verificar se já existe no monorepo.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- **Haversine não é Euclidiana**: `haversineDistance` usa a fórmula de Haversine (esfera), não distância cartesiana. Para queries de proximidade, o `geo_index` (R*Tree) usa bounding boxes em coordenadas; o filtro fino (distância real) é aplicado após o índice.
- **R*Tree lida com coordenadas como 2D**: o índice opera em (lat, lng) como eixos X/Y. Bounding box queries usam ranges simples. O R*Tree não entende curvatura terrestre — isso é compensado na filtragem pós-índice com Haversine.
- **Polígono vs. ponto**: um `Place` pode ter `location` (ponto) e/ou `polygon`. `queryContainingPoint` só considera lugares com polígono; `queryNearby` usa o ponto central.

1. **[TDD]** Crie `packages/mapa/tests/place.test.ts` com casos 1–12.
2. Implemente `isValidCoordinate`, `haversineDistance`, `isInsidePolygon` (funções puras).
3. Implemente `createPlace` (factory).
4. Implemente `queryNearby`, `queryBoundingBox`, `queryContainingPoint` (usam StoragePort com geo_index).
5. Re-exporte em `packages/mapa/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-106 (schema com geo_index) está `draft`**: a estrutura exata do `geo_index` (R*Tree) e como está exposto via `StoragePort` depende de T-106. As queries espaciais usam SQLite R*Tree (`rtree` virtual table) como implementação de referência.
> - **Tiles de mapa-base**: a renderização GeoSpatial depende de provedor externo de tiles. Esta task não inclui renderização.
> **Status:** `draft` até T-106 ficar `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `haversineDistance` calcula corretamente (tolerância no teste SP→RJ)?
- [ ] `queryNearby` filtra por raio real (não bounding box)?
- [ ] `isInsidePolygon` usa ray-casting ou winding number?
- [ ] Geofencing (`queryContainingPoint`) funciona para polígonos convexos e côncavos?
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
