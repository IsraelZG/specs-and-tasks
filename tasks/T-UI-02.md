---
id: T-UI-02
title: "host de sandbox (iframe + Worker/OffscreenCanvas, bridge postMessage, orcamento, brokering)"
status: draft:triaged
complexity: 5
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-UI-01"]
blocks: ["T-UI-03"]
ui: true
---

# T-UI-02 · host de sandbox (iframe + Worker/OffscreenCanvas, bridge postMessage, orcamento, brokering)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (tipos) e `playwright` (sandbox E2E)
- **Capacidade-alvo:** sonnet
- **ui:** true — requer Playwright para testes de isolamento de sandbox

## 1. Objetivo
Implementar o host de sandbox que isola plugins `ui` em iframe sandbox (UI completa) ou Worker + OffscreenCanvas (render headless), com bridge `postMessage` tipada e autenticada, orçamento de recurso imposto (CPU/memória/tempo de frame), e brokering de capacidades. O plugin roda em origin nulo (`sandbox` sem `allow-same-origin`), sem DOM fora de sua fronteira, sem rede exceto portas declaradas, sem comunicação direta entre plugins.
**Fonte:** `caderno-3-sdk/26-plugins-frontend.md §3` — sandbox e envelope (7 regras). **Conceitos:** [[plugin]], [[validacao-de-plugin]].

### Contratos exatos

