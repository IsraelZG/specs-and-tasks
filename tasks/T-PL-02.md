---
id: T-PL-02
title: "sandbox browser (Worker/WASM, sem autoridade ambiente) + bridge de componente"
status: draft:triaged
complexity: 5
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PL-01"]
blocks: ["T-PL-06"]
ui: true
capacity_target: sonnet
---

# T-PL-02 · sandbox browser (Worker/WASM, sem autoridade ambiente) + bridge de componente

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (JSDOM com Web Worker mock) + `playwright` (smoke E2E com Worker real)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o sandbox para plugins tipo `browser`: execução em Worker/WASM isolado, sem DOM (exceto via bridge de componente declarado), sem rede (exceto portas declaradas), sem storage direto. A bridge de componente permite que plugins `ui` enviem mensagens tipadas para o host renderizar componentes do catálogo (RFC-008 §4).

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6.1 (sem autoridade ambiente: Worker/WASM, sem DOM/rede/storage)
- Enriquecimento: [[plugin]] — tipo `browser`; [[validacao-de-plugin]] — tier médio para UI sandbox; [[capacidade-de-runtime]] — runtime browser

### Contratos TS (derivados do RAG §6)

```ts
// --- packages/plugins/src/sandbox-browser.ts 
---
import type { PluginManifest, PluginCapability } from './schema';

export interface SandboxOptions {
  /** Portas de rede concedidas (host:port). Vazio = sem rede. */
  allowedPorts: string[];
  /** Orçamento de CPU em ms por ciclo. */
  cpuBudgetMs: number;
  /** Memória máxima (para WASM). */
  maxMemoryMb: number;
}

export interface SandboxBridgeMessage {
  type: string;
  payload: unknown;
  /** ID para correlacionar request/response. */
  correlationId: string;
}

export interface ComponentBridgeMessage extends SandboxBridgeMessage {
  type: 'render_component' | 'update_props' | 'component_event';
  component: string;     // nome do catálogo
  props?: Record<string, unknown>;
}

export type BridgeMessageHandler = (msg: SandboxBridgeMessage) => void;

export interface BrowserSandbox {
  /**
   * Cria um Worker (ou WASM instance) isolado para executar o plugin.
   * Retorna porta de comunicação (postMessage) e handle para terminar.
   */
  create(
    manifest: PluginManifest,
    bundleUrl: string,
    options: SandboxOptions,
    bridgeHandler: BridgeMessageHandler
  ): Promise<SandboxHandle>;
}

export interface SandboxHandle {
  /** Envia mensagem para o plugin no sandbox. */
  postMessage(msg: SandboxBridgeMessage): void;
  /** Registra handler para mensagens do sandbox. */
  onMessage(handler: BridgeMessageHandler): void;
  /** Termina o sandbox e libera recursos. */
  terminate(): void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/12-plugins-e-computacao.md](../docs/caderno-3-sdk/12-plugins-e-computacao.md) §6.1 (sem autoridade ambiente, Worker/WASM, bridge de componente)
- [docs/conceitos/plugin.md](../docs/conceitos/plugin.md)
- [docs/conceitos/validacao-de-plugin.md](../docs/conceitos/validacao-de-plugin.md)
- [docs/conceitos/capacidade-de-runtime.md](../docs/conceitos/capacidade-de-runtime.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugins/src/schema.ts` (T-PL-01)
- **[READ]** `packages/plugins/src/loader.ts` (T-PL-01)
- **[READ]** `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6
- **[CREATE]** `packages/plugins/src/sandbox-browser.ts` — BrowserSandbox, SandboxHandle
- **[CREATE]** `packages/plugins/src/bridge.ts` — bridge de componente tipada
- **[CREATE]** `packages/plugins/tests/sandbox-browser.test.ts`
- **[UPDATE]** `packages/plugins/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (JSDOM com Worker mock) + Playwright (smoke com Worker real)
- [x] **Ambiente do Teste:** JSDOM / Headless browser
- [x] **Fora de Escopo:** Sandbox node (T-PL-03), ComputePort (T-PL-04)

Casos de teste (numerados):
1. Cria sandbox para plugin `browser` → `SandboxHandle` retornado com `postMessage` funcional.
2. Mensagem enviada via `postMessage` → handler do plugin recebe (mock).
3. Mensagem do plugin (render_component) → `bridgeHandler` invocado com componente e props.
4. `terminate()` → sandbox destruído, mensagens subsequentes são ignoradas.
5. Sem DOM: plugin não tem acesso a `document` ou `window` (ambiente Worker).
6. Sem rede não declarada: `fetch` para porta não listada em `allowedPorts` → bloqueado.
7. `allowedPorts: ["localhost:3000"]` → `fetch("http://localhost:3000/api")` permitido.
8. Sem storage: `localStorage.setItem()` → erro ou no-op.
9. Orçamento de CPU estourado → sandbox pausado/terminado.
10. Plugin `ui`: bridge de componente envia `render_component` e host renderiza (Playwright smoke).
11. Mensagem bridge com `component` fora do catálogo → erro controlado, sem render.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO conceda acesso ao DOM — Worker é isolado.
> - NÃO implemente o host de componentes — só a bridge de mensageria tipada.
> - NÃO implemente sandbox node (T-PL-03).

### Pegadinhas conhecidas
- Web Workers em JSDOM precisam de mock (vitest não tem Worker real). Use `vitest-webworker` ou mock manual.
- A bridge de componente é postMessage tipada — o host valida que `component` existe no catálogo antes de renderizar.
- `allowedPorts` vazio significa SEM rede. Um `fetch` para qualquer URL deve falhar.
- WASM é carregado via `WebAssembly.instantiateStreaming` dentro do Worker — o bundle URL deve ser same-origin ou ter CORS.

1. **[TDD]** Crie `packages/plugins/tests/sandbox-browser.test.ts` com casos 1–9 (RED).
2. Implemente `packages/plugins/src/sandbox-browser.ts` (Worker wrapper).
3. Implemente `packages/plugins/src/bridge.ts` (mensageria tipada).
4. Atualize `packages/plugins/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.
6. Smoke Playwright (casos 10–11).

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6.1 — OK
- `docs/conceitos/plugin.md` — OK
- `docs/conceitos/validacao-de-plugin.md` — OK
- `docs/conceitos/capacidade-de-runtime.md` — OK
- `packages/plugins/src/schema.ts` — T-PL-01 (dep)
- `packages/plugins/src/loader.ts` — T-PL-01 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 11 casos de teste passam (vitest + Playwright)?
- [ ] Plugin NÃO tem acesso ao DOM?
- [ ] Rede só funciona nas portas declaradas?
- [ ] Storage é bloqueado?
- [ ] `terminate()` limpa recursos?
- [ ] Bridge de componente valida nome do catálogo?

### Verificação automática
```bash
pnpm --filter @plataforma/plugins build
pnpm --filter @plataforma/plugins test
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
