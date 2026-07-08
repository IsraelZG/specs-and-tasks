---
id: T-IA-04
title: "persona de agente com ASSET:ROLE delegado + geracao de SPEC:PAGE validada"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-IA-03", "T-501"]
blocks: ["T-IA-06"]
capacity_target: sonnet
---

# T-IA-04 · persona de agente com ASSET:ROLE delegado + geracao de SPEC:PAGE validada

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar persona de agente de IA: atua via `CONTENT:INTENT` com `ASSET:ROLE` delegado e escopado pelo principal. Teto de abuso: agente não faz nada que o principal não possa. Delegação explícita e revogável. Geração de `SPEC:PAGE` via intent, validada pelo validador estático (RFC-008 A.7). Trilha de procedência: todo fato registra modelo/principal.
**Fonte:** `caderno-3-sdk/14-ia-rag-e-agentes.md §5`. **Conceitos:** [[agente-de-ia]], [[agente-de-sistema]].

### Contratos essenciais

```ts
// packages/ai-agent/src/agent-persona.ts
export interface AgentDelegation { principalId: string; agentId: string; roleId: string; // ASSET:ROLE delegado
  scope: { allowedNodeTypes: string[]; maxValueLimit?: number; }; expiresAt: number; }
export interface AgentIntent { delegation: AgentDelegation; intentType: string; payload: Record<string, unknown>; modelId: string; }
export interface AgentPersona { readonly agentId: string;
  proposeIntent(intent: AgentIntent): Promise<{ accepted: boolean; factId?: string; rejectionReason?: string }>;
  generatePageSpec(prompt: string, catalogMetadata: Record<string, unknown>): Promise<Record<string, unknown>>; }
export function validateDelegation(delegation: AgentDelegation, currentTime: number): { valid: boolean; reason?: string; };
```
**File paths:** `packages/ai-agent/src/agent-persona.ts` (CREATE), `packages/ai-agent/tests/agent-persona.test.ts` (CREATE), `packages/ai-agent/src/index.ts` (UPDATE).

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §T1](../docs/mecanica-de-telas.md) — a persona delegada desta task é o substrato do **assistente contextual presente em todo módulo** (3 portas de entrada: palette ⌘K, "✦ Assistente" na toolbar, seleção→menu flutuante). Requisitos de UI que o contrato precisa suportar: proposta-first (nada se auto-aplica; Aceitar emite intent com atribuição de delegado), escopo/persona **visíveis ao lado da proposta**, streaming cancelável, recusa fora de escopo como estado (validado no mockup A5). Tabela de ações canônicas por módulo está no §T1.
- [caderno-3-sdk/14-ia-rag-e-agentes.md](../docs/caderno-3-sdk/14-ia-rag-e-agentes.md) — §5 (agente como persona, delegação, teto de abuso, SPEC:PAGE, trilha de procedência)
- [[agente-de-ia]] — definição canônica: atua em nome de usuário, distinto de agente-de-sistema
- Deps: T-IA-03 (recuperação híbrida — agente usa para contexto), T-501 (UCAN — `draft`, delegação usa UCAN para `ASSET:ROLE`)

**Testes (7 casos):** 1. `validateDelegation` dentro do prazo e scope → `valid: true`. 2. Delegação expirada → `valid: false`. 3. `proposeIntent` com nó fora do scope → `accepted: false`. 4. `proposeIntent` dentro do scope → `accepted: true`, `factId` preenchido. 5. `generatePageSpec` retorna spec válida. 6. Intent sem `modelId` → rejeitado (falta proveniência). 7. Vetor: agente tenta intent com `maxValueLimit` excedido → rejeitado.

**Pegadinhas:** `ASSET:ROLE` é delegado via UCAN (T-501) — se T-501 draft, usar placeholder. `principalId` é o usuário delegante, não o agente. `expiresAt` em timestamp ms. O validador de SPEC:PAGE (RFC-008 A.7) é externo — o agente só propõe, não valida.

**Gate:** `pnpm --filter @plataforma/ai-agent build && pnpm --filter @plataforma/ai-agent test`

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:** T-501 (UCAN) está `draft` — `ASSET:ROLE` delegado depende de UCAN. T-IA-03 sendo endurecida nesta passada. **Status:** `draft` até T-501 e T-IA-03 chegarem a `ready`.


## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `validateDelegation` verifica expiração e scope?
- [ ] `proposeIntent` bloqueia intent acima do privilégio?
- [ ] `generatePageSpec` retorna spec válida para o validador?
- [ ] Trilha de proveniência (`modelId`, `principalId`) registrada?
- [ ] `pnpm --filter @plataforma/ai-agent build` e `test` verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/ai-agent build
pnpm --filter @plataforma/ai-agent test
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

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
