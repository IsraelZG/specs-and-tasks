---
id: EST-18
title: "Extração seletiva de provedores apikey-estáticos do OmniRoute para o plugin-providers (uso sem sidecar)"
status: done
complexity: 2
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-10a", "EST-17"]
blocks: []
capacity_target: haiku
test_profile: backend
---

# EST-18 · Extração seletiva de provedores apikey-estáticos

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-18`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest.
- **Capacidade-alvo:** haiku (edição declarativa de registro e testes de resolução).

## 1. Objetivo
Extrair de forma nativa e sem necessidade de sidecar (`EST-17`) as entradas de provedores `apikey` com endpoints estáticos do catálogo do vendor OmniRoute para o `PROVIDERS` do `packages/plugin-providers/src/registry.ts`, permitindo que a frota utilize diretamente os provedores `groq`, `cerebras` e `together` via variáveis de ambiente estáticas (`GROQ_API_KEY`, `CEREBRAS_API_KEY`, `TOGETHER_API_KEY`).

## 2. Contexto RAG
- [ ] `docs/_vendor/OmniRoute/open-sse/config/providers/registry/groq/index.ts` — fonte oficial da `baseUrl` do Groq (`https://api.groq.com/openai/v1`).
- [ ] `docs/_vendor/OmniRoute/open-sse/config/providers/registry/cerebras/index.ts` — fonte oficial da `baseUrl` do Cerebras (`https://api.cerebras.ai/v1`).
- [ ] `docs/_vendor/OmniRoute/open-sse/config/providers/registry/together/index.ts` — fonte oficial da `baseUrl` do Together (`https://api.together.xyz/v1`).
- [ ] `packages/plugin-providers/src/registry.ts` — registro de provedores (`PROVIDERS`).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/_vendor/OmniRoute/open-sse/config/providers/registry/{groq,cerebras,together}/index.ts`.
- **[READ]** `packages/plugin-providers/src/registry.ts`.
- **[UPDATE]** `packages/plugin-providers/src/registry.ts` — adicionar entradas `groq`, `cerebras`, `together` ao mapa `PROVIDERS`.
- **[UPDATE]** `packages/plugin-providers/tests/registry.test.ts` — adicionar cenários de teste para resolução das novas entradas e validação de `apiKeyEnv`.

### Entradas Derivadas a Injetar em `PROVIDERS` (packages/plugin-providers/src/registry.ts)
```typescript
// Extraídos do catálogo vendor OmniRoute (docs/_vendor/OmniRoute/open-sse/config/providers/registry/)
export const PROVIDERS: Record<string, ProviderConfig> = {
  deepseek:   { baseURL: 'https://api.deepseek.com/v1',  apiKeyEnv: 'DEEPSEEK_API_KEY',  kind: "remote" },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', apiKeyEnv: 'OPENROUTER_API_KEY', kind: "remote" },
  omniroute:  { baseURL: 'http://127.0.0.1:20128/v1',    apiKeyEnv: 'OMNIROUTE_API_KEY',  kind: "remote" },
  groq:       { baseURL: 'https://api.groq.com/openai/v1',    apiKeyEnv: 'GROQ_API_KEY',     kind: "remote" },
  cerebras:   { baseURL: 'https://api.cerebras.ai/v1',        apiKeyEnv: 'CEREBRAS_API_KEY',   kind: "remote" },
  together:   { baseURL: 'https://api.together.xyz/v1',      apiKeyEnv: 'TOGETHER_API_KEY',   kind: "remote" },
};
```

## 4. Estratégia de Testes Estrita
Enumeração dos 3 casos de teste obrigatórios em `packages/plugin-providers/tests/registry.test.ts`:

1. **Resolução de Provedores Extraídos:** `resolveModel('groq/llama-3.3-70b-versatile', factory)` e `resolveModel('cerebras/gpt-oss-120b', factory)` resolvem com sucesso invocando o factory correto com a baseURL derivada.
2. **Validação de Variável de Ambiente Ausente:** Invocar `resolveModel('groq/...')` sem `GROQ_API_KEY` definida no `process.env` lança o erro explícito `GROQ_API_KEY ausente (use --env-file)`.
3. **Invariante de Chaves no Registro:** `Object.keys(PROVIDERS)` contém obrigatoriamente `['deepseek', 'openrouter', 'omniroute', 'groq', 'cerebras', 'together']`.

## 5. Não fazer
- NÃO inventar URLs de memória; utilizar estritamente as URLs derivadas do repositório vendor `docs/_vendor/OmniRoute/`.
- NÃO alterar a estrutura de `resolveModel` nem quebrar suporte aos provedores pré-existentes (`deepseek`, `openrouter`, `omniroute`).

## 6. Feedback de Especificação
- Gatilho da §5 disparado pelo usuário (2026-07-22).
- Fontes auditadas em `docs/_vendor/OmniRoute/open-sse/config/providers/registry/`.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/plugin-providers --profile backend
```
*(Executa `pnpm --filter @plataforma/plugin-providers build`, `test` e `lint`, colando evidências na Seção 8).*

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Extração seletiva concluída: `groq`, `cerebras` e `together` adicionados ao `PROVIDERS` com baseURLs derivadas do catálogo vendor OmniRoute (`docs/_vendor/OmniRoute/open-sse/config/providers/registry/{groq,cerebras,together}/index.ts`, baseUrls oficiais menos o sufixo `/chat/completions`).
- `resolveModel` intocado (§5 respeitado); provedores pré-existentes (`deepseek`, `openrouter`, `omniroute`) preservados.
- Testes: 7/7 passando — caso 6 cobre resolução de `groq/llama-3.3-70b-versatile` e `cerebras/gpt-oss-120b` com factory invocado e configs derivadas; caso 7 cobre `GROQ_API_KEY ausente (use --env-file)`; caso 4 cobre a invariante de chaves `['deepseek', 'openrouter', 'omniroute', 'groq', 'cerebras', 'together']`.
- Artefato de gate: `.gate/dab6a75c9ac952046e9f64b9b59869f76d95163f.json` (profile=backend, allGreen=true), commitado na branch `task/EST-18`.

