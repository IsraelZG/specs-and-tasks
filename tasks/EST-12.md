---
id: EST-12
title: "plugin-skills: gerenciamento de skills/agentes/CLAUDE.md do Estaleiro, edicoes refletidas no repo via git"
status: ready
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-02d"]
blocks: []
capacity_target: sonnet
decisions: ["local-do-commit-utility"]
---

# EST-12 · plugin-skills

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js 22+. `packages/plugin-skills/`. **Componente NOVO** (RFC-018 B5) —
  skills do Claude Code continuam existindo, mas o gerenciamento delas — e de configs de
  agente/CLAUDE.md — passa a ser feito por este plugin, com edicoes internas refletidas no
  repositorio via fluxo git normal.
- **Package Manager:** `pnpm` (monorepo superapp, ja cobre `packages/*`).
- **Language:** TypeScript (padrao do monorepo).
- **Test Runner:** `vitest` (padrao do monorepo).

### Contratos consumidos (EST-02a + EST-02b + EST-02c — todos done)
```ts
// PluginManifest (EST-02a — apps/estaleiro/core/src/manifest.ts)
export const PluginManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  capabilities: z.array(z.enum(["fs","bash","network","store","events","compute","ui"])),
  entrypoint: z.string(),
});
export type PluginManifest = z.infer<typeof PluginManifestSchema>;

// FsPort (EST-02b — apps/estaleiro/core/src/ports/fs.ts)
export interface FsPort {
  readFile(plugin: PluginManifest, path: string): Promise<Uint8Array>;
  writeFile(plugin: PluginManifest, path: string, data: Uint8Array): Promise<void>;
}

// BashPort (EST-02b — apps/estaleiro/core/src/ports/bash.ts)
export interface BashPort {
  exec(plugin: PluginManifest, command: string, options?: {
    timeout?: number;
    cwd?: string;
  }): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}
```

### Contratos do plugin
```ts
// --- packages/plugin-skills/src/index.ts
import type { PluginManifest, FsPort, BashPort, CommitPort } from "@plataforma/estaleiro-core";

export interface SkillEntry {
  name: string;      // slug, ex: "endurecer-task"
  content: string;   // conteudo markdown do skill
}

export interface AgentEntry {
  name: string;
  content: string;
}

export interface MakeSkillsOptions {
  manifest: PluginManifest;        // capabilities DEVE incluir "fs","bash"
  fs: FsPort;                      // leitura (list/read)
  bash: BashPort;                  // listagem de diretório
  commit: CommitPort;              // SINGLETON injetado (EST-02d) — write* persiste+commita por aqui
  skillsDir?: string;              // default: ".claude/skills"
  agentsDir?: string;              // default: ".claude/agents"
  claudeMdPath?: string;           // default: "CLAUDE.md"
  signal?: AbortSignal;
}

export interface PluginSkills {
  listSkills(): Promise<SkillEntry[]>;
  readSkill(name: string): Promise<SkillEntry>;
  writeSkill(entry: SkillEntry): Promise<void>;   // via opts.commit.enqueue (escreve+commita serial)
  listAgents(): Promise<AgentEntry[]>;
  readAgent(name: string): Promise<AgentEntry>;
  writeAgent(entry: AgentEntry): Promise<void>;   // via opts.commit.enqueue
  readClaudeMd(): Promise<string>;
  writeClaudeMd(content: string): Promise<void>;  // via opts.commit.enqueue
}

export function makeSkills(opts: MakeSkillsOptions): PluginSkills;
```

## 1. Objetivo
Implementar um plugin que **gerencia** (lista, edita, versiona) skills, perfis de agente e
CLAUDE.md usados pela frota do Estaleiro — a UI (EST-14) expoe essa gestao; toda edicao
feita ali e persistida de volta ao repositorio via git (commit normal do superapp, nao a
fila especial do Docs). Nao substitui as skills do Claude Code em si — gerencia a configuracao
delas.

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (B5) — a decisao exata (skills convivem; gestao via Estaleiro; reflexo em git).
- [x] **RFC-018 §6.4 (fronteira com plugin-knowledge):** os dois compartilham o mecanismo raso
      "CRUD de markdown + commit serializado" mas servem dominios distintos — NAO mesclar. Regra:
      escrita de arquivo SEMPRE via `plugin-fs-tools` mediado (nunca fs direto), e o utilitario de
      fila-de-commit-serial e COMPARTILHADO com EST-13 (um so, nao duas implementacoes).
