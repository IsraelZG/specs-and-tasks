---
id: T-PL-04
title: "ComputePort + escalonador com anuncio de runtime via serves + casamento de site"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PL-01", "T-004"]
blocks: ["T-PL-06"]
---

# T-PL-04 · ComputePort + escalonador com anuncio de runtime via serves + casamento de site

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar a `ComputePort` que resolve site e modo de execução sem o chamador conhecer o backend (IoC). Três sites: `local` (dispositivo), `peer` (remoto que anuncia a capacidade via aresta `serves`), `external` (endpoint não-peer via NetworkAdapter). O escalonador casa `plugin.runtime ⊆ site.runtimes` e respeita restrições de privacidade e recurso.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/12-plugins-e-computacao.md` §4 (ComputePort, 3 sites, casamento de runtime), §5 (modos síncrono/assíncrono), §6.3 (classe de privacidade × site)
- Enriquecimento: [[plugin]] — categorias de capacidade; [[capacidade-de-runtime]] — browser/node; [[fila-de-computacao]] — modo assíncrono

### Contratos TS (derivados do RAG §4, §5)

```ts
// --- packages/plugins/src/compute-port.ts ---
import type { PluginManifest, PluginCapability, PluginRuntime } from './schema';

export type ComputeSite = 'local' | 'peer' | 'external';

export type ComputeMode = 'sync' | 'async';

export interface ComputeRequest {
  /** ID da capacidade a invocar. */
  capability_id: string;
  /** Input conforme schema declarado. */
  input: unknown;
  /** Site preferido (opcional — o escalonador escolhe o melhor). */
  preferred_site?: ComputeSite;
  /** Modo preferido. */
  preferred_mode?: ComputeMode;
  /** Restrições da SPEC do fluxo chamador. */
  restrictions?: ComputeRestrictions;
}

export interface ComputeRestrictions {
  /** Sites permitidos. Vazio = todos. */
  allowed_sites?: ComputeSite[];
  /** Classe de privacidade máxima aceitável. */
  max_privacy_class?: 'restricted' | 'safe' | 'public';
  /** Orçamento de tempo para modo síncrono (ms). */
  timeout_ms?: number;
}

export interface ComputeResponse {
  /** Site onde a computação foi executada. */
  site: ComputeSite;
  /** Modo usado. */
  mode: ComputeMode;
  /** Output conforme schema declarado. */
  output: unknown;
  /** Se o orçamento foi exaurido. */
  budget_exhausted: boolean;
  error?: string;
}

export interface SiteAnnouncement {
  peer_id: string;
  runtimes: PluginRuntime[];
  resource_profile: {
    gpu: boolean;
    ram_mb: number;
    cpu_cores: number;
  };
  /** Capacidades que este site serve (capability_ids). */
  served_capabilities: string[];
}

export interface ComputeScheduler {
  /**
   * Registra um site como elegível para execução.
   * `local` é implícito; `peer` e `external` são registrados via anúncio.
   */
  registerSite(announcement: SiteAnnouncement): void;
  unregisterSite(peer_id: string): void;

  /**
   * Elege o melhor site para uma requisição.
   * Critérios: restrições → runtime match → privacidade → recurso → latência.
   * Se nenhum site elegível → `fato-negativo-verificável`.
   */
  schedule(
    request: ComputeRequest,
    manifest: PluginManifest,
    capability: PluginCapability
  ): Promise<ComputeSite | null>;

  /** Executa a computação no site eleito. */
  execute(
    request: ComputeRequest,
    site: ComputeSite,
    manifest: PluginManifest,
    capability: PluginCapability
  ): Promise<ComputeResponse>;
}

export interface ComputePort {
  /** Invoca uma capacidade compute. Resolve site e modo transparentemente. */
  invoke(request: ComputeRequest): Promise<ComputeResponse>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/12-plugins-e-computacao.md](../docs/caderno-3-sdk/12-plugins-e-computacao.md) §4 (ComputePort, 3 sites, casamento de runtime), §5 (modos síncrono/assíncrono), §6.3 (classe de privacidade × site)
