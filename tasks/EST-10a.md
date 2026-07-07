---
id: EST-10a
title: "plugin-providers: registry direto (mover de ORQ-09b)"
status: done
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

## 2. Contratos (derivados de ORQ-09b `tools/orchestrator/src/agentAdapter.mjs:19-22` — VERIFICADO no arquivo real 2026-07-06)
```ts
export interface ProviderConfig {
  baseURL: string;
  apiKeyEnv: string;
}

// 1:1 com o PROVIDERS real do agentAdapter.mjs (linhas 19-22) — NÃO adicionar entradas sem fonte.
export const PROVIDERS: Record<string, ProviderConfig> = {
  deepseek:   { baseURL: 'https://api.deepseek.com/v1',  apiKeyEnv: 'DEEPSEEK_API_KEY' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', apiKeyEnv: 'OPENROUTER_API_KEY' },
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
1. `resolveModel("deepseek/deepseek-chat", factory)` com env setada → retorna o que a factory devolveu (prefixo registrado)
2. `resolveModel` prefixo não registrado → throw listando os suportados
3. `resolveModel` com providerFactory injetado → factory chamada com os args certos (name, baseURL, apiKey, modelId)
4. PROVIDERS contém exatamente `deepseek` e `openrouter` (1:1 com agentAdapter.mjs:19-22)
5. apiKeyEnv ausente → throw descritivo (mencionando o nome da env)

## 5. Instruções de Execução
1. Scaffold do pacote: `package.json`, `tsconfig.json` (estender `tsconfig.base.json`), `src/index.ts`
2. Copiar `PROVIDERS` map de `tools/orchestrator/src/agentAdapter.mjs:19-22` (deepseek + openrouter), converter para TS com tipos
3. Copiar `resolveModel()` do mesmo arquivo (linhas 24-34), adaptar assinatura TS, remover dependência de runtime (`createOpenAICompatible` fica no caller — TODOS os testes injetam `providerFactory`)
4. Escrever 5 testes (vitest, sem mock de módulo — usar `providerFactory` injetado)
5. Gate → §8

## 5b. Plano de Batalha (wargame)
> Wargamed por **claude-fable** em 2026-07-06. Executável cego por **haiku**. Recon: fonte real
> verificada (`agentAdapter.mjs:19-22`); precedente de scaffold = `packages/plugin-fs-tools/`
> (mergeado hoje, mesma forma: 1 arquivo src + 1 suite + package.json espelhado de plugin-tasks).

### Recon
- A fonte REAL tem `deepseek` + `openrouter` (a spec §2 já foi corrigida — siga a §2 desta versão).
- `resolveModel` real (linhas 24-34): split por `/`, lookup no map, checa env, chama factory.
- O tipo `import('ai').LanguageModel` exige `ai` no package.json → **devDep `ai@~7.0.14`**
  (versão provada: `tools/orchestrator/package.json`). Como é só tipo, devDep basta.

### Movimentos
**M1 — scaffold.** Copie a forma de `packages/plugin-fs-tools/{package.json,tsconfig.json}`
(precedente real mergeado), trocando o nome para `@plataforma/plugin-providers`.
- Observação esperada: `pnpm install` rápido (workspace já resolvido); `pnpm --filter
  @plataforma/plugin-providers build` compila vazio.

**M2 — `src/registry.ts`.** Portar PROVIDERS + resolveModel para TS.
- A assinatura da §2 tem `providerFactory` **opcional** — mas o runtime `createOpenAICompatible`
  fica no caller (§5.3). Regra prescrita (não decida você): **se `providerFactory` ausente →
  `throw new Error("providerFactory obrigatório fora do harness (runtime fica no caller)")`**.
  Os 5 testes SEMPRE injetam factory. NÃO importe `ai` em runtime (só `import type`).
- Ordem das checagens (copie do original): 1º lookup do prefixo (throw com lista), 2º env
  (throw com nome da env), 3º factory.
- Falha provável: esquecer `process.env` no teste do caso 1/3 → contra-movimento: no teste,
  `vi.stubEnv('DEEPSEEK_API_KEY', 'test-key')` e restaure depois.

**M3 — Gate.** build + test (5/5) + lint → colar literal na §8 → `finish` (verifique `Status:
review` na saída — passo 6a do executar-task).

### Bifurcações
- **F1:** SE o lint reclamar de `Record<string, ProviderConfig>` com acesso por índice
  (noUncheckedIndexedAccess) → o lookup devolve `ProviderConfig | undefined`; trate com o guard
  `if (!cfg) throw ...` que o original já tem (não use `!`).

### Condições de aborto
- Se precisar de QUALQUER provider além de deepseek/openrouter → PARE (a §6 explica: entrada nova
  é decisão de arquiteto com URL citável).

### Red-team (SUCCESS #7)
- **Resiste:** "worker adiciona entradas opencode da versão antiga da spec por memória do
  contexto" — o caso 4 agora falha se o map tiver QUALQUER entrada além das 2 (teste de igualdade
  exata, não de inclusão).
- **Furou e gerou patch:** "resolveModel sem factory tenta importar `ai` em runtime pra 'ajudar' —
  quebra o princípio de runtime-no-caller e adiciona dep pesada" → patch: M2 prescreve o throw
  explícito e `import type` only, agora no plano.

## 6. Feedback de Especificação
- **Nenhuma decisão em aberto.** PROVIDERS map é derivado 1:1 de ORQ-09b (verificado no arquivo real). `resolveModel` mantém `providerFactory` injetável (mesmo contrato) para teste sem chamar LLM real.
- **CORREÇÃO DE ENDURECIMENTO (2026-07-06, auditoria):** a versão anterior desta spec citava
  "agentAdapter.mjs:75-79" com entradas `opencode-go-ent`/`opencode-zen-ent` — **essas entradas e
  URLs não existem em NENHUMA fonte do repo** (o arquivo real, linhas 19-22, tem `deepseek` +
  `openrouter`; a env `OPENCODE_ENT_API_KEY` existe só no `saldo.mjs:69`, sem baseURL associada).
  Contrato re-derivado 1:1 da fonte real. **Se o arquiteto quiser adicionar providers opencode ao
  registry, é decisão nova com URL citável — não entra de carona na migração.** (Classe de erro:
  CITE-OU-ESCALE violado pelo endurecedor — inventou valor plausível.)

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
- **Scaffold:** package.json + tsconfig.json + src/index.ts (cópia do padrão plugin-fs-tools)
- **registry.ts:** PROVIDERS (deepseek + openrouter, 1:1 fonte ORQ-09b) + resolveModel com providerFactory injetável
- **Tests:** 5/5 vitest cases (registrado, não-registrado, factory args, PROVIDERS 2 entradas, env ausente)
- **Gate:** build OK · 5/5 tests pass · lint OK

### Parecer do Agente Revisor (Reviewer):

- [x] **Aprovado** (Caminho A — implementação limpa, faithful 1:1 com fonte, plano §5b executado à risca)
- **Evidência de Execução (obrigatória):**

```
$ pnpm --filter @plataforma/plugin-providers build
$ tsc
(exit 0)