- [x] `.claude/skills/` (Docs, padrao atual) — a forma de skill markdown a gerenciar/editar.
- [x] `CLAUDE.md` (projeto) — o tipo de configuracao de agente que este plugin tambem gerencia.
- [x] `docs/rfcs/rfc-018-estaleiro.md` §3 — diferente do Docs (fila serial), aqui e codigo: git direto por worktree, como o resto do superapp.
- [x] `apps/estaleiro/core/src/manifest.ts` (EST-02a) — `PluginManifest` schema Zod.
- [x] `apps/estaleiro/core/src/ports/fs.ts` (EST-02b) — `FsPort` interface + `makeFsPort`.
- [x] `apps/estaleiro/core/src/ports/bash.ts` (EST-02b) — `BashPort` interface + `makeBashPort`.

## 3. Escopo de Arquivos
- **[READ]** `apps/estaleiro/core/src/manifest.ts` (EST-02a) — `PluginManifest` tipo.
- **[READ]** `apps/estaleiro/core/src/ports/fs.ts` (EST-02b) — `FsPort` interface.
- **[READ]** `apps/estaleiro/core/src/ports/bash.ts` (EST-02b) — `BashPort` interface.
- **[READ]** `.claude/skills/` — skills existentes (formato de referencia).
- **[READ]** `CLAUDE.md` (raiz) — configuracao de agente (formato de referencia).
- **[CREATE]** `packages/plugin-skills/package.json` — nome `@plataforma/plugin-skills`, version `0.0.1`, `private: true`, `type: module`, scripts `build`/`test`/`lint` espelhando `packages/plugin-tasks/package.json`. Deps: `@plataforma/estaleiro-core@workspace:*`. DevDeps: `typescript@^5.8.0`, `vitest@^3.0.0`, `eslint@^9.0.0`, `typescript-eslint@^8.0.0`.
- **[CREATE]** `packages/plugin-skills/tsconfig.json` — estende `tsconfig.base.json`, `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]`.
- **[CREATE]** `packages/plugin-skills/src/index.ts` — `makeSkills` (assinatura SS1) + tipos exportados `PluginSkills`, `SkillEntry`, `AgentEntry`, `MakeSkillsOptions`.
- **[CREATE]** `packages/plugin-skills/tests/index.test.ts` — vitest, 11 casos da S4.

## 4. Estrategia de Testes
- **[x]** **Framework:** `vitest`.
- **Ambiente:** Node puro. `FsPort` e `BashPort` reais (`makeFsPort({cwd: tmpdir})`, `makeBashPort({cwd: tmpdir})`). Manifest de teste: `{ name: "@plataforma/plugin-skills-test", version: "1.0.0", capabilities: ["fs", "bash"], entrypoint: "./src/index.ts" }`.

### Casos (numerados, 11 total):
1. `listSkills` em diretorio com 2 skills → retorna `[{name, content}, ...]` (leitura do diretorio via BashPort + leitura de cada arquivo via FsPort).
2. `readSkill("existente")` → retorna `SkillEntry` com conteudo markdown integro (`TextDecoder` fiel).
3. `readSkill("inexistente")` → lanca (propaga ENOENT do `FsPort`).
4. `writeSkill({name:"nova", content:"# Nova Skill..."})` → arquivo criado em `.claude/skills/nova.md` com o conteudo exato.
5. Roundtrip: `writeSkill` seguido de `readSkill` → `SkillEntry` identico (content igual byte-a-byte apos encode+decode).
6. `writeSkill` com conteudo grande (>10KB) → escrito e lido integro (edge: `TextEncoder`/`TextDecoder` sem truncate).
7. `listAgents` em diretorio vazio → `[]`.
8. `readClaudeMd` → retorna conteudo do `CLAUDE.md` (arquivo precisa existir no cwd do host).
9. `writeClaudeMd("# novo config")` → arquivo raiz `CLAUDE.md` sobrescrito com o novo conteudo.
10. `signal.aborted` antes de qualquer operacao → `makeSkills(...).listSkills()` lanca `Error("cancelado")` SEM chamar nenhum port (usar `vi.fn()` spies para verificar zero chamadas a `fsPort`/`bashPort`).
11. Manifest sem `capabilities: ["fs", "bash"]` → `makeSkills` lanca `Error` com mensagem descritiva.

- **`CommitPort` é injetado como fake/spy nos testes:** os casos 4/5/9 (write*) verificam que
  `opts.commit.enqueue` foi chamado com `{path, content, message}` corretos (spy) — a escrita+commit
  real e a serializacao sao cobertas em EST-02d, nao aqui.
- **Fora de Escopo:** Serializacao/git real (é do `CommitPort`, EST-02d) e a corrida cross-plugin (idem).

