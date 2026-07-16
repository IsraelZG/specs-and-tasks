# ADR 0018 — Armazenamento seguro de credenciais de provider

- **Status:** Aceito
- **Data:** 2026-07-16
- **Contexto MGTIA:** EST-48a (spike), resolve a persistência segura de API keys para o
  Estaleiro standalone.

## Problema

O Estaleiro standalone (ADR-0012) precisa persistir API keys de providers (DeepSeek,
OpenRouter, OmniRoute) para sobreviver a restarts sem reexigir configuração. Hoje as chaves
são lidas exclusivamente de `process.env` (EST-40, `createProviderConfig()` em `factory.ts`),
o que funciona para desenvolvimento mas não para uma instância standalone que deve manter
configuração entre sessões.

Persistir a chave em texto puro no SQLite, logs, respostas HTTP, snapshots ou repositório é
inaceitável (vazamento trivial por `SELECT *`, diffs acidentais, logs de erro). O mecanismo
precisa ser cross-platform (Windows, Linux, macOS — ADR-0012 §Decisão), sem dependências
nativas complexas, e sobreviver a restart.

## Opções avaliadas

Critérios: (1) segurança (chave nunca em texto puro no disco/sqlite/log), (2) zero dependências
externas, (3) cross-platform, (4) simplicidade de implementação, (5) sobrevivência a restart.

| Critério | A. node:crypto + keyfile | B. SQLCipher | C. Credencial do SO | D. .env file |
|---|---|---|---|---|
| 1. Segurança | ✅ AES-256-GCM, chave separada | ✅ DB cifrado | ✅ OS-managed | ❌ texto puro no disco |
| 2. Dependências | ✅ zero (built-in) | ❌ extensão nativa | ❌ 3 módulos nativos | ✅ zero |
| 3. Cross-platform | ✅ Node em todos SOs | ⚠️ build por SO | ❌ API diferente por SO | ✅ trivial |
| 4. Simplicidade | ✅ ~150 LOC | ❌ linkar SQLCipher | ❌ 3 APIs diferentes | ✅ ~5 LOC |
| 5. Restart | ✅ arquivo em disco | ✅ DB em disco | ✅ OS persiste | ✅ arquivo em disco |

### Descartes

- **B. SQLCipher:** exige compilação de extensão nativa (`better-sqlite3` com SQLCipher linkado),
  build frágil por plataforma, e é sobredimensionado para ~5-10 API keys. YAGNI.
- **C. Credencial do SO (wincred/libsecret/keychain):** três APIs nativas diferentes, cada uma
  com módulo Node de manutenção incerta. `wincred` (Windows) não tem bindings Node mantidos;
  `libsecret` (Linux) requer D-Bus e GNOME keyring em execução — não garantido em headless;
  `keychain` (macOS) é o mais estável dos três. Multiplicar três dependências nativas para um
  MVP é over-engineering. Além disso, ADR-0012 optou explicitamente por "zero toolchain nova".
- **D. .env file:** resolve restart mas a chave fica em texto puro no disco — falha o requisito
  de segurança. Se um backup ou snapshot incluir o `.env`, a chave vaza. Rejeitado.

## Decisão

**Opção A — Arquivo cifrado com `node:crypto` AES-256-GCM + chave mestra externa.**

O segredo é armazenado em `~/.estaleiro/secrets.enc`, um arquivo JSON cifrado com AES-256-GCM.
A chave mestra de 256 bits (32 bytes) é resolvida na ordem:

1. `ESTALEIRO_MASTER_KEY` (env, 64 chars hex) — para ambientes controlados/CI
2. `~/.estaleiro/master.key` (arquivo, 64 chars hex, permissão 0600) — para standalone
3. Auto-gerada no primeiro run e persistida em `~/.estaleiro/master.key`

A chave mestra **nunca** é armazenada no mesmo arquivo que os segredos. Sem a chave, o vault
é um blob binário opaco. AES-GCM provê autenticação: adulteração do vault é detectada e
resulta em `SecretStoreUnavailable`.

### Vantagens

- **Zero dependências externas** — `node:crypto` é built-in em Node.js 20+
- **Cross-platform** — `node:crypto` existe em Windows, Linux e macOS
- **Simples** — ~150 LOC, sem processo separado, sem build nativo
- **À prova de tamper** — AES-GCM detecta modificação do vault
- **Chave mestra separada** — satisfaz o requisito "não colocar chave no mesmo storage"

### Limitações conhecidas (ponytail ceiling)

- **Vault monolítico:** um único arquivo JSON cifrado contém todos os segredos. Com 5-10
  API keys isso é irrelevante; se escalar para centenas, considerar sharding ou backend
  de DB cifrado.
- **Chave no mesmo disco:** em standalone local, a chave mestra está no mesmo filesystem
  que o vault. Isso é aceitável para uma ferramenta local single-user, mas para um servidor
  multi-tenant seria necessário um HSM/KMS externo.
- **Sem rotação automática de chave mestra:** a chave é gerada uma vez. Rotação exigiria
  re-encriptar o vault inteiro — fora do escopo do MVP.

## Contrato `SecretStore`

Tipos TypeScript exatos que EST-48b deve implementar:

