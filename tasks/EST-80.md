---
id: EST-80
title: "Provisionamento de MCP e LSP: importar crush.json, env nos servers, LSP config-driven"
status: ready
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: parallel # independente da EST-78 e da EST-79
test_profile: backend # a UI de config já existe (McpServersSection); aqui é store + import + spawn
dependencies: []
blocks: ["EST-81"]
capacity_target: sonnet
---

# EST-80 · Provisionamento de MCP e LSP: importar crush.json, env nos servers, LSP config-driven

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Test Runner:** `vitest`
- **Capacidade-alvo:** `sonnet` — três mudanças pequenas mas em três pacotes distintos, com um
  ponto de segurança (segredos) que exige cuidado.

## 1. Objetivo

O Estaleiro **builda sem nenhum MCP e sem nenhum LSP configurado**. Verificado:

- `mcp-config-store.ts` cria a tabela e para por aí — **zero seed**. Numa instalação limpa a lista
  vem vazia e o usuário teria que redigitar cada server na UI de config.
- `McpServerRecord` tem `command` + `args` e **não tem `env`**. Servers que dependem de token
  (`github`) ou de binário com ambiente próprio (`headroom`) são **impossíveis** de configurar hoje.
- `plugin-lsp` é hardcoded em `typescript-language-server` (`lsp-client.ts:57-75`, resolve via
  `require.resolve` com fallback para o PATH) e só liga quando `hasTsConfig(workspaceRoot)`. O
  binário é **devDependency de `plugin-lsp`**, não dependência do app — num tree instalado pode
  simplesmente não resolver.

A fonte de configuração **já existe e está correta**: `C:/Users/israe/AppData/Local/crush/crush.json`
tem as chaves `mcp` e `lsp` no formato certo (`{type, command, args, env}` e
`{command, args, filetypes, root_markers}`), com 6 MCPs e 4 LSPs que o usuário já usa diariamente.
Esta task **importa esse arquivo** em vez de inventar uma UI de cadastro do zero.

## 2. Contexto RAG (Spec-Driven Development)
- [x] `apps/estaleiro/core/src/mcp-config-store.ts` — `McpServerRecord`, `CreateMcpServerInput`.
- [x] `apps/estaleiro/core/src/bootstrap.ts:103` (`createMcpConfigStore`) e `:243-252` (start lazy
      dos servers habilitados a cada turno).
- [x] `packages/plugin-mcp/src/client.ts` — `connectStdio`: onde o `spawn` acontece (destino do `env`).
- [x] `packages/plugin-lsp/src/lsp-client.ts:57-90` — resolução do binário e `LspClientOptions`.
- [x] `packages/plugin-lsp/src/registry.ts:73-101` — `makeClient`, `tsserverPath`.
- [x] `packages/plugin-lsp/src/heuristics.ts` — `hasTsConfig`.
- [x] `apps/estaleiro/ui/src/views/config/McpServersSection.tsx` — UI de config já existente.
- [x] **Formato de origem** (`crush.json`, verificado 2026-07-27):
      `mcp.<nome> = { type: "stdio", command, args, env? }` ·
      `lsp.<nome> = { command, args, filetypes, root_markers }`.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `apps/estaleiro/core/src/mcp-config-store.ts` — campo `env?: Record<string,string>`
  em `McpServerRecord`/`CreateMcpServerInput`/`UpdateMcpServerInput`
- **[UPDATE]** `packages/plugin-mcp/src/types.ts` + `client.ts` — repassar `env` ao `spawn`
- **[CREATE]** `apps/estaleiro/core/src/crush-config-import.ts` — `importCrushConfig(opts)`
- **[CREATE]** `apps/estaleiro/core/tests/crush-config-import.test.ts`
- **[UPDATE]** `apps/estaleiro/core/src/mcp-routes.ts` — `POST /api/mcp/import-crush`
- **[UPDATE]** `packages/plugin-lsp/src/registry.ts` + `lsp-client.ts` — `command`/`args` vindos de
  config em vez de hardcoded
