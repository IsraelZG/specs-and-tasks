---
id: T-UI-01
title: "categoria ui no modelo de plugins + manifesto (props/intents/capacidades) — estende T-PL-01"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-PL-01"]
blocks: ["T-UI-02"]
ui: true
---

# T-UI-01 · categoria ui no modelo de plugins + manifesto (props/intents/capacidades) — estende T-PL-01

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (tipos/validação) e `playwright` (sandbox E2E)
- **Capacidade-alvo:** sonnet
- **ui:** true — requer testes Playwright para manifesto rendering bridge

## 1. Objetivo
Estender o modelo de plugins (T-PL-01, SPEC:PLUGIN) com a quarta categoria `ui` (frontend). Plugin `ui` declara no manifesto: **props de entrada** (ligadas pela página via ZEN), **intents de saída** (o que pode emitir) e **capacidades solicitadas** (media plane, WebGPU, câmera) — brokeradas pelo host, nunca ambientes diretos. Distribuição marketplace-only com assinatura como qualquer plugin.
**Fonte:** `caderno-3-sdk/26-plugins-frontend.md §2` — categoria `ui` no modelo de plugins. **Conceitos:** [[plugin]], [[validacao-de-plugin]].

### Contratos exatos

```ts
// --- packages/plugin-sdk/src/ui-manifest.ts 
---

/** Quarta categoria de plugin: renderiza interface no browser. */
export type PluginCategoryUI = 'ui';

/** Prop de entrada declarada no manifesto — ligada pela página via ZEN. */
export interface UIManifestProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'binding';
  /** Expressão ZEN default se a página não sobrescrever. */
  default?: string;
}

/** Intent de saída — o que o plugin pode emitir para o pipeline. */
export interface UIManifestIntent {
  intent: string; // ex.: "navigate", "purchase", "submit_score"
  /** Payload schema (JSON Schema minimal). */
  payloadSchema?: Record<string, unknown>;
}

/** Capacidade solicitada — brokerada pelo host, não acesso direto. */
export type UICapability = 'media_plane' | 'webgpu' | 'camera' | 'microphone' | 'clipboard';

/** Manifesto completo de plugin ui (extends manifesto base de T-PL-01). */
export interface UIPluginManifest {
  category: PluginCategoryUI;
  /** Props de entrada que a página pode ligar via ZEN. */
  props: UIManifestProp[];
  /** Intents que o plugin pode emitir. */
  intents: UIManifestIntent[];
  /** Capacidades solicitadas (brokeradas). */
  capabilities: UICapability[];
  /** Orçamento de recurso declarado (CPU/memória/tempo de frame). */
  resourceBudget: {
    maxCpuMsPerFrame: number;
    maxMemoryMb: number;
    maxMessagesPerSecond: number;
  };
  /** Esquema da bridge postMessage (tipagem forte). */
  bridgeSchema: {
    hostToPlugin: Record<string, unknown>; // JSON Schema
    pluginToHost: Record<string, unknown>; // JSON Schema
  };
}

/** Validador de manifesto ui — verifica estrutura e constraints. */
export function validateUIManifest(manifest: unknown): manifest is UIPluginManifest;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/26-plugins-frontend.md](../docs/caderno-3-sdk/26-plugins-frontend.md) — §2 (categoria `ui`), §3 (sandbox e envelope, bridge tipada), §6 (tiers de validação)
- [[plugin]] — modelo de plugin (4 categorias, runtime, distribuição)
- [[validacao-de-plugin]] — gate de oferta com 4 tiers de validação
- T-PL-01 — `SPEC:PLUGIN` + manifesto base + verificação de assinatura (contratos base ainda `draft` → ver Seção 6)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-sdk/src/manifest.ts` — manifesto base de T-PL-01 (se já existir; senão, definir placeholder compatível)
- **[CREATE]** `packages/plugin-sdk/src/ui-manifest.ts` — `UIPluginManifest`, tipos auxiliares, `validateUIManifest`
- **[CREATE]** `packages/plugin-sdk/tests/ui-manifest.test.ts` — validação de manifesto + schemas
- **[CREATE]** `packages/plugin-sdk/tests/ui-manifest.e2e.ts` — Playwright: carrega manifesto em sandbox mínimo
- **[UPDATE]** `packages/plugin-sdk/src/index.ts` — re-exportar `ui-manifest.ts`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (validação) + Playwright (sandbox E2E).
- [x] **Ambiente do Teste:** Node puro (Vitest) + headless Chromium (Playwright).
- [x] **Fora de Escopo:** Implementação real do host de sandbox (T-UI-02), renderização de plugin real.

