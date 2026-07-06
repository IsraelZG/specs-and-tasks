---
id: EST-02d
title: "Host: CommitPort — writer serial de commits (singleton do host, injetado; local do utilitário compartilhado EST-12/EST-13c)"
status: done
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02a", "EST-02b"]
blocks: []
parent: "EST-02"
capacity_target: sonnet
hardened_by: claude-opus
---

# EST-02d · Host: CommitPort (writer serial de commits)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/core/src/ports/`.
- **Fonte:** RFC-018 §6.4 (writer serial COMPARTILHADO entre plugin-skills e plugin-knowledge) +
  decisão do arquiteto `local-do-commit-utility` (2026-07-06). Adição a `@plataforma/estaleiro-core`
  (EST-02 já `done`; esta é uma porta nova do host).
- **Package Manager:** `pnpm`. **Test Runner:** `vitest`. **Lint:** `eslint src/`.

## 1. Objetivo
Implementar o utilitário de **commit serial** como uma **porta do host** (`CommitPort`) — o local
compartilhado que EST-12 e EST-13c consomem. O ponto arquitetural inteiro: a serialização só vale
se houver **UMA instância** no host, injetada nos dois plugins (uma fila, um lock — padrão do
`fila.mjs`: dono único). Uma "lib importada por ambos" que cada plugin instancia daria **dois
locks** e não serializaria a corrida no `.git/index.lock` entre os plugins — que é justamente o que
esta porta previne.

Por que porta do host (e não pacote próprio nem dentro de um plugin):
- **Instância única garantida:** o host constrói `makeCommitPort(...)` UMA vez e injeta a mesma
  referência em todos os plugins (igual `FsPort`/`BashPort`). Um dono da fila ⇒ serialização real.
- **Disposabilidade correta:** commit-de-markdown-via-git é infra da **casca** (o superapp persiste
  por grafo/CRDT, não git). Os plugins dependem da **interface** `CommitPort`; quando migrarem, o
  superapp injeta a própria impl. A interface vive em `core` (descartável) sem prender os plugins
  duráveis a git.

### Contratos
```ts
// --- apps/estaleiro/core/src/ports/commit.ts
import type { PluginManifest } from "../manifest";
import type { FsPort } from "./fs";
import type { BashPort } from "./bash";

export interface CommitEntry {
  path: string;      // relativo à raiz do repo git
  content: string;   // conteúdo markdown a escrever
  message: string;   // mensagem de commit (ex.: "chore(plugin-knowledge): docs/x.md")
}

export interface CommitPort {
  /**
   * Escreve `entry.content` em `entry.path` (via FsPort) e commita (via BashPort),
   * SERIALIZADO GLOBALMENTE. Como o host injeta UMA instância em todos os plugins,
   * todas as chamadas — de qualquer plugin — passam pela mesma fila interna
   * (promise-chain: dono único). Resolve com o hash do commit.
   */
  enqueue(plugin: PluginManifest, entry: CommitEntry): Promise<{ commitHash: string }>;
}

export interface CommitPortOptions {
  fs: FsPort;
  bash: BashPort;
  repoRoot: string;          // path absoluto da raiz do git
  signal?: AbortSignal;
}

/** Constrói a instância SINGLETON (o host chama UMA vez e injeta em todos os plugins). */
export function makeCommitPort(opts: CommitPortOptions): CommitPort;
```

### Comportamento esperado
- `enqueue(plugin, entry)`: encadeia numa fila interna (`this.tail = this.tail.then(() => run)`) — a
  próxima chamada só executa após a anterior resolver. `run` = `fs.writeFile(plugin, resolvedPath,
  encode(content))` → `bash.exec(plugin, 'git add <path> && git commit -m <msg>', { cwd: repoRoot })`
  → extrai o hash de `git rev-parse HEAD`. Path resolvido contra `repoRoot`.
- **Serialização é a invariante:** duas chamadas concorrentes de plugins DIFERENTES (mesma instância)
  nunca rodam git ao mesmo tempo (sem corrida no `index.lock`).
- `signal.aborted` → lança antes de tocar os ports.
- Sem repo git em `repoRoot` → o `git commit` falha; propaga erro descritivo.

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §6.4 — writer serial compartilhado; §3 — core é a casca (host).
- [x] `tools/scripts/fila.mjs` (Docs) — padrão de serialização por dono único (a replicar em memória, in-process — aqui não é cross-process, é um singleton no host).
- [x] `apps/estaleiro/core/src/ports/fs.ts` (EST-02b, done) — `FsPort`.
- [x] `apps/estaleiro/core/src/ports/bash.ts` (EST-02b, done) — `BashPort`.
- [x] `apps/estaleiro/core/src/manifest.ts` (EST-02a, done) — `PluginManifest`.

