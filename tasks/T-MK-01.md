---
id: T-MK-01
title: "SPECs base PRODUCT/PRODUCT_LISTING + classes de liquidacao"
status: ready
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-004"] # IDs de tarefas que bloqueiam esta
blocks: ["T-MK-02", "T-MK-03", "T-MK-04", "T-MK-05", "T-MK-06"] # IDs de tarefas que esta bloqueia
---

# T-MK-01 · SPECs base PRODUCT/PRODUCT_LISTING + classes de liquidacao

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir os tipos SPEC:PRODUCT e SPEC:PRODUCT_LISTING no pacote `@plataforma/marketplace`, modelar
o catálogo canônico vs. oferta como distinção por grafo, e implementar as classes de liquidação
que determinam o que a compra entrega. Fonte: `caderno-3-sdk/15-marketplace-reference-spec.md §1, §2`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/marketplace/src/specs.ts

export interface ProductSpec {
  /** Tipo de SPEC: sempre "PRODUCT". */
  kind: "PRODUCT";
  /** Nome canônico do produto (ex.: "Tênis Runner X"). */
  name: string;
  /** Descrição. */
  description: string;
  /** Classe de liquidação (§2). */
  liquidationClass: LiquidationClass;
  /** Atributos customizados (varia por classe). */
  attributes: Record<string, unknown>;
}

export interface ProductListingSpec {
  /** Tipo de SPEC: sempre "PRODUCT_LISTING". */
  kind: "PRODUCT_LISTING";
  /** Preço (na moeda do vendedor). */
  price: Money;
  /** Quantidade disponível (para bens escassos). */
  quantity?: number;
  /** Condição (new, used, etc.). */
  condition?: "new" | "used" | "refurbished";
  /** ID do vendedor (profile). */
  sellerId: string;
}

export type LiquidationClass =
  | "bem_serializado"
  | "bem_digital"
  | "acesso_licenca"
  | "assinatura"
  | "servico"
  | "reserva_capacidade"
  | "instrumento_financeiro";

export interface LiquidationRule {
  /** O que o CREDITS materializa para o comprador. */
  delivers: "inventory_transfer" | "permission_grant" | "role_activation" | "workflow_execution" | "capacity_reservation" | "financial_instrument";
  /** Se o item é escasso (decrementa inventário). */
  scarce: boolean;
  /** Descrição human-readable. */
  description: string;
}

export const LIQUIDATION_RULES: Record<LiquidationClass, LiquidationRule>;

export interface Money {
  amount: number;       // em centavos/unidade mínima
  currency: string;     // "BRL", "USD", "POINTS"
}

export interface ProductCatalog {
  /** Registra SPEC:PRODUCT (produto canônico). */
  registerProduct(spec: ProductSpec): Promise<string>; // retorna entity_id
  /** Cria listing vinculada a produto canônico via BELONGS_TO. */
  createListing(productEntityId: string, listing: ProductListingSpec): Promise<string>;
  /** Lista todas as listings de um produto, ordenadas por ranking. */
  listListings(productEntityId: string): Promise<ProductListingSpec[]>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §1 — Item negociável: máquina genérica (produto canônico, listing, grafo)
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §2 — Classes de liquidação (7 classes canônicas)
- [[classe-de-liquidacao]] — Definição canônica das classes de liquidação
- [[item-negociavel]] — Modelo de item negociável sobre grafo
- [[credits]] — Aresta CREDITS é o que materializa a entrega da classe
- [[saga]] — Checkout cross-domínio (T-MK-03) usa estas SPECs
- [[instrumento-financeiro]] — Classe `instrumento_financeiro` (T-MK-05)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/15-marketplace-reference-spec.md` §1, §2, §10
- **[READ]** `docs/conceitos/classe-de-liquidacao.md`
- **[READ]** `docs/conceitos/item-negociavel.md`
- **[READ]** `packages/protocol/src/ports.ts` — StoragePort (T-004)
- **[CREATE]** `packages/marketplace/src/specs.ts` — interfaces + regras de liquidação
- **[CREATE]** `packages/marketplace/src/product-catalog.ts` — implementação ProductCatalog
- **[CREATE]** `packages/marketplace/tests/specs.test.ts` — testes
- **[UPDATE]** `packages/marketplace/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro — lógica de negócio, sem DOM).
- [x] **Ambiente do Teste:** Node puro.
- [x] **Fora de Escopo:** Integração com grafo real (T-108). Checkout/saga (T-MK-03). Persistência real (T-106).

Casos de teste (numerados):
1. `LIQUIDATION_RULES["bem_serializado"]` → `{ delivers: "inventory_transfer", scarce: true }`.
2. `LIQUIDATION_RULES["bem_digital"]` → `{ delivers: "permission_grant", scarce: false }`.
3. `LIQUIDATION_RULES["assinatura"]` → `{ delivers: "role_activation", scarce: false }`.
4. `ProductCatalog.registerProduct({ kind: "PRODUCT", liquidationClass: "bem_serializado", ... })` → retorna entity_id.
5. `ProductCatalog.createListing(productId, listing)` → cria listing vinculada.
6. `ProductCatalog.listListings(productId)` → retorna listings ordenadas.
7. Classe de liquidação inválida → rejeitada com erro.
8. Money: `{ amount: 1990, currency: "BRL" }` representa R$ 19,90.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie tipo de nó novo — SPEC:PRODUCT e SPEC:PRODUCT_LISTING são SPECIFICATION com kind específico, não tipos de entidade separados.
> - **NÃO** implemente checkout ou saga — esta task é só SPECs + classes de liquidação.
> - **NÃO** invente classes de liquidação além das 7 canônicas — a lista é extensível via `registerLiquidationClass()`, mas as 7 são built-in.

### Pegadinhas conhecidas
- **Catálogo vs. oferta é distinção por grafo, não por flag (§1.1):** `SPEC:PRODUCT` é o produto canônico; `SPEC:PRODUCT_LISTING` é a oferta de um vendedor, ligada ao produto via aresta `BELONGS_TO`. Não coloque `is_canonical: boolean` no payload.
- **Classes podem compor (§2):** assinatura de acesso a acervo digital = `assinatura` + `acesso_licenca`. A composição é declarada na SPEC, não no código.
- **Money é sempre inteiro (centavos):** nunca use float para dinheiro. `amount: 1990` = R$ 19,90. Formatação para exibição usa jurisdição/locale.

1. **[TDD]** Crie `packages/marketplace/tests/specs.test.ts` com os 8 casos.
2. Implemente `packages/marketplace/src/specs.ts` com interfaces, `LIQUIDATION_RULES`, `Money`.
3. Implemente `packages/marketplace/src/product-catalog.ts` com registerProduct, createListing, listListings (stubs de storage).
4. Re-exporte em `packages/marketplace/src/index.ts`.
5. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] 7 classes de liquidação canônicas definidas com regras corretas?
- [ ] SPEC:PRODUCT e SPEC:PRODUCT_LISTING são SPECIFICATION (não tipos de nó novos)?
- [ ] Catálogo e listing são distintos por grafo (BELONGS_TO), não por flag?
- [ ] Money usa inteiro (centavos), nunca float?
- [ ] `pnpm test` verde com 8 casos?

### Verificação automática
```bash
pnpm --filter @plataforma/marketplace build
pnpm --filter @plataforma/marketplace test
```

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
- **[2026-07-03T20:03]** - *system* - `[Endurecido]`: Endurecimento em lote (dependencies done/empty)
- **[2026-07-03T20:07]** - *system* - `[Promovida p/ ready]`: Promovida pelo arquiteto (arquiteto-promover)