- [docs/conceitos/plugin.md](../docs/conceitos/plugin.md)
- [docs/conceitos/capacidade-de-runtime.md](../docs/conceitos/capacidade-de-runtime.md)
- [docs/conceitos/fila-de-computacao.md](../docs/conceitos/fila-de-computacao.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugins/src/schema.ts` (T-PL-01)
- **[READ]** `packages/plugins/src/loader.ts` (T-PL-01)
- **[READ]** `packages/protocol/src/ports.ts` (NetworkAdapterPort — T-004)
- **[READ]** `docs/caderno-3-sdk/12-plugins-e-computacao.md` §4, §5
- **[CREATE]** `packages/plugins/src/compute-port.ts` — ComputePort, ComputeScheduler, SiteAnnouncement
- **[CREATE]** `packages/plugins/tests/compute-port.test.ts`
- **[UPDATE]** `packages/plugins/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro
- [x] **Fora de Escopo:** Execução real em peer remoto, fila assíncrona (T-PL-05)

Casos de teste (numerados):
1. Site `local` elegível para plugin `browser` → `schedule()` retorna `local`.
2. Site `peer` anuncia runtime `node` — plugin `node` elegível → `schedule()` retorna `peer`.
3. Plugin `browser` sem site `local` disponível e sem peer `browser` → `schedule()` retorna `null`.
4. Restrição `allowed_sites: ['local']` → `peer` descartado mesmo que elegível.
5. Restrição `max_privacy_class: 'safe'` → capacidade `restricted` não elegível para `external`.
6. `preferred_site: 'peer'` com peer elegível → peer selecionado sobre local.
7. Peer com RAM insuficiente para o perfil de recurso → descartado.
8. `schedule()` sem sites registrados (só local implícito) + plugin `node` sem Electron → `null`.
9. `execute()` no site `local` (stub) → `ComputeResponse` com output.
10. `execute()` com timeout → `budget_exhausted: true`.
11. Site `external` requer NetworkAdapter declarado → se não houver, `null`.
12. Dois peers anunciando mesma capacidade → scheduler escolhe o com menor latência (mock).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente transporte real entre peers (NetworkAdapter real).
> - NÃO implemente a fila assíncrona (T-PL-05) — modo `async` só delega para a fila.
> - NÃO implemente execução real de plugins — use stubs.

### Pegadinhas conhecidas
- O site `local` é implícito e sempre registrado (browser plugin na aba/Worker; node plugin no Electron).
- `external` requer um NetworkAdapterPort (T-004) — sem adapter, não há rota para external.
- `privacy_class: 'restricted'` + site `external` = proibido por construção (§6.3). O scheduler rejeita.
- O scheduler é determinístico: mesmos sites + mesma requisição → mesmo resultado.

1. **[TDD]** Crie `packages/plugins/tests/compute-port.test.ts` com os 12 casos (RED).
2. Implemente `packages/plugins/src/compute-port.ts`.
3. Atualize `packages/plugins/src/index.ts`.
4. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §4, §5, §6.3 — OK
- `docs/conceitos/plugin.md` — OK
- `docs/conceitos/capacidade-de-runtime.md` — OK
- `docs/conceitos/fila-de-computacao.md` — OK
- `packages/plugins/src/schema.ts` — T-PL-01 (dep)
- `packages/protocol/src/ports.ts` — T-004 (dep, `ready`)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 12 casos de teste passam?
- [ ] Casamento de runtime (`plugin.runtime ⊆ site.runtimes`) é respeitado?
- [ ] Classe de privacidade restrita bloqueia site `external`?
- [ ] Restrições da SPEC são respeitadas?
- [ ] Sem site elegível → `null` (nunca execução em site proibido)?

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
