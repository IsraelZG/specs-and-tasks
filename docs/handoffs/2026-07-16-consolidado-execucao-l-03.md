# Consolidado de execução e diagnóstico — L-03 (Worker + Reviewer)

**Data:** 2026-07-16
**Task:** `L-03` — MoR + hard-stop legal
**Fontes:**
- [Relatório do Worker (`gpt-5`)](./2026-07-16-relatorio-execucao-l-03.md) — execução da implementação (~32 min de lead time)
- [Relatório do Reviewer (`claude-opus`)](./2026-07-16-qa-review-execucao-l-03.md) — `/qa-review --integrar` (~2 min 55 s)

## 1. Onde as duas execuções convergem

Ambos os relatórios chegam à **mesma conclusão** por caminhos independentes:

> A implementação da L-03 está **pronta e verde** (build + 241 testes). O que trava a task é um **gate basal vermelho** — 13 erros de `lint` do tipo depreciado `StoragePort`, em 6 arquivos **fora do escopo**, que já existem na master. O tempo/atrito das tasks **não** está na escrita de código; está em preparo de ambiente, gates redundantes, incidentes de estado e dívida basal.

O Reviewer **verificou por git** o que o Worker relatou por execução: `git merge-base master HEAD` = HEAD da master, e nenhum dos 6 arquivos com erro aparece no diff da L-03. Diagnóstico confirmado, não só repetido.

## 2. Contraste de custo — o dado novo do diagnóstico de gargalos

| | Worker (implementação) | Reviewer (parecer de escopo) |
|---|---|---|
| Lead time | ~32 min | ~2 min 55 s |
| Comandos pesados (`pnpm`) | 155,2 s medidos (build/test/lint/push) | **0** — só git |
| Custo de ambiente | worktree 58 s + install 33 s + pré-build P-012 | cache quente, nada pago |
| Pergunta respondida | "implementar + provar verde" | "esse lint é da task ou basal?" |

**Lição:** a pergunta de **escopo** que decide se uma task avança é respondível em segundos por `git diff --name-status <base>..HEAD` + `git merge-base` — sem reexecutar o gate. Reexecutar build/test/lint no review só se justifica para **auditar correção**, não para atribuir culpa por dívida. O gate §2c da skill de review já codifica isso.

## 3. Causas-raiz priorizadas (união dos dois diagnósticos)

