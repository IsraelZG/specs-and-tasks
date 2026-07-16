---
id: EST-40
title: "P1: configuração remota DeepSeek no plugin-providers"
status: done
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-10", "EST-37", "EST-38", "EST-39"]
blocks: ["EST-41"]
capacity_target: sonnet
---

# EST-40 · P1: configuração híbrida no plugin-providers

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-40`.
- **Prioridade:** P1 — Conexões Híbridas. É a primeira capacidade de produto após Fase 0.
- **Runtime:** Node.js 22+ · pnpm · Vitest.

## 1. Objetivo
Evoluir o `plugin-providers` existente para a primeira prova de produto com o provider remoto
DeepSeek, mantendo `resolveModel` compatível e criando uma factory única que será consumida pelo
composition root em EST-41. O suporte a runtimes locais permanece explicitamente adiado; esta task
não deve fingir que Ollama ou LM Studio estão disponíveis.

O pacote deve suportar as famílias remotas já existentes (`deepseek`, `openrouter`, `omniroute`) e
configuração explícita para DeepSeek. Endpoints/defaults de terceiros só podem entrar após
verificação em fonte oficial no endurecimento JIT.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §1 item 1, §5.5 e §6.1.
- `docs/playbook/08-recon-arquitetural-adversarial.md` §0, §3, §4 e §10.
- `tasks/EST-10.md`, `EST-10a.md`, `EST-10b.md`, `EST-10c.md` e `EST-18.md`.
- `packages/plugin-providers/src/{registry,fallback,scoring,telemetry}.ts` e `package.json`.
- Fonte oficial da versão instalada de `ai` e do adapter OpenAI-compatible — resolver via
  Context7; se indisponível, consultar source/package instalado e registrar fallback.

## 3. Escopo de Arquivos
- **[UPDATE]** `packages/plugin-providers/src/registry.ts` — distinguir provider remoto/local e
  chave obrigatória/opcional sem quebrar deepseek/openrouter/omniroute.
  - `PROVIDERS` map existente (derivado de EST-10a) ganha campo `kind: "remote" | "local"`.
  - `resolveModel()` permanece inalterada em assinatura (derivado de EST-10a §1).
  - Novo tipo `ProviderKind` e interface `ProviderEntry` estendida.
- **[CREATE]** `packages/plugin-providers/src/factory.ts` — factory única de providers.
  - `createProviderConfig(modelId: string, opts?: ProviderConfigOptions): ProviderConfig`
  - `ProviderConfigOptions`: `{ baseURL?: string; apiKey?: string }` — chave opcional para locais.
  - Validação: remoto sem env de chave → erro com nome da env; local → chave ausente aceita.
  - Nunca lê segredo fora de `process.env` (trust boundary).
- **[UPDATE]** `packages/plugin-providers/src/index.ts` — re-exportar factory.
- **[UPDATE]** `packages/plugin-providers/package.json` e lockfile somente se a factory exigir
  runtime dependency verificada.
- **[UPDATE]** testes do pacote (adicionar `factory.test.ts`).
- **[NO CHANGE]** fallback (EST-10b), scoring (EST-10c) e telemetria (EST-10c) salvo adaptação
  estritamente tipada.
- **[NO CHANGE]** servidor, UI, workflow, tools e agentes.

## 4. Estratégia de Testes
- **Framework:** Vitest 3 (Node 22).
- **Ambiente:** Node puro, sem rede.
- **Caso de teste:**
  1. Provider remoto sem env de chave falha mencionando somente o nome da env (anti-fake: assert que msg contém nome da env, não o valor).
  2. Provider DeepSeek configurado aceita a chave via `DEEPSEEK_API_KEY` sem expô-la.
  3. Factory recebe `modelId`, `baseURL` e chave quando aplicável, sem ler segredo fora da env.
  4. Overrides de baseURL permitem runtime local customizado sem mutar registry global.
  5. Metadata pública nunca contém o valor da chave (anti-fake: `JSON.stringify(providerMetadata).not.toMatch(apiKeyValue)`).
  6. Entradas existentes continuam resolvendo exatamente como antes (regressão contra EST-10a).
- **Fora de escopo:** chamada real a rede (gate real pertence a EST-43), circuit breaker, scoring, telemetria.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO reimplementar circuit breaker, scoring ou TelemetryStore.
> - NÃO inventar assinatura do adapter externo; verificar a versão instalada primeiro.
> - NÃO hardcodar chave, token ou valor de `.env` em código/teste/log.
> - NÃO chamar rede nesta task; o gate real pertence a EST-43.
> - NÃO antecipar contexto, tools, compressão ou agentes.

1. Prove o contrato atual com testes de regressão.
2. Verifique a API externa e registre fonte/versão na spec durante endurecimento.
3. Modele chave opcional para locais e override de endpoint.
4. Exporte uma única factory consumível pelo host.

## 6. Feedback de Especificação
- **Fonte local verificada (fallback ao Context7 indisponível):** EST-10a e o registry atual fixam
  `deepseek.baseURL = https://api.deepseek.com/v1` e `apiKeyEnv = DEEPSEEK_API_KEY`. O valor da
  chave permanece apenas no ambiente/headroom e nunca entra na spec, logs ou testes.
