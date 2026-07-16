---
id: EST-48b
title: "P0.3b Backend de perfis OpenAI-compatible persistidos"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-48a", "EST-40", "EST-41"]
blocks: ["EST-48c", "EST-49a"]
capacity_target: sonnet
---

# EST-48b · P0.3b Backend de perfis OpenAI-compatible persistidos

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-48b`.
- **Pré-condição:** ADR-0018 e contrato `SecretStore` de EST-48a concluídos (`done`).
- **Runtime:** Node.js 20+ · `better-sqlite3` · Vitest.

## 1. Objetivo
Implementar perfis persistidos de endpoints OpenAI-compatible, separando metadata não secreta
(nome, baseURL, providerKind, ativo) do segredo (API key no `SecretStore` cifrado do ADR-0018).
Oferecer API HTTP redigida de CRUD/activate/rotate-key. O chat passa a resolver o perfil ativo
para obter credenciais, mas a remoção final do hardcode de UI ocorre em EST-48c.

## 2. Contexto RAG
- **[ADR-0018](../docs/adr/0018-provider-secret-storage.md)** §Decisão + §Contrato `SecretStore` —
  *fonte absoluta:* `SecretStore { set, get, delete }`, `SecretNotFound`, `SecretStoreUnavailable`,
  `createEncryptedFileSecretStore(opts)`, `resolveMasterKey()`, `resolveVaultPath()`. Zero
  dependências externas, `node:crypto` AES-256-GCM. Derivação em §3 desta spec.
- **[EST-48a](./EST-48a.md)** — spike `done`; produziu o ADR-0018 e o contrato acima. Plano de
  migração (Fase 1) descrito no ADR-0018 §Plano de migração: SecretStore no composition root,
  seed de `process.env` → vault, fallback compatível.
- **[EST-40](./EST-40.md)** — `done`; `packages/plugin-providers/src/registry.ts`:
  `PROVIDERS: Record<string, ProviderConfig>` com `deepseek`/`openrouter`/`omniroute`.
  `ProviderConfig { baseURL, apiKeyEnv, kind }`. `createProviderConfig(modelId, opts?)` em
  `factory.ts` com `opts?.apiKey ?? process.env[...]`.
- **[EST-41](./EST-41.md)** — `done`; composition root (`bootstrap.ts`), rotas `/api/providers`,
  `/api/providers/probe`. Barrels em `apps/estaleiro/core/src/index.ts`.
- **[EST-46](./EST-46.md)** · **[EST-47](./EST-47.md)** — `done`; serviço de chat
  (`chat-service.ts`) e rota `POST /api/chat`. `ChatServiceDeps { createProviderConfig }`.
  `createProviderConfig` é chamado mas o chat-service IGNORA o retorno e lê
  `process.env[config.apiKeyEnv]` diretamente — é uma brecha que esta task fecha.
- **[EST-21](./EST-21.md)** · **[EST-22](./EST-22.md)** — `done`; padrão de storage SQLite
  (`createSqliteStorageBackend`), composition root (`createBootstrap`), `better-sqlite3` WAL.
- **[EST-48c](./EST-48c.md)** — `draft:triaged`; consumidor da API de perfis (UI de Config +
  cut-over do chat). Contrato público desta task é o que EST-48c implementa contra.

## 3. Escopo de Arquivos

### 3.1 `packages/plugin-providers/src/` — tipos públicos de perfil

- **[CREATE]** `packages/plugin-providers/src/profile-types.ts`
  - Exporta tipos consumidos por EST-48c (UI) e por `estaleiro-core`. Nenhuma lógica de runtime.
  - Conteúdo exato:

```ts
// ── Tipos de perfil (contrato público entre EST-48b ↔ EST-48c) ──────