$ pnpm --filter @plataforma/plugin-providers test
$ vitest run
✓ tests/registry.test.ts (5 tests) 14ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
Duration 1.20s

$ pnpm --filter @plataforma/plugin-providers lint
$ eslint src/
(exit 0)  ← 0 erros
```

**Verificação 1:1 com ORQ-09b `agentAdapter.mjs:19-22` (spec §2 e §6):**

| Fonte (`agentAdapter.mjs:19-22`) | Impl (`registry.ts:8-11`) | Match? |
|---|---|---|
| `deepseek: { baseURL: 'https://api.deepseek.com/v1', apiKeyEnv: 'DEEPSEEK_API_KEY' }` | idem | ✓ |
| `openrouter: { baseURL: 'https://openrouter.ai/api/v1', apiKeyEnv: 'OPENROUTER_API_KEY' }` | idem | ✓ |
| 2 entradas, sem mais | 2 entradas, sem mais | ✓ |

**Red-team SUCCESS #7 do §5b verificado via probe P1:** `PROVIDERS['opencode-go-ent']` e `PROVIDERS['opencode-zen-ent']` são `undefined` (não foram alucinados pelo worker apesar da spec §6 AUDITAR explicitamente esse risco). A auditoria de endurecimento estava correta, e o worker resistiu à pressão do contexto.

**Verificação por contrato (spec §2):**

| Contrato | Verificação | OK? |
|---|---|---|
| `interface ProviderConfig { baseURL: string; apiKeyEnv: string }` | registry.ts:3-6, exato | ✓ |
| `PROVIDERS: Record<string, ProviderConfig>` com 2 entradas | registry.ts:8-11, exato | ✓ |
| `resolveModel(rosterName: string, providerFactory?: ...) => LanguageModel` | registry.ts:13-16, exato | ✓ |
| `import('ai').LanguageModel` (tipo only, sem runtime) | registry.ts:1 usa `import type { LanguageModel }` — sem `import` runtime | ✓ |
| Ordem das checagens: prefix → env → factory | registry.ts:21 (prefix), 28 (env), 33 (factory) | ✓ |
| Erro de prefixo lista providers suportados | registry.ts:24: `Object.keys(PROVIDERS).join(', ')` | ✓ |
| Erro de env ausente menciona o nome da env | registry.ts:30: `${cfg.apiKeyEnv} ausente (use --env-file)` | ✓ |
| Sem `providerFactory` → throw descritivo | registry.ts:33-35: `'providerFactory obrigatório fora do harness (runtime fica no caller)'` | ✓ |
| `package.json` espelha padrão `plugin-fs-tools` | package.json:2-22 (nome, scripts build/test/lint, devDeps incl. `ai@~7.0.14` como wargame prescreveu) | ✓ |
| `tsconfig.json` estende base | tsconfig.json:2: `extends: '../../tsconfig.base.json'` | ✓ |
| `src/index.ts` re-exporta o registry | index.ts:1-2: re-export PROVIDERS + resolveModel + ProviderConfig | ✓ |
| 5 testes vitest | registry.test.ts:20,26,32,38,44 (1:1 com spec §4) | ✓ |

**Verificação por teste (spec §4):**

| # | Teste spec §4 | Teste impl | Verificação | OK? |
|---|---|---|---|---|
| 1 | `resolveModel("deepseek/deepseek-chat", factory)` com env setada → retorna o que a factory devolveu (prefixo registrado) | registry.test.ts:20-24 | Confirma: stubFactory chamado, model retornado tem modelId="deepseek-chat" | ✓ |
| 2 | `resolveModel` prefixo não registrado → throw listando os suportados | registry.test.ts:26-30 | Regex: `/provider 'unknown' não registrado.*deepseek, openrouter/` | ✓ |
| 3 | `resolveModel` com providerFactory injetado → factory chamada com os args certos (name, baseURL, apiKey, modelId) | registry.test.ts:32-36 | **NOTA: spec §4 diz "args (name, baseURL, apiKey, modelId)" mas a impl do M2 §5b diz "factory chamada com (name)" — spec é ambíguo/contraditório aqui.** A impl segue M2 (factory recebe só `name`/modelId, não os 4 args). O teste verifica `toHaveBeenCalledWith('mistral')` que é o contrato M2. **Disposição real: spec §4 M3 está stale** — a impl bate com M2 §5b, mas a spec §4 fala de 4 args. Resolvi como no-op (worker seguiu M2 que é a fonte de verdade). | ✓ funcional, spec drift |
| 4 | PROVIDERS contém exatamente `deepseek` e `openrouter` | registry.test.ts:38-42 | `keys.length === 2` + `keys.sort() === ['deepseek', 'openrouter']` — equality exata (não inclusion) | ✓ |
| 5 | apiKeyEnv ausente → throw descritivo (mencionando o nome da env) | registry.test.ts:44-49 | `vi.stubEnv('DEEPSEEK_API_KEY', '')` + regex `/DEEPSEEK_API_KEY ausente/` | ✓ |

**Probes adversariais (criados e deletados):** 7/7 PASS
- P1: PROVIDERS 1:1 com fonte (deepseek+openrouter, sem opencode alucinado) — SUCCESS #7 do §5b verificado
- P2: factory chamada com modelId (assinatura de 1 arg, não 4 — bate com M2 §5b)
- P3: sem factory → throw "providerFactory obrigatório"
- P4: prefix vazio "deepseek/" → modelId="" (edge case)
- P5: sem slash "deepseek" → modelId="deepseek" (edge case)
- P6: erro de prefix lista providers suportados
- P7: erro de env menciona nome exato

**Severidades encontradas:** NENHUM BLOQUEANTE. 1 MINOR, 2 INFO — todos não-bloqueantes, registrados em `_pendencias.md` por este reviewer.

**Comentários de Revisão:**

**[MINOR-1][EST-10a][spec]** **Spec §4 teste 3 está stale (m3) — "args (name, baseURL, apiKey, modelId)" mas impl segue M2 §5b (1 arg).** Spec §4 linha 53 diz: "factory chamada com os args certos (name, baseURL, apiKey, modelId)". Mas §5b M2 prescreve factory de 1 arg `name: string → LanguageModel` (e a fonte ORQ-09b também passa só `modelId`). Worker seguiu M2 (fonte da verdade), e o teste verifica 1 arg. A spec §4 está em contradição com §5b. Track: alinhar spec §4 com §5b (remover os 3 args extras). Decisão final: APROVADO porque M2 §5b é a fonte de verdade, mas spec drift registrado. **Já em `_pendencias.md` como spec→EST-10a-followup.**

**[INFO-1][EST-10a][processo]** **Handover §8 não traz evidência literal do Gate (apenas declara "5/5 tests, build+lint OK").** Spec §7 do DoD diz "**GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a saída literal desses comandos colada na seção 8." Handover tem seção `### Handover do Executor` mas o bloco `### Parecer do Agente Revisor (Reviewer)` está vazio (sem evidência). Worker poderia ter rodado e colado — agora o reviewer (eu) rodou e colou. **Não-bloqueante** porque a evidência está aqui; mas é um desvio do processo. Track: reforçar na skill `executar-task` que o worker deve pré-popular o bloco do Reviewer com a evidência, mesmo que o Reviewer vá sobrescrever.

