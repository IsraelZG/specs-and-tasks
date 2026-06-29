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
- [ ] [m1][T-208][protocol] Mudança de escopo não declarada: ClockPort estendido com setTimeout/clearTimeout — spec §3 só declarava GenesisWriter (ports.ts:58-78)
- [ ] [m2][T-208][transport] Mudança de escopo não declarada: devDep @plataforma/testkit adicionada ao package.json — spec §3 declarava como [READ] (package.json:15)
- [ ] [m3][T-208][transport] Cobertura incompleta do caso 8: idempotência de writeGenesis só cobre GENESIS já assentado via start() idempotente, não re-entrada em GENESIS (fpp.test.ts:118-130)
- [ ] [i1][T-208][transport] onPeerFound descarta o peerId silenciosamente (void peerId) — útil para logging/diagnóstico (fpp.ts:128-130)
- [ ] [i2][T-208][transport] _emit usa console.error para exceções de handler — defensivo, não na spec (fpp.ts:240-248)
- [ ] [m1][T-212][protocol] Handover do executor contém "snapshot.ts não existe na worktree" — factualmente incorreto (arquivo existe e workaround já removido por T-308-rework-2); item de DoD §7 fica satisfeito pela rework-2 de T-308, não por T-212 — housekeeping, não bloqueia (tasks/T-212.md:119)
- [ ] [m1][T-802][media] `!` non-null assertion no arquivo de teste — spec §5 proíbe `!` no geral (src está limpo); refatorar `reordered[0]!`/`tampered[0]!`/etc para guards (verifyReassemble.test.ts:53-55, 98, 147-151, 22)
- [ ] [m1][T-1009][testkit] Desvio do contrato TS: parâmetro `pattern` em vez de `jsonEscapedPattern`; spec §1 diz "como aparece no JSON source" mas §4 caso 1 usa pattern decoded — impl escolheu a interpretação do §4 (alinhada com os testes). Spec §1 precisa ser atualizado para alinhar com a impl (psRegex.ts:13-21, 30-34)
- [ ] [m2][T-1009][testkit] Spec §3 inconsistente sobre localização do test (src/ vs tests/); impl resolveu com `tests/psRegex.test.ts` (convenção Vitest, consistente com clock.test.ts, random.test.ts do pacote). Spec §3 precisa referenciar a convenção Vitest do pacote
- [ ] [m1][T-305a][protocol] Defensive handling: extractEntityIds aceita capability com `resource: 'entity:'` (prefixo + ID vazio) e devolve `['']`, o que crasha scopeRBSRTree via BTree.validateId. Fix de 1 linha: `cap.resource.length > ENTITY_PREFIX.length` antes do add (ucanScope.ts:24-32)
- [ ] [m1][T-302a][protocol] Mudança fora do escopo declarado na §3: `packages/protocol/package.json` (devDep `@plataforma/testkit`), `packages/protocol/src/index.ts` (re-export do novo módulo) e `packages/testkit/src/index.ts` (export de `SimNetwork`) — suporte necessário mas deveria constar em [CREATE]/[EDIT] (package.json:16, src/index.ts:24-25, testkit/src/index.ts:3)
- [ ] [m2][T-302a][protocol] `respondNodes` exportado em `index.ts` mas não declarado nos Contratos exatos da §1 (aparece só na impl) — adicionar à spec ou remover do `index.ts` (src/rbsr/exchange.ts:161-175, src/index.ts:24)
- [ ] [m3][T-302a][protocol] Spec §1 declara `ids: ULID[]` em `requestNodes`; impl usa `string[]`. Equivalente em runtime (ULID é string opaca) mas desvia da assinatura nominal — alinhar (src/rbsr/exchange.ts:152-158)
<!-- END PENDENCIAS -->