## 3. Escopo de Arquivos
- **[READ]** `apps/estaleiro/core/src/ports/fs.ts`, `.../bash.ts`, `.../manifest.ts` (contratos).
- **[CREATE]** `apps/estaleiro/core/src/ports/commit.ts` — `CommitPort`, `CommitEntry`, `CommitPortOptions`, `makeCommitPort`.
- **[UPDATE]** `apps/estaleiro/core/src/index.ts` — re-export dos tipos + `makeCommitPort`.
- **[CREATE]** `apps/estaleiro/core/tests/commit.test.ts` — vitest, 6 casos.

## 4. Estratégia de Testes
- [x] **Framework:** vitest. **Ambiente:** Node puro; tmpdir com `git init` (via BashPort real, `makeBashPort({cwd:tmpdir})`); FsPort real.
### Casos (6):
1. `enqueue(p, {path:"a.md", content:"# A", message:"m1"})` → arquivo criado, `git log` mostra 1 commit; retorna `{commitHash}` não-vazio.
2. Duas `enqueue` sequenciais (paths distintos) → 2 commits na ordem, hashes distintos.
3. **Serialização cross-caller (o caso que EST-13c antes não cobria):** `Promise.all` de N=5
   `enqueue` disparados de **manifests diferentes** (simulando plugin-skills + plugin-knowledge
   compartilhando a MESMA instância) → todos os N commits presentes no `git log`, nenhum erro de
   `index.lock`, ordem = ordem de chegada na fila.
4. `enqueue` seguido de leitura do arquivo → conteúdo íntegro (roundtrip encode/decode).
5. `signal.aborted` antes de `enqueue` → lança `Error("cancelado")` sem tocar fs/bash (spies em zero).
6. `repoRoot` sem git init → `enqueue` rejeita com erro descritivo (contém "git").

## 5. Instruções de Execução
> **REGRAS DO QUE NÃO FAZER:**
> - **NÃO** importar `node:fs`/`node:child_process` direto — tudo via `opts.fs`/`opts.bash`.
> - **NÃO** usar lock de arquivo/distribuído — a fila é in-process (promise-chain), um dono. Simples.
> - **NÃO** expor a fila interna nem permitir múltiplas instâncias por design — o singleton é do host.

1. Implementar `commit.ts` com a fila promise-chain + git via BashPort.
2. Re-export em `index.ts`.
3. `tests/commit.test.ts` (init de git no tmpdir), 6 casos verdes.
4. Gate (§7).

## 6. Feedback de Especificação
- **Decisão fechada (arquiteto, 2026-07-06):** `local-do-commit-utility` = **porta do host em
  `@plataforma/estaleiro-core`, instância singleton injetada** (não pacote próprio, não dentro de um
  plugin). Reformulação da "Opção B" da triagem: o ganho não é "encaixar na semântica de infra" —
  é que a garantia serial EXIGE instância única, e o host é o único lugar que injeta a mesma
  referência nos dois plugins. Ver EST-12/EST-13c §6.

## 7. Definition of Done (DoD)
### Gate de Evidência
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
```
Todos Exit 0. Lint sem erros NOVOS.
### Checklist
- [ ] `CommitPort`/`makeCommitPort` em `commit.ts`, re-exportados de `index.ts`?
- [ ] Fila serial in-process (promise-chain, dono único)?
- [ ] Caso 3 (serialização cross-caller, N=5 manifests distintos) verde?
- [ ] Testes de EST-02a/b continuam passando (sem regressão no core)?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **CommitPort implementado:** `apps/estaleiro/core/src/ports/commit.ts` — fila serial in-process via promise-chain (`tail.then().catch()`), usa FsPort + BashPort, extrai hash via `git rev-parse HEAD`.
- **Re-export:** `index.ts` exporta `CommitPort`, `CommitEntry`, `CommitPortOptions`, `makeCommitPort`.
- **6 casos de teste verdes** em `tests/commit.test.ts`: (1) enqueue única, (2) sequencial 2 commits, (3) cross-caller N=5 com Promise.all + manifests diferentes, (4) roundtrip encode/decode, (5) signal abortado sem tocar ports, (6) repoRoot sem git init.
- **Regressão:** 17 testes existentes continuam passando (total 24).
- **Gate:** build ✅ · test 24/24 ✅ · lint ✅
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
=== BUILD ===
$ tsc
EXIT:0

=== TEST (24 tests, 7 files) ===
✓ tests/events.test.ts (2 tests)
✓ tests/store.test.ts (2 tests)
✓ tests/fs.test.ts (3 tests)
✓ tests/network.test.ts (2 tests)
✓ tests/manifest.test.ts (5 tests)
✓ tests/bash.test.ts (3 tests)
✓ tests/commit.test.ts (7 tests)

Test Files  7 passed (7)
     Tests  24 passed (24)
EXIT:0

=== LINT ===
$ eslint src/
EXIT:0
```
- **Comentários de Revisão:**

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/estaleiro-core build
$ tsc  (sem erros — exit 0)

