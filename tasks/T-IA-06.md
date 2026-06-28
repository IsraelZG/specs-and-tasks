---
id: T-IA-06
title: "vetores: agente acima do escopo, recuperacao furando bloqueio, embedding restrito para external, fato superado"
status: draft
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-IA-01", "T-IA-02", "T-IA-03", "T-IA-04", "T-IA-05"]
blocks: []
---

# T-IA-06 · vetores: agente acima do escopo, recuperacao furando bloqueio, embedding restrito para external, fato superado

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Suíte de vetores adversariais cobrindo todo o stack IA: (1) agente tentando intent acima do escopo delegado, (2) recuperação híbrida retornando nó que o principal não pode ler (furando `predicado-de-bloqueio`), (3) embedding de campo restrito enviado para LLM `external` (violação de `PrivacyClass`), (4) agente raciocinando sobre fato superado como se fosse vigente. Cada vetor deve ser bloqueado pelo sistema.
**Fonte:** `caderno-3-sdk/14-ia-rag-e-agentes.md §4, §5, §6`. **Conceitos:** [[agente-de-ia]], [[recuperacao-hibrida]], [[utilitario-de-ia]].

### Contratos essenciais

```ts
// packages/ai-vectors/src/adversarial-vectors.ts
export interface AIVector { id: string; name: string; targetComponent: string; // agente, retrieval, embedding, supersession
  description: string; setup(): Promise<void>; execute(): Promise<{ passed: boolean; // true = bloqueado (comportamento correto)
  expected: string; actual: string; }>; }
export const AI_ADVERSARIAL_VECTORS: AIVector[]; // 4 vetores
export async function runAIVectors(): Promise<{ total: number; passed: number; failures: { id: string; detail: string }[] }>;
```
**File paths:** `packages/ai-vectors/src/adversarial-vectors.ts` (CREATE), `packages/ai-vectors/tests/adversarial-vectors.test.ts` (CREATE), `packages/ai-vectors/src/index.ts` (UPDATE).

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/14-ia-rag-e-agentes.md](../docs/caderno-3-sdk/14-ia-rag-e-agentes.md) — §4 (supersessão: default heads), §5 (teto de abuso), §6 (limites: recuperação só alcança o que principal pode ler)
- [[agente-de-ia]] — teto de abuso idêntico ao da linguagem de páginas
- [[recuperacao-hibrida]] — filtro de permissão na recuperação
- Deps: T-IA-01 a T-IA-05

**Testes (4 vetores, cada um = 1 caso):** V1: Agente com scope `[SPEC:PAGE]` tenta propor `BALANCE_STATE` → rejeitado pelo validador de delegação. V2: Principal sem permissão de leitura no nó X; recuperação híbrida consulta "dados de X" → X não aparece nos resultados. V3: Campo `embeddable: true` mas com `PrivacyClass: local_only`; embedding enviado para `external` → bloqueado pelo privacy gate. V4: Agente consulta "saldo atual"; fato superado (saldo antigo) não aparece — apenas `entity_heads`. Cada vetor: `passed: true` significa que o sistema bloqueou corretamente.

**Pegadinhas:** Vetores são testes de integração — precisam de mocks de todos os componentes do stack. `AI_ADVERSARIAL_VECTORS` é array estático — cada vetor tem `setup()` para configurar estado necessário. `passed: true` = comportamento CORRETO (bloqueou o ataque). Não confundir: se o vetor espera bloqueio e o sistema permite, `passed: false`.

**Gate:** `pnpm --filter @plataforma/ai-vectors build && pnpm --filter @plataforma/ai-vectors test`

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:** T-IA-01 a T-IA-05 estão sendo endurecidas nesta passada. Todos os tipos necessários (`AgentDelegation`, `HybridRetrieval`, `AIComputeCapability`, `PrivacyClass`) estão definidos nas specs das deps. **Status:** `draft` até todo o stack IA (T-IA-01 a T-IA-05) estar implementado.


## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] V1: Agente acima do escopo → rejeitado?
- [ ] V2: Recuperação retorna nó sem permissão → não aparece?
- [ ] V3: Embedding `local_only` enviado para `external` → bloqueado?
- [ ] V4: Fato superado não aparece (apenas `entity_heads`)?
- [ ] Todos os 4 vetores: `passed: true` (sistema bloqueou)?
- [ ] `pnpm --filter @plataforma/ai-vectors build` e `test` verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/ai-vectors build
pnpm --filter @plataforma/ai-vectors test
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