Evidência literal do Gate (`pnpm gate @plataforma/plugin-providers --profile backend`):

```
Scope: all 35 workspace projects
[WARN] There are cyclic workspace dependencies: C:\Dev2026\.superapp-worktrees\_slot-2\packages\protocol, C:\Dev2026\.superapp-worktrees\_slot-2\packages\testkit
Lockfile is up to date, resolution step is skipped
Already up to date

Done in 2.5s using pnpm v11.1.2
[validação] gate:_slot-2: aguardando na posição 1
[validação] gate:_slot-2: slot adquirido
✅ @plataforma/plugin-providers:build | exit=0 | 6115ms
✅ @plataforma/plugin-providers:test | exit=0 | 4916ms
✅ @plataforma/plugin-providers:lint | exit=0 | 9082ms

📦 artefato: .gate/dab6a75c9ac952046e9f64b9b59869f76d95163f.json | profile=backend | allGreen=true
[validação] gate:_slot-2: slot liberado
```

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**

**Reviewer 1** — *agile_reviewer:minimax-m3* — 2026-07-23

**Modelo:** minimax-m3 (≠ kimi-k3 que codou — revisão independente, sem ancoragem).

**Veredicto: APROVADO** — 0 B / 0 M / 0 m · gate backend válido · diff estritamente dentro da Seção 3.

#### Diff × Seção 3 (gate obrigatório)

| Declarado (Seção 3) | Alterado | Disposição |
|---|---|---|
| `[UPDATE] packages/plugin-providers/src/registry.ts` | ✅ 4 linhas (+3 entradas + 1 comentário de origem) | OK |
| `[UPDATE] packages/plugin-providers/tests/registry.test.ts` | ✅ 43 inserções / 3 deleções (3 stubs + 1 teste reescrito + 2 testes novos) | OK |
| Gate artifact `.gate/<sha>.json` (esperado por §7) | ✅ `.gate/dab6a75c9ac952046e9f64b9b59869f76d95163f.json` | OK |
| `apps/estaleiro/**`, `apps/estaleiro/e2e/**`, outras mudanças | ❌ não constam do diff branch-only (merge-base 3b74e01..task/EST-18 é estritamente as 2 entradas EST-18) | N/A — já no master |

#### Auditoria de código (Nível 0)

- `resolveModel` intocado (§5 respeitado). Diff isolado ao mapa `PROVIDERS`.
- Provedores pré-existentes (`deepseek`, `openrouter`, `omniroute`) preservados byte-a-byte.
- `baseURL` derivados estritamente do vendor OmniRoute (validado contra `C:\Dev2026\omniroute\open-sse\config\providers\registry\{groq,cerebras,together}\index.ts`):
  - groq: vendor `https://api.groq.com/openai/v1/chat/completions` → registry `https://api.groq.com/openai/v1` ✅
  - cerebras: vendor `https://api.cerebras.ai/v1/chat/completions` → registry `https://api.cerebras.ai/v1` ✅
  - together: vendor `https://api.together.xyz/v1/chat/completions` → registry `https://api.together.xyz/v1` ✅
  - Sufixo `/chat/completions` removido consistentemente (mesmo padrão que `deepseek`/`openrouter` já usavam).
