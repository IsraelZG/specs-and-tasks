---
id: EST-05
title: "plugin-fs-tools: migrar o harness de tools do ORQ-09a (readFile/writeFile/bash gated) pro monorepo superapp, mediado pelo host (EST-02b)"
status: done
complexity: 2
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: ["EST-06"]
capacity_target: haiku
---

# EST-05 · plugin-fs-tools (move do ORQ-09a, mediado pelo host)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-fs-tools/` (criar do zero — pacote não existe ainda no monorepo; ver §3). **Move mecânico** — o código já existe, testado e provado (PoC `tools/orchestrator/tools.poc.mjs` + selftest do ADR-0008). Baixa complexidade: adaptar para o contrato de host (EST-02b), não reescrever a lógica.
- **Package Manager:** `pnpm` (monorepo do superapp — `pnpm-workspace.yaml` já mapeia `packages/*` e `apps/*`).
- **Language:** **TypeScript** (não `.mjs` como no PoC) — alinhado ao resto do monorepo (`packages/plugin-tasks`, `apps/estaleiro/core/`).
- **Test Runner:** `vitest` (não `node:test` como no PoC) — já é o padrão do monorepo (T-001, EST-02b, EST-04a).
- **Lint:** `eslint src/` (types/eslint-config padrão do monorepo — `typescript-eslint` strict).
- **Capacidade-alvo:** haiku (move + adapt de 3 tools, sem algoritmo novo).

## 1. Objetivo
Mover o harness de tools (`readFile`/`writeFile`/`bash` com gating) do PoC `tools/orchestrator/tools.poc.mjs` (ORQ-08, provado no selftest do ADR-0008) para `packages/plugin-fs-tools/` no monorepo superapp, **adaptando as chamadas de fs/bash para passar pela mediação do host** (`FsPort` + `BashPort` definidos em `apps/estaleiro/core/src/ports/{fs,bash}.ts` — EST-02b) em vez de acesso direto a `node:fs`/`node:child_process`.

Lógica de gating (allowlist, timeout, `windowsHide`, guarda anti-git-no-Docs) **não muda** — só migra para dentro do `BashPort` (já é o que EST-02b implementa, derivado verbatim do ADR-0008 Decisão B).

### Contratos exatos (derivados de EST-02a/EST-02b + ADR-0008 §Decisão A, §Decisão B)

```ts
// --- packages/plugin-fs-tools/src/index.ts
import { tool } from "ai";                      // ai@^7.0.14 (ADR-0008)
import { z } from "zod";                        // zod@^4.4.3 (ADR-0008)
import type { PluginManifest } from "@plataforma/estaleiro-core"; // EST-02a
import type { FsPort, BashPort } from "@plataforma/estaleiro-core"; // EST-02b

export interface MakeToolsOptions {
  manifest: PluginManifest;        // capabilities DEVE incluir "fs" e "bash" (validar)
  fs: FsPort;                       // porta mediada para readFile/writeFile (EST-02b)
  bash: BashPort;                   // porta mediada para exec (EST-02b)
  onEvent?: (e: { type: "tool-call" | "tool-result"; tool: string; ts: number; [k: string]: unknown }) => void;
  signal?: AbortSignal;
  log?: (s: string) => void;
  bashTimeoutMs?: number;           // default 120_000 (refinamento da ORQ-09a §6)
}

export interface PluginTools {
  readFile: ReturnType<typeof tool<{ path: string }, { content: string }>>;
  writeFile: ReturnType<typeof tool<{ path: string; content: string }, { ok: true }>>;
  bash: ReturnType<
    typeof tool<
      { command: string },
      | { ok: false; error: string }                  // bloqueado (allowlist, anti-git, etc.)
      | { exit: number | null; timedOut: boolean; output: string }  // executou
    >
  >;
}

export function makeTools(opts: MakeToolsOptions): PluginTools;
```

- `readFile`: `inputSchema: z.object({ path: z.string() })` → chama `opts.fs.readFile(opts.manifest, path)` (que retorna `Promise<Uint8Array>`), decodifica com `new TextDecoder().decode(bytes)`, retorna `{ content: string }`. Lança se o arquivo não existe (propaga do port — `node:fs` ENOENT).
- `writeFile`: `inputSchema: z.object({ path: z.string(), content: z.string() })` → codifica `content` com `new TextEncoder().encode(content)` (→ `Uint8Array`), chama `opts.fs.writeFile(opts.manifest, path, bytes)`. `mkdirSync` recursivo já é feito pelo port (EST-02b `fs.ts:39`). Retorna `{ ok: true }`.
- `bash`: `inputSchema: z.object({ command: z.string() })` → chama `opts.bash.exec(opts.manifest, command, { timeout: bashTimeoutMs })` dentro de `try`:
  - **Sucesso** (não threw) → `{ exit: result.exitCode, timedOut: false, output: (result.stdout + result.stderr).slice(-4000) }`.
  - **Threw com "fora da allowlist"** (EST-02b `bash.ts:37-39`) → `{ ok: false, error: error.message }`.
  - **Threw com "git write no repo Docs"** (EST-02b `bash.ts:41-43`) → `{ ok: false, error: error.message }`.
  - **Threw com "excedeu timeout"** (EST-02b `bash.ts:54-56`) → `{ exit: null, timedOut: true, output: error.message }`.
