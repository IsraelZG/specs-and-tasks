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
<!-- END PENDENCIAS -->
