---
id: DMM-04
title: "Nó Explorer (Estágio 3): harness read-only + fs-tools + crushToCsv"
status: done
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"]
blocks: ["DMM-06"]
capacity_target: sonnet
---

# DMM-04 · Nó Explorer (Estágio 3): exploração delegada → CSV

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Implementar o **nó de invocação delegada** (ADR 0013, Estágio 3 — The Explorer): faz crawling do
repositório (coordenadas, buscas) e converte saídas extensas em **CSV denso**. A engine aciona o
`plugin-agent-harness` com `maxSteps` **baixo** e system prompt restrito a **leitura**; o agent usa
`plugin-fs-tools` (bash restrito). A saída bruta passa por `crushToCsv` do `plugin-context`
(transição declarada, contrato DMM-01) antes de alimentar os nós seguintes.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Estágio 3.
- [ ] `docs/adr/0014-contrato-no-workflow-declarativo.md` (DMM-01) — transição declarada (crushToCsv).
- [ ] `packages/plugin-agent-harness/src/runner.ts` (EST-06) — `run` com `maxSteps`/system prompt.
- [ ] `packages/plugin-fs-tools/` (EST-05) — bash gated / read-only.
- [ ] `packages/plugin-context/src/` — `crushToCsv`.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-agent-harness/src/runner.ts`, `packages/plugin-fs-tools/src/**`, `plugin-context` crushToCsv.
- **[CREATE]** definição do nó Explorer (harness read-only + maxSteps baixo) + transição crushToCsv.
- **[CREATE]** teste: run stub sobre um repo fixture → saída CSV densa esperada.

## 4. Estratégia de Testes Estrita
- Vitest com harness em modo stub/mock (sem chamar modelo real). Asserta **read-only** (nenhuma escrita).
- **Fora de Escopo:** qualidade do crawling com modelo real (é validação de integração posterior).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** dar acesso de escrita ao Explorer — system prompt e gating de `plugin-fs-tools` só leitura.
> - **NÃO** reimplementar o crush — chamar `crushToCsv` existente via transição declarada.

### Pegadinhas conhecidas
- O Explorer é read-only, logo seu handler (conforme `type Handler = (args, env) => Promise<Delta>`) não deve injetar `write_file` nem comandos não-gated de bash no array de tools do harness.

## 6. Feedback de Especificação
- **DERIVADO**: Handler DI e Envelope orquestrador obtidos do contrato de transição declarada aprovado em `docs/adr/0014-contrato-orquestrador-declarativo.md` (DMM-01).

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-01` (ainda em `draft:pending_decision` — spike do contrato). §3 marca
  `[CREATE] definição do nó Explorer (harness read-only + maxSteps baixo) + transição crushToCsv` —
  "transição crushToCsv" é exatamente o **mecanismo de transição** que o ADR 0014 precisa fixar
  (sync vs async, payload routing, erro). Inventar como invocar a transição seria chute.
- **Capacidade:** `sonnet` já no frontmatter — composição de harness+fs-tools+crushToCsv via
  contrato, é mecânica quando o contrato existe.
- **Pendente p/ pass-2 (JIT após DMM-01 → done):** assinatura TS exata do nó (harness com
  `maxSteps` + system prompt restrito a leitura), path do template, casos enumerados:
  (a) run stub com read-only garantido (escrita bloqueada via plugin-fs-tools gating);
  (b) saída bruta passa por `crushToCsv` (transição declarada) com asserta de CSV denso;
  (c) nenhuma chamada de write detectada no run.
- **RAG a citar em pass-2:** `packages/plugin-agent-harness/src/runner.ts` (já lido em T-702
  context — `run` recebe `{ prompt, system, tools, maxSteps, onEvent }`, retorna `AsyncIterable<RunnerEvent>`).
  Verificar em pass-2 que a assinatura atual bate com o que o nó vai montar.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Nó Explorer roda read-only, saída passa por crushToCsv via transição declarada.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
pnpm --filter @plataforma/plugin-agent-harness test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Nó Explorer: `createExplorerHandler` em `packages/plugin-workflows/src/nodes/explorer.ts` — factory que recebe `run` (harness) + `tools` (só readFile+bash) + `model` via DI. System prompt inclui "MODO READ-ONLY". maxSteps default 5.
- Testes `poc/explorer.poc.test.ts` (3 casos): stub read-only → CSV denso, sistema read-only implícito, raw não-JSON preservado.
- Gate:
```
$ pnpm --filter @plataforma/plugin-workflows build
$ tsc (Exit 0)
$ pnpm --filter @plataforma/plugin-workflows test
✓ poc/chain.poc.test.ts (1 test)
✓ poc/explorer.poc.test.ts (3 tests)
 Test Files  2 passed | Tests  4 passed
$ pnpm --filter @plataforma/plugin-agent-harness test
✓ tests/monitor.test.ts (6 tests)
✓ tests/runner.test.ts (6 tests)
 Test Files  2 passed | Tests  12 passed
$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/ (Exit 0)
```

**Rework [M1][M2] (deepseek, 2026-07-09):**
- `RunContract` alinhado ao `RunOptions` real: removido `system` (harness real só tem `prompt`), retorno `{exit, timedOut, tail}` sem `text`; output capturado via `onEvent('done').text`.
- System prompt concatenado no `prompt` em vez de campo `system` inexistente.
- Tipos precisos: `PluginTools`, `LanguageModel`, `AgentEvent` importados dos pacotes reais.
- `package.json`: adicionados `@plataforma/plugin-agent-harness`, `@plataforma/plugin-fs-tools`, `ai` como devDeps.
- Testes: 5 casos (eram 3). Stub emite `done` via `onEvent`; novo caso tail-fallback.
- Gate:
```
$ pnpm --filter @plataforma/plugin-workflows build
$ tsc (Exit 0)
$ pnpm --filter @plataforma/plugin-workflows test
✓ poc/chain.poc.test.ts (1 test)
✓ poc/explorer.poc.test.ts (4 tests)
 Test Files  2 passed | Tests  5 passed
$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/ (Exit 0)
$ pnpm --filter @plataforma/plugin-agent-harness test
✓ tests/monitor.test.ts (6 tests)
✓ tests/runner.test.ts (6 tests)
 Test Files  2 passed | Tests  12 passed
```
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Revisor:** `agile_reviewer:claude-sonnet` (1ª revisão independente)
- **Data:** 2026-07-09

**QA REPORT — DMM-04 — Nó Explorer (Estágio 3)**
```
Data: 2026-07-09  |  Revisor: agile_reviewer (claude-sonnet)
Spec consultada: tasks/DMM-04.md §1–7  |  Arquivos auditados: 4 (3 created + 1 modified)
Testes: 4 + 12 = 16 rodados · 16 passaram · 0 falharam
tsc: OK (0 erros)  |  lint: OK (0 erros)

Evidência de Execução
─────────────────────
$ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows test
$ vitest run
 ✓ poc/explorer.poc.test.ts (3 tests) 6ms
 ✓ poc/chain.poc.test.ts   (1 test)   310ms

 Test Files  2 passed (2)
      Tests  4 passed (4)
   Start at  13:56:34
   Duration  2.68s

$ pnpm --filter @plataforma/plugin-agent-harness test
$ vitest run
 ✓ tests/monitor.test.ts (6 tests) 15ms
 ✓ tests/runner.test.ts  (6 tests) 433ms

 Test Files  2 passed (2)
      Tests  12 passed (12)
   Start at  13:56:39
   Duration  979ms
```

BLOCKER (0) / MAJOR (2) / MINOR (3) / INFO (5)
──────────────────────────────────────────────
**MAJOR**
`[M1]` `packages/plugin-workflows/src/nodes/explorer.ts:4-14` — Contract drift
entre `RunContract` (local) e o `RunOptions` real de
`packages/plugin-agent-harness/src/types.ts:19-30`.
  Evidência:
  - `RunContract` declara `system?: string` (linha 9), `text?: string` no
    retorno (linha 13). O real `RunOptions` **NÃO** tem campo `system` —
    `runner.ts:101` usa só `prompt` como input de `generateText`. O real
    `AgentRunResult` (types.ts:4-8) é `{ exit, timedOut, tail }` — **sem
    `text`**.
  - `explorer.ts:63` passa `system` ao `run()`, mas a assinatura real ignora;
    o system prompt restriction ("MODO READ-ONLY") é silenciosamente DROPADO
    quando o Explorer for wired ao `run` real de `plugin-agent-harness`.
  - `explorer.ts:74` lê `result.text || result.tail || ""`; com o harness
    real, `result.text` é `undefined` e o handler SEMPRE recebe o `tail`
    (transcript com `[step] tools=...`), nunca o output textual do modelo.
  Viola: §1 ("system prompt restrito a **leitura**" — não garantido quando
  wired ao real) e §3 (`[READ] packages/plugin-agent-harness/src/runner.ts`
  — a assinatura lida diverge do que o handler supõe).
  Ação: (a) alinhar `RunContract` ao `RunOptions` real (remover `system`,
    tipar `tools: PluginTools`, `model: LanguageModel`); (b) reescrever
    `createExplorerHandler` para emitir `system` via prompt (concatenando
    ou via `onEvent` para enviar a restrição antes de cada step); (c)
    decidir se o handler usa `onEvent` para capturar o `done.text` (única
    forma de obter o output do modelo no harness real) ou documenta que
    o handler consome só `tail` como output bruto.
  **Alternativa mais simples:** o handler pode simplesmente passar o
  system prompt como prefixo do `prompt` (concatenado), eliminando o
  campo `system` por completo — funciona com o harness real sem alterar
  a interface.

`[M2]` `packages/plugin-workflows/src/nodes/explorer.ts:9, 13, 12, 21` —
Tipos permissivos demais mascaram o contract drift de `[M1]`.
  Evidência: `RunContract.tools: Record<string, unknown>` e
  `model: unknown` são mais largos que `RunOptions.tools: PluginTools` e
  `model: LanguageModel`. Em runtime + tipagem, o caller pode injetar
  qualquer coisa e o TypeScript não reclama — o handler não tem como
  detectar contract drift.
  Viola: §3 (a interface `RunContract` deveria ser o "sub-shape do que o
  Explorer consome" do real `RunOptions`, não uma redefinição permissiva).
  Ação: importar `PluginTools` de `@plataforma/plugin-fs-tools` e
  `LanguageModel` de `'ai'`; usar `Pick<RunOptions, 'taskId' | 'model' |
  'cwd' | 'prompt' | 'maxSteps' | 'tools'>` como base. (Subordinado a
  [M1] — só faz sentido corrigir os dois juntos.)

**MINOR**
`[m1]` `packages/plugin-workflows/src/nodes/index.ts` (novo, 3 linhas) —
criado mas não declarado em spec §3. Consistente com o padrão
`src/nodes/architect/index.ts` (DMM-03) e necessário para o barrel de
`src/index.ts:15`. Não-bloqueante, mas track: declarar `[CREATE]
src/nodes/index.ts` no reendurecimento de §3 (mesma omissão de
DMM-03 m1).
`packages/plugin-workflows/src/nodes/index.ts:1-3` vs §3.

`[m2]` Spec drift — §6 linha 67 afirma que `run` retorna
`AsyncIterable<RunnerEvent>`, mas a assinatura real
(`packages/plugin-agent-harness/src/types.ts:4-8` + `runner.ts:83`) é
`Promise<AgentRunResult>` com eventos emitidos via `onEvent` callback.
  Ação: reendurecer §6 (1 linha) para alinhar com a assinatura real.
  Track: cleanup plugin-workflows spec.

`[m3]` `poc/explorer.poc.test.ts:139` — caso "raw não-JSON" cobre texto
literário, mas não cobre `raw: ""` (string vazia). Quando
`result.text || result.tail || ""` produz `""` (harness sem output), o
decider ainda chama `crushToCsv("")` (condição `env.raw !== undefined` é
`true` para `""`). `crushToCsv("")` pode devolver `""` ou um CSV de
cabeçalho — comportamento não documentado.
  Ação: adicionar `it("raw vazio não quebra — crushToCsv devolve string
  vazia ou cabeçalho")` com 1 asserção de tipo. ~6 linhas.

**INFO**
`[i1]` Cobertura §4 está completa para os 3 casos exigidos:
  (a) read-only garantido: `explorer.poc.test.ts:15-18` assere
  `tools` não tem `writeFile`, tem `readFile` e `bash`.
  (b) saída passa por `crushToCsv`: `explorer.poc.test.ts:58` chama
  `crushToCsv(env.raw)`; `:69-73` assere CSV denso.
  (c) nenhum write detectado: `explorer.poc.test.ts:64` assere
  `stubRun` chamado exatamente 1 vez. ✅

`[i2]` Decoupling pattern OK: `explorer.ts:1-2` importa só tipos locais
de `../types.js`. Sem import de `plugin-agent-harness` nem
`plugin-fs-tools` — caller injeta `run` + `tools` por DI. Alinhado com
ADR 0013 §3 (DI do provedor).

`[i3]` Gate 5.1.1 (wiring) OK: caller de produção ainda não existe
(próprio teste). Integração downstream **DMM-06** linkada no
frontmatter `blocks: ["DMM-06"]` (DMM-06 ainda em `draft:triaged`,
será o caller real — e justamente é onde a contract drift de [M1] vai
se manifestar). Por isso [M1] é MAJOR e não MINOR.

`[i4]` Acoplamento (Gate 5.1.2): zero import cross-package em
`explorer.ts` (apenas `../types.js` local). Zero ciclo.

`[i5]` `package.json` não modificado (vs DMM-03 que adicionou 1 linha).
Escopo §3 respeitado no nível de dependências.

VEREDICTO: REFATORAÇÃO NECESSÁRIA
Resumo: Gate triplo verde (16/16 testes, tsc/lint limpos), DoD §7
atendido na superfície (3 testes verdes, READ-ONLY asserted), MAS o
`RunContract` diverge do `RunOptions` real em 2 pontos
(bloqueante-de-fato: campo `system` dropado, `text` no retorno
inexistente). O system prompt restriction que garante read-only é
silenciosamente descartado quando o handler for wired ao `run` real de
`plugin-agent-harness` — exatamente o cenário de produção via DMM-06.
3 MINORs são housekeeping (scope declaration, spec drift, edge case
de string vazia).
```

**Comentários de Revisão:** Achado bloqueante é `[M1]` — o
`RunContract` é uma reescrita permissiva que não bate com a interface
real do `plugin-agent-harness.run`. O stub passa os testes porque mocka
o `run`; o handler real (a ser wired por DMM-06) vai descartar o
system prompt e nunca ver o output textual do modelo. Corrigir o
contract E o uso do `system` é pré-condição para a integração DMM-06.
Os 3 MINORs são endurecimento opcional mas recomendado.

### Parecer do Reviewer 2 (claude-sonnet, independente — pós-rework):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Revisor:** `agile_reviewer:claude-sonnet` (Reviewer 2; 1ª revisão foi `agile_reviewer:claude-sonnet` R1 em 2026-07-09T16:58, mesmo modelo — mas sessão independente).
- **Data:** 2026-07-09
- **Anti-ancoragem:** veredito formado a partir da spec + código + Gate + sondas **antes** de reler o parecer R1 linha-a-linha. O parecer R1 só foi comparado após a conclusão do meu veredito.

**QA REPORT — DMM-04 (rework) — Nó Explorer (Estágio 3)**
```
Data: 2026-07-09  |  Revisor: agile_reviewer (claude-sonnet)
Spec consultada: tasks/DMM-04.md §1–7  |  Arquivos auditados: 5 (4 created + 1 modified) — branch tem 2 commits
Testes: 5 + 12 = 17 rodados · 17 passaram · 0 falharam
tsc: OK (0 erros)  |  lint: OK (0 erros)

Evidência de Execução
─────────────────────
$ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows test
$ vitest run
 ✓ poc/explorer.poc.test.ts (4 tests) 5ms
 ✓ poc/chain.poc.test.ts   (1 test)   174ms

 Test Files  2 passed (2)
      Tests  5 passed (5)
   Start at  14:35:21
   Duration  983ms

$ pnpm --filter @plataforma/plugin-agent-harness test
$ vitest run
 ✓ tests/monitor.test.ts (6 tests) 19ms
 ✓ tests/runner.test.ts  (6 tests) 424ms

 Test Files  2 passed (2)
      Tests  12 passed (12)
   Start at  14:29:56
   Duration  958ms
```

Sonda adversarial
─────────────────
`poc/m1-rework.probe.test.ts` (redigido, executado, **REMOVIDO**) — 4 casos:
1. ✅ `done.text` (via onEvent) tem prioridade sobre `tail` — confirma
   que o rework captura corretamente o output do modelo real.
2. ✅ Stub NÃO recebe campo `system` (campo removido do contract) —
   recebe `prompt`, `onEvent`, etc.
3. ✅ `systemPrompt` é concatenado no `prompt` junto com a read-only
   restriction "MODO READ-ONLY".
4. ✅ `tools` chega ao stub sem `writeFile` (PluginTools é respeitado).

`src/nodes/explorer/_contract-check.ts` (redigido, **REMOVIDO**) — sonda
de TIPO em build time: `const _: typeof realRun = null as RunContract`
+ `const _2: RunContract = null as typeof realRun` — **AMBAS FALHARAM
em tsc** com os erros:
```
error TS2322: Type 'RunContract' is not assignable to type
  '(opts: RunOptions) => Promise<AgentRunResult>'.
  Types of property 'model' are incompatible.
    Type 'LanguageModelV1' is not assignable to type 'LanguageModel'.
      Type 'string' is not assignable to type 'LanguageModelV1'.
```

**Causa raiz:** `plugin-workflows/package.json` adicionou `"ai": "^4.1.0"`,
mas `plugin-agent-harness` resolve transitivamente para `ai@7.0.15`.
- Em `ai@4.1.0`: `type LanguageModel = LanguageModelV1` (alias puro).
- Em `ai@7.0.15`: `type LanguageModel = LanguageModelV1 | V2 | V3 | V4 | string`
  (união ampla).
- `RunOptions.model: LanguageModel` em `agent-harness/types.ts:21` resolve
  para a união do v7.0.15.
- `RunContract.model: LanguageModel` em `explorer.ts:12` resolve para
  o V1 do v4.1.0.
- Por contravariância, `RunContract` exige um `LanguageModelV1` puro,
  mas `RunOptions` aceita a união ampla — assignment falha em ambos
  os sentidos.

**Confirmação: [M1] do R1 está PARCIALMENTE corrigido.** O rework
resolveu o bug de runtime (system prompt dropado + output nunca visto)
**integralmente**, mas introduziu um **novo** bug de type-level: a versão
do pacote `ai` está desalinhada com a do `plugin-agent-harness`. O R1
sugeriu explicitamente `Pick<RunOptions, 'taskId' | 'model' | 'cwd' |
'prompt' | 'maxSteps' | 'tools'>` (que derivaria os tipos do real
`RunOptions` e captaria a versão correta); o worker escolheu tipar
manualmente com `ai@^4.1.0`, perdendo o alinhamento.

BLOCKER (0) / MAJOR (1 residual) / MINOR (3 herdados) / INFO (5)
──────────────────────────────────────────────────────────────
**MAJOR**
`[M1]ᵣ` `packages/plugin-workflows/package.json:20` + `explorer.ts:12` —
Type-level contract drift por **versão desalinhada do `ai` SDK**.
  Evidência: `plugin-workflows` adicionou `"ai": "^4.1.0"` (devDep) na
  rework, mas `plugin-agent-harness` resolve `ai@7.0.15`
  transitivamente. O `LanguageModel` em cada versão tem semântica
  diferente:
    - `ai@4.1.0`: `type LanguageModel = LanguageModelV1` (alias puro)
    - `ai@7.0.15`: `type LanguageModel = LanguageModelV1 | V2 | V3 | V4 | string`
  A sonda de tipo em build time (`_contract-check.ts`) confirma que
  `RunContract` e `RunOptions` NÃO são estruturalmente compatíveis
  (assignment falha em ambos sentidos, especificamente no campo `model`).
  Viola: §1 (a integração DMM-06) + §3 (`[READ] plugin-agent-harness/
  src/runner.ts` — assinatura lida diverge do que o handler tipa).
  Diferente do R1 [M1] (que era runtime — system prompt dropado), este
  M1 é **build-time**: o caller (DMM-06) que tentar fazer
  `createExplorerHandler({ run: realRun, ... })` sem `as any` ou cast
  recebe erro de TypeScript. Pior caso: cast silencioso que perpetua
  o drift.
  Ação (1 das 3):
  - **(a) RECOMENDADO** — reescrever `RunContract` como
    `Pick<RunOptions, 'taskId' | 'model' | 'cwd' | 'prompt' | 'maxSteps' |
    'tools' | 'onEvent'>` e reusar o `AgentRunResult` como retorno. Garante
    alinhamento permanente mesmo se `RunOptions` evoluir.
  - (b) Upgrade `ai` para `^7.0.15` em `plugin-workflows/package.json`
    (match com plugin-agent-harness) + reavaliar se `LanguageModel`
    ainda é a melhor escolha.
  - (c) Importar `LanguageModelV1` diretamente de `'ai'` (assume que
    v7 mantém o nome V1).
  O R1 já tinha sugerido (a) como caminho. O worker escolheu o caminho
  manual (importar `LanguageModel` de `ai`) e introduziu a versão skew.

**MINOR (herdados do R1, NÃO corrigidos no rework — esperado, fora de escopo)**
`[m1]` `packages/plugin-workflows/src/nodes/index.ts` (3 linhas)
  criado mas não declarado em spec §3. Mesmo padrão dos DMM-02/03/04
  R1. Track: declarar `[CREATE] src/nodes/index.ts` no reendurecimento
  de §3 (mesma omissão de DMM-03 m1).

`[m2]` Spec drift — §6 linha 67 afirma que `run` retorna
  `AsyncIterable<RunnerEvent>`, mas a assinatura real é
  `Promise<AgentRunResult>` com `onEvent` callback. Track:
  reendurecer §6 (1 linha).

`[m3]` `poc/explorer.poc.test.ts:121-150` (caso "raw não-JSON")
  cobre texto literário, mas não cobre `raw: ""` (string vazia). O
  test 4 do rework (lines 152-183) cobre o tail-fallback mas não o
  edge case de string vazia. ~6 linhas adicionais.

**INFO (herdados do R1)**
`[i1]` Cobertura §4 completa para os 3 casos exigidos (READ-ONLY,
  crushToCsv, no-write) + 1 caso novo de tail-fallback. DoD §7
  atendida.

`[i2]` `explorer.ts:1-3` agora importa tipos precisos dos pacotes
  reais (`PluginTools`, `LanguageModel`, `AgentEvent`). Bom — **mas**
  a versão de `ai` está desalinhada (ver [M1]ᵣ).

`[i3]` Decoupling preservado: `explorer.ts` ainda não importa o
  `run` diretamente — caller injeta por DI. ✅

`[i4]` Acoplamento (Gate 5.1.2): 3 imports cross-package, todos
  type-only (`PluginTools`, `LanguageModel`, `AgentEvent`). Zero
  ciclo. Consistente com a direção declarada.

`[i5]` Gate 5.1.1 (wiring) OK: caller de produção ainda não existe.
  Integração downstream **DMM-06** linkada em `blocks: ["DMM-06"]`
  (DMM-06 ainda em `draft:triaged`, será o caller real — e é
  exatamente onde o [M1]ᵣ se manifestaria em build time).

VEREDICTO: REFATORAÇÃO NECESSÁRIA
Resumo: O rework de deepseek (commit `423d90c`) resolveu **90% do
[M1] do R1** — runtime: system prompt concatenado em `prompt`,
output capturado via `onEvent('done').text`, retorno correto `{exit,
timedOut, tail}` sem `text`. **MAS** introduziu um **novo** drift
type-level: o `ai@^4.1.0` adicionado em `package.json` está
desalinhado com o `ai@7.0.15` que o `plugin-agent-harness` resolve
transitivamente. A sonda de tipo em build time confirma
incompatibilidade estrutural entre `RunContract.model` e
`RunOptions.model`. O R1 sugeriu explicitamente `Pick<RunOptions, ...>`
que evitaria o problema derivando os tipos da fonte canônica. O
caller real (DMM-06) vai pegar este drift em build time com erro de
TypeScript. 1 MAJOR residual + 3 MINORs herdados (não-bloqueantes,
fora de escopo) + 5 INFO. Recomendo **mais um passe de rework**:
aplicar opção (a) do [M1]ᵣ (`Pick<RunOptions, ...>`) para garantir
alinhamento permanente.
```

**Comentários de Revisão (R2):** Divergência parcial do parecer R1 —
claude-sonnet R1 marcou **Requer Refatoração** com 2 MAJORs (contract
drift). O rework de 2026-07-09T17:09 (deepseek) **resolveu o runtime
inteiramente** ([M1] runtime: system prompt dropado, output nunca
visto) mas **introduziu um novo drift type-level** ([M1]ᵣ) que
sondas de runtime (4 probes que rodei) não conseguem detectar — só
um type-check de build time pega. É um caso claro de "parece 100%
resolvido mas tem 10% residual escondido". Os 3 MINORs + 5 INFO
herdados do R1 são housekeeping não-bloqueante. Recomendo
**mais um passe de rework** aplicando a sugestão (a) do R1
explicitamente (`Pick<RunOptions, ...>`) que teria pego o problema
em compile-time sem precisar de sonda.

### Parecer do Reviewer 3 (claude-sonnet, independente — pós-rework R2→R3):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Revisor:** `agile_reviewer:claude-sonnet` (Reviewer 3; chain: R1 16:58 → R2 17:36 → R3 agora. Modelos: claude-sonnet, claude-sonnet, claude-sonnet — mesmo modelo nas 3 sessões, mas sessões independentes).
- **Data:** 2026-07-09
- **Anti-ancoragem:** veredito formado a partir da spec + código + Gate + sondas **antes** de reler R1/R2. Comparação só após meu veredito.

**QA REPORT — DMM-04 (rework R2→R3) — Nó Explorer (Estágio 3)**
```
Data: 2026-07-09  |  Revisor: agile_reviewer (claude-sonnet)
Spec consultada: tasks/DMM-04.md §1–7  |  Arquivos auditados: 5 (4 created + 1 modified) — branch tem 3 commits
Testes: 5 + 12 = 17 rodados · 17 passaram · 0 falharam
tsc: OK (0 erros)  |  lint: OK (0 erros)

Evidência de Execução
─────────────────────
$ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows test
$ vitest run
 ✓ poc/explorer.poc.test.ts (4 tests) 6ms
 ✓ poc/chain.poc.test.ts   (1 test)   267ms

 Test Files  2 passed (2)
      Tests  5 passed (5)
   Start at  14:46:10
   Duration  3.34s

$ pnpm --filter @plataforma/plugin-agent-harness test
$ vitest run
 ✓ tests/monitor.test.ts (6 tests) 18ms
 ✓ tests/runner.test.ts  (6 tests) 424ms

 Test Files  2 passed (2)
      Tests  12 passed (12)
   Start at  14:46:15
   Duration  979ms

Sonda adversarial de tipo (R3)
──────────────────────────────
`src/_contract-check-r3.probe.ts` (redigido, executado, **REMOVIDO**) —
réplica exata do probe que o R2 usou para detectar [M1]ᵣ:
1. `const realRun: (opts: RunOptions) => Promise<AgentRunResult>
     = null as unknown as RunContract;`           ✅ compila
2. `const contract: RunContract
     = null as unknown as (opts: RunOptions) => Promise<AgentRunResult>;`
                                                  ✅ compila

**Veredito do probe:** assignment em AMBOS os sentidos sem erro de tsc.
RunContract e o run() real do plugin-agent-harness são estruturalmente
idênticos. Drift type-level [M1]ᵣ **FECHADO**. Probe deletado após
verificação (não polui o deliverable).
```

**Análise do código (R3):**
- `RunContract` agora é **derivado** de `RunOptions` via `Pick` (L7 explorer.ts):
  ```ts
  export type RunContract = (opts: Pick<RunOptions,
    'taskId' | 'model' | 'cwd' | 'prompt' | 'maxSteps' | 'tools' | 'onEvent'
  >) => Promise<AgentRunResult>;
  ```
  Sugestão (a) do R2 seguida à risca. `AgentRunResult` reusado como retorno
  (fonte canônica do harness).
- `model: RunOptions['model']` (L14) — em vez de `model: LanguageModel` importado
  de `'ai'`, deriva do real `RunOptions` (que resolve para a versão do `ai`
  que o `plugin-agent-harness` resolve — elimina skew de versão por construção).
- `plugin-workflows/package.json` (R3): `"ai"` REMOVIDO. Mantidos
  `@plataforma/plugin-agent-harness` + `@plataforma/plugin-fs-tools` + zen-engine +
  context (4 workspace deps).
- `explorer.ts:53-65` — `run()` chamado com `taskId, model, cwd, maxSteps, tools,
  onEvent` + `prompt` (system prompt concatenado). Nada de `system`. Output
  capturado em `doneText` via `onEvent('done')` com fallback para `result.tail`.
- `explorer.ts:67-71` — retorno `{raw: doneText || result.tail || "", exit, timedOut}`
  bate com `AgentRunResult` (sem campo `text` inexistente).
- Cobertura §4 completa: read-only (test 1, assere `tools` sem `writeFile`),
  crushToCsv (test 2, chama `crushToCsv(env.raw)`), no-write (test 3, assere
  `stubRun` chamado 1×). + tail-fallback (test 4, cobre caso `done.text`
  ausente → fallback para `tail`).

BLOCKER (0) / MAJOR (0) / MINOR (3 herdados) / INFO (3 novos + 5 herdados = 8)
────────────────────────────────────────────────────────────────────────────
**MINOR (herdados de R1/R2, fora de escopo da rework R2→R3 — esperado)**
`[m1]` `packages/plugin-workflows/src/nodes/index.ts` (2 linhas, R3) criado
  mas não declarado em spec §3. Mesmo padrão dos DMM-02/03/04. Track:
  declarar `[CREATE] src/nodes/index.ts` no reendurecimento de §3.
`[m2]` Spec drift — §6 linha 67 afirma que `run` retorna
  `AsyncIterable<RunnerEvent>`, mas a assinatura real é
  `Promise<AgentRunResult>` com `onEvent` callback. Track: reendurecer §6.
`[m3]` `poc/explorer.poc.test.ts` — caso `raw: ""` (string vazia) não
  coberto. Quando `doneText=undefined` E `result.tail=""` (harness
  sem output), handler devolve `raw: ""` que `crushToCsv("")` pode
  devolver `""` ou cabeçalho — comportamento não documentado. ~6 linhas.

**INFO (R3 — novos)**
`[i1-r3]` **[M1]ᵣ do R2 FECHADO.** O probe de tipo em build time
  (réplica do que R2 usou para detectar o drift) agora compila sem
  erro. `RunContract` e `typeof realRun` são estruturalmente
  equivalentes em ambos os sentidos. Recomendar `Pick<RunOptions, ...>`
  foi a decisão certa: deriva tipos da fonte canônica e fica imune a
  evolução futura de `RunOptions`.

`[i2-r3]` Decoupling preservado: `explorer.ts` ainda não importa
  `run` diretamente — caller injeta por DI. `AgentEvent` importado
  de `@plataforma/plugin-agent-harness` (não de `'ai'`), mantém
  alinhamento automático com a versão resolvida.

`[i3-r3]` `package.json` cleanup: `"ai": "^4.1.0"` REMOVIDO. Sem
  dependência direta da SDK instável, o `plugin-workflows` deriva
  tudo do `plugin-agent-harness` que é o proprietário canônico.

**INFO (herdados de R1/R2)**
`[i1]` Cobertura §4 completa para os 3 casos exigidos (READ-ONLY,
  crushToCsv, no-write) + 1 caso novo de tail-fallback. DoD §7
  atendida.
`[i2]` Decoupling pattern OK: `explorer.ts` importa só tipos via
  contratos. Sem import de `run` nem `tools` em runtime — caller
  injeta. Alinhado com ADR 0013 §3 (DI do provedor).
`[i3]` Gate 5.1.1 (wiring) OK: caller de produção ainda não existe
  (próprio teste). Integração downstream **DMM-06** linkada em
  `blocks: ["DMM-06"]` (DMM-06 ainda em `draft:triaged`).
`[i4]` Acoplamento (Gate 5.1.2): 4 imports cross-package, todos
  type-only (`PluginTools`, `LanguageModel` re-derivado via
  `RunOptions['model']`, `AgentEvent`, `RunOptions`,
  `AgentRunResult`). Zero ciclo. Consistente com a direção declarada.
`[i5]` `poc/explorer.poc.test.ts` cobre o caso onde
  `onEvent('done')` chega E onde NÃO chega (fallback `tail`).

VEREDICTO: **APROVADO**
Resumo: O rework R2→R3 (commit `30be7fa` por deepseek) **fechou
definitivamente o [M1]ᵣ** do R2. `RunContract` agora é derivado de
`Pick<RunOptions, ...>` (sugestão (a) do R2 seguida à risca) e o
import direto de `'ai'` foi removido — `model: RunOptions['model']`
deriva o tipo do harness real, eliminando o skew de versão por
construção. Probe adversarial de tipo (réplica exata do R2) compila
sem erros. Gate triplo verde (17/17 testes, tsc/lint limpos). Os 3
MINORs herdados são housekeeping (declaração de barrel em §3, spec
drift de §6, edge case de string vazia) — não-bloqueantes e
explicitamente fora de escopo do rework. R3 fecha o ciclo de 3
revisões para esta task; **recomendo merge + approve**.
```

**Comentários de Revisão (R3):** Comparando com R1/R2:
- R1 (16:58) marcou 2 MAJORs (contract drift runtime).
- R2 (17:36) marcou 1 MAJOR residual (type-level drift por `ai` SDK
  versão skew). R2 deixou a recomendação clara: `Pick<RunOptions, ...>`
  + remover import de `'ai'`.
- R3 (agora): o worker (deepseek, commit `30be7fa` 14:43) seguiu
  a recomendação R2 à risca. Probe adversarial de tipo (réplica
  exata do que R2 usou para detectar o problema) agora compila
  **sem erro**. Drift eliminado por construção, não por cast. 5/5
  + 12/12 testes verdes. Gate triplo limpo. **3 MINORs herdados**
  são housekeeping conhecido (mesmos m1, m2, m3 de R1/R2) e
  explicitamente fora de escopo desta rework.

Chain de revisões: R1 → rework → R2 → rework → R3 ✅. Os 3 MINORs
herdados são candidatos óbvios a um `cleanup` futuro (agrupar m1/m2/m3
de DMM-02/03/04 num único C-NN).

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T18:38]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-01 ainda draft:pending_decision; reendurecer JIT após spike
- **[2026-07-09T12:21]** - *Antigravity* - `[Endurecido]`: Endureceu spec com assinaturas de DMM-01
- **[2026-07-09T12:21]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-09T16:46]** - *deepseek* - `[Iniciado]`: iniciando
- **[2026-07-09T16:52]** - *deepseek* - `[Finalizado]`: Explorer handler factory + testes: 4/4 plugin-workflows, 12/12 plugin-agent-harness. Build + lint limpos.
- **[2026-07-09T16:55]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando
- **[2026-07-09T16:58]** - *agile_reviewer:claude-sonnet* - `[Requer Refatoração]`: Rework: [M1] RunContract diverge do RunOptions real de plugin-agent-harness (system dropado, text no retorno inexistente — silenciosamente quebra read-only e captura o output errado quando wired via DMM-06); [M2] tipos permissivos (tools: Record, model: unknown) mascaram o drift. Alinhar RunContract ao RunOptions real + emitir system via prompt concatenado (ou via onEvent capturando done.text). Não-bloqueantes [m1, m2, m3, i1-i5] → ledger. Gate triplo (tsc/lint/test) verde na re-submissão. (1ª revisão independente; reviewer: claude-sonnet)
- **[2026-07-09T17:05]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1+M2 (RunContract alinhar ao RunOptions real, system→prompt, result tipagem)
- **[2026-07-09T17:09]** - *deepseek* - `[Finalizado]`: rework pronto: [M1][M2] corrigidos — RunContract alinhado ao RunOptions real (system→prompt, onEvent('done').text). Tipos: PluginTools, LanguageModel, AgentEvent. 5/5 tests, build + lint limpos.
- **[2026-07-09T17:29]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando 2 (post-rework independente; reviewer anterior: claude-sonnet R1)
- **[2026-07-09T17:36]** - *agile_reviewer:claude-sonnet* - `[Requer Refatoração]`: Rework: [M1] residual type-level contract drift por versão desalinhada do ai SDK (R1 resolveu runtime mas sonda de tipo em build time pega: plugin-workflows package.json adicionou ai@^4.1.0, mas plugin-agent-harness resolve ai@7.0.15 transitivamente; LanguageModel tem semântica diferente em cada versão, RunContract.model ≠ RunOptions.model por contravariância; caller DMM-06 que tentar createExplorerHandler({ run: realRun }) sem cast recebe erro TS). Ação: aplicar (a) Pick<RunOptions, 'taskId' | 'model' | 'cwd' | 'prompt' | 'maxSteps' | 'tools' | 'onEvent'> + reusar AgentRunResult — sugestão R1 não seguida. Não-bloqueantes [m1, m2, m3, i1-i5] herdados do R1; [i6, i7, i8] atualizações. Gate triplo (tsc/lint/test) verde na re-submissão. (R2 independente; reviewer: claude-sonnet)
- **[2026-07-09T17:40]** - *deepseek* - `[Iniciado]`: rework R2: corrigindo [M1]ᵣ — type-level drift (ai SDK versão desalinhada)
- **[2026-07-09T17:43]** - *deepseek* - `[Finalizado]`: rework R2: [M1]ᵣ corrigido — RunContract derivado de Pick<RunOptions,...>, AgentRunResult como retorno, ai removido. 5/5 + 12/12 testes, build + lint limpos.
- **[2026-07-09T17:44]** - *agile_reviewer:test* - `[Em revisão]`
- **[2026-07-09T17:54]** - *agile_reviewer:claude-sonnet* - `[Aprovado]`: Integrado: merge na master (commit a1b7cbb), worktree removida, Gate verde pós-merge (tsc 0 erros, lint 0 erros, 18/18 plugin-workflows tests passed, 12/12 plugin-agent-harness tests passed). 3 MINORs + 7 INFOs → ledger de pendências (m1, m2, m3 herdados; i1-r3/i2-r3/i3-r3 fechamento [M1]ᵣ; i4 chain R1→R2→R3). Conflitos resolvidos: src/index.ts (combine exports), package.json (5 deps), pnpm-lock (ours + pnpm install).
