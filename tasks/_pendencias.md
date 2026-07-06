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
> **Última drenagem (2026-07-06):** Itens EST-03b/c/d (C-18), EST-04a/b/c (C-19) movidos para cleanup plugin-tasks. T-1037 (ADR) movido ao SPEC-PENDENCIAS. Restam 2 itens não capturados: T-802 (media), T-1028 (scheduler).

- [ ] [m1][T-802][media] `!` non-null assertion no arquivo de teste — spec §5 proíbe `!` no geral (src está limpo); refatorar `reordered[0]!`/`tampered[0]!`/etc para guards (verifyReassemble.test.ts:53-55, 98, 147-151, 22)
- [ ] [i1][T-1028][scheduler] `RUNNABLE_STATUSES` usa `'draft'` (alias legado) — tipo `TaskStatus` ainda inclui, compila sem erro. Migração T-1030 substituirá por `'draft:placeholder'`; scheduler deve ser atualizado junto (scheduler.ts)
<!-- C-18 -->
- [ ] [i1][C-18][plugin-tasks] **Cobertura de testes incompleta para os 3 fixed novos.** (a) `evidenceGuard.ts:18-21` novo check de conteudo (/build/i || /test/i) sem teste negativo; (b) `identityGuard.ts` refactor para `options.blockedActors`/`blockedRolePrefixes` sem teste de injecao; (c) `service.ts:64-69` novo check `VALID_STATUSES.has(task.status)` sem teste. Track: 3 testes a adicionar (~10-15 linhas). Nao-bloqueante (packages/plugin-tasks/src/{guards/evidenceGuard,guards/identityGuard,service}.ts)
- [ ] [i2][C-18][plugin-tasks] **EST-03d i5 e fix parcial, nao total.** Spec sugeria refactor para metadado declarativo; worker entregou constants extraidas (REVIEW_VERBS, FINISH_VERB) que mantem acoplamento guarda<->verbo no `service.ts:55-61`. Mudanca cosmetica+readability, nao arquitetural. Track: refactor para metadado e mudanca de design (~complexity 2) (packages/plugin-tasks/src/service.ts:55-61)
- [ ] [i3][C-18][plugin-tasks] **Duplicacao VALID_STATUSES (service.ts:11-17) vs TRANSITIONS (stateMachine.ts:12-25).** Os 12 keys de TRANSITIONS sao redeclarados como Set em service.ts. Refactor: derivar de Object.keys(TRANSITIONS) - 1 linha. Track: pode ser absorvido no re-endurecimento batch de EST-loader (packages/plugin-tasks/src/service.ts:11-17 vs packages/plugin-tasks/src/stateMachine.ts:12-25)
- [ ] [i4][C-18][estaleiro/processo] **Handover S8 linha 73 diz "5/13 fixed, 5/13 no-op/defer, 3/13 ja resolvidos no merge"** mas a tabela abaixo lista 13/13 destinos. Categoria "3/13 ja resolvidos" nao e reconciliada - provavel erro de digitacao. Cosmetico. Nao-bloqueante (tasks/C-18.md:73 vs tasks/C-18.md:77-89)
<!-- END C-18 -->
<!-- C-19 -->
- [ ] [M1][C-19][plugin-tasks/spec] **Spec drift EST-04b m1.** Spec §4 linha 48 afirma `fixed (tsconfig.json:7, parser.ts:183,199)` mas Handover §8 linha 72 diz `defer`. Spec stale — alinhar com Handover (reendurecer C-19 ou reescrever spec §4 com taxonomia `defer→T-YYY` nomeada). Track: 1 linha na spec ou novo reendurecimento (tasks/C-19.md:48 vs tasks/C-19.md:72)
- [ ] [M2][C-19][plugin-tasks/spec] **Spec drift EST-04b i1.** Spec §4 linha 49 afirma `fixed (package.json:12)` mas Handover §8 linha 73 diz `defer`. Mesma raiz de M1 (tasks/C-19.md:49 vs tasks/C-19.md:73)
- [ ] [m1][C-19][plugin-tasks/processo] **Worker reverteu 2 dos 9 fixes (commits `af989b8` + `1788fae`) sem reendurecer a spec.** Padrão "spec promete fixed, código tem defer, ledger não tem entrada" replica o gap do EST-04b i1. Track: protocolo de C-tasks deve proibir `git revert` sem atualização síncrona de spec §4 (commits `af989b8`, `1788fae`)
- [ ] [i1][C-19][plugin-tasks] **Regex de heading cobre só 3 travessões (en-dash/em-dash/hífen ASCII).** Faltam U+2010 hyphen e U+2015 horizontal bar. Cadernos com digitação exótica (e.g. copy-paste de Word) podem falhar. Track: adicionar 2 chars à classe (parser.ts:30)
- [ ] [i2][C-19][plugin-tasks] **LOG_LINE_RE silenciosamente ignora linhas mal-formatadas.** Linhas sem o espaço após `- **` viram `if (!match) continue` sem warning. Dificulta debug. Track: push warning quando match falha (parser.ts:73-80)
- [ ] [i3][C-19][estaleiro/processo] **Handover §8 diz "2 defer" mas worker não adicionou ao `_pendencias.md` (BEGIN/END PENDENCIAS).** Taxonomia §2a exige `defer→T-YYY` nomeado — o destino não pode ficar só no Handover. Track: drain manual + protocolo (tasks/C-19.md:72-73 vs tasks/_pendencias.md)
<!-- END C-19 -->
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
<!-- END SPEC-PENDENCIAS -->