- `signal?.aborted` no início de cada `execute` lança `Error('cancelado')` ANTES de qualquer chamada de port (regra ADR-0008 Decisão E).
- Cada `execute` emite via `onEvent`: `{ type: "tool-call", tool, ts, args }` antes; `{ type: "tool-result", tool, ts, ok, ...extras }` depois. `log` (se passado) recebe `[bash] <command> → exit=<code>[ (timeout)]` no sucesso do bash (espelha `tools.poc.mjs:84`).

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (G2 — migração como task MGTIA normal), §3 (plugin-fs-tools no diagrama, dependência de EST-02). §2 A2 (Host medeia tudo), §6.1 (categoria de plugin `connector` — plugin-fs-tools é **infra-adjacente**, expõe capabilities `fs`+`bash`).
- [x] `tools/orchestrator/tools.poc.mjs` (ORQ-08, fonte canônica do PoC) — **fonte primária do código a portar**; `tools.poc.mjs:14-22` (allowlist, isDocsRepo), `:24-89` (makeTools, gating). NOTA: o `src/tools.mjs` prometido pela ORQ-09a **não existe** no repo (só o PoC + `agentAdapter.mjs` + `monitor.mjs`); portamos do PoC.
- [x] `tools/orchestrator/tests/monitor.test.mjs` — *NÃO* é referência para EST-05 (testa o monitor, não as tools). EST-05 escreve sua própria suite de testes.
- [x] `docs/adr/0008-agent-adapter-in-process.md` §"Decisão A" (tool set: readFile/writeFile/bash), §"Decisão B" (gating: allowlist, timeout, cwd-lock, `windowsHide`, guarda anti-git-no-Docs — **toda a lógica já migrou para o `BashPort` em EST-02b**, EST-05 só consome).
- [x] `apps/estaleiro/core/src/ports/fs.ts` (EST-02b) — assinatura `FsPort.readFile/writeFile`; aceita `PluginManifest` como 1º arg.
- [x] `apps/estaleiro/core/src/ports/bash.ts` (EST-02b) — assinatura `BashPort.exec`; aceita `PluginManifest` como 1º arg, `options.timeout` configurável; **throws** em allowlist/anti-git/timeout (não retorna `{ok:false}` — o adapter plugin-fs-tools é quem mapeia).
- [x] `apps/estaleiro/core/src/manifest.ts` (EST-02a) — `PluginManifest` Zod: `{ name, version, capabilities: ("fs"|"bash"|"network"|"store"|"events"|"compute"|"ui")[], entrypoint }`. Plugin-fs-tools declara `capabilities: ["fs", "bash"]`.
- [x] `apps/estaleiro/core/tests/{fs,bash}.test.ts` (EST-02b) — patterns de teste (tmpdir + `afterEach` cleanup) a reusar.
- [x] `packages/plugin-tasks/package.json` (EST-04a) — template de `package.json` para pacotes `@plataforma/plugin-*` (mesma estrutura, mesmo scripts).
- [x] `docs/task-template.md` + `tasks/T-001.md` (Gold Standard) — formato de spec, tsconfig, eslint.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `tools/orchestrator/tools.poc.mjs` (ORQ-08) — **fonte do código a portar** (`makeTools` linhas 24-89, `BASH_ALLOWLIST` linha 15, `isDocsRepo` linhas 19-22, `BASH_TIMEOUT_MS` linha 16).
- **[READ]** `docs/adr/0008-agent-adapter-in-process.md` §Decisões A, B, E.
- **[READ]** `apps/estaleiro/core/src/ports/fs.ts` (EST-02b) — `FsPort` interface + `makeFsPort`.
- **[READ]** `apps/estaleiro/core/src/ports/bash.ts` (EST-02b) — `BashPort` interface + `makeBashPort`.
- **[READ]** `apps/estaleiro/core/src/manifest.ts` (EST-02a) — `PluginManifest` Zod schema.
- **[READ]** `apps/estaleiro/core/tests/{fs,bash}.test.ts` (EST-02b) — patterns de teste (tmpdir, afterEach).
- **[EDIT]** `apps/estaleiro/core/src/index.ts` — re-export `FsPort` + `makeFsPort` / `BashPort` + `makeBashPort` (pré-condição para o import `@plataforma/estaleiro-core` da §1).
- **[READ]** `packages/plugin-tasks/package.json` (EST-04a) — template de `package.json` para `@plataforma/plugin-*`.
- **[CREATE]** `packages/plugin-fs-tools/package.json` — nome `@plataforma/plugin-fs-tools`, version `0.0.1`, private, type module, scripts `build`/`test`/`lint` iguais ao `packages/plugin-tasks/package.json`. Exports `.` → `./src/index.ts`. Deps: `ai@^7.0.14`, `zod@^4.4.3`, `@plataforma/estaleiro-core@workspace:*`. DevDeps: `typescript@^5.8.0`, `vitest@^3.0.0`, `eslint@^9.0.0`, `typescript-eslint@^8.0.0`.
- **[CREATE]** `packages/plugin-fs-tools/tsconfig.json` — estende `tsconfig.base.json` (raiz do superapp), `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]` (espelha `packages/plugin-tasks/tsconfig.json`).
- **[CREATE]** `packages/plugin-fs-tools/src/index.ts` — `makeTools` (assinatura da §1) + tipos `MakeToolsOptions` + `PluginTools` exportados.
- **[CREATE]** `packages/plugin-fs-tools/tests/index.test.ts` — vitest, 12+ casos da §4.

