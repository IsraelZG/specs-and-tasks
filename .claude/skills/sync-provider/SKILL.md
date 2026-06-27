---
name: sync-provider
description: >
  Automates adding, editing, removing, and listing provider/proxy configurations
  across three files: scripts/headroom-proxies.mjs (proxy definitions), .env (API keys),
  and the global Crush crush.json (provider entries). Invoke with a subcommand and
  provider name, e.g.: /sync-provider add deepseek-v5
model: haiku
---

# Sync Provider $ARGUMENTS

Gerencia provedores de LLM em **3 arquivos** de forma consistente:

| File | Path | Purpose |
|---|---|---|
| Proxy definitions | `scripts/headroom-proxies.mjs` | Porta, backend, modelo(s) por proxy headroom |
| Environment | `.env` (raiz do repo Docs) | API keys (uma por serviço, compartilhada entre proxies) |
| Crush config | `%LOCALAPPDATA%\crush\crush.json` | Provider entries + model mappings que o Crush CLI consome |

## Subcomandos

`/sync-provider list` — lista todos os provedores atuais nos 3 arquivos.

`/sync-provider status` — health check: verifica se proxies estão rodando (`scripts/headroom-proxies.mjs status`), se crush.json é JSON válido, se as portas dos proxies batem com os `api_base` do crush.json.

`/sync-provider add <name> [port] [model]` — adiciona um novo provedor nos 3 arquivos:
1. Gera slug e porta (default: próxima disponível a partir de 8787).
2. Edita `scripts/headroom-proxies.mjs` — adiciona entrada no `PROXIES` object.
3. Edita `crush.json` — adiciona provider + model entries.
4. Adiciona/confirma `API_KEY` no `.env` (pergunta se é mesma de um existente ou nova).
5. Reinicia o proxy afetado via `node scripts/headroom-proxies.mjs start-<slug>`.
6. Valida: `node --check scripts/headroom-proxies.mjs`, JSON parse do crush.json, health check do proxy (`curl -f http://127.0.0.1:<port>/livez || curl -f http://127.0.0.1:<port>/health`).

`/sync-provider edit <name>` — edita configuração de um provedor existente:
1. Mostra estado atual nos 3 arquivos.
2. Solicita/decide quais campos alterar (porta, modelo(s), api_key, backend, etc.).
3. Aplica mudanças nos 3 arquivos.
4. Reinicia proxy + valida.

`/sync-provider remove <name>` — remove um provedor dos 3 arquivos:
1. Confirma remoção (lista impactos: qual proxy, qual provider, qual model).
2. Remove entrada do `PROXIES` em `scripts/headroom-proxies.mjs`.
3. Remove provider + model entries do `crush.json`.
4. Remove ou comenta chave do `.env` (só se não for compartilhada com outro provider).
5. Valida JSON + syntax.
6. Remove PID do `headroom-proxies.pid.json` se o proxy estava rodando.

## Passo a passo (para cada subcomando)

### 1. Leia os arquivos fonte

Antes de qualquer edição, leia o estado atual dos 3 arquivos:

```
grep -n "PROXIES" scripts/headroom-proxies.mjs
grep -n "^[A-Z_]*_API_KEY=" .env
# crush.json — seção providers
```

### 2. scripts/headroom-proxies.mjs — estrutura

O `PROXIES` object tem esta estrutura (no topo do arquivo):

```js
const PROXIES = {
  deepseek: { port: 8787, model: 'deepseek-v4-pro', backend: 'anyllm', anyllmProvider: 'openai', apiBaseEnv: 'DEEPSEEK_API_KEY' },
  'opencode-go': { port: 8788, model: 'glm-5.2', backend: 'anyllm', anyllmProvider: 'openai', apiBaseEnv: 'OPENCODE_API_KEY' },
}
```

- `apiBaseEnv`: nome da env var que contém a API key (sem `${}`, só o nome).
- O script constrói dinamicamente `--api-base http://127.0.0.1:<port>/v1` e mapeia modelo(s).
- A porta define o endpoint: `http://127.0.0.1:<port>/v1`.

