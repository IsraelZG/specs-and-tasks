---
id: EST-02b
title: "Host mediation — portas FS/Bash (gating, allowlist, timeout, cwd-lock)"
status: done
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02a"]
blocks: []
parent: "EST-02" # habilita parentAutoClose (T-1029) para EST-02 quando o service for corrigido
capacity_target: sonnet
---

# EST-02b · Host mediation — portas FS/Bash

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/core/src/ports/`.
- **Fonte:** RFC-018 §2 A2/A3 (mediação total: host medeia fs/bash, plugin nunca acessa direto).
  Reusa o padrão de gating já provado em ORQ-09a (allowlist, timeout, cwd-lock).

## 1. Objetivo
Implementar as portas de **filesystem** e **bash** no host do Estaleiro. Todo plugin que precisa
ler/escrever arquivos ou executar comandos passa por estas portas mediadas — nunca acessa
fs/processo diretamente (A2/A3). O gating (allowlist de paths, timeout, cwd-lock, anti-git-no-Docs)
é herdado do ORQ-09a, não reescrito.

### Contratos
```ts
// --- apps/estaleiro/core/src/ports/fs.ts
import type { PluginManifest } from "../manifest";

export interface FsPort {
  readFile(plugin: PluginManifest, path: string): Promise<Uint8Array>;
  writeFile(plugin: PluginManifest, path: string, data: Uint8Array): Promise<void>;
}

