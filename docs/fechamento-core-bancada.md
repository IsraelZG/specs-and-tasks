# Fechamento Core + Bancada — matriz de capacidades e classificação M3–M9

> Gerado 2026-07-14 (claude-fable, missão de saneamento). "Concluído" aqui = **capacidade
> demonstrável no código da master do superapp**, não contagem de tasks. Evidências citam
> arquivo/linha reais verificados nesta data. Atualize ao fechar cada gate.

## 1. Matriz de capacidades

| # | Capacidade | Evidência no código (master) | Task proprietária | Estado verdadeiro | Lacuna | Gate de fechamento |
|---|---|---|---|---|---|---|
| 1 | Storage abstrato + impls reais | `GraphStorePort` fixado (T-1041); adapter SQLite migrado (T-1042); `core/src/projection.ts` (T-1045) | T-1043 (in_progress), T-1044 (blocked→T-1043) | **EM ANDAMENTO** | 8 sítios SQL diretos no core ainda em migração; prova KV pendente; projeções provadas só em SQLite | T-1044 §4 verde (inclui caso de paridade de projeções adicionado 2026-07-14) |
| 2 | RBSR transfere e aplica SignedNode real | **NEGATIVA:** `protocol/src/rbsr/exchange.ts:62-75` — `encodeNodesResponse` envia só `{id, fingerprint}`; `applyNodes` (core) desligado do exchange | **T-1046** (campanha FUGU-01 elo 2) | **NÃO EXISTE** — convergência atual é de fingerprints, não de dados | transferência + aplicação sob UCAN | casos §4 de T-1046 + convergência real 2 peers |
| 3 | Transporte e reconciliação fechados | Noise_XX (T-202), WS (T-204), WebRTC (T-402), signaling (T-401), descoberta morna (T-406), FPP (T-208), SwarmRegistry (T-205) — todos na master | T-404b (ready), T-405 (ready), T-409 (in_progress pausada) | **NÚCLEO REAL; BORDAS ABERTAS** | CPE query-side, relay de circuito, aba topologia | gates das 3 tasks + marco demo M4 (sync com cloud desligada) |
| 4 | Auth/UCAN/KeyVault reais | `core/src/auth/ucan.ts` (T-501), KeyVault+requestEpochKey (T-110/T-1036), `canAccess`/`scopeRBSRTree` (`core/src/auth/ucanScope.ts`) | **T-1032** (campanha elo 1), T-1039 (elo 3); M5: T-502/504/505a/505b/506/507/508/509/510/511 (ready, não iniciadas) | **PRIMITIVAS REAIS, ENFORCEMENT AUSENTE** — responder RBSR serve qualquer peer; `canServeArchive` é magic-string | wiring dos checks no caminho real; épocas/revogação/recuperação inteiras | T-1032+T-1039 verdes; depois cadeia M5 (T-505a→T-505b→T-506; T-508→T-509) |
| 5 | Consistência/Automerge/Zen reais | Fork/merge estrutural na master (T-601); Automerge: NADA no código (specs recon'das 4079d04) | T-403 (ready), T-602 (hardened), T-603 (**pending_decision**), T-609 (ready, sucessor de T-604) | **SÓ FORKS; AUTOMERGE E ZEN NO PAPEL** | doc casca, ciclo de commit, committer, invariante T1 | T-609 (campanha elo 4 opcional); cadeia T-403→T-602 após decidir T-603 |
| 6 | Private swarm e media plane reais | Canal private swarm (T-702) na master; `core/src/deviceState/schema.ts` (T-701a); chunking+manifesto+WebSeed (T-801/802/804) na master | T-707 (ready, canônica — T-701/T-701b obsoletadas), T-705 (ready), T-803 (ready), T-805/T-806 (draft) | **METADE REAL** | repo tipado device_state; pareamento QR+SAS; WebTorrent; reidratação/G4 | gates de T-707/T-705/T-803; T-805/806 após endurecer |
| 7 | Bancada no composition root verdadeiro | **NEGATIVA:** `apps/bancada/src/App.tsx:41-68` — mídia placeholder, UCAN mock, `useSyncStatus` stub declarado, Cenários "Em Construção" | **T-BW-01…T-BW-06** (criadas 2026-07-14, triaged) | **SHELL REAL, FLUXOS MOCKADOS** | todo o wiring | T-BW-06 (E2E 2 peers sem mocks, com asserção anti-mock no bundle) |
| 8 | Suíte adversarial, caos, telemetria, doc de fechamento | vetores dispersos por task; nada consolidado | T-902 (triaged; deps remapeadas p/ T-609), T-904 (triaged), T-903 (ready), T-905 (ready) | **ABERTO** (era falso-bloqueado por T-604 obsoleta) | consolidação + caos + benchmarks | `pnpm test:adversarial` bloqueante no CI |
| 9 | Grafo de tasks íntegro (sem dep morta/assimétrica) | scan 2026-07-14: zero DEP-INEXISTENTE; DEP-OBSOLETA zeradas pós-remap; pais decompostos corrigidos | — (contínuo) | **SANEADO HOJE** | 5 casos `ready`-com-dep-aberta documentados (cadeias pré-promovidas: T-009b, T-1046, T-505b, T-506, T-509) | scan de integridade re-rodado verde |
| 10 | M3–M9 classificados linha a linha | tabela §2 abaixo | — | **FEITO** | — | — |

## 2. Classificação M3–M9 (linha a linha do plano)

Legenda: ✅ done real · 🔧 executável (ready/hardened) · 🔁 substituída · ⏸️ deliberadamente adiada
(justificativa) · 🚧 em andamento.

- **M3:** T-301✅ T-302✅(302a/b) T-303✅ T-304✅ T-305✅*(*primitivas; enforcement real = T-1032🔧)*
  T-306✅ T-307✅ T-308✅ T-309🔧 T-310✅ T-311✅*(UI; dados reais = T-BW-02)* T-312✅ T-313✅(fechada
  2026-07-14; filhas done) · complementos: T-1032🔧 T-1046🔧 (campanha FUGU-01).
- **M4:** T-401✅ T-402✅ T-403🔧 T-404🚧(404a✅, 404b🔧) T-405🔧 T-406✅ T-407✅ T-408✅
  T-409🚧(pausada).
- **M5:** T-501✅ T-502🔧 T-503⏸️(demovida 2026-07-13 pelo humano — reendurecer junto da cadeia
  consentimento) T-504🔧 T-505🚧(decomposta; 505a/505b🔧) T-506🔧 T-507🔧 T-508🔧 T-509🔧 T-510🔧
  T-511🔧 T-512✅*(UI; UCAN real = T-BW-03)*.
- **M6:** T-601✅ T-602🔧(hardened) T-603⏸️(**decisão aberta — humano**) T-604🔁→**T-609**🔧
  T-605/T-606⏸️(triaged; remapeadas p/ T-609; reendurecer pós-T-609) T-607🔧 T-608🔁(decomposta:
  608a🔧 ready, 608b⏸️ aguarda T-605).
- **M7:** T-701🔁→T-707 · T-701a✅ · T-701b🔁(LinkCipher redundante com Noise — encerrada) ·
  T-702✅ T-703⏸️(triaged; depende de T-403) T-704🔧 T-705🔧 T-706🔧 T-707🔧(canônica).
- **M8:** T-801✅ T-802✅ T-803🔧 T-804✅ T-805⏸️(triaged; deps T-801✅+T-804✅ — candidata a
  endurecer) T-806⏸️(triaged) T-807✅*(UI; plane real = T-BW-04)*.
- **M9:** T-901⏸️(produto — fora do escopo Core+Bancada por definição da missão) T-902⏸️→🔧 após
  T-609 T-903🔧 T-904⏸️→🔧 após T-609 T-905🔧.
- **Fora do plano, essencial ao fechamento:** T-1033✅(aprovada 2026-07-14) · T-1041✅ T-1042✅
  T-1043🚧 T-1044⏸️(blocked→T-1043) T-1045✅ · T-BW-01…06⏸️(triaged; BW-01 endurecível já — deps
  done) · **pacote `workers/` vazio: adiado deliberadamente** — a hospedagem SQLite/Comlink em
  Worker não tem task dona no plano; decisão humana pendente (registrada no relatório da missão).

## 3. Caminho crítico até "Core + Bancada concluídos"

1. **Campanha FUGU-01** (T-1032→T-1046→T-1039[+T-609]) — fecha caps 2 e 4-enforcement.
2. T-1043 → T-1044 (com paridade de projeções) — fecha cap 1.
3. T-BW-01 (endurecer: deps já done) → T-BW-03/05 em paralelo → T-BW-02 (pós-FUGU) → T-BW-04
   (pós-T-803) — fecha cap 7.
4. Decisão humana T-603 → cadeia Automerge T-403→T-602→T-603 (2ª campanha candidata) — fecha cap 5
   com T-609.
5. T-707+T-705 (private swarm) e T-803→T-805/806 (media) — fecha cap 6.
6. T-902/T-904 (reendurecer pós-T-609) + T-903 + T-905 — fecha cap 8 e o ciclo.