```ts
// --- packages/ui-sandbox/src/sandbox-host.ts 
---

import type { UIPluginManifest } from '@plataforma/plugin-sdk';

/** Modo de renderização do sandbox. */
export type SandboxMode = 'iframe' | 'worker-offscreen';

/** Estado do sandbox. */
export type SandboxState = 'loading' | 'active' | 'throttled' | 'suspended' | 'crashed';

/** Métricas de recurso do sandbox. */
export interface SandboxMetrics {
  cpuMsThisFrame: number;
  memoryMb: number;
  messagesThisSecond: number;
  state: SandboxState;
}

/** Configuração do host de sandbox. */
export interface SandboxHostConfig {
  mode: SandboxMode;
  manifest: UIPluginManifest;
  /** Container DOM onde o iframe será montado (modo iframe). */
  container?: HTMLElement;
  /** Canvas para render offscreen (modo worker-offscreen). */
  canvas?: HTMLCanvasElement;
}

/** Bridge tipada e autenticada entre host e plugin. */
export interface SandboxBridge {
  /** Envia mensagem tipada do host para o plugin. */
  postToPlugin(message: Record<string, unknown>): void;
  /** Registra handler para mensagens do plugin (tipadas pelo bridgeSchema). */
  onPluginMessage(handler: (message: Record<string, unknown>) => void): void;
  /** Anti-flood: rate-limit de mensagens por segundo. */
  readonly messageRateLimit: number;
  /** Desconecta a bridge. */
  disconnect(): void;
}

/** Host de sandbox — isola e gerencia um plugin ui. */
export interface SandboxHost {
  readonly id: string;
  readonly state: SandboxState;
  readonly bridge: SandboxBridge;

  /** Inicializa o sandbox com o manifesto e configuração. */
  initialize(config: SandboxHostConfig): Promise<void>;

  /** Suspende o plugin (estouro de recurso ou comando externo). */
  suspend(reason: string): void;

  /** Retoma plugin suspenso. */
  resume(): Promise<void>;

  /** Métricas atuais de recurso. */
  getMetrics(): SandboxMetrics;

  /** Destroi o sandbox e libera recursos. */
  destroy(): void;
}

/** Factory de SandboxHost. */
export function createSandboxHost(id: string): SandboxHost;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/26-plugins-frontend.md](../docs/caderno-3-sdk/26-plugins-frontend.md) — §3 completo (7 regras: isolamento, teto de abuso, orçamento, bridge tipada, anti-flood, sem canal lateral, origin nulo)
- [[plugin]] — modelo de plugins, runtime browser
- [[validacao-de-plugin]] — tiers de validação (sandbox = tier médio)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-sdk/src/ui-manifest.ts` — `UIPluginManifest`, `UICapability` (T-UI-01)
- **[CREATE]** `packages/ui-sandbox/src/sandbox-host.ts` — `SandboxHost`, `SandboxBridge`, `createSandboxHost`
- **[CREATE]** `packages/ui-sandbox/src/bridge.ts` — implementação `MessageChannel` dedicado com rate-limit + verificação de schema
- **[CREATE]** `packages/ui-sandbox/tests/sandbox-host.test.ts` — Vitest: stubs de sandbox, métricas, estados
- **[CREATE]** `packages/ui-sandbox/tests/sandbox.e2e.ts` — Playwright: iframe real, isolamento, anti-flood, brokering
- **[UPDATE]** `packages/ui-sandbox/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (lógica) + Playwright (E2E sandbox).
- [x] **Ambiente do Teste:** Node puro (Vitest) + headless Chromium com iframe sandbox (Playwright).
- [x] **Fora de Escopo:** Renderização de plugin real, capacidades reais (câmera, WebGPU).

Casos de teste (Vitest):
1. `createSandboxHost` cria host com estado inicial `loading`.
2. `initialize()` com config válida → estado `active`.
3. `suspend('cpu_budget_exceeded')` → estado `suspended`.
4. `resume()` após suspend → estado `active`.
5. `getMetrics()` retorna `SandboxMetrics` com valores ≥ 0.
6. `destroy()` → libera bridge, estado `crashed` (terminal).

Casos de teste (Playwright):
7. Iframe sandbox carregado com origin nulo — `localStorage` inacessível.
8. Plugin tenta acessar `window.parent.DOM` → bloqueado pelo sandbox.
9. Anti-flood: plugin envia > `maxMessagesPerSecond` → throttled, depois suspended.
10. Dois plugins na mesma página não conseguem se comunicar diretamente.
11. Bridge valida mensagens contra `bridgeSchema` — mensagem fora do schema descartada.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente o GameEngine (T-UI-03) nem o tier estrito (T-UI-04). Apenas o host de sandbox.
> - **NÃO** use `allow-same-origin` no atributo `sandbox` do iframe.
> - **NÃO** permita `window.postMessage` global — use `MessageChannel` dedicado.

### Pegadinhas conhecidas
- O atributo `sandbox` do iframe deve ser `"allow-scripts"` apenas — sem `allow-same-origin`, `allow-popups`, `allow-forms`.
- `MessageChannel` cria duas portas (`port1`, `port2`). O host fica com `port1`; `port2` é transferido para o iframe via `postMessage` inicial (a única mensagem pelo canal global).
- Rate-limit é por segundo, não por frame. Use `performance.now()` para janela deslizante de 1s.
- `OffscreenCanvas` só funciona em Worker — o fallback para modo `worker-offscreen` não é compatível com todos os browsers.

1. **[TDD]** Crie `packages/ui-sandbox/tests/sandbox-host.test.ts` com casos 1–6 (Vitest).
2. Crie `packages/ui-sandbox/src/bridge.ts`: `MessageChannel` dedicado, rate-limit, validação de schema.
3. Crie `packages/ui-sandbox/src/sandbox-host.ts`: `SandboxHost` com máquina de estados.
4. Crie `packages/ui-sandbox/tests/sandbox.e2e.ts` com casos 7–11 (Playwright).
5. Re-exporte em `packages/ui-sandbox/src/index.ts`.
6. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:**
> - **T-UI-01 está `draft`.** Os tipos `UIPluginManifest` e `UICapability` estão definidos nesta mesma passada mas ainda não implementados. O worker de T-UI-02 deve usar os tipos da Seção 1 de T-UI-01 como contrato, com placeholder caso o arquivo ainda não exista.
> **Status:** `draft` até T-UI-01 estar implementada. Contratos do sandbox já estão derivados de fonte.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/ui-sandbox build
pnpm --filter @plataforma/ui-sandbox test
pnpm --filter @plataforma/ui-sandbox test:e2e
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] `SandboxHost` com máquina de estados (loading → active → throttled → suspended → crashed)?
- [ ] Bridge usa `MessageChannel` dedicado (não `window.postMessage` global)?
- [ ] Anti-flood: rate-limit aplicado, suspensão após persistência?
- [ ] Playwright: iframe com origin nulo, sem localStorage, sem DOM externo?
- [ ] `pnpm --filter @plataforma/ui-sandbox build` e `test` verdes?

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