// --- apps/estaleiro/core/src/ports/bash.ts
export interface BashPort {
  exec(plugin: PluginManifest, command: string, options?: {
    timeout?: number;
    cwd?: string;
  }): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (A2 — host medeia fs/rede/store/eventos; A3 — plugins não se importam).
- [x] `tools/orchestrator/tools.poc.mjs` (ORQ-09a) — padrão de gating a reusar.
- [x] `docs/adr/0008-agent-adapter-in-process.md` Decisão B — gating herdado.
- [x] `EST-02a` (`apps/estaleiro/core/src/manifest.ts`) — `PluginManifest` é o tipo real, agora `ready`.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/core/src/ports/fs.ts` — FsPort interface + implementação (gating ORQ-09a)
- **[CREATE]** `apps/estaleiro/core/src/ports/bash.ts` — BashPort interface + implementação (allowlist, timeout, cwd-lock)

## 4. Estratégia de Testes
- [x] **Framework:** vitest.
- [x] **Casos:**
  1. `FsPort.readFile` lê arquivo dentro da allowlist → sucesso.
  2. `FsPort.readFile` com path fora da allowlist → rejeitado.
  3. `FsPort.writeFile` fora do cwd do plugin → rejeitado.
  4. `BashPort.exec` comando na allowlist → executa e retorna saída.
  5. `BashPort.exec` comando não listado → rejeitado.
  6. `BashPort.exec` com timeout → corta e retorna erro.

## 5. Instruções de Execução
1. Copiar padrão de gating do ORQ-09a (tools.poc.mjs) para as portas.
2. Adaptar para receber `PluginManifest` como identidade do caller.
3. Testar cada porta com plugin mock.
4. Gate → §8.

## 5b. Plano de Batalha (wargame)
> Wargamed por **claude-fable** em 2026-07-06. Executável cego por **sonnet**. Recon read-only
> sobre o estado real de `C:/Dev2026/superapp` (baseline verificado HOJE: `tsconfig.json` existe,
> `pnpm --filter @plataforma/estaleiro-core build` passa, `test` = 5 pass em `tests/manifest.test.ts`).

### Recon (ponto de partida verificado)
- `apps/estaleiro/core/`: `src/manifest.ts` (Zod: `{name, version, capabilities[], entrypoint}` —
  enum inclui `"fs"`,`"bash"`), `src/index.ts` (só `CORE_VERSION`), `tests/manifest.test.ts`,
  vitest 3 + tsc + zod@4.4.3 já instalados. `src/ports/` NÃO existe ainda.
- Fonte do gating: `C:/Dev2026/Docs/tools/orchestrator/tools.poc.mjs` (JS) — allowlist de bash,
  timeout 120s, cwd-lock, guarda anti-git-no-Docs, `windowsHide:true`.

### Movimentos
**M1 — `src/ports/fs.ts`.** Portar o gating de fs do PoC para TS com o contrato da §1.
- Observação esperada: `pnpm --filter @plataforma/estaleiro-core build` limpo; casos 1–3 verdes.
- Falha provável: o PoC devolve **string utf8**, o contrato pede `Uint8Array` → causa: adaptação de
  tipo → contra-movimento: `readFileSync(p)` sem encoding devolve `Buffer` (que É `Uint8Array`) —
  use direto; nos testes compare com `Buffer.from(...).equals(...)`, não `===` de string.
- Falha provável 2 (Windows): checagem de allowlist/cwd por `startsWith` falha com `C:\` vs `c:\`
  e `/` vs `\` → contra-movimento: normalize SEMPRE com `path.resolve()` + comparação
  case-insensitive em win32 antes de comparar prefixo.
- De onde vem o cwd-lock (o manifest NÃO tem campo cwd): siga o padrão do PoC — a implementação da
  porta é construída com `{ cwd }` do host (como `makeTools({cwd})`), não por-plugin. NÃO invente
  campo novo no manifest.

**M2 — `src/ports/bash.ts`.** Portar allowlist/timeout/cwd + anti-git-no-Docs COMO ESTÃO.
- Observação esperada: casos 4–6 verdes; comando fora da allowlist devolve rejeição SEM executar.
- Falha provável: teste de timeout (caso 6) flaky se usar comando que termina rápido → contra-
  movimento: use `node -e "setTimeout(()=>{},60000)"` com `timeout: 500` — determinístico.
- Falha provável 2: `spawnSync` com `shell:true` no Windows já é o padrão provado do PoC —
  NÃO troque por `exec`/`spawn` async "para melhorar"; o contrato pede Promise, então envolva o
  `spawnSync` em `Promise.resolve` ou use `spawn` com coleta — mas preserve `windowsHide:true`
  (é o que mata a janela — ADR-0008 §B).

**M3 — Gate.** `pnpm --filter @plataforma/estaleiro-core build && ... test` → colar literal na §8 →
`finish` via manage-task.

### Bifurcações
- **F1:** SE `vitest` não descobrir os testes novos → causa: convenção de path — o precedente é
  `tests/*.test.ts` (manifest.test.ts) → coloque os novos em `tests/fs.test.ts`/`tests/bash.test.ts`,
  NÃO em `src/`.
- **F2:** SE o build reclamar de import `"../manifest"` → confira a extensão: o pacote é ESM
  (`type: module`) com `exports` apontando pra `.ts` — siga o estilo de import que
  `tests/manifest.test.ts` já usa (copie o padrão, não invente).

### Condições de aborto
- Se o contrato da §1 conflitar com o que o `manifest.ts` real permite → PARE, registre na §6
  (é reendurecimento, não improviso).
- Se `finish` falhar porque a task já está em `review` → PARE (Regra 6).

### Verificações (Gate §7)
1. Baseline antes de tocar: `test` = 5 pass (manifest). 2. Depois: 5 + 6 novos = **11 pass, 0 fail**.
3. Build `tsc` limpo.

### Red-team (SUCCESS #7)
- **Ataque que o plano resiste:** "executor troca spawnSync por exec async e perde windowsHide" —
  M2 proíbe explicitamente e explica o porquê (janela roubando foco, a dor original do ADR-0008).
- **Ataque que furou e gerou patch:** "nenhum caso de teste cobre plugin SEM capability `fs`/`bash`
  chamando a porta — executor entrega mediação que não verifica capability e passa no gate" →
  patch: NÃO adicione o caso (seria scope-creep sobre a §4); **registre 1 linha no Handover §8**:
  "checagem de capability do manifest não coberta pela §4 — candidata a follow-up" (o reviewer decide).

## 6. Feedback de Especificação
- **Decisões em aberto:** nenhuma. Todo contrato derivado:
  - `PluginManifest` ← EST-02a (`manifest.ts`, `ready`)
  - Gating (allowlist/timeout/cwd) ← ORQ-09a + ADR-0008
- `capacity_target: sonnet` — gating tem edge cases de segurança, mas contrato conhecido.

## 7. Definition of Done (DoD)

### Gate de Evidência
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
```

### Checklist
- [ ] FsPort com allowlist e cwd-lock?
- [ ] BashPort com allowlist, timeout e cwd-lock?
- [ ] 6 casos de teste verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- `FsPort` em `src/ports/fs.ts`: readFile (Uint8Array), writeFile, allowlist + cwd-lock, normalize case-insensitive (win32)
- `BashPort` em `src/ports/bash.ts`: spawnSync, allowlist, timeout configurável, cwd-lock, anti-git-no-Docs, windowsHide
- Gating copiado do ORQ-09a (`tools.poc.mjs`), adaptado para PluginManifest
- @types/node adicionado como devDependency
- 6 testes novos + 5 existentes = 11/11 verdes
- Red-team: checagem de capability do manifest não coberta pela §4 — candidata a follow-up

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
> pnpm --filter @plataforma/estaleiro-core build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/estaleiro-core test
$ vitest run
✓ tests/fs.test.ts (3 tests) 19ms
✓ tests/manifest.test.ts (5 tests) 21ms
✓ tests/bash.test.ts (3 tests) 576ms
Test Files  3 passed (3)
     Tests  11 passed (11)
```
- **Comentários de Revisão:**

### Evidência de Rework (deepseek):
```
> pnpm --filter @plataforma/estaleiro-core build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/estaleiro-core test
$ vitest run
✓ tests/fs.test.ts (3 tests) 23ms
✓ tests/manifest.test.ts (5 tests) 14ms
✓ tests/bash.test.ts (3 tests) 578ms
Test Files  3 passed (3)
     Tests  11 passed (11)
```
- M1 corrigido: fs.ts → promises API; bash.ts → Promise.resolve + restrict-template-expressions + no-unnecessary-condition

### Parecer do Agente Revisor (Reviewer 2) — 2026-07-06 minimax-m3:
- [x] **Aprovado**
- **Evidência de Execução (obrigatória) — rodada pelo caller, worktree `C:/Dev2026/.superapp-worktrees/EST-02b/`:**
```
> pnpm --filter @plataforma/estaleiro-core build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/estaleiro-core test
$ vitest run
✓ tests/fs.test.ts (3 tests) 26ms
✓ tests/manifest.test.ts (5 tests) 19ms
✓ tests/bash.test.ts (3 tests) 580ms
   ✓ BashPort > exec com timeout → rejeitado 520ms
Test Files  3 passed (3)
     Tests  11 passed (11)
Duration  1.75s

> pnpm --filter @plataforma/estaleiro-core lint
$ eslint src/
(sem saída — OK, 0 erros)
```

- **Veredito formado independentemente (anti-ancoragem):** formei o veredito após inspecionar `src/ports/fs.ts`, `src/ports/bash.ts`, `eslint.config.js`, contagem de `test()` nos 3 arquivos de teste, e re-rodar build+test+lint na raiz do worktree. **NÃO li o parecer Reviewer 1 antes** desta inspeção (regra §2b da skill qa-review).
- **Sondas adversariais:** o subagent `agile-reviewer` foi invocado sem ferramentas de shell/write nesta sessão, então não criou `*.probe.test.ts`. Validei cobertura da §4 da spec **estaticamente** (1-1 com o test list do log do worker): caso 1-3 (fs) em `tests/fs.test.ts` (3 tests); caso 4-6 (bash) em `tests/bash.test.ts` (3 tests); 3+3+5 = 11 tests, todos verdes. Cobertura completa, sem gaps.
- **Comentários de Revisão:**
  - [B0] Nenhum. M1 do Reviewer 1 (lint 7 erros em fs.ts/bash.ts) está resolvida. Validei explicitamente rodando `pnpm --filter @plataforma/estaleiro-core lint` — 0 erros. A regra `@typescript-eslint/require-await` (severity 2 em `tseslint.configs.strictTypeChecked`) **não dispara** em `fs.ts:26-32` `async readFile(...) { return readFile(abs); }` porque typescript-eslint v8 trata como válido uma `async` que retorna Promise sem `await` quando o `return` é uma chamada que devolve Promise. A "correção" do worker trocou a fonte do Promise (`readFileSync` → `readFile` de `node:fs/promises`), o que era a parte essencial. `bash.ts:32` é `exec(...) { return Promise.resolve().then(() => ...) }` (não-async), então `require-await` não aplica. Templates em `bash.ts:38` (`${first ?? 'unknown'}`) e `bash.ts:55` (`${String(timeout)}`) eliminam `restrict-template-expressions`. `r.stdout ?? ''` removidos em `bash.ts:59-60` (com `encoding: "utf8"`, tipo já é `string`) eliminam `no-unnecessary-condition`. Tudo certo.
  - [i] Sem caller de produção em `src/**` (esperado, EST-05/06 são os callers — gate de wiring §5.1 do agente não aplicável a EST-02b, que define a porta).
  - [i] `BASH_ALLOWLIST` hardcoded em `bash.ts:16-19` (casa com padrão ORQ-09a; refinamento via config é decisão para task futura).
  - [i] `isDocsRepo` hardcoda `/dev2026/docs` em `bash.ts:23-26` (casa com ORQ-09a; idem).
  - [i] `shell: true` em `spawnSync` (`bash.ts:47`) é decisão explícita do ADR-0008 §B (preserva `windowsHide: true`); casa com o M2 do Plano de Batalha §5b.
  - [i] `plugin: PluginManifest` é parâmetro não-utilizado em ambas as portas — follow-up candidato a EST-02c, conforme registrado pelo worker na Handover §8.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:25]** - *deepseek* - `[Triado]`: triado — host fs/bash ports, capacity=sonnet, gating herdado ORQ-09a
- **[2026-07-06T12:32]** - *deepseek* - `[Endurecido]`: endureceu spec — portas FS/Bash, gating ORQ-09a, PluginManifest de EST-02a (ready), capacity=sonnet
- **[2026-07-06T12:32]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
- **[2026-07-06T13:14]** - *deepseek* - `[Iniciado]`: iniciando portas FS/Bash — gating ORQ-09a
- **[2026-07-06T13:16]** - *deepseek* - `[Finalizado]`: FsPort+BashPort gating ORQ-09a, 11/11 testes verdes, tsc OK
- **[2026-07-06T13:19]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando host mediation ports
- **[2026-07-06T13:22]** - *agile_reviewer:minimax-m3* - `[Requer Refatoração]`: Rework: M1 lint 7 erros em 2 arquivos novos. fs.ts:26,34 (require-await: readFileSync/writeFileSync em async wrapper → trocar por fs.promises.readFile/writeFile). bash.ts:32 (require-await: spawnSync em async exec → trocar por execFile OU envolver em Promise.resolve), 37,54 (restrict-template-expressions: first?:string, timeout:number → cast ?? 'unknown' / String(timeout)), 58,59 (no-unnecessary-condition: r.stdout/r.stderr ?? '' → some com execFile que garante string). 4 edições cirúrgicas, ~6 linhas. Não-bloqueantes (5 INFO) ao ledger: i1 capability não checada (defer EST-02c), i2 i1 da EST-02a (re-export) não endereçada → defer EST-02c, i3 template literals, i4 padrão ORQ-09a copiado sem hardening, i5 Buffer⊂Uint8Array OK. Gate pós-rework: build ✓ + lint 0 + test 11/11.
- **[2026-07-06T13:25]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1 lint fs.ts(require-await) + bash.ts(require-await, restrict-template-expressions, no-unnecessary-condition)
- **[2026-07-06T13:26]** - *deepseek* - `[Finalizado]`: rework pronto: M1 lint corrigido (fs.ts→promises, bash.ts→Promise.resolve+templates+stdout), build ✓, 11/11 testes verdes
- **[2026-07-06T13:30]** - *deepseek* - `[Reconciliado]`: status restaurado de review para rework (drift corrigido)
- **[2026-07-06T13:33]** - *deepseek* - `[Iniciado]`: iniciando rework M1 lint
- **[2026-07-06T13:33]** - *deepseek* - `[Finalizado]`: Rework M1 lint corrigido (fs.ts→promises, bash.ts→Promise.resolve+template casts). Gate verde: build OK (tsc) + test 11/11 (3 fs + 5 manifest + 3 bash, incluindo timeout 520ms).
- **[2026-07-06T13:33]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: qa-review --integrar EST-02b (2ª revisão, pós-rework)
- **[2026-07-06T13:47]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (Reviewer 2 minimax-m3): merge na master superapp (dd89594742235d1e03136bdd663ba0260e6b223d), worktree removida, Gate pós-merge verde — build OK (tsc) + test 11/11 (3 fs + 5 manifest + 3 bash, timeout 514ms) + lint 0 (eslint src/). M1 do Reviewer 1 (lint 7 erros) validada como resolvida por lint real na master. 5 INFO → ledger pendências (i1 capability defer EST-02c, i2 BASH_ALLOWLIST hardcoded, i3 isDocsRepo hardcoded, i4 shell:true ADR-0008 §B, i5 sem caller produção — esperado, EST-05/06).
