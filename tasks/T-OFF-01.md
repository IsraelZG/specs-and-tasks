---
id: T-OFF-01
title: "perfis de capacidade no motor de paginas + validador por perfil (emenda spec de paginas)"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-PG-01", "T-004"] # IDs de tarefas que bloqueiam esta
blocks: ["T-OFF-02", "T-OFF-03", "T-OFF-04", "T-OFF-05"] # IDs de tarefas que esta bloqueia
---

# T-OFF-01 · perfis de capacidade no motor de paginas + validador por perfil (emenda spec de paginas)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Estender o motor de páginas (SPEC:PAGE) com perfis de capacidade: um motor único com subsets de componentes
permitidos + comportamento declarados na SPEC. O perfil determina quais componentes/ações são válidos para
aquele tipo de página. Fonte: `caderno-3-sdk/27-suite-office.md §1`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/page-engine/src/capacity-profile.ts

export type CapacityProfileName =
  | "pagina_completa"
  | "documento"
  | "anuncio"
  | "slide"
  | "comentario_post";

export interface CapacityProfile {
  name: CapacityProfileName;
  /** Whitelist de componentes permitidos. */
  allowedComponents: string[];
  /** Comportamento: "linear" (documento) ou "free" (canvas livre). */
  layoutMode: "linear" | "free";
  /** Ações habilitadas (ex.: "export_pdf", "collaborate", "zen_eval"). */
  allowedActions: string[];
  /** Orçamento máximo de componentes (evita DOS). */
  maxComponents: number;
}

export interface ProfileValidator {
  /** Valida se uma SPEC:PAGE está em conformidade com seu perfil declarado. */
  validate(pageSpec: PageSpec, profile: CapacityProfile): ValidationResult;
  /** Retorna o perfil para um dado nome. */
  getProfile(name: CapacityProfileName): CapacityProfile;
  /** Registra perfil customizado (extensível). */
  registerProfile(profile: CapacityProfile): void;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export interface PageSpec {
  limits_profile: CapacityProfileName;
  components: Array<{ type: string; [key: string]: unknown }>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/27-suite-office.md](../docs/caderno-3-sdk/27-suite-office.md) §1 — Perfis de capacidade do motor (emenda à RFC-008)
- [[perfil-de-capacidade]] — Definição canônica: governança declarativa e restrição comportamental do motor
- [[sessao-colaborativa]] — Docs e planilhas usam Automerge com sessão colaborativa (T-OFF-02, T-OFF-03)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/27-suite-office.md` §1, §8
- **[READ]** `docs/conceitos/perfil-de-capacidade.md` — perfis canônicos: pagina_completa, documento, anuncio, slide, comentario_post
- **[READ]** `packages/protocol/src/ports.ts` — LoggerPort (T-004)
- **[CREATE]** `packages/page-engine/src/capacity-profile.ts` — interfaces + perfis canônicos
- **[CREATE]** `packages/page-engine/src/profile-validator.ts` — implementação do validador
- **[CREATE]** `packages/page-engine/tests/capacity-profile.test.ts` — testes
- **[UPDATE]** `packages/page-engine/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro — validador é lógica pura, sem DOM).
- [x] **Ambiente do Teste:** Node puro.
- [x] **Fora de Escopo:** Renderização React (T-PG-02). Automerge (T-403). Zen (T-604).

Casos de teste (numerados):
1. Perfil `pagina_completa` aceita qualquer componente (whitelist = ["*"]).
2. Perfil `documento` rejeita componente "game_engine" (não está na whitelist de documento).
3. Perfil `slide` permite "export_pptx" mas rejeita "collaborate" (slide não é colaborativo).
4. Perfil `comentario_post` rejeita ZEN expressions (ações bloqueadas).
5. `validate()` com perfil inexistente no SPEC retorna erro claro.
6. Trocar perfil de `comentario_post` para `documento` (relaxar) é permitido.
7. Trocar perfil de `documento` para `pagina_completa` (elevar privilégio) requer confirmação extra.
8. Limite de `maxComponents`: 1001 componentes em perfil `documento` (max=1000) → rejeitado.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie múltiplos motores de página — o motor é ÚNICO; o perfil é restrição declarativa (§1.1: "motor de páginas é único; cada caso de uso é um perfil de capacidade").
> - **NÃO** permita elevação de perfil sem gate — trocar para perfil com mais capacidades exige validação criptográfica ou re-autoria (§1.2 e contrato do protocolo).
> - **NÃO** invente perfis não-listados no caderno — os 5 canônicos são os da fonte; novos perfis são registrados via `registerProfile()`.

### Pegadinhas conhecidas
- **Whitelist, não blacklist:** o validador é permissivo por omissão, restritivo por declaração. Se o perfil não lista um componente, ele é REJEITADO. Não assuma que componentes novos são automaticamente permitidos.
- **Trocar perfil não troca de motor:** `pagina_completa` e `slide` usam o mesmo `PageEngine.render()`. A diferença é apenas o subset de componentes e ações que o validador aceita.
- **Perfis são extensíveis mas os 5 canônicos são built-in:** `getProfile("documento")` sempre retorna o canônico; `registerProfile()` adiciona perfis customizados que podem ser referenciados por nome no `limits_profile`.

1. **[TDD]** Crie `packages/page-engine/tests/capacity-profile.test.ts` com os 8 casos.
2. Implemente `packages/page-engine/src/capacity-profile.ts` com os 5 perfis canônicos e interfaces.
3. Implemente `packages/page-engine/src/profile-validator.ts` com `validate()`, `getProfile()`, `registerProfile()`.
4. Re-exporte em `packages/page-engine/src/index.ts`.
5. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] 5 perfis canônicos definidos com whitelists corretas (documento, anuncio, slide, pagina_completa, comentario_post)?
- [ ] Validador rejeita componentes fora da whitelist do perfil?
- [ ] Elevação de perfil (mais capacidades) exige gate?
- [ ] Motor é único — perfis são declaração, não motores separados?
- [ ] `pnpm test` verde com 8 casos?

### Verificação automática
```bash
pnpm --filter @plataforma/page-engine build
pnpm --filter @plataforma/page-engine test
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