/** Perfil persistido exposto pela API (nunca contém a API key). */
export interface ProviderProfile {
  id: string;
  name: string;
  baseUrl: string;
  providerKind: "remote" | "local";
  hasApiKey: boolean;
  isActive: boolean;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

export interface CreateProfileInput {
  name: string;
  baseUrl: string;
  providerKind?: "remote" | "local";  // default "remote"
  apiKey: string;     // aceito SOMENTE na criação; nunca retornado
}

export interface UpdateProfileInput {
  name?: string;
  baseUrl?: string;
}

export interface RotateKeyInput {
  apiKey: string;     // nova chave (write-only)
}
```

- **[UPDATE]** `packages/plugin-providers/src/index.ts`
  - Adicionar: `export type { ProviderProfile, CreateProfileInput, UpdateProfileInput, RotateKeyInput } from './profile-types.js';`

### 3.2 `apps/estaleiro/core/src/` — SecretStore + ProfileStore + API

- **[CREATE]** `apps/estaleiro/core/src/secret-store.ts`
  - Implementa `createEncryptedFileSecretStore`, `resolveMasterKey`, `resolveVaultPath` conforme
    contrato exato do ADR-0018 §Contrato `SecretStore` (reproduzido abaixo, esta spec é normativa).
  - Usa `node:crypto` (`createCipheriv`/`createDecipheriv`, `randomBytes`, `scryptSync` para
    key derivation da master key, `timingSafeEqual` para verificação de auth tag).
  - Vault: JSON `Record<string, string>` cifrado com AES-256-GCM; IV + auth tag prefixados no
    arquivo (formato binário: `[iv:12B][ciphertext+tag:N]`).
  - `resolveMasterKey()`: ordem (1) `ESTALEIRO_MASTER_KEY` env, (2) `~/.estaleiro/master.key`
    arquivo (permissão 0600), (3) auto-gera 32 bytes aleatórios + persiste em
    `~/.estaleiro/master.key`.
  - `resolveVaultPath()`: `ESTALEIRO_VAULT_PATH` env → default `~/.estaleiro/secrets.enc`.
  - Erros: `SecretNotFound` (name fixo `"SecretNotFound"`), `SecretStoreUnavailable`
    (name fixo `"SecretStoreUnavailable"`, `reason: string`).
  - **NÃO** loga valores de segredo em nenhuma circunstância (erros mencionam nome, não valor).
  - **NÃO** retorna o valor em `set()` (retorna `Promise<void>`).

- **[CREATE]** `apps/estaleiro/core/src/profile-store.ts`
  - Interface + implementação SQLite que gerencia metadata de perfis. Delega segredos ao
    `SecretStore` injetado.
  - Assinaturas exatas:

```ts
import type { ProviderProfile, CreateProfileInput, UpdateProfileInput } from "@plataforma/plugin-providers";
import type { SecretStore } from "./secret-store.js";

export interface ProfileStore {
  list(): Promise<ProviderProfile[]>;
  get(id: string): Promise<ProviderProfile>;
  create(input: CreateProfileInput): Promise<ProviderProfile>;
  update(id: string, input: UpdateProfileInput): Promise<ProviderProfile>;
  delete(id: string): Promise<void>;
  activate(id: string): Promise<ProviderProfile>;   // desativa os outros, ativa este
  getActive(): Promise<ProviderProfile | null>;
  rotateApiKey(id: string, newKey: string): Promise<void>;  // set no SecretStore; não retorna nada
}

export function createProfileStore(
  db: import("better-sqlite3").Database,
  secretStore: SecretStore,
): ProfileStore;
```

  - Tabela SQLite (criada na primeira chamada — migration inline):

```sql
CREATE TABLE IF NOT EXISTS provider_profiles (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  base_url      TEXT NOT NULL,
  provider_kind TEXT NOT NULL DEFAULT 'remote',
  has_api_key   INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

  - `secret_ref` NÃO é coluna no SQLite. O mapeamento `profile:<id>:apikey` é derivado
    deterministicamente — o `SecretStore` usa `profile:<id>:apikey` como nome do segredo.
  - Invariante de ativação: `activate(id)` faz `UPDATE ... SET is_active = 0` em todos,
    depois `UPDATE ... SET is_active = 1 WHERE id = ?`. Operação atômica dentro de transação
    SQLite.
  - `delete(id)`: remove do SQLite **e** chama `secretStore.delete("profile:<id>:apikey")`.
    Se o segredo não existir (`SecretNotFound`), ignora (não é erro).
  - `rotateApiKey(id, newKey)`: chama `secretStore.set("profile:<id>:apikey", newKey)`.
    Atualiza `has_api_key = 1` se ainda não estiver.
  - `list()`/`get()`: nunca retornam `apiKey`; `hasApiKey` deriva de `has_api_key` coluna.

- **[CREATE]** `apps/estaleiro/core/src/profile-routes.ts`
  - Handlers HTTP para as rotas de perfil. Importados e registrados em `bootstrap.ts`.
  - Assinatura:

```ts
import type http from "node:http";
import type { ProfileStore } from "./profile-store.js";

/** Registra todas as rotas /api/profiles/* no router. Retorna true se a rota foi tratada. */
export function handleProfileRoutes(
  store: ProfileStore,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  method: string,
  path: string,
): Promise<boolean>;
```

  - Rotas e comportamentos:
    1. `GET /api/profiles` → `store.list()` → `200 Profile[]`
    2. `POST /api/profiles` → body `CreateProfileInput` → valida `name` (não-vazio),
       `baseUrl` (URL parseable), `apiKey` (não-vazio) → `store.create(input)` →
       `201 Profile` (sem key)
    3. `GET /api/profiles/:id` → `store.get(pathId)` → `200 Profile` | `404`
    4. `PUT /api/profiles/:id` → body `UpdateProfileInput` → `store.update(id, input)` →
       `200 Profile`
    5. `DELETE /api/profiles/:id` → `store.delete(id)` → `204` | `404`
    6. `POST /api/profiles/:id/activate` → `store.activate(id)` → `200 Profile` | `404`
    7. `POST /api/profiles/:id/rotate-key` → body `{ apiKey: string }` → valida
       não-vazio → `store.rotateApiKey(id, apiKey)` → `204` | `404`
  - Erros de `SecretStoreUnavailable` → `503 { error, code: "SECRET_STORE_UNAVAILABLE" }`
  - Erros de validação → `400 { error, code: "INVALID_REQUEST" }`
  - `SecretNotFound` do `store.get()`/`store.update()`/`store.delete()` → `404`
  - NUNCA retorna `apiKey` em resposta, erro, ou log.

- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts`
  - Adicionar `secretStore` opcional a `BootstrapOptions`:

```ts
import type { SecretStore } from "./secret-store.js";
import type { ProfileStore } from "./profile-store.js";

export interface BootstrapOptions {
  // ... campos existentes mantidos ...
  dbPath: string;
  uiDir?: string;
  port?: number;
  modelRosterName?: string;
  providerFactory?: (modelId: string) => import('ai').LanguageModel;
  toolsFactory?: import('@plataforma/estaleiro-contracts').ToolsFactory;
  agentRunner?: import('@plataforma/estaleiro-contracts').AgentRunner;
  workflowOptions?: DmmWorkflowOptions;
  tasksDir?: string;
  contextReader?: ContextReader;

  // ── NOVOS (EST-48b) ───────────────────────────────────────────────
  /** Se fornecido, o bootstrap usa este SecretStore; senão, instancia
   *  createEncryptedFileSecretStore com resolveMasterKey()+resolveVaultPath(). */
  secretStore?: SecretStore;
}
```

  - Em `createBootstrap()`, após `const db = new Database(opts.dbPath)`:
    1. Instanciar `SecretStore`: `const secretStore = opts.secretStore ?? createEncryptedFileSecretStore({ filePath: resolveVaultPath(), masterKey: resolveMasterKey() });`
    2. Instanciar `ProfileStore`: `const profileStore = createProfileStore(db, secretStore);`
    3. **Seed migration** (ADR-0018 Fase 1): para cada entry em `PROVIDERS`, se
       `process.env[entry.apiKeyEnv]` existe E `profileStore.list()` está vazio (zero
       perfis ainda), criar automaticamente um perfil `seed` com nome = provider prefix
       + baseURL + a apiKey do env. Isso garante que o comportamento atual (env var)
       continue funcionando como perfil inicial. O seed é idempotente: só roda se a
       tabela estiver vazia.
    4. Na rota `POST /api/chat` (~linha 345 do bootstrap.ts atual), substituir a
       chamada `createProviderConfig` pelo fluxo:
       - Buscar `profileStore.getActive()`.
       - Se ativo: `const apiKey = await secretStore.get("profile:<id>:apikey")`;
         `const profileConfig = { baseURL: activeProfile.baseUrl, apiKey }`.
       - Se não ativo: fallback `process.env[PROVIDERS[prefix].apiKeyEnv]`
         (compatibilidade reversa).
       - Passar o `apiKey` resolvido diretamente para o chat service.
    5. Registrar rotas de perfil: chamar `handleProfileRoutes(profileStore, req, res, method, path)`
       **antes** das rotas existentes no `handleApiRequest` (ou integrar como primeiro check).
  - **NÃO** remover o fallback para `process.env` — compatibilidade reversa até EST-48c.

- **[UPDATE]** `apps/estaleiro/core/src/chat-service.ts`
  - Fechar a brecha onde `createProviderConfig` retorna `apiKeyEnv` (nome da var) mas o
    chat-service lê `process.env` direto. O contrato atual de `ChatServiceDeps` é ambíguo.
  - Novo contrato:

```ts
export interface ChatServiceDeps {
  /** Resolve baseURL + apiKey para um modelId prefix. Joga MISSING_API_KEY se não houver. */
  resolveProvider: (modelId: string) => Promise<{ baseURL: string; apiKey: string }>;
}
```

  - `createChatService(deps)` usa `deps.resolveProvider(modelId)` em vez de
    `deps.createProviderConfig` + `process.env`.
  - A função `resolveProvider` é construída no `bootstrap.ts` (composition root), que
    orquestra a busca no perfil ativo → SecretStore → fallback env.
  - Remove a leitura direta de `process.env[config.apiKeyEnv]` do `chat-service.ts`.
  - Mantém sanitização de API key em mensagens de erro (`raw.replaceAll(apiKey, "[REDACTED]")`).

- **[UPDATE]** `apps/estaleiro/core/src/index.ts`
  - Adicionar exports:
```ts
export type { SecretStore, SecretNotFound, SecretStoreUnavailable } from "./secret-store.js";
export { createEncryptedFileSecretStore, resolveMasterKey, resolveVaultPath } from "./secret-store.js";
export type { ProfileStore } from "./profile-store.js";
export { createProfileStore } from "./profile-store.js";
export { handleProfileRoutes } from "./profile-routes.js";
```

### 3.3 Testes

- **[CREATE]** `apps/estaleiro/core/tests/secret-store.test.ts`
  - Framework: `vitest` · Ambiente: Node puro.
  - Casos:
    1. `set("k","v")` → `get("k")` retorna `"v"`.
    2. `set("k","v")` → nova instância (simula restart) → `get("k")` retorna `"v"`.
    3. `delete("k")` → `get("k")` lança `SecretNotFound`.
    4. `get("inexistente")` lança `SecretNotFound`.
    5. `set` retorna `void` (não expõe valor).
    6. Vault corrompido (arquivo truncado/binário inválido) → qualquer op lança
       `SecretStoreUnavailable`.
    7. Chave mestra errada (arquivo diferente) → `SecretStoreUnavailable`.
    8. **Anti-fake:** `set("marker","sk-test-12345")` → `fs.readFileSync(vaultPath, 'utf-8')`
       NÃO contém `"sk-test-12345"` (arquivo é binário cifrado).
    9. Concorrência: `Promise.all([set("a","1"), set("b","2")])` → ambos persistem.
  - Usar `os.tmpdir()` para path temporário; limpar após cada caso.

- **[CREATE]** `apps/estaleiro/core/tests/profile-store.test.ts`
  - Framework: `vitest` · Ambiente: Node com `better-sqlite3` `:memory:` + `SecretStore` fake.
  - `SecretStore` fake: `Map<string, string>` implementando a interface. NÃO usar o real
    (teste de unidade, não de integração).
  - Casos:
    1. `create({ name, baseUrl, apiKey })` → retorna perfil com `hasApiKey: true`, `isActive: false`.
       API key NÃO está no retorno. `secretStore.get("profile:<id>:apikey")` retorna a key.
    2. `list()` antes de criar → array vazio.
    3. `list()` após 2 creates → array com 2 perfis, ambos com `hasApiKey: true`, sem apiKey.
    4. `get(id)` retorna o perfil correto.
    5. `get("inexistente")` lança erro (perfil não encontrado).
    6. `update(id, { name: "Novo" })` → `get(id).name === "Novo"`. Campos não enviados
       permanecem inalterados.
    7. `activate(id1)` → `get(id1).isActive === true`. `activate(id2)` → `get(id1).isActive === false`,
       `get(id2).isActive === true`. Apenas um ativo por vez.
    8. `delete(id)` → remove do SQLite e chama `secretStore.delete("profile:<id>:apikey")`.
       `secretStore.get(...)` lança `SecretNotFound`.
    9. `rotateApiKey(id, "nova")` → `secretStore.get("profile:<id>:apikey")` retorna `"nova"`.
    10. `create` sem `apiKey` (campo vazio/undefined) → erro de validação.

- **[CREATE]** `apps/estaleiro/core/tests/profile-routes.test.ts`
  - Framework: `vitest` · `ProfileStore` fake + `node:http` `createServer` + `fetch` local.
  - Casos:
    1. `POST /api/profiles` com body válido → `201`, `Location` header, body sem apiKey.
    2. `POST /api/profiles` com `name` vazio → `400 INVALID_REQUEST`.
    3. `POST /api/profiles` com `apiKey` vazio → `400 INVALID_REQUEST`.
    4. `GET /api/profiles` → `200`, array (redacted).
    5. `GET /api/profiles/:id` → `200`, perfil sem apiKey.
    6. `GET /api/profiles/inexistente` → `404`.
    7. `PUT /api/profiles/:id` `{ name: "X" }` → `200`, nome atualizado.
    8. `DELETE /api/profiles/:id` → `204`. `GET` seguinte → `404`.
    9. `POST /api/profiles/:id/activate` → `200`, `isActive: true`.
    10. `POST /api/profiles/:id/rotate-key` `{ apiKey: "nova" }` → `204`.
        Corpo da resposta NÃO contém a chave.
    11. `SecretStoreUnavailable` no store → `503`.
    12. Corpo de erro NUNCA contém a string da apiKey usada no `CreateProfileInput`.

- **[UPDATE]** `apps/estaleiro/core/tests/chat-service.test.ts`
  - Atualizar para novo contrato `ChatServiceDeps { resolveProvider }`.
  - Adicionar caso: `resolveProvider` retorna `{ baseURL, apiKey }` → chat usa sem
    acessar `process.env`.
  - Adicionar caso: `resolveProvider` lança `MISSING_API_KEY` → chat retorna erro com
    esse código.

- **[UPDATE]** `apps/estaleiro/core/tests/chat-route.test.ts`
  - Adicionar caso: perfil ativo existe → chat usa baseURL/key do perfil (mock de
    upstream OpenAI-compatible).
  - Adicionar caso: sem perfil ativo → fallback para `process.env` (teste com env var
    injetada no `BootstrapOptions.secretStore`).

- **[UPDATE]** `packages/plugin-providers/tests/factory.test.ts`
  - Verificar que `createProviderConfig` existente não foi quebrado (regressão).
  - Os tipos de perfil exportados de `profile-types.ts` compilam.

## 4. Estratégia de Testes

**Frameworks:** `vitest` para unitários/integração de core+providers. `better-sqlite3 :memory:`
para testes que precisam de DB real. `SecretStore` fake (`Map`) para isolar ProfileStore de
criptografia.

**Casos de integração (chat + perfil ativo):**
1. **Chat com perfil ativo:** criar perfil com upstream fake (`node:http` ecoa prompt),
   ativar, enviar mensagem via `POST /api/chat` → resposta contém eco.
2. **Chat sem perfil ativo (fallback env):** sem perfis no DB, `DEEPSEEK_API_KEY` no env
   (mock) → chat usa env var.
3. **Rotação de key:** criar perfil com key-A, ativar, rotacionar para key-B, enviar
   mensagem → upstream fake recebe key-B.

**Cenários de erro:**
4. **SecretStore indisponível:** mock de `SecretStore` que sempre lança
   `SecretStoreUnavailable` → `GET /api/profiles` retorna `503`.
5. **Perfil excluído durante chat ativo:** `getActive()` retorna `null` após delete →
   fallback para env ou erro `MISSING_API_KEY`.

## 5. Instruções de Execução

> **NÃO FAZER:**
> - NÃO persistir `apiKey` no objeto `ProviderConfig`, TinyBase, localStorage ou SQLite em claro.
> - NÃO manter dois registries concorrentes; defaults atuais podem virar seed/migração, não fonte paralela.
> - NÃO devolver segredo após criação/rotação, nem em GET/ PUT/ erro/ log.
> - NÃO remover o fallback para `process.env` — compatibilidade reversa é exigida até EST-48c.
> - NÃO alterar o `ProviderConfig` existente nem a estrutura de `PROVIDERS` — perfis são um mecanismo
>   separado que estende, não substitui.

1. Criar `profile-types.ts` em `plugin-providers` e exportar do barrel. **Gate parcial:** build
   de `@plataforma/plugin-providers` passa.
2. Implementar `secret-store.ts` conforme contrato exato do ADR-0018. Escrever testes.
3. Implementar `profile-store.ts` com SQLite + `SecretStore` injetado. Escrever testes.
4. Implementar `profile-routes.ts` com todos os handlers. Escrever testes de rota.
5. Atualizar `chat-service.ts`: novo contrato `resolveProvider` async. Atualizar teste.
6. Integrar em `bootstrap.ts`: SecretStore + ProfileStore no composition root, seed migration,
   novo resolver de credenciais na rota de chat, rotas de perfil.
7. Atualizar barrels (`index.ts`).
8. Rodar **todos** os testes existentes para garantir que nada quebrou (regressão).

## 6. Feedback de Especificação

### Decisões arquiteturais fechadas (endurecimento JIT, 2026-07-16)

**D1. Localização dos arquivos.** *(Fechada)*
- Tipos públicos de perfil (`ProviderProfile`, `CreateProfileInput`, etc.) → `packages/plugin-providers/src/profile-types.ts`.
  *(Derivado de: EST-48c consome esses tipos pelo barrel de `@plataforma/plugin-providers`; separar tipos de
  implementação evita que a UI importe `better-sqlite3` ou `node:crypto`.)*
- `SecretStore` (interface + implementação) → `apps/estaleiro/core/src/secret-store.ts`.
  *(Derivado de: ADR-0018 §Plano de migração — "SecretStore é instanciado no composition root (bootstrap.ts)".
  A implementação usa `node:crypto` e `fs` — APIs de runtime, não de biblioteca pura.)*
- `ProfileStore` (interface + SQLite) → `apps/estaleiro/core/src/profile-store.ts`.
  *(Derivado de: mesmo padrão de EST-21 — storage SQLite vive no pacote que o consome. ProfileStore
  depende de `SecretStore` + `better-sqlite3`, ambos runtime de core.)*
- `profile-routes.ts` → `apps/estaleiro/core/src/profile-routes.ts`.
  *(Derivado de: padrão de `provider-probe.ts` e rotas no `bootstrap.ts`.)*

**D2. Contrato do `ChatServiceDeps`.** *(Fechada)*
- Trocar `createProviderConfig: (modelId) => ProviderConfig` por `resolveProvider: (modelId) => Promise<{ baseURL, apiKey }>`.
  *(Derivado de: `ProviderConfig.apiKeyEnv` é nome de env var — não contém o valor. O chat-service atual
  contorna isso lendo `process.env` direto, o que torna `opts.apiKey` inútil no chat. Com perfis, a
  chave vem do `SecretStore` (async), então o contrato PRECISA ser async.)*
- A implementação de `resolveProvider` é construída no `bootstrap.ts` e orquestra: perfil ativo →
  `SecretStore.get()` → fallback `process.env`.

**D3. Nome do segredo no SecretStore.** *(Fechada)*
- Formato: `"profile:<id>:apikey"` — determinístico, sem coluna `secret_ref` no SQLite.
  *(Derivado de: simplicidade — o id do perfil é UUID, sempre único. Uma coluna extra no DB que
  sempre segue a mesma fórmula é redundante e fonte de dessincronia.)*

**D4. Seed migration.** *(Fechada)*
- Ao iniciar com `ProfileStore` vazio, criar automaticamente perfis a partir das env vars
  conhecidas (`DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `OMNIROUTE_API_KEY`), usando os
  valores de `PROVIDERS` para nome/baseURL.
  *(Derivado de: ADR-0018 §Plano de migração Fase 1 — "se DEEPSEEK_API_KEY existe no process.env
  e não está no vault, faz secretStore.set(providerName, process.env[envVar])". Esta spec
  refina: cria PERFIL (metadata + segredo) em vez de só jogar o segredo no vault.)*

## 7. Definition of Done

- [ ] `SecretStore` implementado conforme ADR-0018, com 9 casos de teste passando.
- [ ] `ProfileStore` CRUD + activate + rotateKey com 10 casos de teste passando, sem segredo
  exposto em nenhum assert/log.
- [ ] Rotas HTTP `/api/profiles/*` com 12 casos de teste passando.
- [ ] Chat service atualizado para `resolveProvider` async; testes de chat adaptados.
- [ ] Perfis e seleção ativa sobrevivem a restart (teste de integração).
- [ ] Segredo sobrevive a restart no vault cifrado e não aparece em DB, logs, API responses
  ou diffs.
- [ ] Chat usa perfil ativo quando existe; fallback para env quando não existe.
- [ ] Seed migration cria perfis automaticamente na primeira execução.
- [ ] Nenhum teste existente quebrado (regressão zero).

### Verificação automática (Gate de Evidência)

```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
```

> **Gate de Evidência (INVIOLÁVEL):** `finish` só com a saída literal dos comandos acima colada
> na Seção 8. Se qualquer comando falhar, conserte antes — nunca finalize no escuro.

## 8. Log de Handover e Revisão

### Handover do Executor:


### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.3b: backend depende do ADR de EST-48a
- **[2026-07-16T19:56]** - *deepseek* - `[Reconciliado]`: status restaurado de draft:triaged para ready (drift corrigido)
