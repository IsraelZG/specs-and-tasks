---
id: EST-13c
title: "plugin-knowledge: Writer serial de commits (compartilhado com EST-12)"
status: ready
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-02d"]
blocks: []
parent: "EST-13"
capacity_target: sonnet
decisions: ["local-do-commit-utility"]
---

# EST-13c · plugin-knowledge: Writer serial de commits

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js 22+. `packages/plugin-knowledge/` (ja existe apos EST-13a).
- **Writer serial:** **DECISAO FECHADA (arquiteto, 2026-07-06)** — a serializacao NAO vive aqui.
  Vive na porta `CommitPort` do host (`@plataforma/estaleiro-core`, **EST-02d**), instancia
  **singleton injetada**. Este writer é uma casca fina de dominio: resolve path/mensagem do
  conhecimento e **delega** ao `opts.commit.enqueue(...)`. NAO roda git, NAO tem lock proprio.
  (Motivo: um lock em memoria por-instancia NAO serializa entre plugin-skills e plugin-knowledge —
  daria dois locks; a garantia exige a MESMA instancia nos dois, e isso é do host. Ver EST-02d §1.)
- **Nao cria pacote novo, nao mexe no core:** consome `CommitPort` injetado via `opts.commit`.

### Contratos do plugin (fechado)
```ts
// --- packages/plugin-knowledge/src/writer.ts
import type { PluginManifest, FsPort, CommitPort } from "@plataforma/estaleiro-core";

export interface WriterOptions {
  manifest: PluginManifest;     // capabilities DEVE incluir "fs"
  fs: FsPort;                    // usado SÓ para read() (leitura de conteúdo atual)
  commit: CommitPort;           // SINGLETON injetado pelo host (EST-02d) — escrita+commit serial
  repoRoot: string;             // path absoluto da raiz do git, ex: "C:/Dev2026/superapp"
  signal?: AbortSignal;
}

export interface KnowledgeWriter {
  /** Delega ao CommitPort injetado (escrita+commit serial garantida pelo host). */
  write(entry: { path: string; content: string }): Promise<{ commitHash: string }>;
  /** Le o conteudo atual de um path (delega ao FsPort, path resolvido contra repoRoot). */
  read(path: string): Promise<string>;
}

export function makeWriter(opts: WriterOptions): KnowledgeWriter;
```

### Comportamento esperado
- `write({path, content})`: monta a mensagem de commit (`"chore(plugin-knowledge): <path>"`) e chama
  `opts.commit.enqueue(opts.manifest, { path, content, message })`. **Toda** a serializacao,
  escrita de arquivo e git ficam no `CommitPort` (EST-02d) — este metodo é um one-liner de delegacao.
- `read(path)`: le via `opts.fs.readFile` + `TextDecoder` (path resolvido contra `repoRoot`).

## 1. Objetivo
Implementar o writer serial de commits para artefatos markdown (skills, conhecimento, configs)
gerados/editados por multiplos agentes concorrentes. Mesmo padrao de protecao que a `fila.mjs`
do Docs, adaptado ao repo de codigo (git normal por worktree). Compartilhado com EST-12.

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (B4) e §6.4 — writer serial COMPARTILHADO; a serializacao é do host (CommitPort), nao deste plugin.
- [x] **EST-02d (`apps/estaleiro/core/src/ports/commit.ts`) — `CommitPort`/`makeCommitPort`.** É a fonte da serializacao; este writer delega a ela. Depende de EST-02d.
- [x] `apps/estaleiro/core/src/ports/fs.ts` (EST-02b) — `FsPort` (usado só no `read()`).

## 3. Escopo de Arquivos
- **[READ]** `apps/estaleiro/core/src/ports/commit.ts` (EST-02d) — `CommitPort` (o que este writer delega).
- **[READ]** `apps/estaleiro/core/src/ports/fs.ts` (EST-02b) — `FsPort` (para `read()`).
- **[CREATE]** `packages/plugin-knowledge/src/writer.ts` — `makeWriter` + tipos `KnowledgeWriter`, `WriterOptions`.
- **[UPDATE]** `packages/plugin-knowledge/src/index.ts` — re-export `makeWriter`, `KnowledgeWriter`.
- **[CREATE]** `packages/plugin-knowledge/tests/writer.test.ts` — vitest, 5 casos da S4.