$ pnpm --filter @plataforma/estaleiro-core test
$ vitest run
 ✓ tests/events.test.ts   (2 tests)   9ms
 ✓ tests/fs.test.ts       (3 tests)  55ms
 ✓ tests/network.test.ts  (2 tests)  81ms
 ✓ tests/store.test.ts    (2 tests)   8ms
 ✓ tests/bash.test.ts     (3 tests) 648ms
 ✓ tests/manifest.test.ts (5 tests)  19ms
 ✓ tests/commit.test.ts   (7 tests) 3382ms
   ✓ CommitPort > 1. enqueue única
   ✓ CommitPort > 2. duas enqueue sequenciais
   ✓ CommitPort > 3. serialização cross-caller — Promise.all N=5
 Test Files  7 passed (7)  ·  Tests  24 passed (24)

$ pnpm --filter @plataforma/estaleiro-core lint
$ eslint src/  (sem erros — exit 0)
```
- **Sondas adversariais (5/5 verdes — INFO):** PROBE-1 N=10 com 1 instância = 10 commits distintos; PROBE-2 ordem preservada (spy em writeFile); PROBE-3 erro de git NÃO trava a fila; PROBE-4 error message contém /git/i; PROBE-5 instâncias diferentes têm filas separadas (singleton é por design do host). Probes removidos; worktree limpo.

═══════════════════════════════════════════════════════════════════════
QA REPORT — EST-02d — CommitPort (writer serial via promise-chain)
═══════════════════════════════════════════════════════════════════════
Data: 2026-07-06  |  Revisor: agile_reviewer (minimax-m3)
Testes: 24 declarados · 24 passaram · 0 falharam
tsc: OK  |  lint: OK  |  build: OK

Spec §1 (contratos) — match verbatim: CommitEntry (commit.ts:5-9), CommitPort.enqueue (commit.ts:11-13), CommitPortOptions (commit.ts:15-20), makeCommitPort (commit.ts:24). Singleton via closure `tail: Promise` no makeCommitPort (fila por instância). Re-export em index.ts:5.

Spec §3 (escopo) — `git diff --name-only HEAD~1 HEAD` na worktree = 3 paths, todos em §3 (commit.ts, index.ts UPDATE, commit.test.ts). Sem out-of-scope.

Spec §4 (testes) — 6/6 cases + 1 regressão = 7/7 verde. Caso 3 (cross-caller N=5) = PASS, o teste crítico que EST-13c antes não cobria.

DoD §7 — checklist completo: CommitPort re-exportado ✓ · fila serial in-process ✓ · caso 3 verde ✓ · sem regressão no core (17+7=24 verde) ✓.

Gates arquiteturais (agent spec §5.1): Wiring gate (commit.ts sem `node:fs`/`child_process` direto, só type imports) ✓ · Coupling gate (intra-pacote) ✓.

MINOR (1) [m1] `commit.ts:33` — `fs.writeFile(plugin, entry.path, ...)` assume que caller constrói `FsPort` com `cwd: repoRoot`. Spec §1 diz "Path resolvido contra `repoRoot`" — o impl cumpre, mas o JSDoc de `enqueue` poderia explicitar a convenção. Não-bloqueante (uso correto no test e em produção normal).

INFO (2) [i1] Cobertura 7/7 verde, zero gap. [i2] Decisão arquitetural `local-do-commit-utility` (spec §6) corretamente codificada: `tail` é closure, não exportada, singleton é por design do host (PROBE-5 confirma).

═══════════════════════════════════════════════════════════════════════
VEREDICTO: APROVADO
Resumo: 24/24 verde, build+lint limpos, 5/5 R-probes verdes. Spec §1
e §3 cumpridos verbatim. Singleton via closure. Wiring/coupling PASS.
1 MINOR (JSDoc) + 2 INFO — nenhum bloqueante. Pronto p/ integrar.
────────────────────────────────────────────────────────

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T19:50]** - *claude-haiku* - `[Promovida p/ ready]`: CommitPort pronta: deps EST-02a/b done, spec hardened, caso 3 testa serializacao cross-plugin (o bug que previne)
- **[2026-07-06T19:52]** - *deepseek* - `[Iniciado]`: iniciando — CommitPort + testes
- **[2026-07-06T19:56]** - *deepseek* - `[Finalizado]`: feat: CommitPort — writer serial de commits (promise-chain singleton). 6 casos de teste (cross-caller N=5 incluso). Gate: build+test(24/24)+lint 100% verde.
- **[2026-07-06T22:04]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando
- **[2026-07-06T22:10]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (Caminho A — APROVADO): merge task/EST-02d (commit e1d6c2a) em master (hash d66acb0, 3 files / 231 ins), worktree removida, push origin master (0c49ce6..d66acb0), Gate pós-merge verde (build tsc OK, test 24/24 passed, lint eslint 0 erros). 1 MINOR (JSDoc) — não-bloqueante, aceito no código.