> **NÃO-CRIAR (escopo respeitado):** NÃO criar `package.json` raiz nem mexer no `pnpm-workspace.yaml` (já cobre `packages/*`). NÃO criar diretório `apps/`. NÃO registrar o plugin em nenhum registry (a "manifest" do plugin é o `PluginManifest` retornado em `opts.manifest`; o host registra depois — escopo de EST-14 ou de um loader futuro, fora daqui).

## 4. Estratégia de Testes Estrita (TDD)
- [x] **Framework:** `vitest` (não `node:test` como no PoC).
- [x] **Ambiente:** Node puro. Cwd de teste = `fs.mkdtempSync` + `afterEach` cleanup (mesmo padrão de `apps/estaleiro/core/tests/fs.test.ts:22-25`). `FsPort` e `BashPort` reais do estaleiro-core (`makeFsPort({ cwd: tmpdir })`, `makeBashPort({ cwd: tmpdir })`) — **testes de integração do plugin com os ports**, não mocks. Cobre o caminho real (plugin → port → fs/spawn) end-to-end dentro do tmpdir.
- [x] **Manifest de teste:** `const manifest: PluginManifest = { name: "@plataforma/plugin-fs-tools-test", version: "1.0.0", capabilities: ["fs", "bash"], entrypoint: "./src/index.ts" }` (espelha `apps/estaleiro/core/tests/fs.test.ts:8-13`).
- [x] **Fora de Escopo:** `editFile`/`glob`/`grep` (não existem nesta task; ficam pra expansão futura do harness). Provider real / LLM (as tools não chamam modelo).

### Casos de teste (numerados, 12 total)

**Reusados do ORQ-09a §4 (com `fsPort`/`bashPort` reais, não `fs` direto):**
1. `writeFile` cria arquivo com o conteúdo exato; diretório intermediário inexistente é criado.
2. `readFile` lê de volta o conteúdo escrito por 1 — roundtrip idêntico.
3. `readFile` em arquivo inexistente → lança (propaga o erro do port).
4. `bash` com comando allowlisted (`echo hello`) → `exit:0`, `output` contém "hello".
5. `bash` com comando fora da allowlist (ex.: `curl example.com`) → `{ok:false, error}` contendo "allowlist", **sem** executar.
6. `bash` com `git commit -m x` e `cwd` dentro de um path contendo `Dev2026\Docs` (simular via tmpdir com nome `C:\fake\Dev2026\Docs\test`) → `{ok:false, error}` contendo "proibido"/"enfileire".
7. `bash` com `git status` no mesmo `cwd` do caso 6 → permitido (exit definido, não bloqueado).
8. `bash` com `git commit -m x` em `cwd` **fora** de `Dev2026\Docs` (ex.: tmpdir padrão) → permitido.

**Novos (cubrem o que o port oferece e o que o adapter precisa fazer):**
9. `bash` com `bashTimeoutMs: 500` e comando que dorme 60s (`node -e "setTimeout(()=>{},60000)"`) → `{exit: null, timedOut: true, output}` (adapter mapeia o throw do port pra forma `{exit, timedOut, output}`).
10. `signal` já abortado antes da chamada → `readFile`/`writeFile`/`bash` lançam `Error('cancelado')` ANTES de qualquer port call (verificar com mock de `fsPort`/`bashPort` que **não foram chamados** — usar `vi.fn()` para isolar este caso dos demais; demais testes usam ports reais).
11. `onEvent` recebe `{type:"tool-call", tool, ts, args}` seguido de `{type:"tool-result", tool, ts, ok, ...extras}` para cada uma das 3 tools, na ordem; `ts` é número (Date.now()).