**Ao adicionar/editar:** siga exatamente esse formato. O nome da chave vira slug usado nos comandos `start-<slug>`, `stop-<slug>`.

### 3. .env — estrutura

Arquivo na raiz do repo (C:/Dev2026/Docs/.env):

```env
DEEPSEEK_API_KEY=sk-...
OPENCODE_API_KEY=sk-...
```

- **NUNCA** coloque a chave literal no crush.json — use `${VAR_NAME:?set VAR_NAME em .env}`.
- Providers que compartilham a mesma chave (ex.: opencode-go + opencode-zen) usam a mesma env var.

### 4. crush.json — estrutura relevante

Path: `%LOCALAPPDATA%\crush\crush.json`

A seção `providers` contém entries como:

```json
{
  "name": "opencode-go",
  "api_base": "http://127.0.0.1:8788/v1",
  "api_key": "${OPENCODE_API_KEY:?set OPENCODE_API_KEY em .env}",
  "models": ["glm-5.2", "minimax-m3"],
  "model_mapping": {},
  "extra_headers": {}
}
```

Models adicionados ao `models[]` da raiz (campo `models` ou `recent_models`).

**Regras:**
- `api_key` usa **env var ref** `${VAR_NAME:?set VAR_NAME em .env}`, NUNCA literal.
- `api_base` aponta para `http://127.0.0.1:<port>/v1` (headroom local).
- `name` deve ser slug consistente entre os 3 arquivos.

### 5. Validação obrigatória (após cada edição)

1. Syntax check: `node --check scripts/headroom-proxies.mjs`
2. JSON validação do crush.json:
   ```
   node -e "JSON.parse(require('fs').readFileSync('C:/Users/israe/AppData/Local/crush/crush.json','utf8')); console.log('JSON OK')"
   ```
3. Port collision: verificar se a porta já não está em uso antes de startar:
   ```
   node -e "new Promise(r=>{const s=require('net').createServer();s.listen(<port>,()=>{s.close();console.log('free')}).on('error',()=>{console.log('in use')})})"
   ```
4. Se o proxy estava rodando antes da edição → restart:
   ```
   node scripts/headroom-proxies.mjs restart-<slug>
   ```
   Se não tem `restart`, pare e inicie:
   ```
   node scripts/headroom-proxies.mjs stop-<slug>
   node scripts/headroom-proxies.mjs start-<slug>
   ```
5. Health check (esperar até 5s):
   ```
   node -e "const c=require('http');c.get('http://127.0.0.1:<port>/livez',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log('livez:',r.statusCode,d))}).on('error',e=>console.log('fail:',e.message))"
   ```

## Otimizações documentadas (não aplicadas por default)

Estas melhorias foram identificadas mas não implementadas no processo atual. Se desejar aplicar alguma, invoque `/sync-provider optimize <id>`.

| ID | Otimização | Impacto | Esforço |
|---|---|---|---|
| O1 | **Env var refs em crush.json** — trocar api_key literal por `${VAR_NAME:?...}` | Segurança (chave só no .env) | 5min |
| O2 | **Proxy configs data-driven** — mover PROXIES object para `scripts/headroom-proxies.json` externo | Facilitar add/edit sem editar código | 30min |
| O3 | **JSON validation automático** — toda edição em crush.json seguida de `JSON.parse()` | Catch precoce de erro | Já incluso na skill |
| O4 | **Health check pós-start** — polling `/livez` por 5s antes de reportar sucesso | Confiabilidade | Já incluso na skill |
| O5 | **context_window documentado** — valores atuais são chutes; fazer lookup upstream ou consultar documentação | Precisão de config | 15min |
| O6 | **Model sync bidirecional** — detectar modelos declarados no proxy mas não no crush.json (e vice-versa) | Consistência | 20min |

## Modo de operação autônomo

Se nenhum subcomando for reconhecido ou `$ARGUMENTS` estiver vazio, liste o estado atual:

```
Estado Atual — Provedores
══════════════════════════
scripts/headroom-proxies.mjs: <N> proxies definidos
crush.json: <N> providers configurados
.env: <N> API keys definidas
Proxies rodando: <lista>

Use: /sync-provider add|edit|remove|list|status <name>
```