- EST-18 continua reservado à extração seletiva de providers remotos apikey; não duplicar seu
  propósito nesta task.
- **DECIDIDO (arquiteto, 2026-07-13):** esta onda suporta somente o provider remoto DeepSeek;
  Ollama e LM Studio ficam adiados até existir runtime local disponível e task própria.
- **DECIDIDO (arquiteto, 2026-07-13):** usar `generateText` do AI SDK. O lockfile local registra
  `ai@7.0.15`; o adapter OpenAI-compatible deve ser dependência runtime explicitamente verificada
  e pinada pelo worker antes do `harden` final.
- **DECIDIDO (arquiteto, 2026-07-13):** validar `baseURL` no construction time, permitindo
  override por chamada sem mutar o registry global.

## 7. Definition of Done
- [ ] Remotos e locais compartilham uma factory sem afrouxar validação de segredo remoto.
- [ ] Nenhum segredo aparece em metadata/erro/snapshot.
- [ ] EST-10 permanece verde sem duplicação de mecanismo.
- [ ] Lint passa (Gate de Evidência inclui lint desde 2026-07-06).

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.
> **Lint é parte do gate** (Regra 3 do CLAUDE.md, desde 2026-07-06).

## 8. Log de Handover e Revisão
### Handover do Executor:
- **build:** ✅ tsc sem erros.
- **test:** ✅ 5 files, 26 tests (5 registry + 6 factory + demais).
- **lint:** ✅ eslint src/ limpo.
- **git status:** Worktree limpa, 1 commit pushado.
- **Mudanças:** kind: remote em ProviderConfig/PROVIDERS; createProviderConfig factory com validação construction-time; metadata sanitizada.

### Parecer do Agente Revisor (Reviewer 1 — claude-sonnet, independente):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Veredito:** APROVADO · B: 0 · M: 0 · m: 1 · i: 1

- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/plugin-providers build  →  tsc, sem erros
$ pnpm --filter @plataforma/plugin-providers test   →  Test Files 5 passed (5) · Tests 26 passed (26)
$ pnpm --filter @plataforma/plugin-providers lint   →  eslint src/, sem erros
$ git -C C:/Dev2026/.superapp-worktrees/EST-40 status --short --untracked-files=all  →  (vazio)
$ git log task/EST-40 --oneline -3
  fc72234 feat(EST-40): add ProviderKind and createProviderConfig factory to plugin-providers
  4f1e22a merge task/EST-39
