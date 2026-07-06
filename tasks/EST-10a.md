---
id: EST-10a
title: "plugin-providers: registry direto (mover de ORQ-09b)"
status: ready
complexity: 2
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: ["EST-10b", "EST-10c"]
parent: "EST-10"
capacity_target: haiku
---

# EST-10a · plugin-providers: registry direto

## 0. Ambiente
- **Runtime:** Node.js 22+. `packages/plugin-providers/`.
- Mover `PROVIDERS` map + `resolveModel()` de `tools/orchestrator/src/agentAdapter.mjs` para `packages/plugin-providers/src/registry.ts`. Adaptar de JS para TS.

## 1. Objetivo
Criar `packages/plugin-providers/src/registry.ts` com o map de providers (derivado de ORQ-09b) e a função `resolveModel()`. Scaffold do pacote.

## 2. Contratos (derivados de ORQ-09b agentAdapter.mjs:75-87)
```ts
export interface ProviderConfig {
  baseURL: string;
  apiKeyEnv: string;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  deepseek:          { baseURL: 'https://api.deepseek.com/v1',     apiKeyEnv: 'DEEPSEEK_API_KEY' },
  'opencode-go-ent': { baseURL: 'https://opencode.ai/zen/go/v1',  apiKeyEnv: 'OPENCODE_ENT_API_KEY' },
  'opencode-zen-ent':{ baseURL: 'https://opencode.ai/zen/v1',     apiKeyEnv: 'OPENCODE_ENT_API_KEY' },
};

export function resolveModel(
  rosterName: string,
  providerFactory?: (name: string) => import('ai').LanguageModel
): import('ai').LanguageModel;
```

## 3. Escopo
- **[CREATE]** `packages/plugin-providers/package.json`
- **[CREATE]** `packages/plugin-providers/tsconfig.json`
- **[CREATE]** `packages/plugin-providers/src/index.ts` — re-export root
- **[CREATE]** `packages/plugin-providers/src/registry.ts` — PROVIDERS + resolveModel
- **[CREATE]** `packages/plugin-providers/tests/registry.test.ts` — 5 casos

## 4. Testes (5 vitest)
1. `resolveModel` prefixo registrado → LanguageModel
2. `resolveModel` prefixo não registrado → throw
3. `resolveModel` com providerFactory injetado → chama factory
4. PROVIDERS contém deepseek, opencode-go-ent, opencode-zen-ent
5. apiKeyEnv ausente → throw descritivo

## 5. Instruções de Execução
1. Scaffold do pacote: `package.json`, `tsconfig.json` (estender `tsconfig.base.json`), `src/index.ts`
2. Copiar `PROVIDERS` map de `tools/orchestrator/src/agentAdapter.mjs:75-79`, converter para TS com tipos
3. Copiar `resolveModel()` do mesmo arquivo, adaptar assinatura TS, remover dependência de runtime (`createOpenAICompatible` fica no caller)
4. Escrever 5 testes (vitest, sem mock de módulo — usar `providerFactory` injetado)
5. Gate → §8

## 6. Feedback de Especificação
- **Nenhuma decisão em aberto.** PROVIDERS map é derivado 1:1 de ORQ-09b. `resolveModel` mantém `providerFactory` injetável (mesmo contrato) para teste sem chamar LLM real.

## 7. Definition of Done (DoD)
- [ ] `packages/plugin-providers/` scaffold compila (`pnpm build`)?
- [ ] `PROVIDERS` map exportado com tipos corretos?
- [ ] `resolveModel` com `providerFactory` injetável?
- [ ] 5/5 testes verdes?
- [ ] `apiKeyEnv` ausente lança erro descritivo?

### Verificação automática
```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a saída literal desses comandos colada na seção 8.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T17:48]** - *big-pickle* - `[Endurecido]`: endurece EST-10a: registry provider, 5 casos, capacity=haiku, dep EST-02 decomposta (filhas done)
- **[2026-07-06T17:48]** - *big-pickle* - `[Promovida p/ ready]`: draft:hardened com deps (EST-02 decomposta/filhas done) — safety-net flip