**Anti-regressão do port (específico do plugin-fs-tools, não estava em ORQ-09a):**
12. `readFile` chama `fsPort.readFile(manifest, path)` com o `manifest` e path **relativo**; `writeFile` chama `fsPort.writeFile(manifest, path, Uint8Array)` (não string); `bash` chama `bashPort.exec(manifest, command, { timeout: <bashTimeoutMs> })` com o `manifest` correto. Usar `vi.fn()` envolvendo `FsPort`/`BashPort` para espionar as chamadas. Garante que o plugin **roteia pelo host**, não importa `fs` direto nem spawna.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** importar `node:fs` nem `node:child_process` direto no plugin. **TODA** operação de fs/bash passa por `opts.fs` / `opts.bash` (capacidades declaradas no `manifest`).
> - **NÃO** reimplementar a allowlist nem a guarda anti-git-no-Docs no plugin — **elas já vivem no `BashPort` (EST-02b)**. O plugin só mapeia os throws do port pro formato de retorno do tool.
> - **NÃO** adicionar `editFile`/`glob`/`grep` aqui (escopo fora; ficam pra expansão futura).
> - **NÃO** registrar o plugin em nenhum loader/registry (escopo de uma task futura de "plugin loader").
> - **NÃO** mexer em `pnpm-workspace.yaml` (já cobre `packages/*`) nem em `package.json` raiz.

1. **[TDD]** Criar `tests/index.test.ts` com os 12 casos acima (todos falhando/inexistentes).
2. Criar `package.json` (`@plataforma/plugin-fs-tools`) e `tsconfig.json` (estende `tsconfig.base.json`, espelha `packages/plugin-tasks/`).
3. Implementar `src/index.ts`:
   - `import { tool } from "ai"`, `import { z } from "zod"`, `import type { PluginManifest, FsPort, BashPort } from "@plataforma/estaleiro-core"`.
   - `export interface MakeToolsOptions { ... }` e `export interface PluginTools { ... }` (assinaturas da §1).
   - `export function makeTools(opts: MakeToolsOptions): PluginTools { ... }`:
     - Validar `opts.manifest.capabilities` inclui `"fs"` e `"bash"` (lançar `Error('manifest.capabilities deve incluir "fs" e "bash"')` se não).
     - `const encoder = new TextEncoder(); const decoder = new TextDecoder();`
     - `readFile`: `tool({ description, inputSchema: z.object({ path: z.string() }), execute: async ({ path: p }) => { if (opts.signal?.aborted) throw new Error("cancelado"); emit("tool-call", { tool: "readFile", args: { path: p } }); const bytes = await opts.fs.readFile(opts.manifest, p); const content = decoder.decode(bytes); emit("tool-result", { tool: "readFile", ok: true, bytes: content.length }); return { content }; } })`.
     - `writeFile`: análogo, com `encoder.encode(content)`.
     - `bash`: try/catch em torno de `opts.bash.exec(opts.manifest, command, { timeout: opts.bashTimeoutMs ?? 120_000 })` — mapear os 4 casos (sucesso, allowlist, anti-git, timeout) conforme §1.
   - `opts.log?.(\`  [bash] ${command} → exit=${exit}${timedOut ? " (timeout)" : ""}\`)` no ramo de sucesso.
4. Rodar `pnpm --filter @plataforma/plugin-fs-tools test` até 12/12 verde.
5. Rodar `pnpm --filter @plataforma/plugin-fs-tools build` e `lint`. Gate (§7) → §8.

## 6. Feedback de Especificação (Spec Feedback Loop)
- **Refinamento (derivar, não inventar):** a allowlist e a guarda anti-git-no-Docs **não ficam no plugin** — já migraram para o `BashPort` em EST-02b. O plugin é um **adapter** que:
  - Encoda/decoda `Uint8Array` ↔ `string` (gap entre `FsPort` e o inputSchema do `tool()`).
  - Mapeia os 4 throws do `BashPort.exec` (allowlist, anti-git, timeout, outros) → 2 shapes de retorno (`{ok:false, error}` vs `{exit, timedOut, output}`). Isso é o **único** código de erro novo.
- **Trade-off consciente:** o caso de teste 6 ("Dev2026\Docs") simula o path com `tmpdir` num diretório que **contém** `Dev2026\Docs` no nome — `isDocsRepo` (EST-02b) faz substring match (`/dev2026/docs`), então funciona em qualquer cwd que case. Não podemos rodar git de verdade no `C:\Dev2026\Docs` do test runner (proibido pela regra), daí o truque do path. Documentado no test.
- **Capacidade:** **haiku** (mantido do frontmatter; é move+adapt, sem algoritmo novo — capacidade já estava fixada em `draft:triaged`).
- **Sem decisões em aberto.** Toda a fundamentação está em EST-02a/b (ports + manifest já done), ADR-0008 (gating já documentado), `tools.poc.mjs` (código já provado). Decisões herdadas, não reabrir.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência — INVIOLÁVEL)
O Worker deve colar a saída literal destes comandos na Seção 8 (Handover), rodados na raiz do `superapp`:
```bash
pnpm --filter @plataforma/plugin-fs-tools build
pnpm --filter @plataforma/plugin-fs-tools test
pnpm --filter @plataforma/plugin-fs-tools lint
```
Todos devem retornar Exit Code 0. Lint sem erros NOVOS (regra de 2026-07-06 — 3 reworks consecutivos por regressão de lint; T-807, EST-02b/c; o critério cobrado é o escrito).

