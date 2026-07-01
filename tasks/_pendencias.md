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
- [ ] [m1][T-802][media] `!` non-null assertion no arquivo de teste — spec §5 proíbe `!` no geral (src está limpo); refatorar `reordered[0]!`/`tampered[0]!`/etc para guards (verifyReassemble.test.ts:53-55, 98, 147-151, 22)
- [ ] [i3][T-021][ci] Link do run de CI ausente da Seção 8 (§7 exige): workflow dispara em push p/ `master` pós-merge; evidência local cobre os 5 comandos do bloco de Verificação — capturar link do run de CI (x64+arm64) e anexar à Seção 8 (ci.yml)
- [ ] [m2][T-022][monorepo] Achado fora do escopo: `pnpm turbo run build --filter='@plataforma/design-system-showcase...'` quebra com **ciclo no grafo** (`@plataforma/protocol ↔ core ↔ testkit#build`); não existia em T-021 (verde); introduzido por merge posterior na master. Workaround atual: `pnpm --filter @plataforma/design-system build` direto (fora do turbo). Se ciclo afeta `pnpm build` da raiz, quebra o CI de build de todos — investigar em task separada (turbo.json / package.json deps)
<!-- END PENDENCIAS -->
