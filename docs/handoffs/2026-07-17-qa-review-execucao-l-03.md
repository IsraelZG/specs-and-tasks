# Relatório de execução — QA-review `/qa-review --integrar L-03`

**Data:** 2026-07-17 (sessão 10:28–10:49)
**Task:** `L-03` — MoR + hard-stop legal (complexidade 4)
**Reviewer:** `claude-opus` · **Executor:** `gpt-5` (modelos diferentes ⇒ revisão independente)
**Resultado:** **REFATORAÇÃO NECESSÁRIA** — 1 bloqueante `[B1]`. `request_changes` → `rework`. **Sem merge.**

---

## 1. Resumo executivo

Primeira revisão **substantiva** da série (as anteriores eram fixes de 1 token). A L-03 chegou revisável porque a **C-31 destravou o lint** e o worker rebaseou a branch sobre a master nova (`44dcd1b` sobre `e6758bc`), com gate verde.

A implementação está **substancialmente correta**: os 3 casos da §4 passam, `BlockingError` é lançado sem NF-e, `FiscalTransition` entrou no protocolo. **Mas o entregável é inalcançável:** `assertFiscalTransition` não é exportada por **nenhum** barrel do `core`, enquanto **todos os 5 irmãos do módulo são**. Nada fora do pacote consegue chamar o hard stop — e a decisão da §6 exige exatamente que ele "trave UI e orquestração", que vivem fora do `core`.

**O ponto central do caso:** o **gate ficou verde** (build ✓, 27/241 ✓, lint ✓) **com a API pública quebrada**. Compila porque nada exige o export; passa nos testes porque o teste importa por **caminho profundo** (`../src/workflow/workflow-engine.js`), driblando o barrel — enquanto o teste irmão (`workflow-blocking.test.ts`) importa de `@plataforma/core`. Nenhuma automação pega isso. É o tipo de achado que justifica revisão humana/independente.

Lead time: **~21 min** (inclui gate de ~21 s e auditoria de código).

## 2. Tempos medidos (telemetria de parede)

| # | Etapa | Ferramenta | Fim | Δ parede |
|---|---|---|---:|---:|
| 0 | Checar estado real (status, log §9, branch) — achou `review` | Bash | 10:28:34 | — |
| 1 | `claim` (review → in_review) | manage-task | 10:28:49 | 15 s |
| 2 | Commits próprios da branch + merge-base + escopo + worktree | Bash | ~10:29:40 | ~50 s |
| 3 | Ler `mor-hardstop.ts` (achou wrapper passivo; suspeita inicial) | Read | ~10:30:20 | ~40 s |
| 4 | Ler diff `workflow-engine.ts` + grep enforcement (achou `assertFiscalTransition` real) | Bash | ~10:31:10 | ~50 s |
| 5 | **Grep de callers** → zero em produção | Bash | ~10:31:50 | ~40 s |
| 6 | **Comparar com irmãos** (009-01/009-02 também library-only ⇒ não é regressão) | Bash | ~10:32:40 | ~50 s |
| 7 | Ler os 3 testes (mapeiam a §4; notou import por caminho profundo) | Read | ~10:33:20 | ~40 s |
| 8 | **Verificar barrels** → `assertFiscalTransition` ausente de ambos ⇒ **B1** | Bash | ~10:33:50 | ~30 s |
| 9 | Verificar protocol (`FiscalTransition` É público ⇒ prova de lapso) | Bash | ~10:34:20 | ~30 s |
| 10 | Gate na worktree (build+test+lint) | Bash (bg) | 10:34:45 | ~21 s |
| 11 | Emendar §3 (declarar barrels — lacuna de spec) | Edit | ~10:35:10 | ~25 s |
| 12 | Escrever Parecer §8 (B1 + M1 + m1/m2/INFO) | Edit | ~10:35:50 | ~40 s |
| 13 | `request_changes` → `rework` | manage-task | 10:36:03 | 13 s |
| 14 | Rotear M1 ao `_pendencias.md` + relatório + enfileirar | Edit/Write | 10:49 | ~13 min* |
| | **Total** | | | **~21 min** |

\* a etapa 14 embute uma interrupção (pedido repetido do humano) — não é tempo de trabalho contínuo.

