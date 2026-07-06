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
> **Última drenagem (2026-07-06):** Itens de core (C-10), transport+protocol (C-11), system-peer (C-12), bancada (C-13), orchestrator (C-14), control (C-15) e estaleiro (C-16) movidos para suas C-tasks. Abaixo, itens não capturados: T-802 (media), T-1028 (scheduler), T-1037 (adr).

- [ ] [m1][T-802][media] `!` non-null assertion no arquivo de teste — spec §5 proíbe `!` no geral (src está limpo); refatorar `reordered[0]!`/`tampered[0]!`/etc para guards (verifyReassemble.test.ts:53-55, 98, 147-151, 22)
- [ ] [i1][T-1028][scheduler] `RUNNABLE_STATUSES` usa `'draft'` (alias legado) — tipo `TaskStatus` ainda inclui, compila sem erro. Migração T-1030 substituirá por `'draft:placeholder'`; scheduler deve ser atualizado junto (scheduler.ts)
- [ ] [i1][T-1037][adr] Exemplo citado em ADR-005:24 (`await storage.exec('SELECT * FROM nodes WHERE id = ?', [id])` de `lineage.ts:51`) é representativo, não contratual. Em passada futura, regenerar a partir de `lineage.ts` corrente para endurecer evidência (adr-005-storage-engine-agnosticism.md:24)
- [ ] [i2][T-1037][adr] Engine KV do segundo adapter não-fixada intencionalmente no ADR (categoria "KV/documento" sem fixar LMDB/RocksDB/mock). Decisão deliberada: escolha em T-1044 (status `ready`, deps=[T-1043]). Não-bloqueante (adr-005-storage-engine-agnosticism.md:62)
<!-- EST-03b -->
- [ ] [m1][EST-03b][estaleiro] `TRANSITIONS["draft:decomposed"] = {}` e `TRANSITIONS["done"] = {}` usam `{}` literal — `Partial<Record<TransitionVerb, TaskStatus>>` aceita, mas eslint-plugin-consistent-type-assertions (se ligado) reclamaria em strict. Cosmético (packages/plugin-tasks/src/stateMachine.ts:17,23)
- [ ] [m2][EST-03b][estaleiro] Test 7 (ciclo completo) usa `current as never` (cast forçado) — `current: string` (linha 42) é tipo mais amplo que `TaskStatus`. Type-safe se declarado `let current: TaskStatus = steps[0][0] as TaskStatus;` desde o início. Não-bloqueante (packages/plugin-tasks/tests/stateMachine.test.ts:42-44)
- [ ] [i1][EST-03b][estaleiro/spec] Spec §1 só lista os 12 sub-status do lifecycle (sem legacy `'draft'` alias). Forward-looking, alinhado com T-1030. Compat: legacy ainda é aceito em `task.types.ts:7` (até T-1030 migration), mas esta state machine não reconhece — diverge da canônica (capturado em M2)
- [ ] [i2][EST-03b][estaleiro/spec] Spec §1 e §4 **internamente inconsistentes** — §1 TRANSITIONS: `review: { claim: "in_review" }` (approve NÃO válido de `review`); §4 test 3: `transition("review", "approve") → "done"` (approve de `review` DEVE funcionar). Worker corrigiu o teste para `in_review + approve`. Decisão legítima mas spec §1 não foi atualizada (capturado em M2)
- [ ] [i3][EST-03b][estaleiro] `TransitionError` é classe (`extends Error`, com `name` setado). Test usa `.toThrow(TransitionError)` que checa por **instância** (não string). Bom design — permite catching específico pelo tipo (packages/plugin-tasks/src/stateMachine.ts:5-10)
- [ ] [i4][EST-03b][estaleiro/process] **4ª task consecutiva com regressão de lint** (EST-02b 0→7, EST-02c 0→5, EST-03a 0→1, EST-03b 0→1). Recomendo ao arquiteto revisar wargame template (incluir `pnpm --filter <pkg> lint` no DoD §7 das próximas EST-*) OU adicionar pre-finish lint check no `validate-task.mjs`. Não-bloqueante para EST-03b; é follow-up de processo
- [ ] [i5][EST-03b][estaleiro/spec] `pause: "in_progress"` em `in_progress` é self-transition (a chave aponta para o próprio status). Funcionalmente OK mas conceitualmente confuso — `pause` parece "ir para algum lugar" mas só se mantém. Sugestão: comentário inline ou aceitar forma canônica. Não-bloqueante (packages/plugin-tasks/src/stateMachine.ts:19)
- [ ] [i6][EST-03b][estaleiro/spec] **Spec drift estrutural capturado em M2 do parecer** — spec §1 não é espelho fiel do MGTIA canônico. Após decisão do arquiteto (Caminho α re-endurecer ou β declarar subset), M2 fecha e EST-03c pode herdar a state machine sem regressão. Track: tarefa dedicada de spec-reendurecimento ou EST-03c estende (packages/plugin-tasks/src/stateMachine.ts:12-25 vs apps/nexus-backend/src/services/task.types.ts:37-55)
<!-- EST-03b R2 -->
- [ ] [i7][EST-03b][estaleiro/spec] **Gap arquitetural descoberto no rework (R2)**: `demote` está em `TaskAction` canônico (`task.types.ts:26`) mas **NÃO está em `TransitionVerb`** do EST-03a (`packages/plugin-tasks/src/schema.ts:39-43`). Worker dropou `demote` da TRANSITIONS para evitar verb fora do union. Caminhos: (a) re-endurecer EST-03a para incluir `demote` no union + re-adicionar à TRANSITIONS do EST-03b; (b) declarar `demote` fora do escopo de plugin-tasks (decisão arquitetural). Não-bloqueante para EST-03b (fechou os 14 verbos que conhece). Track: follow-up arquitetual via re-endurecimento de EST-03a antes de EST-03c (packages/plugin-tasks/src/schema.ts:39-43 vs apps/nexus-backend/src/services/task.types.ts:26)
<!-- END EST-03b R2 -->

