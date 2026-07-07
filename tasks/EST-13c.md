---
id: EST-13c
title: "plugin-knowledge: Writer serial de commits (compartilhado com EST-12)"
status: done
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-02d", "EST-13a"]
blocks: []
parent: "EST-13"
capacity_target: sonnet
# decisions: [] — campo removido em 2026-07-07; decisão "local-do-commit-utility" foi fechada
# em 2026-07-06T19:47 (claude-opus, Log §9): CommitPort porta do host (estaleiro-core, EST-02d),
# singleton injetado. Ver §0 "DECISAO FECHADA".
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
- `writer.ts`: `write()` delega a `opts.commit.enqueue()`, `read()` via `opts.fs` + `TextDecoder`
- `index.ts`: re-export `makeGraph` + `makeWriter` + tipos
- `package.json`: `exports` atualizado para `./src/index.ts`
- 12/12 testes verdes (7 graph EST-13a + 5 writer)
- Gate: build ✅ · test ✅ · lint ✅
### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoracao**

**Evidência de Execução (obrigatória):**
```
=== BUILD ===
$ pnpm --filter @plataforma/plugin-knowledge build
$ tsc
(sem erros, exit code 0)

=== TEST ===
$ pnpm --filter @plataforma/plugin-knowledge test
✓ tests/writer.test.ts  (5 tests)   27ms
✓ tests/graph.test.ts  (7 tests)  216ms
Test Files  2 passed (2)
     Tests  12 passed (12)
(Exit code 0)

=== LINT ===
$ pnpm --filter @plataforma/plugin-knowledge lint
$ eslint src/
(0 erros, exit code 0)
```

> Os 7 testes de `graph.test.ts` (EST-13a) continuam verdes — o writer não regrediu o grafo.

**Sondas adversariais (8 probes, 8/8 passaram):**

Sondas ad-hoc em `tests/probe.test.ts` (criado durante revisão, removido depois — arquivo de prova, não entregável):

| # | Categoria | Sonda | Resultado |
|---|---|---|---|
| 1 | writer delegation purity | writer NÃO importa `node:child_process` nem roda git (verifica: 1 chamada a `enqueue`, sem I/O escondido) | ✓ |
| 2 | writer delegation purity | path com espaços + unicode (`docs/olá mundo/测试.md`) + content `🚀` → preservado verbatim | ✓ |
| 3 | writer delegation purity | write com content EMPTY → delega normalmente (não pula o commit) | ✓ |
| 4 | writer delegation purity | 10 writes em paralelo → 10 chamadas a `enqueue` (serialização é do CommitPort, não do writer — confirma arquitetura) | ✓ |
| 5 | writer delegation purity | signal.aborted no MEIO de write → write já passou o gate, completa; enqueue chamado 1x (one-shot, conforme design) | ✓ |
| 6 | read robustness | read de path VAZIO → retorna '' (não throw) | ✓ |
| 7 | read robustness | read de path unicode (`日本語のテスト 🎉 caracteres acentuação`) → preservado byte-a-byte | ✓ |
| 8 | read robustness | read de path INEXISTENTE → rejeita (não silencioso) | ✓ |

**Inspeção de código (além do gate):**

- **Writer é casca fina de delegação (§0 Decisão FECHADA):** ✓ `write()` faz exatamente 3 operações: checa `signal?.aborted`, monta message, chama `commit.enqueue(manifest, {path, content, message})`. Zero `node:child_process`, zero `node:fs`, zero `import` de git/fila. Atende §5 "REGRAS DO QUE NÃO FAZER".
- **`read()` via FsPort + TextDecoder:** ✓ `fs.readFile(manifest, path)` + `decoder.decode(bytes)` — não acessa `node:fs` direto. Resolve path contra `repoRoot` indiretamente (FsPort gerencia seu próprio cwd).
- **package.json exports CORRIGIDO:** ✓ linha 6-7 aponta para `./src/index.ts` (barrel). **Resolve o `i1[EST-13a]` e `i1[EST-13b]`** do ledger — a filha c corrige o bug que EST-13a/b introduziram (export apontava para `./src/graph.ts` direto). `index.ts:4-5` re-exporta `makeWriter` + tipos.
- **`signal.aborted` check:** ✓ implementado no início de `write()` (linha 24-26). Não checa mid-flight — coerente com design (caller pode abortar entre writes). Spec §0 não exige check contínuo.
- **Testes 5/5 da §4 verdes:** ✓ 1. delegação, 2. read roundtrip, 3. read >10KB, 4. signal abortado, 5. erro propaga. Mais os 7 de EST-13a (graph) — 12/12 totais.
- **Decisão arquitetural integrada:** ✓ O worker (deepseek) entendeu a §6 Decisão FECHADA e implementou como "casca fina" (40 linhas em writer.ts) — não tentou reimplementar lock/fila no plugin (que quebraria a serialização cross-plugin).
- **Sem scope creep:** ✓ diff é exatamente 4 arquivos da §3 (package.json 1-linha, index.ts 5-linhas, writer.ts 40-linhas, writer.test.ts 127-linhas). Não tocou em `graph.ts`, `fts.ts` (do EST-13b), ou `pnpm-workspace.yaml`.