### Limites da medição
- Sem timestamp por chamada: os Δ são diferenças de `date` entre Bash e **embutem o raciocínio**; não separam "pensar" de "executar". Deliberação interna = `not_measured` (a interface não a expõe) — consistente com o que `gpt-5` registrou.
- Gate rodou em worktree **quente** (deps já compiladas): ~21 s vs. os ~155 s que o worker pagou a frio (P-012 + `pnpm install`).

## 3. Achados

### 🔴 [B1] BLOQUEANTE — `assertFiscalTransition` fora de todo barrel
- `core/src/index.ts` exporta os 5 irmãos (`createMoRContext`, `stepRequiresMoR`, `evaluateBlockingRules`, `checkBlockingRules`, `BlockingError`) — **não** `assertFiscalTransition`. `core/src/workflow/index.ts` idem.
- **Prova de lapso (não design):** o **tipo** `FiscalTransition` foi tornado público (`protocol/src/index.ts`), mas a **função** que o consome não. Exportaram o contrato e esconderam a implementação.
- **Por que bloqueia:** §6 exige que a transição sem NF-e "falhe, travando UI e orquestração" — ambas fora do `core`. Sem export = código morto. É o `[gate de wiring]` da §7: *primitiva inalcançável = feature NÃO entregue*. Para trava fiscal legal (NF-e obrigatória no BR), entregar código inalcançável é o pior modo de falha.
- **Correção (≈2 linhas + 1 import):** exportar de `core/src/index.ts` e `core/src/workflow/index.ts`; trocar o import do teste para `@plataforma/core` (prova o caminho público). **§3 emendada** para declarar os barrels ⇒ rework autorizado, não é ampliação de escopo.

### 🟡 Não-bloqueantes (→ `_pendencias.md`)
- **[M1] Wiring: zero callers de produção** — mas **verificado que os irmãos (009-01/009-02, já `done`+mergeadas) têm a mesma forma**. O módulo `workflow` é biblioteca de predicados puros; não há pipeline executável no pacote. Lacuna **arquitetural da família**, não regressão da L-03 → task de integração. Bouncear a L-03 por isso seria incoerente com as deps já aprovadas.
- **[m1]** `evaluateMoRHardStop` é wrapper de passagem: `context`/`transition` não influenciam o bloqueio (correto pelo caso 3 da §4, mas é composição sem acoplamento).
- **[m2]** Teste 2 não asserta payload do `BlockingError`.
- **[i1]** Temp do Vite (`vite.config.ts.timestamp-*.mjs`) suja `git status` — candidato a `.gitignore`.
- **[i2]** Slip de processo: o worker preencheu o bloco *Evidência do Reviewer* (§8) com a própria saída; evidência de worker vai no Handover.

## 4. Evidência do reviewer (worktree L-03 @ `44dcd1b`)
```
$ pnpm --filter @plataforma/core build   → $ tsc  (exit 0)
$ pnpm --filter @plataforma/core test
  Test Files  27 passed (27)
       Tests  241 passed (241)   Duration 3.52s   → exit 0
$ pnpm --filter @plataforma/core lint    → $ eslint src/  (exit 0)
```
Gate verde **confirma o handover** — e é precisamente por isso que o B1 precisou de revisão: nenhum comando o detecta.

## 5. Nota metodológica — escopo sem ambiguidade

Diferente da C-31 (onde o two-dot mentiu), aqui a branch foi **rebased**, então `merge-base == master HEAD` (`e6758bc`) e os três métodos concordam. Ainda assim usei o método robusto: `git log master..task/L-03` = 1 commit (`44dcd1b`) → `git show`. 5 arquivos, coerentes com a §3 (com `workflow-types.ts` declarado retroativamente).

## 6. Estado da série

| Task | Estado | Nota |
|---|---|---|
| C-31 | **done** (`08d2311`) | lint de core verde — destravou a L-03 |
| C-32 | **done** (`e6758bc`) | TS2345 do transport eliminado |
| C-33 | `ready` | build do `bancada` (WASM Automerge) |
| L-03 | **`rework`** | B1: exportar `assertFiscalTransition` dos barrels |

**Próximo passo:** `/rework-task L-03` — corrigir exatamente o B1 (≈2 linhas), re-rodar o Gate, `finish` → volta a `review`. A auditoria de lógica já está feita; a segunda revisão só precisa confirmar o export + o import do teste pelo barrel.