<!-- EST-03c -->
- [ ] [i1][EST-03c][estaleiro] `assertValidModelIdentity("agile_reviewer:gemini")` é **bloqueado** pela guarda atual (trata `agile_reviewer` como papel-prefix). Exceção do CLAUDE.md §Identidade implica formato `agile_reviewer:<modelo>` é válido. Caminhos: (a) `identityGuard` extrai modelo após `:` quando prefixo é `agile_reviewer`; (b) orchestrator chama `identityGuard` apenas para log entry (extraindo `gemini`), não para autorização. Não-bloqueante — EST-loader decide; impl segue letra do spec (packages/plugin-tasks/src/guards/identityGuard.ts:27-32)
- [ ] [i2][EST-03c][estaleiro] As 3 guardas são **independentes** (cada uma tem bypass) mas spec não diz **quando chamar qual**. Para `approve`/`request_changes`: `roleGuard` + `identityGuard`? `agile_reviewer:gemini` passa em `roleGuard` mas bloqueia em `identityGuard` (ver i1). Para outras ações: só `identityGuard`? Spec implícito. Não-bloqueante — EST-loader desenha composição (packages/plugin-tasks/src/guards/{role,evidence,identity}Guard.ts)
- [ ] [i3][EST-03c][estaleiro] `assertEvidencePresent` valida apenas **presença** (`!section8 || trim === ''`), não **conteúdo** (build/test/lint literal). Spec §1 diz "section8 deve conter saída literal de build+test" mas o contrato do impl é "section8 não-vazia". Decisão consciente (test 5 do spec só verifica "não-vazio"); orchestrator ou auditor humano valida conteúdo. Segurança em profundidade (packages/plugin-tasks/src/guards/evidenceGuard.ts:12-16)
- [ ] [i4][EST-03c][estaleiro] Bypass implementado como **opção de função** (`options.bypass: true`), não como **flag de frontmatter** da task. Spec §0 diz "flag explícita no schema da task, nunca silenciosa" — o impl satisfaz a literal (flag explícita) mas via argumento, não via frontmatter. Não-bloqueante — orchestrator (EST-loader) lê frontmatter e passa opção. Mais testável/composável que ler frontmatter dentro da guarda (packages/plugin-tasks/src/guards/{role,evidence,identity}Guard.ts)
- [ ] [i5][EST-03c][estaleiro] `BLOCKED_ACTORS = new Set(["Crush", "Antigravity", "opencode"])` e `BLOCKED_ROLE_PREFIXES = [5 items]` são **hardcoded** no source. Spec lista os mesmos valores em §1. Casa com spec. Adicionar harness/role novo = editar source. Não-bloqueante — eventual refactor para config injetada é follow-up (packages/plugin-tasks/src/guards/identityGuard.ts:7-15)

