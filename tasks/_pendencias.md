# Ledger de Pendências (não-bloqueantes)

> Achados **não-bloqueantes** (MAJOR/MINOR/INFO) que reviewers encontraram mas que **não**
> impedem o merge. Em vez de virarem tasks `-followup` (que poluem a fila), acumulam aqui.
> Periodicamente, `/agrupar-cleanup` agrupa por área, gera **uma** task de cleanup e remove as
> linhas consumidas. **Não edite à mão durante review** — o `integrar-task`/`qa-review --integrar`
> anexa automaticamente ao mover a task para `done`.

Formato: `- [ ] [severidade][T-XXX][pacote/área] achado — referência (arquivo:linha ou seção)`
Severidade: `M` (major não-bloqueante) · `m` (minor) · `i` (info).

---

<!-- BEGIN PENDENCIAS -->
<!-- EST-63 -->
- [ ] [m1][EST-63][estaleiro-ui estaleiro-core.types] `ContentPart`/`TextContentPart`/`ImageContentPart` duplicados em `apps/estaleiro/ui/src/estaleiro-core.types.ts` ao lado do canônico em `apps/estaleiro/core/src/chat-service.ts` (re-exportado por core/index.ts). Header do arquivo UI já diz "replace it with a core chat-types export when that package is decomposed" — não foi decomposto no rework. Não-bloqueante: ChatView.tsx importa corretamente do core; a duplicação é inerte. Track: remover cópia do UI quando core tiver barrel de tipos (apps/estaleiro/ui/src/estaleiro-core.types.ts:9-21)
<!-- END EST-63 -->
<!-- EST-62 -->
- [ ] [m][EST-62][estaleiro-core integration] `tests/integration/chat-route.test.ts:101` falha com 502 em vez de 400 em teste pré-existente (sem API key) — candidato P-022 em PITFALLS, fora do escopo do plugin-lsp.
<!-- END EST-62 -->
<!-- EST-61 -->
- [ ] [M][EST-61][estaleiro-ui e2e] E2E não executado — M3 exige `pnpm --filter estaleiro test:e2e` para tasks `ui: true`; suite existente não cobre terminal output nem approval card para comandos arriscados. Adicionar testes E2E para run_command fg/bg + approval card (spec→T-61 ou follow-up separado).
- [ ] [M][EST-61][spec] AgentTerminal.tsx não atualizado — §3 declara `[UPDATE] view Terminal — streams de PTY do chat via mesmo fleetStore` mas o arquivo não tem alterações na branch. Validar com arquiteto se §3 está desatualizada (ChatView é o entry point correto para chat agêntico) ou se a implementação está incompleta.
- [ ] [m1][EST-61][plugin-terminal] `safeChunk` (index.ts:90) mede `chunk.length` em code units JS, não UTF-8 bytes — para output com acentos/chinês, 4000 code units ≈ 2000-8000 bytes reais. Ceiling aceitável para v1.
- [ ] [m2][EST-61][plugin-terminal/pty-runner] `shellWrap` Windows background via `Start-Job` não herda o PTY; output do job não alimenta o ring buffer do mesmo processo. Ceiling documentado no comentário (pty-runner.ts:76-77); v1 funcional para fg; bg Windows tem limitação conhecida.
- [ ] [i1][EST-61][plugin-terminal] Gate artifacts treeSha diverge de `git rev-parse HEAD^{tree}` — provável bug no gate tool (computa hash de forma diferente); branch limpa, HEAD = ca7b43c, tests passam. Investigar separadamente.
<!-- END EST-61 -->
- [ ] [m][EST-59][estaleiro-ui e2e] E2E caso 28 (modo agente) mocka /api/chat/agent — legítimo para E2E determinístico; o loop real está coberto no teste de integração headless. Sem ação necessária, registro.
- [ ] [m][EST-59][plugin-mcp manager] Dedup de chave redundante em manager.ts:107 (cosmético).
- [ ] [m][EST-58][estaleiro-ui ChatView] Hidratação de conversa descarta content-array e roles tool/system — resolver na EST-59 quando tool-messages passarem a existir (ChatView handleResumeConversation).
- [ ] [m][EST-58][estaleiro-core conversation-store] `seq` calculado com MAX(seq)+1 fora de transação — corrida só cross-process (irreal hoje); envolver em transação quando houver segundo escritor.
- [ ] [m][EST-58][gate] unit tests + lint do estaleiro-core não entram no gate do app `@plataforma/estaleiro` — avaliar incluir o core no pipeline do gate.
- [ ] [M][EST-49b][apps/estaleiro/ui ChatView] Casos de teste 4 e 5 do §4 (ocultação do seletor de esforço p/ modelo sem effortOptions; reset de effort ao trocar de modelo) nunca são exercidos apesar do fixture ter um modelo sem effortOptions — cobrir ao reabrir a task.
- [ ] [M][EST-49b][apps/estaleiro/ui ChatView] Textarea não é desabilitado quando `/api/models` falha ou retorna vazio (só o botão via clique); `handleKeyDown`/Enter não checam `canSend`, permitindo enviar com modelId vazio; falta mensagem de aviso textual (DoD §4 caso 6).
- [ ] [m][EST-49b][ChatClient.http.ts] `send()` tipa `effort` como `string` solto em vez de `"low"|"medium"|"high"` do contrato §3.1.
- [ ] [m][EST-49b][apps/estaleiro/package.json] Bump de versão 0.0.92→0.0.104 não explicado no handover (provável artefato de tooling).
<!-- P-EST-49b -->
- [ ] [M][C-20][@plataforma/plugin-knowledge] Artefato de gate stale na worktree: o `.gate/<tree>.json` commitado em `task/C-20` após o 1º commit (`8ec6aa9`) ficou stale após o 2º commit (`e90af59` — fix de NFD no search) e não foi regerado; o `finish` rodou contra a tree antiga. Re-rodar `pnpm gate <pkg>` antes do `finish` sempre que houver commit adicional na mesma task; idealmente o próprio `manage-task.mjs finish` deveria regerar o gate contra o `HEAD^{tree}` da branch, não aceitar artefato antigo.
<!-- P-01 -->
- [ ] [m1][P-01][superapp/processo] `tasks/.telemetry/` criado dentro do superapp para telemetria opcional — diretório não faz parte da estrutura do repo; sink real deve ser definido por P-02 (scripts/gate.mjs:70-80)
- [ ] [m2][P-01][controle] `tools/scripts/manage-task.mjs` reescrito quase inteiro (CRLF→LF + reformatação), dificultando review; alteração deveria ser mínima (tools/scripts/manage-task.mjs)
<!-- END P-01 -->
<!-- P-02 -->
- [x] [M1][P-02][controle] `telemetry.test.mjs` não cobre o path real do `root`... ✅ RESOLVIDO em rework: teste agora importa `lib/telemetry.mjs` real via `telemetry-test-helper.mjs` e verifica `tasks/.telemetry/<ID>.jsonl`. (tools/scripts/telemetry.test.mjs:61-98)
- [x] [M2][P-02][controle] `orquestrar.dispatch` e `fila.flush` sem `task`... ✅ RESOLVIDO em rework: eventos sem task caem em `_system.jsonl`. (tools/scripts/lib/telemetry.mjs:62)
<!-- END P-02 -->
<!-- P-04 -->
- [ ] [m1][P-04][controle] Testes de auto-resume usaram fixtures com status `in_progress`/`ready` e não exercitaram o fluxo real de `pause`/`block` nem o status `blocked` (tasks/P-04.md:80-84)
- [ ] [m2][P-04][controle] Sem sub-estado `in_progress:paused` na máquina de estados, o `pause` apenas loga a tag no §9 sem mudar o status — o filtro do hook pós-approve (B0) terá que usar heurística (ex.: mensagem recente com `[blocked-on:...]`) em vez de `status === 'paused'`. Decisão de implementação do rework, não bloqueante agora (spec §4 "Fora de Escopo")
- [ ] [m3][P-04][controle] Diff de tooling-do-controle mistura P-04 com P-05: o bloco `if (action === 'finish')` em `manage-task.mjs:19-53` (validação `.gate/<treeSha>.json`) pertence a P-05, não a P-04. Sem worktree separado, vai tudo no mesmo commit. Sem justificativa causal no handover — separar em commit próprio ou declarar `spec→P-05` no rework (tools/scripts/manage-task.mjs:19-53)
<!-- END P-04 -->
<!-- 009-02 -->
- [ ] [m1][009-02][core] spec §3 diz `[UPDATE] workflow-engine.ts` mas o arquivo não existia no master (era `A` no diff) — worker entregou como CREATE. Funcionalmente equivalente, sem impacto; registrado para rastreio
- [ ] [m1][009-02][core] `checkBlockingRules` exportado de `@plataforma/core` mas sem caller de produção ainda (Grep em `packages/*/src/**` retorna só a própria definição + teste). Integração com state machine de fato (ex.: `plugin-workflows` chamar pre-transition) fica para task de wiring futura
- [ ] [i1][009-02][core] branch `task/009-02` preservada em origin após merge (já integrado na master `753a58c`) — apagar via `git -C C:/Dev2026/superapp branch -D task/009-02` se desejado
<!-- END 009-02 -->
<!-- EST-35a -->
- [ ] [m1][EST-35a][estaleiro-ui] `package.json` version bump (0.0.39→0.0.40) fora do escopo declarado na §3 — não impacta funcionalidade, apenas registrar (apps/estaleiro/package.json)
- [ ] [i1][EST-35a][estaleiro-ui] Screenshot visual (1280×720) delegado pelo worker — E2E funcional passa sem regressão, verificação visual pendente (tasks/EST-35a.md:65)
<!-- END EST-35a -->
<!-- EST-36 -->
- [ ] [m1][EST-36][estaleiro-core] bootstrap.ts: seed é fire-and-forget (3× `void` encadeados). Tasks podem não estar disponíveis na primeira request — aceitável pois DB persiste entre boots (apps/estaleiro/core/src/bootstrap.ts:45-58)
- [ ] [m2][EST-36][estaleiro-core] `_storage` injection em seed.ts depende de API interna (`SqliteStorageBackend.saveTask`). Se o backend mudar, quebra. Spec-aware (§6) (apps/estaleiro/core/src/seed.ts:72-79)
- [ ] [i1][EST-36][estaleiro-core] `apps/estaleiro/package.json` version bump fora do §3 (cosmético)
<!-- END EST-36 -->
<!-- EST-35b -->
- [ ] [m1][EST-35b][estaleiro-ui] DecisionsView.tsx refatorado de JSX para `h()` — mudança além do escopo declarado na §3 ("UPDATE: rótulo"). Não quebra funcionalidade e padroniza com demais views (apps/estaleiro/ui/src/views/decisions/DecisionsView.tsx)
- [ ] [i1][EST-35b][estaleiro-ui] `apps/estaleiro/package.json` version bump (0.0.40→0.0.41) — cosmético, fora da §3
<!-- END EST-35b -->
<!-- EST-07 -->
- [ ] [i1][EST-07][plugin-dispatcher] Worker adicionou `@types/node` como devDep (Handover §8 linha 296) — nao declarado na spec §3. Track: alinhar spec §3 com a dep real ou remove-la (verificar se a suite compila sem) (packages/plugin-dispatcher/package.json:19)
- [ ] [i2][EST-07][plugin-dispatcher] `cwd` hardcoded em `dispatcher.ts:109-111` como `'C:\\Dev2026\\superapp'` / `'C:\\Dev2026\\Docs'`. Spec §3.5 replica o padrao do `orquestrar.mjs L147-149` (tambem hardcoda). Idealmente viriam de env ou config. Nao-bloqueante (consistente com o original) (packages/plugin-dispatcher/src/dispatcher.ts:109-111)
<!-- END EST-07 -->
<!-- EST-14a -->
<!-- Items i1→SPEC-PENDENCIAS, i2→SPEC-PENDENCIAS, i3→C-26 -->
<!-- END EST-14a -->
<!-- EST-13a -->
- [x] [i1][EST-13a][plugin-knowledge] `package.json` `exports` aponta para `./src/graph.ts` (TS source) em vez de `./dist/graph.js`. ✅ RESOLVIDO em EST-13c (commit `c643d73`): `exports: { ".": "./src/index.ts" }` agora aponta para o barrel que re-exporta `makeGraph` + `makeWriter` + tipos. (packages/plugin-knowledge/package.json:7-8)
- [ ] [i2][EST-13a][plugin-knowledge] `findMdFiles` faz recursao O(n) sequencial sobre o corpus. Para o wiki atual (centenas de paginas) e OKF incremental e aceitavel; se chegar a 10k+ arquivos, paralelizar. Track: re-medir quando corpus > 5k (packages/plugin-knowledge/src/graph.ts:88-101)
<!-- i3→SPEC-PENDENCIAS -->
<!-- END EST-13a -->
<!-- EST-13b -->
<!-- m1→SPEC-PENDENCIAS, m2→C-20, m3→SPEC-PENDENCIAS -->
- [x] [i1][EST-13b][plugin-knowledge] **M1 do parecer re-registrado: `package.json:7` `exports` field stale — apontava para `./src/graph.ts` em vez de `./src/index.ts`.** ✅ RESOLVIDO em EST-13c (commit `c643d73`): `exports` agora aponta para `./src/index.ts` (barrel) que re-exporta `makeGraph`+`makeFts`+`makeWriter`+tipos. Wire contract com EST-14d View Knowledge agora funcional. Mesmo padrão do `i1[EST-13a]` — fechado junto pela EST-13c. (packages/plugin-knowledge/package.json:7)
- [ ] [i2][EST-13b][plugin-knowledge] Implementação segue o pattern `makeFts`/`FtsIndexImpl` (factory + interface) consistente com `makeGraph` de EST-13a — sem inconsistência de estilo. INFO positivo (cobertura visual).
- [ ] [i3][EST-13b][plugin-knowledge/processo] Gate de evidência triplo (build+test+lint) aplicado e logado no 1º `finish` (Log §9 2026-07-07T13:31 deepseek). Após 3 reworks consecutivos por regressão de lint (T-807, EST-02b, EST-02c), ver o gate triplo no 1º commit é o comportamento esperado desde a regra de 2026-07-06. INFO positivo.
- [ ] [i4][EST-13b][plugin-knowledge] `signal.aborted` checado em 2 pontos (início do `buildIndex` + topo do loop por slug). Suficiente para corpus de centenas de páginas (RFC-018 E2). Para grafos com páginas gigantes indexadas, faria sentido checar a cada N iterações — não-bloqueante, track: re-medir se corpus > 5k páginas. (packages/plugin-knowledge/src/fts.ts:54,67)
<!-- i5→SPEC-PENDENCIAS, i6→C-20 -->
<!-- END EST-13b -->
<!-- EST-17 -->
<!-- i1→SPEC-PENDENCIAS, i2→C-27 -->
- [ ] [i3][EST-17][plugin-providers/processo] Handover §8 do worker (big-pickle) foi sucinto e direto (3 bullet points + gate de evidência colado). Gate de evidência triplo (build+test+lint) aplicado no 1º `finish` (Log §9 2026-07-07T14:14). Após 3 reworks consecutivos por regressão de lint (T-807, EST-02b, EST-02c), ver o gate triplo no 1º commit é o comportamento esperado desde a regra de 2026-07-06. INFO positivo (tasks/EST-17.md:165-193)
<!-- END EST-17 -->
> **Última drenagem (2026-07-06):** Itens EST-03b/c/d (C-18), EST-04a/b/c (C-19) movidos para cleanup plugin-tasks. T-1037 (ADR) movido ao SPEC-PENDENCIAS. Restam 2 itens não capturados: T-802 (media), T-1028 (scheduler).