```ts
// ── Port (interface consumida por EST-48b) ──────────────────────────

interface SecretStore {
  /** Armazena um segredo. Write-only: nunca retorna o valor. */
  set(name: string, value: string): Promise<void>;

  /** Recupera um segredo. Uso interno autorizado (factory de providers). */
  get(name: string): Promise<string>;

  /** Remove um segredo. */
  delete(name: string): Promise<void>;
}

// ── Erros ───────────────────────────────────────────────────────────

class SecretNotFound extends Error {
  constructor(secretName: string);
  readonly name: "SecretNotFound";
}

class SecretStoreUnavailable extends Error {
  constructor(reason: string);
  readonly name: "SecretStoreUnavailable";
  readonly reason: string;
}

// ── Factory ─────────────────────────────────────────────────────────

interface EncryptedFileSecretStoreOptions {
  filePath: string;
  masterKey: Buffer;  // 32 bytes (AES-256)
}

function createEncryptedFileSecretStore(
  opts: EncryptedFileSecretStoreOptions,
): SecretStore;

// ── Key/material resolution ─────────────────────────────────────────

/** Resolve a master key (env → keyfile → auto-generate). */
function resolveMasterKey(keyFileOverride?: string): Buffer;

/** Resolve o path do vault file (env → default ~/.estaleiro/secrets.enc). */
function resolveVaultPath(override?: string): string;
```

### Comportamento esperado

| Operação | Pré-condição | Sucesso | Falha |
|---|---|---|---|
| `set(name, value)` | store disponível | `Promise<void>` | `SecretStoreUnavailable` |
| `get(name)` | segredo existe | `Promise<string>` | `SecretNotFound` ou `SecretStoreUnavailable` |
| `delete(name)` | segredo existe | `Promise<void>` | `SecretNotFound` ou `SecretStoreUnavailable` |
| `get(nonexistent)` | segredo não existe | — | `SecretNotFound` |
| `delete(nonexistent)` | segredo não existe | — | `SecretNotFound` |
| qualquer op | vault corrompido | — | `SecretStoreUnavailable` |
| qualquer op | chave mestra errada | — | `SecretStoreUnavailable` |

## Ameaças modeladas

Onde o segredo **não** pode aparecer:

1. ❌ **SQLite principal** — o vault é um arquivo separado, não uma tabela do SQLite do Estaleiro
2. ❌ **Logs (stdout/stderr)** — `set`/`get`/`delete` nunca logam o valor; erros mencionam o nome
   do segredo, não o valor
3. ❌ **Respostas HTTP** — a API de perfis (EST-48b) expõe `hasApiKey: boolean`, nunca o valor
4. ❌ **Snapshots/backups** — `~/.estaleiro/` fica fora do repositório; `.gitignore` cobre
   `estaleiro.db*`
5. ❌ **Diff do repositório** — o vault não está no working tree do monorepo
6. ❌ **JSON served pela API** — `SecretStore` é um port interno; a camada HTTP (EST-48b) serializa
   metadata, não segredos

## PoC — evidência

PoC em `apps/estaleiro/core/spikes/secret-store/` no monorepo (branch `task/EST-48a`):

| Caso | Descrição | Resultado |
|---|---|---|
| §4.1 | Persistência após restart | ✅ `set` → nova instância → `get` retorna valor original |
| §4.2 | Ausência em storage inseguro | ✅ vault é binário cifrado; marker não aparece em hex, UTF-8, ou JSON parse |
| §4.3 | Delete apaga | ✅ após `delete`, `get` lança `SecretNotFound` |
| §4.4 | Cofre indisponível | ✅ path inacessível → `SecretStoreUnavailable` |
| §4.5 | Write-only | ✅ `set` retorna `void`; `get` disponível apenas internamente |
| §4.6 | Anti-fake | ✅ backend real (arquivo cifrado), não `Map`; arquivo existe e contém ciphertext |
| §4.7 | Cross-platform | ✅ Windows testado; Linux/macOS suportados (`node:crypto` built-in) |

## Plano de migração do `DEEPSEEK_API_KEY` atual

**Fase 1 — EST-48b (consumidor):**
1. `SecretStore` é instanciado no composition root (`bootstrap.ts`) com `resolveMasterKey()` +
   `resolveVaultPath()`
2. Migração de seed: ao iniciar, se `DEEPSEEK_API_KEY` (ou outras) existe no `process.env` e
   **não** está no vault, faz `secretStore.set(providerName, process.env[envVar])`
3. Provider factory (`createProviderConfig`) é estendida para receber um `SecretStore` opcional:
   - Se `opts.apiKey` foi passado → usa (override explícito, ex.: para testes)
   - Senão, se `SecretStore` está disponível → `secretStore.get(prefix)`
   - Senão → fallback para `process.env[entry.apiKeyEnv]` (compatibilidade reversa)

**Fase 2 — pós-migração (task futura):**
4. Depois que todos os ambientes migrarem (env → vault), o fallback para `process.env` pode ser
   depreciado com um warning
5. Remoção do fallback em task separada, após período de transição

**Política de delete/rotação:**
- `secretStore.delete(prefix)` remove a chave do vault; a UI de configuração (EST-48c) expõe
  botão "remover chave"
- Rotação: `set` sobrescreve; a UI expõe campo para nova chave (write-only, nunca mostra a atual)

## Consequências

- **Positivas:** API keys sobrevivem a restart sem reconfiguração; zero dependências novas;
  separação clara entre metadata (SQLite) e segredo (vault cifrado)
- **Negativas:** chave mestra no mesmo disco (aceitável para single-user local); vault
  monolítico (irrelevante para o volume atual)
- **Riscos:** se o usuário perder `master.key`, perde acesso a todas as API keys — é o trade-off
  de criptografia real vs. ofuscação
