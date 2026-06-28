---
id: T-UI-03
title: "componente rico GameEngine (2D/3D) data-driven com pontos ZEN + emissao de intent"
status: draft
complexity: 5
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-UI-01", "T-UI-02"]
blocks: ["T-UI-04"]
ui: true
---

# T-UI-03 · componente rico GameEngine (2D/3D) data-driven com pontos ZEN + emissao de intent

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (tipos) + `playwright` (canvas E2E)
- **Capacidade-alvo:** sonnet
- **ui:** true — requer Playwright para renderização de canvas + testes de intent

## 1. Objetivo
Implementar componente rico first-party `GameEngine` (2D/3D) como componente do catálogo (RFC-006), data-driven via spec: cenas, entidades, regras e níveis são dados + ZEN. O loop de render pesado vive no componente provido. Usa Phaser/PixiJS (2D) e three.js/Babylon (3D). Expõe pontos de customização ZEN e emite intents (pontuação, conquista, compra in-game).
**Fonte:** `caderno-3-sdk/26-plugins-frontend.md §5` — games como páginas. **Conceitos:** [[plugin]].

### Contratos essenciais

```ts
// packages/rich-components/src/GameEngine/types.ts
export type GameDimension = '2d' | '3d';
export interface GameScene { id: string; entities: GameEntity[]; rules: ZenExpression[]; }
export interface GameEntity { id: string; type: string; props: Record<string, unknown>; }
export interface GameEngineProps { dimension: GameDimension; scenes: GameScene[]; zenOverrides?: Record<string, string>; onIntent(intent: string, payload: unknown): void; }
```
**File paths:** `packages/rich-components/src/GameEngine/GameEngine.tsx` (CREATE), `packages/rich-components/src/GameEngine/GameEngine.test.tsx` (CREATE, vitest + canvas mock), `packages/rich-components/src/GameEngine/GameEngine.e2e.ts` (CREATE, Playwright), `packages/rich-components/src/index.ts` (UPDATE).

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/26-plugins-frontend.md](../docs/caderno-3-sdk/26-plugins-frontend.md) — §5 (games como páginas, GameEngine, data-driven, ZEN + intents)
- [[plugin]] — componente rico first-party no catálogo

**Testes (8 casos):** 1. GameEngine 2D renderiza canvas. 2. GameEngine 3D renderiza cena three.js. 3. ZEN expression avalia e modifica entidade. 4. `onIntent` chamado ao completar nível. 5. Scene sem entidades renderiza sem erro. 6. Troca de scene limpa estado anterior. 7. Entidade com `props` inválidos → erro tratado. 8. Playwright: canvas renderizado, intents capturadas.

**Pegadinhas:** Phaser/PixiJS esperam DOM container; three.js precisa de WebGL context. ZEN expressions usam `$entity.props` — avaliador puro. Intents são chamadas async — `onIntent` deve ser `await`-able.

**Gate:** `pnpm --filter @plataforma/rich-components build && pnpm --filter @plataforma/rich-components test && pnpm --filter @plataforma/rich-components test:e2e`

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:** T-UI-01 e T-UI-02 estão sendo endurecidas nesta passada (ainda `draft`). GameEngine depende de `UIPluginManifest` para intents e de `SandboxHost`... não, GameEngine é first-party, não plugin ui — roda no catálogo, não em sandbox. **Status:** `draft` até deps estarem implementadas.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] GameEngine 2D e 3D renderizam canvas com Phaser/three.js?
- [ ] ZEN expressions avaliam e modificam entidades corretamente?
- [ ] Intents (pontuação, conquista, compra) emitidas via `onIntent`?
- [ ] Playwright: canvas renderizado, intents capturadas?
- [ ] `pnpm --filter @plataforma/rich-components build` e `test` verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/rich-components build
pnpm --filter @plataforma/rich-components test
pnpm --filter @plataforma/rich-components test:e2e
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

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
