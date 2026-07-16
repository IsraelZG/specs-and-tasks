# ADR 0017 — Campanhas encadeadas A→B→C por branch stack (sem novo estado no MGTIA)

- **Status:** aceita (2026-07-14)
- **Autor:** claude-fable (arquiteto), missão de saneamento Core+Bancada
- **Contexto de código verificado:** `apps/nexus-backend/src/services/task.service.ts` +
  `task.types.ts` (TRANSITIONS), `tools/scripts/worktree.mjs`, `tools/scripts/orquestrar.mjs`
  (`max_concurrent: 0`), skills `executar-task`/`qa-review`/`integrar-task`.

## Problema

O MGTIA não suporta executar uma cadeia A→B→C antes do review de A. Verificado no código:
`depsAllDone` só aceita `done`; `start` não valida dependências; worktrees nascem sempre do HEAD
do checkout principal (trunk); `request_changes` não propaga; QA e integração presumem branch
baseada no trunk. Consequências reais já colhidas: T-1045 `done` antes da dependência T-1044;
T-1046 `ready` com ambas as deps abertas; e a única tentativa de encadeamento foi uma "regra
especial da sessão" ad hoc ("tratar deps em `review` como done", citada no log do T-608) — o
anti-padrão que esta ADR proíbe.

## Alternativas comparadas

| Opção | Descrição | Veredito |
|---|---|---|
| A. Review obrigatório entre elos | B só começa após approve+merge de A | Máxima garantia, zero mudança; mata o ganho de vazão da campanha (reviewer vira gargalo síncrono do Fugu). Continua sendo o DEFAULT fora de campanha. |
| B. **Branch stack por campanha** | branch de B nasce do HEAD de A (`wt new B --base task/A`); base sha registrada; QA diffa contra a base; integração topológica | **Escolhida.** Preserva 1 task = 1 branch/commit/gate/review/rework; isolamento intacto; delta pequeno e testado no tooling. |
| C. Umbrella branch única | uma branch, commits por subtask | Perde review/rework POR TASK (o parecer vira monolito), perde retomada idempotente por elo, quebra o contrato do integrar-task. Rejeitada. |
| D. Tratar dep em `review` como done (global) | relaxa `depsAllDone` | Corrompe a semântica para TODO o backlog para servir um caso especial; foi exatamente a "regra especial" ad hoc que já apareceu num log. Rejeitada explicitamente. |

## Decisão

**Opção B + metadado de campanha + revalidação — sem novo estado na máquina.**

1. **Manifesto explícito** (`tasks/_campanha-<id>.md`, prefixo `_` = invisível aos parsers de
   task): ordem topológica, `stack_base_sha`, `review_base_sha`, gates e condições de aborto.
   `stack_base_sha` só muda após rebase explícito sobre um novo head do predecessor;
   `review_base_sha` só nasce após o transplante para trunk. Toda mudança é registrada pelo tooling.
2. **Base explícita:** `node tools/scripts/worktree.mjs new <ID> --base task/<PRED>` (implementado;
   imprime `BASE: <ref> @ <sha>` para registro). Sem `--base`, comportamento clássico (trunk).
3. **QA somente pós-transplante:** o reviewer diffa `git diff <review_base_sha>..task/<ID>`.
   Descendente staged nunca chega a `review` antes de o predecessor estar `done`, de ser
   transplantado para trunk e de passar novamente pelos gates.
4. **Integração topológica obrigatória:** A merge primeiro; B rebase sobre master pós-A, re-gate,
   `finish`, QA e merge; C idem. `integrar-task` bloqueia enquanto N-1 não estiver `done`.
5. **Invalidação seletiva por stack-base (a resposta à pergunta "dependente vai para rework quando
   a dependência entra em rework?"): NÃO.** `rework` significa "o QA rejeitou O TRABALHO DESTA task"
   e alimenta o contrato da Regra 4 (o rework-task corrige achados `[Bn]` de um Parecer que, no
   dependente, não existe). Evidência invalidada por mudança upstream é outra condição:
   **detectada por `stack_base_sha != git rev-parse task/<PRED>`**, tratada com
   **rebase + registro da nova base + re-gate** do elo afetado, sem transição extra. O descendente
   permanece `in_progress`/pausado como staged, portanto não há Parecer a invalidar. A cascata é
   transitiva
   pela cadeia de bases (B stale → rebase de B muda o head de B → C fica stale), nunca global:
   dependentes normais (base = trunk) nunca consumiram o commit rejeitado e ficam ilesos — provado
   no teste automatizado (abaixo).
   - `stale_upstream` como estado novo: rejeitado; `in_progress` + `pause` já representa trabalho
     implementado que ainda não pode ser finalizado.
   - `invalidate_upstream` → `rework`: rejeitado (conflaria métricas e quebraria o contrato
     Parecer→rework da Regra 4).
6. **Fora de campanha nada muda:** `depsAllDone` continua exigindo `done`; nenhum toggle de
   `max_concurrent`; kill-switch do orquestrador intocado (a campanha roda com UM worker serial —
   o Fugu — dentro de uma sessão, não via spawn do orquestrador).
7. **Retomada idempotente:** o estado da campanha é reconstruível de fatos duráveis (status MGTIA
   por elo + shas de branch/base no manifesto + git). Instruções de checkpoint no manifesto.
8. **Circuit breaker:** herda `circuit_breaker.max_review_cycles: 3` do orquestrador.config +
   condições de aborto explícitas por elo no manifesto.

## Teste

`tools/scripts/test-stack-campanha.mjs` cria Docs e superapp descartáveis e invoca os scripts reais
`campanha.mjs` e `worktree.mjs`. Cobre manifesto LF/CRLF, admissão staged somente após predecessor
em review, deps externas, detecção de base stale, re-registro após rebase, bloqueio de finish antes
de `done`, squash do predecessor, transplante, review base e diff final contendo só o delta do elo.

## Consequências

- O primeiro consumidor é a campanha FUGU-01 (`tasks/_campanha-fugu-01.md`).
- `campanha.mjs` é o guard determinístico; as skills apenas descrevem quando chamar cada comando.
  Fora de campanha o lifecycle continua inalterado.

## Tooling implementado (2026-07-13)

- `tools/scripts/campanha.mjs` — validação, admissão staged, registro/check de stack e review bases,
  gate de `finish` e estado da campanha; todos os erros de segurança retornam exit code não zero.
- `tools/scripts/test-stack-campanha.mjs` — teste de integração dos scripts reais em repos
  descartáveis; nenhum assert conceitual ou tautológico.
- `tools/scripts/test-regressao-spec.mjs` — 17 asserts: BOM, §9 duplicada, comentário inline
  em dependencies, transição obsolete.