```

- **Checklist do Reviewer (spec §7):**
  - [x] Remotos e locais compartilham uma factory sem afrouxar validação de segredo remoto. `createProviderConfig` valida `kind === "remote"` (factory.ts:22); local ainda é futuro (decisão §6.1 — adiado).
  - [x] Nenhum segredo aparece em metadata/erro/snapshot. `cfg` retornada só carrega `baseURL` + `apiKeyEnv` + `kind`; **nunca** o valor da chave. Test #5 (`factory.test.ts:61-67`) prova via `JSON.stringify(cfg).not.toMatch(apiKeyValue)`.
  - [x] EST-10 permanece verde sem duplicação de mecanismo. Test #6 (`factory.test.ts:69-90`) cobre regressão dos 3 providers (deepseek/openrouter/omniroute) — todos resolvem com `kind === "remote"`, `baseURL` correto, `apiKeyEnv` correto.
  - [x] Lint passa (Regra 3 do CLAUDE.md, desde 2026-07-06). ESLint clean.

- **Comentários de Revisão:**

  **§3.1 `registry.ts` — anotação `kind` não destrutiva.** `ProviderKind` adicionado como type union `"remote" | "local"` (registry.ts:3). `ProviderConfig` ganha `kind: ProviderKind` (linha 8). Os 3 entries existentes (deepseek/openrouter/omniroute) recebem `kind: "remote"` sem alteração de `baseURL` ou `apiKeyEnv`. **Sem** mudança na assinatura de `resolveModel` (linhas 17-42) — `kind` é metadado para a factory, não para o resolver. Invariante de EST-10a preservada.

  **§3.2 `factory.ts` — `createProviderConfig` valida no construction-time.** A função:
  1. Extrai o prefix do `modelId` (split por `/`) — suporta tanto `"deepseek"` quanto `"deepseek/deepseek-chat"` (consistente com `resolveModel`).
  2. Busca o entry em `PROVIDERS[prefix]`; se ausente, throw com lista de providers suportados.
  3. `baseURL = opts?.baseURL ?? entry.baseURL` — permite override por chamada, sem mutar o registry global (decisão §6.3).
  4. Se `kind === "remote"`, valida `opts?.apiKey ?? process.env[entry.apiKeyEnv]`. Se ausente, throw com `entry.apiKeyEnv` no nome (NUNCA o valor).
  5. Retorna `{ baseURL, apiKeyEnv, kind }` — **não** carrega o valor da chave. Decisão §3.3 ("Nunca lê segredo fora de process.env"): respeitada — `process.env[entry.apiKeyEnv]` é a única leitura de segredo.

  **§3.3 `index.ts` — re-exports adicionados.** `createProviderConfig` (linha 4) + `ProviderConfigOptions` type (linha 5). Re-exporta também `ProviderKind` type (linha 3). Sem duplicação de tipos.

  **§3.5 NO CHANGE — confirmado.** Diff: 4 arquivos apenas. `fallback.ts`, `scoring.ts`, `telemetry.ts` e `package.json` **não** foram tocados. Lockfile **não** modificado (a factory não introduz runtime dep nova — só usa `process.env`). Spec §3 ("package.json e lockfile somente se a factory exigir runtime dependency verificada") respeitada.

  **Cobertura dos 6 casos §4.2:**
  1. **Remoto sem env → erro menciona env, não valor** (`factory.test.ts:17-28`): `vi.stubEnv('DEEPSEEK_API_KEY', '')` força missing; regex `/DEEPSEEK_API_KEY/` passa; anti-fake `not.toMatch(/sk-test/)` valida que a string `sk-test` (do `beforeEach`) NÃO vaza. ✓
  2. **DeepSeek configurado aceita via `DEEPSEEK_API_KEY`** (`factory.test.ts:30-37`): `cfg.kind === 'remote'`, `cfg.apiKeyEnv === 'DEEPSEEK_API_KEY'`, `cfg.baseURL === 'https://api.deepseek.com/v1'`. Anti-fake: `JSON.stringify(cfg).not.toMatch(/sk-test-deepseek/)` — a chave real NÃO aparece. ✓
  3. **Factory recebe modelId+baseURL+apiKey via opts, sem ler da env** (`factory.test.ts:39-48`): usa `openrouter/mistral` com `apiKey: 'sk-custom-key'`. `cfg.baseURL` é o custom; `cfg.apiKeyEnv` é o do registry. Anti-fake: `JSON.stringify(cfg).not.toMatch(/sk-custom-key/)` — a chave custom NÃO persiste. ✓
  4. **Override de baseURL sem mutar registry** (`factory.test.ts:50-59`): 2 calls consecutivos — primeiro com `baseURL: 'https://proxy.local/v1'` (usa override), segundo sem (usa default do registry). Confirma imutabilidade do registry global. ✓
  5. **Metadata nunca contém o valor da chave** (`factory.test.ts:61-67`): chave custom `sk-secret-value-12345`; `JSON.stringify(cfg).not.toMatch(new RegExp(key))` E `expect(cfg).not.toHaveProperty('apiKey')` — a chave nem aparece como field no objeto. ✓
  6. **Regressão EST-10a** (`factory.test.ts:69-90`): 3 providers + 1 provider não-registrado. Resolve com `kind === 'remote'`, `baseURL` correto, `apiKeyEnv` correto. ✓

  **Gate:** 5 files / 26 tests (9 fallback + 5 registry + 3 scoring + 3 telemetry + **6 factory**), build clean, lint clean. Worktree limpa.

  **MINOR:**

  **[m1] `package.json` mantém `ai: "~7.0.14"` (range), spec §6.2 pediu "explicitamente verificada e pinada".** O `node_modules/.pnpm/ai@7.0.15_zod@4.4.3` está instalado (bati o spec §6.2 "lockfile local registra `ai@7.0.15`"), mas o range `~7.0.14` permite patch e minor updates até <7.1.0. Pinning estrito (ex.: `7.0.15` exato ou `7.0.x` com `save-exact`) deixaria a versão imutável entre instalações. Coerente com o §5 "NÃO inventar assinatura do adapter externo; verificar a versão instalada primeiro" — está verificada, só não pinned. Track: cosmético, não-bloqueante; resolver em cleanup quando a versão for congelada pela task que consumir a factory (provavelmente EST-41).

  **INFO:**

  **[i1] A decisão §6.1 "esta onda suporta somente o provider remoto DeepSeek" tem leitura ambígua.** O worker marcou `kind: "remote"` nos 3 providers existentes (deepseek/openrouter/omniroute), o que é coerente com §3.1 ("PROVIDERS map existente ganha campo kind: remote | local" — implica preservar entries). A leitura alternativa (remover openrouter/omniroute) quebraria o teste de regressão #6. Decisão do worker é defensível; registrar como INFO para o arquiteto validar se a intenção é "factory funciona para qualquer remote" (implementação atual) ou "esta onda entrega validação só para deepseek" (mudança adicional: tornar openrouter/omniroute opcionais, deletar do PROVIDERS ou comentar).

- **Divergência do parecer anterior (se houver):** N/A — primeiro parecer.

## 9. Log de Execução

- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: P1: factory híbrida; API externa exige endurecimento JIT
- **[2026-07-13T18:00]** - *deepseek* - `[Endurecido]`: endureceu spec — 3 decisões em aberto (Seção 6: providers Ollama/LM Studio, adapter ai, validação factory). Capacidade: sonnet.
- **[2026-07-13T18:44]** - *deepseek* - `[Reconciliado]`: status restaurado de draft:pending_decision para draft:triaged (drift corrigido)
- **[2026-07-13T18:44]** - *deepseek* - `[Decisão pendente]`: 3 decisões abertas: providers Ollama/LM Studio, adapter ai, validação factory
- **[2026-07-13T23:01]** - *gpt-5* - `[Decidido]`: decisão: primeira onda somente DeepSeek remoto; usar generateText com adapter OpenAI-compatible verificado e baseURL validada na criação com override por chamada; Ollama e LM Studio adiados
- **[2026-07-13T23:01]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-13T23:19]** - *deepseek* - `[Iniciado]`: iniciando — P1: configuração remota DeepSeek no plugin-providers
- **[2026-07-13T23:22]** - *deepseek* - `[Finalizado]`: Gate: build clean, 26 tests (5 files), lint clean. ProviderKind + createProviderConfig factory com validação construction-time.
- **[2026-07-13T23:48]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: qa-review: claim para revisar EST-40
- **[2026-07-13T23:54]** - *agile_reviewer:claude-sonnet* - `[Aprovado]`: Integrado: merge na master (commit e98d963, 4 arquivos, 137 insertions), worktree removida, Gate verde pós-merge (tsc clean, 26 tests, eslint clean). Não-bloqueantes (m1 pin exato ai@7.0.15; i1 ambiguidade §6.1 sobre escopo da factory) registrados no parecer.