## 4. Estrategia de Testes
- [x] **Framework:** `vitest`.
- **Ambiente:** Node puro. `CommitPort` é injetado como **fake/spy** (a serializacao REAL — inclusive
  a corrida cross-plugin — é testada em EST-02d, nao aqui; aqui testamos a DELEGACAO correta). `FsPort`
  real (`makeFsPort({cwd: tmpdir})`) para o `read()`.

### Casos (numerados, 5 total):
1. `write({path:"docs/test.md", content:"# Teste"})` → chama `commit.enqueue(manifest, {path, content, message})` UMA vez, com `message` contendo `"docs/test.md"` e `path`/`content` fiéis (spy verifica os args). Retorna o `{commitHash}` que o fake devolveu.
2. `read` de um path escrito → conteudo identico (roundtrip via FsPort).
3. `read` com conteudo grande (>10KB) → integro (`TextDecoder` sem truncate).
4. `signal.aborted` antes de `write` → lanca `Error("cancelado")` sem chamar `commit.enqueue` (spy em zero).
5. **Delegacao pura (o que fixou o bug):** `makeWriter` NAO importa `node:child_process` nem chama
   git; `write` propaga o erro se `commit.enqueue` rejeitar (o writer nao "engole" nem re-serializa).
   *(A serializacao entre plugin-skills e plugin-knowledge é garantida por ambos receberem a MESMA
   instancia de `CommitPort` do host — coberto pelo caso 3 de EST-02d, nao reimplementado aqui.)*

## 5. Instrucoes de Execucao
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** importar `node:fs`/`node:child_process` nem chamar git — a escrita+commit é do `CommitPort` (EST-02d). Este writer só delega.
> - **NAO** reimplementar fila/lock aqui — a serializacao é do host (instancia unica de CommitPort). Reimplementar daria um SEGUNDO lock e quebraria a garantia cross-plugin.
> - **NAO** depender de `graph.ts` ou `fts.ts` — writer e ortogonal aos outros modulos.
> - **NAO** mexer em `pnpm-workspace.yaml`.

1. Implementar `src/writer.ts` — `write()` delega a `opts.commit.enqueue`; `read()` via `opts.fs`.
2. Criar `tests/writer.test.ts` com `CommitPort` fake/spy + `FsPort` real no tmpdir.
3. Rodar `pnpm --filter @plataforma/plugin-knowledge test` ate 5/5 verdes.
4. Rodar `build` + `lint`. Gate (S7).

## 6. Feedback de Especificacao

### Decisao FECHADA (arquiteto, 2026-07-06): local do utilitario de commit serial
**Fonte:** RFC-018 S6.4. **Escolha:** porta `CommitPort` do host (`@plataforma/estaleiro-core`,
implementada em **EST-02d**), instancia **singleton injetada** nos dois plugins. NAO é pacote proprio
(Opcao A: import duplo → duas instancias → dois locks → nao serializa) nem dentro de um plugin
(Opcao C: assimetria). O writer daqui vira casca fina de delegacao. **Impacto:** este componente
agora depende de EST-02d (nova); complexidade cai de 3→2 (era o "utilitario" que virou delegacao).

## 7. Definition of Done (DoD)

### Verificacao automatica (Gate de Evidencia)
```bash
pnpm --filter @plataforma/plugin-knowledge build
pnpm --filter @plataforma/plugin-knowledge test
pnpm --filter @plataforma/plugin-knowledge lint
```
Todos Exit Code 0. Lint sem erros NOVOS.

### Checklist do Reviewer
- [ ] Apenas arquivos da S3 foram criados/editados? (sem modificar graph.ts, sem pnpm-workspace.yaml)
- [ ] `write()` DELEGA a `opts.commit.enqueue` — sem `node:child_process`, sem git, sem fila propria?
- [ ] 5 casos da S4 verdes? (`Tests 5 passed (5)`) — e os 8 de EST-13a continuam passando?
- [ ] `tsc` sem erros? `eslint` sem erros NOVOS?

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

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-06T19:47]** - *claude-opus* - `[Decidido]`: Decidido: CommitPort porta do host (estaleiro-core, EST-02d), singleton injetado. Writer vira casca fina de delegacao (opts.commit.enqueue), sem git/fila propria — evita 2 locks. Complexidade 3->2
- **[2026-07-06T22:10]** - *system* - `[Auto-promovida]`: dep EST-02d concluída
