---
id: T-UI-04
title: "tier estrito de validacao + vetores (DOM externo/rede nao declarada, intent acima do privilegio)"
status: draft
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-UI-01", "T-UI-02", "T-UI-03"]
blocks: []
ui: true
---

# T-UI-04 · tier estrito de validacao + vetores (DOM externo/rede nao declarada, intent acima do privilegio)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (validação) + `playwright` (vetores E2E)
- **Capacidade-alvo:** sonnet
- **ui:** true — requer Playwright para vetores de DOM/rede em sandbox

## 1. Objetivo
Implementar o tier mais estrito de validação para plugins `ui` iframe de código arbitrário/3D pesado. Análise de recurso, fingerprinting, abuso de GPU. Vetores adversariais testados: plugin tentando acessar DOM externo, abrir rede não declarada, emitir intent acima do privilégio — todos devem ser bloqueados pelo sandbox + validador.
**Fonte:** `caderno-3-sdk/26-plugins-frontend.md §6-§7`. **Conceitos:** [[validacao-de-plugin]], [[plugin]].

### Contratos essenciais

```ts
// packages/marketplace/src/validation/ui-validation.ts
export type ValidationTier = 'light' | 'authorship' | 'medium' | 'strict';
export interface StrictValidationResult { passed: boolean; violations: string[]; resourceProfile?: { estimatedCpuMs: number; estimatedMemoryMb: number; gpuFingerprintRisk: 'low'|'medium'|'high'; }; }
export function validateStrictTier(manifest: UIPluginManifest, bundle: ArrayBuffer): StrictValidationResult;
export interface AdversarialVector { name: string; description: string; expectedBehavior: 'blocked' | 'rejected' | 'throttled'; }
export const UI_ADVERSARIAL_VECTORS: AdversarialVector[]; // DOM externo, rede não declarada, intent acima do privilégio
```
**File paths:** `packages/marketplace/src/validation/ui-validation.ts` (CREATE), `packages/marketplace/tests/ui-validation.test.ts` (CREATE, Vitest), `packages/marketplace/tests/ui-validation.e2e.ts` (CREATE, Playwright), `packages/marketplace/src/index.ts` (UPDATE).

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/26-plugins-frontend.md](../docs/caderno-3-sdk/26-plugins-frontend.md) — §6 (tiers de validação), §7 (limites honestos: custo, escape hatch)
- [[validacao-de-plugin]] — 4 tiers: spec page, first-party, sandbox, strict
- Deps: T-UI-01 (`UIPluginManifest`), T-UI-02 (`SandboxHost`), T-UI-03 (`GameEngine`)

**Testes (8 casos):** 1. `validateStrictTier` com bundle limpo → `passed: true`. 2. Bundle com acesso a `document.cookie` → `violations` inclui DOM externo. 3. Bundle com `fetch('https://externo.com')` → violação de rede não declarada. 4. `resourceProfile.gpuFingerprintRisk: 'high'` para WebGPU não declarado. 5. Plugin tenta `postMessage` para outro iframe → bloqueado (sem canal lateral, §3.6). 6. Intent com privilégio acima do declarado no manifesto → rejeitado pelo pipeline. 7. Playwright: iframe malicioso tenta acessar `window.top` → bloqueado. 8. Playwright: plugin sem `camera` no manifesto tenta `getUserMedia` → negado.

**Pegadinhas:** Análise de bundle é estática (regex/AST), não sandbox execution. Fingerprinting de GPU: detecta uso de WebGL/WebGPU via análise de código. Tier estrito é o único que faz análise de recurso pré-listing. O validador de marketplace aplica o tier conforme `[[modalidade-de-rede]]`.

**Gate:** `pnpm --filter @plataforma/marketplace build && pnpm --filter @plataforma/marketplace test && pnpm --filter @plataforma/marketplace test:e2e`

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:** T-UI-01, T-UI-02, T-UI-03 sendo endurecidas nesta passada. Validador estrito depende de `UIPluginManifest` e `SandboxHost`. **Status:** `draft` até deps implementadas.


## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `validateStrictTier` analisa bundle e detecta DOM externo?
- [ ] Rede não declarada detectada por análise estática?
- [ ] GPU fingerprinting avalia risco (low/medium/high)?
- [ ] Playwright: iframe malicioso bloqueado (DOM, getUserMedia)?
- [ ] Intent acima do privilégio rejeitada pelo pipeline?
- [ ] `pnpm --filter @plataforma/marketplace build` e `test` verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/marketplace build
pnpm --filter @plataforma/marketplace test
pnpm --filter @plataforma/marketplace test:e2e
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
