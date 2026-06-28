---
id: T-PL-01
title: "SPEC:PLUGIN + manifesto + verificacao de assinatura/listagem no loader"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-107"]
blocks: ["T-PL-02", "T-PL-03", "T-PL-04", "T-PL-05", "T-PL-06"]
---

# T-PL-01 · SPEC:PLUGIN + manifesto + verificacao de assinatura/listagem no loader

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir o schema `SPEC:PLUGIN`, implementar o manifesto (tipo de runtime, perfil de recurso, lista de capacidades) e o loader que verifica assinatura + listagem antes de instanciar qualquer plugin. Falha → `fato-negativo-verificável` de carga recusada, jamais execução degradada silenciosa.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/12-plugins-e-computacao.md` §1 (plugin como SPECIFICATION, manifesto), §2 (marketplace-only, validação gate de oferta)
- Enriquecimento: [[plugin]] — unidade assinada e versionada, 2 tipos de runtime; [[validacao-de-plugin]] — gate de oferta, tiers de validação; [[capacidade-de-runtime]] — browser/node; [[fila-de-computacao]] — modo assíncrono
- Dep T-107: Assinatura Universal Layer 1 (verificação de assinatura do bundle)

### Contratos TS (derivados do RAG §1, §2)

```ts
// --- packages/plugins/src/schema.ts ---

export type PluginRuntime = 'browser' | 'node';

export type PluginCategory = 'compute' | 'connector' | 'infra' | 'ui';

/** Perfil de recurso exigido pelo plugin (§1.3). */
export interface ResourceProfile {
  gpu: boolean;
  ram_mb: number;
  esm: boolean;
  threads: number;
}

/** Contrato de uma capacidade exposta pelo plugin (§1.3). */
export interface PluginCapability {
  /** id versionado da capacidade. */
  id: string;
  version: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  /** Se a capacidade é determinística (admite verificação por re-execução). */
  deterministic: boolean;
  /** Classe de privacidade: se a capacidade vê plaintext sensível. */
  privacy_class: 'restricted' | 'safe' | 'public';
}

export interface PluginManifest {
  /** Tipo(s) de runtime exigidos. */
  runtimes: PluginRuntime[];
  resource_profile: ResourceProfile;
  capabilities: PluginCapability[];
  /** entity_id do SPEC:PLUGIN. */
  plugin_id: string;
  /** Versão semântica. */
  version: string;
}

export interface PluginDocument {
  manifest: PluginManifest;
  /** Referência ao bundle binário no media plane. */
  bundle_ref: string;
  /** Assinatura do autor sobre o manifesto + bundle_ref. */
  signature: string;
}

// --- packages/plugins/src/loader.ts ---

export type LoadResult =
  | { loaded: true; manifest: PluginManifest; bundle_ref: string }
  | { loaded: false; reason: string };

export interface PluginLoader {
  /**
   * Verifica assinatura + listagem antes de instanciar.
   * - Assinatura: verifica que `signature` é válida sobre manifesto + bundle_ref (T-107).
   * - Listagem: verifica que o plugin está listado na implementação corrente.
   * Falha → `fato-negativo-verificável`.
   */
  load(doc: PluginDocument, publicKey: string): Promise<LoadResult>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/12-plugins-e-computacao.md](../docs/caderno-3-sdk/12-plugins-e-computacao.md) §1 (plugin, manifesto), §2 (marketplace-only, validação), §3 (categorias de capacidade)