| Prio | Causa | Evidência | Efeito recorrente | Origem |
|---|---|---|---|---|
| **P0** | Gate basal de lint vermelho | 13 erros `StoragePort` na master; L-03 não tocou nenhum | Toda task de `core` para no mesmo ponto | Worker + Reviewer |
| **P0** | `wt new` acoplada ao Docs limpo | alterações legítimas em `tasks/*.md` impediram a criação | Bloqueio cruzado entre agentes | Worker |
| **P0** | Gate não prepara o grafo de deps | `crypto → protocol → core` manual (P-012) | Falhas falsas em worktree nova | Worker |
| **P0** | "Limpar" interpretado como descarte | restore/clean destrutivo no Docs compartilhado | Perda de trabalho não commitado | Worker |
| **P1** | Telemetria manual, sem timestamp por chamada | só ~parte dos comandos tem tempo confiável (nos dois relatórios) | Impossível explicar o restante do lead time | Worker + Reviewer |
| **P1** | Writable root incompleto | patch falhou em `C:\Dev2026\.superapp-worktrees\L-03` | Escalação e ferramenta alternativa | Worker |
| **P1** | Spec pouco executável | Seção 3 não lista `workflow-types.ts`; assinaturas inferidas do código | Mais leitura, maior variância entre agentes | Worker + Reviewer (m1) |
| **P1** | Pausa invisível no estado projetado | `[Pausado/Handoff]` mas status segue `in_progress` | WIP/tempo-de-fila distorcidos; review tenta pegar task não pronta | Worker + Reviewer (checagem #2) |
| **P2** | `sqliteStorage.test.ts` concentra 15,2 s | ~46% do tempo de parede da suíte core | Feedback local mais lento | Worker |
| **P2** | Instalação por worktree (33 s) | 57% do custo de criar a worktree | Custo fixo antes de cada task | Worker |

## 4. Sugestões consolidadas (deduplicadas e priorizadas)

### P0 — aplicar primeiro

1. **Task de baseline de lint `StoragePort`.** Migrar os 13 usos para o tipo sucessor, ou baseline versionado que só barre erros novos (com responsável + prazo). **Critério:** `pnpm --filter @plataforma/core lint` = 0 na master, ou o gate prova de forma auditável que a task não aumentou o baseline. *(Desbloqueia a própria L-03 — sem tocar nela.)*
2. **Desacoplar `wt new` do Docs limpo.** Tratar o Docs como controle compartilhado read-only durante a criação da worktree: `fetch`, informar divergência, **nunca** exigir working tree limpo nem sugerir `stash`/`restore`/`clean`. **Critério:** alteração não relacionada em `tasks/*.md` não impede criar worktree, e nenhuma ação destrutiva é oferecida.
3. **Gate canônico por pacote (`pnpm gate @plataforma/core`).** Constrói deps internas em ordem topológica, roda build/test/lint uma vez, para na 1ª falha real identificando a fase, grava tempos + saída literal, e **diferencia falha da task de baseline registrado** (sem tornar o baseline invisível). **Critério:** worktree nova roda 1 comando e não falha por falta de `dist`.
4. **Proibir limpeza destrutiva implícita no Docs.** Preflight no `worktree.mjs`/`/executar-task` que classifica arquivos sujos por proprietário/task; `restore`/`clean`/descarte só após confirmação explícita com lista de paths. **Critério:** a palavra "limpar" sozinha nunca autoriza descarte.

### P1 — observabilidade e previsibilidade

5. **Telemetria JSONL automática por fase** em `worktree.mjs`, `manage-task.mjs` e no gate — um evento por fase com `task, commit-base, máquina/arch, node/pnpm, fase, comando, início, fim, wallMs, exitCode, cache frio/quente, retry`; fases aninhadas marcadas para não dupla-contar. **Critério:** 100% das fases de setup/gate/transição/push têm duração. *(Resolve o limite comum aos dois relatórios: telemetria manual não explica o lead time.)*
6. **Worktrees graváveis pelo worker** — `C:\Dev2026\.superapp-worktrees` como writable root. **Critério:** patch padrão edita a worktree sem escalação.
7. **Endurecer specs com contratos executáveis** — fixar na task assinaturas TS, tipos de retorno, paths de teste, **e todos os exports/arquivos tocados** (a Seção 3 da L-03 omitiu `workflow-types.ts`). **Critério:** o worker escreve o teste a partir da spec sem inferir a API lendo vários arquivos, e o gate §2c não acha arquivo não declarado.
8. **Representar pausa/bloqueio no estado projetado** — subestado `in_progress:paused` (ou campo projetado). **Critério:** dashboard/ledger distinguem ativa × pausada × bloqueada, o relógio de trabalho ativo não corre durante handoff, **e a skill de review não tenta `claim` uma task pausada** (a Verificação Rápida hoje só para porque falta `[Finalizado]`).

### P2 — otimizar depois de medir

9. **Reduzir custo de instalação** — medir worktree fria × quente antes de mudar; avaliar reuso seguro do store/instalação offline com lockfile inalterado, sem compartilhar arquivos mutáveis. **Meta:** preparo quente < 30 s (de 58 s) sem os problemas de hardlink/symlink dos pitfalls.
10. **Perfilar `sqliteStorage.test.ts`** — setup/teardown, criação de banco, serialização. Manter no gate; otimizar fixtures. **Meta:** < 15,2 s sem perder cobertura.

## 5. Plano recomendado

1. Criar e rodar `C-lint-storageport` (baseline de lint de `core`).
2. Alterar `worktree.mjs`: não bloquear por Docs sujo + guard contra descarte (P0-2, P0-4).
3. Implementar `pnpm gate <pkg>` com build topológico + JSONL (P0-3, P1-5).
4. Adicionar writable root das worktrees ao perfil do worker (P1-6).
5. **Destravar a L-03:** com a master verde de lint, Worker re-roda o Gate, cola a saída na §8, chama `finish` → `/qa-review --integrar L-03` roda de ponta a ponta (aí a auditoria de correção do `assertFiscalTransition` acontece).
6. Rodar 3 tasks reais com a telemetria nova; comparar mediana/p95 por fase. Só então otimizar instalação e SQLite.

## 6. Indicadores para acompanhar

Lead time total × tempo ativo (descontando pausas) · tempo por fase (setup/impl/gate/review/rework) · nº e duração de retries por causa · % de tasks bloqueadas por baseline · cache frio × quente · mediana/p95 por pacote/máquina/complexidade · taxa de gate verde na 1ª execução · incidentes de estado sujo/perda de mudanças.

> Uma execução não faz tendência. A L-03 dá um caso diagnóstico + o formato; a conclusão sobre regressão precisa de **≥3 execuções comparáveis** por pacote/ambiente (idealmente ≥5).

---

> **Estado atual da L-03:** `in_progress` (pausada, corretamente). Nenhuma transição foi feita nesta revisão. Os três relatórios (Worker, Reviewer, este consolidado) foram **enfileirados** via `fila.mjs`; commit/push é do `/drenar-fila`.