- [ ] [m1][T-802][media] `!` non-null assertion no arquivo de teste — spec §5 proíbe `!` no geral (src está limpo); refatorar `reordered[0]!`/`tampered[0]!`/etc para guards (verifyReassemble.test.ts:53-55, 98, 147-151, 22)
- [ ] [i1][T-1028][scheduler] `RUNNABLE_STATUSES` usa `'draft'` (alias legado) — tipo `TaskStatus` ainda inclui, compila sem erro. Migração T-1030 substituirá por `'draft:placeholder'`; scheduler deve ser atualizado junto (scheduler.ts)
<!-- C-18 -->
<!-- i1→C-23, i2→C-23, i3→C-23 -->
- [ ] [i4][C-18][estaleiro/processo] **Handover S8 linha 73 diz "5/13 fixed, 5/13 no-op/defer, 3/13 ja resolvidos no merge"** mas a tabela abaixo lista 13/13 destinos. Categoria "3/13 ja resolvidos" nao e reconciliada - provavel erro de digitacao. Cosmetico. Nao-bloqueante (tasks/C-18.md:73 vs tasks/C-18.md:77-89)
<!-- END C-18 -->
<!-- C-19 -->
<!-- M1→SPEC-PENDENCIAS, M2→SPEC-PENDENCIAS, m1→SPEC-PENDENCIAS, i1→C-23, i2→C-23, i3→SPEC-PENDENCIAS -->
<!-- END C-19 -->
<!-- EST-05 -->
- [ ] [m][EST-05][plugin-fs-tools] Branch redundante `msg.includes("git write") || msg.includes("proibido")` em src/index.ts:82 — o port lança UMA string contendo ambos substrings, o `||` é defensivo contra futura mudança cosmética. Não-bloqueante; simplificar para `msg.includes("git write")` (alinhado à spec §1) (src/index.ts:82)
<!-- END EST-05 -->
<!-- C-16 -->
- [ ] [M1][C-16][estaleiro] **EST-01 m1 PARCIAL — `apps/estaleiro/ui/package.json:9` ainda tem `"test": "vitest run"` sem `*.test.ts` em `apps/estaleiro/ui/`.** Spec §3 linha 36 lista este arquivo como [UPDATE] obrigatório (opção b: remover script) ou opção a (placeholder). Handover §7 rotulou m1 EST-01 como `fixed` com base em testes do `core` (6 arquivos, 17 testes), mas o `ui` continua exit 1, e `pnpm -r test` na raiz falha com `[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @plataforma/estaleiro-ui`. Ação: ou remover script `test` de `apps/estaleiro/ui/package.json`, ou adicionar `apps/estaleiro/ui/tests/smoke.test.ts` placeholder (apps/estaleiro/ui/package.json:9)
- [ ] [m1][C-16][estaleiro] **Handover §7 rotulou EST-03a i1 como `fixed` quando a semântica é `no-op`.** Finding original era *adicionar* `lint` ao Gate, mas já está em `CLAUDE.md:67` e `wargame-task/SKILL.md:30`. Destino correto é `no-op` (já consistente), etiqueta está trocada — cosmética, não-bloqueante. Track: 1 palavra no handover (tasks/C-16.md:75)
- [ ] [i1][C-16][estaleiro] **Handover §7 não traz evidência literal do ciclo `core↔protocol↔testkit` em `pnpm build` (raiz).** Eu rodei e confirmei: turbo 2.9.18 reporta "Circular package dependency detected: @plataforma/core, @plataforma/protocol, @plataforma/testkit". No-op está correto, mas a evidência literal deveria ter sido colada no §7 (boa prática para auditores futuros). Track: 6 linhas (turbo output) (tasks/C-16.md:73)
- [ ] [i2][C-16][estaleiro/processo] **C-16 worker não criou commit algum na branch `task/C-16` (`git log` da worktree == master até C-18 merge).** Cleanup "nada a fazer" legítimo, mas vale registrar: `wt merge C-16` será no-op de `git merge` (master já contém tudo que a branch tem). Track: nota no índice ou política de C-tasks com 0-diff (commits `0000..0`)
<!-- END C-16 -->
<!-- C-14 -->
<!-- m1→C-28, m2→C-28 -->
- [ ] [m][C-14][orchestrator] Handover cobre 13 itens mas §4 só lista 12 (inclui "m1 ORQ-15 ADR-0010" extra). Mapeamento §3↔§4 inconsistente — reescrever §4 para alinhar (tasks/C-14.md:86 vs tasks/C-14.md:46-59)
<!-- END C-14 -->
<!-- M-016 -->
- [ ] [m][M-016][plugin-tasks/espec] **Spec §7 promete `Tests 8 passed (8)` mas suite real tem 191** — desatualizado pelo crescimento organico da suite desde a escrita da spec. Cobranca do fix (4c/4d/4e) validada individualmente via `vitest run -t 4c/4d/4e` (1/1 cada). Track: regra de contagem dinamica em C/M-tasks (snapshot da suite na data de merge) (tasks/M-016.md:184)
- [ ] [i1][M-016][estaleiro/operacional] **EST-13 e T-505 ainda aparecem como pendentes no backfill do M-016** — filhas nao-done: EST-13a/b/c, T-505a/b. Script trata corretamente (nao fecha), mas o arquiteto deveria agendar cleanup para essas familias. NAO e M-016, observacao operacional (close-decomposed-parents.mjs output)
- [ ] [i2][M-016][estaleiro/operacional] **EST-10 (decomposed parent) sem `subtasks:` nem `children:`** — skipado pelo backfill. Risco de ficar eternamente em `draft:decomposed`. Track: investigar em outra task (close-decomposed-parents.mjs output + tasks/EST-10.md)
<!-- END M-016 -->
<!-- C-10 -->
- [ ] [m][C-10][core] T-1042 `GraphStoreTx` contrato expandido — defer formalizado (escopo arquitetural; precisa decisão de design antes de poder implementar). Track: reendurecer T-1042 com a decisão de contrato (defer originário de packages/core/src/storage/sqliteStorage.ts (m1 T-1042))
- [ ] [i1][C-10][core] T-1045 `ProjectionManager` sem caller — defer formalizado. Projeção não implementada como módulo separado; até existir um consumer, `projection.ts:20` continua oco. Track: criar caller ou remover arquivo (defer originário de packages/core/src/projection.ts (m2 T-1045))
<!-- i2→C-29 -->
<!-- END C-10 -->
<!-- C-11 -->
- [ ] [m1][C-11][spec] **Spec drift — path graphRouting.ts errado.** Spec §3 linha 36 declara `packages/transport/src/graph/graphRouting.ts` mas path real é `packages/transport/src/discovery/graphRouting.ts`. Worker editou path correto (bom comportamento). Track: atualizar spec §3 (1 linha) ou criar C-11b para endurecer spec (tasks/C-11.md:36 vs packages/transport/src/discovery/graphRouting.ts:1)
- [ ] [m2][C-11][processo] **Commit `5e1ca5b` tem mensagem misleading.** Mensagem diz "lint — void _handleSignal no listen()" mas diff também re-adiciona `as any` em 3 sítios (revertendo m2) + chaves cosméticas em `onTimeout`. Solução: split em 2 commits (lint-fix + revert-as-any-separado) ou mensagem reflete real diff. Histórico já gravado, mas track: 1 mensagem de commit. Não-bloqueante (commit 5e1ca5b)
- [ ] [m3][C-11][handover] **Handover não cobre item "dead exports in protocol/src/index.ts" da spec §3.** Arquivo está limpo (0 dead exports — verificado por inspeção); disposição real é NO-OP mas não declarada. Track: simetria com os outros 3 itens do §5 que têm disposição explícita (1 linha no handover). Cosmético (tasks/C-11.md §3 vs §8)
- [ ] [i1][C-11][lint] **Handover descreve m2 como "DOM typing limitation — ArrayBufferLike vs ArrayBuffer" mas limitação real é do lint, não do tsc.** Tsc compila sem `as any` (Uint8Array casa ArrayBufferView overload); `as any` é workaround para `@typescript-eslint/no-unsafe-argument` que não distingue overloads WebRTC. Solução futura (não-bloqueante): type assertion para `ArrayBufferView` ou `// eslint-disable-next-line`. Track: 3 sítios em WebRtcAdapter.ts:129, 234, 352
- [ ] [i2][C-11][lint] **Lint delta: -1 erro (master 17 → worktree 16).** Handover diz "16 erros (todos pre-existentes, nenhum novo)" — correto mas subestima a melhoria. Lint não está zerado (16 erros restam: 7 no-explicit-any, 2 unsafe-argument, 2 unnecessary-type-assertion, 2 require-await, 2 floating-promises, 1 no-non-null-assertion, 1 no-unused-vars). Cleanup de lint é tarefa separada, não escopo de C-11 (packages/transport)
- [ ] [i3][C-11][processo] **Spec §3 menciona "**`packages/protocol/src/index.ts`** — dead exports"** mas Handover não traz evidência de inspeção (grep/lint check) confirmando arquivo está limpo. Inspeção manual do reviewer confirma 0 dead exports, mas registro formal falta. Track: 1 linha de evidência (grep/lint) (tasks/C-11.md:39)
<!-- END C-11 -->
<!-- C-13 -->
- [ ] [m1][C-13][handover] **m2 disposition imprecisa — "no-op" usado para "spec drift".** Spec §3 linha 33 declara path `tabs/AuthTab.tsx` (relativo a `apps/bancada/src/`); impl está em `components/tabs/AuthTab.tsx`. Handover rotula como "no-op (impl correta; spec desatualizada)" mas taxonomia §2a reserva `no-op` para "já consistente na impl". Caso real é inconsistência impl vs spec → `spec→T-512b` (re-endurecer spec). Disposição errada, decisão final (manter path do impl) é correta. Track: 1 linha na spec §3 (tasks/C-13.md:33 vs tasks/C-13.md:74)
- [ ] [m2][C-13][handover] **Handover §7 infla contagem de tests (67 vs 38 real).** Handover declara "11 files 67 tests passed" mas execução real mostra 7 files 38 tests. Provável causa: somou arquivos de `tests/e2e/` (playwright) com `tests/` (vitest). Não-bloqueante (suite vitest passa 38/38) mas evidência imprecisa. Track: rodar `vitest run --reporter=verbose` e colar saída exata no handover (tasks/C-13.md:87-89)
- [ ] [i1][C-13][spec] **m2 "no-op" deveria ser `spec→T-512b`** — ver m1. Implicação: ao drenar pendências, item com disposition errada pode não ser roteado corretamente pelo `/agrupar-cleanup` (tasks/C-13.md:74)
- [ ] [i2][C-13][processo] **Comentário "T-XXX bancada-wiring" no App.tsx:40 é placeholder não-resolvido.** m2 disposition "no-op (wiring é escopo de task futura)" é honesto, mas "T-XXX" literal no comentário sugere que task já foi nomeada e perdida. Track: nomear task de wiring bancada (ex.: `T-WIRE-BANCADA`) e atualizar comentário, ou remover "T-XXX" placeholder (apps/bancada/src/App.tsx:40)
<!-- END C-13 -->
<!-- C-12 -->
- [ ] [m][C-12][system-peer/processo] Worker nao rodou `git fetch` nem checou `master..task/C-12 -- apps/system-peer/` antes de criar a branch — base antiga, entrou em conflito com T-1035 ja mergeado. Track: pre-flight `wt diff-base <ID>` no /executar-task antes do 1º commit (tasks/C-12.md:8)
- [ ] [i1][C-12][system-peer/processo] Handover §8 inverte sinal de fix em 6 achados (m3 T-401, m4 T-401, i1 T-401, i6 T-401, m1 T-408, m2 T-408) — diff local contra master teria pego. Track: check pre-finish (tasks/C-12.md:101-115)
- [ ] [i2][C-12][system-peer] Tests 17-20 (admin.test.ts:228-256) cobrem timing-safe equal protection, mas a impl inline de T-1035 (97cd1f4, 93cd6fc) deveria ter cobertura via integracao end-to-end, nao so unit. Track: adicionar teste E2E com header `Bearer ` (com espaco) + timing-safe guard (apps/system-peer/tests/admin.test.ts:228-256)
<!-- END C-12 -->
<!-- C-12 (rework APROVADO) -->
- [ ] [m][C-12][system-peer] Worker escolheu stacked approach (3 commits + 1 revert) em vez de rebase limpo. Histórico mostra: 214be0b -> e133e4f -> 7f89082 -> 791fa9b. O revert 791fa9b desfaz as 3 anteriores. Funcionalmente equivalente a um rebase, mas histórico mais poluído. Track: 1 squash futuro ou pre-commit hook para evitar stacked reverts (commits 214be0b..791fa9b)
- [ ] [i1][C-12][system-peer] Branch base é `d66acb0` (pré-EST-10a, pré-EST-12). Master avançou 8+ commits. Merge will be 3-way ort - sem conflitos esperados nos 3 arquivos divergentes. Track: drenar ou rebase opcional (worktree age)
- [ ] [i2][C-12][system-peer/processo] Branch base `d66acb0` é de 2026-07-06 16:30; merge vai incorporar + 1 lockfile reconciliation (commit EST-12 lockfile, se ainda pendente). Track: drain-fila pós-merge
<!-- END C-12 (rework APROVADO) -->
<!-- EST-08 -->
- [ ] [m][EST-08][repo] Spec §3 violado em pnpm-workspace.yaml. Spec autorizou "a UNICA linha a tocar nesse arquivo" (`onnxruntime-node: true`). Worker adicionou 3 linhas: `onnxruntime-node`, `protobufjs: true`, `sharp: true`. `protobufjs` e `sharp` NAO sao deps deste pacote nem de EST-08 - provavel adicao preemptiva. HARMLESS (no-op se dep nao precisar de build), mas viola o contrato "unica linha". Track: drop as 2 linhas extras no rework de follow-up (pnpm-workspace.yaml:9,11)
- [ ] [i1][EST-08][core] Lockfile NAO commitado no branch. Commit `9e6202f` toca `pnpm-workspace.yaml` mas nao `pnpm-lock.yaml` (32KB modificados em worktree, dirty). Pos-merge, master ficara sem entradas de lock para `@plataforma/plugin-local-inference`, `onnxruntime-node`, `@huggingface/transformers`. Acao pos-merge: rodar `pnpm install` em master e commitar lock separadamente. Track: protocolo de C/M-tasks - worker deve commitar lock no mesmo commit (worktree git status)
- [ ] [i2][EST-08][core] Opcoes mortas em `SessionOptions`. `numThreads` e `modelCacheDir` declarados em `session.ts:7-8` mas NAO consumidos por `loadSession` (linhas 22-40). Spec §1 lista os 3 campos sem marcar como "reservado para follow-up". Cosmetico - adicionar JSDoc `@reserved` ou implementar (passa `numThreads` para `session.options.intraOpNumThreads`). Track: 2 linhas em session.ts (packages/plugin-local-inference/src/session.ts:7-8)
<!-- END EST-08 -->
<!-- EST-10a -->
- [ ] [m1][EST-10a][spec] **Spec §4 teste 3 está stale (m3) — "args (name, baseURL, apiKey, modelId)" mas impl segue M2 §5b (1 arg).** Spec §4 linha 53 diz "factory chamada com os args certos (name, baseURL, apiKey, modelId)" mas §5b M2 prescreve factory de 1 arg `name: string → LanguageModel` (e fonte ORQ-09b também passa só `modelId`). Worker seguiu M2 (fonte de verdade), teste verifica 1 arg. Spec §4 em contradição com §5b. Track: alinhar spec §4 com §5b (remover 3 args extras). Decisão final: APROVADO (M2 é fonte de verdade) (tasks/EST-10a.md:53 vs tasks/EST-10a.md:75-77)
- [ ] [i1][EST-10a][processo] **Handover §8 não traz evidência literal do Gate (apenas declara "5/5 tests, build+lint OK").** Spec §7 do DoD diz "GATE DE EVIDÊNCIA: nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a saída literal". Handover tem seção Handover do Executor mas bloco do Reviewer estava vazio. Worker poderia ter pré-populado. Track: reforçar em `executar-task` skill (tasks/EST-10a.md:137-141)
- [ ] [i2][EST-10a][arquitetura] **Plugin scaffold é cópia 1:1 de `plugin-fs-tools` (precedente mergeado).** §5b M1 prescreveu exatamente isso. Ponytail: aprovação clara — minimal scaffold, espelha padrão existente, sem abstração nova (packages/plugin-providers/*)
<!-- END EST-10a -->
<!-- EST-12 -->
- [ ] [m1][EST-12][plugin-skills/spec] Spec §4 caso 7 declara "listAgents em diretório vazio → []" mas teste em `tests/index.test.ts:112-117` criou 1 agent e asserta `length === 1`. Implementação cobre o caso (sonda P1 provou), mas o teste diverge do spec. Track: 5-8 linhas de teste com `agentsDir` apontando para dir vazio (tasks/EST-12.md:128 vs packages/plugin-skills/tests/index.test.ts:112-117)
- [ ] [B1][EST-12][integração] **Branch `task/EST-12` REESCREVE `packages/plugin-local-inference/` (EST-08, já em master).** Merge base `f419a89` (antes de `9e6202f feat(EST-08)`); diff inclui 5×D de plugin-local-inference + 2×R (package.json, tsconfig.json) renomeando para plugin-skills. Worker assumiu que plugin-local-inference era "placeholder" a renomear; master atual tem o substrato ORT real. Merge direto DELETA código do EST-08. Ação: rebasear `task/EST-12` sobre `origin/master` (ou criar `task/EST-12-rework-1`); NÃO renomear plugin-local-inference; criar plugin-skills como pacote NOVO; ajustar pnpm-workspace.yaml. Track: rebase + 1 commit (git log task/EST-12..origin/master + 5 deletes em packages/plugin-local-inference/)
<!-- END EST-12 -->
<!-- EST-08 (rework) -->
- [x] [B1][EST-08][core] ✅ RESOLVIDO pelo rework 172fcb6 (commit `fix(EST-08): [B1] adicionar testTimeout 30000 no vitest.config.ts`). Adicionado `testTimeout: 30_000` em `packages/plugin-local-inference/vitest.config.ts:6`. Cold-start gate pós-fix: test 2: 1139ms, test 3: 372ms, test 5: 1253ms — todos bem abaixo do novo timeout 30s. R2 reviewer aprovou. Merge em `ec4f3d0` (master).
- [ ] [i3][EST-08][processo] EST-12 merge ae21ba4 foi PERDIDO no reset nuclear de master (reset f419a89 removeu tanto EST-08 80f79a9/bdde67a quanto EST-12 ae21ba4). Branch task/EST-12 preservado em 110530f. Porem, EST-12 ja tem B1 em ledger: branch REESCREVE packages/plugin-local-inference/ (EST-08 code) — merge direto DELETA codigo do EST-08. Track: EST-12 precisa rebase + re-merge em sequencia (pos-EST-08 fix) (master local + EST-12 B1 ledger)
<!-- END EST-08 (rework) -->
<!-- EST-10b -->
<!-- m1→SPEC-PENDENCIAS, m2→C-27 -->
<!-- END EST-10b -->
<!-- EST-06 -->
<!-- m1→C-22, m2→C-22, m3→C-22 -->
<!-- END EST-06 -->
<!-- EST-10c -->
<!-- m1→SPEC-PENDENCIAS, m2→C-27 -->
<!-- END EST-10c -->
<!-- EST-09 -->
<!-- m1→C-21, m2→C-21, m3→C-21 -->
- [ ] [i1][EST-09][plugin-context/processo] Gate de evidência triplo (build+test+lint) aplicado e logado pelo worker (deepseek) no 1º finish. L2 com modelo real rodou 1.4s (cold-start + inferência de 510 tokens), bem dentro do testTimeout 30s herdado de EST-08. INFO positivo — comportamento esperado desde a regra de 2026-07-06.
- [ ] [i2][EST-09][plugin-context] `package.json:6-7` `exports: { ".": "./src/index.ts" }` está CORRETO — aponta para o barrel `src/index.ts` que re-exporta todas as funções. Diferente do bug do EST-13a/b (que apontava para `src/graph.ts` direto, quebrando o `import` de `makeFts`). INFO positivo.
- [ ] [i3][EST-09][plugin-context] 17 sondas adversariais ad-hoc (probe.test.ts) durante revisão — todas passaram após correção de 1 sonda mal-formada (testava JSON.stringify no escopo de teste em vez de propriedade do CCR store). Sondas cobriram: idempotência de hash, integridade de 1MB string, edge cases de CSV (vírgula, aspas, primitivos, objeto), graceful fallback quando L2/nano throws. INFO positivo — disciplina de revisão mantida.
- [ ] [i4][EST-09][plugin-context] Worker (deepseek) entregou em 11min (13:21→13:32) — implementação 6 arquivos + 5 test files + 3 config files + lockfile. Conformidade com §3 e §4 da spec exata. INFO positivo — capacidade sonnet adequada para a complexidade.
<!-- END EST-09 -->
<!-- EST-13c -->
<!-- m1→C-20, m2→SPEC-PENDENCIAS, m3→C-20 -->
- [ ] [i1][EST-13c][plugin-knowledge/processo] Gate de evidência triplo (build+test+lint) aplicado e logado pelo worker (deepseek) no 1º finish. Worker escolheu a arquitetura de "casca fina" da Decisão FECHADA (claude-opus 2026-07-06T19:47) sem scope creep — 40 linhas em writer.ts, 0 modificações em graph.ts/fts.ts. INFO positivo — comportamento esperado desde a regra de 2026-07-06.
- [ ] [i2][EST-13c][plugin-knowledge] **i1[EST-13a] e i1[EST-13b] finalmente RESOLVIDOS.** `package.json:7` `exports: { ".": "./src/index.ts" }` aponta para o barrel. `index.ts:1-5` re-exporta `makeGraph` + `makeWriter` + tipos. Wire contract com EST-14d View Knowledge (e qualquer consumer externo) agora funciona sem ajustes. ✅ — marcadas como `[x]` acima.
- [ ] [i3][EST-13c][plugin-knowledge] 8 sondas adversariais ad-hoc (probe.test.ts) durante revisão — todas passaram. Sondas cobriram: delegação pura (sem git/child_process), unicode em path+content, content vazio, paralelismo de 10 writes, abort mid-flight, read de vazio/unicode/inexistente. INFO positivo — disciplina de revisão mantida.
- [ ] [i4][EST-13c][estaleiro/processo] EST-13c é a 3ª e ÚLTIMA filha decomposta do épico EST-13. Quando `approve` rodar, o side-effect automático `parentAutoClose` (T-1029) deve disparar para fechar o pai `EST-13` (decomposed parent). INFO operacional — verificar pós-integração.
- [ ] [i5][EST-13c][plugin-knowledge] Diff da branch é EXATAMENTE 4 arquivos da §3 (package.json 1-linha, index.ts 5-linhas, writer.ts 40-linhas, writer.test.ts 127-linhas). Não tocou em graph.ts, fts.ts, pnpm-workspace.yaml, ou qualquer arquivo fora do escopo declarado. INFO positivo — aderência à §3 impecável.
<!-- END EST-13c -->
<!-- EST-14b (m1) -->
- [ ] [m1][EST-14b][estaleiro/processo] Handover §8 da spec está VAZIO (apenas `-`). Spec §0/§7 exige "Worker deve colar a saída literal destes comandos na Seção 8". Worker entregou mas não preencheu a evidência. Track: re-fill no rework (tasks/EST-14b.md:392-393)
<!-- END EST-14b (m1) -->
<!-- EST-14c -->
- [ ] [i1][EST-14c][estaleiro/ui] FleetView signature — spec §1 declara FleetView({ ws }), impl usa FleetView({ agents }) + FleetTab. Registrar na spec via cleanup. (FleetView.tsx:9 vs tasks/EST-14c.md:67)
<!-- m1→C-25, m2→C-25, i2→C-25 -->
<!-- END EST-14c -->
<!-- EST-14d -->
- [ ] [m1][EST-14d][estaleiro/ui] `KnowledgeView.fixture.ts` (99 linhas) e arquivo fora do escopo declarado pela spec §3 (nao listado em [CREATE]). Reutilizado por `App.tsx:10,65`. Track: listar como [CREATE] no rework (mock reutilizado pelo shell) ou mover para `__fixtures__/` se a convencao do monorepo tiver (apps/estaleiro/ui/src/views/knowledge/KnowledgeView.fixture.ts:1-99 vs tasks/EST-14d.md:88-95)
- [ ] [m2][EST-14d][estaleiro/ui] `KnowledgeView.tsx:31` type-cast redundante: `selectedSlug ?? undefined as string | undefined` — `??` ja produz `string | undefined`. Estilo, nao-bloqueante (apps/estaleiro/ui/src/views/knowledge/KnowledgeView.tsx:31)
- [ ] [i1][EST-14d][estaleiro/ui] Wikilink implementado via preprocessador de string (`preprocessWikilinks` troca `[[slug]]` por `[slug](/_wikilink/slug)`) + custom `a` renderer que detecta o prefixo, em vez de `remarkPlugin` como sugerido em §5 Pegadinhas. Funcionalmente equivalente; troca de `wikilink://` para `/_wikilink/` foi feita por compatibilidade com `defaultUrlTransform` de react-markdown. INFO — registrar decisao (apps/estaleiro/ui/src/views/knowledge/ContentPanel.tsx:11-15,90-108 vs tasks/EST-14d.md:115)
<!-- END EST-14d -->
<!-- EST-14e (R1, REFATORAÇÃO) -->
- [ ] [m1][EST-14e][estaleiro/ui] `useCost` retorna `avgLatency: 0` para todo provider; coluna "Latência" do `CostTable` exibe `—` sempre. Spec §1 não exige latência (mas tabela §0 promete). Track: ou popular latência a partir de `costStore` (EST-10c expõe `CallRecord.latencyMs`), ou remover a coluna (apps/estaleiro/ui/src/views/cost/hooks.ts:91, CostTable.tsx:24)
- [x] [m2][EST-14e][estaleiro/ui] ✅ RESOLVIDO em R2 (commit `470ca46`): `useCost` agora usa `useState<boolean>(true)` e só desce para `false` em `loadedRef.current` no primeiro read. Comportamento de loading agora reflete o ciclo real de leitura (apps/estaleiro/ui/src/views/cost/hooks.ts:32,96-99)
- [x] [i1][EST-14e][estaleiro/spec] ✅ RESOLVIDO em R2 (commit `470ca46`): `useDecisions` agora chama `transition(taskId, 'block', 'architect')` (verbo válido em `stateMachine.ts:15`). Bug funcional do botão "Adiar" sanado. **Mas o spec EST-14e §1 AINDA diz `block_decision`** (tasks/EST-14e.md:45) — spec drift residual. Track: limpeza documental do spec para alinhar com a impl (tasks/EST-14e.md:45)
- [ ] [i2][EST-14e][estaleiro/ui] `App.tsx:37` usa `createMockTaskClient` no shell de produção (não em test fixture). Para a v1 do Estaleiro como ferramenta interna com trusted network, ok; vale documentar que em prod o `taskService` real virá por DI/config quando EST-03d backend estiver completo (apps/estaleiro/ui/src/App.tsx:37)
- [ ] [i3][EST-14e][estaleiro/ui] `CostChart` (apps/estaleiro/ui/src/views/cost/CostChart.tsx:7-49) usa SVG hand-rolled em vez de `recharts`/`chart.js`. Spec §5.2 instr 8 sugere "recharts ou chart.js (biblioteca a escolher do worker)" — worker optou por SVG nativo. Não há regressão (mais leve, JSDOM-friendly, sem deps novas); vale alinhar com a expectativa do arquiteto se preferir a lib canônica. Não-bloqueante
- [ ] [i4][EST-14e][estaleiro/ui] **Cobertura de teste do hook `useCost` é ZERO — `CostView.test.tsx:8` faz `vi.mock('./hooks.js')` mockando o hook inteiro.** R2 M6 (useMemo cached) só foi pego por sonda adversarial ad-hoc; testes próprios do hook (paralelo a `fleet/__tests__/FleetView.test.tsx`) teriam pego. Track: criar `cost/hooks.test.ts` com 1-2 casos (mount com store vazio + populado, ver costs.length refletir mudança) (apps/estaleiro/ui/src/views/cost/CostView.test.tsx:8)
- [ ] [i5][EST-14e][estaleiro/infra] **WsClient API não suporta multi-listener — `WsClient` (apps/estaleiro/ui/src/ws/client.ts:11-16) só aceita `onEvent` no construtor, não expõe `addEventListener`/`on(type, handler)` após construção.** Esta é a causa raiz da degradação R1-M4/M5 (worker recorreu a polling 30s como workaround). Para satisfazer spec §1 ("subscribe TaskUpdatedEvent/CostUpdateEvent via WS") é preciso estender a interface com multi-listener. Track: escalonar como `[decision→T-XXX]` para o arquiteto decidir a forma do WsClient API. Task de infraestrutura transversal, não escopo de EST-14e (apps/estaleiro/ui/src/ws/client.ts:11-16)
- [ ] [i6][EST-14e][estaleiro/spec] **Bridge pattern para M2 (R1) é legítimo mas precisa de clarificação no spec.** Spec §1 EST-14e diz "**Consome EST-10c queryUsage(provider, windowMs)**" (verbo direto, não indireto). R2 implementou via `costStore` populado por plugin-providers host. Duas leituras possíveis: (a) spec queria chamada direta — então R2 está incompleto; (b) spec queria consumir dados de custo — então R2 está OK. Mesma inconsistência do [i1] do R1. Track: arquitet decide se a frase significa direto ou indireto. Deveria ter ido para SPEC-PENDENCIAS no rework; escala aqui (tasks/EST-14e.md:51-65)
<!-- END EST-14e (R1, REFATORAÇÃO) -->
<!-- EST-16 -->
- [ ] [m1][EST-16][plugin-workflows] `store.ts` faz cast hack do `PluginManifest` em todas as chamadas FsPort (`{ allowed: true } as unknown as Parameters<FsPort["readFile"]>[0>` em 5 lugares). Funciona em runtime porque `makeFsPort` ignora o `plugin` arg, mas o objeto literal nao satisfaz o zod schema `PluginManifest` (faltam `name`, `version`, `capabilities`, `entrypoint`). Higiene de tipos, sem impacto hoje. Track: importar `makePluginManifest` ou construir `PluginManifest` literal (packages/plugin-workflows/src/store.ts:32,40,46,65,83 vs apps/estaleiro/core/src/manifest.ts:3-10)
- [x] [m2][EST-16][plugin-workflows] ✅ RESOLVIDO em R2 (commit `334563f`): 3 testes adicionados em `decide.test.ts:85-98` (13b `rework`→`rework-task`, 13c `harden`→`endurecer-task`, 13d `promote`→`arquiteto-promover`). Cobertura 5/5 actions completa. Spec §7 checklist OK (packages/plugin-workflows/tests/decide.test.ts:85-98)
- [ ] [i1][EST-16][plugin-workflows/spec] Spec drift: EST-16 §2 cita `FsPort.mkdirp(manifest, path): Promise<void>` como membro da interface, mas o `FsPort` real em `apps/estaleiro/core/src/ports/fs.ts:5-8` so tem `readFile` + `writeFile`. `makeFsPort` faz `mkdir` internamente dentro de `writeFile` (linha 39), contornando a falta. Nao-bloqueante (worker tratou corretamente). Track: reendurecer a spec de EST-02b referenciada em EST-16 — remover `mkdirp` da lista ou adiciona-lo ao FsPort (apps/estaleiro/core/src/ports/fs.ts:5-8 vs tasks/EST-16.md:198-200)
- [ ] [i2][EST-16][plugin-workflows] Dep extra `@gorules/zen-engine-wasm32-wasi: 1.0.0-beta.4` em `package.json:16` — nao listada em spec §3 mas e dep transitiva do `@gorules/zen-engine` (binding WASM WASI para browser). Promovida a direta pelo pnpm automaticamente. Esperado pelo design T-604. INFO (packages/plugin-workflows/package.json:16 vs tasks/EST-16.md:212-213)
<!-- END EST-16 -->
<!-- T-702 -->
- [ ] [i1][T-702][transport] `PrivateSwarm` entregue como primitiva sem caller de produção no monorepo. Único import do símbolo é o próprio `tests/privateSwarm.test.ts`; nenhum caller em `packages/**` ou `apps/**`. Integração com app/product é trabalho de task futura (fora do escopo declarado em §3). Track: criar task de wiring com consumer real (ex.: `apps/bancada` aba Sync) quando aplicável (packages/transport/src/privateSwarm/privateSwarm.ts:1-357)
<!-- END T-702 -->
<!-- T-404a -->
- [ ] [i1][T-404a][transport] `attemptHandshake` (`Engine.ts:88-92`) usa `await Promise.resolve()` como proxy de "ponto de suspensão real" do handshake stub. Quando T-404b plugar handshake WebRTC real, o `await` deve permanecer genuíno (não substituir por short-circuit síncrono) para preservar a semântica make-before-break documentada na §1. Track: JSDoc + preservar genuíno (packages/transport/src/promotion/Engine.ts:88-92)
- [ ] [i2][T-404a][transport] `entry.state` permanece `RELAY_ONLY` em tentativas 1..N-1 com `FAILED` retornado (só vira `FAILED` permanente ao esgotar `attempts >= maxAttempts` em `Engine.ts:65-69`). Coerente com a leitura da spec, mas merece JSDoc explícito em `tryPromote` para evitar confusão em callers de T-404b. Track: JSDoc (packages/transport/src/promotion/Engine.ts:65-69)
- [ ] [i3][T-404a][transport] Race condition latente: `entry.attempts += 1` (`Engine.ts:59`) e `entry.state = PROMOTING` (linha 58) NÃO são atômicos — 2 awaits concorrentes no mesmo peer podem perder 1 incremento de `attempts`. Não-bloqueante para T-404a (escopo é "core loop + NAT decision" — semântica concorrente é T-404b ou task futura). Callers de produção precisam serializar ou assumir semântica "melhor esforço". Track: documentar ou serializar (packages/transport/src/promotion/Engine.ts:55-77)
<!-- END T-404a -->
<!-- BEGIN EST-19 -->
- [ ] [i1][EST-19][estaleiro] `server.mjs` NÃO compõe o host de plugins prometido na §1 — é static server + WS echo; não instancia `make{Fs,Bash,Commit}Port` nem carrega plugins (§6 nota 2 deferiu ports deliberadamente, mas nem fs/bash/commit são compostos). "Executável como ferramenta" = casca UI + WS echo. Track: EST-02/consumidor futuro (apps/estaleiro/server.mjs)
<!-- i2 RESOLVIDO 2026-07-08 (superapp 9eab034): estaleiro-ui migrado p/ Vite + src/main.tsx (mount createRoot). UI renderiza de verdade; fallback index.html sintético removido do standalone.mjs. -->
<!-- END EST-19 -->
<!-- DMM-01 -->
- [ ] [i1][DMM-01][orchestrator/spec] Sondas adversariais para os caminhos de erro do loop (`maxSteps` excedido, handler ausente, decisor terminal em `next: null`) não foram aplicadas no spike — paths já documentados no código (orchestrator.ts:23,28) e cobertos pela tipagem. A verificação cabe aos estágios de produção (DMM-02…05) que os exercitarão de verdade. Não-bloqueante (over-engineering sobre spike que provou o contrato) (packages/plugin-workflows/src/orchestrator.ts:23,28)
<!-- END DMM-01 -->
<!-- DMM-10 -->
- [ ] [m1][DMM-10][estaleiro/ui] O pacote `@gorules/jdm-editor` é pesado, será necessário monitorar o tempo de carregamento no futuro.
- [ ] [i1][DMM-10][estaleiro/ui] O lint issue existente em `decisions/hooks.ts` foi corrigido (side-fix).
<!-- END DMM-10 -->
<!-- DMM-02 (R1, REFATORAÇÃO) -->
- [ ] [m1][DMM-02][plugin-workflows/spec] §4 exige "Fallback local→providers exercitado" mas §5 manda não hardcodar o provedor (DI). Impl cumpre §5 (Translator injetado), tornando o fallback responsabilidade do caller. Bullet de §4 fica sem dono. Track: esclarecer na spec que o fallback é exercido em teste de integração futura (caller real), ou criar teste que injete Translator com fallback local→provider (tasks/DMM-02.md §4 vs §5)
- [ ] [i1][DMM-02][plugin-workflows] `loadIngressGraph()` lê o JDM do filesystem via `__dirname`/`fs.readFileSync` (`ingress.ts:11-15`). Funciona em Node/Vitest, mas acopla o workflow a um path em disco. Um `import jdm from "./ingress.jdm.json"` (ESM JSON) deixaria o grafo portátil e removeria a dep de `fs`/`__dirname`. Sugestão de melhoria, não-bloqueante (packages/plugin-workflows/src/nodes/ingress/ingress.ts:11-15)
<!-- END DMM-02 (R1, REFATORAÇÃO) -->
<!-- DMM-03 (R1, REFATORAÇÃO) -->
- [ ] [m1][DMM-03][plugin-workflows] `ModelPlanner` é apenas `type` alias (`(context: string) => Promise<ArchitectPlan>`). Em runtime, se o provider retornar `{}`, `summary: undefined` ou `mode` inválido, o envelope propaga valores inconsistentes sem validação. TypeScript-only. Track: adicionar guarda leve (Zod ou manual) em `createPlanHandler`; rejeitar `mode` fora da union e exigir `summary: string` (ADR 0013 §2 Estágio 2) (packages/plugin-workflows/src/nodes/architect/architect.handlers.ts:7-19, types.ts:3-12)
- [ ] [m2][DMM-03][plugin-workflows] `result.tasks?.slice(0, maxItems)` aceita `maxItems = -1` e retorna `slice(0, -1)` = tudo exceto o último item (semântica contraintuitiva). Track: `Math.max(0, maxItems)` ou validar `opts.maxItems > 0` em `createArchitectWorkflow` (packages/plugin-workflows/src/nodes/architect/architect.handlers.ts:9-10)
- [ ] [m3][DMM-03][plugin-workflows] `loadArchitectGraph()` faz `fs.readFileSync(architect.jdm.json)` no construtor do workflow. A regra §5 ("NÃO deixar o Architect abrir/ler arquivos — é papel do Explorer, DMM-04") refere-se a abrir arquivos do projeto do usuário (código-fonte da task executada), não o próprio JDM do nó. **Defensável** (consistente com `chain.poc.test.ts` de DMM-01), mas precisa de comentário explícito para evitar re-revisão posterior. Track: adicionar `// nota: fs.readFileSync do JDM é o BOOT do workflow (carrega a definição do grafo), não abre código-fonte da task — papel do Explorer (DMM-04).` (packages/plugin-workflows/src/nodes/architect/architect.ts:13-15)
- [ ] [i1][DMM-03][plugin-workflows] Cobertura §4 está completa para os pares canônicos: sequential+tasks / branch+branches / simple / DI / maxItems = 5/5 no `architect.poc.test.ts` + 1/1 no `chain.poc.test.ts` (baseline DMM-01) = 6/6. DoD §7 ("Nó Architect decide branching a partir da resposta do modelo, via contrato DMM-01") atendida nos casos cobertos. INFO positivo
- [ ] [i2][DMM-03][plugin-workflows] ADR 0014 `{ next, args }` Delta: `architect.ts:35-45` retorna `Decision{next: string | null}` (sem `args`); o JDM não precisa de args para a aresta de decisão. Consistente com `types.ts:25-28`
- [ ] [i3][DMM-03][plugin-workflows] Acoplamento (Gate 5.1.2): imports cross-package do `architect/**` são apenas `@plataforma/plugin-zen-engine` (peer, decisor de DI) e `@plataforma/plugin-workflows` (auto, intra-package). Zero ciclo, sem inversão de direção
- [ ] [i4][DMM-03][plugin-workflows] **Gate 5.1.1 (wiring) OK porque a integração downstream DMM-06 está linkada no frontmatter `blocks: ["DMM-06"]`** (DMM-06 ainda em `draft:triaged`, será o caller real). Único consumidor atual é o próprio teste
<!-- END DMM-03 (R1, REFATORAÇÃO) -->
<!-- DMM-03 (R2, APROVADO) -->
- [ ] [m1][DMM-03][plugin-workflows] `ModelPlanner` é apenas `type` alias (`(context: string) => Promise<ArchitectPlan>`). Validação runtime ausente: provider pode retornar `{}`, `summary: undefined` ou `mode` inválido. Sonda R2 #5 confirma que `summary: undefined` propaga sem crash (não-bloqueante). Track: adicionar guarda leve (Zod ou manual) em `createPlanHandler`; rejeitar `mode` fora da union e exigir `summary: string` (ADR 0013 §2 Estágio 2) (packages/plugin-workflows/src/nodes/architect/architect.handlers.ts:7-19, types.ts:3-12)
- [ ] [i1][DMM-03][plugin-workflows] `result.tasks?.slice(0, maxItems)` aceita `maxItems = -1` retornando `slice(0, -1)` (semântica contraintuitiva). Defensável para o caller atual. Track: `Math.max(0, maxItems)` no rework futuro (packages/plugin-workflows/src/nodes/architect/architect.handlers.ts:9-10)
- [ ] [i2][DMM-03][plugin-workflows] `loadArchitectGraph()` (`architect.ts:13-15`) ainda faz `fs.readFileSync(architect.jdm.json)`. **Defensável** (consistente com `chain.poc.test.ts` de DMM-01) — bootstrap do grafo, não abre código-fonte da task. Track: adicionar comentário explicativo referenciando o papel do Explorer (DMM-04) (packages/plugin-workflows/src/nodes/architect/architect.ts:13-15)
- [ ] [i3][DMM-03][plugin-workflows/test] Cobertura §4 completa para pares canônicos + mismatch: 5/5 originais + 2/2 adversariais = 7/7 no `architect.poc.test.ts` + 1/1 no `chain.poc.test.ts` (baseline DMM-01) = 8/8. DoD §7 atendida nos casos cobertos. INFO positivo
<!-- END DMM-03 (R2, APROVADO) -->
<!-- DMM-04 (R1, REFATORAÇÃO) -->
- [ ] [m1][DMM-04][plugin-workflows] `src/nodes/index.ts` (novo, 3 linhas) criado mas não declarado em spec §3. Consistente com o padrão `src/nodes/architect/index.ts` (DMM-03) e necessário para o barrel de `src/index.ts:15`. Track: declarar `[CREATE] src/nodes/index.ts` no reendurecimento de §3 (mesma omissão de DMM-03 m1) (packages/plugin-workflows/src/nodes/index.ts:1-3 vs tasks/DMM-04.md §3)
- [ ] [m2][DMM-04][plugin-workflows/spec] Spec drift — §6 linha 67 afirma que `run` retorna `AsyncIterable<RunnerEvent>`, mas a assinatura real (`plugin-agent-harness/src/types.ts:4-8` + `runner.ts:83`) é `Promise<AgentRunResult>` com eventos emitidos via `onEvent` callback. Track: reendurecer §6 (1 linha) para alinhar com a assinatura real (tasks/DMM-04.md:67 vs packages/plugin-agent-harness/src/types.ts:4-8)
- [ ] [m3][DMM-04][plugin-workflows] `poc/explorer.poc.test.ts:139` — caso "raw não-JSON" cobre texto literário, mas não cobre `raw: ""` (string vazia). Quando `result.text || result.tail || ""` produz `""`, o decider ainda chama `crushToCsv("")` (condição `env.raw !== undefined` é `true` para `""`). `crushToCsv("")` pode devolver `""` ou um CSV de cabeçalho — comportamento não documentado. Track: adicionar `it("raw vazio não quebra")` com 1 asserção de tipo (~6 linhas)
- [ ] [i1][DMM-04][plugin-workflows] Cobertura §4 está completa para os 3 casos exigidos: (a) read-only garantido (`explorer.poc.test.ts:15-18`), (b) crushToCsv transição (`:58,69-73`), (c) stubRun chamado 1 vez (`:64`). DoD §7 atendido nos casos cobertos
- [ ] [i2][DMM-04][plugin-workflows] Decoupling pattern OK: `explorer.ts:1-2` importa só tipos locais de `../types.js`. Sem import de `plugin-agent-harness` nem `plugin-fs-tools` — caller injeta `run` + `tools` por DI. Alinhado com ADR 0013 §3
- [ ] [i3][DMM-04][plugin-workflows] Gate 5.1.1 (wiring) OK: caller de produção ainda não existe (próprio teste). Integração downstream **DMM-06** linkada no frontmatter `blocks: ["DMM-06"]` (DMM-06 ainda em `draft:triaged`, será o caller real — e justamente é onde a contract drift de [M1] vai se manifestar)
- [ ] [i4][DMM-04][plugin-workflows] Acoplamento (Gate 5.1.2): zero import cross-package em `explorer.ts` (apenas `../types.js` local). Zero ciclo
- [ ] [i5][DMM-04][plugin-workflows] `package.json` não modificado (vs DMM-03 que adicionou 1 linha). Escopo §3 respeitado no nível de dependências
<!-- END DMM-04 (R1, REFATORAÇÃO) -->
<!-- DMM-04 (R2, REFATORAÇÃO) -->
- [ ] [M1][DMM-04][plugin-workflows] **Type-level contract drift por versão desalinhada do `ai` SDK (residual do R1 [M1]).** `package.json:20` adicionou `"ai": "^4.1.0"`, mas `plugin-agent-harness` resolve transitivamente para `ai@7.0.15`. O `LanguageModel` em cada versão tem semântica diferente: `ai@4.1.0` é alias puro para `LanguageModelV1`; `ai@7.0.15` é união `V1 | V2 | V3 | V4 | string`. Sonda de tipo em build time (`_contract-check.ts`) confirma que `RunContract.model` (v4) ≠ `RunOptions.model` (v7) — assignment falha em ambos sentidos, especificamente no campo `model`. Caller real (DMM-06) que tentar `createExplorerHandler({ run: realRun })` sem `as any` recebe erro de TypeScript. **Diferente do R1 [M1] (runtime)**: este é build-time. Ação (1 das 3): (a) RECOMENDADO — reescrever `RunContract` como `Pick<RunOptions, 'taskId' | 'model' | 'cwd' | 'prompt' | 'maxSteps' | 'tools' | 'onEvent'>` e reusar `AgentRunResult`; (b) upgrade `ai` para `^7.0.15`; (c) importar `LanguageModelV1` direto. R1 já tinha sugerido (a) explicitamente (packages/plugin-workflows/package.json:20 + packages/plugin-workflows/src/nodes/explorer.ts:12)
- [ ] [i6][DMM-04][plugin-workflows] `explorer.ts:1-3` agora importa tipos cross-package dos pacotes reais (`PluginTools` de `@plataforma/plugin-fs-tools`, `LanguageModel` de `ai`, `AgentEvent` de `@plataforma/plugin-agent-harness`). Bom — mas a versão de `ai` está desalinhada (ver [M1] acima). Atualização do [i2] do R1 que dizia "apenas tipos locais" (packages/plugin-workflows/src/nodes/explorer.ts:1-3)
- [ ] [i7][DMM-04][plugin-workflows] `package.json` FOI modificado no rework: adicionou `@plataforma/plugin-agent-harness`, `@plataforma/plugin-fs-tools`, `ai@^4.1.0` como devDeps. **Atualização do [i5] do R1** que dizia "package.json não modificado" (packages/plugin-workflows/package.json:14-20)
- [ ] [i8][DMM-04][plugin-workflows/test] `poc/explorer.poc.test.ts:152-183` — novo test 4 "tail fallback" adicionado no rework (era 3 testes, agora 4). Cobertura do caso `onEvent` ausente → fallback para `result.tail` (packages/plugin-workflows/poc/explorer.poc.test.ts:152-183)
<!-- END DMM-04 (R2, REFATORAÇÃO) -->
<!-- DMM-02 (R2, APROVADO) -->
- [ ] [i2][DMM-02][plugin-workflows] `package.json` NÃO foi modificado pelo worker (diff `ebe5a13..HEAD -- packages/plugin-workflows/package.json` retorna vazio). `@plataforma/plugin-context` já era dep em master. INFO positivo — aderência à §3 impecável (vs DMM-03 que adicionou 1 linha)
- [ ] [i3][DMM-02][plugin-workflows] `ingress.ts:38-48` decider: a regra r3 (default → terminal) é sempre `1==1` — funciona como catch-all. Se o JDM cresce (futuras regras de erro/branch), esse catch-all deve ser revisitado para não mascarar estados não-cobertos. Defensável agora (Ingress linear) (packages/plugin-workflows/src/nodes/ingress/ingress.jdm.json:42-45)
- [ ] [i4][DMM-02][plugin-workflows] Acoplamento (Gate 5.1.2): import cross-package em `ingress.handlers.ts:1-2` é `@plataforma/plugin-context` (deps já declaradas em §3 como READ). Zero ciclo. Consistente com `docs/visao-arquitetural.md §1` (packages/plugin-workflows/src/nodes/ingress/ingress.handlers.ts:1-2)
- [ ] [i5][DMM-02][plugin-workflows] Gate 5.1.1 (wiring) OK: caller de produção ainda não existe (próprio teste). Integração downstream **DMM-06** linkada no frontmatter `blocks: ["DMM-06"]` (DMM-06 ainda em `draft:triaged`, será o caller real)
- [ ] [i6][DMM-02][plugin-workflows/test] `crusher.ts` é exercido **de verdade** no test 1 (assere `output.toContain("×")`) — o mock só substitui `compressL2`, não `crushStructural`. Bom — o teste prova a composição real, não uma simulação. INFO positivo (packages/plugin-workflows/poc/ingress.poc.test.ts:84)
<!-- END DMM-02 (R2, APROVADO) -->
<!-- DMM-04 (R3, APROVADO) -->
- [ ] [m1][DMM-04][plugin-workflows] `src/nodes/index.ts` (R3: 2 linhas) criado mas não declarado em spec §3. Mesmo padrão DMM-02/03/04. Track: declarar `[CREATE] src/nodes/index.ts` no reendurecimento de §3 (mesma omissão de DMM-03 m1) (packages/plugin-workflows/src/nodes/index.ts:1-2 vs tasks/DMM-04.md §3)
- [ ] [m2][DMM-04][plugin-workflows/spec] Spec drift — §6 linha 67 ainda afirma que `run` retorna `AsyncIterable<RunnerEvent>`, mas a assinatura real é `Promise<AgentRunResult>` com `onEvent` callback. Track: reendurecer §6 (1 linha). Herdado de R1/R2 (packages/plugin-workflows/src/nodes/explorer.ts:7 vs tasks/DMM-04.md:67)
- [ ] [m3][DMM-04][plugin-workflows] Caso `raw: ""` (string vazia) continua não coberto. Quando `doneText=undefined` E `result.tail=""`, handler devolve `raw: ""` que `crushToCsv("")` pode devolver `""` ou cabeçalho — comportamento não documentado. Herdado de R1/R2; track: adicionar `it("raw vazio não quebra")` (~6 linhas) (poc/explorer.poc.test.ts)
- [ ] [i1-r3][DMM-04][plugin-workflows] **[M1]ᵣ do R2 FECHADO.** Probe de tipo em build time (réplica exata do R2) compila sem erro — `RunContract` e `typeof realRun` são estruturalmente equivalentes em ambos sentidos. Sugestão (a) do R2 (`Pick<RunOptions, ...>`) seguida à risca + `"ai"` removido de `package.json`. INFO positivo (packages/plugin-workflows/src/nodes/explorer.ts:7,14 + package.json:14-18)
- [ ] [i2-r3][DMM-04][plugin-workflows] Decoupling preservado: `explorer.ts` ainda não importa `run` diretamente — caller injeta por DI. `AgentEvent` importado de `@plataforma/plugin-agent-harness` (não de `'ai'`), mantém alinhamento automático com a versão resolvida. INFO positivo (packages/plugin-workflows/src/nodes/explorer.ts:2)
- [ ] [i3-r3][DMM-04][plugin-workflows] `package.json` cleanup: `"ai": "^4.1.0"` REMOVIDO. Sem dependência direta da SDK instável, o `plugin-workflows` deriva tudo do `plugin-agent-harness` que é o proprietário canônico. INFO positivo (packages/plugin-workflows/package.json:14-18)
- [ ] [i4][DMM-04][plugin-workflows] Chain de revisões R1 → R2 → R3 fechou o ciclo. Os 3 MINORs (m1, m2, m3) são housekeeping conhecido (mesmos das 3 reviews) e candidatos óbvios a um `cleanup` futuro — agrupar m1/m2/m3 de DMM-02/03/04 num único C-NN. INFO positivo (tasks/DMM-04.md §8)
<!-- END DMM-04 (R3, APROVADO) -->
<!-- DMM-06 (R1, APROVADO) -->
- [ ] [i1][DMM-06][plugin-workflows/test] `templates/index.ts:14` hardcoda `createdAt: '2026-07-09T00:00:00.000Z'`. Determinístico (bom p/ tests), mas perde o timestamp real. Como é um "default template" versionado, o timestamp não importa na prática. Track: usar `new Date().toISOString()` no build, ou manter hardcoded como "data de release" — decisão de arquiteto. (packages/plugin-workflows/src/templates/index.ts:14)
- [ ] [i2][DMM-06][plugin-workflows/test] Teste em `packages/plugin-workflows/test/` enquanto o resto do pacote usa `poc/`. Spec §3 diz `test/` (segue spec), mas a convenção do repo é `poc/`. Não-bloqueante (vitest pega os dois). Track: alinhar convenção no reendurecimento futuro. (packages/plugin-workflows/test/dmm-template.test.ts)
- [x] [i3][DMM-06][plugin-workflows/jdm] `dmm-default.json` carregado via `readFileSync(__dirname, ...)` (não embedded), permitindo edição em runtime — desenho certo p/ "editável" (DMM-10). HitPolicy `first` + r7 catch-all garantem terminação em todos os caminhos. INFO positivo. (packages/plugin-workflows/src/templates/{dmm-default.json,index.ts})
- [x] [i4][DMM-06][plugin-workflows/wiring] HandlerMap do teste usa os nomes exatos das strings do JDM (`plugin-ingress`, `plugin-architect`, `plugin-explorer`, `plugin-editor`) — provam o contrato de wiring com o Orchestrator. INFO positivo. (packages/plugin-workflows/test/dmm-template.test.ts:34-54)
- [x] [i5][DMM-06][plugin-workflows/architecture] Direcao canonica `plugin-workflows → plugin-zen-engine` (consumidor do tipo `WorkflowDefinition`); verificado zero imports reversos (sem ciclo). INFO positivo. (packages/plugin-workflows/src/templates/index.ts:4)
<!-- END DMM-06 -->
<!-- DMM-07 (R2, APROVADO) -->
- [ ] [M1][DMM-07][estaleiro/evidence] Worker citou "27/27 passed" para `@plataforma/estaleiro-ui` no Log §9 — real é 39 (inclui testes pré-existentes). **ATENDIDO no rework** (log §9 linha 134 diz "ui 39/39"), mas a linha antiga (l. 166) ainda persiste — cosmético. (tasks/DMM-07.md:166)
- [ ] [i1][DMM-07][estaleiro/processo] Handover §8 (l. 79-80) só tem a entrada do deepseek original; o rework do claude (R2) não atualizou. Mesmo padrão de EST-13a/13b/17. Track: worker-script deveria LEMBRAR o worker a preencher §8 antes do `finish`. (tasks/DMM-07.md:79-80)
- [ ] [i2][DMM-07][estaleiro-core/ponytail] `server.mjs:34-35` instancia `harnessBridge` mas falta 1 linha de comentário dizendo o que é/será usado por (DMM-08/DMM-09). Track: adicionar comentário curto no rework futuro. (apps/estaleiro/server.mjs:34-35)
- [x] [i3][DMM-07][estaleiro-core/wiring] **`createHarnessWsBridge` ligado ao host** em `server.mjs:35` (1 linha efetiva: `export const harnessBridge = createHarnessWsBridge(wss)`); o `broadcastEvent` morto foi removido; `apps/estaleiro/package.json:10` agora depende de `@plataforma/estaleiro-core: workspace:*`. `scripts/estaleiro-standalone.mjs:22-25` copia o `core/dist` para o destino. ✅ RESOLVIDO no rework. INFO positivo. (apps/estaleiro/server.mjs, apps/estaleiro/package.json, scripts/estaleiro-standalone.mjs)
- [x] [i4][DMM-07][plugin-workflows/test] `run-service.test.ts` cobre a cadeia `RunService → Bridge → WS client real` com 3 eventos (start/tool-call/done). O `setTimeout(50)` antes do `execute` é racy (preferível `wss.once('connection')`), mas funciona. INFO positivo (teste do rework; sincronização é melhoramento opcional). (apps/estaleiro/core/tests/run-service.test.ts:41-74)
<!-- END DMM-07 (R2, APROVADO) -->
<!-- DMM-05 (R1, APROVADO) -->
- [ ] [m1][DMM-05][plugin-workflows/test] `poc/editor.poc.test.ts:16-58` — o teste "stub falha→corrige→passa" não itera o stub 2× (1ª exit=1, 2ª exit=0); apenas chama uma vez com exit=0. O loop de autocorreção é interno ao `runner.ts` (EST-06) e o editor só delega, então o teste valida o contrato do handler corretamente. Reforço opcional p/ confiança (não bloqueia). Track: 1 iteração extra do stub com exit=1 e depois exit=0.
- [ ] [m2][DMM-05][plugin-workflows/editor] `editor.ts:32-37` — `EDITOR_SYSTEM_PROMPT` poderia explicitar "NÃO use read-only mode" / "sempre corrija" para reforçar a persona. Hoje a defesa é só a presença de "ESCRITA" no prompt. Não bloqueia. Track: adicionar 1-2 frases de negação.
- [ ] [i1][DMM-05][plugin-workflows/editor] `editor.ts:73-77` — `onEvent` só captura `type==='done'`; outros eventos (`error`, `aborted`, `tool-call`) são silenciosamente ignorados. O registry DMM-14 pode subscrever separadamente. Track: DMM-14.
- [ ] [i2][DMM-05][plugin-workflows/editor] `editor.ts:7-17` — `RunContract` duplica a sub-forma de `RunOptions` (decoupling intencional; risco de drift se o harness adicionar parâmetros). Track: considerar `Pick<RunOptions, ...>` se DMM-04b alinhar.
<!-- END DMM-05 -->
<!-- DMM-14 (R1, REFATORAÇÃO) -->
- [ ] [m1][DMM-14][plugin-workflows/spec] Spec §3 lista só 1 CREATE (`pluginRegistry.ts`) mas o escopo real do refator §6 (Mover para o Core) tem 9 mudanças: 3 CREATE (`pluginRegistry.ts`, `pluginManifest.ts` em `packages/core`, `registry-resolver.ts`), 1 DELETE (`apps/estaleiro/core/src/manifest.ts`), 5 EDIT (`apps/estaleiro/core/src/index.ts:2`, 5 port files em `apps/estaleiro/core/src/ports/`, 2 test files, `packages/plugin-workflows/src/index.ts:15`, `packages/plugin-workflows/package.json:14-16`). A imprecisão escondeu o escopo do [M1] — worker fez 80%, build ficou 20% quebrado. Track: reendurecer §3 com lista completa CREATE/EDIT/DELETE (tasks/DMM-14.md §3)
- [ ] [i1][DMM-14][plugin-workflows] Cobertura §4 completa: 5/5 tests em `pluginRegistry.test.ts` cobrem os 3 casos exigidos (registrar, resolver, erro) + 2 bônus (resolveByCapability, list). DoD §7 ("Registry resolve por nome") atendido. INFO positivo (packages/core/tests/pluginRegistry.test.ts:13-63)
- [ ] [i2][DMM-14][plugin-workflows] Decoupling pattern OK: `pluginRegistry.ts` é puro, sem import cross-package. `registry-resolver.ts:1` importa `PluginRegistry` type-only. Alinhado com §5 ("NÃO acoplar ao Zen"). INFO positivo (packages/core/src/pluginRegistry.ts + packages/plugin-workflows/src/registry-resolver.ts)
- [ ] [i3][DMM-14][plugin-workflows] `pluginRegistry.ts:7,9` usa `Record<string, unknown>` para `impl` (permissivo). Combinado com cast em `registry-resolver.ts:12`, gera [M3] (cast unsafe). Trade-off: permissividade vs type safety. INFO de design (packages/core/src/pluginRegistry.ts:7,9)
- [ ] [i4][DMM-14][plugin-workflows] `plugin-workflows/package.json:14-16` adicionou `"@plataforma/core": "workspace:*"` em `dependencies` (não devDeps) — correto, `buildHandlerMap` faz parte da API exportada. INFO positivo (packages/plugin-workflows/package.json:14-16)
- [ ] [i5][DMM-14][estaleiro-core] `apps/estaleiro/core/src/index.ts:2` re-exporta `PluginManifest` de `@plataforma/core` (mantém compatibilidade de import). Spec §3 não mencionou, mas defensável. INFO positivo (apps/estaleiro/core/src/index.ts:2)
<!-- END DMM-14 (R1, REFATORAÇÃO) -->
<!-- DMM-13b (R1, REFATORAÇÃO) -->
- [ ] [m1][DMM-13b][plugin-workflows] `mutations/index.ts:49-54` usa tmpX/tmpY para swap de position via 4 atribuições. Poderia ser swap de objeto, mas `position` é `{x, y}` (não array). Defensável. (packages/plugin-workflows/src/mutations/index.ts:49-54)
- [x] [i1][DMM-13b][plugin-workflows] Header JSDoc do módulo (l. 6-9) documenta invariantes preservadas ("Nenhum nó órfão / Nenhum edge quebrado / Resultado sempre parseável"). Aderente ao §5. INFO positivo. (packages/plugin-workflows/src/mutations/index.ts:1-10)
- [x] [i2][DMM-13b][plugin-workflows] `escapeRegex` (l. 82-84) protege `swapModel` contra caracteres regex no modelId. Aderente. (packages/plugin-workflows/src/mutations/index.ts:82-84)
- [x] [i3][DMM-13b][plugin-workflows/architecture] Funcoes puras (string in, string out), sem imports cross-package, sem acoplamento. Composicao com DMM-13a (encadear N mutacoes) é trivial. INFO positivo. (packages/plugin-workflows/src/mutations/index.ts)
- [x] [i4][DMM-13b][plugin-workflows/test] 10 testes em 3 describe blocks cobrem caso normal, preservacao de outros campos, preservacao de edges, no-op para id inexistente, no-op para modelo nao encontrado, parseabilidade do resultado. INFO positivo. (packages/plugin-workflows/test/mutations.test.ts)
- [x] [i5][DMM-13b][estaleiro/processo] Handover §8 (l. 70-78) bem preenchido pelo worker (claude) com code block de output literal. Padrao aderente (1a vez vista em DMM-*). INFO positivo. (tasks/DMM-13b.md:70-78)
<!-- DMM-13b (R2 — B1 introducido) -->
- [ ] [m2-r2][DMM-13b][estaleiro/processo] Worker (claude) **não rodou `lint` no `finish`** da rework1 (só `tsc --noEmit` + `test` + build implícito). Resultado: B1 (lint regression) só foi pego pelo reviewer R2. Padrão P-004 do CLAUDE.md violado; é exatamente o que a regra de 2026-07-06 ("lint entrou no gate") visa eliminar. Track: reforçar `executar-task` skill para LEMBRAR o worker do gate triplo `pnpm --filter <pkg> build && test && lint` antes do `finish`. (log §9 2026-07-09T19:03 + tasks/_pendencias.md EST-09 [i1] mesmo padrão)
- [x] [i1-r2][DMM-13b][plugin-workflows/test] Rework1 adicionou 1 teste (`editPrompt em nó com content: null retorna content original`) que **demonstra** o caso real que B1 evidencia: JDM pode ter `content: null`. O fix do tipo em R2 é correto, não cosmético. INFO positivo. (packages/plugin-workflows/test/mutations.test.ts:220-227)
- [x] [i2-r2][DMM-13b][plugin-workflows/architecture] A separação entre `JdmNode` (modelo) e o cast `as JdmGraph` em `parseContent` é uma escolha deliberada que mantém o módulo puro (sem zod, sem class-validator). B1 só apareceu porque a realidade do JDM é mais permissiva que o modelo — o cast de saída é onde a verdade do runtime "vaza" pro código de produção. Aderente ao §5 "NÃO-FAZER" (sem dep extra). INFO positivo. (packages/plugin-workflows/src/mutations/index.ts:34-36)
<!-- DMM-13b (R3 — APROVADO) -->
- [x] [i1-r3][DMM-13b][plugin-workflows] A escolha de alargar o tipo (`Record<string, unknown> | null`) em vez de narrow via type guard é a mais correta para JDM (formato semi-estruturado). Type guard adicionaria ruído sem ganho. Aderente ao §1 do spec ("Operações de mutação: swap de nós, alteração de prompts de sistema, troca de modelo"). INFO positivo. (packages/plugin-workflows/src/mutations/index.ts:25)
- [x] [i2-r3][DMM-13b][estaleiro/processo] Commit `e481acd` authored por `Israel Zen Gianesini <israel.gianesini@gmail.com>` (humano) — não pelo worker script. Intervenção manual para destravar a fila é justificável (B1 era trivial, 1 linha, e o ciclo worker→rework→review consumiria mais tokens do que o humano corrigir direto). Track: o sistema permite override humano em casos óbvios; padrão emergente a documentar. (commit e481acd)
<!-- END DMM-13b -->
<!-- DMM-15 (R1, REFATORAÇÃO) -->
- [ ] [m1][DMM-15][plugin-workflows/spec] Spec §3 lista só 1 CREATE (impl de StepQueue durável) + 1 CREATE (teste) mas o escopo real do diff é 17 arquivos: 5 CREATE (`durableQueue.ts`, `durableQueue.poc.test.ts`, deps em `package.json`, 4 outras deps em estaleiro), 12 EDIT (4 em plugin-workflows types/orchestrator/index/package, 7 em apps/estaleiro core/ui, 1 em scripts/estaleiro-standalone.mjs). A imprecisão escondeu o [M3] (deleção de onStep/WorkflowEvent) e mudanças em server.mjs. Track: reendurecer §3 com lista completa CREATE/EDIT/DELETE (tasks/DMM-15.md §3)
- [ ] [m2][DMM-15][plugin-workflows] Spec §3 linha 36 diz "path a fixar no endurecimento" para a impl durável. Worker fixou em `packages/plugin-workflows/src/durableQueue.ts` (canônico, adjacente a `queue.ts` in-memory). INFO positivo (packages/plugin-workflows/src/durableQueue.ts)
- [ ] [m3][DMM-15][plugin-workflows/spec] Spec §6 menciona "transporte de passos" via "canais efêmeros (packages/transport)". O impl atual **não usa** transport — a fila pendente vive em memória (`private pending: Step[] = []`). "Canais efêmeros" = só a fila in-memory. Defensável pela §6.3, mas a terminologia da spec confunde o leitor. Track: clarificar §6.3 (tasks/DMM-15.md §6)
- [ ] [i1][DMM-15][plugin-workflows] Cobertura §4 (FIFO + reconstrução): test 1 cobre FIFO ✅; tests 2-3 cobrem reconstrução **intra-sessão** (vide [M2] do parecer); §7 "ordem preservada" coberta; "sobrevive a restart" NÃO coberta (subsumida por [M1]). INFO parcial (packages/plugin-workflows/poc/durableQueue.poc.test.ts:39-127)
- [ ] [i2][DMM-15][plugin-workflows] Decoupling pattern OK: `durableQueue.ts` recebe `StoragePort`/`ClockPort`/`RandomPort`/`creds` por DI. Sem import cross-package fora de `@plataforma/core` e `@plataforma/crypto`. Alinhado com §5 ("NÃO acoplar o orquestrador a esta impl"). INFO positivo (packages/plugin-workflows/src/durableQueue.ts:17-22)
- [ ] [i3][DMM-15][plugin-workflows] `DurableStepQueue.pendingCount: number` getter exporta observabilidade mínima (subsitui parcialmente `onStep`). INFO positivo (packages/plugin-workflows/src/durableQueue.ts:163-165)
- [ ] [i4][DMM-15][plugin-workflows] Reuso correto de primitivas: `insertNode`, `getLineage`, `signNode`, `hashNode`, `migrateSchema`, `ULIDFactory`, `HybridLogicalClock` importados de `@plataforma/core` (sem reimplementação). Consistente com §5. INFO positivo (packages/plugin-workflows/src/durableQueue.ts:4)
- [ ] [i5][DMM-15][estaleiro] Estaleiro simplificado: `server.mjs` perdeu o `createHarnessWsBridge` setup (DMM-07); `scripts/estaleiro-standalone.mjs` perdeu a cópia do dist para `coreNodeModules`. Defensável pela §6.2 (Estaleiro usa SqliteStorage nativamente). Mas o diff stat inclui arquivos como `harness-ws.ts` (62 linhas) como "deletados" — enganoso: DMM-15 base (`0570e8b` DMM-05) **não tinha** esses arquivos (DMM-07 merged depois). Merge vai manter master's version. Verificar no merge real. INFO (apps/estaleiro/server.mjs + scripts/estaleiro-standalone.mjs)
- [ ] [i6-r2][DMM-15][plugin-workflows/architecture] R2 reviewer observou (reproduzindo o [M1]): fix do restart em `entity_heads` (L88) precisa de coerência com `entity_members` (L83-86) — ambas as inserções usam `[signed.id, signed.id]`. Decidir qual é o `entity_id` canônico para workflows no CRDT: `workflowId` (string) ou `signed.id` (ULID). Se for workflowId, as DUAS inserções (`entity_members` E `entity_heads`) devem usar workflowId como `entity_id`. Se for signed.id, a query do `getLineage` (L56-58, que filtra por `workflowId`) precisa mudar. Documentar a decisão na rework. (packages/plugin-workflows/src/durableQueue.ts:78-90)
<!-- END DMM-15 (R1, REFATORAÇÃO) -->
<!-- DMM-15 (R2, REFATORAÇÃO confirmada) -->
- [x] [i1-r2][DMM-15][plugin-workflows] R2 reviewer (minimax) reproduziu o bug M1 com sonda independente (probe close+reopen). Veredito = R1: REFATORAÇÃO. Concordância total; transição `request_changes` completada por R2 após R1 ter travado. (log §9 2026-07-09T21:35)
- [x] [i6-r2][DMM-15][plugin-workflows/architecture] **RESOLVIDO no rework (commit 9b2e20c):** decisão foi a **opção (a) RECOMENDADA pelo R1** — `entity_id = workflowId` em **ambas** as tabelas (`entity_members` L85 E `entity_heads` L89). A coerção do `getEntityId()` continua via `parentId → entity_id` (linhagem do ROOT). Mais simples, mais consistente. Aderente ao ADR 0014. (packages/plugin-workflows/src/durableQueue.ts:85,89)
<!-- END DMM-15 (R2, REFATORAÇÃO confirmada) -->
<!-- DMM-15 (R3, APROVADO) -->
- [x] [i1-r3][DMM-15][plugin-workflows] O fix de M1 é **cirúrgico e simétrico**: 2 colunas, 2 linhas (`[signed.id, signed.id]` → `[signed.id, workflowId]` em L85; `[signed.id, signed.id, ...]` → `[workflowId, signed.id, ...]` em L89). Sem refator, sem mudança de schema, sem migração. 1 commit, 26 linhas. Cumprimento exemplar do "cite a fonte ou escale". INFO positivo. (packages/plugin-workflows/src/durableQueue.ts:85,89 + commit 9b2e20c)
- [x] [i2-r3][DMM-15][plugin-workflows/test] O novo test "sobrevive a restart real" é **o teste que deveria ter existido desde R1**. A cobertura anterior (5 testes) era intra-sessão; o `walCheckpoint+close` na mesma sessão não prova durabilidade cross-sessão. O fix do M1 + esse novo test estabelecem o ciclo "test → bug → fix → test" que o §4 da spec implicitamente exigia ("Métrica: durabilidade — estado reconstruído do grafo"). INFO positivo. (packages/plugin-workflows/poc/durableQueue.poc.test.ts:127-150)
- [x] [i3-r3][DMM-15][plugin-workflows/architecture] Handover §8 do rework **é honesto sobre o que mudou**: §6 (Event Sourcing) justifica a remoção de `onStep`/`WorkflowEvent` ("zero consumers"), §5 (não-mexer-contrato) é violado "no espírito" mas com justificativa rastreável. M3 do R1 é resolvido por **documentação**, não por re-add de código morto. Decisão correta. INFO positivo. (tasks/DMM-15.md:75-78 Handover §8 rework M1+M2+M3)
- [x] [i4-r3][DMM-15][plugin-workflows] Sondagem independente de 4 probes R3 (incluindo isolamento de 2 workflows no mesmo dbPath + verificação de que pending é efêmero) **não descobriu nenhum bug novo**. M1/M2/M3 todos resolvidos; invariantes §5/§6 preservadas. Trabalho do rework é completo. INFO positivo. (probe deletado após verificação; logs em `.dmm15-evidence/r3-probe.log`)
- [ ] [i5-r3][DMM-15][estaleiro/processo] R1 travou antes de chamar `request_changes` (status ficou `in_review` órfão); R2 destravou chamando o transition. R3 herdou a task em `rework` → `review` (após o rework concluir) sem o mesmo tipo de gap. Track: o `agile-reviewer` subagent deveria ser mais robusto a crashes — talvez um wrapper que captura o `request_changes` em uma transação atômica com a escrita do parecer. Cosmético, não-bloqueante. (log §9 DMM-15 2026-07-09T18:27 + 21:35)
- [ ] [m4-r3][DMM-15][core/spec] **PRE-EXISTING master bug, NÃO causado por DMM-15.** `packages/core/tests/schema.test.ts:141` (test 7: "Índices existem") falha em master: esperado 8 índices, recebido 10 (extras: `idx_agent_traces_run`, `idx_agent_traces_task`). Causa: DMM-11 adicionou a tabela `agent_traces` com 2 índices em `schema.ts` mas não atualizou a lista esperada em `schema.test.ts`. Verificado em `master~1` (antes do merge de DMM-15) — mesma falha, mesmo diff. **Ação:** fix de 1 linha em `schema.test.ts:142-149` (adicionar os 2 índices), ou followup DMM-11b. Track: **NÃO BLOQUEIA DMM-15** — a falha já estava em master antes do merge, e DMM-15 só adiciona arquivos em `plugin-workflows` (não toca core). R1 e R2 não viram porque rodaram Gate no worktree (base DMM-05, sem DMM-11). (packages/core/tests/schema.test.ts:141 + packages/core/src/schema.ts:88 + commit DMM-11 8800486)
<!-- END DMM-15 (R3, APROVADO) -->
<!-- DMM-12 (R1, REFATORAÇÃO) -->
- [x] [i1][DMM-12][plugin-knowledge/architecture] Spec §1 "Human-in-the-Loop" é respeitada: `approve()` é a única porta de entrada para `writer.write()`. Test 2 (`staging.test.ts:33-52`) prova que `writer.write` é chamado **apenas** após `approve()`. Tests 1, 3, 5 reforçam o isolamento. Aderente ao design do spec. INFO positivo. (packages/plugin-knowledge/tests/staging.test.ts:15-31, 33-52)
- [x] [i2][DMM-12][plugin-knowledge/architecture] `staging.ts:53-67` — double-action guards (re-approve/re-reject) são robustos: `if (prop.status !== "pending") throw` evita mudanças de estado inválidas. Aderente. INFO positivo. (packages/plugin-knowledge/src/staging.ts:53-67)
- [x] [i3][DMM-12][plugin-workflows/architecture] `optimizerNode.ts` é puro (sem I/O), recebe `args` por DI (implícito via closure), retorna `Delta` com `proposals` + `summary`. Composabilidade com o `Orquestrador` (Zen) é trivial — `result.proposals` pode ser encadeado ao `staging.propose()`. Aderente. INFO positivo. (packages/plugin-workflows/src/nodes/optimizerNode.ts:25-113)
- [x] [i4][DMM-12][plugin-workflows/optimizer] 3 branches (loop/stall, error, ok) cobrem o estado do envelope. O caso `tag="no-data"` (l. 86) gera 0 proposals, conforme test 5. `tag="ok"` com envelope vazio também gera 0 (consistente). INFO positivo. (packages/plugin-workflows/poc/optimizer.poc.test.ts:56-66)
- [ ] [m1][DMM-12][plugin-knowledge/spec] Spec §3 lista só 2 mudanças (`[UPDATE] plugin-knowledge staging` + `[UPDATE] fluxo do Juiz`). Mas o diff real toca 9 arquivos: `staging.ts` (criado, +85), `types.ts` (novo Proposal+KnowledgeWriter, +14), `index.ts` (re-exports, +3/-2), `writer.ts` (+1 retorno), `staging.test.ts` (criado, +108), `optimizerNode.ts` (criado, +155), `optimizer.poc.test.ts` (criado, +67), `plugin-workflows/src/index.ts` (+2 re-exports), `nodes/index.ts` (+2 re-export). A imprecisão escondeu a adição de tipos/interfaces. Track: reendurecer §3 com lista completa UPDATE/CREATE (mesmo padrão DMM-14 m1, DMM-15 m1). (tasks/DMM-12.md §3 vs diff 5d9c22b+1457b34)
- [ ] [m2][DMM-12][plugin-workflows/integration] `createOptimizerHandler()` não tem DI; o `KnowledgeWriter` (staging) não é injetado no handler. Handler retorna `proposals: OptimizerProposal[]` no Delta, mas a **integração** Optimizer → `staging.propose()` é responsabilidade do Orquestrador (não do handler). Sem o glue code, o handler é só um gerador de strings. Provavelmente é trabalho do DMM-13 (orquestrador de Optimizer → staging). Track: documentar fronteira (responsabilidade do orquestrador futuro). Cosmético, não-bloqueante para DMM-12. (packages/plugin-workflows/src/nodes/optimizerNode.ts:25 + tasks/DMM-12.md §1)
<!-- END DMM-12 (R1, REFATORAÇÃO) -->
<!-- DMM-14 (R2, APROVADO) -->
- [ ] [m1-r2][DMM-14][plugin-workflows/spec] Spec §3 ainda lista só 1 CREATE (`pluginRegistry.ts`) — não foi expandida na rework do R1→R2. R1 [m1] advertia sobre o risco; R2 confirmou que o escopo real é 14 files (1 feat) + 6 files (M1/M2) + 1 file (M3). Repetir o `reendurecer §3` na próxima iteração quando outro refator mover arquivos. (tasks/DMM-14.md §3)
- [ ] [i1-r2][DMM-14][plugin-workflows] Branch `task/DMM-14` está **7 commits atrás de master** (aa2143d vs b4b123d, contém DMM-06 e DMM-07 merges). Gate roda verde na worktree (auto-consistente), mas `worktree.mjs merge` precisará absorver 7 commits de delta. Diff `master..HEAD` mostra `-588` linhas (harness-ws.ts, run-service.ts, dmm-template, etc) que **não estavam** no branch — sinal de que o worker não rebaseou antes do `finish`. Track: spike para auto-rebase-check no `finish` (rework-cycle). (C:/Dev2026/.superapp-worktrees/DMM-14)
- [ ] [i2-r2][DMM-14][plugin-workflows] `registry-resolver.ts:9,12` agora usa `as unknown as Handler` sem comentário explicativo. R1 [M3] opção (a) sugeria "com comentário explicando que o caller é responsável por garantir que `impl[manifest.name]` é um Handler válido". Cast está type-safe, mas o leitor não sabe que `map[manifest.name]` é o impl object (não callable) e que caller DEVE usar `${name}.${key}`. Adicionar comentário antes do próximo push. (packages/plugin-workflows/src/registry-resolver.ts:9,12)
- [ ] [i3-r2][DMM-14][plugin-workflows] Cobertura de teste do `buildHandlerMap` (integration layer entre registry e handler map do orquestrador): 0 testes próprios. Sonda R2 confirmou 4 casos (vazio, single-fn, multi-fn, empty-impl) — mas a sonda foi deletada. Risco futuro: alguém muda o pattern `${name}.${key}` e o teste direto do `pluginRegistry.test.ts` não pega. Track: 1 arquivo de teste em `packages/plugin-workflows/tests/registry-resolver.test.ts` (~30 linhas) quando plugin-workflows ganhar pasta tests/ dedicada. (packages/plugin-workflows/src/registry-resolver.ts)
<!-- END DMM-14 (R2, APROVADO) -->
<!-- DMM-08 (R1, APROVADO) -->
- [ ] [m1][DMM-08][tasks/spec] `tasks/DMM-08.md:47-51` — spec tem **dois** cabeçalhos `## 6. Feedback de Especificação` consecutivos (linha 49 e 51). Duplicação documental; a versão da linha 51 é a "Decisões Arquiteturais Fechadas" enquanto a 49 está vazia. Track: housekeeping — remover uma das duas.
- [ ] [m2][DMM-08][estaleiro-ui] `apps/estaleiro/ui/src/App.tsx:73-75` — `onClick: tab.id === "terminal" ? undefined : undefined` é uma ternária degenerada que sempre resolve para `undefined`. Parece resíduo de tentativa de adicionar um click handler cancelado. Dead code. Track: remover a prop `onClick` por completo.
- [ ] [i1][DMM-08][estaleiro-ui/test] Cobertura: não há teste próprio do `AgentTerminal` no deliverable (a sonda do reviewer foi removida após validar). Para um componente UI novo com `ui: true` faz sentido ter 1–2 testes de smoke (placeholder/empty/filter). Track: opcional — adicionar `__tests__/AgentTerminal.test.tsx` em cleanup.
- [ ] [i2][DMM-08][estaleiro-ui/store] `apps/estaleiro/ui/src/stores/fleet.ts:21-25` — `stream.ts` é `number` mas nem `useAgentStream` nem `AgentTerminal` ordenam por `ts`; a ordem vem da própria sequência de inserção do TinyBase. Track: opcional — ordenar por `ts` no hook se quiser defesa contra eventos fora de ordem.
<!-- END DMM-08 -->
<!-- DMM-11 (R1, REFATORAÇÃO) -->
- [ ] [m1][DMM-11][tasks/spec] `tasks/DMM-11.md:40-42` — spec tem **dois** cabeçalhos `## 6. Feedback de Especificação` consecutivos (linha 40 e 42). Duplicação documental; a versão da 42 é a "Decisões Arquiteturais Fechadas" enquanto a 40 está vazia. Track: housekeeping — remover uma das duas.
- [ ] [m2][DMM-11][estaleiro/processo] Handover §8 linha 67 cita "`$ tsc (Exit 0)`" — **evidência fabricada/stale**. Build está vermelho (2 erros TS2353 em judgeNode.ts:106,143). Re-forçar regra do worker-script: rodar `pnpm --filter <pkg> build && test && lint` em sequência e colar saída literal — o Exit 0 só conta se os 3 passam. Mesmo padrão já visto em EST-19 — ver CLAUDE.md Regra 3 e o caso T-807. (tasks/DMM-11.md:67)
- [ ] [i1][DMM-11][core/schema] Schema v4: `created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)` — gera timestamp em ms, mas o resto do schema usa segundos (convenção `unixepoch()`). Inconsistência menor. Track: padronizar (ms ou s) na próxima migration. (packages/core/src/schema.ts:88)
- [ ] [i2][DMM-11][plugin-workflows/judge] Heurística de loop em `detectLoop` (l. 53-69) — `repeatCount = !ev.ok ? 1 : 0` zera o contador se um comando é bem-sucedido entre repetições. Comportamento provavelmente correto (interrupção "limpa" o loop), mas vale documentar. Track: comentário explicativo no rework. (packages/plugin-workflows/src/nodes/judgeNode.ts:53-69)
<!-- END DMM-11 -->
<!-- DMM-09 (R1, APROVADO) -->
- [ ] [m1][DMM-09][estaleiro-ui/spec] `WorkflowTree.tsx:30` — array `steps` é **hardcoded** com 4 plugins (`plugin-ingress`, `plugin-architect`, `plugin-explorer`, `plugin-editor`). A spec §1 diz "renderiza a árvore JDM" (genérico) e a impl parsea `graph.content` (L17-23) mas **ignora o resultado** e usa o hardcoded. Se o workflow DMM-06 crescer (ex.: `plugin-reviewer`), o WorkflowTree não refletirá o grafo real. Aceitável p/ v1 (escopo §1 "4 estágios conhecidos"), mas é dívida para o spike "WorkflowTree dinâmico" se/quando o grafo crescer. Track: spike ou refinamento de UX (tasks/DMM-09.md §1 + WorkflowTree.tsx:30)
- [ ] [m2][DMM-09][estaleiro-ui/hooks] `useExecutionNodes` reconstrói o `Map<string, ExecutionNode>` a cada render (não é `useMemo`). Causa re-render do consumer toda vez que o store atualiza, mesmo quando o conteúdo é o mesmo. Aceitável p/ v1 (lista de tasks pequena), mas vale `useMemo([storeVersion])` ou retornar rows raw e memoizar no consumer. Track: opcional, não bloqueia (apps/estaleiro/ui/src/views/execution/hooks.ts:46-56)
- [ ] [i1][DMM-09][estaleiro-ui/spec] Spec §3 linha 31 declara `apps/estaleiro/ui/src/views/board/Card.tsx` mas o arquivo real é `BoardCard.tsx` (já existia em EST-14b). Worker usou o filename real, mas a spec drift é recorrente (4º achado do padrão em 3 tasks consecutivas: DMM-14 m1-r1, m1-r2, DMM-09 m1/i1). Track: spike "spec §3 auto-validate via ls" (script que roda `git grep` no `master` para listar os filenames esperados e flag divergences). Moveria o pattern do ledger de pendências por task para um cleanup consolidado. (tasks/DMM-09.md §3 linha 31)
- [ ] [i2][DMM-09][estaleiro-ui/app] `App.tsx:29` — typo cosmético: cast `as Parameters<typeof dispatchFleetEvent>[0]` no dispatch do `dispatchExecutionEvent` (deveria ser `dispatchExecutionEvent`). Funcionalmente correto (ambos recebem `AgentWsEvent`) mas o leitor fica confuso. Track: trocar para `as Parameters<typeof dispatchExecutionEvent>[0]` (~1 char de diff). (apps/estaleiro/ui/src/App.tsx:29)
- [ ] [i3][DMM-09][estaleiro-ui/test] Smoke test (`tests/smoke.test.ts`) cobre só "pacote é importável" — não renderiza o WorkflowTree. Spec §4 permite "OU verificação manual do revisor" e esta revisão manual foi feita. Mas para builds futuros, vale considerar teste de render mínimo com `@testing-library/react` (já presente em PlannerView.test.tsx). Track: 1 arquivo `tests/execution/WorkflowTree.test.tsx` (~30 linhas, renderiza com `currentNodeId` e assere `data-node-id` + classe `active`). (apps/estaleiro/ui/tests/smoke.test.ts:1-8)
- [ ] [i4][DMM-09][estaleiro-ui/process] Branch `task/DMM-09` está **2 commits atrás de master** (fbb8d45 vs d5de438, contém DMM-08 e DMM-14 merges). Gate roda verde na worktree (auto-consistente), mas `worktree.mjs merge` precisará absorver 2 commits de delta. Diff `master..HEAD` mostra -318/+354 — o `-318` é o custo de DMM-08 (terminal panel) e DMM-14 (PluginRegistry), que NÃO estavam no branch. Mesmo padrão de DMM-14 R2 [i1-r2] — sinal de processo a cobrar. Track: spike "auto-rebase-check no `finish`" (rework-cycle). (C:/Dev2026/.superapp-worktrees/DMM-09)
- [ ] [process][DMM-09][estaleiro-ui/process] Handover §8 vazio pelo worker (achado processual, não-bloqueante — §9 log cobre o resumo). Vale reforçar no template de tasks UI que §8 deve ser preenchido pelo worker antes de `finish`. (tasks/DMM-09.md §8)
<!-- END DMM-09 (R1, APROVADO) -->
<!-- BEGIN DMM-12 (R2, REFATORAÇÃO) -->
- [ ] [m1][DMM-12][plugin-knowledge/spec] Spec §3 declara 2 arquivos (staging plugin-knowledge + fluxo juiz) mas a entrega tocou 9 arquivos: `staging.ts`, `types.ts`, `index.ts`, `writer.ts`, `tests/staging.test.ts` (plugin-knowledge) + `optimizerNode.ts`, `poc/optimizer.poc.test.ts`, `nodes/index.ts`, `index.ts` (plugin-workflows). Mesmo padrão de scope drift de DMM-14/DMM-15. Track: endurecedor de spec deve exigir lista enumerada + flag de divergência em `finish`. (tasks/DMM-12.md §3 linha 27-28)
- [ ] [m2][DMM-12][plugin-workflows] Integração `Optimizer → staging` é responsabilidade do **orquestrador** (DMM-13) — handler de `optimizerNode` apenas retorna `Delta` com `proposals`; quem chama `staging.propose()` é a chain. Confirmar em revisão de DMM-13 que a chain Juiz→Optimizer→Staging está wirada. (packages/plugin-workflows/src/nodes/optimizerNode.ts:106-111)
- [x] [i1-r1][DMM-12][plugin-knowledge] Optimizer retorna 1 proposta por default (mesmo com score `ok` e envelope vazio — gera `optimization-suggestions.md` como "preventiva"). Spec §1 diz "baseado nas falhas rastreadas" — proposals com tudo-OK não são "falhas". Worker escolheu incluir como contínua melhoria; aceitável. INFO. (packages/plugin-workflows/src/nodes/optimizerNode.ts:87-104)
- [x] [i2-r1][DMM-12][plugin-knowledge] `details` é tipado como `unknown[]` no Optimizer; cast `as string[]` no L30 sem guard. Risco de runtime se Juiz mandar números/objetos. Spec §1 não exige guard. INFO — DMM-11 é dono do contrato. (packages/plugin-workflows/src/nodes/optimizerNode.ts:30)
- [x] [i3-r1][DMM-12][plugin-knowledge] Migration v1 hardcoded em `MIGRATIONS` array. Sem mecanismo de versionar para v2+; quando entrar nova coluna, vai precisar de `version: 2` + ALTER. INFO — `SqliteStorage` de DMM-15 já implementa; reuso OK. (packages/plugin-knowledge/src/staging.ts:12-14)
- [x] [i4-r1][DMM-12][plugin-knowledge] IIFE `void (async () => {...})()` no init do `makeStaging` não tem tratamento de erro — se `storage.migrate()` falhar, exception é engolida. Aceitável (a proposta só é gravada depois via `INSERT` que também vai falhar), mas padrão merece log. (packages/plugin-knowledge/src/staging.ts:75-92)
<!-- BEGIN DMM-13a (R1, REFATORAÇÃO) -->
- [x] [M1][DMM-13a][plugin-dispatcher] `worktreePaths.get(variant.id)!` usa non-null assertion proibida pelo lint (`@typescript-eslint/no-non-null-assertion`). ✅ RESOLVIDO no rework R2: refator estrutural introduziu `type PendingVariant = { variant; worktreePath }` e `pending: PendingVariant[]` carrega ambos os campos juntos. `runBatch` recebe `PendingVariant[]` em vez de `Map.get().!`. O `!` desapareceu da origem. Commit `13c1809`. (packages/plugin-dispatcher/src/lab/lab.ts:72, 119-152)
- [ ] [i1][DMM-13a][plugin-dispatcher] `branchName` interpolado direto em `execSync` (lab.ts:19,27) sem escape. Variants vêm do Algoritmo Genético (DMM-13b, trusted), mas vira shell injection se o input virar menos confiável. Sugestão: regex `/^[A-Za-z0-9._-]+$/` em `variant.id` antes do uso. (packages/plugin-dispatcher/src/lab/lab.ts:19,27)
- [ ] [i2][DMM-13a][estaleiro/processo] Gate de Evidência incompleto: o Handover §8 colou apenas `pnpm test`. Build (tsc) e lint não foram rodados pelo worker — ambos falham. Gate de Evidência (CLAUDE.md §6 Regra 3) exige os 3 comandos. Track: worker-script/spec deve LEMBRAR o worker a colar `build` + `test` + `lint` no `finish`. (tasks/DMM-13a.md:77-86)
<!-- END DMM-13a (R1, REFATORAÇÃO) -->
<!-- DMM-13c -->
- [ ] [m1][DMM-13c][plugin-dispatcher] `fitness.ts:164` — o parâmetro `variant: FitnessVariant` é tipado mas não é lido dentro da função. Para v1 com caller controlado isso é ok (a função é pura sobre traces), mas o nome do model já está previsto na interface `FitnessVariant.model` para futura correlação com provedor (decisão §6.2 "Observabilidade de Provedores"). Sugestão: ou documentar a omissão no JSDoc, ou estender a função com um hook de "custo por modelo" no rework de DMM-13a. Não-bloqueante — caller de DMM-13a vai definir o uso real. (packages/plugin-dispatcher/src/lab/fitness.ts:164)
- [ ] [i1][DMM-13c][plugin-dispatcher/spec] A leitura "lidos de JSON/TipiBase" da §6.1 ficou para o caller (runLab) — não dentro de `fitness`. Rastreabilidade: `fitness.ts:39-44` exporta `DEFAULT_WEIGHTS` e `normalizeWeights()` para o caller montar a config externa. Spec não exigia que `fitness` em si lesse de disco; é uma decisão de design saudável (função pura é mais testável). Sugere-se abrir task de UI/config (load de TipiBase) que não está no escopo desta logic_agent. (packages/plugin-dispatcher/src/lab/fitness.ts vs tasks/DMM-13c.md §6.1)
- [ ] [i2][DMM-13c][plugin-dispatcher/processo] `pnpm-lock.yaml` perdeu 3 linhas no diff do branch (resolvido automaticamente no merge com WIP de cobertura já no master). Sem impacto funcional — gate rodou sem warnings na worktree. INFO operacional — registrar a reconciliação para auditoria futura. (packages/plugin-dispatcher + pnpm-lock.yaml)
- [ ] [spec→DMM-13-followup] [DMM-13c][plugin-dispatcher/spec] §6.2 "Ranking View e Observabilidade de Provedores" promete Dashboard Dedicado com Gráficos de Teia/Radar e correlação modelo→provedor. DMM-13c é `target_agent: logic_agent` — não entrega UI. Spec nasceu com escopo de frontend embutido em task de lógica. Track: arquiteto decompor §6.2 em task dedicada de frontend (ex.: `DMM-13d-dashboard` ou `EST-XX`) antes do rework de DMM-13a (que vai consumir `fitness` e expor para a view). (tasks/DMM-13c.md §6.2)
<!-- END DMM-13c -->
<!-- EST-20 -->
- [ ] [m1][EST-20][estaleiro/test] `server.test.ts` cobre só o happy-path do broadcast (msg com `type` → broadcast). Spec §4 pede "100% da lógica de broadcast" mas o deliverable test não exercita: `if (msg?.type)` falso, `try/catch` de JSON.parse inválido, ou a interação real do `harnessBridge`. **Mitigado em fato**: 4 sondas adversariais do reviewer (msg sem `type`, JSON inválido, ausência de eco, export `harnessBridge` não-nulo) provaram o comportamento — todas passaram. Track: adicionar 2-3 casos ao `server.test.ts` num rework de cobertura, ou criar task follow-up. Não bloqueia o merge. (apps/estaleiro/tests/integration/server.test.ts:16-50)
<!-- END EST-20 -->
<!-- EST-21 -->
- [ ] [i1][EST-21][plugin-tasks] Spec §2/§5 pedem "reutilizar SQLite existente de `@plataforma/core`" mas §3 fixa a assinatura como `db: import("better-sqlite3").Database` — escolha literal levou a adicionar `better-sqlite3` como dep direta e remover o workspace dep legado `@plataforma/estaleiro-core` (zero imports em `plugin-tasks/**`, então sem efeito prático). Worker implementou a spec literalmente. Se a intenção real era forçar consumo via `core` (wrapper que re-exporta o tipo), é decisão de arquiteto — não defeito de impl. Track: ou (a) alinhar spec com a dep real (admitir `better-sqlite3` direto), ou (b) criar task para fazer `core` re-exportar o tipo e ajustar imports. (packages/plugin-tasks/package.json:18-20, packages/plugin-tasks/src/storage/sqlite.ts:1)
<!-- END EST-21 -->
<!-- EST-22 -->
- [ ] [i1][EST-22][estaleiro/bootstrap] A checagem `if (!resolved.startsWith(normalize(uiDirPath)))` em `serveUiFile` é **redundante**: o `new URL(req.url ?? "/", ...)` no topo da função já normaliza `..` antes de chegar ao check, então `startsWith` nunca dispara. Defesa contra path traversal está garantida **acidentalmente** pela normalização do WHATWG URL, não pelo `startsWith` em si. Não há vetor explorável real (clientes HTTP padronizados enviam paths já normalizados), mas o check é dead code. Track: ou (a) remover o check morto, ou (b) substituí-lo por um check em `req.url` **antes** do URL constructor (defesa em profundidade). (apps/estaleiro/core/src/bootstrap.ts:230)
<!-- END EST-22 -->
<!-- EST-24a -->
- [x] [m1][EST-24a][estaleiro/factory] Test #7 (`propaga sinal de abort para tools e runner`) só assserta `runMock.toHaveBeenCalled()` — o que vale para qualquer chamada. ✅ RESOLVIDO em `469f219` (rework): asserção trocada para `objectContaining({ signal: ac.signal })` + teste renomeado para "propaga sinal de abort **do factory** para o runner". Cobre o contrato de propagação end-to-end. (apps/estaleiro/core/tests/factory.test.ts:174-186)
- [ ] [i1][EST-24a][estaleiro/factory] `bashTimeoutMs` em `AgentRuntimeOptions` (factory.ts:20) é o timeout do `makeTools` (plugin-fs-tools), não do `BashPort` em si. A propagação está correta (factory.ts:43 → makeTools), mas a nomenclatura pode confundir caller — sugerir renomear para `toolsBashTimeoutMs` em uma task futura. (apps/estaleiro/core/src/factory.ts:20,43)
<!-- END EST-24a -->
<!-- EST-28 -->
- [ ] [i1][EST-28][plugin-tasks] `hasLintEvidence = />\s*pnpm.*lint/i` casa com qualquer texto que tenha `pnpm ... lint` — inclusive comentário tipo `> pnpm lint não rodou (pule)`. Tightening futuro: exigir marcador de sucesso (`0 errors`, `0 problems`, exit 0). Não-bloqueante — fraude é responsabilidade do worker + auditoria do reviewer, não do guard. (packages/plugin-tasks/src/guards/evidenceGuard.ts:19)
- [ ] [i2][EST-28][plugin-tasks] Mensagem de erro `test/lint` (junção via `/` dos faltantes) é ambígua de ler mas inequívoca de casar. Documentar no JSDoc do `assertEvidencePresent` que o separador é `/` entre os faltantes. (packages/plugin-tasks/src/guards/evidenceGuard.ts:20-26)
<!-- END EST-28 -->
<!-- EST-27 -->
- [ ] [i1][EST-27][plugin-dispatcher] `actorFromModel` faz `model.lastIndexOf('/')`; se o model chegar sem `/` (ex.: `"minimax-m3"` puro) o actor vira o nome inteiro. Se esse nome coincidir com um harness (ex.: `"opencode"`), o `assertValidModelIdentity` do plugin-tasks (EST-28) vai bloquear. Não-bloqueante — formato canônico é `provider/modelo`. (packages/plugin-dispatcher/src/dispatcher.ts:23-26)
- [ ] [i2][EST-27][plugin-dispatcher] `worktreePath` hardcoda `C:\Dev2026\.superapp-worktrees\${taskId}` (mesma fragilidade já registrada em EST-07 i1 e EST-22 i1). Spec §3 não pede abstrair; teste só verifica substring. Não-bloqueante — candidato a task transversal de cleanup. (packages/plugin-dispatcher/src/dispatcher.ts:28-30)
<!-- END EST-27 -->
<!-- EST-32 -->
- [ ] [i1][EST-32][estaleiro-core] §4 da spec menciona "Ingress→Explorer/Editor→terminal" mas os 8 testes do `workflow-runtime.integration.test.ts` usam handlers sintéticos (`step1/step2/step3`); o composer real (Ingress→Architect→Explorer→Editor de EST-24b) tem cobertura própria em `workflow-composer.test.ts` (10 testes). Cobertura existe, só está em outro arquivo. Não-bloqueante — decisão de cobertura, não defeito. (apps/estaleiro/core/tests/workflow-runtime.integration.test.ts:1-200, apps/estaleiro/core/tests/workflow-composer.test.ts:1-200)
<!-- END EST-32 -->
<!-- EST-34 -->
- [ ] [M1][EST-34][repo-raiz] `rewrite.js` — script de scratch (extração de interfaces via regex) esquecido na raiz do repo, untracked, fora do escopo §3. Deletar antes de commitar; risco de `git add -A` incluí-lo. (rewrite.js)
- [ ] [m1][EST-34][design-system-showcase] `main.tsx` alterado (non-null assertion em `getElementById('root')!`) — fora do escopo de EST-34, provável correção incidental durante troubleshooting do build. Reverter ou extrair para task própria. (apps/design-system-showcase/src/main.tsx)
- [ ] [m2][EST-34][estaleiro-ui] `tests/smoke.test.ts` teve timeout aumentado para 15000ms — fora do escopo §3, parece fix de flakiness não relacionado ao ciclo. Documentar ou reverter. (apps/estaleiro/ui/tests/smoke.test.ts)
- [ ] [m3][EST-34][estaleiro-contracts] `package.json` lista `@plataforma/core` em `dependencies` (runtime) mas o único uso é `import type { PluginManifest }` — spec pedia zero deps de runtime. Mover para `devDependencies`. (packages/estaleiro-contracts/package.json)
- [ ] [i1][EST-34][estaleiro/processo] Critério "EST-33 (E2E) continua passando" não verificável nesta worktree — EST-33 está `blocked`, nunca foi mergeada em master, então `apps/estaleiro/e2e/` não existe na branch `task/EST-34`. Esperado pela ordem real de dependência; verificar quando EST-33 retomar contra o core corrigido. (tasks/EST-33.md)
- [ ] [i2][EST-34][estaleiro-contracts] Escopo efetivo extraiu também `NetworkPort`/`StorePort` além das portas listadas explicitamente na spec §3 — interpretação razoável, não é problema. (packages/estaleiro-contracts/src/index.ts)
<!-- END EST-34 -->
<!-- EST-33 -->
- [ ] [M1][EST-33][estaleiro] `apps/estaleiro/e2e-test.db`/`-shm`/`-wal` (artefatos do Playwright) não estão no `.gitignore` — já foram commitados por engano uma vez (removidos em d42610f); risco de recorrência com `git add -A`. Adicionar `apps/estaleiro/e2e-test.db*` ao `.gitignore`. (.gitignore)
<!-- END EST-33 -->
<!-- T-1052 -->
- [ ] [m1][T-1052][spike/estaleiro-standalone] §8 imprime "esbuild script: ~180 lines" mas `spike/esbuild-bundle.mjs` tem 333 linhas reais. Corrompe o argumento "esbuild reduz a fragilidade" do ADR-0012 (spike/esbuild-bundle.mjs:332)
- [ ] [i1][T-1052][spike/sqliteWasm.worker] wa-sqlite* marcados `external` no metafile; para a sonda browser do rework resolver, vai precisar import-map ou cópia local em `bundle/`. Pré-requisito, não defeito (spike/esbuild-bundle.mjs + bundle/sqliteWasm.worker.js:2-4)
- [ ] [i2][T-1052][estaleiro/server] `bundle/server.mjs:38075` faz `var UI_DIR = fileURLToPath(new URL("./ui/", import.meta.url))` mas `apps/estaleiro/ui/` não é copiado pela spike. §4.1 só bate em `/api/tasks`; qualquer GET não-`/api/*` recebe 404. Dívida para a task de implementação do ADR (bundle/server.mjs:38075)
- [ ] [i3][T-1052][spike/esbuild-bundle] `spike/esbuild-bundle.mjs:199,217` usa `npm install` (não pnpm) no artefato. §0 fixa pnpm@11.1.2 só para a raiz do superapp; artefato isolado em C:\tmp é runtime separado. Sem impacto no veredito — observação para a task de implementação considerar unificar o PM
- [ ] [i4][T-1052][spike/verify-bundle] Filtro de §4.5 (`spike/`, `package.json`, `pnpm-lock.yaml`) é prova honesta de no-touch em produção. Cobertura adequada, só registro (spike/verify-bundle.mjs:185-191)
<!-- END T-1052 -->
<!-- EST-37 (R1, REFATORAÇÃO) -->
- [ ] [m1][EST-37][estaleiro-core] Smoke emite warning em stderr (`[smoke] ignorando diretório não-semver: ...`) mas nenhum teste asserta o conteúdo. Spec §5.5 ("Assert pós-run que stderr do subprocesso contém a string 'selecionado' ou similar") não foi fechada. Track: dentro do rework do M2, capturar stderr do subprocesso do smoke e assertar `stderr.includes("ignorando")` para o caso 7 (mistura com `latest/`) (apps/estaleiro/tests/estaleiro-smoke.mjs:72)
- [ ] [i1][EST-37][estaleiro-core] Re-implementação de `selectVersion` em `smoke-semver.test.ts:25-37` duplica a lógica do smoke. Se a função real do smoke divergir, o teste ainda passa. Track: extrair `compareSemver` para `apps/estaleiro/tests/_smver.mjs` e importar tanto no smoke quanto no teste (apps/estaleiro/core/tests/smoke-semver.test.ts:25-37 vs apps/estaleiro/tests/estaleiro-smoke.mjs:13-20)
- [x] [i2][EST-37][estaleiro-core/processo] Handover §8 (f) diz "Worktree limpa" mas `git status` da worktree após a suíte mostra 3 untracked files (`test-est-37-2.db*`). Afirmação contraditória com a realidade observada pelo reviewer. Track: atualizar o item (f) do handover para refletir os untracked, ou limpa-los (vinculado ao M1 do parecer) (tasks/EST-37.md:278) — ✅ RESOLVIDO em R2 (commit `b46cc09`): caso 3 com try/finally + stopServer().catch(() => {}), worktree agora limpa após suíte.
<!-- EST-39 (R1, REFATORAÇÃO) -->
- [ ] [m1][EST-39][estaleiro-core] Cast `(taskService as TaskServicePort & { _storage?: typeof storage })._storage = storage` virou incondicional (sem `if (opts.tasksDir)`) em `bootstrap.ts:45`. Comportamento correto, mas o cheiro do cast continua (já em i1[EST-36] no ledger). Readequação depende da transação genérica do `StorageBackend` (explícita como fora-de-escopo na §6.2 da spec EST-36). Track: cosmético, não-bloqueante; item i1[EST-36] do ledger continua aberto para cleanup futuro (apps/estaleiro/core/src/bootstrap.ts:45)
<!-- END EST-39 -->
<!-- EST-41 (R1, REFATORAÇÃO) -->
- [ ] [m1][EST-41][estaleiro/processo] Handover §8 lista 4 comandos do Gate de Evidência; spec §7 lista 5 (inclui `pnpm --filter @plataforma/estaleiro test:e2e`). Worker omitiu e2e do Handover sem flag de BLOCKER DE AMBIENTE. Viola a regra "Marcar `[x]` sem evidência é violação" da spec §7. Track: processo — worker deve rodar o gate completo e colar saída literal. Não-bloqueante individualmente; vira bloqueante se combinado com o M1 do parecer (e2e falhando). (tasks/EST-41.md:124-131)
- [ ] [i1][EST-41][estaleiro-core] `createOpenAI({ ..., compatibility: "compatible" })` em `provider-probe.ts:47` é flag explícito do `@ai-sdk/openai@1.x` que força modo "compatible" (vs "strict") — coerente com spec §6.2 "OpenAI-compatible". Sem `compatibility: "compatible"` o adapter emite headers OpenAI-only que DeepSeek rejeita. INFO positivo — comportamento correto por design. (apps/estaleiro/core/src/provider-probe.ts:47)
<!-- END EST-41 -->
<!-- EST-41 (R2, APROVADO) -->
- [ ] [m1→R2][EST-41][estaleiro/processo] **Continuação da m1 de R1** (mesmo achado de processo, agora pós-rework). Worker reverteu M1 (path injection standalone) e M2 (provider routes tests) com sucesso — gate verde (build/test/lint/integration 15/15/e2e 3/3) — mas **NÃO atualizou o Handover §8** com entrada de rework. §8 continua com o handover original da R1 (sem e2e); §7 da spec exige os 5 comandos colados. Após rework, deveria existir um parágrafo "Handover do Executor (rework)" com saída literal dos 5 comandos (incluindo `test:e2e` agora verde). O log §9 registra `[Finalizado]` em 2026-07-14T00:49 mas o Handover ficou stale. Veredito R2 = APROVADO (M1 e M2 técnicos resolvidos); este item é puramente de processo. Track: cosmético; revisar template de rework-task para exigir atualização do Handover antes do `finish`. (tasks/EST-41.md:124-131)
<!-- END EST-41 R2 -->
<!-- END EST-37 -->
<!-- T-DS-01 (R1, REFATORAÇÃO) -->
- [x] [m1][T-DS-01][design-system/processo] Handover §8 não lista `pnpm --filter @plataforma/design-system lint` apesar de (a) spec §7 Reviewer Checklist exigir e (b) CLAUDE.md Regra 3 tornar lint parte do gate desde 2026-07-06. A omissão é o que permitiu M4 (unused var `TOKENS_DIR`) passar despercebido. Track: processo — worker deve rodar o gate completo (3 comandos da §7 + lint) e colar saída literal. (tasks/T-DS-01.md:103-107) — ✅ RESOLVIDO em R2: worker adicionou bloco "Evidência gate" no §9 (linhas 237-249) com saída literal de `lint` (exit 0). Handover §8 continua stale mas a evidência está em seção apropriada.
- [x] [m2][T-DS-01][design-system/processo] Handover diz "incluindo 6 novos para tokens" mas o test file tem 5 tests (não 6) e os 5 não rodam (M3 do parecer). Count incorreto. Track: numeração, não-bloqueante; vira bloqueante se o rework introduzir novos tests sem mover para `tests/`. (tasks/T-DS-01.md:107) — ✅ RESOLVIDO em R2: §9 do rework diz "incl 5 novos tokens-build.test.ts" (correto) e `pnpm test` confirma 5 tests novos (48/212, era 47/207).
<!-- END T-DS-01 -->
<!-- T-DS-01 (R2, REFATORAÇÃO) -->
- [x] [m1→R2][T-DS-01][design-system/processo] **Cosmético — Handover §8 ainda stale.** R1 listou que o Handover não refletia o rework. R2: o Handover §8 (linhas 103-107) ainda é o original de R1; o rework do worker foi registrado em §9 (linhas 237-255) em vez de atualizar §8. Funcionalmente a evidência está lá (e o lint passa, m1 do R1 está fechado em conteúdo), mas a forma "canônica" §8 do Handover não foi atualizada. Track: puramente cosmético; revisar template de rework-task para forçar atualização do Handover antes do `finish`. (tasks/T-DS-01.md:103-107) — ✅ RESOLVIDO em R3: R3 é APROVADO, integração segue. Pendência pode ir para cleanup futuro via `/agrupar-cleanup` (template de rework-task não atualizar Handover antes do `finish`).
<!-- END T-DS-01 R2 -->
<!-- T-UIE-01 -->
- [ ] [m1][T-UIE-01][ui-engines] Teste "exports all graph types" é trivial (`typeof mod === 'object'`) porque todos os exports são type-only. Garantia real fica com `tsc` no `build`. Sugestão: asserção textual sobre `src/index.ts` ou `expect-type`. Não-bloqueante: type-check do build cobre. (packages/ui-engines/tests/contracts.test.ts:12-19)
- [ ] [m2][T-UIE-01][ui-engines] Guard de arquitetura cobre as 4 strings da spec (`apps/`, `tinybase`, `plugin-tasks`, `plugin-workflows`) mas ignora a cláusula "ou serviços concretos" da §4.3. Sugestão: regex adicional para `@plataforma/(plugin-*|core|protocol|transport|...)`. Não-bloqueante: nenhum serviço concreto é importado neste bootstrap. (packages/ui-engines/tests/contracts.test.ts:46)
<!-- END T-UIE-01 -->
<!-- T-UIE-03 -->
- [ ] [m2][T-UIE-03][ui-engines] `ConnectorConfigForm` é stub de 1 campo (`name`). Spec §3 não dita campos e §6 DECIDIDO aceita form custom no P1, então coerente com a decisão arquitetural; mas o primeiro consumidor (EST-42, `draft:hardened`) provavelmente vai pedir mais campos (timeout, baseUrl, retry, headers). Acompanhar a abstração no rework de EST-42. (packages/ui-engines/src/connectors/ConnectorConfigForm.tsx:10-66)
- [ ] [i1][T-UIE-03][ui-engines/spec] Bug pré-existente de `tsc --noEmit` em `packages/ui-engines` — `tsconfig.json` declara `rootDir: "src"` mas `include: ["src", "tests"]`; `tests/contracts.test.ts` está fora do `rootDir` → erro TS6059. Não introduzido por esta task (a task não toca o `tsconfig.json`) e nenhum dos comandos do Gate (build/test/lint) usa `tsc --noEmit`, então a falha não bloqueia. Cleanup transversal — abrir quando alguém for tocar o `tsc` de ui-engines. (packages/ui-engines/tsconfig.json:6,9)
- [ ] [i2][T-UIE-03][ui-engines] E2E do Estaleiro (Playwright, `e2e/estaleiro.spec.ts`) NÃO exercita os novos componentes de connector — cobre Board/Transição/WS/Terminal/Error. Cobertura do código novo vem dos 8 unit tests (5 Card + 3 Dashboard), que cobrem todos os cenários do spec §4 exceto o "Playwright percorre dashboard e probe com adapter fake" (item 5). Unit tests são sólidos (anti-fake: `sk-`/`apiKey`/`token`/`secret`; spy em `onProbe` valida `connectorId`+'ping'; estados loading/success/error/unconfigured/offline). Track: adicionar spec Playwright quando EST-42 for o consumer. (e2e/estaleiro.spec.ts:4-100)
<!-- END T-UIE-03 -->
<!-- T-1038 -->
- [ ] [m1][T-1038][mgtia-template/processo] Seção 8 do T-1038 tem `### Parecer do Agente Revisor` pré-preenchido pelo executor (`qwen` log L163) com evidência colada e checkboxes vazias — confunde o auditor ao ler histórico (parece que houve revisão e ficou pendente, mas nunca houve). Induz o executor a popular o bloco indevidamente. Recomendo endurecer o template (de todas as tasks) para que o bloco de parecer fique VAZIO por default. Track: rotear via `/agrupar-cleanup` → `spec→process-cleanup` (tasks/T-1038.md:140-152)
- [ ] [i1][T-1038][caderno-3/spec] Seção 3 do T-1038 não lista `docs/playbook/06-ferramentas-lsp-mcp.md` como output esperado, mas o worker editou (distinção plataforma↔MGTIA no §3, defensável e bem justificado). Track: atualizar spec §3 no próximo endurecimento para refletir o escopo real (tasks/T-1038.md:43-48 vs docs/playbook/06-ferramentas-lsp-mcp.md:109-119)
- [ ] [i2][T-1038][mgtia-template/processo] Gate LSP (docs-only) delegado a subagent reviewer sem tool `lsp_diagnostics` no ambiente Crush MCP — fallback manual aceitável (revisão linha-a-linha + grep semântico + validação de wikilinks), mas gate formal só fecha em sessão Crush. Track: documentar no playbook 06 §2 que `lsp_diagnostics` é opcional em subagent (tasks/T-1038.md:148)
<!-- END T-1038 -->
<!-- T-PG-01 -->
- [ ] [M1][T-PG-01][pages] `packages/pages/tests/schema.test.ts` declarado na §3 (Output) mas AUSENTE — só `validator.test.ts` foi criado. Tipos em `schema.ts` sem cobertura própria. Ação: criar `tests/schema.test.ts` mínimo (compilação/usabilidade das interfaces, narrowing dos union types `BindingOrExpression`/`PageAction`) — <30 linhas; cabe naturalmente no escopo de T-PG-02. (packages/pages/tests/ vs tasks/T-PG-01.md:138)
- [ ] [m1][T-PG-01][pages] `packages/pages/tsconfig.json` (8 linhas) não está no escopo declarado da §3. Implícito de scaffold de pacote novo (sem ele `tsc` não roda). Track: defer→T-PG-02 (próxima task do cluster já toca este pacote; formalizar lá se incomodar). (packages/pages/tsconfig.json vs tasks/T-PG-01.md:131-140)
<!-- END T-PG-01 -->
<!-- T-SHL-01 -->
- [ ] [m1][T-SHL-01][shell] 3 helpers de tooling criados sem declaração em §3: `vite.config.ts` (33L, config do build vite), `vitest.config.ts` (11L, config do test runner com jsdom), `tests/setup.ts` (17L, `@testing-library/jest-dom`). Aceitável como infraestrutura de teste/build (sem feature), mas a spec não os lista. Disposição: `defer→T-SHL-01-rework` (justificar cada um no handover do rework) ou `spec→T-XXX` (re-endurecer §3 com tooling helpers). Pragmatismo do reviewer: NÃO escalei a MAJOR porque são todos infra (não código de feature), impacto arquitetural zero. (packages/shell/vite.config.ts:1-33, vitest.config.ts:1-11, tests/setup.ts:1-17)
- [ ] [i1][T-SHL-01][shell] Worker declarou `flexlayout-react@^0.9.0` em `package.json:20` mas o lockfile (não-committed, M1 do parecer) resolve para `0.9.2`. Range `^0.9.0` casa `0.9.2`; versionamento saudável. INFO positivo. (packages/shell/package.json:20)
- [ ] [i2][T-SHL-01][shell] `tests/setup.ts` (helper out-of-scope) só importa `@testing-library/jest-dom`, sem side-effects colaterais. INFO positivo. (packages/shell/tests/setup.ts:1-17)
<!-- END T-SHL-01 -->
<!-- T-1039 -->
- [ ] [M1][T-1039][core] `canServeArchive` retorna `boolean` em vez do `CanAccessResult` documentado em §1. Spec §1/§3 dizem `canAccess(...)` (que retorna `CanAccessResult`); impl colapsa em `boolean`. Caller `serveBlindArchive` trata como `UNAUTHORIZED` opaco — perde discriminação `expired`/`no_matching_capability`/`signature_invalid`. Ação: alterar retorno para `CanAccessResult` e fazer handler discriminar, OU documentar em §3 que é `boolean` por design. (packages/core/src/archive/assignCustodian.ts:92-100 vs blindArchives.ts:134)
- [ ] [M2][T-1039][core] Audience não é validado contra o custodiante (gap arquitetural conhecido). `validateUcan(ucan)` sem 2º arg → `ucan.ts:211-216` pula audience check se `audiencePublicKey === undefined`. Spec §3 diz literalmente `validateUcan(ucan)` (sem 2º arg) — impl segue spec; gap é arquitetural, exige decisão. Track: criar task subsequente (registry `EntityId → Ed25519PublicKey`) — candidata T-1050. (packages/core/src/archive/assignCustodian.ts:97 vs packages/core/src/auth/ucan.ts:211-216)
- [ ] [m1][T-1039][core] `custodianId` é parâmetro não-utilizado em `canServeArchive` (assignCustodian.ts:93). Declarado, nunca referenciado. Code smell — eslint `strictTypeChecked` não flagra unused-before-used em args por default. Ação: usar (resolver MAJOR-2) ou renomear para `_custodianId`. (packages/core/src/archive/assignCustodian.ts:93)
- [ ] [m2][T-1039][core] Import duplicado em `tests/archive/blindArchives.test.ts:19-20`. `import type { EntityId } from '../../src/ulid.js';` aparece duas vezes seguidas. TS elide em build, lixo visual. Ação: remover linha 20. (packages/core/tests/archive/blindArchives.test.ts:19-20)
- [ ] [m3][T-1039][core] Teste 3 (UCAN expirado) não checa explicitamente `reason: 'expired'`. Só `toBe(false)`. §4.3 diz "nega com razão `expired`". Cobertura fragmentada via tests 4/5. Ação: adicionar `expect(canAccess(...)).toEqual({ ok: false, reason: 'expired' })` ao test 3. (packages/core/tests/archive/assignCustodian.test.ts:145-154)
- [ ] [m4][T-1039][core] `bytesToHex` duplicado em 5 arquivos: `assignCustodian.ts:8-12`, `ucan.ts:100-104`, `ucan.test.ts:21-25`, `assignCustodian.test.ts:32-36`, helper em `blindArchives.test.ts`. 4 linhas × 5 = 20 linhas duplicadas. Ação: expor via `auth/ucan.ts` (já tem privado) ou criar `src/util/hex.ts`. Housekeeping.
- [ ] [i1][T-1039][core] §6 desatualizado — ainda diz que o handler de Archive Cargo "será criado por uma task futura (T-1050 ou decomposition de T-313)", mas o rework já criou `serveBlindArchive`. Responsabilidade do integrador atualizar §6 (tasks/T-1039.md:128-137).
- [ ] [i2][T-1039][core] Sondas adversariais (análise estática, sem probes runtime). 3 cenários cobertos: capability/ability errada → nega via `canAccess`; nbf no futuro → nega via `validateUcan`; aud ≠ custodiante → NÃO nega (é o MAJOR-2).
- [ ] [i3][T-1039][core] Ordem de validação correta — `validateUcan` antes de `canAccess`, conforme §5. B1 do gpt-5 resolvido.
- [ ] [i4][T-1039][core] Migration V3 corretamente wireada — `schema.ts:64` (`MIGRATION_BLIND_ARCHIVES_SQL`) adicionada ao array `MIGRATIONS` na posição 3. Sem circular dependency. (packages/core/src/schema.ts:64)
<!-- END T-1039 -->
<!-- EST-42 -->
- [ ] [m1][EST-42][estaleiro-ui] `package.json` version bump (0.0.64→0.0.66) fora do escopo declarado na §3 — não impacta funcionalidade, apenas registrar (apps/estaleiro/package.json)
- [ ] [m2][EST-42][estaleiro-ui] `pnpm-lock.yaml` modificado como reflexo da nova dep `@plataforma/ui-engines` (não-declarado em §3, mas mecânico)
- [ ] [m3][EST-42][estaleiro-ui] Cobertura JSDOM incompleta p/ §4 caso 2 (Probe mostra loading, sucesso, timeout, provider desconhecido e local offline). Sondas adversariais do reviewer cobrem todos os 5 sub-estados (PASS); gap é puramente de teste do worker, código correto. Adicionar 4 testes: probe→success path, probe→timeout error, probe→unknown id, local offline esconde botão. (apps/estaleiro/ui/src/views/config/ConfigView.test.tsx) — **RESOLVIDO em rework 39d5ea9: 4 testes adicionados, cobertura 5/5.**
- [ ] [m4][EST-42][estaleiro-ui] §4 caso 3 sem asserção explícita ("Resposta exibe provider, modelo, latência e texto"). Adicionar teste que clique em `probe-button-deepseek` e assere `model+text+latency` no card. (apps/estaleiro/ui/src/views/config/ConfigView.test.tsx) — **RESOLVIDO em rework 39d5ea9: teste `probe success renders provider, model, latency, and text` cobre.**
- [ ] [m5][EST-42][estaleiro-ui] §3 declarava "[UPDATE] estilos de composição somente em `ui/src/index.css`"; nenhuma alteração em `index.css`. Classes Tailwind usadas em ConfigView são no-op no build (sem Tailwind config em apps/estaleiro/ui/). Padrão pré-existente nas demais views — não-bloqueante, apenas registro. (apps/estaleiro/ui/src/views/config/ConfigView.tsx + apps/estaleiro/ui/src/index.css)
- [ ] [m6][EST-42][estaleiro-ui] §3 pedia migração de layout salvo via `addTabWithVisiblePanel` ou equivalente; `loadLayout()` retorna JSON salvo sem patch. Quem salvou layout antes de EST-42 não vê aba "Config" até limpar `localStorage["estaleiro-layout-v1"]`. DoD §3 permite "carrega OU migra deterministicamente" — `loadLayout()` carrega sem erro, então DoD verde, mas spec §3 ideal não atendido. Recomendado: implementar `migrateLayout(model)` que injeta aba Config no right border se ausente. (apps/estaleiro/ui/src/shell/default-layout.ts:5-19)
- [ ] [defer→EST-42a] [M3][EST-42][estaleiro-core] Band-aid do B1 (Docs: `id: _campanha-fugu-01` em `_campanha-fugu-01.md`) cria side-effect no seed: a cada boot do standalone, o SQLite recebe uma task com `id: "_campanha-fugu-01"`, `status: "PRONTA"`, `targetAgent: ""`, `reviewerAgent: ""` — violando o enum fechado `TaskStatus` em `packages/plugin-tasks/src/schema.ts:1-13`. Nenhum teste quebra hoje (E2E 6/6 passa, UI provavelmente filtra por status e a task fica invisível), mas o objeto polui o DB e qualquer consumidor que valide `status in VALID_STATUSES` quebra. Fix correto: 1 linha em `apps/estaleiro/core/src/seed.ts:11` (pular arquivos de manifesto): `if (file.startsWith("_campanha-") || frontmatter.campaign_id) continue;` — depois reverter o `id:` adicionado em `_campanha-fugu-01.md`. (apps/estaleiro/core/src/seed.ts:11 vs tasks/_campanha-fugu-01.md:2-4)
- [ ] [M4][EST-42][estaleiro-ui] **GATE LINT QUEBRADO NO MASTER (PRE-EXISTENTE, NÃO DE EST-42).** `pnpm --filter @plataforma/estaleiro-ui lint` na master pós-merge retorna 2 erros em `BoardView.tsx:24-25` (`Unsafe member access .current on a type that cannot be resolved` em `active.data.current?.["status"]` e `over.data.current?.["status"]`). Causa: lockfile master tem versões mais novas de `typescript-eslint` (8.61.1) que detectam violações que a versão antiga do worktree (com lockfile baseado em `05af693`) não pegava. **Arquivo foi introduzido por T-EST-14b em 2026-07-07 (commit `6b94828`)** — pré-existente ao branch EST-42. Worktree do EST-42 rodou lint verde (exit 0) na sua própria resolução de dependências, mas a master pós-merge re-resolve dependências e expõe o erro. EST-42 não tocou em BoardView.tsx. **Bloqueio real do Gate pós-merge, mas fora do escopo da task** — fix correto: 1 linha de type assertion (`active.data.current as { status?: string } | undefined`) ou eslint-disable com justificativa. Track: criar task de fix pre-existente (ex.: `fix-EST-14b-lint`). A integração prossegue com APROVADO porque EST-42 é code-clean, e o lint fail é dívida do master. (apps/estaleiro/ui/src/views/board/BoardView.tsx:24-25)
<!-- END EST-42 -->
<!-- T-1046 R2 -->
- [ ] [m1][T-1046][protocol] Reviewer 1 pediu "adicionar teste de mensagem malformada" no M1; o rework (db6a422) corrigiu o decoder mas o teste não foi escrito. Sonda do Reviewer 2 cobre 7/7 casos (lixo binário, JSON inválido, `null`, `ids` faltando, `ids` não-array, elemento não-string, request válido) — todos passam. Adicionar 3-5 casos em `packages/protocol/tests/rbsr.exchange.test.ts` ou `rbsr.transfer.test.ts`. Não-bloqueante: código defensivo em `exchange.ts:73-91` + try/catch em `syncCoordinator.ts:122-123` é sólido. (packages/protocol/src/rbsr/exchange.ts:73-91 + packages/transport/src/syncCoordinator.ts:110-124)
<!-- END T-1046 R2 -->
<!-- T-1043 -->
- [ ] [m1][T-1043][core] `rangeScan` (sqliteStorage.ts:181) é `async *` sem nenhum `await` interno — só yields. Funcionalmente correto (subjacente é `better-sqlite3` síncrono), mas viola expectativa semântica de async iterator. Fix: trocar retorno para `Iterable<SignedNode>` (sync) ou inserir `await Promise.resolve()` entre yields. Lint `@typescript-eslint/require-await` já está flagando.
- [ ] [m2][T-1043][core] 8 diretivas `eslint-disable-next-line @typescript-eslint/require-await` em sqliteStorage.ts:261-275 são stale (dead code). Os wrappers `putNode: async (node) => { await self.putNode(node); }` JÁ têm `await` interno, então a regra não dispara neles. Worker copy-pastou do template do `bad8e25` (wip) sem revalidar.
- [ ] [i1][T-1043][core] Escopo do diff coerente — 9 arquivos modificados: 3 produção migrados (merge.ts, lineage.ts, concurrentGuard.ts) + 2 infra (sqliteStorage.ts, ports.ts) + 3 testes + 1 caller (exchange.ts). Nenhum arquivo fora do §3 declarado.
- [ ] [i2][T-1043][core] `test-out.txt` untracked na worktree — artefato de debug do worker (`vitest run > test-out.txt`). Não impacta review, mas reter hábito de limpar antes de `finish`.
- [ ] [i3][T-1043][core] **Decisão de arquiteto pendente:** split "GraphStorePort para grafo, StoragePort para o resto" da T-1042 colide com a spec §1 da T-1043 ("remover SQL do core"). Subir para T-1044 (já em `blocks`) — definir se objetivo final é (a) migrar os 4 restantes (invite.ts, schema.ts, archive/blindArchives.ts, deviceState/schema.ts) com extensões do GraphStorePort, ou (b) manter o split e emendar a spec §1 para refletir o carve-out do StoragePort.
- [ ] [B1-r2][T-1043][core] **REWORK 2 NECESSÁRIO: branch `task/t-1043` precisa rebase sobre `master` antes de qualquer nova integração.** `git merge-base master task/t-1043` = `ac27281` — 8 commits de delta na master (T-1033, T-1035, T-1036, T-1046, T-1052) não foram absorvidos pelo rework. Conflitos: `sqliteStorage.ts` (imports + class decl + comment + transaction sig), `exchange.ts` (imports + decodeRequestNodes vs applyNodes sig), `rbsr.applyNodes.test.ts` (T-1033 moveu o test de protocol→core + reescrita substancial do `storageFromDb` helper GraphStorePort — port >100 linhas, não-trivial). **Não tentar resolver manualmente** — pedir ao worker para `git rebase origin/master` e adaptar os 3 arquivos. (worktree `C:\Dev2026\.superapp-worktrees\T-1043`)
- [ ] [m1-r2][T-1043][core] Lint residual `unnecessary-type-assertion` em `sqliteStorage.ts:113` (transaction method com ternário) sobreviveu ao rework. Vai sumir naturalmente ao tomar a versão HEAD do `transaction` (single overload) durante o rebase, mas o worker não apontou isso explicitamente. (packages/core/src/sqliteStorage.ts:113)
- [ ] [m1-r3][T-1043][estaleiro] `apps/estaleiro/package.json` version bump (0.0.67→0.0.69) fora do escopo §3 — cosmético, padrão do repo (EST-35a/EST-36/EST-13a/EST-43b). Não impacta funcionalidade, apenas registrar. (apps/estaleiro/package.json:3)
<!-- END T-1043 -->
<!-- T-1052 -->
- [ ] [i1][T-1052][estaleiro] PoC isolada usa `npm install --ignore-scripts` para materializar externals nativos/WASI; prática intencional e documentada no ADR-0012, sem tocar no superapp. Acompanhar somente se a futura migração de produção exigir padronizar o gerenciador de pacotes do artefato. (C:\tmp\estaleiro-bundler-t1052\spike\esbuild-bundle.mjs)
<!-- END T-1052 -->
<!-- EST-43b -->
- [ ] [M1][EST-43b][estaleiro] `package.json` version bump (`0.0.67` → `0.0.69`) fora do escopo declarado em §3 (que lista `[UPDATE]` apenas para `apps/estaleiro/ui/src/views/config/ConfigView.test.tsx`). Mudança puramente cosmetic; reverter ou mover para task de release dedicada (apps/estaleiro/package.json:3)
<!-- END EST-43b -->
<!-- T-UIE-02 -->
- [ ] [m1][T-UIE-02][ui-engines] Bump de `vitest` `^1.2.0` → `^3.0.0` em `package.json`/`pnpm-lock.yaml` não declarado na Seção 3 — necessário p/ compat React 19/jsdom 29, sem risco aparente (packages/ui-engines/package.json)
- [ ] [m2][T-UIE-02][ui-engines] `FlowInspector` botão "Edit" reemite `update_node` com `changes: {}` vazio — sem campos de formulário reais; mesmo após corrigir o BLOCKER de connect/disconnect/reorder, edição via Inspector segue decorativa (packages/ui-engines/src/flow/FlowInspector.tsx:39-46)
- [ ] [m3][T-UIE-02][ui-engines] Nenhum teste verifica a presença real de `<line>` no SVG do `FlowEdgeLayer` — o bug de B2 (edges nunca renderizadas) foi corrigido mas ficaria invisível numa regressão futura (packages/ui-engines/src/flow/FlowEdgeLayer.tsx)
- [ ] [m4][T-UIE-02][ui-engines] `verify.ps1` criado na raiz do repo `superapp` (fora de `packages/ui-engines`, fora do escopo §3) — só espelha os 4 comandos do Gate, sem risco (verify.ps1)
- [ ] [i1][T-UIE-02][ui-engines] "Edit Node" no Inspector emite `changes: { label: label + ' (edited)' }` fixo — funcional (não mais `{}` vazio) mas não é um formulário livre; UI melhor teria campos editáveis (packages/ui-engines/src/flow/FlowInspector.tsx:73)
<!-- END T-UIE-02 -->
<!-- C-30 -->
- [ ] [m1][C-30][estaleiro-core] `apps/estaleiro/package.json` version bump 0.0.69 → 0.0.70 fora do §3 — cosmético, mesmo padrão de EST-43a (0.0.63→0.0.64) (apps/estaleiro/package.json)
<!-- END C-30 -->
<!-- EST-44 -->
- [ ] [m1][EST-44][estaleiro-ui] `update_node` com `changes: {}` passa no filtro (vacuous truth) e seta `name: undefined` — guardar com `if (Object.keys(command.changes).length === 0 || command.changes.label === undefined) return jdm;` (jdm-flow-adapter.ts:78)
- [ ] [m2][EST-44][estaleiro-ui] `connect` não valida existência de source/target em `jdm.nodes` antes de criar aresta — arestas dangling possíveis (jdm-flow-adapter.ts:61-72)
<!-- END EST-44 -->
<!-- L-03 -->
- [ ] [M1][L-03][core] **Wiring da família MoR/blocking (009-01 + 009-02 + L-03): zero callers de produção.** `assertFiscalTransition`, `checkBlockingRules`, `createMoRContext` e `stepRequiresMoR` só são chamados pelos próprios testes — o módulo `packages/core/src/workflow/` é hoje uma biblioteca de predicados puros, sem pipeline executável que os invoque. O hard stop fiscal (NF-e obrigatória) **não é enforçado em lugar nenhum em runtime**. Não é regressão da L-03 (as deps já `done` têm a mesma forma); é lacuna arquitetural da família → precisa de **task de integração** que ligue o predicado à máquina de estados real (ex.: `plugin-workflows`/`plugin-zen-engine` chamar `assertFiscalTransition` na pre-transition). Consolida e supersede a linha equivalente de 009-02 acima (packages/core/src/workflow/workflow-engine.ts:132)
- [ ] [m1][L-03][core] `evaluateMoRHardStop` (mor-hardstop.ts:20) é wrapper de passagem: `context` e `transition` não influenciam a decisão de bloqueio (que só depende de `rules`+`checks`). Correto por spec (caso 3: "workflow sem MoR continua funcionando"), mas a "integração MoR+blocking" é composição sem acoplamento — revisitar se a jurisdição do MoR precisar gatilhar regras (packages/core/src/workflow/mor-hardstop.ts:20-31)
- [ ] [m2][L-03][core] `tests/mor-hardstop.test.ts:53` asserta só `toThrow(BlockingError)` sem verificar `message`/`checks`; um `toThrow(/nfe-emitida/)` tornaria regressão de payload visível
- [ ] [i1][L-03][shell] `packages/shell/vite.config.ts.timestamp-*.mjs` (temp do Vite) aparece como untracked e suja `git status --short` das worktrees — candidato a `.gitignore`
<!-- END L-03 -->
<!-- P-03 -->
- [ ] [m1][P-03][controle] `get-task.mjs:13-14` duplica `codeRepo`+`worktreesBase` de `worktree.mjs:32-33` — spec §3/§5 diz "reusar, não duplicar"; exportar `getWorktreePath(id)` do worktree.mjs e importar aqui (tools/scripts/get-task.mjs:13-14)
<!-- END P-03 -->
<!-- P-06 -->
- [ ] [m1][P-06][controle/spec] Spec §4/§5 diz `wt refresh` "async", implementação é síncrona. Funcional para uso manual; se for automático pós-merge, async seria melhor (não bloqueia). Track: manter sync, atualizar spec se quiser async (tools/scripts/worktree.mjs:248-296)
- [ ] [m2][P-06][controle/handover] Handover §8 não documenta allowlist de writable roots para `_slot-*` (spec §3 exige). Config de harness, não código — humano aplica. Track: adicionar nota em handover ou PITFALLS.md (tasks/P-06.md:34)
<!-- END P-06 -->
<!-- P-07 -->
- [ ] [M1][P-07][controle] `get-task.mjs` não implementa `--skill <name>`. Skill normativa prescreve o flag (`executar-task/SKILL.md:54`, `rework-task/SKILL.md:40`) mas `tools/scripts/get-task.mjs:16-22` só trata `--json`; flag silenciosamente descartada. Handover §8 não flagou a divergência. Resolução: (a) P-03 adiciona suporte a `--skill` (STATE_MAP já tem seleção certa; flag seria override), OU (b) P-07 remove `--skill executar-task`/`--skill rework-task` das skills (.claude/skills/executar-task/SKILL.md:54, .claude/skills/rework-task/SKILL.md:40, tools/scripts/get-task.mjs:16-22)
- [ ] [m1][P-07][controle] `executar-task/SKILL.md` tem dois passos "3." (L44 e L51). Handover §8 diz "Numeração corrigida", mas a renumeração foi incompleta: o step "Inicie" deveria ter sido renumerado para 4 (depois de 3=Worktree), e Context pack empurrado para 5. Em `rework-task` (L30-67) a numeração 1..11 está correta. Fix trivial em passagem futura (.claude/skills/executar-task/SKILL.md:44,51)
- [ ] [i1][P-07][controle] A §7 verificação `grep -l "3 níveis|get-task|pnpm gate|PROC-PENDENCIAS" .claude/skills/*/SKILL.md tasks/_pendencias.md` retorna 4 skills + `_pendencias.md` — `endurecer-task` NÃO aparece (não fala desses termos; é fora do escopo da skill). Falso-positivo do critério, não gap do diff (tasks/P-07.md:62)
<!-- END P-07 -->
<!-- P-04 -->
- [ ] [m3][P-04][controle] Gate validation on `finish` (manage-task.mjs:22-56) é trabalho P-05 (saúde.mjs + preflight) incluído no diff de P-04 sem declaração em §3. Efeito neutro p/ tooling-do-controle (sem worktree). Separar em commit próprio ou justificar em próxima passagem.
<!-- END P-04 -->
<!-- C-21 -->
- [ ] [M1][C-21][@plataforma/plugin-context] Scope creep em m3: spec §3 dizia apenas `export const TOK_EST = (s: string): number => Math.ceil(s.length / 4);` para `src/constants.ts`, mas worker extraiu também `GATE_TOK = 2000` no mesmo arquivo. Funcionalmente correto (GATE_TOK é usado em 3 sites de optimize.ts) e coeso, mas §3 não autorizava. Decidir: (a) estender spec retroativamente, (b) reverter GATE_TOK para inline em optimize.ts. Sem decisão de arquiteto, o rework de C-21 só fecha B1 (cast `as any` em nanoPreprocess.ts:41). (packages/plugin-context/src/constants.ts:1-2)
<!-- END C-21 -->
<!-- T-409 -->
- [ ] [M1][T-409][controle] **Drift de ledger mascarou estado real.** `manage-task.mjs reconcile` sincronizou para ledger stale (ready, de 2026-07-03); worker registrou [Finalizado] (in_progress→review) no §9 mas ledger não acompanhou. Sem diff na branch `task/T-409` + sem worktree, o serviço não detectou que o trabalho sumiu. Ação corretiva: spike/meta para guard "review sem código = reject automático" — `manage-task.mjs finish` falha se `git diff master..task/<ID> --stat` está vazio.
- [ ] [m1][T-409][controle] §6 "DECIDIDO (2026-07-16) — adaptar à API existente" é sólida e o caminho correto. Mas o alinhamento de §6 ficou só no papel — não há código que materialize a decisão. Reaproveitar §6 ao re-executar a task.
- [ ] [i1][T-409][controle] BOM UTF-8 em `tasks/T-409.md` (1 de 519 arquivos em `tasks/`) impedia o `get-task.mjs` de detectar o status. Bug do parser (`parseFrontmatter` não trata BOM). Removido no review de 2026-07-18. Fix de raiz: `tools/scripts/get-task.mjs:79` — `text.replace(/^\uFEFF/, "")` antes do regex de frontmatter.
<!-- END T-409 -->

<!-- EST-49a -->
- [ ] [m1][EST-49a][apps/estaleiro/core] `reasoningEffort` enviado via `providerOptions.openai.reasoningEffort` em `generateText`; o spec §3.2 prescrevia `createOpenAI(...).chat(mId, chatOptions).reasoningEffort`. Ambas as APIs são oficiais do `@ai-sdk/openai@1.3.x` e produzem o mesmo wire field `reasoning_effort`. Não bloqueia, mas se quiser fidelidade literal ao spec mover para o segundo arg de `.chat()` (apps/estaleiro/core/src/chat-service.ts:75-79).
- [ ] [m2][EST-49a][apps/estaleiro/core] `pnpm --filter @plataforma/estaleiro test:integration` foi omitido do bloco "Gate de Evidência" do §8 Handover (spec §7 lista 7 comandos; worker colou 6). Re-execução pós-merge passa (5 files · 24 tests). Handover deveria colar os 7.
- [ ] [m3][EST-49a][packages/plugin-providers] Branch vazia `if (sanitized.includes("[REDACTED]")) { /* Log sanitized, continue to fallback */ }` em `catalog.ts:83-85` — `sanitize()` já substituiu a chave; o `if` não tem corpo e o `return buildStaticFallback` está fora dele. Dead code — remover ou implementar o `console.warn(sanitized)` pretendido (packages/plugin-providers/src/catalog.ts:79-87).
<!-- END EST-49a -->

- [ ] [m2][EST-48c][@plataforma/estaleiro-ui] Dívida técnica — `apps/estaleiro/ui/src/estaleiro-core.types.ts` (22 linhas) e `apps/estaleiro/ui/src/provider-profile.types.ts` (30 linhas) são cópias locais verbatim de tipos canônicos de `apps/estaleiro/core/src/chat-service.ts` e `packages/plugin-providers/src/profile-types.ts`; o `tsconfig.json` mapeia `@plataforma/estaleiro-core` e `@plataforma/plugin-providers` para esses arquivos via `paths`. Risco de drift silencioso (qualquer dev que mexer no tipo canônico não recebe sinal). Workaround pragmático para destravar B1 do R1, mas precisa ser substituído por .d.ts gerado quando `@plataforma/estaleiro-core` e `@plataforma/plugin-providers` virarem pré-requisitos de build da UI. Criar C-task "regenerate-types-d-ts" no cleanup para tracking.
- [ ] [m3][EST-48c][superapp/processo] Pre-commit hook auto-bump de versão no `apps/estaleiro/package.json` (R3: 4 commits B5 cada bumpou +1 patch 0.0.99→0.0.100→0.0.101→0.0.102; master avançou para 0.0.98 no mesmo intervalo). O hook não tem noção de escopo-de-task e gera drift permanente entre branches paralelas. Investigar origem (provavelmente `scripts/pre-commit` ou `lefthook.yml`) e propor opt-out por-branch ou detecção "arquivo não está em §3 da spec".

<!-- END PENDENCIAS -->

<!-- BEGIN SPEC-PENDENCIAS -->
<!-- Achados de spec/decisão recuperados de C-01..C-09 (2026-07-02) + C-18/19 (2026-07-06).
     O `/endurecer-task` ou `/arquiteto-decisoes` consome e resolve cada linha. -->

<!-- C-01 — protocol -->
- [ ] [spec→T-407] [m1][T-407][protocol] Spec §1 declara `generateOobLink(multiaddr, ephemeralPubKey, relayHint?)` com 3 params, mas `nonce: Uint8Array` é obrigatório na impl — reendurecer assinatura (tasks/T-407.md:44-48 vs outOfBand.ts:38-43)
- [ ] [spec→T-208] [m1][T-208][protocol] ClockPort estendido com `setTimeout`/`clearTimeout` — mudança de escopo não declarada na spec §3 (ports.ts:58-78)
- [ ] [spec→T-302a] [m2][T-302a][protocol] `respondNodes` exportado em `index.ts` mas sem entrada no contrato §1 da spec — adicionar à spec ou remover do export (src/rbsr/exchange.ts:161-175, src/index.ts:24)
- [ ] [spec→T-302a] [m3][T-302a][protocol] Spec §1 declara `ids: ULID[]` em `requestNodes`; impl usa `string[]` — alinhar assinatura nominal (src/rbsr/exchange.ts:152-158)
- [ ] [spec→T-1033] [m1][T-1033][protocol] Spec §1 (linhas 86-90) "Análise de ciclo" está geometricamente errada: ciclo é definido pela direção do grafo de imports, não pelos símbolos. Mover `applyNodes` entre pacotes mantém a seta `protocol → core` (e a seta inversa `core → protocol` via `StoragePort`). Reendurecer spec: ou remover o ciclo da lista de objetivos, OU fixar a direção arquitetural antes de qualquer rework (visao-arquitetural.md §1 vs spec T-1033.md §1)
- [ ] [decision→T-306] [m1][T-306][protocol] Rework escolheu injetar remote state via parâmetro (`rootRange`/`remoteRootXor`/`remoteTree`). Decisão NÃO formalizada em §6 da spec nem §1 atualizada — capturar como Decisão 6 do arquiteto (waves.ts:55-90, 94-167, 171-240, 244-252)
- [ ] [defer→T-302c] [m3][T-302b][protocol] Wire format gap: `respondNodes` envia `{id, fingerprint}` não `SignedNode` completo — integração end-to-end depende de decisão arquitetural (3 opções: evoluir respondNodes, nova MSG_FULL_NODES, reusar T-802 blob)

<!-- C-02 — core -->
- [ ] [defer→T-004a] [i3][T-004b][core] ROLLBACK falho em `SqliteStorage.transaction()` (Node) deveria espelhar o padrão de T-004b: `console.error` + rethrow do erro original em vez de mascarar com throw aninhado — sugere refactor de T-004a (sqliteStorage.ts:40-50 vs sqliteWasmStorage.ts:77-83)
- [ ] [spec→T-004b] [m2][T-004b][core] Worker não chama `PRAGMA journal_mode = WAL` (divergência de `sqliteStorage.ts:27`); Decisão C (no-op) é a justificativa mas a divergência deveria ser documentada em spec §1 ou §6 (sqliteWasm.worker.ts)
- [ ] [defer→T-004b] [m3][T-004b][core] `_send` no main thread não tem timeout — se o worker travar, Promise fica pendente forever. Adicionar `setTimeout` em followup de produção (sqliteWasmStorage.ts:47-59)
- [ ] [spec→T-004a] [i3][T-004a][core] `transaction` propaga valor retornado pelo callback (`Promise<T> → Promise<T>`) mas spec §3 não cita propagação — documentar em `StoragePort` quando interface for endurecida (sqliteStorage.ts:25-35)
- [ ] [spec→T-313a] [m1][T-313a][core] `packArchive` não aceita `hlcRange`/`expiresAt` no signature; hardcoded em archiveCargo.ts:135-137 — spec gap + impl gap (archiveCargo.ts:117-141)
- [ ] [spec→T-313a] [i1][T-313a][core] Spec §1 exemplo de import mostra `import type { EntityId, ULID } from '@plataforma/protocol'` mas esses tipos não são exportados por `@plataforma/protocol` — corrigir spec (T-313a §1 vs archiveCargo.ts:6)
- [ ] [spec→T-313a] [i3][T-313a][core] `manifest.size` reflete tamanho total pós-assemble (ciphertext puro vs envelope) — spec §1 (`size: number`) é ambíguo, documentar convenção (archiveCargo.ts:136)
- [ ] [spec→T-313b] [m1][T-313b][core] `canServeArchive` NÃO usa `scopeRBSRTree` de T-305a — impl faz magic-string check que ignora `blindScopeId`. Reendurecer spec (assignCustodian.ts:83-89)
- [ ] [spec→T-313b] [m2][T-313b][core] Assinaturas async divergem da spec §1 (que declara sync): `buildHashRing`/`assignCustodian`/`assignCustodianWithRing` retornam `Promise<>` — reendurecer spec para `Promise<...>` (assignCustodian.ts:22,65,75)
- [ ] [decision→T-210] [m1][T-210][core] `PRAGMA foreign_keys = OFF/ON` toggled dentro da transação de `consumeInvite` para contornar FK com nó remoto — solução robusta: stub `PEER:REMOTE` ou `source_id` nullable (invite.ts:168, 198)
- [ ] [decision→T-210] [m2][T-210][core] `signature: new Uint8Array(64)` é placeholder para `PROFILE:AUTHENTICATION`/`VOUCHES_FOR` — buraco aberto de segurança (invite.ts:179, 194)
- [ ] [spec→T-313c] [i1][T-313c][core] `listBlindArchivesByScope` tem 4º param `now?: number` não declarado na spec — reendurecer spec (blindArchives.ts:69-81)
- [ ] [spec→T-313c] [i1][T-701a][core] T-313c referencia T-106 para migration `blind_archives` mas destino real é `device_state.db` (T-701a); colunas camelCase vs snake_case — alinhar com DEVICE_STATE_MIGRATIONS

<!-- C-04 — bancada -->
- [ ] [defer→T-004b] [i4][T-004b][bancada] Padronizar harness Playwright+WASM (`sqlite-wasm-test.html` + `window.__SQLITE`) como padrão para futuros E2E de módulos WASM — documentar em `docs/playbook/05-testes-e2e.md` ou similar (apps/bancada/sqlite-wasm-test.html, apps/bancada/src/global.d.ts)
- [ ] [spec→T-311] [m1][T-311][bancada] `SyncStatus` interface lista 6 campos mas NÃO declara `forceReconcile: () => void` — spec §1 incompleta (useSyncStatus.ts:12)
- [ ] [spec→T-211] [i2][T-211][bancada] Spec §1 e §4 caso 4 inconsistentes: §1 diz "connected()" mas §4 exige mostrar peer em state `connecting` — worker mudou test 4, perdeu cobertura do requisito (RedeTab.test.tsx)

<!-- C-05 — control -->
- [ ] [spec→ORQ-04] [m1][ORQ-04][control] Spec §5 step 1 + §7 referem `crush run --yolo` mas `--yolo` não existe no Crush (v0.79.1); impl usa `--quiet` — reendurecer spec para `--quiet` (tools/scripts/orquestrar.mjs:284)
- [ ] [defer→ORQ-09b] [m1][ORQ-12][control] Pricing hardcoded do nano no ADR-0009 (~US$0.028/M in, US$0.042/M out) está ~10× abaixo do deepseek-chat real; ADR herda ambiguidade `v4-flash` (hipotético) vs `deepseek-chat`. Atualizar para preços reais do `deepseek-chat` na task de integração ORQ-09b (ADR-0009 §Decisão D)
- [ ] [defer→ORQ-09b] [m2][ORQ-12][control] Payload "prosa" usado na bancada é 28-shell-e-composicao.md (~8KB / 1960 tok) — 4× menor que o "ex.: caderno de 30KB" pedido em ORQ-12 §5.2. Adicionar payload grande (caderno real ~30KB) na próxima rodada de bench (tools/orchestrator/context-bench.poc.mjs)
- [ ] [defer→ORQ-09b] [m3][ORQ-12][control] Listagem da bancada vem de `walk(node_modules/.pnpm, [], 4000)` — não-determinística, bench não-reprodutível cross-ambiente. Trocar por fixture versionada (snapshot fixo do repo) para reprodutibilidade (tools/orchestrator/context-bench.poc.mjs)
- [ ] [spec→ORQ-12] [m4][ORQ-12][control] Caderno `30-otimizacao-de-contexto-e-tooling-de-agentes.md` foi atualizado com §9 novo durante o spike mas a integração "listar caderno 30 como deliverable §3" não foi feita — adicionar à §3 (escopo de arquivos) na próxima reendurecimenta da spec
- [ ] [defer→ORQ-09b] [R2-M2][ORQ-12][control] `node_modules/headroom-ai/dist/index.js:1,2` tem imports sem .d.ts (`chunk-7AJIWIPP.js`) — LSP Hint typescript(7016) "Could not find a declaration file for module". Adicionar `// @ts-expect-error` no consumer ou um `*.d.ts` shim quando integrado em ORQ-09b
- [ ] [defer→T-XXX] [R2-M3][ORQ-12][control] `tools/orchestrator/src/agentAdapter.mjs:13` e `tests/monitor.test.mjs:94` têm `os`/`req` declarados mas não usados — LSP Hint typescript(6133) "unnecessary". ORQ-12 §0 proibiu tocar src/, então limpeza fica para task separada (tarefa de cleanup)

<!-- C-08 — testkit -->
- [ ] [spec→T-1009] [m1][T-1009][testkit] Desvio do contrato TS: parâmetro `pattern` em vez de `jsonEscapedPattern`; impl alinhada com §4, spec §1 que precisa atualizar (psRegex.ts:13-21, 30-34)
- [ ] [spec→T-1009] [m2][T-1009][testkit] Spec §3 inconsistente sobre localização do test (`src/` vs `tests/`); impl resolveu com `tests/psRegex.test.ts` (convenção Vitest) — atualizar spec §3

<!-- Itens de spec/decisão de EST-03b/c/d e EST-04a/b/c (2026-07-06) — roteados das PENDENCIAS -->
<!-- EST-03b (stateMachine) -->
- [ ] [spec→EST-03b] [i1][EST-03b][estaleiro/spec] Spec §1 lista só 12 sub-status (sem legacy `'draft'`) — state machine não reconhece alias, diverge da canônica
- [ ] [spec→EST-03b] [i2][EST-03b][estaleiro/spec] Spec §1 e §4 inconsistentes — §1 diz approve NÃO válido de `review`, §4 test 3 usa approve de `review`
- [ ] [spec→EST-03b] [i6][EST-03b][estaleiro/spec] Spec drift estrutural — §1 não espelha MGTIA canônico. Arquiteto decide: re-endurecer ou declarar subset
- [ ] [decision→EST-03a] [i7][EST-03b][estaleiro/spec] `demote` em `TaskAction` canônico mas NÃO em `TransitionVerb` do EST-03a. Arquiteto decide caminho
- [ ] [defer→wargame] [i4][EST-03b][process] 4ª task consecutiva com regressão de lint — revisar wargame template (lint no DoD §7)

<!-- EST-03d (service) -->
- [ ] [decision→arquiteto] [i2][EST-03d][plugin-tasks] Transições falhas não logadas — `TransitionError` antes de salvar log. Append log antes da state machine?
- [ ] [decision→arquiteto] [i4][EST-03d][plugin-tasks] `new Error("Task not found")` genérico — contrato não cobre. Criar `TaskNotFoundError`?

<!-- EST-04b (migration) -->
- [ ] [spec→EST-04b] [m2][EST-04b][plugin-tasks/spec] Scope drift: §3 lista só `runner.ts`/`report.ts`, impl criou `parser.ts`+`index.ts`

<!-- EST-04c (validate) -->
- [ ] [spec→EST-04c] [M1][EST-04c][estaleiro/spec] Spec drift assinatura `validateIntegrity`: spec diz 1 arg, impl tem 2
- [ ] [spec→EST-04c] [M2][EST-04c][estaleiro/spec] `verified = 0` sempre — `reconstructMarkdown` lossy. Arquiteto decide semântica
- [ ] [spec→EST-04c] [i2][EST-04c][estaleiro/estilo] Testes 1+2 do spec §4 impossíveis — re-escrever após decidir M2

<!-- T-1037 (ADR-005) — movido das PENDENCIAS -->
- [ ] [spec→ADR-005] [i1][T-1037][adr] Exemplo em ADR-005:24 representativo, não contratual. Regenerar de `lineage.ts`
- [ ] [spec→ADR-005] [i2][T-1037][adr] Engine KV do segundo adapter não-fixada (LMDB/RocksDB/mock) — decisão em T-1044

<!-- C-14 — orchestrator/spec -->
- [ ] [spec→C-14b] [m3][C-14][orchestrator/spec] Finding 11 §4 (VIA 4/5 header) está stale — bench tem `VIA 2` (context-bench.poc.mjs:52), ADR-0010 linha 10 tem `VIA 4`. Disposição `no-op` é correta (não há o que unificar), mas a spec precisa reendurecer para remover a referência obsoleta. Track: 1 linha no reendurecimento de C-14 (tasks/C-14.md:58 vs tools/orchestrator/context-bench.poc.mjs:52 vs docs/adr/0010-compressor-ml-onnx-in-process.md:10)
- [ ] [spec→C-14b] [m4][C-14][orchestrator/spec] §3 linha 40 menciona R2-M2 (.d.ts shim para `src/agentAdapter.mjs`) que NÃO está em §4 e NÃO foi tratado. Stale: pacote `tools/orchestrator/` é JS-only (`.mjs`), sem consumers TS. Track: remover R2-M2 de §3 no reendurecimento (tasks/C-14.md:40)
- [ ] [spec→C-14b] [i2][C-14][orchestrator/spec] ADR-0010 filename na spec §3 linha 43 está errado: referencia `docs/adr/0010-kompress-v2-base-para-compressao.md` (não existe). Arquivo real: `docs/adr/0010-compressor-ml-onnx-in-process.md`. Track: corrigir filename no reendurecimento (tasks/C-14.md:43)

<!-- C-11 — transport/spec -->
- [ ] [spec→C-11b] [m1][C-11][transport/spec] Spec §3 linha 36 declara `packages/transport/src/graph/graphRouting.ts` mas path real é `packages/transport/src/discovery/graphRouting.ts`. Worker editou path correto (bom comportamento). Track: atualizar spec §3 (1 linha) ou criar C-11b para endurecer spec (tasks/C-11.md:36 vs packages/transport/src/discovery/graphRouting.ts:1)
- [ ] [spec→C-11b] [i1][C-11][transport/spec] Spec §3 linha 39 menciona "dead exports in `packages/protocol/src/index.ts`" mas Handover não traz inspeção. Verificação manual do reviewer confirma 0 dead exports — spec está OK na prática mas sem evidência. Track: 1 linha de evidência (grep) ao reendurecer C-11 (tasks/C-11.md:39)
- [ ] [spec→C-13b] [m2][C-13][bancada/spec] Spec §3 linha 33 declara `apps/bancada/src/tabs/AuthTab.tsx` mas impl está em `components/tabs/AuthTab.tsx`. Handover rotula como "no-op" (errado — é spec drift, não no-op). Disposição correta: `spec→C-13b` re-endurecer spec. Track: atualizar spec §3 (1 linha) (tasks/C-13.md:33 vs apps/bancada/src/components/tabs/AuthTab.tsx:1)
<!-- C-10a — plugin-providers/spec -->
- [ ] [spec→EST-10a-followup] [m1][EST-10a][plugin-providers/spec] Spec §4 linha 53 teste 3 fala de "factory chamada com os args certos (name, baseURL, apiKey, modelId)" mas §5b M2 + fonte ORQ-09b passam só modelId (1 arg). Spec §4 em contradição com §5b. Track: alinhar spec §4 com §5b (remover 3 args extras do teste 3) ou criar EST-10a-followup (tasks/EST-10a.md:53 vs tasks/EST-10a.md:75-77)

<!-- Items roteados em 2026-07-10 pelo /agrupar-cleanup — das PENDENCIAS para SPEC-PENDENCIAS -->
<!-- EST-07 -->
- [ ] [spec→EST-07] [i1][EST-07][plugin-dispatcher] @types/node devDep — alinhar spec §3 (packages/plugin-dispatcher/package.json:19)
<!-- EST-14a -->
- [ ] [decision→estaleiro/lint-policy] [i1][EST-14a][estaleiro/ui] createElement vs JSX — decidir lint rule (apps/estaleiro/ui/src/App.tsx:1-40)
- [ ] [spec→EST-14a] [i2][EST-14a][estaleiro/ui] screen.getByText vs seletor spec (apps/estaleiro/ui/tests/shell.test.tsx:8-15)
<!-- EST-17 -->
- [ ] [spec→EST-17] [i1][EST-17][estaleiro/spec] docs/_vendor/OmniRoute/ missing (tasks/EST-17.md:74-75)
<!-- C-19 -->
- [ ] [spec→C-19] [M1][C-19][plugin-tasks/spec] Spec drift EST-04b m1 (tasks/C-19.md:48 vs tasks/C-19.md:72)
- [ ] [spec→C-19] [M2][C-19][plugin-tasks/spec] Spec drift EST-04b i1 (tasks/C-19.md:49 vs tasks/C-19.md:73)
- [ ] [spec→process-cleanup] [m1][C-19][plugin-tasks/processo] Worker reverteu sem reendurecer (commits af989b8, 1788fae)
- [ ] [spec→process-cleanup] [i3][C-19][estaleiro/processo] Handover defer sem entrada no ledger (tasks/C-19.md:72-73)
<!-- M-016 -->
- [ ] [spec→M-016] [m][M-016][plugin-tasks/espec] Spec §7 promete 8 tests (tasks/M-016.md:184)
- [ ] [spec→EST-10] [i2][M-016][estaleiro/operacional] EST-10 sem subtasks (tasks/EST-10.md)
<!-- EST-08 -->
- [ ] [spec→EST-12] [i3][EST-08][processo] EST-12 merge perdido no reset (master local + EST-12 B1 ledger)
<!-- EST-10a -->
- [ ] [spec→EST-10a-followup] [m1][EST-10a][spec] Spec §4 stale com §5b (tasks/EST-10a.md:53 vs 75-77)
- [ ] [spec→process-cleanup] [i1][EST-10a][processo] Handover sem evidência literal (tasks/EST-10a.md:137-141)
<!-- EST-12 -->
- [ ] [spec→EST-12] [m1][EST-12][plugin-skills/spec] §4 caso 7 diverge (tasks/EST-12.md:128 vs tests/index.test.ts:112-117)
<!-- EST-10b -->
- [ ] [spec→EST-10b] [m1][EST-10b][plugin-providers/spec] index.ts scope creep (packages/plugin-providers/src/index.ts:4-5 vs §3)
<!-- EST-10c -->
- [ ] [spec→EST-10c] [m1][EST-10c][plugin-providers/spec] index.ts scope creep (packages/plugin-providers/src/index.ts:7-11 vs §3)
<!-- EST-13a -->
- [ ] [spec→worker-script] [i3][EST-13a][estaleiro/processo] Handover §8 não preenchido (tasks/EST-13a.md:148-150)
<!-- EST-13b -->
- [ ] [spec→EST-13b] [m1][EST-13b][plugin-knowledge/spec] §7 conta 8 vs 7 (tasks/EST-13b.md:119)
- [ ] [spec→EST-13b] [m3][EST-13b][plugin-knowledge/spec] package.json não listado em §3 (package.json:7 vs §3)
- [ ] [spec→worker-script] [i5][EST-13b][plugin-knowledge/processo] Handover §8 em branco (tasks/EST-13b.md:136-137)
<!-- EST-13c -->
- [ ] [spec→EST-13c] [m2][EST-13c][plugin-knowledge/spec] signal.aborted check parcial (writer.ts:24)
<!-- EST-14b -->
- [ ] [spec→process-cleanup] [m1][EST-14b][estaleiro/processo] Handover §8 vazio (tasks/EST-14b.md:392-393)
<!-- EST-14c -->
- [ ] [spec→EST-14c] [i1][EST-14c][estaleiro/ui] FleetView signature (FleetView.tsx:9 vs tasks/EST-14c.md:67)
<!-- EST-14d -->
- [ ] [spec→EST-14d] [m1][EST-14d][estaleiro/ui] Fixture fora do escopo (KnowledgeView.fixture.ts vs §3)
<!-- EST-14e -->
- [ ] [decision→arquiteto] [i5][EST-14e][estaleiro/infra] WsClient sem multi-listener (client.ts:11-16)
- [ ] [spec→EST-14e] [i6][EST-14e][estaleiro/spec] Bridge pattern ambígua (tasks/EST-14e.md:51-65)
<!-- EST-16 -->
- [ ] [spec→EST-16] [i1][EST-16][plugin-workflows/spec] FsPort.mkdirp drift (fs.ts:5-8 vs tasks/EST-16.md:198-200)
<!-- DMM-12 -->
- [ ] [spec→DMM-12] [m1][DMM-12][plugin-knowledge/spec] §3 2 vs 9 arquivos (tasks/DMM-12.md §3)
- [ ] [spec→DMM-12] [m1][DMM-12][plugin-knowledge/spec] R2: §3 impreciso (tasks/DMM-12.md §3)
<!-- DMM-09 -->
- [ ] [spec→DMM-09] [i1][DMM-09][estaleiro-ui/spec] §3 path drift (tasks/DMM-09.md §3)
- [ ] [spec→process-cleanup] [process][DMM-09][estaleiro-ui/process] Handover §8 vazio (tasks/DMM-09.md §8)
<!-- C-12 -->
- [ ] [spec→process-cleanup] [m][C-12][system-peer/processo] Worker não rodou git fetch (tasks/C-12.md:8)
<!-- C-14 (mais) -->
- [ ] [spec→C-14b] [m][C-14][orchestrator] §3 vs §4 inconsistente (tasks/C-14.md:86 vs 46-59)
<!-- C-11 (mais) -->
- [ ] [spec→C-11b] [m1][C-11][spec] Path graphRouting.ts errado (tasks/C-11.md:36)
- [ ] [spec→C-11b] [i3][C-11][processo] Evidência dead exports ausente (tasks/C-11.md:39)
<!-- C-13 (mais) -->
- [ ] [spec→C-13b] [m1][C-13][handover] Disposição imprecisa m2 (tasks/C-13.md:33 vs 74)
- [ ] [spec→C-13b] [i1][C-13][spec] m2 no-op deveria ser spec (tasks/C-13.md:74)
<!-- EST-30 -->
- [ ] [M1][EST-30][plugin-skills] `listSkills`/`listAgents` mascaram `exitCode !== 0 && stderr` como `[]` em vez de propagar — viola spec §4 ("traversal/path inválido"). Ação: trocar por `throw` + adicionar teste `rejects.toThrow` em dir inexistente. (packages/plugin-skills/src/index.ts:84-86, 115-117)
- [ ] [m1][EST-30][plugin-skills] `writeSkill`/`writeAgent` não validam `entry.name` (path traversal). Sonda 1: `path.join('skillsDir', '../escape', 'SKILL.md')` normaliza para `.claude/escape/SKILL.md` (escapa de `skills/` mas não do cwd graças ao FsPort allowlist). Ação: rejeitar `entry.name` com `[/\\]` ou `..`; teste `rejects.toThrow`. (packages/plugin-skills/src/index.ts:102-110, 133-141)
- [ ] [i1][EST-30][plugin-skills] `makeSkills` é primitiva testada mas sem caller de produção no worktree (spec §1 diz que integração é follow-up — não-achado desta review, flag para follow-up). (packages/plugin-skills/src/index.ts:61)
<!-- END EST-30 -->
<!-- EST-43a -->
- [ ] [m1][EST-43a][estaleiro] Teste 4 anti-fake (`tests/integration/provider-remote-smoke.test.ts:107-116`): se `probeProvider` não lançar (inesperadamente), o teste passa silenciosamente porque `expect` está só dentro do `catch`. Adicionar `await expect(...).rejects.toThrow()` ou `await expect(...).rejects.toMatchObject(...)` antes do try/catch.
- [ ] [m2][EST-43a][estaleiro] `tests/integration/provider-remote-smoke.test.ts:38-39`: variável `content` é computada do body parseado mas nunca usada (resposta fixa em `MARKER_REMOTE`). Dead code — remover ou usar.
- [ ] [m3][EST-43a][estaleiro] `tests/integration/provider-remote-smoke.test.ts:28-55` (`handleRequest`): o path da request não é validado — qualquer rota devolve 200. Adicionar `if (url.pathname !== "/v1/chat/completions") { res.writeHead(404); res.end(); return; }` para que o teste detecte mudança de path pelo adapter `@ai-sdk/openai`.
- [ ] [i1][EST-43a][estaleiro] Bump `@ai-sdk/openai` `^1.3.24` → `^2.0.0` é major; pnpm-lock mostra 38 linhas alteradas. Grep confirmou só `provider-probe.ts` em `apps/estaleiro/core` como consumidor de `createOpenAI` (outro pacote `plugin-context` usa `createOpenAICompatible` de outro pacote). Track: conferir release notes e rodar `pnpm audit` em janela separada.
<!-- END EST-43a -->
<!-- T-UIE-03 -->
- [ ] [spec→T-UIE-03] [m1][T-UIE-03][ui-engines/spec] Spec §7 linha 86-88 lista `pnpm --filter @plataforma/ui-engines test:e2e` mas o script não existe em `packages/ui-engines/package.json:15-20` (apenas `build`/`test`/`lint`/`typecheck`). Worker caiu para `pnpm --filter @plataforma/estaleiro test:e2e`, que é razoável (é o consumer real), mas a spec precisa refletir isso. Reendurecer §7 da task-origem (substituir o comando inexistente pelo filtro do consumer; ou criar `test:e2e` no `ui-engines` se for desejado smoke local). (tasks/T-UIE-03.md:83-88 vs packages/ui-engines/package.json:15-20)
<!-- END T-UIE-03 -->
<!-- T-PG-01 -->
- [ ] [spec→T-PG-02] [m2][T-PG-01][pages/spec] §5 "Pegadinhas conhecidas" da T-PG-01 diz "O perfil afeta L3 mas não L1/L2/L4", mas o caderno-3-sdk/11 §8 (fonte canônica) diz "o validador aplica o subset do perfil", e o caso de teste 11 explicitamente exige que perfil `documento` rejeite `Card` (L1 escopado por perfil). A implementação seguiu o caderno + teste (correto); a prosa da §5 ficou inconsistente. Ação: reendurecer §5 da T-PG-01 (ou, preferencialmente, alinhar quando T-PG-02 entrar em endurecimento). (tasks/T-PG-01.md:169 vs docs/caderno-3-sdk/11-linguagem-de-paginas.md:99-103)
<!-- END T-PG-01 -->
<!-- T-1039 -->
- [ ] [decision→T-1050] [M2][T-1039][core] Audience não validado contra o custodiante — gap arquitetural conhecido. `validateUcan(ucan)` em `assignCustodian.ts:97` sem 2º arg → check de audience em `ucan.ts:211-216` é condicional a `audiencePublicKey !== undefined`. Spec §3 diz literalmente `validateUcan(ucan)`, logo impl segue spec; gap é arquitetural, exige decisão. Track: criar task (registry `EntityId → Ed25519PublicKey`) para wiring de `validateUcan(ucan, custodianPublicKey)` em `canServeArchive`. Candidata T-1050 (criar e linkar). (packages/core/src/archive/assignCustodian.ts:97 vs packages/core/src/auth/ucan.ts:211-216; tasks/T-1039.md:326-330)
<!-- END T-1039 -->
<!-- END SPEC-PENDENCIAS -->

<!-- T-SHL-01 -->
- [ ] [m1][T-SHL-01][shell] 3 helpers sem declaração em §3 (vite.config.ts, vitest.config.ts, tests/setup.ts) — defer→T-SHL-01-rework
- [ ] [i1][T-SHL-01][shell] Worker declarou flexlayout-react@^0.9.0 em package.json:20 mas lockfile resolve para 0.9.2
- [ ] [i2][T-SHL-01][shell] tests/setup.ts só importa @testing-library/jest-dom
<!-- END T-SHL-01 -->

<!-- T-SHL-02 -->
- [ ] [spec→T-SHL-02] [m1][T-SHL-02][shell/spec] Spec §7 linha 150 diz `# tsc — precisa terminar sem erro` mas `packages/shell/package.json:14` define `"build": "vite build"` (com `vite-plugin-dts` para `.d.ts`). Worker executou o comando real (vite build 19 modules, dist/index.js 895.05 kB, verde); nota da spec é herança de quando o pacote era tsc puro. Reendurecer §7 de T-SHL-02 para refletir o build real.
- [ ] [i1][T-SHL-02][shell] Lint pós-merge falha em `packages/shell/src/workspace-store.ts:19:47` (`StoragePort` deprecated) — erro **pré-existente** (T-SHL-01, commit `9bb8a68`), NÃO introduzido por T-SHL-02. T-SHL-02's own files (`layout-manager.ts`/`layout-solver.ts`/`manifest-types.ts`) lint clean. Track: drift de T-SHL-01 a ser resolvido em rework próprio (não bloqueia T-SHL-02).
<!-- END T-SHL-02 -->

<!-- 009-01 -->
- [ ] [i1][009-01][superapp/scope] Spec §0 declara `complexity: 4` mas a decisão §6 está fechada e o escopo é estreito (1 tipo + reconhecimento + 4 cenários de teste). Re-classificar para `complexity: 2` no reendurecimento. (tasks/009-01.md:5)
- [ ] [i2][009-01][protocol/workflow] `getMoRDeclaration` retorna o `role` cru sem validar valores custom (aceitos via `string & {}`). Validação por role custom é responsabilidade do consumidor (Zen Engine). Track: revisar na integração do plugin-workflows. (packages/protocol/src/workflow/mor-anchor.ts:147-153)
<!-- END 009-01 -->

<!-- T-404b -->
- [ ] [defer→C-NN] [M1][T-404b][transport] Build error pré-existente em `syncCoordinator.ts:173` (`StoragePort` não-atribuível a `GraphStorePort`). `git diff master...HEAD` confirma 0 linhas modificadas nesse arquivo — o break é anterior a T-404b. T-404b não pode consertar sem scope creep. Track: criar task de cleanup `C-NN: refatorar syncCoordinator para GraphStorePort` (syncCoordinator.ts:173)
- [ ] [defer→C-NN] [M2][T-404b][transport] 7 lint errors pré-existentes em `syncCoordinator.ts:68, 91, 279, 280` (`@typescript-eslint/no-deprecated` — `StoragePort` marcado `@deprecated`). Mesma causa-raiz do M1; mesmo destino de cleanup. Track: ver M1 (syncCoordinator.ts:68,91,279,280)
- [ ] [i1][T-404b][transport] `cancel(peerId)` é no-op em peers DIRECT/FAILED/inexistentes (verificado por S1/S2/S3 das sondas), mas o JSDoc do método não explicita essa garantia. Track: 1 linha no JSDoc de `Engine.ts:90` deixando claro "no-op fora de PROMOTING" (packages/transport/src/promotion/Engine.ts:90)
- [ ] [i2][T-404b][transport] `directCount` é O(n) sobre `entries` (varre `entries.values()` em `Engine.ts:99-103`). Hoje a engine tem ≤ dezenas de peers, irrelevante. Se chegar a milhares, contador incremental atualizado nos `entry.state = …` vira upgrade. Marcar com `ponytail:` no comentário do método. (packages/transport/src/promotion/Engine.ts:97-104)
<!-- END T-404b -->

<!-- T-403 -->
- [ ] [M1][T-403][transport] Testes 2, 3, 6, 10 em automergeShell.test.ts usam `toBeGreaterThanOrEqual(0)` — nunca falham mesmo se broadcast não entregar. Trocar para `toBeGreaterThan(0)` ou `toBe(1)` + verificar payload/senderPeerId. (packages/transport/tests/automergeShell.test.ts:131,161,211,282)
- [ ] [M2][T-403][transport] Teste 15 não testa oversize real: `shell.broadcastEphemeral()` enfileira sem erro; o `encodeFrame` rejeita no adapter assíncrono. Reestruturar para testar via lane real ou verificar contador `droppedOversize` do adapter. (packages/transport/tests/automergeShell.test.ts:439-452)
- [ ] [M3][T-403][transport] `pnpm-workspace.yaml` fora do escopo (§3) — adicionou `cbor-extract: true`. Mudança correta (side-effect da dep Automerge) mas precisa declarar no escopo. (pnpm-workspace.yaml:7)
- [ ] [m1][T-403][transport] Teste 4 `listOpenDocs()` retorna 1 após `closeDoc` — correto (TTL não disparou), mas asserção parece contradizer "closeDoc libera recursos". Adicionar comentário. (packages/transport/tests/automergeShell.test.ts:168-171)
- [ ] [i1][T-403][transport] Erro de build pré-existente em syncCoordinator.ts:173 (`StoragePort` vs `GraphStorePort`) — NÃO causado por T-403. (packages/transport/src/syncCoordinator.ts:173)
- [ ] [i2][T-403][transport] 6 erros de lint pré-existentes (depreciação `StoragePort`) em graphRouting.ts + syncCoordinator.ts — NÃO causados por T-403. (packages/transport/src/discovery/graphRouting.ts:69,81; packages/transport/src/syncCoordinator.ts:68,91,279,280)
<!-- END T-403 -->
<!-- EST-45 -->
- [ ] [i1][EST-45][estaleiro-ui] Spec §3 menciona "8 abas existentes" mas `defaultLayout()` define 9 tabs (Board, Execução, Frota, Docs/RAG, Decisões, Custo, Config, Planejamento, Terminal). Todas funcionais, mas spec desatualizada. (apps/estaleiro/ui/src/shell/default-layout.ts:63-106)
- [ ] [i2][EST-45][estaleiro] E2E Playwright falha por schema SQLite pré-existente (plugin-tasks) — coluna `data` ausente. Não causado por EST-45; requer rebuild do plugin-tasks com migration. (plugin-tasks/storage/sqlite.js)
<!-- END EST-45 -->

<!-- T-602 -->
- [ ] [M1][T-602][workers] `prepareCommit()` é `async` na impl; spec §1:142-143 é explícito "Síncrono". Mudança de contrato de API. (packages/workers/src/sync/commitCycle.ts:184)
- [ ] [M2][T-602][workers] `CommitCycleConfig.storage: GraphStorePort` em vez de `StoragePort & GraphStorePort` (spec §1:106). Afrouxa tipo. (packages/workers/src/sync/commitCycle.ts:33)
- [ ] [M3][T-602][workers] Caso 11 "rollback atômico" **não testado** (storage não instrumentado). Teste é cópia do caso 6. (packages/workers/tests/commitCycle.test.ts:340-354)
- [ ] [M4][T-602][workers] Caso 12 "snapshot exato" **não testado** (`sha256(payload) === prepared.snapshotHash` ausente). Teste só conta bytes. (packages/workers/tests/commitCycle.test.ts:356-368)
- [ ] [M5][T-602][workers] Caso 9 "reconexão" **não testado** (re-uso de `receiveRemoteChange`; nenhum cenário de queda + load de snapshot + A.merge). (packages/workers/tests/commitCycle.test.ts:311-319)
- [ ] [m1][T-602][workers] Caso 3 usa `setTimeout(r, 10)` real (l.224) — viola §5 "NÃO use timers reais nos testes — use VirtualClock". (packages/workers/tests/commitCycle.test.ts:224)
- [ ] [m2][T-602][workers] Caso 7 não exercita race "change de peer durante commit" (clearStaging seletivo). (packages/workers/tests/commitCycle.test.ts:275-290)
- [ ] [m3][T-602][workers] Caso 8 não aplica `A.merge` nem verifica que tabela `nodes` só recebe commits. (packages/workers/tests/commitCycle.test.ts:292-309)
- [ ] [i1][T-602][workers] Assinatura de `insertNodeWithEdges` em `core/src/lineage.ts:75` diverge do spec (GraphStorePort-only vs `StoragePort & GraphStorePort`).
- [ ] [i2][T-602][workers] TypeScript não flagou `nodeId: string` vs `id: ULID` — hardening recomenda `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` em `tsconfig.base.json`.
<!-- END T-602 -->

<!-- T-602 (Reviewer 2, pós-rework 2026-07-16) -->
- [x] [M1→fix][T-602][workers] `prepareCommit()` async → agora síncrono em `commitCycle.ts:203` (Reviewer 2 confirmou).
- [x] [M2→fix][T-602][workers] `CommitCycleConfig.storage: GraphStorePort` → agora `StoragePort & GraphStorePort` em `commitCycle.ts:35` (com eslint-disable no-deprecated).
- [~] [M3→partial][T-602][workers] Caso 11 "rollback atômico" — `commitCycle.test.ts:446-463` instrumenta `putEdge` mas SÓ valida "ZERO aresta". Faltam: ZERO nó novo, `entity_heads`/`entity_members` intactos, staging preservado, re-tentativa.
- [x] [M4→fix][T-602][workers] Caso 12 "snapshot exato" — `commitCycle.test.ts:482-486` agora valida `sha256(storedNode.payload) === sha256(prepared.snapshot)`.
- [~] [M5→STUB][T-602][workers] Caso 9 "reconexão" — AINDA não exercita A.load/A.merge. `commitCycle.test.ts:402-426` declara `dA`/`dB` nunca usadas. **Reviewer 2 confirma claim do rework era falsa.**
- [~] [m1→weak][T-602][workers] Caso 3 "limiar 50" — `commitCycle.test.ts:253` usa `await clock.advance(0)` que é **no-op** (testkit/src/clock.ts:26 retorna early se `ms<=0`). Fire-and-forget do `void this.forceCommit()` não é verificado.
- [x] [m2→fix][T-602][workers] Caso 7 "clearStaging seletivo" — `commitCycle.test.ts:337-340` adiciona `pc3` (3º peer) e verifica sobrevivência.
- [~] [m3→partial][T-602][workers] Caso 8 "2 editores convergem" — shells conectados + 2 commits, mas nenhum `A.merge` é chamado. Spec §4 ("tabela `nodes` só recebe commits") não testada.
- [ ] [m4][T-602][workers] Caso 11 stub: spec §4 lista 6 invariantes; teste só cobre 1 (aresta zero). (packages/workers/tests/commitCycle.test.ts:446-463)
- [ ] [m5][T-602][workers] Caso 9 stub: vars `dA`/`dB` declaradas nunca usadas. Sem `A.load(snapshot)` nem `A.merge(docLocal, docSnapshot)`. (packages/workers/tests/commitCycle.test.ts:402-426)
- [ ] [m6][T-602][workers] Caso 8 sem `A.merge`: shells conectados + 2 commits em storage compartilhado, mas nenhuma asserção de convergência dos docs. (packages/workers/tests/commitCycle.test.ts:343-400)
- [ ] [M6][T-602][workers] `entityId = authorId` em `commitCycle.ts:234` (vs spec implícito "uma entidade por doc"); defensável mas divergente.
- [ ] [i3][T-602][workers] `@noble/curves@^2.0.0` adicionado em `package.json:14` (fora do escopo §1:46-50). Mover `ed25519.getPublicKey(sk)` para `packages/crypto/src/wrappers.ts` e remover dep transitiva.
- [ ] [i1→open][T-602][core] `insertNodeWithEdges` em `core/src/lineage.ts:76` ainda é `storage: GraphStorePort` (spec exige `StoragePort & GraphStorePort`).
<!-- END T-602 (Reviewer 2) -->

<!-- T-602 (Reviewer 3, pós-rework #2 2026-07-16) -->
- [x] [B1.6→fix][T-602][workers] `parentHash` non-root corrigido em `commitCycle.ts:240-243` (`hashNode(parent)` em vez de `snapshotHash`).
- [~] [M1.3→partial][T-602][workers] Caso 11 rollback **ainda parcial** (3/6 invariantes): ✅ (b) ZERO aresta, (e) staging preservado, (f) retry ok. ❌ (a) ZERO nó novo não testado; (c) `entity_heads` check é no-op (l.456-459 descarta promise); (d) `entity_members` só comentário.
- [x] [M1.5→fix][T-602][workers] Caso 9 reconexão: `commitCycle.test.ts:409,412` chamam `A.load` + `A.merge` reais. Stub `dA`/`dB` eliminado. Assert fraco (l.415) — `mergedState` definido, mas não crava que change local de B sobreviveu.
- [x] [m1.1→fix-fraco][T-602][workers] Caso 3: `clock.advance(1)` em vez de `advance(0)` (mecanismo OK). Assert tolerante a ambos os caminhos (l.260-264).
- [x] [m1.3→fix][T-602][workers] Caso 8: mesmo `authorId`, 2 commits, AUTHORED===2 + MUTATES≥1.
- [ ] [i1.1→open][T-602][core] `core/src/lineage.ts:76` ainda `storage: GraphStorePort` (spec §1:75 exige `& StoragePort`).
- [x] [i1.3→fix][T-602][crypto] `@noble/curves` removido de `workers/package.json`; `ed25519GetPublicKey` exportado em `crypto/wrappers.ts:26-28` e usado em `commitCycle.ts:96`.
- [ ] [M7][T-602][workers] **NOVO: `double_finalizeCommit` cria nó fantasma.** Trace estático: 2× `forceCommit()` sem stage ⇒ 1º normal; 2º: `pendingChanges=[]`, `isRoot=false` (`#lastNodeId` setado), persiste nó com `parentHash=hashNode(nodeId1)`, `payload=A.save(doc)` (mesmo), `AUTHORED` com `count=0`, `MUTATES` fantasma. Guardas existem em `#onInactivity:154` e `#onMaxPendingTimeout:170` mas não em `forceCommit`/`finalizeCommit` públicos. Fix: throw ou no-op se `pendingChanges.length === 0`.
- [ ] [m7][T-602][workers] Caso 3: trocar assertion tolerante (l.260-264) por `expect(cycle.pendingChanges).toHaveLength(0)` após `await`.
- [ ] [m8][T-602][workers] Caso 9: asserir que change local de B sobreviveu ao merge (não só `mergedState defined` em l.415).
- [ ] [i4][T-602][monorepo] `pnpm-lock.yaml` claimed em `COMMIT_EDITMSG` ("new — created") mas `glob **/pnpm-lock.yaml` retorna 0 matches. Provavelmente estado pré-existente do projeto, mas inconsistência na afirmação.
- [ ] [i5][T-602][crypto] `packages/crypto/src/wrappers.ts` (mudança de `ed25519GetPublicKey`) está fora do §3 escopo. R2 já apontou a forma correta, então é fix de desvio anterior, não novo.
- [ ] [m9][T-602][workers] `allNodes` populado por `rangeScan` no caso 8 (l.360-364) mas nunca usado (dead code). Limpar.
- [ ] [m10][T-602][workers] Caso 11 (l.451, 454) usa `'author-1'` como key para `getEntityHead`/`getEntityId`; semanticamente `node.id` seria mais correto. Funciona por acidente.
- [ ] [i6][T-602][workers] `hashNode` adicionado ao import em `commitCycle.ts:5` sem estar listado na spec §1:54. Necessário para o B1.6 fix (R2). Justificado.
- [ ] [recomendação→T-603][workers] Quando T-603 (co-assinatura) entrar, validar que `prepared.snapshotHash` é preenchido em `prepareCommit()` antes de co-assinar (hoje `finalizeCommit:250` recomputa via `sha256(prepared.snapshot)`, enfraquecendo a invariante "PreparedCommit imutável" do spec §1:114-123).
<!-- END T-602 (Reviewer 3) -->

<!-- EST-47 (Reviewer 1) -->
- [ ] [M1→open][EST-47][estaleiro-core] Sonda 3: error propagation do `readClaudeMd` no fluxo end-to-end → 500 INTERNAL não tem cobertura. Único teste do path é o unit `chat-context.test.ts:53-60` (rejects.toThrow do `buildChatContext` puro); o `assembleAndSend().catch` em `bootstrap.ts:349-362` não é exercitado. Acoplado a B2.
- [ ] [M2→open][EST-47][estaleiro-ui] Numeração dos casos §4.3 não é 1-1 com a spec. Worker usou 19-22 (espalhados) vs spec 12-16. Funcionalmente correto mas dificulta auditoria cruzada. Cosmético.
- [ ] [i1→open][EST-47][estaleiro-core] Decisão D1 (spec §6) fechada com opção A — `ContextReader` expandido com `listSkills()`. Trade-off: agora 3 métodos em vez de 2, mas elimina interface `SkillsLister` paralela. Não-bloqueante, alinhado com recomendação §6.
- [ ] [i2→open][EST-47][estaleiro-core] Verbosidade do `bootstrap.ts:301-365` — `if/else if` ramificado para `method === "POST"` é espaguete; candidato a `switch` ou roteador. Não impacta funcionalidade. (apps/estaleiro/core/src/bootstrap.ts:301-365)
- [ ] [i3→open][EST-47][estaleiro-ui] `getByRole("checkbox", { name: /CLAUDE\.md/i })` em `ChatView.test.tsx:202` é frágil se o label da UI mudar. Acoplar a um `data-testid` ou `aria-label` estável. (apps/estaleiro/ui/src/views/chat/ChatView.test.tsx:202)
<!-- END EST-47 (Reviewer 1) -->

<!-- EST-48b -->
- [ ] [m1][EST-48b][estaleiro] Version bump em `apps/estaleiro/package.json` (0.0.82→0.0.88) fora do escopo declarado (§3). Mudança cosmética, sem impacto funcional.
<!-- END EST-48b -->

<!-- P-05 -->
- [ ] [m1][P-05][integrar-task] renumeração saltou o passo 5 em `.claude/skills/integrar-task/SKILL.md` (gap 4→6) ao inserir o novo step "Atualiza manifesto de saúde (fire-and-forget)"; conteúdo e referências internas (ex.: "passo 6" em §11) seguem corretas — fix trivial em passagem futura (re-renumerar 6→5 ou inserir um passo 5 entre o manifesto e o push) (.claude/skills/integrar-task/SKILL.md:78-100)
<!-- END P-05 -->

<!-- EST-48c (Reviewer 1) -->
- [ ] [M1][EST-48c][estaleiro] `apps/estaleiro/package.json` version bump (0.0.90→0.0.92) fora do escopo declarado na §3 da spec. Cosmético, sem impacto funcional; mesmo padrão de housekeeping registrado para EST-35a, EST-36, EST-48b. Disposição sugerida: reverter e delegar a task de housekeeping ou absorver em release notes (apps/estaleiro/package.json:3)
- [ ] [M2][EST-48c][estaleiro-ui] `ProfileSection.test.tsx` cobre 13 dos 14 casos exigidos na Seção 4.1 da spec. Faltam explícitos: caso 3 (assertion de que o perfil criado aparece renderizado na lista após submit — atualmente só verifica que `create` foi chamado) e caso 14 (anti-fake localStorage — nenhum teste dedicado que afirme que após criar/ativar perfil, `localStorage.getItem(...)` não contém a apiKey). Cobertura parcial dos 14 cenários da spec. (apps/estaleiro/ui/src/views/config/ProfileSection.test.tsx:1-362 vs tasks/EST-48c.md:85-120)
- [ ] [m1][EST-48c][estaleiro-ui] `ProfileSection.tsx:2` importa `CreateProfileInput` e `UpdateProfileInput` de `@plataforma/plugin-providers` mas nenhum dos dois tipos é referenciado no corpo do componente. Lint `@typescript-eslint/no-unused-vars`. Provavelmente sumirá automaticamente quando B2 (resolução de imports) for consertado e o módulo for importado por outros consumidores. (apps/estaleiro/ui/src/views/config/ProfileSection.tsx:2)
<!-- END EST-48c (Reviewer 1) -->

<!-- BEGIN PROC-PENDENCIAS -->
<!-- Achados de processo (P0/P1 de relatórios de execução / tooling observada) que o `/agrupar-cleanup` drena em tasks de tooling. -->
<!-- END PROC-PENDENCIAS -->