<!-- EST-03c R2 -->
- [ ] [m1][EST-03c-r2][plugin-tasks] **M1 confirmado por sonda em `identityGuard.ts:27-33`**: `BLOCKED_ROLE_PREFIXES` usa `actor.startsWith(prefix)` que **rejeita o formato canônico `agile_reviewer:<modelo>`** (ex.: `agile_reviewer:gemini`, `agile_reviewer:deepseek`). CLAUDE.md §Identidade autoriza explicitamente esse formato ("o serviço autoriza pelo prefixo antes de `:`"). R2 diverge de R1 (que tratou como i1/info open question): R2 probe provou que é bug real, não decisão arquitetural. **Fix:** distinguir papel puro de papel:modelo — checar `actor === prefix || (actor.startsWith(prefix) && !actor.includes(":"))`. Cobertura: adicionar em `tests/guards.test.ts` caso "ator `agile_reviewer:gemini` → permitido" (packages/plugin-tasks/src/guards/identityGuard.ts:27-33)
- [ ] [i1][EST-03c-r2][plugin-tasks/arquitetura] **Gate de wiring §5.1** — as 3 guardas são primitivas de autorização mas **nenhum caller em `src/**` (fora de `tests/**`) as consome**. `grep` confirma 0 imports de `./guards/*.js` em código de produção. Integração com `stateMachine.ts` (EST-03b) é a próxima task lógica mas não foi criada/linkada como dep/blocker de EST-03c. **Track** — gap de wiring a fechar em EST-loader ou follow-up dedicado (packages/plugin-tasks/src/guards/index.ts)
- [ ] [i2][EST-03c-r2][plugin-tasks/estilo] `assertValidModelIdentity("agile_reviewerxyz")` (sem `:`) **passa**? Não — `startsWith("agile_reviewer")` retorna `true`, então seria bloqueado. Edge case: `agile_reviewer_xyz` também bate. Hoje, qualquer string começando com `agile_reviewer` é bloqueada — incluindo variantes legítimas como `agile_reviewer-interno` (não documentadas). Não-bloqueante; nota para design (packages/plugin-tasks/src/guards/identityGuard.ts:27-33)
<!-- END EST-03c R2 -->
<!-- END EST-03c -->
<!-- END EST-03b -->
<!-- END PENDENCIAS -->

<!-- BEGIN SPEC-PENDENCIAS -->
<!-- Achados de spec/decisão recuperados de C-01..C-09 (2026-07-02). Destino explícito por achado.
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
<!-- END SPEC-PENDENCIAS -->

<!-- EST-04a -->
- [ ] [m1][EST-04a][estaleiro] `parseTaskMd` não envolve `matter(raw)` em try/catch — spec §4 caso 4 atendido por propagação do `gray-matter` (erro com line/column), mas wargame M1 previa "erro vira {file, error} no relatório e o processamento CONTINUA" — não implementado. Não-bloqueante (scripts/migrate/parser.ts:148)
- [ ] [m2][EST-04a][estaleiro] Regex `^##\s+(\d+[a-z]?)` não cobre headings com faixa (`## 4–7. Entregue` em ORQ-07) — vira seção "4". Wargame M3 já registrou a limitação. Não-bloqueante (scripts/migrate/parser.ts:30)
- [ ] [i1][EST-04a][estaleiro] `scripts/migrate/index.ts:1-3` é re-export puro de parser.js — spec §3 pediu [CREATE] index.ts, tecnicamente atende, mas conteúdo é plumbing. Wargame M1 mencionava "glob+filter" que não está aqui. OK pela spec, só observo
- [ ] [i2][EST-04a][estaleiro] Smoke do corpus passou em 399/403 com 0 erros e 123 warnings — mapeamentos legados (`parent_task`→`parent`, `subtasks`→`children`, `draft` sem sub-status, `ui`/`worktree`/`check`/`itens`/`decisions` em `extra`). B2 (zero perda) OK: nada descartado silenciosamente
