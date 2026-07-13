# SuperApp V0.41 — Convenções e MGTIA

> **Ambiente:** leia `PITFALLS.md` antes de rodar qualquer comando de build/install.

---

## Wiki

**Estrutura:** `docs/conceitos/<slug>.md` = definição única e canônica. Cadernos (`docs/caderno-{1..4}/`) adicionam ângulos via `[[slug]]` — nunca redefinem.

**Quatro lentes:** vision (por quê/para quem) · protocol (contrato agnóstico de linguagem) · sdk (impl. TS) · governance (política/evolução).

**Regras:**
- Uma definição por conceito. Em qualquer outro lugar: linke com `[[slug]]`, não copie.
- Conteúdo normativo (crypto, invariantes, fórmulas): MOVA o texto original — não parafraseie.
- Git guarda o histórico. Mova, mescle e DELETE livremente. Sem duplicatas "por segurança".
- Um conceito ou caderno por commit. Rode `/verificar` ao terminar cada unidade.

**RFCs:** proposta → absorver com `/absorver-rfc` → deletar `rfc-*.md`. Status em `docs/rfcs/_status.md`. Template em `docs/rfcs/_TEMPLATE.md`.

**Fase 2 concluída** (ondas 1–12). Inventário: `docs/conceitos/_inventario.md` · Plano: `docs/conceitos/_plano-de-ondas.md`.

## Lei de Aprendizado

Após cada problema não trivial resolvido, execute a habilidade `extract-approach` antes de
prosseguir. Uma solução sem sua nota de aprendizados — ou sem a confirmação explícita de que o
aprendizado já vive no artefato canônico — é trabalho inacabado.

---

## MGTIA — Gestão de Tarefas

> **NEXUS CONGELADO (2026-06-17):** `apps/nexus-backend` e `apps/nexus-frontend` são a *ferramenta* MGTIA, não o produto, e estão congelados — fora do `build`/`dev`/`lint` da raiz (ver `package.json`). Workers e reviewers NÃO rodam build/test/lint do nexus; rodam só o `pnpm --filter <pacote da task>` da própria task. Continua buildável sob demanda (`pnpm --filter nexus-backend build`); o `manage-task.mjs` usa o `dist/` já compilado, então o MGTIA segue funcionando.
>
> **⛔ NÃO citar arquivos do nexus como "fonte canônica" para specs de outras tasks (2026-07-06).**
> `apps/nexus-backend` pode nem existir na worktree corrente (congelado ≠ garantido presente) e é o
> sistema que o Estaleiro/`plugin-tasks` (RFC-018 B1) está **substituindo**, não espelhando ao pé da
> letra. Comportamento de MGTIA (sub-status, verbos, transições) tem como fonte viva **este
> CLAUDE.md + o comportamento real do `manage-task.mjs`** — não um arquivo `.ts` do nexus que pode
> estar ausente/desatualizado na sua worktree. Se uma spec depende de "bater com o comportamento
> canônico do MGTIA" e a fonte não resolve no estado atual, é decisão de arquiteto (Seção 6 da
> task), não suposição do endurecedor. (Achado real: EST-03b R1 citou `task.types.ts` do nexus como
> canônico — arquivo inexistente na worktree do superapp.)

Tasks em `/tasks/` (implementação) e `/meta-tasks/` (gestão). Dashboard: `tasks/INDEX.md` — use-o, não inspecione arquivos individuais.

A fonte canônica de gestão de tarefas é o Nexus (tool MCP nexus_transition_task ou
POST /api/tasks/:id/transition). A CLI node tools/scripts/manage-task.mjs <action>   <taskId> <SeuNome> [mensagem] é um atalho legado que delega ao mesmo serviço — use-a
quando o backend não estiver no ar. NUNCA edite status, INDEX.md ou Log manualmente no Markdown,
**mesmo se o comando falhar ou o ambiente estiver quebrado** (build travado, EACCES, file lock).
Falha de ambiente durante uma transição é ela mesma um BLOCKER — registre como tal (`pause` ou
`request_changes`), nunca contorne escrevendo o arquivo na mão.
Ações: triage, harden, decide, block_decision, decompose, promote, start, pause, finish, claim, approve, request_changes, block, unblock.
Ciclo: draft:placeholder → draft:triaged → draft:hardened → ready → in_progress → review → in_review → rework → done (+ blocked).

