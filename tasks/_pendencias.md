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
- [ ] [m1][T-313c][core] `src/index.ts` (top-level) re-exporta `putBlindArchive`/`getBlindArchive`/`listBlindArchivesByScope`/`garbageCollectArchives`/`BlindArchiveRow` — NÃO declarado em §3 (Escopo); padrão recorrente (T-302a/T-313a/T-313b já têm achado equivalente no ledger). Aceitável como workaround para consumo externo, mas influi no template de escopo da spec (blindArchives.ts:1-112 re-exportado em src/index.ts:101-105)
- [ ] [m2][T-313c][core] DDL `MIGRATION_BLIND_ARCHIVES_SQL` não cria índices em `expires_at` nem em `blind_scope_id` — `garbageCollectArchives` faz `SELECT COUNT`+`DELETE` com `WHERE expires_at <= ?` (full table scan O(n)); `listBlindArchivesByScope` faz `SELECT * WHERE blind_scope_id = ? ORDER BY created_at DESC LIMIT ?` (full scan + sort O(n log n)). Adicionar `CREATE INDEX idx_blind_archives_expires_at` e `CREATE INDEX idx_blind_archives_scope_created` (blindArchives.ts:16-25)
- [ ] [i1][T-313c][core] `now?` adicionado a `putBlindArchive`/`getBlindArchive`/`listBlindArchivesByScope` — extensão de contrato além de §1; spec §1 precisa re-endurecimento para refletir a forma final (resolveu M1 do R1, mas é extensão de API não-declarada) (blindArchives.ts:42, 64, 82)
- [ ] [i2][T-313c][core] `rowToBlindArchive` faz `new Uint8Array(row['archive_id'] as ArrayBuffer)` — better-sqlite3 retorna `Buffer` (subclasse de `Uint8Array`), não `ArrayBuffer` puro; cast funciona porque `Buffer` é arrayLike, mas fragilmente tipado (funciona melhor com `Uint8Array.from(bufferLike)` ou `Buffer.from(bufferLike)`) (blindArchives.ts:29-32)
- [ ] [i3][T-313c][core] `getBlindArchive`/`listBlindArchivesByScope` sem `now` NUNCA filtra — mesmo com `includeExpired=false` (default); caller que não injeta `now` recebe linhas expiradas silenciosamente; documentar no JSDoc ou forçar `now` quando filtragem estrita é necessária (blindArchives.ts:60-90)
- [ ] [i4][T-313c][core] `listBlindArchivesByScope` não tem parâmetro `includeExpired` explícito (assimetria com `getBlindArchive`); API fica mais consistente com `includeExpired: boolean` explícito em ambas (blindArchives.ts:78-90)
- [ ] [i5][T-313c][core/spec] spec §1 inconsistência interna entre prosa (linha 35: lista 4 colunas) e interface `BlindArchiveRow` (linhas 50-63: 6 campos) — fonte-raiz das divergências M1/M2; harmonizar prosa+interface no re-endurecimento (spec T-313c.md:35 vs :50-63)
- [ ] [i6][T-313c][core] `putBlindArchive` ignora `cargo.manifest.expiresAt` se caller passa `expiresAt` como argumento separado; `manifest` MessagePack preserva um valor, coluna `expires_at` grava outro — inconsistência em auditoria externa; documentar no JSDoc, OU validar no impl, OU eliminar `cargo.manifest.expiresAt` (blindArchives.ts:38-58)
- [ ] [i7][T-313c][core] `ORDER BY created_at DESC` em `listBlindArchivesByScope` (linha 85) tem resolução de 1 segundo (default `unixepoch()`) — múltiplos archives no mesmo segundo tornam ORDER BY não-determinístico; documentar como limitação ou resolver junto com M2 (criar índice composto `(blind_scope_id, created_at DESC)` se M2 for caminho semântico ms) (blindArchives.ts:85)
- [ ] [i8][T-313c][core/tests] Gap de cobertura do test suite mascara M1: 4 testes da spec §4 usam `expiresAt=9999999999999` ou `now-1000`/`now+10000` (pulando boundary `== now`); rework pode passar Gate verde sem atacar M1; adicionar 2 testes de boundary: (a) `GC boundary: expires_at == now is kept per spec §1` (espera `removed=0`); (b) `listByScope boundary: expires_at == now is treated as expired` (espera `count=0` com `now=now`) (blindArchives.test.ts:96-190)
- [ ] [i9][T-313c][core/process] Lifecycle hygiene de probe files: múltiplos reviewers paralelos (R9–R15) podem criar/remover arquivos `*.probe.test.ts` com colisões; adicionar `*.probe.test.ts` ao `.gitignore` do pacote `core` (defesa em profundidade)
<!-- END PENDENCIAS -->
