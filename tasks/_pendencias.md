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
<!-- END PENDENCIAS -->