## 5. Instrucoes de Execucao
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** importar `node:fs` nem `node:child_process` direto — TODA operacao de fs/bash passa por `opts.fs`/`opts.bash`.
> - **NAO** reimplementar commit/git/fila — `write*` delega a `opts.commit.enqueue` (CommitPort, EST-02d). Reimplementar aqui daria um SEGUNDO lock e quebraria a serializacao entre este plugin e o plugin-knowledge.
> - **NAO** mexer em `pnpm-workspace.yaml` (ja cobre `packages/*`).
> - **NAO** editar `CLAUDE.md` ou skills existentes como side-effect — so opera nos paths que recebeu via `opts`.

1. **[TDD]** Criar `tests/index.test.ts` com os 11 casos acima (todos falhando/inexistentes).
2. Criar `packages/plugin-skills/package.json` e `tsconfig.json` (espelhar `packages/plugin-tasks/`).
3. Implementar `src/index.ts` com as assinaturas de SS1.
4. Rodar `pnpm --filter @plataforma/plugin-skills test` ate 11/11 verde.
5. Rodar `pnpm --filter @plataforma/plugin-skills build` e `lint`. Gate (S7).
6. Integrar com o commit utility (apos decisao do arquiteto em S6).

## 6. Feedback de Especificacao

### Decisao FECHADA (arquiteto, 2026-07-06): local do utilitario de commit serial
**Fonte:** RFC-018 S6.4. **Escolha:** porta `CommitPort` do host em `@plataforma/estaleiro-core`
(implementada em **EST-02d**), **instancia singleton injetada** via `opts.commit` nos dois plugins.

**Por que nao as opcoes originais:** A triagem propos a Opcao (b) "core", que esta direcionalmente
certa MAS pela razao errada. O ponto decisivo nao é "encaixa na semantica de infra" — é que a
garantia serial EXIGE **uma unica instancia**. Uma lib importada por ambos (Opcao A, ou (b) como
"classe que cada plugin constroi") daria **dois locks** → nao serializa a corrida no `index.lock`
entre plugin-skills e plugin-knowledge = exatamente o bug que a fila existe pra prevenir. Só o host
injeta a MESMA referencia nos dois → a forma correta é **porta injetada**, nao lib importada.
Opcao (c) rejeitada (assimetria). Disposabilidade OK: plugins duraveis dependem da *interface*
`CommitPort`; ao migrar pro superapp, o superapp injeta a propria impl (nao git).

**Impacto:** `write*` delega a `opts.commit.enqueue`; nova dependencia EST-02d; nenhum git/fila
neste plugin.

## 7. Definition of Done (DoD)

### Verificacao automatica (Gate de Evidencia — INVIOLAVEL)
O Worker deve colar a saida literal destes comandos na Secao 8 (Handover), rodados na raiz do `superapp`:
```bash
pnpm --filter @plataforma/plugin-skills build
pnpm --filter @plataforma/plugin-skills test
pnpm --filter @plataforma/plugin-skills lint
```
Todos devem retornar Exit Code 0. Lint sem erros NOVOS (regra de 2026-07-06 — 3 reworks consecutivos por regressao de lint; T-807, EST-02b/c).

### Checklist do Reviewer
- [ ] Respeita estritamente os arquivos da Secao 3? (sem `pnpm-workspace.yaml`, sem editar skills existentes como side-effect)
- [ ] Nenhum `import` de `node:fs` / `node:child_process` direto em `src/index.ts`?
- [ ] 11 casos da S4 verdes? (`Tests 11 passed (11)`)
- [ ] `tsc` sem erros? `eslint` sem erros NOVOS?
- [ ] Manifest com `capabilities: ["fs", "bash"]` validado em `makeSkills`?

## 8. Log de Handover e Revisao Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoracao**
- **Evidencia de Execucao (obrigatoria):**
```
```
- **Comentarios de Revisao:**

## 9. Log de Execucao (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessao de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-skills, capacity=sonnet, depende de EST-02 (draft)

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-06T18:01]** - *big-pickle* - `[Reconciliado]`: status restaurado de draft:pending_decision para draft:triaged (drift corrigido)
- **[2026-07-06T18:01]** - *big-pickle* - `[Decisão pendente]`: local do utilitario de commit serial em aberto (RFC-018 S6.4)
- **[2026-07-06T19:46]** - *claude-opus* - `[Decidido]`: Decidido: CommitPort porta do host (estaleiro-core, EST-02d), instancia singleton injetada — nao lib importada (evita 2 locks). write* delega a opts.commit.enqueue
- **[2026-07-06T22:10]** - *system* - `[Auto-promovida]`: dep EST-02d concluída