- **[UPDATE]** `packages/plugin-lsp/package.json` — `typescript-language-server` de `devDependencies`
  para `dependencies`
- **[UPDATE]** `apps/estaleiro/ui/src/views/config/McpServersSection.tsx` — botão
  "Importar do Crush" + campo `env` no formulário
- **[UPDATE]** testes correspondentes

**Fora de escopo:** LSP de json/yaml/markdown (ver §6). Import de `providers`/`models` do crush.json
(o `models-route.ts` e o `profile-store` já resolvem provider por outro caminho).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest, Node puro. Fixture: um `crush.json` **sintético** no tmp (⚠️ **não**
      copie o arquivo real do usuário para dentro do repo — ver pegadinhas).
- [x] **Casos obrigatórios:**
  1. `importCrushConfig` sobre a fixture cria N servers com `command`/`args`/`env` corretos.
  2. **Idempotência:** rodar 2x não duplica. Chave de dedupe = `name`; a 2ª rodada faz `update`.
  3. Entrada com `type` ≠ `"stdio"` → **ignorada** com aviso (só stdio é suportado hoje).
  4. `crush.json` ausente → retorna `{ imported: 0, skipped: [] }`, **não lança**.
  5. `crush.json` malformado → erro claro, sem corromper a store.
  6. Servers importados vêm com `enabled: false` (o usuário liga o que quer; ver §5).
  7. `env` chega ao `spawn` do `connectStdio` **mesclado** com `process.env`, não substituindo.
  8. LSP: com `command`/`args` fornecidos por config, o `LspClient` usa **eles**; sem config, cai no
     comportamento atual (`require.resolve` → PATH). Regressão coberta.
- [x] **Fora de Escopo:** subir um MCP server real no teste (rede/npx); browser.

## 5. Instruções de Execução (Step-by-Step)

> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **🔐 NÃO** commite o `crush.json` real, nem trechos dele, nem em fixture, nem em log, nem no §8
>   desta task. O arquivo do usuário contém **um GITHUB_PERSONAL_ACCESS_TOKEN em texto puro**. A
>   fixture de teste usa valores fictícios (`"TOKEN_FAKE"`).
> - **NÃO** logue `env` em nenhum caminho de erro/diagnóstico. Ao serializar um `McpServerRecord`
>   para a UI ou para o log, **mascare os valores** (`"ghp_***"`), mostrando só as chaves.
> - **NÃO** importe com `enabled: true`. Seis servers subindo de uma vez no primeiro turno é lento
>   e assusta; o usuário liga o que quer na UI de config, que já existe.
> - **NÃO** hardcode o caminho do `crush.json`. Default por plataforma
>   (`%LOCALAPPDATA%/crush/crush.json` no win32, `~/.config/crush/crush.json` nos demais),
>   sobrescrevível por parâmetro da rota.
> - **NÃO** construa uma UI de import nova do zero — é **um botão** no `McpServersSection` existente.

### Pegadinhas conhecidas
- O `env` do `crush.json` é **parcial**: o server ainda precisa de `PATH`, `APPDATA` etc. Faça
  `{ ...process.env, ...record.env }` no spawn. Substituir o ambiente inteiro quebra o `npx`.
- `command: "npx"` no Windows resolve para `npx.cmd`; se o `spawn` for sem `shell: true` isso
  falha com ENOENT. Verifique como o `connectStdio` já trata isso **antes** de mexer — pode já
  estar resolvido, e nesse caso não invente nada.
- O `bootstrap.ts:243-252` faz start lazy dos `enabled` **a cada turno de chat**, engolindo falhas
  em `catch {}`. Depois desta task um server mal configurado falha **silenciosamente** e o usuário
  não entende por que a tool sumiu. Faça a falha de start virar um evento observável (log
  estruturado ou campo `lastError` no record) — sem isso, configurar MCP vira adivinhação.