- [docs/conceitos/plugin.md](../docs/conceitos/plugin.md) — definição canônica, 2 tipos de runtime, 3 categorias (+ui)
- [docs/conceitos/validacao-de-plugin.md](../docs/conceitos/validacao-de-plugin.md) — gate de oferta, 4 tiers
- [docs/conceitos/capacidade-de-runtime.md](../docs/conceitos/capacidade-de-runtime.md) — browser, node
- [docs/conceitos/fila-de-computacao.md](../docs/conceitos/fila-de-computacao.md) — modo assíncrono

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/12-plugins-e-computacao.md` (contrato completo)
- **[READ]** `docs/conceitos/plugin.md`
- **[READ]** `docs/conceitos/validacao-de-plugin.md`
- **[READ]** `docs/conceitos/capacidade-de-runtime.md`
- **[READ]** `packages/protocol/src/ports.ts` (tipos base — T-004)
- **[CREATE]** `packages/plugins/src/schema.ts` — PluginDocument, PluginManifest, PluginCapability
- **[CREATE]** `packages/plugins/src/loader.ts` — PluginLoader, LoadResult
- **[CREATE]** `packages/plugins/src/index.ts` — re-export
- **[CREATE]** `packages/plugins/tests/schema.test.ts`
- **[CREATE]** `packages/plugins/tests/loader.test.ts`
- **[UPDATE]** `packages/plugins/package.json` — dependência `@plataforma/protocol`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/plugins test`)
- [x] **Fora de Escopo:** Sandbox (T-PL-02/03), ComputePort (T-PL-04), fila (T-PL-05)

Casos de teste (numerados):
1. Manifesto válido com 1 runtime `browser` e 1 capacidade `compute` → valida.
2. Manifesto sem `runtimes` → `valid: false`.
3. Manifesto com runtime não listado (`mobile`) → `valid: false`.
4. Capacidade sem `deterministic` definido → `valid: false` (obrigatório).
5. Capacidade com `privacy_class` não listada → `valid: false`.
6. `bundle_ref` vazio → `valid: false`.
7. Loader: assinatura válida + plugin listado → `loaded: true`.
8. Loader: assinatura inválida → `loaded: false`, reason contém "signature".
9. Loader: plugin não listado na implementação → `loaded: false`, reason contém "not listed".
10. Loader: chave pública errada (não corresponde ao autor) → `loaded: false`.
11. Plugin isomórfico (`runtimes: ['browser', 'node']`) → válido.
12. Plugin categoria `connector` → válido.
13. Plugin categoria `infra` → válido.
14. Plugin categoria `ui` → válido (RFC-024).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente o sandbox (T-PL-02/03).
> - NÃO implemente conexão real de rede.
> - NÃO use sideload — a única via é marketplace (listado).

### Pegadinhas conhecidas
- A verificação de assinatura depende de T-107 (Assinatura Universal Layer 1). O loader usa a interface de verificação, não implementa cripto própria.
- A listagem é um dado de implementação: o loader recebe um `Set<string>` de plugins listados como parâmetro.
- `bundle_ref` referencia o blob no media plane — o loader não busca o blob, só verifica que a referência não é vazia.
- `privacy_class: 'restricted'` bloqueia execução em site `external` — mas essa verificação é do escalonador (T-PL-04), não do loader.

1. **[SETUP]** Crie `packages/plugins/package.json` com nome `@plataforma/plugins`, dependendo de `@plataforma/protocol`.
2. **[TDD]** Crie `packages/plugins/tests/schema.test.ts` casos 1–6 e `loader.test.ts` casos 7–10 (RED).
3. Crie `packages/plugins/src/schema.ts` com as interfaces.
4. Crie `packages/plugins/src/loader.ts` implementando verificação de assinatura + listagem.
5. Crie `packages/plugins/src/index.ts` re-exportando.
6. Refatore até verde.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` — OK (79 linhas, §1–§7)
- `docs/conceitos/plugin.md` — OK (32 linhas, 2 tipos, 3 categorias)
- `docs/conceitos/validacao-de-plugin.md` — OK (24 linhas, 4 tiers)
- `docs/conceitos/capacidade-de-runtime.md` — OK (16 linhas)
- `docs/conceitos/fila-de-computacao.md` — OK (20 linhas)
- T-107 (Assinatura Universal Layer 1) — `ready` no INDEX

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 14 casos de teste passam?
- [ ] Assinatura inválida → `loaded: false` (nunca execução silenciosa)?
- [ ] Plugin não listado → `loaded: false`?
- [ ] Todas as 4 categorias de capacidade são aceitas?
- [ ] Campos obrigatórios do manifesto são validados?

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