> **Identidade do agente (`<SeuNome>`/`<EU>`) — INVIOLÁVEL.** O Log §9 e o `ledger.mjs` só têm valor
> se `<SeuNome>` for o **modelo real** que está rodando — não o harness, não o papel. Regras:
> - **SIM:** o identificador do modelo subjacente — `deepseek`, `gemini`, `claude-opus`, `minimax`, `claude-sonnet` etc.
> - **NÃO o harness/ferramenta** que hospeda o modelo — `Crush`, `Antigravity`, `opencode` não são
>   identidade de modelo, são o TUI/orquestrador. Se você roda via Crush (que roteia por Headroom),
>   passe o modelo que o Headroom de fato serviu, não "Crush".
> - **NÃO o papel/perfil** da task — `agile_reviewer`, `devops_agent`, `logic_agent`, `spec_hardener`,
>   `arquiteto` são `target_agent`/`reviewer_agent` (rótulos de função no frontmatter), não identidade.
> - **Exceção (gate do serviço):** `approve`/`request_changes` exigem que o ator comece com o **papel**
>   exigido por `reviewer_agent` (default `agile_reviewer`) — é o que impede auto-aprovação. Para
>   registrar o modelo revisor mesmo assim, use o formato **`agile_reviewer:<modelo>`** (ex.:
>   `agile_reviewer:gemini`) — o serviço autoriza pelo prefixo antes de `:`, o ledger exibe só o modelo.
Cada task iniciada ganha uma branch task/<ID> (isolamento) **no repo superapp (código).** No repo Docs (controle), tarefas são editadas diretamente na `master` — o histórico de gestão (status, pareceres, logs) precisa ser visível a todos sem depender de merge.

> **Paralelismo no controle (INVIOLÁVEL).** O Docs é um working tree único na `master` com vários agentes ao mesmo tempo. **Agentes NÃO rodam git no Docs** — nem `commit`, nem `push`, nem `add`. Isso tirava tempo (sobretudo do QA) com `index.lock`, disputa de push e "filtrar o que é meu". Em vez disso:
> - **Edite só o markdown da sua task** (`tasks/T-XXX.md`, `tasks/_pendencias.md`, etc.) e **ENFILEIRE** a intenção de commit: `node tools/scripts/fila.mjs add <ID> "<msg>" [paths extra]`. Pronto — você não toca git. O default de path é `tasks/<ID>.md`; passe paths extra se editou outros arquivos.
> - **Um único consumidor serial** (`/drenar-fila` → `fila.mjs flush`) faz TODOS os commits pendentes (atômicos por path) + um push, periodicamente. Um só committer ⇒ zero corrida de index/push.
> - **NUNCA** `git commit`/`git push`/`git add` no Docs a partir de uma skill de worker/reviewer/arquiteto. Se precisar persistir, **enfileire**.
> - **`tasks/INDEX.md`** (e `meta-tasks/INDEX.md`) e **`tasks/.commit-queue/`** são **gitignored** — o `TaskService` regenera o INDEX a cada transição; a fila é transiente. Nunca commite.
> - **No superapp (código) o git continua igual:** cada task tem branch `task/<ID>` isolada (worktree), o worker commita+pusha lá normalmente. A fila é **só do controle**.

### As 6 Regras

**1. SDD — Spec é a fonte absoluta.** Leia o bloco "Contexto RAG" da task antes de codar. Se a spec estiver ambígua ou impossível → `pause` com o bloqueio descrito.

**2. Estado e Handoff.** `start` ao iniciar. `pause` com resumo claro se travar ou estourar tokens — o próximo agente depende disso para assumir. **Se a task tem worktree/branch no superapp** (todas exceto tooling-do-controle, ver `integrar-task` Caminho A-tooling), **`finish` exige a worktree commitada e limpa** (`git status --short` vazio na branch `task/<ID>`) — o `TaskService.transition()` só enxerga o texto da Seção 8, nunca o estado git do repo de código, então "gate passou" sem commit real passa despercebido até o `integrar-task` tentar mergear e achar nada para integrar. Já aconteceu 2x em sequência (EST-34 rodada 1, EST-33 rodada 1) — ver `PITFALLS.md` e a task de guard correspondente.

**3. Gate de Evidência (INVIOLÁVEL).** `finish` só com a saída literal de `pnpm --filter <pkg> build` + `test` + `lint` colada na mensagem. Sem evidência = não terminou. Se falhar, conserte antes — nunca finalize no escuro. (Lint entrou no gate em 2026-07-06 após 3 reworks consecutivos por regressão de lint cobrada só no review — T-807, EST-02b, EST-02c; o critério cobrado precisa ser o critério escrito.)

**4. Rework (auto-contido).** Task em `rework`? Leia o "Parecer do Revisor" (seção 8) e corrija EXATAMENTE os achados `[Bn/Mn/mn]`. Re-rode build+test, aplique o Gate, chame `finish`. O ciclo worker→review→rework roda sem intervenção humana.

**5. Automação.** Tarefas repetitivas viram scripts, subagents (`.claude/agents/`) ou skills (`.claude/skills/`). Idempotência obrigatória.

**6. Separação de papéis nas transições (INVIOLÁVEL).** `approve`/`request_changes` são exclusivos
do Reviewer (`frontmatter.reviewer_agent` da própria task). Worker NUNCA chama essas duas ações —
nem para "destravar" uma task que ficou presa em `review` por uma rodada anterior incompleta. Se
`finish` falhar porque a task já está em `review`/`done`, o Worker PARA e usa `pause` para
registrar o que encontrou; não tenta o próximo verbo só porque o serviço aceitaria. (Ver
`tasks/T-1025.md` — esta regra está sendo reforçada no `TaskService`, não só em prosa.)

### Papéis