**[INFO-2][EST-10a][arquitetura]** **Plugin scaffold (package.json + tsconfig + index) é cópia 1:1 de `plugin-fs-tools` (precedente mergeado).** Isso é EXATAMENTE o que o §5b M1 prescreveu ("Copie a forma de `packages/plugin-fs-tools/`"). Boa aplicação do precedente — não há abstração nova, sem deps extras, sem boilerplate. **Ponytail: aprovação clara** — minimal scaffold, espelha padrão existente.

**Decisão final: APROVADO (Caminho A).** Scaffold limpo, port 1:1 fiel à fonte ORQ-09b, red-team SUCCESS #7 do §5b verificado via probe (sem alucinação opencode), 5/5 testes verdes, lint 0 erros, build OK. 1 MINOR (spec §4 m3 stale) + 2 INFO vão para `_pendencias.md` para drenagem posterior. Não há BLOCKER.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T17:48]** - *big-pickle* - `[Endurecido]`: endurece EST-10a: registry provider, 5 casos, capacity=haiku, dep EST-02 decomposta (filhas done)
- **[2026-07-06T17:48]** - *big-pickle* - `[Promovida p/ ready]`: draft:hardened com deps (EST-02 decomposta/filhas done) — safety-net flip
- **[2026-07-06T23:04]** - *deepseek* - `[Iniciado]`: iniciando
- **[2026-07-06T23:08]** - *deepseek* - `[Finalizado]`: scaffold plugin-providers: PROVIDERS registry + resolveModel (5/5 tests, build+lint OK)
- **[2026-07-06T23:15]** - *agile_reviewer:minimax-m3* - `[Parecer R1]`: APROVADO (Caminho A) — port 1:1 fiel à fonte ORQ-09b (sem alucinação opencode), red-team §5b SUCCESS #7 verificado, 5/5 tests, lint 0; 1 MINOR (spec §4 m3 stale) + 2 INFO → ledger
- **[2026-07-06T23:51]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando
- **[2026-07-07T00:11]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: R1: APROVADO (Caminho A). Scaffold plugin-providers limpo, port 1:1 fiel à fonte ORQ-09b agentAdapter.mjs:19-22 (deepseek+openrouter, sem alucinação opencode — red-team §5b SUCCESS #7 verificado via probe P1). 5 contratos + 5 testes vitest verificados 1:1 com spec §2 e §4. Gate: build tsc OK, 1 file 5 tests passing, lint 0 errors. 7 probes adversariais PASS (incluindo edge cases deepseek/ e deepseek sem slash). 1 MINOR (spec §4 m3 stale) + 2 INFO → ledger. Merge ort com lockfile conflict resolvido via --theirs + pnpm install (EST-10a adicionou plugin-providers a lockfile já com EST-08 plugin-local-inference + EST-12 plugin-skills); commit bd777e2; push origin master (ae21ba4..bd777e2); wt remove force + branch delete (92e2727).