Casos de teste (Vitest):
1. `validateUIManifest` aceita manifesto completo com `category: 'ui'`, props, intents, capabilities, resourceBudget, bridgeSchema.
2. `validateUIManifest` rejeita manifesto sem `category`.
3. `validateUIManifest` rejeita `resourceBudget.maxCpuMsPerFrame <= 0`.
4. Schema `bridgeSchema.hostToPlugin` e `bridgeSchema.pluginToHost` devem ser objetos não-vazios.
5. `UICapability` só aceita valores do union literal.
6. `UIManifestProp.default` é opcional — manifesto sem default em prop compila.

Casos de teste (Playwright):
7. Manifesto válido carregado em iframe sandbox — bridge `postMessage` inicial estabelecida.
8. Manifesto com `capabilities: ['camera']` solicita permissão — host nega (brokerado), plugin não acessa diretamente.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente o host de sandbox (T-UI-02). Apenas valide o manifesto e faça checks estruturais.
> - **NÃO** modifique o modelo base de plugins em T-PL-01 — apenas estenda com `ui`.

### Pegadinhas conhecidas
- `UICapability` é union literal, não `string[]`. TypeScript não restringe arrays de strings a literais automaticamente — `validateUIManifest` deve fazer runtime check com `Set` de valores válidos.
- `resourceBudget` usa milissegundos (`maxCpuMsPerFrame`) — não confundir com microssegundos.
- `bridgeSchema` usa JSON Schema objects como types — o validador deve checar que são objetos com pelo menos 1 chave (não vazios), mas não precisa validar schema completo (fora de escopo).

1. **[TDD]** Crie `packages/plugin-sdk/tests/ui-manifest.test.ts` com casos 1–6 (Vitest).
2. Crie `packages/plugin-sdk/src/ui-manifest.ts` com tipos + `validateUIManifest`.
3. Crie `packages/plugin-sdk/tests/ui-manifest.e2e.ts` com caso 7 (Playwright, carga de manifesto em iframe mínimo).
4. Re-exporte em `packages/plugin-sdk/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO — requer definição do arquiteto:**
> - **T-PL-01 (SPEC:PLUGIN base) está `draft`.** Os tipos base do manifesto (`PluginManifest`, `PluginCategory`, assinatura) ainda não estão fixados. Esta task define a extensão `ui` com tipos próprios (`UIPluginManifest`) que serão compatibilizados quando T-PL-01 for endurecida. O worker deve usar um placeholder `interface BasePluginManifest { id: string; version: string; category: string; }` como contrato mínimo até T-PL-01 fornecer os tipos reais.
> **Status:** `draft` até T-PL-01 chegar a `ready` para fixar os tipos base. Contratos `ui` já estão derivados de fonte e prontos para composição.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/plugin-sdk build
pnpm --filter @plataforma/plugin-sdk test
pnpm --filter @plataforma/plugin-sdk test:e2e   # Playwright
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] `UIPluginManifest` com `category: 'ui'`, props, intents, capabilities, resourceBudget, bridgeSchema?
- [ ] `validateUIManifest` rejeita manifestos inválidos (sem category, budget <= 0, bridgeSchema vazio)?
- [ ] `UICapability` union literal com valores corretos?
- [ ] Testes Vitest cobrem validação; Playwright cobre carga de manifesto em sandbox?
- [ ] `pnpm --filter @plataforma/plugin-sdk build` e `test` verdes?

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
- **[2026-07-03T20:03]** - *system* - `[Triado]`: Triagem em lote do backlog