### Checklist do Reviewer
- [ ] Respeita estritamente os arquivos da Seção 3? (sem `package.json` raiz, sem `pnpm-workspace.yaml`, sem outros pacotes tocados)
- [ ] Nenhum `import` de `node:fs` / `node:child_process` direto em `src/index.ts`? (Gate de wiring — plugin passa PELO host, não direto)
- [ ] 12 casos da §4 verdes? (não basta "test passou" — `Tests 12 passed (12)` literal)
- [ ] `tsc` sem erros? `eslint` sem erros NOVOS? (regressão bloqueia)
- [ ] `manifest` declarado com `capabilities: ["fs", "bash"]` (e plugin valida isso no `makeTools`)?
- [ ] Nenhuma das regras "NÃO FAZER" da §5 violada? (especialmente: NÃO reimplementar allowlist/anti-git — o port já faz)

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor (rework 1 — 2026-07-06):
- **[M1]** `PluginTools` restaurado para interface estrita verbatim da spec §1 (removido `any` + `eslint-disable`).
- **[M2]** `apps/estaleiro/core/src/index.ts` registrado como [EDIT] em §3 (pré-condição do import da §1 — a spec original omitiu este arquivo; re-exports de FsPort/BashPort já existiam e são corretos).
- **[m1]** Teste 10 refatorado com `vi.fn()` spies: verifica que `fsPort.readFile`/`writeFile` e `bashPort.exec` **não foram chamados** após `signal.aborted`.
- **[m2]** Teste 11 estendido: cobre as 3 tools (readFile → writeFile → bash) com 6 eventos na ordem (call+result × 3) + verificação de `ts` tipo number.

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
> pnpm --filter @plataforma/plugin-fs-tools build
$ tsc (OK)

> pnpm --filter @plataforma/plugin-fs-tools test
$ vitest run — 12 passed (0 fail)

> pnpm --filter @plataforma/plugin-fs-tools lint
$ eslint src/ (0 erros)
```
- **Comentários de Revisão:**

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/plugin-fs-tools build
$ tsc
(sem erros — exit 0)

$ pnpm --filter @plataforma/plugin-fs-tools test
$ vitest run
 RUN v3.2.6 C:/Dev2026/.superapp-worktrees/EST-05/packages/plugin-fs-tools
 ✓ tests/index.test.ts (12 tests) 1326ms
   ✓ makeTools > 9. bash com timeout → {exit:null, timedOut:true}  530ms
 Test Files  1 passed (1)
      Tests  12 passed (12)

$ pnpm --filter @plataforma/plugin-fs-tools lint
$ eslint src/
(sem erros — exit 0)
```
- **Sondas adversariais (4 probes, todas verdes — INFO, não bloqueante):**
  - PROBE-1: `makeTools({manifest: {capabilities:["bash"]}})` → throws. ✓
  - PROBE-2: `makeTools({manifest: {capabilities:["fs"]}})` → throws. ✓
  - PROBE-3: `signal.aborted=true` + ports espionados → ports `not.toHaveBeenCalled()`. ✓ (impl cumpre spec §4 caso 10; o teste da suite NÃO cobre esse aspecto — ver [m1])
  - PROBE-4: onEvent emite 6 eventos na ordem (call+result × 3 tools). ✓ (impl cumpre spec §4 caso 11; o teste só cobre 1 tool — ver [m2])
  - Probes removidos após execução (não poluem o deliverable).

═══════════════════════════════════════════════════════════════════════
QA REPORT — EST-05 — plugin-fs-tools (move ORQ-09a mediado pelo host)
═══════════════════════════════════════════════════════════════════════
Data: 2026-07-06  |  Revisor: agile_reviewer (minimax-m3)
Spec consultada: seções 1–7  |  Arquivos auditados: 4 (impl) + 2 (ports) + 1 (manifest) + 1 (core index.ts)
Testes: 12 declarados · 12 passaram · 0 falharam
tsc: OK  |  lint: OK  |  build: OK

MAJOR (2)
────────────────────────────────────────────────────────