- **Architect:** cria tasks via `node tools/scripts/generate-task.mjs`.
- **Worker:** executa tasks ≤ Sonnet seguindo SDD + Gate de Evidência. Nunca chama `approve`/`request_changes`.
- **Reviewer:** audita tasks em `review` via `/qa-review <ID>`. **Primeiro passo é `claim`** (`review → in_review`, trava a task contra revisão duplicada). Se a task já está `in_review` → PARE (outro reviewer a pegou). Só escreve no Markdown a Seção 8
  (Parecer); o status/log/INDEX só mudam via `approve`/`request_changes` do serviço.

### Dimensionamento (INVIOLÁVEL)

Tasks ≤ Sonnet (preferencialmente Haiku). A spec precisa ter: zero decisões abertas, assinaturas e tipos explícitos, APIs fixadas, verificação por comando. O que exige Opus → **spike** (entregável = ADR/PoC com critério claro) ou **épico** subdividido. Inclua `Capacidade-alvo: haiku | sonnet | opus-spike` no corpo da task.

**Eixo de qualidade da spec.** O antigo campo `spec_status` foi colapsado nos sub-status de `draft:<sub>` — `draft:placeholder | draft:triaged | draft:pending_decision | draft:hardened | draft:decomposed`. Cada sub-status é transicionado pelos **verbos de endurecimento** (`triage`/`harden`/`block_decision`/`decompose`/`decide` via `manage-task.mjs`), não mais editando frontmatter à mão. **Endureça em dois passes:** triagem cedo (pega spikes/decisões), endurecimento profundo just-in-time (quando as deps já são `done`, troca placeholder por assinatura real — *reendurecimento*).

**Automatismos (T-1029):** `harden`/`decide` com deps todas `done` → auto-promove para `ready`; `approve → done` → auto-promove dependentes elegíveis e encerra pais decompostos quando a última filha fecha. Painel: `node tools/scripts/hardening.mjs [prefixo]` (estado dos draft:<sub> · fila de decisões · promovíveis safety-net · candidatas a reendurecer).

**Ledger de ciclo de vida.** `node tools/scripts/ledger.mjs [prefixo]` regenera `tasks/LEDGER.md` (gitignored): tabela agrupada por status com **quem fez cada papel** — worker, reviewer, cada rework (`N× (ator → ator)`), endurecedor. **Não é fonte nova nem passo a mais pro agente:** é uma *projeção* dos Logs §9 que o `manage-task.mjs` já escreve a cada transição (o ator é o `<SeuNome>` passado). Reworks variáveis não viram colunas fixas — viram uma célula. `/drenar-fila` o refresca no heartbeat periódico.

---

## Skills e Agentes

**Skills:** `/verificar` · `/qa-review` · `/integrar-task` · `/agrupar-cleanup` · `/endurecer-task` · `/endurecer-fila` · `/wargame-task` · `/arquiteto-decisoes` · `/arquiteto-promover` · `/drenar-fila` · `/vincular-rag` · `/executar-task` · `/rework-task` · `/absorver-rfc` · `/rodar-onda` · `/consolidar-arquivo` · `/consolidar-glossario` · `/handoff` · `/migrar-caderno` · `/novo-verbete` · `/revisar-rfc` · `/revisar-rfcs` · `/sync-provider`

> **Pipeline de uma task:** `/endurecer-task` (→ `draft:triaged`/`draft:hardened`/`draft:pending_decision`) · `/arquiteto-decisoes` (resolve decisões, chama `decide`) · `/arquiteto-promover` (safety-net: promove `draft:hardened` não pego pelo auto-promote) · `/wargame-task` (OPCIONAL, exige modelo forte: grava o Plano de Batalha §5b na task — rota movimento-a-movimento com observações esperadas, falhas+contra-movimentos, forks com gatilho, aborts — p/ worker menor executar cego; pós-ready, pré-execução) · `/executar-task` (worker, na worktree, commits frequentes; **se a task tem §5b, siga o plano à risca** — os forks/contra-movimentos já foram lutados por um modelo maior) · `/qa-review` (Parecer, review-only, começa com `claim`) · `/integrar-task` (merge+`approve`, ou `request_changes`→`rework`; auto-side-effects T-1029 disparam no approve) · `/rework-task` (corrige os achados do Parecer, volta a `review`) · `/agrupar-cleanup` (drena o ledger de pendências). Painel transversal: `node tools/scripts/hardening.mjs`. **Persistência no controle:** cada skill **enfileira** o commit (`fila.mjs add`); `/drenar-fila` commita+pusha em lote (nenhum agente roda git no Docs).

**Agentes** (`.claude/agents/`): `agile-reviewer` · `auditor-consistencia-rfc` · `consolidador` · `criador-verbete` · `emendador-rfc` · `incorporador` · `rfc-roteador` · `triador-review`

---

## Ferramentas LSP/MCP (Crush)

> Crush disponibiliza LSPs e MCPs que os agentes devem usar ativamente. Catálogo completo e
> boas práticas em [`docs/playbook/06-ferramentas-lsp-mcp.md`](./docs/playbook/06-ferramentas-lsp-mcp.md).