- `typescript-language-server` como `dependency` de `plugin-lsp` aumenta o install; é o preço de
  ter LSP funcionando fora do dev tree. Alternativa aceita: manter devDep **e** aceitar `command`
  por config apontando para o `.crush/lsp-server/node_modules/...` que o usuário já tem instalado.
  Escolha uma e registre no §8 — não faça as duas.
- `hasTsConfig` bloqueia o LSP quando o workspace não tem `tsconfig.json` na raiz. O repo **Docs**
  não tem — então a sessão de chat apontada para o Docs fica sem LSP. É o comportamento correto
  (não há TS lá), mas confirme que não é isso que o usuário está vendo como "LSP não funciona".

### Passos
1. **[TDD]** `crush-config-import.test.ts` com os 8 casos e fixture sintética.
2. Adicione `env` ao `McpServerRecord` e ao caminho de spawn (`plugin-mcp`), com mascaramento na
   serialização.
3. Implemente:
   ```ts
   export interface CrushImportResult {
     imported: number;
     updated: number;
     skipped: { name: string; reason: string }[];
   }
   export async function importCrushConfig(opts: {
     store: McpConfigStore;
     /** Default por plataforma. */
     crushJsonPath?: string;
   }): Promise<CrushImportResult>;
   ```
4. Rota `POST /api/mcp/import-crush` → devolve o `CrushImportResult`.
5. Botão "Importar do Crush" + campo `env` (com valores mascarados na leitura) no `McpServersSection`.
6. LSP: adicione `command?: string; args?: string[]` a `LspClientOptions`/`LspRegistryOptions`,
   promova a dependência do `typescript-language-server`, mantenha o fallback atual.
7. `pnpm gate estaleiro-core --profile backend`, `pnpm gate plugin-mcp --profile backend`,
   `pnpm gate plugin-lsp --profile backend`.

## 6. Feedback de Especificação (Spec Feedback Loop)
- **Escopo deliberadamente cortado:** o `crush.json` do usuário tem LSP de `json`, `yaml` e
  `markdown` além de `typescript`. Suportar multi-linguagem exige rotear por `filetypes` e manter
  N clientes por workspace — trabalho real, e TS é ~95% do valor no monorepo. **v1 = só TS,
  config-driven.** Se depois da EST-81 rodando faltarem os outros, vira task própria.
- Se ao ler o `connectStdio` o worker descobrir que `env` já é repassado, o passo 2 encolhe para
  a store + UI. Registre no §8 e siga — não é bloqueio.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Numa instalação limpa (db novo), `POST /api/mcp/import-crush` popula a lista com os servers do
      `crush.json`, todos `enabled: false`.
- [ ] Habilitar o server `github` na UI e rodar um turno de chat resulta em tools do GitHub no
      registry (evidência: log de tool-call colado no §8, **com o token mascarado**).
- [ ] Nenhum valor de `env` aparece em log, resposta de API ou nesta task.
- [ ] Falha de start de um MCP server é **observável** (não some em `catch {}` mudo).
- [ ] LSP: `get_diagnostics` funciona numa worktree do superapp usando o `command` vindo de config.
- [ ] Gates verdes nos três pacotes; linter limpo.

### Verificação automática
```bash
pnpm gate estaleiro-core --profile backend
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test + lint):**
```
(cole aqui a saída real de pnpm build, pnpm test e pnpm lint)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-27T15:55]** - *claude-opus* - `[Triado]`: spec escrita a partir da auditoria do Estaleiro 2026-07-27
- **[2026-07-27T15:56]** - *claude-opus* - `[Endurecido]`: spec executavel: assinaturas, casos de teste, pegadinhas e DoD por comando
- **[2026-07-27T15:56]** - *claude-opus* - `[Promovida p/ ready]`: deps vazias, spec fechada