[M1] `src/index.ts:20-21` — `export type PluginTools = any` (com `eslint-disable`)
      Viola o contrato EXATO da spec §1 (trecho normativo):
        export interface PluginTools {
          readFile:  ReturnType<typeof tool<{path:string},{content:string}>>;
          writeFile: ReturnType<typeof tool<{path:string;content:string},{ok:true}>>;
          bash:      ReturnType<typeof tool<{command:string},
            | {ok:false;error:string} | {exit:number|null;timedOut:boolean;output:string}
          >>;
        }
      E viola DoD §7 ("sem any").
      Verificação: a interface ESTRITA de §1 COMPILA com `ai@^7.0.14` instalado
      (probe estrita adicionada temporariamente em `src/probe-strict.ts`, `tsc` exit 0,
      depois removida). Não havia motivo técnico para o downgrade — é decisão de
      estilo, não restrição da biblioteca.
      Consequência: callers (EST-06, EST-14, agentAdapter) perdem type safety do toolbag;
      o `as any` ×19 em `tests/index.test.ts` é sintoma direto.
      Ação corretiva: restaurar a interface verbatim da §1 e remover o `eslint-disable`.

[M2] `apps/estaleiro/core/src/index.ts` — edição FORA do escopo declarado na §3
      Diff: `+export { type FsPort, makeFsPort } from "./ports/fs.js";`
            `+export { type BashPort, makeBashPort } from "./ports/bash.js";`
      Spec §3 lista como in-scope APENAS arquivos de `packages/plugin-fs-tools/`.
      `apps/estaleiro/core/src/ports/{fs,bash}.ts` aparecem só como [READ] no §2 RAG.
      `apps/estaleiro/core/src/index.ts` NÃO é mencionado em lugar algum da spec.
      O worker confirma o fato no handover ("FsPort/BashPort exportados do
      @plataforma/estaleiro-core (index.ts atualizado)").
      É MAJOR mínimo por regra do agent spec §6 ("Arquivos fora do escopo declarado →
      MAJOR no mínimo"). É mudança aditiva, sem efeito colateral sobre outros
      consumidores, mas a spec precisa registrar a edição (regras MGTIA — §3 é o
      contrato de escopo).
      Justificativa técnica (inviabilidade do caminho estrito): a spec §1 importa
      `type { FsPort, BashPort } from "@plataforma/estaleiro-core"`, então os
      re-exports são pré-condição necessária da impl. A spec autor errou ao não
      listar este arquivo em §3 [EDIT]. A correção NÃO é reverter a edição; é
      emendar a spec para registrar o arquivo no escopo, ou pedir ao worker que
      adicione o arquivo a §3 retroativamente no rework.
      Ação corretiva: (a) worker adiciona `apps/estaleiro/core/src/index.ts` a §3
      como [EDIT] e justifica a adição no Handover; (b) se a governança do MGTIA
      vetar amend retroativo de spec, abrir uma spec-pendência em `tasks/_pendencias.md`
      registrando a lacuna da spec original (revisor: spec→EST-05b ou marker genérico).

MINOR (3)
────────────────────────────────────────────────────────

[m1] `tests/index.test.ts:150-165` (caso 10) — cobertura INCOMPLETA do spec §4.
      Spec exige "verificar com mock de fsPort/bashPort que **não foram chamados**"
      (usar `vi.fn()`). O teste atual usa ports reais e só checa `rejects.toThrow("cancelado")`.
      O comportamento da impl ESTÁ correto (PROBE-3 confirmou), mas o teste não
      documenta o invariante de segurança crítico: signal aborted ⇒ zero side effects.
      Ação: refatorar o teste para usar `vi.fn()` como spies e adicionar
      `expect(fsSpy.readFile).not.toHaveBeenCalled()` + idem para write/exec.

[m2] `tests/index.test.ts:167-183` (caso 11) — cobertura PARCIAL.
      Spec exige cobertura "para cada uma das 3 tools, na ordem". O teste só exercita
      `readFile` (1 de 3) e checa `calls.length===1 && results.length===1` + tipo de `ts`.
      O comportamento da impl ESTÁ correto (PROBE-4 confirmou 6 eventos na ordem),
      mas o teste não captura a cobertura de `writeFile` e `bash` na ordem.
      Ação: estender o teste para chamar as 3 tools em sequência e assertar a
      ordem completa de 6 eventos (call+result × 3).

[m3] `src/index.ts:82` — branch redundante `msg.includes("git write") || msg.includes("proibido")`.
      O port (`apps/estaleiro/core/src/ports/bash.ts:42`) lança uma única string
      "git write no repo Docs é proibido — enfileire via fila.mjs" que contém ambos
      substrings. Asserção `||` é defensiva contra futura mudança do texto do
      port, mas hoje é puramente cosmético. Não bloqueia; só simplifica para
      `msg.includes("git write")` (alinhado à redação da spec §1).

INFO (2)
────────────────────────────────────────────────────────

[i1] Cobertura por caso de spec §4 (12/12):
      1 ✓  2 ✓  3 ✓  4 ✓  5 ✓  6 ✓  7 ✓  8 ✓  9 ✓  10 ✓ (parcial — ver [m1])
      11 ✓ (parcial — ver [m2])  12 ✓  → 12 testes verdes, 2 com assertion gap.

[i2] Wiring gate (agent spec §5.1) — PASS.
      `grep -n "node:fs|node:child_process|child_process" src/index.ts` = 0 hits.
      O plugin roteia 100% por `opts.fs.readFile` / `opts.fs.writeFile` / `opts.bash.exec`.
      Import cross-package `plugin-fs-tools → estaleiro-core` está na direção LEGAL
      (core não depende de plugin-fs-tools; sem ciclo).

═══════════════════════════════════════════════════════════════════════
VEREDICTO: REFATORAÇÃO NECESSÁRIA
Resumo: 12/12 testes verdes e Gate build+test+lint limpo, mas dois
achados MAJOR: (M1) `PluginTools = any` viola verbatim o contrato
estrito de spec §1 (verificado por probe — a interface da spec COMPILA);
(M2) edição de `apps/estaleiro/core/src/index.ts` está fora do escopo
declarado em §3 (precisa ser registrada na spec). Nenhum bug funcional.
────────────────────────────────────────────────────────

### Parecer do Reviewer 2 (minimax-m3, independente — re-review pós-rework):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — gate pós-rework):**
```
$ pnpm --filter @plataforma/plugin-fs-tools build
$ tsc
(sem erros — exit 0)

$ pnpm --filter @plataforma/plugin-fs-tools test
$ vitest run
 RUN v3.2.6 C:/Dev2026/.superapp-worktrees/EST-05/packages/plugin-fs-tools
 ✓ tests/index.test.ts (12 tests) 1041ms
   ✓ makeTools > 9. bash com timeout → {exit:null, timedOut:true}  527ms
 Test Files  1 passed (1)
      Tests  12 passed (12)

$ pnpm --filter @plataforma/plugin-fs-tools lint
$ eslint src/
(sem erros — exit 0)
```
- **Verificação rápida pré-auditoria (skill §1 — 3/3):** Handover §8 rework 1 (2026-07-06) mais novo que Parecer R1 (17:40); Log §9 tem `[Finalizado] 17:57` (rework pronto) APÓS 17:40; `git log task/EST-05` mostra 2 novos commits após `b5df84f` (`8be621c` [M1] + `9b770aa` [m1/m2]).
- **Sondas adversariais R2 (5/5 verdes):** PROBE-R2-1 PluginTools strict; R2-2 `vi.fn` spies + not.toHaveBeenCalled(); R2-3 6 eventos na ordem; R2-4 capability validation; R2-5 import cross-package direção LEGAL. Probes removidos.

═══════════════════════════════════════════════════════════════════════
QA REPORT — EST-05 R2 — re-review pós-rework (minimax-m3, independente)
═══════════════════════════════════════════════════════════════════════
Data: 2026-07-06  |  Revisor: agile_reviewer (minimax-m3, R2)
Testes: 12 declarados · 12 passaram · 0 falharam
tsc: OK  |  lint: OK  |  build: OK

Verificação dos 4 bloqueantes do Parecer R1:
[M1] `src/index.ts:21-29` PluginTools restaurado para interface estrita.
      Diff: removido `any`+`eslint-disable`; novo:
        export interface PluginTools {
          readFile:  Tool<{path:string},{content:string}>;
          writeFile: Tool<{path:string;content:string},{ok:true}>;
          bash:      Tool<{command:string},
            | {ok:false;error:string} | {exit:number|null;timedOut:boolean;output:string}
          >;
        }
      Spec §1 usa `ReturnType<typeof tool<...>>`; worker usou `Tool<INPUT, OUTPUT>`
      (importado de `ai@^7`). Equivalentes — `tool(config)` retorna `Tool<INPUT, OUTPUT>`.
      Contrato preservado verbatim na fronteira pública. ✓ **fixed**
      Sub-observação: `src/index.ts:104` tem `as unknown as PluginTools` no return —
      workaround para `exactOptionalPropertyTypes: true` no tsconfig base. Cast interno
      (não afeta API pública `PluginTools`). TypeScript practice aceitável. → INFO.

[M2] `tasks/EST-05.md:92` — `apps/estaleiro/core/src/index.ts` registrado como [EDIT] em §3.
      Diff: `+[EDIT] apps/estaleiro/core/src/index.ts — re-export FsPort + makeFsPort /
      BashPort + makeBashPort (pré-condição para o import @plataforma/estaleiro-core da §1).`
      Spec emendada para registrar a edição. Re-export em si permanece correta (commit
      original `b5df84f`, aditiva). ✓ **fixed**

[m1] `tests/index.test.ts:150-178` — caso 10 refatorado com `vi.fn()` spies.
      Verifica `expect(mockFs.readFile).not.toHaveBeenCalled()` + idem writeFile/exec
      após cada `rejects.toThrow("cancelado")`. Invariante `signal aborted ⇒ zero side
      effects` AGORA documentado no teste. ✓ **fixed**

[m2] `tests/index.test.ts:180-209` — caso 11 estendido.
      Cobre `readFile → writeFile → bash`. Asserta 6 eventos na ordem:
      `types = ["tool-call","tool-result",...×3]` + `tools_seq = ["readFile","readFile",
      "writeFile","writeFile","bash","bash"]` + `ts` é number. ✓ **fixed**

Não-bloqueante R1 [m3] `src/index.ts:90` branch `||` — já no `tasks/_pendencias.md` (BEGIN/EST-05/END PENDENCIAS). Não bloqueia.

INFO (1) [i1] Cast `as unknown as PluginTools` é workaround TypeScript para
`exactOptionalPropertyTypes: true`. Adaptação legítima ao strict optional, não
violação do contrato §1 (que define shape público).

═══════════════════════════════════════════════════════════════════════
VEREDICTO: APROVADO
Resumo: rework endereça os 4 bloqueantes (M1, M2, m1, m2). 12/12 verde,
build+lint limpos, 5/5 R2 probes verdes. Sem divergência do Parecer R1 —
os 2 MAJOR foram corretamente endereçados; os 2 MINOR m1/m2 também;
m3 já no ledger. Pronto para integrar (Caminho A: merge + approve).
────────────────────────────────────────────────────────

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-fs-tools move ORQ-09a, capacity=haiku, depende de EST-02 (draft)
- **[2026-07-06T13:30]** - *minimax-m3* - `[Endurecido]`: reendurecimento JIT (deps EST-02a/b/c done) — contratos derivados verbatim de EST-02a (`PluginManifest`) + EST-02b (`FsPort`/`BashPort` reais em apps/estaleiro/core/src/ports/{fs,bash}.ts); `makeTools` agora recebe `{ manifest, fs, bash, ... }` em vez de `cwd` direto; 12 casos de teste (8 do ORQ-09a + 4 novos: timeout-mapping, signal-cancel, onEvent-order, port-wiring-anti-regression); capacidade=haiku mantida
- **[2026-07-06T16:47]** - *minimax-m3* - `[Reconciliado]`: status restaurado de draft:hardened para draft:triaged (drift corrigido)
- **[2026-07-06T16:47]** - *minimax-m3* - `[Endurecido]`: endureceu spec — reendurecimento JIT pós EST-02a/b/c done: makeTools({manifest, fs, bash, ...}) roteia por FsPort/BashPort; 12 testes (8 ORQ-09a + 4 novos); capacidade=haiku mantida
- **[2026-07-06T17:07]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
- **[2026-07-06T17:10]** - *deepseek* - `[Iniciado]`: iniciando plugin-fs-tools — move ORQ-09a
- **[2026-07-06T17:20]** - *deepseek* - `[Finalizado]`: plugin-fs-tools, 12/12 testes, build+lint verdes, mediação via FsPort/BashPort
- **[2026-07-06T17:26]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando
- **[2026-07-06T17:40]** - *agile_reviewer:minimax-m3* - `[Requer Refatoração]`: Rework (Caminho B) — Gate de Evidência 12/12 verde (build/test/lint OK), mas 2 achados MAJOR bloqueantes: [M1] src/index.ts:20-21 viola verbatim o contrato de PluginTools de spec §1 (a interface estrita COMPILA com ai@^7.0.14 — verificado por probe) — restaurar a interface de §1 e remover o eslint-disable; [M2] apps/estaleiro/core/src/index.ts editado fora do escopo declarado em §3 (2 re-exports adicionados: FsPort, BashPort) — o worker deve (a) adicionar apps/estaleiro/core/src/index.ts a §3 como [EDIT] com justificativa 'precondição para import de §1' e (b) atualizar o Handover §8 para apontar a edição. Adicionalmente, 2 MINOR de cobertura: [m1] caso 10 incompleto (spec exige vi.fn spies verificando 'ports NÃO chamados' — test atual só checa rejects.toThrow); [m2] caso 11 parcial (spec exige 3 tools × call+result = 6 eventos, test só exercita readFile). Impl JÁ cumpre [m1]/[m2] (verificado por probe), mas o test não documenta o invariante — refatorar tests com vi.fn spies para [m1] e estender para as 3 tools para [m2]. Não-bloqueante [m3] (branch redundante substring ||) → ledger de pendências.
- **[2026-07-06T17:51]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1+M2+m1+m2
- **[2026-07-06T17:57]** - *deepseek* - `[Finalizado]`: rework pronto: M1+M2+m1+m2 corrigidos — build+test+lint verdes (12/12)
- **[2026-07-06T18:23]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: R2 — re-review após rework
- **[2026-07-06T18:28]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (Caminho A — pós-rework): merge task/EST-05 (commits 8be621c + 9b770aa + b5df84f + pnpm-lock reconcile) na master (hash 0c49ce6), worktree removida, push origin master, Gate pós-merge verde (build tsc OK, test 12/12 passed, lint eslint 0 erros). Pendência [m3] branch redundante já em ledger. R1 verdict: REFATORAÇÃO; R2 (independente) verdict: APROVADO — sem divergência.