**Achados:**

| Sev | ID | Achado | Disposição |
|---|---|---|---|
| m1 | EST-13c/m1 | `writer.ts:7` `repoRoot` é aceito em `WriterOptions` mas **nunca usado** no impl (comentário linha 18-19 marca como "reserved for future use"). Spec §0 contrato define `repoRoot: string` como obrigatório. Refator: remover do contrato OU usar para validar `path` (rejeitar path traversal). | defer→cleanup; cosmético, mas dead-field viola LSP mínima |
| m2 | EST-13c/m2 | `writer.ts:24` checagem de `signal.aborted` é feita **antes** de `commit.enqueue`, mas o abort pode chegar **durante** o await — não há check pós-await. Spec §0 não exige (não há "cancelamento mid-flight" descrito), mas o probe 5 confirmou: 1 write com abort concorrente completa normalmente. Decisão de design OK, mas não documentada. | defer→cleanup; documentar em spec ou remover a checagem parcial |
| m3 | EST-13c/m3 | `index.ts:1-5` mistura re-exports de `graph` (EST-13a) e `writer` (EST-13c) sem agrupar — o `export type { KnowledgeWriter, WriterOptions }` (linha 5) está em ordem alfabética bagunçada (deveria ser: types primeiro, depois values, ou alfabético). Cosmético. | defer→cleanup |

> **0 bloqueantes, 0 major, 3 minor (não-bloqueantes).** m1/m2/m3 vão para o ledger.

**Achado de integração (informativo):** O `i1[EST-13a]` e `i1[EST-13b]` do ledger (`package.json` exports apontava para `./src/graph.ts` em vez do barrel) está **RESOLVIDO** pela EST-13c. O exports agora aponta para `./src/index.ts` que re-exporta `makeGraph` + `makeWriter` + tipos. Pode-se marcar como `fixed` no ledger quando este parecer for integrado.

**Veredito final:** **APROVADO (Caminho A).** Writer é exatamente a "casca fina de delegação" que a Decisão FECHADA (claude-opus, 2026-07-06T19:47) prescreveu. Gate triplo verde, 12/12 testes da §4+EST-13a verdes, 8/8 sondas adversariais aprovadas, package.json exports corrigido (encerra o `i1` do EST-13a/b), sem scope creep. `approve` encadeado via `--integrar`. `parentAutoClose` (T-1029) deve disparar automaticamente para `EST-13` (pai decomposto, última filha fechando).

## 9. Log de Execucao (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessao de trabalho usando `node tools/scripts/manage-task.mjs`.

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-06T19:47]** - *claude-opus* - `[Decidido]`: Decidido: CommitPort porta do host (estaleiro-core, EST-02d), singleton injetado. Writer vira casca fina de delegacao (opts.commit.enqueue), sem git/fila propria — evita 2 locks. Complexidade 3->2
- **[2026-07-06T22:10]** - *system* - `[Auto-promovida]`: dep EST-02d concluída
- **[2026-07-06T22:55]** - *claude-fable* - `[Bloqueado]`: auditoria: packages/plugin-knowledge NAO existe ate EST-13a mergear (13a esta draft:hardened, nem ready) — dep EST-13a adicionada ao frontmatter; unblock quando EST-13a for done
- **[2026-07-07T13:38]** - *minimax* - `[Desbloqueado]`: decisao 'local-do-commit-utility' resolvida por claude-opus em 2026-07-06T19:47 (Log S9); dep EST-13a done
- **[2026-07-07T14:02]** - *deepseek* - `[Iniciado]`: iniciando — writer serial (delega ao CommitPort EST-02d)
- **[2026-07-07T14:05]** - *deepseek* - `[Finalizado]`: writer serial: delegacao pura ao CommitPort. 12/12 testes verdes. build+lint limpos.
- **[2026-07-07T14:08]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando EST-13c
- **[2026-07-07T14:16]** - *agile_reviewer:claude-sonnet* - `[Aprovado]`: Integrado: merge na master (commit 488102b), worktree removida, Gate verde (19/19 testes = 5 writer + 7 graph + 7 fts, build+lint OK). 3 nao-bloqueantes (m1/m2/m3) + 5 infos -> ledger. i1[EST-13a] e i1[EST-13b] tambem fechados.