- `apiKeyEnv` consistente com o padrão existente (`<PROVIDER>_API_KEY` em SCREAMING_SNAKE).
- Erro lançado por `resolveModel` quando env ausente: `${cfg.apiKeyEnv} ausente (use --env-file)` — match exato com a asserção do teste 7.

#### Estratégia de testes (Seção 4)

3 cenários obrigatórios do §4 + 4 cenários pré-existentes preservados = 7 testes totais no arquivo, todos verdes.

- Caso 6 cobre §4.1 (resolução `groq/llama-3.3-70b-versatile` e `cerebras/gpt-oss-120b`, factory invocado com modelId correto, configs `baseURL`/`apiKeyEnv`/`kind` validadas, `together` validado por inspeção direta do PROVIDERS).
- Caso 7 cobre §4.2 (string exata `GROQ_API_KEY ausente (use --env-file)`).
- Caso 4 (reescrito) cobre §4.3 (invariante das 6 chaves na ordem literal).
- Sonda focal: `pnpm exec vitest run tests/registry.test.ts` no worktree → 7/7 passando, 631ms.

#### Validação do artefato de gate

- Localizado: `.gate/dab6a75c9ac952046e9f64b9b59869f76d95163f.json` (commitado em `fbcd9e0`).
- `treeSha` declarado: `dab6a75c9ac952046e9f64b9b59869f76d95163f`.
- `HEAD^{tree}`: `f74b998fe08aba8de06a1c1d111a4eabaa7e5429`.
- `HEAD^{tree}` com entrada `.gate/` removida via `git ls-tree | grep -v '\.gate' | git mktree`: `dab6a75c9ac952046e9f64b9b59869f76d95163f` — **match exato** (o `treeSha` exclui a entrada `.gate/` por design do `gate.mjs:120-128`).
- `profile: backend` (confere com `test_profile: backend` declarado no frontmatter).
- `allGreen: true`; 3 fases (build 0, test 0 = 42/42 tests, lint 0).
- `headSha`/`finalHeadSha` = `36f135573d4df0cd2091c66623f5e11fa9580348` (commit `wip(EST-18)` que recebeu o commit do artefato `feat(EST-18)` em `fbcd9e0`).

#### E2E (Regra 3b do MGTIA)

Não aplicável. `test_profile: backend` declarado; sem `ui: true`; sem fluxo observável de produto. Suite Vitest + build + lint é o apropriado.

#### Observações menores (não-bloqueantes)

- A spec Seção 3 traz as 3 novas linhas com alinhamento de espaços ligeiramente diferente do aplicado (cosmético, semântico idêntico). Já é o caso das linhas pré-existentes também — manter como está, não vale commit cosmético.
- `appRouter-mistral` continua testado pelo caso 3; junto com `openrouter` foi preservado, nada quebrou.

#### Síntese

Implementação contida, testada e alinhada com a spec. Proceder à integração.

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-07T00:09]** - *claude-fable* - `[Triado]`: triada: task-gatilho de extracao seletiva apikey-estaticos; endurecer SO quando gatilho da §5 disparar.
- **[2026-07-22T19:54]** - *gemini-3.6-flash* - `[Hardened]`: Spec endurecida com extração oficial dos provedores groq, cerebras e together do catálogo OmniRoute vendor.

- **[2026-07-22T22:54]** - *Antigravity* - `[Endurecido]`: endureceu spec EST-18 com extração de provedores vendor
- **[2026-07-22T22:54]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-22T23:45]** - *kimi-k3* - `[Iniciado]`: iniciando
- **[2026-07-22T23:51]** - *kimi-k3* - `[Finalizado]`: providers groq/cerebras/together extraidos do vendor OmniRoute; 7/7 testes; gate backend allGreen (build 0, test 0, lint 0)
- **[2026-07-23T00:25]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando EST-18 (extração seletiva de provedores)
- **[2026-07-23T00:34]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (1b78b106a105999697f2433188ba2e8cc06a46e4), slot _slot-2 liberado, Gate verde (build 0, test 0 [42/42], lint 0; allGreen=true; artefato .gate/8c8f6b2cd6f651cb49855a92e9a68efd2296a120.json). 0 não-bloqueantes → sem entrada no ledger.
