---
id: T-IA-02
title: "capacidades compute de embedding e LLM como plugins (on-device + conector external)"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-PL-01"]
blocks: ["T-IA-03"]
---

# T-IA-02 · capacidades compute de embedding e LLM como plugins (on-device + conector external)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir as capacidades `compute` de embedding e LLM como plugins no modelo da RFC-010. Todo modelo (LLM, embedding, transcrição, classificação, visão) é uma capacidade `compute` com contrato tipado, flag de determinismo (`deterministic: false` para IA), e classe de privacidade. Suporta 3 sites de execução: on-device (runtime local), peer ([[serves-aresta]]), e conector `external` (API de provedor, classe E).
**Fonte:** `caderno-3-sdk/14-ia-rag-e-agentes.md §1` — inferência como utilitário de computação. **Conceitos:** [[utilitario-de-ia]], [[plugin]].

### Contratos exatos

```ts
// --- packages/ai-plugins/src/compute-ai.ts 
---

/** Classe de privacidade do modelo (RFC-010 A.6). */
export type PrivacyClass = 'local_only' | 'peer_allowed' | 'external_allowed';

/** Flag de determinismo. IA é sempre `false`. */
export type DeterminismFlag = boolean;

/** Tipo de capacidade compute de IA. */
export type AIComputeKind = 'llm' | 'embedding' | 'transcription' | 'classification' | 'vision';

/** Contrato de capacidade compute para IA (estende ComputePort da RFC-010). */
export interface AIComputeCapability {
  kind: AIComputeKind;
  /** Se deterministic=false, confiança por assinatura (RFC-010 A.5.4). */
  deterministic: DeterminismFlag;
  privacy: PrivacyClass;
  /** Sites onde este modelo pode executar. */
  allowedSites: ('on-device' | 'peer' | 'external')[];
  /** Modelo específico (ex.: "llama3.2-1b", "text-embedding-3-small"). */
  modelId: string;
}

/** Entrada para inferência. */
export interface AIInferenceInput {
  prompt?: string;
  inputText?: string;
  imageBase64?: string;
  audioBase64?: string;
  options?: Record<string, unknown>; // temperature, max_tokens, etc.
}

/** Saída de inferência (não-determinística). */
export interface AIInferenceOutput {
  text?: string;
  embedding?: number[];
  classification?: { label: string; confidence: number }[];
  /** Modelo e site usados (para trilha de proveniência). */
  provenance: {
    modelId: string;
    site: 'on-device' | 'peer' | 'external';
    executedAt: number;
  };
}

/** Plugin compute de IA — registrado como capacidade compute. */
export interface AIComputePlugin {
  capability: AIComputeCapability;
  /** Executa inferência no site apropriado. */
  infer(input: AIInferenceInput): Promise<AIInferenceOutput>;
  /** Verifica se o plugin está disponível no dispositivo atual. */
  isAvailable(): Promise<boolean>;
}

/** Registry de plugins compute de IA. */
export interface AIComputeRegistry {
  register(plugin: AIComputePlugin): void;
  find(kind: AIComputeKind, site?: 'on-device' | 'peer' | 'external'): AIComputePlugin[];
  /** Seleciona o melhor site disponível (preferência: on-device > peer > external). */
  resolve(kind: AIComputeKind): Promise<AIComputePlugin | undefined>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/14-ia-rag-e-agentes.md](../docs/caderno-3-sdk/14-ia-rag-e-agentes.md) — §1 (IA como utilitário compute, 3 sites, flag de determinismo, classe de privacidade)
- [[utilitario-de-ia]] — definição canônica: capacidade compute com contrato tipado
- [[plugin]] — mecanismo de entrega, runtime browser/node

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-sdk/src/manifest.ts` — manifesto base de plugin (T-PL-01, placeholder se draft)
- **[CREATE]** `packages/ai-plugins/src/compute-ai.ts` — `AIComputeCapability`, `AIComputePlugin`, `AIComputeRegistry`
- **[CREATE]** `packages/ai-plugins/src/registry.ts` — implementação `MapAIComputeRegistry`
- **[CREATE]** `packages/ai-plugins/tests/compute-ai.test.ts` — testes de registro + resolução + contrato
- **[UPDATE]** `packages/ai-plugins/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/ai-plugins test`).
- [x] **Fora de Escopo:** Implementação real de modelo (LLM, embedding), chamada de rede.

Casos de teste:
1. `AIComputePlugin` dummy com `kind: 'embedding'`, `deterministic: false` compila.
2. `infer()` retorna `AIInferenceOutput` com `provenance` preenchido.
3. `AIComputeRegistry.register()` aceita plugin; `find('embedding')` retorna lista.
4. `resolve('embedding')` prefere on-device sobre peer sobre external.
5. `resolve('llm')` com vários plugins — seleciona on-device primeiro.
6. Privacy class: plugin `external_allowed` pode ser registrado com site `external`; plugin `local_only` não pode.
7. Type-check: `AIComputeCapability.kind` restrito ao union literal.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente modelos reais (LLM, embedding). Apenas contratos + stubs.
> - **NÃO** implemente o conector external real. O site `external` é apenas um valor de enum.
> - **NÃO** dependa de T-IA-01 (vector_index) — esta task define contratos, não indexação.

### Pegadinhas conhecidas
- `AIComputeKind` é union literal, não `string`. O registro deve validar em runtime.
- A preferência de site (`on-device > peer > external`) é resolvida por `resolve()`, mas o fallback para external só ocorre se a privacy class permitir.
- `deterministic: false` para TODO plugin de IA — o reviewer deve verificar que nenhum plugin de IA tem `deterministic: true`.
- `PrivacyClass` restringe `site`: `local_only` → só `on-device`; `peer_allowed` → `on-device` ou `peer`; `external_allowed` → todos.

1. **[TDD]** Crie `packages/ai-plugins/tests/compute-ai.test.ts` com casos 1–7.
2. Crie `packages/ai-plugins/src/compute-ai.ts`: tipos + interfaces.
3. Crie `packages/ai-plugins/src/registry.ts`: `MapAIComputeRegistry` com `register`, `find`, `resolve`.
4. Re-exporte em `packages/ai-plugins/src/index.ts`.
5. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:**
> - **T-PL-01 (SPEC:PLUGIN base) está `draft`.** Esta task define tipos próprios (`AIComputeCapability`, `AIComputePlugin`) que serão compatibilizados com o modelo base de plugin quando T-PL-01 for endurecida. O worker deve usar tipos independentes com campo `capability` compatível.
> **Status:** `draft` até T-PL-01 chegar a `ready`. Contratos IA já estão derivados de fonte.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/ai-plugins build
pnpm --filter @plataforma/ai-plugins test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

### Checklist do Reviewer
- [ ] `AIComputePlugin` com `capability`, `infer()`, `isAvailable()`?
- [ ] `AIComputeRegistry.resolve()` prefere on-device > peer > external?
- [ ] Privacy class restringe sites corretamente?
- [ ] `deterministic: false` em todo plugin de IA?
- [ ] `pnpm --filter @plataforma/ai-plugins build` e `test` verdes?

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
